import { Outlet } from "react-router";
import { ToastProivder } from "../providers/toast";
import { DilogProvider } from "../providers/dialog";
import { KeyboardLayerProvider, useKeyboardLayer } from "../providers/toast/keyboard-layer";
import { ThemeProvider } from "../providers/theme";

export function RootLayout() {
    return (
        <ThemeProvider>
            <ToastProivder>
                <KeyboardLayerProvider>
                    <DilogProvider>
                        <Outlet />
                    </DilogProvider>
                </KeyboardLayerProvider>
            </ToastProivder>
        </ThemeProvider>
    )
};