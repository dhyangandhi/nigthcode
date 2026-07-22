import { tool } from "ai";
import { TIMEOUT } from "dns";
import { z } from "zod";

const MAX_OUTPUT = 20_000;
const DEFAULT_TIMEOUT = 30_000;

export function createBashTool(cwd: string) {
    return tool({
        description:
            "Exectue a shell command in the porject directory, Use this for running tests, builds, git operations, package installs, and any other shell commands.",
        inputSchema: z.object({
            command: z.string().describe("The shell command to execute"),
            timeout: z.number().describe("Timeout in milliseconds (default: 3000)").default(DEFAULT_TIMEOUT)
        }),
        execute: async ({ command, timeout }) => {
            try {
                const proc = Bun.spawn(["bash", "-c", command], {
                    cwd,
                    stdout: "pipe",
                    stderr: "pipe",
                    env: { ...process.env, TERM: "dumb" },
                });
                
                const timer = setTimeout(() => {
                    proc.kill();
                }, timeout);

                const [stdout, stderr] = await Promise.all([
                    new Response(proc.stdout).text(),
                    new Response(proc.stderr).text(),
                ]);

                const exitcode = await proc.exited;
                clearTimeout(timer);

                const truncate = (s: string) => 
                    s.length > MAX_OUTPUT
                        ? s.slice(0, MAX_OUTPUT) + `\n.., (truncated, ${s.length} total chars)`
                        : s;
                return {
                    stdout: truncate(stdout),
                    stderr: truncate(stderr),
                    exitcode,
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return { error: `Failed to executed command: ${message}` };
            }
        },
    });
}