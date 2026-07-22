import { tool } from "ai";
import { z } from "zod";
import { resolve, relative } from "path";

const MAX_RESULT = 20_000;
const DEFAULT_TIMEOUT = 30_000;

export function createGlobTool(cwd: string) {
    return tool({
        description:
            "Exectue a shell command in the porject directory, Use this for running tests, builds, git operations, package installs, and any other shell commands.",
        inputSchema: z.object({
            patten: z.string().describe("Glob patten to match (e.g. '**/*.ts', 'src/**/*.tsx)"),
            path: z.string().describe("Relative directory to search in (defaults to project root)").default("."),
        }),
        execute: async ({ patten, path }) => {

            const resolved = resolve(cwd, path);

            if (!resolved.startsWith(cwd)) {
                return { error: "Path is outside the project directory" };
            }

            try {
                const glob = new Bun.Glob(patten);
                const files: string[] = [];
                let truncated = false;

                for await (const match of glob.scan({
                    cwd: resolved,
                    dot: false,
                    onlyFiles: true,
                })) {
                    if (match.includes("node_modules")) continue;

                    if (files.length >= MAX_RESULT) {
                        truncated = true;
                        break;
                    }

                    const absoluteMatch = resolve(resolved, match);
                    files.push(relative(cwd, absoluteMatch));
                }
                files.sort();

                return {
                    files,
                    ...(truncated ? { truncated: true }: {}),
                };
                
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return { error: `Failed to executed command: ${message}` };
            }
        },
    });
}