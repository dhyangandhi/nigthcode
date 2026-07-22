import { OpenRouter, openrouter } from "@openrouter/ai-sdk-provider"
import { 
    findSupportedChatModel,
    type SupportedChatModel,
    type SupportedChatModelId,
    type SupportedProvider,
} from "@nightcode/shared";
import type { LanguageModel } from "ai";
import type { ProviderOptions } from "@ai-sdk/provider-utils";

type OpenrouterModelId = Extract<SupportedChatModel, { provider: "OPENROUTER" }>["id"];

export type ResolvedModel = {
    model: LanguageModel;
    provider: SupportedProvider;
    modelId: SupportedChatModelId;
    providerOptions?: ProviderOptions;
};

const OPENROUTER_PROVIDER_OPTIONS: Partial<Record<OpenrouterModelId, ProviderOptions>> = {
    "nvidia/nemotron-3-ultra-550b-a55b:free": {
        OpenRouter: {
            thinking: {
                type: "enabled",
                budgetTokens: 1000,
            }
        },
    },
}
function assertUnsupportedProvider(provider: never): never {
    throw new Error(`Unsupported provider: ${provider}`);
};

function resolveOpenrouterModel(modelId: OpenrouterModelId): ResolvedModel {
    return {
        model: openrouter(modelId),
        provider: "OPENROUTER",
        modelId,
        providerOptions: OPENROUTER_PROVIDER_OPTIONS[modelId],
    };
};

function resolveSupportedChatModel(model: SupportedChatModel): ResolvedModel {
  const provider = model.provider;
  
    switch (provider) {
        case "OPENROUTER":
            return resolveOpenrouterModel(model.id);
        default: 
            return assertUnsupportedProvider(provider);
    }
};

export function isSupportedChatModel(modelId: string): modelId is SupportedChatModelId {
    return findSupportedChatModel(modelId) != null;
};

export function resolveChatModel(modelId: string): ResolvedModel {
    const model = findSupportedChatModel(modelId);
    if (!model) {
        throw new Error(`Unsupported model: ${modelId}`);
    }
    return resolveSupportedChatModel(model);
}