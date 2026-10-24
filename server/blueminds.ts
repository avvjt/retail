import { GoogleGenAI } from "@google/genai";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface BluemindsCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}

export function getBluemindsApiKey(): string {
  return process.env.BLUEMINDS_API_KEY || process.env.GPT_API_KEY || process.env.OPENAI_API_KEY || "";
}

export function getBluemindsBaseUrl(): string {
  let url = process.env.BLUEMINDS_BASE_URL || "https://api.blueminds.com/v1";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, "");
}

export function getBluemindsModel(): string {
  return process.env.BLUEMINDS_MODEL || "gpt-5.5";
}

async function fallbackGeminiCompletion(options: BluemindsCompletionOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("No fallback AI provider configured.");
  }
  const ai = new GoogleGenAI({
    apiKey: apiKey
  });

  let systemText = "";
  const contents: any[] = [];
  
  for (const m of options.messages) {
    if (m.role === "system") {
      const text = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
      systemText += (systemText ? "\n\n" : "") + text;
    } else {
      const role = m.role === "assistant" ? "model" : "user";
      if (typeof m.content === "string") {
        contents.push({ role, parts: [{ text: m.content }] });
      } else if (Array.isArray(m.content)) {
        const parts: any[] = [];
        for (const item of m.content) {
          if (item.type === "text" && item.text) {
            parts.push({ text: item.text });
          } else if (item.type === "image_url" && item.image_url?.url) {
            const url = item.image_url.url;
            if (url.startsWith("data:")) {
              const matches = url.match(/^data:([^;]+);base64,(.+)$/);
              if (matches) {
                parts.push({
                  inlineData: {
                    mimeType: matches[1],
                    data: matches[2]
                  }
                });
              }
            }
          }
        }
        contents.push({ role, parts: parts.length > 0 ? parts : [{ text: "" }] });
      }
    }
  }
  
  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "Hello" }] });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction: systemText || undefined,
      temperature: options.temperature ?? 0.4,
      responseMimeType: options.response_format?.type === "json_object" ? "application/json" : undefined,
    }
  });

  return response.text || "";
}


export function getGroqApiKey(): string {
  return process.env.GROQ_API_KEY || "";
}

let bluemindsCircuitOpenUntil = 0;

export async function createBluemindsCompletion(options: BluemindsCompletionOptions): Promise<string> {
  const bluemindsApiKey = getBluemindsApiKey();
  const baseUrl = getBluemindsBaseUrl();
  const defaultModel = options.model || getBluemindsModel();
  
  const bluemindsEndpoint = baseUrl.endsWith("/v1") 
     ? `${baseUrl}/chat/completions` 
     : `${baseUrl}/v1/chat/completions`;

  async function tryOpenAICompatibleApi(endpoint: string, apiKey: string, modelName: string, timeoutMs = 4000): Promise<string> {
    const payload: any = {
      model: modelName,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
    };
    if (options.max_tokens) payload.max_tokens = options.max_tokens;
    if (options.response_format) payload.response_format = options.response_format;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs); 
    
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "api-key": apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText || response.statusText}`);
      }
      
      const data: any = await response.json();
      const content = data?.choices?.[0]?.message?.content || data?.message?.content || data?.response || data?.text || "";
      if (!content) throw new Error("Empty content returned");
      return typeof content === "string" ? content : JSON.stringify(content);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  const errors: string[] = [];

  // 1. Blueminds (gpt-5.5) with circuit breaker
  const isCircuitOpen = Date.now() < bluemindsCircuitOpenUntil;
  if (bluemindsApiKey && !isCircuitOpen) {
    try {
      return await tryOpenAICompatibleApi(bluemindsEndpoint, bluemindsApiKey, defaultModel || "gpt-5.5", 3500);
    } catch (err: any) {
      // Trip circuit breaker for 10 minutes to prevent stalling user requests
      bluemindsCircuitOpenUntil = Date.now() + 10 * 60 * 1000;
      console.info(`[AI Cascade] Primary provider temporarily unavailable (${err.message}). Route seamlessly active via Groq.`);
      errors.push(`Blueminds: ${err.message}`);
    }
  } else if (bluemindsApiKey && isCircuitOpen) {
    // Circuit open: silently route to fast inference tier
    errors.push("Blueminds: Circuit breaker open, routing via Groq");
  } else {
    errors.push(`Blueminds: No API key configured`);
  }

  // 2. Groq (Ultra-fast SOTA inference: openai/gpt-oss-120b -> openai/gpt-oss-20b)
  const groqApiKey = getGroqApiKey();
  if (groqApiKey) {
    try {
      return await tryOpenAICompatibleApi("https://api.groq.com/openai/v1/chat/completions", groqApiKey, "openai/gpt-oss-120b", 8000);
    } catch {
      try {
        return await tryOpenAICompatibleApi("https://api.groq.com/openai/v1/chat/completions", groqApiKey, "openai/gpt-oss-20b", 8000);
      } catch (err: any) {
        errors.push(`Groq: ${err.message}`);
      }
    }
  } else {
    errors.push(`Groq: No API key configured`);
  }

  // 3. Gemini fallback (gemini-3.6-flash)
  try {
    return await fallbackGeminiCompletion(options);
  } catch (err: any) {
    errors.push(`Gemini: ${err.message}`);
    
    throw new Error(JSON.stringify({
      message: "AI Analysis completely failed.",
      details: errors.join(" | ")
    }));
  }
}
