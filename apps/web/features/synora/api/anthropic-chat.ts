import { createAnthropic } from "@ai-sdk/anthropic";
import type { AnthropicLanguageModelOptions } from "@ai-sdk/anthropic";
import { streamText, type LanguageModel } from "ai";

import type { ChatRequest } from "../schemas/chat";

const ANTHROPIC_GATEWAY_MODELS: Record<string, string> = {
  "claude-sonnet-4-5": "claude-sonnet-4.5",
};

const VERCEL_GATEWAY_MODELS: Record<string, string> = {
  "claude-sonnet-4-5": "anthropic/claude-sonnet-4.5",
};

const REQUEST_TIMEOUT_MS = 60_000;
const THINKING_BUDGET_TOKENS = 12_000;

const SYSTEM_PROMPT =
  "Ты — ассистент Синоры, продукта Genora Pro. Отвечай на русском языке, если пользователь не попросил иначе. Подстраивай длину ответа под запрос: на приветствие или короткую реплику отвечай одной-двумя дружелюбными фразами без списков и заголовков. На содержательный вопрос начинай с сути, используй короткие абзацы; маркированные списки добавляй только когда перечисление действительно упрощает чтение. Для вопросов об интерфейсах предлагай конкретные размеры, отступы, типографику и цвета. Пиши ясно и профессионально, без слов-паразитов и лишних вводных.";

export function isSupportedModel(modelId: string): boolean {
  return modelId in VERCEL_GATEWAY_MODELS;
}

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function resolveModel(modelId: string): LanguageModel {
  const vercelGatewayModelId = VERCEL_GATEWAY_MODELS[modelId];
  const anthropicGatewayModelId = ANTHROPIC_GATEWAY_MODELS[modelId];
  if (!vercelGatewayModelId || !anthropicGatewayModelId) {
    throw new Error(`Unsupported model: ${modelId}`);
  }

  if (process.env.AI_GATEWAY_API_KEY) {
    return vercelGatewayModelId;
  }

  const baseURL =
    process.env.ANTHROPIC_GATEWAY_BASE_URL_OVERRIDE ??
    process.env.ANTHROPIC_GATEWAY_BASE_URL;
  const apiKey = process.env.ANTHROPIC_GATEWAY_API_KEY;
  if (!baseURL || !apiKey) {
    throw new Error(
      "Set AI_GATEWAY_API_KEY, or ANTHROPIC_GATEWAY_BASE_URL and ANTHROPIC_GATEWAY_API_KEY",
    );
  }

  const anthropic = createAnthropic({
    baseURL: normalizeBaseUrl(baseURL),
    apiKey: apiKey.trim().replace(/^['"]+|['"]+$/g, ""),
  });
  return anthropic(anthropicGatewayModelId);
}

export function streamAnthropicChat(
  request: ChatRequest,
  abortSignal?: AbortSignal,
) {
  if (!isSupportedModel(request.modelId)) {
    throw new Error(`Unsupported model: ${request.modelId}`);
  }

  const providerOptions =
    request.levelId === "thinking"
      ? {
          anthropic: {
            thinking: {
              type: "enabled",
              budgetTokens: THINKING_BUDGET_TOKENS,
            },
          } satisfies AnthropicLanguageModelOptions,
        }
      : undefined;

  return streamText({
    model: resolveModel(request.modelId),
    system: SYSTEM_PROMPT,
    prompt: request.prompt,
    abortSignal,
    timeout: REQUEST_TIMEOUT_MS,
    providerOptions,
  });
}
