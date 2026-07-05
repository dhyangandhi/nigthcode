import { useRef, useState, useMemo, type RefObject } from "react";
import type { ScrollBoxRenderable } from "@opentui/core";
import { getFilteredCommands } from "./filter-commands";
import type { Command } from "./types";
import { useKeyboard } from "@opentui/react";

// 1. Remove `| null` from the RefObject generic
type UseCommandMenuProps = {
    showCommandMenu: boolean;
    commandQuery: string;
    selectedIndex: number;
    scrollRef: RefObject<ScrollBoxRenderable>; 
    handleContentChange: (text: string) => void;
    resloveCommand: (index: number) => Command | undefined;
    setSelectedIndex: (index: number) => void;
}

// 2. Remove `| null` from the RefObject generic
type UseCommandMenuReturn = {
    showCommandMenu: boolean;
    commandQuery: string;
    selectedIndex: number;
    scrollRef: RefObject<ScrollBoxRenderable>; 
    handleContentChange: (text: string) => void;
    resolveCommand: (index: number) => Command | undefined;
    setSelectedIndex: (index: number) => void;
}

export function useCommandMenu(): UseCommandMenuReturn {
    const [textValue, setTextValue] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showCommandMenu, setShowCommandMenu] = useState(false);
    
    // 3. Keep this exactly as is! 
    // React's useRef(null) overload automatically returns RefObject<ScrollBoxRenderable>
    const scrollRef = useRef<ScrollBoxRenderable>(null!);
    
    const commandQuery = showCommandMenu && textValue.startsWith("/") ? textValue.slice(1): "";
    const filterdCommands = useMemo(() => getFilteredCommands(commandQuery), [commandQuery]);
    
    const handleContentChange = (text: string) => {
        setTextValue(text);
        setSelectedIndex(0);
        const scrollbox = scrollRef.current;
        if (scrollbox) {
            scrollbox.scrollTo(0);
        }
        const prefix = text.startsWith("/") ? text.slice(1): null;
        if (prefix != null && !prefix.includes(" ")) {
            setShowCommandMenu(true);
        } else {
            setShowCommandMenu(false);
        }
    };
    
    const resolveCommand = (index: number): Command | undefined => {
        const command = filterdCommands[index];
        if (command) {
            setShowCommandMenu(false);
        }
        return command;
    };
    
    useKeyboard((key) => {
        if (!showCommandMenu) return;
        if (key.name === "escape") {
            key.preventDefault();
            setShowCommandMenu(false);
        } else if(key.name === "up") {
            key.preventDefault();
            setSelectedIndex((i: number) => {
                const newIndex = Math.max(0, i - 1);
                const sb = scrollRef.current;
                if (sb && newIndex < sb.scrollTop) {
                    sb.scrollTo(newIndex);
                }
                return newIndex;
            });
        } else if (key.name === "down") {
            key.preventDefault();
            setSelectedIndex((i: number) => {
                if (filterdCommands.length === 0) {
                    return 0;
                }
                const newIndex = Math.min(filterdCommands.length - 1, i + 1);
                const sb = scrollRef.current;
                if(sb) {
                    const viewportHeight = sb.viewport.height;
                    const visibleEnd = sb.scrollTop + viewportHeight - 1;
                    if (newIndex > visibleEnd) {
                        sb.scrollTo(newIndex - viewportHeight + 1);
                    }
                }
                return newIndex;
            }); 
        }
    });
    
    return {
        showCommandMenu,
        commandQuery,
        selectedIndex,
        scrollRef,
        handleContentChange,
        resolveCommand,
        setSelectedIndex,
    };
};