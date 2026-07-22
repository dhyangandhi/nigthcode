import type { Mode } from "@nightcode/database";
import { createEditFileTool } from "./edit-file";
import { createReadFileTool } from "./read-file";
import { createWriteFileTool } from "./write-file";
import { createGrepTool } from "./grep";
import { createGlobTool } from "./glob";
import { createBashTool } from "./bash";

export function createTool(cwd: string, mode: Mode) {
    const readOnlyTools = {
        readFile: createReadFileTool(cwd),
        grep: createGrepTool(cwd),
        glob: createGlobTool(cwd),
    };

    if (mode === "PLAIN") {
        return readOnlyTools;
    }

    return {
        ...readOnlyTools,
        writeFile: createWriteFileTool(cwd),
        editFile: createEditFileTool(cwd),
        bash: createBashTool(cwd),
    };
}