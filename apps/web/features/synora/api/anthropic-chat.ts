import { createAnthropic } from "@ai-sdk/anthropic";
import type { AnthropicLanguageModelOptions } from "@ai-sdk/anthropic";
import { streamText } from "ai";

import type { ChatRequest } from "../schemas/chat";

const GATEWAY_MODELS: Record<string, string> = {
  "claude-sonnet-4-5": "claude-sonnet-4-5",
};

const REQUEST_TIMEOUT_MS = 60_000;
const THINKING_BUDGET_TOKENS = 12_000;

export function isSupportedModel(modelId: string): boolean {
  return modelId in GATEWAY_MODELS;
}

/**
 * The gateway docs use the official `@anthropic-ai/sdk` with
 * `baseURL: http://127.0.0.1:8000/v1`; that SDK appends `/v1/messages`,
 * so the documented final URL is `<host>/v1/v1/messages`.
 * `@ai-sdk/anthropic` appends only `/messages`, so this helper builds
 * `<host>/v1/v1` from either env form (`<host>` or `<host>/v1`).
 */
function normalizeBaseUrl(raw: string): string {
  const trimmed = raw
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/\/+$/, "");
  const documented = trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
  return `${documented}/v1`;
}

function readGatewayEnv() {
  const baseURL = process.env.ANTHROPIC_GATEWAY_BASE_URL;
  const apiKey = process.env.ANTHROPIC_GATEWAY_API_KEY;
  if (!baseURL || !apiKey) {
    throw new Error(
      "ANTHROPIC_GATEWAY_BASE_URL and ANTHROPIC_GATEWAY_API_KEY must be set",
    );
  }
  return {
    baseURL: normalizeBaseUrl(baseURL),
    apiKey: apiKey.trim().replace(/^['"]+|['"]+$/g, ""),
  };
}

export function streamAnthropicChat(
  request: ChatRequest,
  abortSignal?: AbortSignal,
) {
  const gatewayModelId = GATEWAY_MODELS[request.modelId];
  if (!gatewayModelId) {
    throw new Error(`Unsupported model: ${request.modelId}`);
  }

  const { baseURL, apiKey } = readGatewayEnv();
  const anthropic = createAnthropic({ baseURL, apiKey });

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
    model: anthropic(gatewayModelId),
    prompt: request.prompt,
    abortSignal,
    timeout: REQUEST_TIMEOUT_MS,
    providerOptions,
  });
}
