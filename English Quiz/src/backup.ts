import { AWARDS, metricValue } from "./awards";
import { normalizeFingerprint, TOPICS, TOPIC_BY_ID } from "./content";
import {
  DEFAULT_SETTINGS,
  emptyLearningData,
  type AppSettings,
  type BackupPackage,
  type LearningData,
  type QuizAttempt,
} from "./types";
import { quizTimeLimit } from "./storage";
import { z } from "zod";

const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
const MAX_ATTEMPTS = 5000;
const MAX_QUESTION_HISTORY = 15000;
const MAX_FLASHCARDS = 1000;
const MAX_XP_RECORDS = 5000;

function validDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

const timestamp = z.string().min(10).max(40).refine(validDate, "Expected a valid timestamp.");
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const safeId = z.string().min(1).max(160).regex(/^[A-Za-z0-9:_-]+$/);
const difficulty = z.enum(["easy", "medium", "hard"]);
const questionType = z.enum(["multiple-choice", "fill-blank", "transformation", "error-identification", "word-form", "matching"]);

const questionSchema = z.object({
  id: safeId,
  topicId: z.string().min(2).max(80),
  difficulty,
  type: questionType,
  prompt: z.string().min(8).max(600),
  options: z.array(z.string().min(1).max(300)).max(8),
  correctAnswer: z.string().min(1).max(300),
  explanation: z.string().min(5).max(800),
  takeaway: z.string().min(5).max(400),
  fingerprint: z.string().min(4).max(600),
}).strict();

const attemptSchema = z.object({
  id: safeId,
  topicId: z.string().min(2).max(80),
  difficulty,
  status: z.enum(["completed", "cancelled"]),
  startedAt: timestamp,
  completedAt: timestamp.nullable(),
  timeLimitSeconds: z.number().int().min(1).max(900),
  timeTakenSeconds: z.number().int().min(0).max(900),
  questions: z.array(questionSchema).max(15),
  answers: z.record(z.string().max(160), z.string().max(500)),
  correctCount: z.number().int().min(0).max(15),
  incorrectCount: z.number().int().min(0).max(15),
  unansweredCount: z.number().int().min(0).max(15),
  score: z.number().int().min(0).max(205),
  pointsEarned: z.number().int().min(0).max(205),
  cancellationReason: z.string().max(240).optional(),
  verification: z.enum(["local", "imported_unverified"]),
}).strict();

const learningSchema = z.object({
  attempts: z.array(attemptSchema).max(MAX_ATTEMPTS),
  questionHistory: z.array(z.object({
    fingerprint: z.string().min(4).max(600),
    firstSeenAt: timestamp,
    lastSeenAt: timestamp,
    topicId: z.string().min(2).max(80),
    questionId: safeId,
  }).strict()).max(MAX_QUESTION_HISTORY),
  flashcards: z.array(z.object({
    cardId: safeId,
    status: z.enum(["new", "known", "review"]),
    reviewCount: z.number().int().min(0).max(100000),
    lastReviewedAt: timestamp.nullable(),
    verification: z.enum(["local", "imported_unverified"]),
  }).strict()).max(MAX_FLASHCARDS),
  lessonProgress: z.array(z.string().min(2).max(80)).max(17),
  practiceProgress: z.record(z.string().min(2).max(100), z.object({
    attempts: z.number().int().min(1).max(100000),
    correct: z.boolean(),
    lastAttemptAt: timestamp,
  }).strict()),
  xpRecords: z.array(z.object({
    id: safeId,
    attemptId: safeId,
    amount: z.number().int().min(0).max(205),
    createdAt: timestamp,
    verification: z.enum(["local", "imported_unverified"]),
  }).strict()).max(MAX_XP_RECORDS),
  stats: z.object({
    completedQuizzes: z.number().int().min(0).max(MAX_ATTEMPTS),
    questionsAnswered: z.number().int().min(0).max(MAX_ATTEMPTS * 15),
    correctAnswers: z.number().int().min(0).max(MAX_ATTEMPTS * 15),
    totalTimeSeconds: z.number().int().min(0).max(MAX_ATTEMPTS * 900),
    topicPerformance: z.record(z.string().min(2).max(80), z.object({
      quizzes: z.number().int().min(0).max(MAX_ATTEMPTS),
      correct: z.number().int().min(0).max(MAX_ATTEMPTS * 15),
      answered: z.number().int().min(0).max(MAX_ATTEMPTS * 15),
    }).strict()),
  }).strict(),
  awards: z.array(z.object({
    id: safeId,
    unlockedAt: timestamp,
    verification: z.enum(["local", "imported_unverified"]),
  }).strict()).max(185),
  activityDates: z.array(dateKey).max(10000),
  localActivityDates: z.array(dateKey).max(10000),
  lastExportAt: timestamp.nullable(),
  completedAtLastExport: z.number().int().min(0).max(MAX_ATTEMPTS),
}).strict();

const settingsSchema = z.object({
  theme: z.enum(["light", "dark"]),
  reducedMotion: z.boolean(),
}).strict();

const backupSchema = z.object({
  format: z.literal("english-studio-backup"),
  version: z.literal(1),
  exportedAt: timestamp,
  profile: z.object({ displayName: z.string().min(1).max(32) }).strict(),
  settings: settingsSchema,
  learning: learningSchema,
}).strict();

export interface BackupPreview {
  exportedAt: string;
  displayName: string;
  quizAttempts: number;
  completedQuizzes: number;
  cancelledQuizzes: number;
  flashcardRecords: number;
  questionFingerprints: number;
  unlockedAwards: number;
  xp: number;
}

function expectedScore(attempt: QuizAttempt, correct: number): number {
  const completion = attempt.difficulty === "easy" ? 10 : attempt.difficulty === "medium" ? 20 : 30;
  return correct * 10 + completion + (correct === 15 ? 25 : 0);
}

function recomputeStats(attempts: QuizAttempt[]): LearningData["stats"] {
  const completed = attempts.filter((attempt) => attempt.status === "completed");
  const topicPerformance: LearningData["stats"]["topicPerformance"] = {};
  for (const attempt of completed) {
    const topic = topicPerformance[attempt.topicId] ?? { quizzes: 0, correct: 0, answered: 0 };
    topic.quizzes += 1;
    topic.correct += attempt.correctCount;
    topic.answered += attempt.correctCount + attempt.incorrectCount;
    topicPerformance[attempt.topicId] = topic;
  }
  return {
    completedQuizzes: completed.length,
    questionsAnswered: completed.reduce((sum, attempt) => sum + attempt.correctCount + attempt.incorrectCount, 0),
    correctAnswers: completed.reduce((sum, attempt) => sum + attempt.correctCount, 0),
    totalTimeSeconds: completed.reduce((sum, attempt) => sum + attempt.timeTakenSeconds, 0),
    topicPerformance,
  };
}

function sameStats(first: LearningData["stats"], second: LearningData["stats"]): boolean {
  const stable = (value: unknown): string => {
    if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
    if (value && typeof value === "object") {
      const object = value as Record<string, unknown>;
      return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stable(object[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  };
  return stable(first) === stable(second);
}

function validateConsistency(backup: BackupPackage): string | null {
  const { learning } = backup;
  const attemptIds = new Set<string>();
  const questionByFingerprint = new Map<string, { topicId: string; questionId: string }>();
  for (const attempt of learning.attempts) {
    if (attemptIds.has(attempt.id)) return "The backup contains duplicate quiz attempt IDs.";
    attemptIds.add(attempt.id);
    if (!TOPIC_BY_ID[attempt.topicId]) return "The backup references a topic this version does not recognize.";
    if (attempt.timeLimitSeconds !== quizTimeLimit(attempt.difficulty)) return "A quiz timer in this backup does not match its difficulty.";
    if (attempt.status === "cancelled") {
      if (attempt.score !== 0 || attempt.pointsEarned !== 0 || attempt.correctCount !== 0 || attempt.incorrectCount !== 0 || attempt.unansweredCount !== 0 || attempt.questions.length !== 0 || Object.keys(attempt.answers).length !== 0 || !attempt.cancellationReason) {
        return "A cancelled quiz contains rewards or answer data and cannot be restored.";
      }
      continue;
    }
    if (attempt.questions.length !== 15 || !attempt.completedAt) return "Every completed quiz must contain exactly 15 questions and a completion time.";
    if (attempt.timeTakenSeconds > attempt.timeLimitSeconds) return "A quiz duration is longer than its time limit.";
    const questionIds = new Set<string>();
    const fingerprints = new Set<string>();
    for (const question of attempt.questions) {
      if (questionIds.has(question.id) || question.topicId !== attempt.topicId || question.difficulty !== attempt.difficulty) {
        return "A completed quiz contains conflicting question records.";
      }
      questionIds.add(question.id);
      const fingerprint = normalizeFingerprint(question.prompt);
      if (fingerprint !== question.fingerprint || fingerprints.has(fingerprint)) return "A completed quiz contains duplicate or inconsistent questions.";
      fingerprints.add(fingerprint);
      if (question.options.length > 0) {
        const normalizedOptions = question.options.map(normalizeFingerprint);
        if (new Set(normalizedOptions).size !== question.options.length || !normalizedOptions.includes(normalizeFingerprint(question.correctAnswer))) {
          return "A question has contradictory answer choices.";
        }
      }
      questionByFingerprint.set(question.fingerprint, { topicId: question.topicId, questionId: question.id });
    }
    if (Object.keys(attempt.answers).some((id) => !questionIds.has(id))) return "A quiz answer does not match a question in the backup.";
    const answered = Object.values(attempt.answers).filter((answer) => answer.trim()).length;
    const correct = attempt.questions.filter((question) => normalizeFingerprint(attempt.answers[question.id] ?? "") === normalizeFingerprint(question.correctAnswer)).length;
    const incorrect = answered - correct;
    const unanswered = 15 - answered;
    if (correct !== attempt.correctCount || incorrect !== attempt.incorrectCount || unanswered !== attempt.unansweredCount) {
      return "A quiz result does not match its saved answers.";
    }
    const score = expectedScore(attempt, correct);
    if (attempt.score !== score || attempt.pointsEarned !== score) return "A quiz score does not match the English Studio scoring rules.";
  }

  const xpIds = new Set<string>();
  const xpByAttempt = new Map<string, number>();
  for (const record of learning.xpRecords) {
    if (xpIds.has(record.id) || xpByAttempt.has(record.attemptId)) return "The backup contains duplicate XP records.";
    xpIds.add(record.id);
    xpByAttempt.set(record.attemptId, record.amount);
    const attempt = learning.attempts.find((item) => item.id === record.attemptId);
    if (!attempt || attempt.status !== "completed" || record.amount !== attempt.pointsEarned) return "An XP record does not match a completed quiz.";
  }
  for (const attempt of learning.attempts) {
    if (attempt.status === "completed" && xpByAttempt.get(attempt.id) !== attempt.pointsEarned) return "A completed quiz is missing its matching XP record.";
  }

  const flashcardIds = new Set<string>();
  const flashcardKeys = new Set(TOPICS.flatMap((topic) => topic.flashcards.map((card) => `${topic.id}:${card.id}`)));
  for (const card of learning.flashcards) {
    if (flashcardIds.has(card.cardId) || !flashcardKeys.has(card.cardId)) return "The backup contains an unknown or duplicate flashcard record.";
    if ((card.status === "new" && card.reviewCount > 0) || (card.reviewCount > 0 && !card.lastReviewedAt)) return "A flashcard progress record is inconsistent.";
    flashcardIds.add(card.cardId);
  }

  if (new Set(learning.lessonProgress).size !== learning.lessonProgress.length || learning.lessonProgress.some((topicId) => !TOPIC_BY_ID[topicId])) {
    return "The backup contains an unknown or duplicate completed lesson.";
  }
  for (const key of Object.keys(learning.practiceProgress)) {
    const [topicId, itemIndex, extra] = key.split(":");
    if (extra !== undefined || !TOPIC_BY_ID[topicId] || !/^\d+$/.test(itemIndex) || Number(itemIndex) > 4) {
      return "The backup contains an invalid lesson practice record.";
    }
  }

  const awardIds = new Set<string>();
  const knownAwardIds = new Set(AWARDS.map((award) => award.id));
  for (const award of learning.awards) {
    if (awardIds.has(award.id) || !knownAwardIds.has(award.id)) return "The backup contains an unknown or duplicate award record.";
    awardIds.add(award.id);
  }

  for (const entry of learning.questionHistory) {
    if (!TOPIC_BY_ID[entry.topicId]) return "Question history references an unknown topic.";
    const match = questionByFingerprint.get(entry.fingerprint);
    if (!match || match.topicId !== entry.topicId) return "Question history does not match a saved completed quiz.";
  }

  const calculatedStats = recomputeStats(learning.attempts);
  if (!sameStats(calculatedStats, learning.stats)) return "The saved statistics do not match the quiz history.";
  const previewData: LearningData = {
    ...emptyLearningData(),
    ...learning,
  };
  for (const award of learning.awards) {
    if (award.verification === "local") {
      const definition = AWARDS.find((item) => item.id === award.id);
      if (definition && metricValue(definition.progressRule.metric, previewData) < definition.progressRule.target) {
        return `The saved condition for the award "${definition.name}" does not match the learning history.`;
      }
    }
  }
  return null;
}

export function createBackup(name: string, settings: AppSettings, data: LearningData, exportedAt = new Date().toISOString()): BackupPackage {
  const { activeAttempt: _active, pendingCancellation: _pending, ...learning } = data;
  return {
    format: "english-studio-backup",
    version: 1,
    exportedAt,
    profile: { displayName: name.trim().slice(0, 32) },
    settings: { ...settings },
    learning,
  };
}

export function validateBackupText(text: string, byteLength = new TextEncoder().encode(text).byteLength): { backup: BackupPackage; preview: BackupPreview } {
  if (byteLength > MAX_BACKUP_BYTES) throw new Error("This backup is larger than 10 MB and cannot be imported safely.");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON. Choose an English Studio backup file.");
  }
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(issue ? `Backup validation failed: ${issue.message}` : "This file is not a supported English Studio backup.");
  }
  const backup = parsed.data as BackupPackage;
  const consistencyError = validateConsistency(backup);
  if (consistencyError) throw new Error(consistencyError);
  return {
    backup,
    preview: {
      exportedAt: backup.exportedAt,
      displayName: backup.profile.displayName,
      quizAttempts: backup.learning.attempts.length,
      completedQuizzes: backup.learning.attempts.filter((attempt) => attempt.status === "completed").length,
      cancelledQuizzes: backup.learning.attempts.filter((attempt) => attempt.status === "cancelled").length,
      flashcardRecords: backup.learning.flashcards.length,
      questionFingerprints: backup.learning.questionHistory.length,
      unlockedAwards: backup.learning.awards.length,
      xp: backup.learning.xpRecords.reduce((sum, record) => sum + record.amount, 0),
    },
  };
}

export function toImportedLearningData(backup: BackupPackage): LearningData {
  return {
    ...emptyLearningData(),
    ...backup.learning,
    attempts: backup.learning.attempts.map((attempt) => ({ ...attempt, verification: "imported_unverified" })),
    flashcards: backup.learning.flashcards.map((card) => ({ ...card, verification: "imported_unverified" })),
    xpRecords: backup.learning.xpRecords.map((record) => ({ ...record, verification: "imported_unverified" })),
    awards: backup.learning.awards.map((award) => ({ ...award, verification: "imported_unverified" })),
    localActivityDates: [],
    activeAttempt: null,
    pendingCancellation: null,
    lastExportAt: null,
    completedAtLastExport: 0,
  };
}

export function backupSettings(value: AppSettings | null | undefined): AppSettings {
  return value ?? DEFAULT_SETTINGS;
}

export function importNoticeMode(mode: "replace" | "merge"): string {
  return mode === "replace"
    ? "This replaces the learning data currently saved in this browser. The current profile name and preferences will also be replaced by the backup."
    : "This adds compatible records from the backup. Existing records with the same stable ID are kept. Imported learning records are labelled unverified because browser backups cannot be tamper-proof.";
}