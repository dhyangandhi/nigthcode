import { TextAttributes } from "@opentui/core";
import { useTheme } from "../../providers/theme";
import { toErrorString } from "@nightcode/shared";

type Props = {
    message: unknown;
};

export function ErrorMessage({ message }: Props) {
    const { colors } = useTheme();

    const displayMessage = typeof message === "string" && message !== "[object Object]"
        ? message
        : toErrorString(message);

    return (
        <box width="100%" alignItems="center">
            <box
                border={["left"]}
                borderColor={colors.error}
                width="100%"
            >
                <box
                    justifyContent="center"
                    paddingX={2}
                    paddingY={1}
                    backgroundColor={colors.surface}
                    width="100%"
                >
                    <text attributes={TextAttributes.DIM}>{displayMessage}</text>
                </box>
            </box>
        </box>
    );
};