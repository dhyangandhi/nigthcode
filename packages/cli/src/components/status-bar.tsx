import { TextAttributes } from "@opentui/core";
import { usePromptConfig } from "../providers/prompt-config";
import { Node } from "@opentui/core/yoga";
import { useTheme } from "../providers/theme";
import { Mode } from "@nightcode/database/enums";

export function StatusBar() {
    const { mode, model } = usePromptConfig();
    const { colors } = useTheme();
    return (
        <box flexDirection="row" gap={1}>
            <text fg={mode === Mode.PLAIN ? colors.planMode : colors.primary}>
                {mode === Mode.PLAIN ? "Plan": "Build"}
            </text>
            
            <text attributes={TextAttributes.DIM} fg="gray">
                &#8250;
            </text>
            <text>{model}</text>
        </box>
    );
};