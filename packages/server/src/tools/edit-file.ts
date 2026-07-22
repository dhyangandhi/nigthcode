import { tool } from "ai";
import { z } from "zod";
import { resolve, relative } from "path";
import { readFile, writeFile } from "fs/promises";

const MAX_OUTPUT = 20_000;
const DEFAULT_TIMEOUT = 30_000;

export function createEditFileTool(cwd: string) {
    return tool({
        description:
            "Make a target editto a file by replacing an exact string match. The oldeString must appear exactily once in the file (for safety).Use this for surgical edits instead of rewriting entire file",
            inputSchema: z.object({
                path: z.string().describe("Relative path to the file to edit"),
                oldSrtring: z.string().describe("The exact text to find and replace (must be unique in the file)"),
            newString: z.string().describe("The text to replace it with"),
            }),
        execute: async ({ path, oldSrtring, newString }) => {
            const resolved = resolve(cwd, path);

            if (!resolved.startsWith(cwd)) {
                return { error: "Path is outside the project directory" };
            }

            try {
                const content = await readFile(resolved, "utf-8")
                const occurrences = content.split(oldSrtring).length - 1;

                if (occurrences === 0) {
                    return { error: "oldString not found in file" };
                }

                if (occurrences > 1) {
                    return {
                    error: `oldString is ambiguous - found ${occurrences} matches. Provder more surrounding context to make it uique.`,
                    };
                }

                const updated = content.replace(oldSrtring, newString);

                await writeFile(resolved, updated, "utf-8");

                return {
                    success: true as const,
                    path: relative(cwd, resolved),
                };
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return { error: `Failed ot edit file: ${message}` };
            }
        } 
    });
}