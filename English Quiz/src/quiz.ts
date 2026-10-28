import { buildOfflineQuiz, normalizeFingerprint } from "./content";
import type { Difficulty, QuizQuestion, Topic } from "./types";
import { z } from "zod";

const questionSchema = z.object({
  id: z.string().min(4).max(160),
  topicId: z.string().min(2).max(80),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.enum(["multiple-choice", "fill-blank", "transformation", "error-identification", "word-form", "matching"]),
  prompt: z.string().min(8).max(600),
  options: z.array(z.string().min(1).max(300)).max(8),
  correctAnswer: z.string().min(1).max(300),
  explanation: z.string().min(5).max(800),
  takeaway: z.string().min(5).max(400),
  fingerprint: z.string().min(4).max(600),
}).strict();

const responseSchema = z.object({ questions: z.array(questionSchema).length(15) }).strict();

function tokenSimilarity(first: string, second: string): number {
  const a = new Set(normalizeFingerprint(first).split(" ").filter((word) => word.length > 2));
  const b = new Set(normalizeFingerprint(second).split(" ").filter((word) => word.length > 2));
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / (a.size + b.size - shared);
}

function validateQuestions(questions: QuizQuestion[], topicId: string, difficulty: Difficulty, seen: string[]): void {
  if (questions.length !== 15) throw new Error("The quiz service must return exactly 15 questions.");
  const ids = new Set<string>();
  const prompts = new Set<string>();
  for (const question of questions) {
    if (ids.has(question.id)) throw new Error("The quiz service returned duplicate question IDs.");
    ids.add(question.id);
    if (question.topicId !== topicId || question.difficulty !== difficulty) throw new Error("The quiz service returned a question for the wrong topic or difficulty.");
    const fingerprint = normalizeFingerprint(question.prompt);
    if (fingerprint !== question.fingerprint || prompts.has(fingerprint)) throw new Error("The quiz contains duplicate or inconsistent questions.");
    prompts.add(fingerprint);
    if (question.options.length > 0) {
      const options = question.options.map(normalizeFingerprint);
      if (new Set(options).size !== options.length || !options.includes(normalizeFingerprint(question.correctAnswer))) {
        throw new Error("A question has invalid answer options.");
      }
    } else if (question.type === "multiple-choice" || question.type === "matching") {
      throw new Error("A question is missing answer choices.");
    }
    if (seen.some((prior) => normalizeFingerprint(prior) === fingerprint || tokenSimilarity(prior, question.prompt) >= 0.88)) {
      throw new Error("This quiz repeats a question already seen on this browser. Try again for a fresh set.");
    }
  }
  const fingerprints = [...prompts];
  for (let first = 0; first < questions.length; first += 1) {
    for (let second = first + 1; second < questions.length; second += 1) {
      if (tokenSimilarity(fingerprints[first], fingerprints[second]) >= 0.82) {
        throw new Error("The quiz contains near-duplicate questions. Try again for a cleaner set.");
      }
    }
  }
}

export async function generateAIQuiz(topic: Topic, difficulty: Difficulty, seenFingerprints: string[], focusQuestions: string[] = []): Promise<QuizQuestion[]> {
  const response = await fetch("/api/generate-quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topicId: topic.id,
      difficulty,
      seenFingerprints: seenFingerprints.slice(-300),
      focusQuestions: focusQuestions.slice(0, 5),
    }),
  });
  const body = await response.json().catch(() => null) as { error?: { code?: string; message?: string }; questions?: unknown } | null;
  if (!response.ok) {
    throw new Error(body?.error?.message ?? `Quiz generation failed (${response.status}). Check your connection and try again.`);
  }
  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) throw new Error("The AI response could not be validated. No quiz was started; please retry.");
  validateQuestions(parsed.data.questions, topic.id, difficulty, seenFingerprints);
  return parsed.data.questions;
}

export function generateOfflineQuiz(topic: Topic, difficulty: Difficulty, seenFingerprints: string[]): QuizQuestion[] {
  const questions = buildOfflineQuiz(topic, difficulty);
  validateQuestions(questions, topic.id, difficulty, seenFingerprints);
  return questions;
}