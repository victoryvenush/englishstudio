export type TopicCategory = "Grammar" | "Vocabulary";
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionKind =
  | "multiple-choice"
  | "fill-blank"
  | "transformation"
  | "error-identification"
  | "word-form"
  | "matching";

export interface Example {
  before: string;
  after: string;
  note: string;
}

export interface PracticeItem {
  prompt: string;
  answer: string;
  options: string[];
  explanation: string;
  takeaway: string;
  type: QuestionKind;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface Topic {
  id: string;
  number: number;
  name: string;
  category: TopicCategory;
  icon: string;
  color: string;
  summary: string;
  lesson: string[];
  keyRule: string;
  examples: Example[];
  mistakes: Example[];
  practice: PracticeItem[];
  flashcards: Flashcard[];
}

export interface QuizQuestion {
  id: string;
  topicId: string;
  difficulty: Difficulty;
  type: QuestionKind;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  takeaway: string;
  fingerprint: string;
}

export type AttemptStatus = "in_progress" | "completed" | "cancelled";

export interface QuizAttempt {
  id: string;
  topicId: string;
  difficulty: Difficulty;
  status: AttemptStatus;
  startedAt: string;
  completedAt: string | null;
  timeLimitSeconds: number;
  timeTakenSeconds: number;
  questions: QuizQuestion[];
  answers: Record<string, string>;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  score: number;
  pointsEarned: number;
  cancellationReason?: string;
  verification: "local" | "imported_unverified";
}

export interface QuestionHistoryEntry {
  fingerprint: string;
  firstSeenAt: string;
  lastSeenAt: string;
  topicId: string;
  questionId: string;
}

export interface FlashcardProgress {
  cardId: string;
  status: "new" | "known" | "review";
  reviewCount: number;
  lastReviewedAt: string | null;
  verification: "local" | "imported_unverified";
}

export interface XPRecord {
  id: string;
  attemptId: string;
  amount: number;
  createdAt: string;
  verification: "local" | "imported_unverified";
}

export interface StoredAwardUnlock {
  id: string;
  unlockedAt: string;
  verification: "local" | "imported_unverified";
}

export interface LearningStats {
  completedQuizzes: number;
  questionsAnswered: number;
  correctAnswers: number;
  totalTimeSeconds: number;
  topicPerformance: Record<string, { quizzes: number; correct: number; answered: number }>;
}

export interface PendingCancellation {
  attemptId: string;
  occurredAt: string;
  reason: string;
}

export interface LearningData {
  attempts: QuizAttempt[];
  questionHistory: QuestionHistoryEntry[];
  flashcards: FlashcardProgress[];
  lessonProgress: string[];
  practiceProgress: Record<string, { attempts: number; correct: boolean; lastAttemptAt: string }>;
  xpRecords: XPRecord[];
  stats: LearningStats;
  awards: StoredAwardUnlock[];
  activityDates: string[];
  localActivityDates: string[];
  activeAttempt: QuizAttempt | null;
  pendingCancellation: PendingCancellation | null;
  lastExportAt: string | null;
  completedAtLastExport: number;
}

export interface AppSettings {
  theme: "light" | "dark";
  reducedMotion: boolean;
}

export interface BackupPackage {
  format: "english-studio-backup";
  version: 1;
  exportedAt: string;
  profile: { displayName: string };
  settings: AppSettings;
  learning: Omit<LearningData, "activeAttempt" | "pendingCancellation">;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  reducedMotion: false,
};

export function emptyStats(): LearningStats {
  return {
    completedQuizzes: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    totalTimeSeconds: 0,
    topicPerformance: {},
  };
}

export function emptyLearningData(): LearningData {
  return {
    attempts: [],
    questionHistory: [],
    flashcards: [],
    lessonProgress: [],
    practiceProgress: {},
    xpRecords: [],
    stats: emptyStats(),
    awards: [],
    activityDates: [],
    localActivityDates: [],
    activeAttempt: null,
    pendingCancellation: null,
    lastExportAt: null,
    completedAtLastExport: 0,
  };
}