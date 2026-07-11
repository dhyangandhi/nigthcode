export type ModelPricing = {
    inputUsdPerMillionTokens: number;
    outputUsdPerMillionTokens: number;
};

export type SupportedProvider = "OLLAMA" | "OPENROUTER";

type SuppoertedChatModelDefinition = {
    id: string;
    provider: SupportedProvider;
    pricing: ModelPricing;
};

export const SUPPORTED_CHAT_MODELS = [
    {
        id: "nvidia/nemotron-3-ultra-550b-a55b:free",
        provider: "OPENROUTER",
        pricing: {
            inputUsdPerMillionTokens: 0.2,
            outputUsdPerMillionTokens: 15,
        },
    },
] as const satisfies readonly SuppoertedChatModelDefinition[];

export type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS) [number];

export type SupportedChatModelId = SupportedChatModel["id"];

export function findSupportedChatModel(modelId: string) {
    return SUPPORTED_CHAT_MODELS.find((model) => model.id === modelId);
}

export const  DEFAULT_CHAT_MODEL_ID: SupportedChatModelId = "nvidia/nemotron-3-ultra-550b-a55b:free";

