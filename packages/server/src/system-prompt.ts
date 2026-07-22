import { Mode } from "@nightcode/database/enums";

type SystemPromptParams = {
    cwd: string | null;
    mode: Mode;
};

export function buildSystemPrompt({ cwd, mode }: SystemPromptParams): string {
    const parts: string[] = [];

    parts.push(`You are an expert software engineer working as a coding assistant inside a terminal application.
        The application has two modes the user can switch between:
        - **PLAN** - Read-only analysis and planning. Nod file modifictions.    
        - **BUILD** - Full implementation with read and write tools.
    `);

    if (cwd) {
        parts.push(`\nThe user's project directory is: ${cwd}`);
    }

    if (mode === Mode.PLAIN) {
        parts.push(`
            ## Mode: PLAN
            You are in planning mode. Your job is to analyxe, research, and propose solution -
            but NOT make changes.
            - Use your available tools ot explore the codebase
            - Present your analysis and a clear plan of action
            - Explain trade-offs and ask for clarifiction when needed
        `);
    } else {
        parts.push(`
            ## Mode: BUILD
            You are in build mode. your job is implement changes directly.
            - Read and understand the relevant code before making changes
            - Use writeSSE to create new files, editFile for targeted modifications
            - if error comming solve step by step to show user
            - Use bash to run commands (test, build, git operaitions)
            - After making changes, verify the works when possible
        `);
    }

    return parts.join("\n");
};