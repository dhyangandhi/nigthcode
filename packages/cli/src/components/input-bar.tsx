import { useRef, useCallback, useEffect } from "react";
import type { TextareaRenderable } from "@opentui/core";
import { useRenderer } from "@opentui/react";
import type { Command } from "./coammand-menu/types";
import { useCommandMenu } from "./coammand-menu/use-command-menu";
import type { KeyBinding } from "@opentui/core";
import { StatusBar } from "./status-bar";
import { CommandMenu } from "./coammand-menu";

type Props = {
    onSubmit: (value: string) => void;
    disabled?: boolean;
};

export const TEXTAREA_KEY_BINDINGS: KeyBinding[] = [
    { name: "return", action: "submit"},
    { name: "enter", action: "submit"},
    { name: "return", shift: true, action: "newline"},
    { name: "enter", shift: true, action: "newline"},
];
export function InputBar({ onSubmit, disabled }: Props) {
    const textareaRef = useRef<TextareaRenderable>(null);
    const onSumbitRef = useRef<() => void>(() => {});
    const renderer = useRenderer();
    const {
        showCommandMenu,
        commandQuery,
        selectedIndex,
        scrollRef,
        handleContentChange,
        resolveCommand,
        setSelectedIndex,
    } = useCommandMenu();

    const handleCommandExectue = useCallback(
        (index: number) => {
            const command = resolveCommand(index);
            handleCommand(command);
        },
        [],
    );
    const handleTextareaContentChange = useCallback(() => {
        const textare = textareaRef.current;
        if (!textare) return;

        handleContentChange(textare.plainText);
    }, []);
    const handleSumbit = useCallback(() => {
        if (disabled) return;

        const textarea = textareaRef.current;
        if (!textarea) return;

        const text = textarea.plainText.trim();
        if (text.length === 0) return;

        onSubmit(text);
        textarea.setText("");
    }, [disabled, onSubmit])
    const handleCommand = useCallback((
        command: Command | undefined
    ) => {
        const textarea = textareaRef.current;
        if (!textarea || !command) return;
        textarea.setText("");
        if (command.action) {
            command.action({
                exit: () => renderer.destroy(),
            });
        } else {
            textarea.insertText(command.value + " ");
        }
    }, [renderer]);
    useEffect (() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.onSubmit = () => {
            onSumbitRef.current();
        };
    }, []);

    onSumbitRef.current = () => {
        if (disabled) return;

        if (showCommandMenu) {
            const command = resolveCommand(selectedIndex);
            handleCommand(command);
            return;
        }
        handleSumbit();
    }
    return (
        <box width="100%" alignItems="center">
            <box
                width="100%"
                border={["left"]}
                borderColor="cyan"
            >
                <box
                    width="100%"
                    position="relative"
                    justifyContent="center"
                    paddingX={2}
                    paddingY={1}
                    backgroundColor="#1A1A24"
                    gap={1} 
                >
                    {showCommandMenu && (
                        <box
                            position="absolute"
                            bottom="100%"
                            left={0}
                            width="100%"
                            backgroundColor="#1A1A24"
                            zIndex={10}
                        >
                            <CommandMenu 
                                query={commandQuery}
                                selectedIndex={selectedIndex}
                                scrollRef={scrollRef}
                                onSelect={setSelectedIndex}
                                onExecute={handleCommandExectue}
                            
                            />
                        </box>
                    )}
                    <textarea
                        ref={textareaRef}
                        width="100%"
                        keyBindings={TEXTAREA_KEY_BINDINGS}
                        onContentChange={handleTextareaContentChange}
                        focused={!disabled}
                        placeholder='Ask anything... "Fix a bug in the database"'
                    />
                    <StatusBar />
                </box>
            </box>
        </box>
    );
}