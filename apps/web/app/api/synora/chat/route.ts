import {
  isSupportedModel,
  streamAnthropicChat,
} from "@/features/synora/api/anthropic-chat";
import { chatRequestSchema } from "@/features/synora/schemas/chat";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!isSupportedModel(parsed.data.modelId)) {
    return Response.json({ error: "Unsupported model" }, { status: 400 });
  }

  try {
    const result = streamAnthropicChat(parsed.data, request.signal);
    return result.toTextStreamResponse();
  } catch {
    return Response.json({ error: "Upstream request failed" }, { status: 502 });
  }
}
