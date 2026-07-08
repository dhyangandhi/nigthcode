import { ThemeDialogContext } from "../dialogs/theme-dialog";
import type { Command } from "./types";

export const COMMANDS: Command[] = [
    {
        name: "new",
        description: "Start a new converstion",
        value: "/new",
        action: (ctx) => {
            ctx.toast.show({ message: "Starting new conversation..." });
        },
    },
    {
        name: "agents",
        description: "Switch agents",
        value: "/agents",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select Mode",
                children: <text>Agent selection coming soon...</text>,
            });
        },
    },
    {
        name: "models",
        description: "Select AI model for generation",
        value: "/models",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select Mode",
                children: <text>Models selection coming soon...</text>,
            });
        },
    },
    {
        name: "sessions",
        description: "Brower past session",
        value: "/sessions",
        action: (ctx) => {
            ctx.toast.show({ message: "Brower past session"});
        },
    },
    {
        name: "theme",
        description: "Change color theme",
        value: "/theme",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select Theme",
                children: <ThemeDialogContext />
            })
        },
    },
    {
        name: "login",
        description: "Sign in with your brower",
        value: "/login",
        action: (ctx) => {
            ctx.toast.show({ message: "Sign in with your brower"});
        },
    },
    {
        name: "logout",
        description: "Sign out with your brower",
        value: "/logout",
        action: (ctx) => {
            ctx.toast.show({ message: "Sign out with your brower"});
        },
    },
    {
        name: "upgrade",
        description: "Buy more credits",
        value:  "/upgrade",
        action: (ctx) => {
            ctx.toast.show({ message: "upgrade new converstion..."});
        },
    },
    {
        name: "usage",
        description: "Quit the application",
        value: "/usage",
        action: (ctx) => {
            ctx.toast.show({ message: "Quit the application..."});
        },
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
