import React, { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { TextAttributes, RGBA } from "@opentui/core";
import type { DialogConfig } from "./types";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useKeyboardLayer } from "../../providers/toast/keyboard-layer";

export type DialogContextValue = {
    open: (config: DialogConfig) => void;
    close: () => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
    const value = useContext(DialogContext);
    if (!value) {
        throw new Error("useDialog must be used within a DialogProvider");
    }
    return value;
};

type DialogProviderProps = {
    children: ReactNode;
};

export function DilogProvider({ children }: DialogProviderProps) {
    const [currentDialog, setCurrentDialog] = useState<DialogConfig | null>(null);
    const { push, pop } = useKeyboardLayer();
        const close = useCallback(() => {
            setCurrentDialog(null);
            pop("dialog");
        }, [pop]);
    
    const open = useCallback(
        (config: DialogConfig) => {
            setCurrentDialog(config);
                push("dialog", () => {
                    close();
                    return true;
                });
            },
        [push, close],
    );

    const value: DialogContextValue = {
        open, 
        close,
    };

    return (
        <DialogContext.Provider value={value}>
            {children}
            <Dialog currentDialog={currentDialog} close={close} />
        </DialogContext.Provider>
    )
};

type DialogProps = {
    currentDialog: DialogConfig | null;
    close: () => void;
};

function Dialog({ currentDialog, close }: DialogProps) {
    const { isTopLayer } = useKeyboardLayer();
    const diemesions = useTerminalDimensions();

    useKeyboard((key) => {
        if (!currentDialog || !isTopLayer("dialog")) return;
        if (key.name === "escape") {
            close();
        }
    });
    
    if (!currentDialog) {
        return null;
    }

    const { title, children } = currentDialog;

    return (
        <box
            position="absolute"
            left={0}
            top={0}
            width={diemesions.width}
            height={diemesions.height}
            justifyContent="center"
            alignItems="center"
            backgroundColor={RGBA.fromInts(0, 0, 0, 150)}
            zIndex={100}
            onMouseDown={() => close()}
        >
            <box
                width={Math.min(60, diemesions.width - 4)}
                height="auto"
                backgroundColor="#1A1A24"
                paddingX={4}
                paddingY={1}
                flexDirection="column"
                gap={1}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <box
                    paddingBottom={1}
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <text attributes={TextAttributes.BOLD}>{title}</text>
                    <text attributes={TextAttributes.DIM} onMouseDown={() => close()}>
                        esc
                    </text>
                </box>
                <box flexGrow={1}>{children}</box>
            </box>
        </box>
    );
};