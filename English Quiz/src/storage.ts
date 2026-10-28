import { unlockEligibleAwards, type AwardDefinition } from "./awards";
import { normalizeFingerprint } from "./content";
import {
  DEFAULT_SETTINGS,
  emptyLearningData,
  emptyStats,
  type AppSettings,
  type Difficulty,
  type FlashcardProgress,
  type LearningData,
  type QuizAttempt,
  type QuizQuestion,
  type QuestionHistoryEntry,
} from "./types";

const DATABASE_NAME = "english-studio-local";
const DATABASE_VERSION = 1;
const STATE_STORE = "learning-state";
const STATE_KEY = "student-progress";
const NAME_KEY = "english-studio:name";
const SETTINGS_KEY = "english-studio:settings";
const INTERRUPTION_KEY = "english-studio:quiz-interruption";

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("This browser does not support IndexedDB storage."));
  }
  databasePromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STATE_STORE)) db.createObjectStore(STATE_STORE, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local learning storage."));
    request.onblocked = () => reject(new Error("Local storage is busy in another tab. Close the other English Studio tab and try again."));
  });
  return databasePromise;
}

function normalizeLearningData(value: unknown): LearningData {
  if (!value || typeof value !== "object") return emptyLearningData();
  const candidate = value as Partial<LearningData>;
  const fallback = emptyLearningData();
  return {
    ...fallback,
    ...candidate,
    attempts: Array.isArray(candidate.attempts) ? candidate.attempts : [],
    questionHistory: Array.isArray(candidate.questionHistory) ? candidate.questionHistory : [],
    flashcards: Array.isArray(candidate.flashcards) ? candidate.flashcards : [],
    lessonProgress: Array.isArray(candidate.lessonProgress) ? candidate.lessonProgress : [],
    practiceProgress: candidate.practiceProgress && typeof candidate.practiceProgress === "object" ? candidate.practiceProgress : {},
    xpRecords: Array.isArray(candidate.xpRecords) ? candidate.xpRecords : [],
    stats: candidate.stats && typeof candidate.stats === "object" ? candidate.stats : emptyStats(),
    awards: Array.isArray(candidate.awards) ? candidate.awards : [],
    activityDates: Array.isArray(candidate.activityDates) ? candidate.activityDates : [],
    localActivityDates: Array.isArray(candidate.localActivityDates) ? candidate.localActivityDates : [],
    activeAttempt: candidate.activeAttempt ?? null,
    pendingCancellation: candidate.pendingCancellation ?? null,
    lastExportAt: candidate.lastExportAt ?? null,
    completedAtLastExport: Number.isFinite(candidate.completedAtLastExport) ? candidate.completedAtLastExport! : 0,
  };
}

interface StoredState {
  key: string;
  value: LearningData;
}

export async function readLearningData(): Promise<LearningData> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STATE_STORE, "readonly");
    const request = transaction.objectStore(STATE_STORE).get(STATE_KEY) as IDBRequest<StoredState | undefined>;
    request.onsuccess = () => resolve(normalizeLearningData(request.result?.value));
    request.onerror = () => reject(request.error ?? new Error("Could not read local learning data."));
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not read local learning data."));
  });
}

async function updateLearningData<T>(
  mutate: (current: LearningData) => { data: LearningData; result: T },
): Promise<{ data: LearningData; result: T }> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STATE_STORE, "readwrite");
    const store = transaction.objectStore(STATE_STORE);
    const request = store.get(STATE_KEY) as IDBRequest<StoredState | undefined>;
    let nextData: LearningData | null = null;
    let result!: T;
    request.onsuccess = () => {
      try {
        const changed = mutate(normalizeLearningData(request.result?.value));
        nextData = changed.data;
        result = changed.result;
        store.put({ key: STATE_KEY, value: changed.data } satisfies StoredState);
      } catch (error) {
        transaction.abort();
        reject(error);
      }
    };
    transaction.oncomplete = () => {
      if (nextData) resolve({ data: nextData, result });
      else reject(new Error("Local learning data was not updated."));
    };
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save local learning data."));
    transaction.onabort = () => reject(transaction.error ?? new Error("The local data update was cancelled."));
  });
}

export function getStudentName(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveStudentName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_KEY, name.trim().slice(0, 32));
}

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      theme: parsed.theme === "dark" ? "dark" : "light",
      reducedMotion: Boolean(parsed.reducedMotion),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getLocalDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addActivity(data: LearningData, date = getLocalDateKey()): LearningData {
  return {
    ...data,
    activityDates: [...new Set([...data.activityDates, date])].sort(),
    localActivityDates: [...new Set([...data.localActivityDates, date])].sort(),
  };
}

function cancelledRecord(active: QuizAttempt, reason: string, at: string): QuizAttempt {
  return {
    ...active,
    status: "cancelled",
    completedAt: null,
    timeTakenSeconds: 0,
    questions: [],
    answers: {},
    correctCount: 0,
    incorrectCount: 0,
    unansweredCount: 0,
    score: 0,
    pointsEarned: 0,
    cancellationReason: reason,
    verification: "local",
    startedAt: active.startedAt || at,
  };
}

function deriveStats(attempts: QuizAttempt[]): LearningData["stats"] {
  const completed = attempts.filter((attempt) => attempt.status === "completed");
  const topicPerformance: LearningData["stats"]["topicPerformance"] = {};
  for (const attempt of completed) {
    const entry = topicPerformance[attempt.topicId] ?? { quizzes: 0, correct: 0, answered: 0 };
    entry.quizzes += 1;
    entry.correct += attempt.correctCount;
    entry.answered += attempt.correctCount + attempt.incorrectCount;
    topicPerformance[attempt.topicId] = entry;
  }
  return {
    completedQuizzes: completed.length,
    questionsAnswered: completed.reduce((sum, attempt) => sum + attempt.correctCount + attempt.incorrectCount, 0),
    correctAnswers: completed.reduce((sum, attempt) => sum + attempt.correctCount, 0),
    totalTimeSeconds: completed.reduce((sum, attempt) => sum + attempt.timeTakenSeconds, 0),
    topicPerformance,
  };
}

export async function reconcileInterruptedAttempt(): Promise<LearningData> {
  const now = new Date().toISOString();
  let interruptedId = "";
  const { data } = await updateLearningData((current) => {
    const interruptedFlag = (() => {
      try { return window.localStorage.getItem(INTERRUPTION_KEY); } catch { return null; }
    })();
    const active = current.activeAttempt;
    if (!active || active.status !== "in_progress") return { data: current, result: undefined };
    interruptedId = active.id;
    const reason = interruptedFlag === active.id
      ? "The active quiz was interrupted by a page exit or refresh."
      : "An active quiz cannot safely resume after the page was reopened.";
    const record = cancelledRecord(active, reason, now);
    const next: LearningData = {
      ...current,
      attempts: [record, ...current.attempts.filter((attempt) => attempt.id !== active.id)],
      activeAttempt: null,
      pendingCancellation: { attemptId: active.id, occurredAt: now, reason },
    };
    next.stats = deriveStats(next.attempts);
    return { data: next, result: undefined };
  });
  if (interruptedId) {
    try { window.localStorage.removeItem(INTERRUPTION_KEY); } catch { /* storage may be disabled */ }
  }
  return data;
}

export async function clearPendingCancellation(): Promise<LearningData> {
  return (await updateLearningData((current) => ({ data: { ...current, pendingCancellation: null }, result: undefined }))).data;
}

export async function beginQuiz(input: {
  id: string;
  topicId: string;
  difficulty: Difficulty;
  startedAt: string;
  timeLimitSeconds: number;
  questions: QuizQuestion[];
}): Promise<QuizAttempt> {
  if (input.questions.length !== 15) throw new Error("A quiz must contain exactly 15 valid questions.");
  const attempt: QuizAttempt = {
    ...input,
    status: "in_progress",
    completedAt: null,
    timeTakenSeconds: 0,
    answers: {},
    correctCount: 0,
    incorrectCount: 0,
    unansweredCount: 15,
    score: 0,
    pointsEarned: 0,
    verification: "local",
  };
  const { result } = await updateLearningData((current) => {
    if (current.activeAttempt?.status === "in_progress") {
      throw new Error("An earlier quiz attempt is still active. It must be cancelled before another quiz can start.");
    }
    return {
      data: { ...current, activeAttempt: attempt, pendingCancellation: null },
      result: attempt,
    };
  });
  try { window.localStorage.removeItem(INTERRUPTION_KEY); } catch { /* storage may be disabled */ }
  return result;
}

export async function saveQuizAnswer(attemptId: string, questionId: string, answer: string): Promise<LearningData> {
  return (await updateLearningData((current) => {
    const active = current.activeAttempt;
    if (!active || active.id !== attemptId || active.status !== "in_progress") return { data: current, result: undefined };
    if (!active.questions.some((question) => question.id === questionId)) return { data: current, result: undefined };
    const answers = { ...active.answers };
    if (answer.trim()) answers[questionId] = answer.trim().slice(0, 500);
    else delete answers[questionId];
    return { data: { ...current, activeAttempt: { ...active, answers } }, result: undefined };
  })).data;
}

export async function cancelQuiz(attemptId: string, reason: string): Promise<{ data: LearningData; cancelled: boolean }> {
  const occurredAt = new Date().toISOString();
  try { window.localStorage.setItem(INTERRUPTION_KEY, attemptId); } catch { /* IndexedDB remains authoritative where possible */ }
  const result = await updateLearningData<boolean>((current) => {
    const active = current.activeAttempt;
    if (!active || active.id !== attemptId || active.status !== "in_progress") {
      return { data: current, result: false };
    }
    const record = cancelledRecord(active, reason, occurredAt);
    const next: LearningData = {
      ...current,
      attempts: [record, ...current.attempts.filter((attempt) => attempt.id !== attemptId)],
      activeAttempt: null,
      pendingCancellation: { attemptId, occurredAt, reason },
    };
    next.stats = deriveStats(next.attempts);
    return { data: next, result: true };
  });
  try { window.localStorage.removeItem(INTERRUPTION_KEY); } catch { /* storage may be disabled */ }
  return { data: result.data, cancelled: result.result };
}

function isCorrect(answer: string | undefined, correctAnswer: string): boolean {
  return normalizeFingerprint(answer ?? "") === normalizeFingerprint(correctAnswer);
}

export async function completeQuiz(
  attemptId: string,
  answers: Record<string, string>,
  timeTakenSeconds: number,
): Promise<{ data: LearningData; attempt: QuizAttempt | null; newlyUnlocked: AwardDefinition[] }> {
  const completedAt = new Date().toISOString();
  const result = await updateLearningData<{ attempt: QuizAttempt | null; newlyUnlocked: AwardDefinition[] }>((current) => {
    const active = current.activeAttempt;
    if (!active || active.id !== attemptId || active.status !== "in_progress") {
      return { data: current, result: { attempt: null, newlyUnlocked: [] } };
    }
    try {
      if (window.localStorage.getItem(INTERRUPTION_KEY) === attemptId) {
        return { data: current, result: { attempt: null, newlyUnlocked: [] } };
      }
    } catch { /* the persisted attempt state still guards completion */ }
    const cleanAnswers: Record<string, string> = {};
    for (const question of active.questions) {
      const answer = answers[question.id]?.trim();
      if (answer) cleanAnswers[question.id] = answer.slice(0, 500);
    }
    const correctCount = active.questions.filter((question) => isCorrect(cleanAnswers[question.id], question.correctAnswer)).length;
    const answeredCount = Object.keys(cleanAnswers).length;
    const incorrectCount = answeredCount - correctCount;
    const unansweredCount = active.questions.length - answeredCount;
    const bonus = active.difficulty === "easy" ? 10 : active.difficulty === "medium" ? 20 : 30;
    const score = correctCount * 10 + bonus + (correctCount === 15 ? 25 : 0);
    const elapsed = Math.min(active.timeLimitSeconds, Math.max(0, Math.floor(timeTakenSeconds)));
    const attempt: QuizAttempt = {
      ...active,
      status: "completed",
      completedAt,
      timeTakenSeconds: elapsed,
      answers: cleanAnswers,
      correctCount,
      incorrectCount,
      unansweredCount,
      score,
      pointsEarned: score,
      verification: "local",
    };
    const existing = current.attempts.find((item) => item.id === attemptId);
    if (existing?.status === "completed") return { data: current, result: { attempt: existing, newlyUnlocked: [] } };

    const historyByFingerprint = new Map(current.questionHistory.map((entry) => [entry.fingerprint, entry]));
    for (const question of active.questions) {
      const prior = historyByFingerprint.get(question.fingerprint);
      const entry: QuestionHistoryEntry = {
        fingerprint: question.fingerprint,
        firstSeenAt: prior?.firstSeenAt ?? completedAt,
        lastSeenAt: completedAt,
        topicId: question.topicId,
        questionId: question.id,
      };
      historyByFingerprint.set(question.fingerprint, entry);
    }
    let next: LearningData = {
      ...current,
      attempts: [attempt, ...current.attempts.filter((item) => item.id !== attemptId)],
      questionHistory: [...historyByFingerprint.values()],
      xpRecords: [...current.xpRecords.filter((record) => record.attemptId !== attemptId), {
        id: `xp-${attemptId}`,
        attemptId,
        amount: score,
        createdAt: completedAt,
        verification: "local",
      }],
      activeAttempt: null,
      pendingCancellation: null,
    };
    next = addActivity(next);
    next.stats = deriveStats(next.attempts);
    const awardResult = unlockEligibleAwards(next, completedAt);
    next = awardResult.data;
    return { data: next, result: { attempt, newlyUnlocked: awardResult.newlyUnlocked } };
  });
  if (result.result.attempt) {
    try { window.localStorage.removeItem(INTERRUPTION_KEY); } catch { /* storage may be disabled */ }
  }
  return { data: result.data, ...result.result };
}

export async function updateFlashcardProgress(cardId: string, status: "known" | "review"): Promise<{ data: LearningData; newlyUnlocked: AwardDefinition[] }> {
  const now = new Date().toISOString();
  const result = await updateLearningData<{ newlyUnlocked: AwardDefinition[] }>((current) => {
    const prior = current.flashcards.find((card) => card.cardId === cardId);
    const nextCard: FlashcardProgress = {
      cardId,
      status,
      reviewCount: (prior?.reviewCount ?? 0) + 1,
      lastReviewedAt: now,
      verification: "local",
    };
    let next = addActivity({
      ...current,
      flashcards: [nextCard, ...current.flashcards.filter((card) => card.cardId !== cardId)],
    });
    const awardResult = unlockEligibleAwards(next, now);
    next = awardResult.data;
    return { data: next, result: { newlyUnlocked: awardResult.newlyUnlocked } };
  });
  return { data: result.data, ...result.result };
}

export async function markLessonComplete(topicId: string): Promise<{ data: LearningData; newlyUnlocked: AwardDefinition[] }> {
  const now = new Date().toISOString();
  return updateLearningData((current) => {
    let next = addActivity({ ...current, lessonProgress: [...new Set([...current.lessonProgress, topicId])] });
    const awardResult = unlockEligibleAwards(next, now);
    next = awardResult.data;
    return { data: next, result: { newlyUnlocked: awardResult.newlyUnlocked } };
  }).then(({ data, result }) => ({ data, ...result }));
}

export async function recordPracticeResult(topicId: string, questionIndex: number, correct: boolean): Promise<LearningData> {
  const now = new Date().toISOString();
  const key = `${topicId}:${questionIndex}`;
  return (await updateLearningData((current) => {
    const prior = current.practiceProgress[key];
    let next = addActivity({
      ...current,
      practiceProgress: {
        ...current.practiceProgress,
        [key]: { attempts: (prior?.attempts ?? 0) + 1, correct, lastAttemptAt: now },
      },
    });
    const awardResult = unlockEligibleAwards(next, now);
    next = awardResult.data;
    return { data: next, result: undefined };
  })).data;
}

export async function clearQuestionHistory(): Promise<LearningData> {
  return (await updateLearningData((current) => ({ data: { ...current, questionHistory: [] }, result: undefined }))).data;
}

export async function resetLearningProgress(): Promise<LearningData> {
  const { data } = await updateLearningData(() => ({ data: emptyLearningData(), result: undefined }));
  try { window.localStorage.removeItem(INTERRUPTION_KEY); } catch { /* storage may be disabled */ }
  return data;
}

export async function replaceLearningData(data: LearningData): Promise<LearningData> {
  const normalized = normalizeLearningData(data);
  return (await updateLearningData(() => ({ data: normalized, result: undefined }))).data;
}

export async function mergeLearningData(imported: LearningData): Promise<LearningData> {
  return (await updateLearningData((current) => {
    const attempts = new Map(current.attempts.map((attempt) => [attempt.id, attempt]));
    for (const attempt of imported.attempts) if (!attempts.has(attempt.id)) attempts.set(attempt.id, { ...attempt, verification: "imported_unverified" });
    const questionHistory = new Map(current.questionHistory.map((entry) => [entry.fingerprint, entry]));
    for (const entry of imported.questionHistory) {
      const prior = questionHistory.get(entry.fingerprint);
      questionHistory.set(entry.fingerprint, prior ? {
        ...prior,
        firstSeenAt: prior.firstSeenAt < entry.firstSeenAt ? prior.firstSeenAt : entry.firstSeenAt,
        lastSeenAt: prior.lastSeenAt > entry.lastSeenAt ? prior.lastSeenAt : entry.lastSeenAt,
      } : entry);
    }
    const flashcards = new Map(current.flashcards.map((card) => [card.cardId, card]));
    for (const card of imported.flashcards) {
      if (!flashcards.has(card.cardId)) flashcards.set(card.cardId, { ...card, verification: "imported_unverified" });
    }
    const xpRecords = new Map(current.xpRecords.map((record) => [record.attemptId, record]));
    for (const record of imported.xpRecords) {
      if (!xpRecords.has(record.attemptId)) xpRecords.set(record.attemptId, { ...record, verification: "imported_unverified" });
    }
    const awards = new Map(current.awards.map((award) => [award.id, award]));
    for (const award of imported.awards) {
      if (!awards.has(award.id)) awards.set(award.id, { ...award, verification: "imported_unverified" });
    }
    let next: LearningData = {
      ...current,
      attempts: [...attempts.values()],
      questionHistory: [...questionHistory.values()],
      flashcards: [...flashcards.values()],
      lessonProgress: [...new Set([...current.lessonProgress, ...imported.lessonProgress])],
      practiceProgress: { ...imported.practiceProgress, ...current.practiceProgress },
      xpRecords: [...xpRecords.values()],
      awards: [...awards.values()],
      activityDates: [...new Set([...current.activityDates, ...imported.activityDates])].sort(),
      localActivityDates: [...new Set(current.localActivityDates)].sort(),
      activeAttempt: null,
      pendingCancellation: null,
    };
    next.stats = deriveStats(next.attempts);
    return { data: next, result: undefined };
  })).data;
}

export async function markBackupExported(): Promise<LearningData> {
  const now = new Date().toISOString();
  return (await updateLearningData((current) => ({
    data: { ...current, lastExportAt: now, completedAtLastExport: current.stats.completedQuizzes },
    result: undefined,
  }))).data;
}

export async function saveInterruptedFlag(attemptId: string): Promise<void> {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(INTERRUPTION_KEY, attemptId); } catch { /* best effort during page exit */ }
}

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/[.!?]+$/g, "").replace(/\s+/g, " ");
}

export function quizTimeLimit(difficulty: Difficulty): number {
  return difficulty === "easy" ? 8 * 60 : difficulty === "medium" ? 12 * 60 : 15 * 60;
}

export function getQuestionTypeLabel(question: QuizQuestion): string {
  const labels: Record<QuizQuestion["type"], string> = {
    "multiple-choice": "Multiple choice",
    "fill-blank": "Fill in the blank",
    transformation: "Sentence transformation",
    "error-identification": "Error correction",
    "word-form": "Word form",
    matching: "Match the meaning",
  };
  return labels[question.type];
}