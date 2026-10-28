import { z } from "zod";

type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
};

const topicIds = [
  "relative-pronouns", "active-passive", "reported-speech", "prepositions", "editing-passages",
  "tenses-verb-forms", "used-to-would", "noun-modifiers", "language-functions", "synonyms",
  "antonyms", "word-formation", "prefixes-suffixes", "spelling-correction", "dictionary-skills",
  "phrasal-verbs-idioms", "word-meanings",
] as const;

const difficultySchema = z.enum(["easy", "medium", "hard"]);
const kindSchema = z.enum(["multiple-choice", "fill-blank", "transformation", "error-identification", "word-form", "matching"]);

const requestSchema = z.object({
  topicId: z.enum(topicIds),
  difficulty: difficultySchema,
  seenFingerprints: z.array(z.string().min(1).max(600)).max(300).default([]),
  focusQuestions: z.array(z.string().min(1).max(600)).max(5).default([]),
}).strict();

const aiQuestionSchema = z.object({
  type: kindSchema,
  prompt: z.string().min(12).max(600),
  options: z.array(z.string().min(1).max(300)).max(4),
  correctAnswer: z.string().min(1).max(300),
  explanation: z.string().min(12).max(800),
  takeaway: z.string().min(8).max(400),
}).strict();

const aiResponseSchema = z.object({
  questions: z.array(aiQuestionSchema).length(15),
}).strict();

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const MAX_BODY_BYTES = 64 * 1024;
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 24000;

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenSimilarity(first: string, second: string): number {
  const a = new Set(normalized(first).split(" ").filter((token) => token.length > 2));
  const b = new Set(normalized(second).split(" ").filter((token) => token.length > 2));
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / (a.size + b.size - shared);
}

function duplicateReason(questions: z.infer<typeof aiResponseSchema>["questions"], seen: string[]): string | null {
  const fingerprints = questions.map((question) => normalized(question.prompt));
  if (new Set(fingerprints).size !== fingerprints.length) return "The generated quiz repeats a question.";
  for (let index = 0; index < questions.length; index += 1) {
    for (let other = index + 1; other < questions.length; other += 1) {
      if (tokenSimilarity(questions[index].prompt, questions[other].prompt) >= 0.82) return "The generated quiz contains near-duplicate questions.";
    }
    if (seen.some((prior) => normalized(prior) === fingerprints[index] || tokenSimilarity(prior, questions[index].prompt) >= 0.88)) {
      return "The generated quiz overlaps with questions already used on this browser.";
    }
  }
  return null;
}

function validateQuestionQuality(questions: z.infer<typeof aiResponseSchema>["questions"]): string | null {
  for (const [index, question] of questions.entries()) {
    const options = question.options.map(normalized);
    if (new Set(options).size !== options.length) return `Question ${index + 1} has repeated answer choices.`;
    if (question.options.length > 0) {
      if (question.options.length !== 4) return `Question ${index + 1} must have either four options or no options.`;
      if (!options.includes(normalized(question.correctAnswer))) return `Question ${index + 1} has no matching correct option.`;
    } else if (question.type === "multiple-choice" || question.type === "matching") {
      return `Question ${index + 1} needs answer options for its question type.`;
    }
    if (/[|;]/.test(question.correctAnswer)) return `Question ${index + 1} has more than one possible answer.`;
    if (normalized(question.prompt).length < 12) return `Question ${index + 1} is not clear enough.`;
  }
  return null;
}

function sendError(res: ApiResponse, status: number, code: string, message: string): void {
  res.status(status).json({ error: { code, message } });
}

async function callGroq(topicId: string, difficulty: string, model: string, baseUrl: string, apiKey: string, previous: string[], focusQuestions: string[]): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const prompt = [
    `Create a fresh Class 10 English quiz for topic ID "${topicId}" at ${difficulty} difficulty.`,
    "Return exactly one JSON object with a questions array containing exactly 15 distinct questions.",
    "Each question must include type, prompt, options, correctAnswer, explanation, and takeaway.",
    "Allowed types: multiple-choice, fill-blank, transformation, error-identification, word-form, matching.",
    "For questions with answer options, provide exactly four distinct options and make correctAnswer exactly equal to one option. For fill-blank and transformation questions, options may be an empty array and correctAnswer must be one unambiguous short answer.",
    "Keep every item accurate, unambiguous, age-appropriate and aligned to the requested topic. Provide one defensible answer only.",
    ...(focusQuestions.length ? [`Emphasise the underlying skills from these missed-question prompts, but create new questions rather than copying them: ${JSON.stringify(focusQuestions)}`] : []),
    "Do not repeat or paraphrase any question in the same quiz. Avoid the previous question fingerprints supplied below.",
    `Previously used fingerprints (avoid these): ${JSON.stringify(previous.slice(-120))}`,
    "Use concise explanations and one practical learning takeaway. Do not include markdown or any extra properties.",
  ].join("\n");

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are an expert Class 10 English teacher. Return valid JSON only. Be precise, fair and educational." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_completion_tokens: 6000,
      }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string | null } }>;
    } | null;
    if (!response.ok) {
      const message = body?.error?.message;
      throw new Error(`Groq returned ${response.status}${message ? `: ${message.slice(0, 240)}` : "."}`);
    }
    const content = body?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned an empty response.");
    try {
      return JSON.parse(content);
    } catch {
      throw new Error("Groq returned malformed JSON.");
    }
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Use POST to generate a quiz.");
    return;
  }

  const lengthHeader = req.headers["content-length"];
  const length = Number(Array.isArray(lengthHeader) ? lengthHeader[0] : lengthHeader ?? 0);
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    sendError(res, 413, "REQUEST_TOO_LARGE", "The quiz request is too large.");
    return;
  }

  const forwarded = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const rate = requestCounts.get(ip);
  if (rate && rate.resetAt > now && rate.count >= 12) {
    sendError(res, 429, "RATE_LIMITED", "Too many quiz requests. Please wait a minute and try again.");
    return;
  }
  requestCounts.set(ip, rate && rate.resetAt > now ? { count: rate.count + 1, resetAt: rate.resetAt } : { count: 1, resetAt: now + 60000 });

  const parsedRequest = requestSchema.safeParse(req.body);
  if (!parsedRequest.success) {
    sendError(res, 400, "INVALID_REQUEST", "Choose a supported topic and difficulty, then try again.");
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    sendError(res, 503, "GROQ_NOT_CONFIGURED", "AI quizzes are not configured on this deployment yet. Add GROQ_API_KEY in the Vercel project settings, or use the offline practice set.");
    return;
  }
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  const baseUrl = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    sendError(res, 500, "INVALID_SERVER_CONFIG", "The Groq base URL is invalid. Check GROQ_BASE_URL in Vercel settings.");
    return;
  }
  if (base.protocol !== "https:" || base.hostname !== "api.groq.com") {
    sendError(res, 500, "INVALID_SERVER_CONFIG", "GROQ_BASE_URL must use the official HTTPS Groq API host.");
    return;
  }

  let lastFailure = "The AI response could not be validated.";
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const raw = await callGroq(parsedRequest.data.topicId, parsedRequest.data.difficulty, model, base.toString(), apiKey, parsedRequest.data.seenFingerprints, parsedRequest.data.focusQuestions);
      const validated = aiResponseSchema.safeParse(raw);
      if (!validated.success) {
        lastFailure = "The AI response did not contain exactly 15 valid questions.";
        continue;
      }
      const qualityFailure = validateQuestionQuality(validated.data.questions);
      if (qualityFailure) {
        lastFailure = qualityFailure;
        continue;
      }
      const duplicateFailure = duplicateReason(validated.data.questions, parsedRequest.data.seenFingerprints);
      if (duplicateFailure) {
        lastFailure = duplicateFailure;
        continue;
      }
      const questions = validated.data.questions.map((question) => {
        const fingerprint = normalized(question.prompt);
        return {
          ...question,
          id: `ai-${crypto.randomUUID()}`,
          topicId: parsedRequest.data.topicId,
          difficulty: parsedRequest.data.difficulty,
          fingerprint,
        };
      });
      res.status(200).json({ questions });
      return;
    } catch (error) {
      lastFailure = error instanceof Error && error.name === "AbortError"
        ? "The quiz generation request timed out. Please retry."
        : error instanceof Error ? error.message.slice(0, 300) : "The Groq request failed.";
      if (attempt + 1 < MAX_RETRIES) continue;
    }
  }
  sendError(res, 502, "QUIZ_GENERATION_FAILED", `${lastFailure} No quiz was started; retry or choose the offline practice set.`);
}