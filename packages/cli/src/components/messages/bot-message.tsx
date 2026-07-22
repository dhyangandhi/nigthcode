import { Mode } from "@nightcode/database/enums";
import type { ClientMessagePart } from "../../hooks/use-chat";
import { useTheme } from "../../providers/theme";
import { TextAttributes } from "@opentui/core";
import { EmptyBorder } from "../border";
import type { ClientToolCallPart } from "../../hooks/use-chat";
import { toErrorString } from "@nightcode/shared";

type Props = {
    parts: ClientMessagePart[];
    content?: string;
    model: string;
    mode: Mode;
    duration?: string;
    streaming?: boolean;
    interrupted?: boolean;
};

function formatToolName(name: string): string {
    return name
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/^./, (c) => c.toUpperCase());
};

function formatToolArgs(tc: ClientToolCallPart): string {
    return Object.values(tc.args)
        .map((val) => (typeof val === "object" && val !== null ? JSON.stringify(val) : String(val)))
        .join(" ");
}

type PartGroup = {
    type: ClientMessagePart["type"];
    parts: ClientMessagePart[];
    key: string;
};

function groupConsectiveParts(parts: ClientMessagePart[]): PartGroup[] {
    const groups: PartGroup[] = [];

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;

        const lastGroup = groups[groups.length - 1];

        if (lastGroup && lastGroup.type === part.type) {
            lastGroup.parts.push(part);
        } else {
            const key = part.type === "tool-call" ? `group-tc-${part.id}` : `group-${part.type}-${i}`;
            groups.push({ type: part.type, parts: [part], key });
        }
    }

    return groups;
}

export function BotMessage({ parts, content, model, mode, duration, streaming = false, interrupted = false, }: Props) {
    const { colors } = useTheme();
    const effectiveParts: ClientMessagePart[] = parts.length > 0 ? parts : (content ? [{ type: "text" as const, text: content }] : []);
    
    return (
        <box width="100%" alignItems="center">
            {groupConsectiveParts(effectiveParts).map((group) => (
                <box key={group.key} paddingY={1} width="100%">
                    {group.parts.map((part, j) => {
                        if (part.type === "resoning") {
                            const textContent = typeof part.text === "string" && part.text !== "[object Object]" ? part.text : toErrorString(part.text);
                            return (
                                <box
                                    key={`resoning-${j}`}
                                    border={["left"]}
                                    borderColor={colors.thinkingBorder}
                                    width="100%"
                                    paddingX={2}
                                >
                                    <text attributes={TextAttributes.DIM}>
                                        <em fg={colors.thinking}>Thinking:</em> {textContent}
                                    </text>
                                </box>
                            );
                        }

                        if (part.type === "tool-call") {
                            return (
                                <box
                                    key={part.id}
                                    border={["left"]}
                                    borderColor={colors.thinkingBorder}
                                    width="100%"
                                    paddingX={2}
                                >
                                    <text>
                                        <em fg={colors.info}>{formatToolName(part.name)}:
                                            {formatToolArgs(part)}
                                            {part.status === "calling" ? " ..." : ""}
                                        </em>
                                    </text>
                                </box>
                            )
                        }

                        if (part.type === "text") {
                            const textContent = typeof part.text === "string" && part.text !== "[object Object]" ? part.text : toErrorString(part.text);
                            return (
                                <box key={`text-${j}`} paddingX={3} width="100%">
                                    <text>{textContent}</text>
                                </box>
                            )
                        }
                        return null;
                    })}
                </box>
            ))}
            <box paddingX={3} paddingBottom={1} gap={1} width="100%">
                <box flexDirection="row" gap={2}>
                    <text attributes={interrupted ? TextAttributes.DIM : 0} fg={interrupted ? undefined : mode === Mode.PLAIN ? colors.planMode : colors.primary}>◉</text>
                    <box flexDirection="row" gap={2}>
                        <text attributes={interrupted ? TextAttributes.DIM : 0}>{mode === Mode.PLAIN ? "plan" : "Bulid"}</text>
                        <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                            &gt;
                        </text>
                        <text attributes={TextAttributes.DIM}>{model}</text>
                        {(duration || interrupted) && (
                            <>
                                <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                                    &gt;
                                </text>
                                <text attributes={TextAttributes.DIM}>{interrupted ? "interrupted" : duration}</text>
                            </>
                        )}
                    </box>
                </box>
            </box>
        </box>
    );
};