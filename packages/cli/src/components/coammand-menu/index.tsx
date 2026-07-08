import type { RefObject } from "react";
import {
    TextAttributes,
    type ScrollBoxRenderable,
} from "@opentui/core";
import { getFilteredCommands } from "./filter-commands";
import { COMMANDS } from "./commands";
import { useTheme } from "../../providers/theme";

const MAX_VISIBLE_COMMANDS = 8;
const COMMAND_COL_WIDTH =
    Math.max(...COMMANDS.map((cmd) => cmd.name.length)) + 8;

type CommandMenuProps = {
    query: string;
    selectedIndex: number;
    scrollRef: RefObject<ScrollBoxRenderable>;
    onSelect: (index: number) => void;
    onExecute: (index: number) => void;
};

export function CommandMenu({
    query,
    selectedIndex,
    scrollRef,
    onSelect,
    onExecute,
}: CommandMenuProps) {
    const { colors } = useTheme();
    const filtered = getFilteredCommands(query);
    const visibleHeight = Math.min(filtered.length, MAX_VISIBLE_COMMANDS);

    if (filtered.length === 0) {
        return (
            <box paddingX={1}>
                <text
                    fg="gray"
                    attributes={TextAttributes.DIM}
                >
                    No commands found
                </text>
            </box>
        );
    }

    return (
        <scrollbox
            ref={scrollRef}
            height={visibleHeight}
            width="100%"
        >
            {filtered.map((cmd, i) => {
                const isSelected = i === selectedIndex;

                return (
                    <box
                        key={cmd.value}
                        flexDirection="row"
                        alignItems="center"
                        width="100%"
                        height={1}
                        paddingX={1}
                        backgroundColor={isSelected ? colors.selection : undefined}
                        onMouseMove={() => onSelect(i)}
                        onMouseDown={() => onExecute(i)}
                    >
                        {/* Command */}
                        <box
                            width={COMMAND_COL_WIDTH}
                            flexShrink={0}
                        >
                            <text
                                selectable={false}
                                fg={isSelected ? "black" : "white"}
                            >
                                /{cmd.name}
                            </text>
                        </box>

                        {/* Description */}
                        <box
                            flexGrow={1}
                            overflow="hidden"
                        >
                            <text
                                selectable={false}
                                fg={isSelected ? "black" : "gray"}
                                attributes={
                                    !isSelected
                                        ? TextAttributes.DIM
                                        : undefined
                                }
                            >
                                {cmd.description}
                            </text>
                        </box>
                    </box>
                );
            })}
        </scrollbox>
    );
}