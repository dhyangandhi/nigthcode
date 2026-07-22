import { tool } from "ai";
import { z } from "zod";
import { resolve, relative } from "path";

const MAX_MATCHES = 50;

export function createGrepTool(cwd: string) {
    return tool({
        description:
            "Search for patterns in files using grep.",
        inputSchema: z.object({
            patten: z
                .string()
                .describe("Regex pattern to search for"),
            path: z
                .string()
                .describe("Relative directory to search in (defaults to project root)")
                .default("."),
            includes: z
                .string()
                .describe("Glob pattern to filter files (e.g. '*.ts', '*.tsx')")
                .optional(),
        }),
        execute: async ({ patten, path, includes }) => {

            const resolved = resolve(cwd, path);

            if (!resolved.startsWith(cwd)) {
                return { error: "Path is outside the project directory" };
            }

            try {
                const args = [
                    "-rn",
                    "--color=never",
                    "--exclude-dir=node_modules",
                    "--exclude-dir=.git",
                    "-E",
                ];

                if (includes) {
                    args.push(`--include=${includes}`);
                }

                args.push(patten, resolved);
                
                const proc = Bun.spawn(["grep", ...args], {
                    stdout: "pipe",
                    stderr: "pipe",
                    cwd,
                });

                const stdout = await new Response(proc.stdout).text();
                const stderr = await new Response(proc.stderr).text();

                await proc.exited;

                if (proc.exitCode !== 0 && proc.exitCode !== 1) {
                    return { error: `grep failed: ${stderr.trim()}` };
                }

                if (!stdout.trim()) {
                    return { matches: [], message: "No matches found" };
                }

                const lines = stdout.trim().split("\n");
                const matches: { file: string; line: number; content: string }[] = [];
                let truncated = false;

                for (const line of lines) {
                    if (matches.length >= MAX_MATCHES) {
                        truncated = true;
                        break;
                    }
                    
                    const match = line.match(/^(.+?):(\d+):(.*)$/);
                    if (match) {
                        matches.push({ 
                            file: relative(cwd, match[1]!),
                            line: parseInt(match[2]!, 10),
                            content: match[3]!,
                        });
                    }
                }

                return {
                    matches,
                    ...(truncated ? { truncated: true } : {}),
                };

            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return { error: `Failed to execute command: ${message}` };
            }
        },
    });
}