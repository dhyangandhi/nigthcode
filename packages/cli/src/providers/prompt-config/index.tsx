import { 
    createContext, 
    useContext, 
    useState, 
    useCallback 
} from "react";
import type { ReactNode } from "react";
import {
    DEFAULT_CHAT_MODEL_ID,
    type SupportedChatModelId 
} from "@nightcode/shared";
import { Mode } from "@nightcode/database/enums";

type PromptConfigContextValue = {
    mode: Mode;
    toggleMode: () => void;
    model: SupportedChatModelId;
    setMode: (mode: Mode) => void;
    setModel: (model: SupportedChatModelId) => void;
};

const PromptConfigContext = createContext<PromptConfigContextValue | null>(null);

export function usePromptConfig(): PromptConfigContextValue {
    const value = useContext(PromptConfigContext);
    if (!value) {
        throw new Error("usePromptConfig must be use within a PromptConfifProvider");
    }

    return value;
}

type PromptConfigProvdierProps = {
    children: ReactNode;
};

export function PromptConfigProvider({ children }: PromptConfigProvdierProps) {
    const [mode, setMode] = useState<Mode>(Mode.BUILD);
    const [model, setModel] = useState<SupportedChatModelId>(DEFAULT_CHAT_MODEL_ID);

    const toggleMode  = useCallback(() => {
        setMode((m) => (m === Mode.BUILD ? Mode.PLAIN : Mode.BUILD));
    }, []);

    return (
        <PromptConfigContext.Provider 
            value={{ mode, toggleMode, setMode, model, setModel }}>
            {children}
        </PromptConfigContext.Provider>
    );
};