type EstimateItem = {
  name: string;
  cost: number;
};

export type ConstructionEstimate = {
  shareId: string;
  tradeNeeded: string;
  assumptions: string;
  diyHours: number;
  riskFactor: number;
  clarifying_questions: string[];
  materialsBoM: EstimateItem[];
  toolsBoM: EstimateItem[];
  userInput: string;
};

export class GeminiEstimateError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "GeminiEstimateError";
    this.code = code;
    this.details = details;
  }
}

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 18000;
const MAX_IMAGE_ATTACHMENTS = 2;

const getApiKey = () => process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

const buildEstimatePrompt = ({
  description,
  hourlyRate,
  clarificationAnswers,
  hasImages,
}: {
  description: string;
  hourlyRate: number;
  clarificationAnswers: Record<string, string>;
  hasImages: boolean;
}) => {
  const clarificationSummary = Object.entries(clarificationAnswers)
    .filter(([, answer]) => answer.trim().length > 0)
    .map(([question, answer]) => `- ${question}: ${answer}`)
    .join("\n");

  return `
You are the estimate engine for Skills Connect Pro.

Return ONLY valid JSON. No markdown, no fences, no commentary.

Response schema:
{
  "tradeNeeded": string,
  "assumptions": string,
  "diyHours": number,
  "riskFactor": number,
  "clarifying_questions": string[],
  "materialsBoM": [{ "name": string, "cost": number }],
  "toolsBoM": [{ "name": string, "cost": number }]
}

Rules:
- materialsBoM and toolsBoM must always be arrays of objects.
- Each item must use the keys name and cost.
- If crucial information is missing, return clarifying_questions with 1 to 5 short questions and leave materialsBoM and toolsBoM as empty arrays.
- If clarification answers are present, use them to finish the estimate and return clarifying_questions as an empty array.
- Use realistic South African pricing in rand.
- Keep assumptions concise and useful.
- The user's hourly rate is ${hourlyRate}.
- ${hasImages ? "The user attached images and they should inform the estimate." : "No images were attached."}

Project description:
${description}

Clarification answers:
${clarificationSummary || "None provided"}
`;
};

const fileToInlinePart = async (file: File) => {
  const bytes = await file.arrayBuffer();
  return {
    inlineData: {
      mimeType: file.type || "image/jpeg",
      data: Buffer.from(bytes).toString("base64"),
    },
  };
};

const safeParseJson = (value: string) => {
  const trimmed = value.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const payload = fencedMatch?.[1]?.trim() || trimmed;
  return JSON.parse(payload);
};

const normalizeItems = (items: unknown): EstimateItem[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as { name?: unknown; item?: unknown; cost?: unknown };
      const name = typeof candidate.name === "string" && candidate.name.trim().length > 0
        ? candidate.name.trim()
        : typeof candidate.item === "string" && candidate.item.trim().length > 0
          ? candidate.item.trim()
          : "Item";
      const costValue = typeof candidate.cost === "number" ? candidate.cost : Number(candidate.cost);

      if (!Number.isFinite(costValue)) return null;

      return {
        name,
        cost: Math.max(0, Math.round(costValue)),
      };
    })
    .filter((item): item is EstimateItem => item !== null);
};

const parseEstimatePayload = (rawText: string, fallbackDescription: string): ConstructionEstimate => {
  let parsed: any;

  try {
    parsed = safeParseJson(rawText);
  } catch (error) {
    throw new GeminiEstimateError("parse_error", "Gemini returned invalid JSON.", {
      rawText: rawText.slice(0, 2000),
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const clarifyingQuestions = Array.isArray(parsed?.clarifying_questions)
    ? parsed.clarifying_questions.filter((value: unknown) => typeof value === "string" && value.trim().length > 0)
    : [];

  return {
    shareId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    tradeNeeded: typeof parsed?.tradeNeeded === "string" && parsed.tradeNeeded.trim().length > 0
      ? parsed.tradeNeeded.trim()
      : "General Contractor",
    assumptions: typeof parsed?.assumptions === "string" && parsed.assumptions.trim().length > 0
      ? parsed.assumptions.trim()
      : "Estimate generated from the project details provided.",
    diyHours: Number.isFinite(Number(parsed?.diyHours)) ? Math.max(0, Number(parsed.diyHours)) : 0,
    riskFactor: Number.isFinite(Number(parsed?.riskFactor)) ? Math.max(0, Number(parsed.riskFactor)) : 0,
    clarifying_questions: clarifyingQuestions,
    materialsBoM: normalizeItems(parsed?.materialsBoM),
    toolsBoM: normalizeItems(parsed?.toolsBoM),
    userInput: fallbackDescription,
  };
};

export const getConstructionEstimate = async (
  description: string,
  imageFiles: File[] = [],
  hourlyRate = 0,
  clarificationAnswers: Record<string, string> = {}
) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new GeminiEstimateError("missing_api_key", "Missing GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_KEY on the server.");
  }

  const modelParts = [
    {
      text: buildEstimatePrompt({
        description,
        hourlyRate,
        clarificationAnswers,
        hasImages: imageFiles.length > 0,
      }),
    },
    ...(await Promise.all(imageFiles.slice(0, MAX_IMAGE_ATTACHMENTS).map(fileToInlinePart))),
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        generationConfig: { responseMimeType: "application/json" },
        contents: [{ parts: modelParts }],
      }),
    });

    const responseText = await response.text();
    const durationMs = Date.now() - startedAt;

    if (!response.ok) {
      throw new GeminiEstimateError("gemini_http_error", `Gemini responded with HTTP ${response.status}.`, {
        durationMs,
        status: response.status,
        statusText: response.statusText,
        body: responseText.slice(0, 2000),
      });
    }

    const body = JSON.parse(responseText) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const aiText = body.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();

    if (!aiText) {
      throw new GeminiEstimateError("empty_response", "Gemini returned an empty text payload.", {
        durationMs,
        rawBody: responseText.slice(0, 2000),
      });
    }

    return parseEstimatePayload(aiText, description);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new GeminiEstimateError("timeout", `Gemini estimate request timed out after ${REQUEST_TIMEOUT_MS}ms.`);
    }

    if (error instanceof GeminiEstimateError) {
      throw error;
    }

    throw new GeminiEstimateError(
      "unexpected_error",
      error instanceof Error ? error.message : "Unexpected Gemini failure.",
      error instanceof Error ? { stack: error.stack } : { error: String(error) }
    );
  } finally {
    clearTimeout(timeoutId);
  }
};