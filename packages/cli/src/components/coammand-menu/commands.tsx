import type { Command } from "./types";

export const COMMANDS: Command[] = [
    {
        name: "new",
        description: "Start a new converstion",
        value: "/new",
    },
    {
        name: "agents",
        description: "Switch agents",
        value: "/agents",
    },
    {
        name: "models",
        description: "Select AI model for generation",
        value: "/models",
    },
    {
        name: "sessions",
        description: "Brower past session",
        value: "/sessions"
    },
    {
        name: "theme",
        description: "Change color theme",
        value: "/theme",
    },
    {
        name: "login",
        description: "Sign in with your brower",
        value: "/login",
    },
    {
        name: "logout",
        description: "Sign out with your brower",
        value: "/logout",
    },
    {
        name: "upgrade",
        description: "Buy more credits",
        value:  "/upgrade"
    },
    {
        name: "usage",
        description: "Quit the application",
        value: "/usage",
    },
    {
        name: "exit",
        description: "Exit the application",
        value: "/exit",
        action: (ctx) => {
            ctx.exit();
        },
    },
];
