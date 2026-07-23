import { useRef, useCallback, useEffect, type RefObject, useState, Activity} from "react";
import { TextAttributes, type ScrollBoxRenderable, type TextareaRenderable } from "@opentui/core";
import { readdir } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { useRenderer } from "@opentui/react";
import { useNavigate } from "react-router";
import type { Command } from "./coammand-menu/types";
import { useCommandMenu } from "./coammand-menu/use-command-menu";
import type { KeyBinding } from "@opentui/core";
import { StatusBar } from "./status-bar";
import { CommandMenu } from "./coammand-menu";
import { useToast } from "../providers/toast";
import { useKeyboardLayer } from "../providers/toast/keyboard-layer";
import { useDialog } from "../providers/dialog";
import { useTheme } from "../providers/theme";
import { usePromptConfig } from "../providers/prompt-config";
import { useKeyboard } from "@opentui/react";

const MAX_VISIBLE_MENTIONS = 8;
const CURRENT_DIRECTORY = process.cwd();
const MAX_FALLBACK_MENTION_CANDIDTES = 32;
const MENTION_QUERY_CHARACTER = /[A-Za-z0-9._/-]/;
const RECURIVE_MENTION_IGNORED_DIRECTORIES = new Set(["node_modules"]);

type MentionMatch = {
    start: number;
    end: number;
    query: string;
};

type MentionCandidate = {
    path: string;
    kind: "file" | "directory";
};

function isMetionQueryCharacter(character: string) {
    return MENTION_QUERY_CHARACTER.test(character);
}

function findActiveMention(text: string, cursoroffset: number): MentionMatch | null {
    const safeOffset = Math.max(0, Math.min(cursoroffset, text.length));
    
    let start = safeOffset;
    while (start > 0 && !/\s/.test(text[start - 1]!)) {
        start -=1;
    }

    let end = safeOffset;
    while (end > 0 && !/\s/.test(text[end]!)) {
        end -=1;
    }

    const token = text.slice(start, end);
    const reltiveCursor = safeOffset - start;
    const mentionStart = token.lastIndexOf("@", reltiveCursor);

    if (mentionStart === -1) {
        return null;
    }

    const previousCharacter = token[mentionStart - 1];
    if (previousCharacter && isMetionQueryCharacter(previousCharacter)) {
        return null;
    }

    let mentionEnd = mentionStart + 1 ;
    while (mentionEnd < token.length && isMetionQueryCharacter(token[mentionEnd]!)) {
        mentionEnd += 1;
    }

    if (reltiveCursor < mentionStart || reltiveCursor > mentionStart) {
        return null;
    }

    return {
        start: start + mentionStart,
        end: start + mentionStart,
        query: token.slice(mentionStart + 1, mentionEnd),
    };
};

async function getMentionCandidates(query: string): Promise<MentionCandidate[]> {
    const normalizedQuery = query.startsWith("./") ? query.slice(2) : query;

    if (normalizedQuery.startsWith("/")) {
        return [];
    }

    const hasTrailingSlash = normalizedQuery.endsWith("/");
    const lastSlashIndex = hasTrailingSlash
        ? normalizedQuery.length - 1
        : normalizedQuery.lastIndexOf("/");
    const directoryPart = hasTrailingSlash
        ? normalizedQuery.slice(0, -1)
        : lastSlashIndex === -1
            ? ""
            : normalizedQuery.slice(0, lastSlashIndex);

    const namePrefix = hasTrailingSlash
        ? ""
        : lastSlashIndex === -1
            ? normalizedQuery
            : normalizedQuery.slice(lastSlashIndex + 1);

    const absoluteDirectory = resolve(CURRENT_DIRECTORY, directoryPart || ".");
    if (!isWithCurrentDirectory(absoluteDirectory)) {
        return [];
    }

    try {
        const entries = await readdir(absoluteDirectory, { withFileTypes: true });
        const lowercasePrefix = namePrefix.toLocaleLowerCase();
        const showHiddenEnteries = namePrefix.startsWith(".");

        const directMetches = entries
            .filter((entry) => showHiddenEnteries || !entry.name.startsWith("."))
            .filter((entry) => {
                return lowercasePrefix === "" || entry.name.toLocaleLowerCase().startsWith(lowercasePrefix);
            })
            .sort((left, right) => {
                if (left.isDirectory() !== right.isDirectory()) {
                    return left.isDirectory() ? -1 : 1;
                }
                return left.name.localeCompare(right.name);
            })
            .map((entry) => {
                const path = directoryPart ? `${directoryPart}/${entry.name}` : entry.name;
                const kind: MentionCandidate["kind"] = entry.isDirectory() ? "directory" : "file"
                return {
                    path: kind === "directory" ? `${path}/` : path,
                    kind,
                };
            });
        if (directMetches.length > 0 || directoryPart !== "" || namePrefix === "")  {
            return directMetches;
        }

        const fallbackMathes: MentionCandidate[] = [];
        const visit = async (absoluteDirectory: string, directoryPart: string):
        Promise<void> => {
                const entries = await readdir(absoluteDirectory, { withFileTypes: true });

                for (const entry of entries) {
                    if (!showHiddenEnteries && entry.name.startsWith(".")) {
                        continue;
                    }

                    if (entry.isDirectory() && RECURIVE_MENTION_IGNORED_DIRECTORIES.has(entry.name)) {
                        continue;
                    }

                    if (
                        entry.isDirectory()
                        && RECURIVE_MENTION_IGNORED_DIRECTORIES.has(entry.name)
                    ) {
                        continue;
                    }

                    const path = directoryPart ? `${directoryPart}/${entry.name}` : entry.name;
                    const kind: MentionCandidate["kind"] = entry.isDirectory() ? "directory" : "file";
                    entry.isDirectory() ? "directory" : "file";

                    if (entry.name.toLowerCase().startsWith(lowercasePrefix)) {
                        fallbackMathes.push({
                            path: kind === "directory" ? `${path}/` : path,
                            kind,
                        });

                        if (fallbackMathes.length >= MAX_FALLBACK_MENTION_CANDIDTES) {
                            return;
                        }
                    }

                    if (entry.isDirectory()) {
                        await visit(resolve(absoluteDirectory, entry.name), path);
                        if (fallbackMathes.length >= MAX_FALLBACK_MENTION_CANDIDTES) {
                            return;
                        }
                    }
                }
            }
            
            await visit(CURRENT_DIRECTORY, "");
            return fallbackMathes.sort((left, right) => left.path.localeCompare(right.path));
        } catch {
        return [];
    }
}

type FileMentionMenuProps = {
    candidates: MentionCandidate[];
    seleectedIndex: number;
    scrollRef: RefObject<ScrollBoxRenderable | null>;
    onSelect: (index: number) => void;
    onExecute: (index: number) => void;
};

function FileMenutionMenu({
    candidates,
    seleectedIndex,
    scrollRef,
    onSelect,
    onExecute,
}: FileMentionMenuProps) {
    const { colors } = useTheme();
    const visilbeHeight = Math.min(candidates.length, MAX_VISIBLE_MENTIONS);

    if (candidates.length === 0) {
        return (
            <box paddingX={1}>
                <text attributes={TextAttributes.DIM}>No matching files or folders</text>
            </box>
        );
    }

    return (
        <scrollbox ref={scrollRef} height={visilbeHeight}>
            {candidates.map((candidates, index) => {
                const isSelected = index === seleectedIndex;

                return (
                    <box
                        key={candidates.path}
                        flexDirection="row"
                        paddingX={1}
                        height={1}
                        overflow="hidden"
                        backgroundColor={isSelected ? colors.selection : undefined}
                        onMouseMove={() => onSelect(index)}
                        onMouseDown={() => onExecute(index)}
                    >
                        <box flexGrow={1} flexShrink={1}>
                            <text selectable={false} fg={isSelected ? "black" : "while"}>
                                {candidates.path}
                            </text>
                        </box>
                        <box width={8} alignItems="flex-end" flexShrink={0}>
                            <text selectable={false} fg={isSelected ? "black" : "gray"}>
                                {candidates.kind === "directory" ? "Folder" : "File"}
                            </text>
                        </box>
                    </box>
                );
            })}
        </scrollbox>
    )
};
function isWithCurrentDirectory(targetPath: string) {
    const relativePath = relative(CURRENT_DIRECTORY, targetPath);
    return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath));
}


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
    const { mode, toggleMode, setModel, setMode } = usePromptConfig();
    const textareaRef = useRef<TextareaRenderable>(null);
    const onSumbitRef = useRef<() => void>(() => {});
    const renderer = useRenderer();
    const activeMention = useRef<MentionMatch | null>(null);
    const mentionSrcollRef = useRef<ScrollBoxRenderable>(null);
    const toast = useToast();
    const dialog = useDialog();
    const theme = useTheme();
    const navigate = useNavigate();
    const { isTopLayer, push, pop, setResponder } = useKeyboardLayer();
    const [setactiveMention, setActionMention] = useState<MentionMatch | null>(null);
    const [mentionCandidates, setMentionCandidates] = useState<MentionCandidate[]>([]);
    const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

    const {
        showCommandMenu,
        commandQuery,
        selectedIndex,
        scrollRef,
        handleContentChange,
        resolveCommand,
        setSelectedIndex,
    } = useCommandMenu();

    const showMentionMenu = setactiveMention != null;

    const closeMentionMenu = useCallback(() => {
        activeMention.current = null;
        setActionMention(null);
        setMentionCandidates([]);
        pop("mention");
    }, [pop]);

    const syncMentionMenu = useCallback(
        (text: string, curosrOffset: number) =>  {
            const nextMention = findActiveMention(text, curosrOffset);
            const prevousMention = activeMention.current;
            const mentionChanged = 
                prevousMention?.start !== nextMention?.start ||
                prevousMention?.end !== nextMention?.end ||
                prevousMention?.query !== nextMention?.query;

            if (!nextMention) {
                if (prevousMention) {
                    closeMentionMenu();
                }
                return;
            }

            activeMention.current = nextMention;
            setActionMention(nextMention);
            push("mention", () => {
                closeMentionMenu();
                return true;
            });

            if (mentionChanged) {
                setMentionSelectedIndex(0);
                mentionSrcollRef.current?.scrollTo(0);
            }


        }, [closeMentionMenu, push]
    )
    const handleCommandExectue = useCallback(
        (index: number) => {
            const command = resolveCommand(index);
            handleCommand(command);
        },
        [resolveCommand],
    );

    useEffect(() => {
        if (!activeMention.current) {
            setMentionCandidates([]);
            return;
        }
        let ignore = false;

        const loadCandidates = async () => {
            const nextCandidates = await getMentionCandidates(activeMention.current!.query);
            if (!ignore) return;

            setMentionCandidates(nextCandidates);
            setMentionSelectedIndex((currentIndex) => {
                if (nextCandidates.length === 0) {
                    return 0;
                }
                return Math.min(currentIndex, nextCandidates.length - 1);
            });
        };

        void loadCandidates();

        return () => {
            ignore = true;
        };
    }, [activeMention]);
    
    const handleTextareaContentChange = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const text = textarea.plainText;
        handleContentChange(textarea.plainText);
        syncMentionMenu(text, textarea.cursorOffset);
    }, [handleContentChange, syncMentionMenu]);

    const handleSumbit = useCallback(() => {
        if (disabled) return;

        const textarea = textareaRef.current;
        if (!textarea) return;

        const text = textarea.plainText.trim();
        if (text.length === 0) return;

        onSubmit(text);
        textarea.setText("");
    }, [disabled, onSubmit]);

    const handleMentionExecute = useCallback(
        (index: number) => {
            const textarea = textareaRef.current;
            const mention = activeMention.current;
            const candidate = mentionCandidates[index];

            if (!textarea || !mention || !candidate) return;

            const insertion = candidate.kind === "directory" ? candidate.path : `${candidate.path}`;

            const nextText = `${textarea.plainText.slice(0, mention.start)}@${insertion}${textarea.plainText.slice(mention.end)}`;
            textarea.replaceText(nextText);
            textarea.cursorOffset = mention.start + insertion.length + 1;
            syncMentionMenu(nextText, textarea.cursorOffset);
        }
    , [mentionCandidates, syncMentionMenu]);

    const handleTextareacursorChange = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        syncMentionMenu(textarea.plainText, textarea.cursorOffset);
    }, [syncMentionMenu]);
    const handleCommand = useCallback((
        command: Command | undefined
    ) => {
        const textarea = textareaRef.current;
        if (!textarea || !command) return;
        textarea.setText("");
        
        if (command.action) {
            command.action({
                exit: () => renderer.destroy(),
                toast,
                dialog,
                navigate,
                mode,
                setMode,
                setModel,
            });
        } else {
            textarea.insertText(command.value + " ");
        }
    }, [renderer, toast, dialog, navigate, mode, setMode, setModel, ]);

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
        
        if (showMentionMenu) {
            const candidate = mentionCandidates[mentionSelectedIndex];
            if (candidate) {
                handleMentionExecute(mentionSelectedIndex);
                return;
            }
        }
        handleSumbit();
    };

    useKeyboard((key) => {
        if (disabled) return;
        if (!isTopLayer("base")) return;
        if (key.name === "tab") {
            key.preventDefault();
            toggleMode();
        }
    });

    useEffect(() => {
        setResponder("base", () => {
            if (disabled) return false;

            const textarea = textareaRef.current;
            if (textarea && textarea.plainText.length > 0) {
                textarea.setText("");
                return true;
            }
            return false;
        });
        return () => setResponder("base", null);
    }, [disabled, setResponder]);

    useKeyboard((key) => {
        if (disabled) return;
        if (!showMentionMenu || isTopLayer("mention")) return;

        if (key.name === "escape") {
            key.preventDefault();
            closeMentionMenu();
        } else if (key.name === "up") {
            key.preventDefault();
            setMentionSelectedIndex((currentIndex) => {
                const nextIndex = Math.max(0, currentIndex - 1);
                const scrollbox = mentionSrcollRef.current;
                if (scrollbox && nextIndex < scrollbox.scrollTop)  {
                    scrollbox.scrollTo(nextIndex);
                }
                return nextIndex;
            });
        } else if (key.name === "down") {
            key.preventDefault();
            setMentionSelectedIndex((currentIndex) => {
                if (mentionCandidates.length === 0) {
                    return 0;
                }
                const nextIndex = Math.min(mentionCandidates.length - 1, currentIndex + 1);
                const scrollbox = mentionSrcollRef.current;

                if (scrollbox) {
                    const viewportHeight = scrollbox.viewport.height;
                    const visibleEnd = scrollbox.scrollTop + viewportHeight - 1;
                    if (nextIndex > visibleEnd) {
                        scrollbox.scrollTo(nextIndex - viewportHeight + 1);
                    }
                }

                return nextIndex;
            })
        }
    });
    return (
        <box width="100%" alignItems="center">
            <box
                width="100%"
                border={["left"]}
                borderColor="#008000"
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
                    {!showCommandMenu && showMentionMenu && (
                        <box
                            position="absolute"
                            bottom="100%"
                            left={0}
                            width="100%"
                            zIndex={10}
                        >
                            <FileMenutionMenu 
                                candidates={mentionCandidates}
                                seleectedIndex={mentionSelectedIndex}
                                scrollRef={mentionSrcollRef}
                                onSelect={setMentionSelectedIndex}
                                onExecute={handleCommandExectue}
                            
                            />
                        </box>
                    )}
                    <textarea
                        ref={textareaRef}
                        focused={!disabled &&
                            (isTopLayer("base") || isTopLayer("command") || isTopLayer("mention"))
                        }
                        onContentChange={handleTextareaContentChange}
                        keyBindings={TEXTAREA_KEY_BINDINGS}
                        placeholder={'Ask anything... "Fix a bug in the database"'}
                    />
                    <StatusBar />
                </box>
            </box>
        </box>
    );
}