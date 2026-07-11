import {
    createContext,
    useContext,
    useRef,
    useState,
    useCallback,
} from "react";
import type { ReactNode } from "react";
import { useTerminalDimensions } from "@opentui/react";
import type { ToastOptions, ToastVariant } from "./types";
import { DEFAULT_DURATION } from "./types";

export type ToastContextValue = {
    show: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const value = useContext(ToastContext);
    if (!value) {
        throw new Error ("useToeast must be used within a ToastProvider");
    }

    return value;
};

type ToastProvderProps = {
    children: ReactNode;
};

export function ToastProivder({ children }: ToastProvderProps) {
    const [currenToast, setCurrentToast] = useState<ToastOptions | null>(null);
    const timeoutHandleRef = useRef<NodeJS.Timeout | null>(null);
    
    const clearCurrentTimeout = useCallback(() => {
        if (timeoutHandleRef.current) {
            clearTimeout(timeoutHandleRef.current);
            timeoutHandleRef.current = null;
        }
    }, []);

    const show = useCallback((options: ToastOptions) => {
        const duration = options.duration ?? DEFAULT_DURATION;

        clearCurrentTimeout();
        setCurrentToast({
            variant: options.variant ?? "info",
            ...options,
            duration,
        });

        timeoutHandleRef.current = setTimeout(() => {
            setCurrentToast(null);
        }, duration).unref();
    }, [clearCurrentTimeout]);

    const value: ToastContextValue = {
        show,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <Toast currentToast={currenToast} />
        </ToastContext.Provider>
    )
};

type ToastProps = {
    currentToast: ToastOptions | null;
};

function Toast({ currentToast }: ToastProps) {
    const { width } = useTerminalDimensions();

    if (!currentToast) {
        return null;
    }

    const variantColor: Record<ToastVariant, string> = {
        success: "#82E0AA",
        error: "#E74C5E",
        info: "#56D6C2",
    };
    
    const borderColor = currentToast.variant
        ? variantColor[currentToast.variant]
        : variantColor.info;
    
    return (
        <box
            position="absolute"
            justifyContent="center"
            alignItems="flex-start"
            top={2}
            right={2}
            width={Math.max(1, Math.min(60, width - 6))}
            paddingLeft={2}
            paddingRight={2}
            paddingTop={1}
            paddingBottom={1}
            backgroundColor="#1A1A24"
            borderColor={borderColor}
            border={["left", "right"]}
        >
            <box flexDirection="column" gap={1} width="100%">
                <text fg="#E1E1E1" wrapMode="word" width="100%">
                    {currentToast.message}
                </text>
            </box>
        </box>
    );
};