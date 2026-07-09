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

const OPENROUTER_MODELS: Record<string, string> = {
  "claude-sonnet-4-5": "nvidia/nemotron-3-super-120b-a12b:free",
};

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const REQUEST_TIMEOUT_MS = 60_000;
const THINKING_BUDGET_TOKENS = 12_000;

const SYSTEM_PROMPT =
  "Ты — ассистент Синоры, продукта Genora Pro. Отвечай на русском языке, если пользователь не попросил иначе. Подстраивай длину ответа под запрос: на приветствие или короткую реплику отвечай одной-двумя дружелюбными фразами без списков и заголовков. На содержательный вопрос начинай с сути, используй короткие абзацы; маркированные списки добавляй только когда перечисление действительно упрощает чтение. Для вопросов об интерфейсах предлагай конкретные размеры, отступы, типографику и цвета. Никогда не вставляй в ответ блоки кода, листинги или многострочные примеры кода: Синора пишет код в песочнице сама, а в чате объясняет подход словами — описывай решение, шаги и структуру обычным текстом. Допустим только короткий инлайн-код в одинарных бэктиках для имён функций, файлов, команд и параметров. Пиши ясно и профессионально, без слов-паразитов и лишних вводных.";

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

type ResolvedModel = {
  model: LanguageModel;
  supportsThinking: boolean;
};

const LOCAL_GATEWAY_PROBE_TIMEOUT_MS = 700;
const LOCAL_GATEWAY_PROBE_TTL_MS = 30_000;

let localGatewayProbe: { reachable: boolean; checkedAt: number } | null = null;

function isLocalHostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

async function isGatewayReachable(baseUrl: string): Promise<boolean> {
  if (!isLocalHostUrl(baseUrl)) {
    return true;
  }
  const now = Date.now();
  if (
    localGatewayProbe &&
    now - localGatewayProbe.checkedAt < LOCAL_GATEWAY_PROBE_TTL_MS
  ) {
    return localGatewayProbe.reachable;
  }
  let reachable = false;
  try {
    const { origin } = new URL(baseUrl);
    await fetch(origin, {
      method: "HEAD",
      signal: AbortSignal.timeout(LOCAL_GATEWAY_PROBE_TIMEOUT_MS),
    });
    reachable = true;
  } catch {
    reachable = false;
  }
  localGatewayProbe = { reachable, checkedAt: now };
  return reachable;
}

async function resolveModel(modelId: string): Promise<ResolvedModel> {
  const anthropicGatewayModelId = ANTHROPIC_GATEWAY_MODELS[modelId];
  const vercelGatewayModelId = VERCEL_GATEWAY_MODELS[modelId];
  const openRouterModelId = OPENROUTER_MODELS[modelId];
  if (!anthropicGatewayModelId || !vercelGatewayModelId || !openRouterModelId) {
    throw new Error(`Unsupported model: ${modelId}`);
  }

  const anthropicBaseUrl =
    process.env.ANTHROPIC_GATEWAY_BASE_URL_OVERRIDE ??
    process.env.ANTHROPIC_GATEWAY_BASE_URL;
  const anthropicApiKey = process.env.ANTHROPIC_GATEWAY_API_KEY;
  if (
    anthropicBaseUrl &&
    anthropicApiKey &&
    (await isGatewayReachable(anthropicBaseUrl))
  ) {
    const anthropic = createAnthropic({
      baseURL: normalizeBaseUrl(anthropicBaseUrl),
      apiKey: anthropicApiKey.trim().replace(/^['"]+|['"]+$/g, ""),
    });
    return { model: anthropic(anthropicGatewayModelId), supportsThinking: true };
  }

  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (openRouterApiKey) {
    const key = openRouterApiKey.trim().replace(/^['"]+|['"]+$/g, "");
    const openRouter = createAnthropic({
      baseURL: OPENROUTER_BASE_URL,
      apiKey: key,
      headers: { authorization: `Bearer ${key}` },
    });
    return { model: openRouter(openRouterModelId), supportsThinking: false };
  }

  if (process.env.AI_GATEWAY_API_KEY) {
    return { model: vercelGatewayModelId, supportsThinking: true };
  }

  throw new Error(
    "Set ANTHROPIC_GATEWAY_BASE_URL and ANTHROPIC_GATEWAY_API_KEY, OPENROUTER_API_KEY, or AI_GATEWAY_API_KEY",
  );
}

export async function streamAnthropicChat(
  request: ChatRequest,
  abortSignal?: AbortSignal,
) {
  if (!isSupportedModel(request.modelId)) {
    throw new Error(`Unsupported model: ${request.modelId}`);
  }

  const { model, supportsThinking } = await resolveModel(request.modelId);

  const providerOptions =
    request.levelId === "thinking" && supportsThinking
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
    model,
    system: SYSTEM_PROMPT,
    prompt: request.prompt,
    abortSignal,
    timeout: REQUEST_TIMEOUT_MS,
    providerOptions,
  });
}
