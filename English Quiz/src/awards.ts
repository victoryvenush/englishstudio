import { TOPICS } from "./content";
import type { LearningData, QuizAttempt, StoredAwardUnlock, TopicCategory } from "./types";

export type AwardRarity = "Common" | "Rare" | "Epic" | "Legendary" | "Mystic";
export type AwardMetric =
  | "completedQuizzes"
  | "totalXp"
  | "streakDays"
  | "perfectQuizzes"
  | "correctAnswers"
  | "questionsAnswered"
  | "cardsKnown"
  | "cardsReviewed"
  | "topicsPracticed"
  | "topicsMastered"
  | "grammarQuizzes"
  | "vocabularyQuizzes"
  | "easyQuizzes"
  | "mediumQuizzes"
  | "hardQuizzes"
  | "accuracy"
  | "hardCorrectAnswers"
  | "studyDays"
  | "timeMinutes"
  | "flashcardSets"
  | "perfectStreak"
  | "difficultyVariety"
  | "grammarTopicsMastered"
  | "vocabularyTopicsMastered"
  | "highAccuracyTopics"
  | "quizzesInOneDay";

export interface AwardDefinition {
  id: string;
  name: string;
  icon: string;
  rarity: AwardRarity;
  description: string;
  unlockCondition: string;
  progressRule: { metric: AwardMetric; target: number };
}

export interface AwardView extends AwardDefinition {
  unlocked: boolean;
  unlockedAt: string | null;
  verification: "local" | "imported_unverified" | null;
  progress: number;
  progressPercent: number;
}

type Seed = [name: string, icon: string, metric: AwardMetric, target: number];

const COMMON: Seed[] = [
  ["First Steps", "Footprints", "completedQuizzes", 1],
  ["Getting the Rhythm", "Music2", "completedQuizzes", 2],
  ["Three in Motion", "Zap", "completedQuizzes", 3],
  ["Quiz Regular", "BookOpenCheck", "completedQuizzes", 4],
  ["Five Bright Wins", "Sun", "completedQuizzes", 5],
  ["Steady Practice", "Repeat2", "completedQuizzes", 6],
  ["Seven Chapters", "Bookmark", "completedQuizzes", 7],
  ["Eight on the Board", "ListChecks", "completedQuizzes", 8],
  ["Nine and Ready", "Target", "completedQuizzes", 9],
  ["Ten Quiz Trail", "Milestone", "completedQuizzes", 10],
  ["First Spark", "Sparkles", "totalXp", 10],
  ["Pocketful of Points", "CircleDollarSign", "totalXp", 25],
  ["Point Collector", "Coins", "totalXp", 50],
  ["Bright Balance", "Gem", "totalXp", 75],
  ["Century of XP", "Award", "totalXp", 100],
  ["Growing Momentum", "TrendingUp", "totalXp", 150],
  ["Violet Horizon", "Rainbow", "totalXp", 200],
  ["Quarter Turn", "Gauge", "totalXp", 250],
  ["First Study Day", "CalendarCheck", "studyDays", 1],
  ["Two-Day Promise", "CalendarDays", "studyDays", 2],
  ["Three Day Bloom", "Flower2", "studyDays", 3],
  ["Five Days Forward", "CalendarRange", "studyDays", 5],
  ["One Week of Learning", "CalendarHeart", "studyDays", 7],
  ["A Day in a Row", "Flame", "streakDays", 1],
  ["Two-Day Glow", "FlameKindling", "streakDays", 2],
  ["Three-Day Spark", "Flame", "streakDays", 3],
  ["Four-Day Flow", "Waves", "streakDays", 4],
  ["Five-Day Focus", "Focus", "streakDays", 5],
  ["One Week, One Step at a Time", "CalendarHeart", "streakDays", 7],
  ["Ten Correct", "Check", "correctAnswers", 10],
  ["Twenty-Five Correct", "BadgeCheck", "correctAnswers", 25],
  ["Fifty Correct", "CircleCheckBig", "correctAnswers", 50],
  ["Seventy-Five Correct", "ShieldCheck", "correctAnswers", 75],
  ["A Hundred Right", "Trophy", "correctAnswers", 100],
  ["First Card Known", "PanelsTopLeft", "cardsKnown", 1],
  ["Three Cards Click", "Layers2", "cardsKnown", 3],
  ["Five Facts Kept", "Brain", "cardsKnown", 5],
  ["Ten Cards Remembered", "LibraryBig", "cardsKnown", 10],
  ["Fifteen Cards Ready", "NotebookPen", "cardsKnown", 15],
  ["First Card Review", "RotateCcw", "cardsReviewed", 1],
  ["Five Quick Reviews", "RefreshCcw", "cardsReviewed", 5],
  ["Ten Recall Rounds", "Lightbulb", "cardsReviewed", 10],
  ["Twenty Reviews Deep", "Repeat", "cardsReviewed", 20],
  ["Thirty Recall Reps", "BrainCircuit", "cardsReviewed", 30],
  ["One Topic Opened", "Compass", "topicsPracticed", 1],
  ["Two Topic Tour", "Map", "topicsPracticed", 2],
  ["Three Topic Explorer", "MapPinned", "topicsPracticed", 3],
  ["Four Topic Finder", "SearchCheck", "topicsPracticed", 4],
  ["Five Topic Trail", "Route", "topicsPracticed", 5],
  ["Easy Start", "Leaf", "easyQuizzes", 1],
  ["Medium Step", "Mountain", "mediumQuizzes", 1],
  ["Hard First Try", "Swords", "hardQuizzes", 1],
  ["Grammar Gateway", "SpellCheck", "grammarQuizzes", 1],
  ["Vocabulary Vista", "TextSearch", "vocabularyQuizzes", 1],
  ["Fifteen Answers", "ListChecks", "questionsAnswered", 15],
  ["Thirty Answers", "ClipboardCheck", "questionsAnswered", 30],
  ["Forty-Five Answers", "NotebookTabs", "questionsAnswered", 45],
  ["Sixty Answers", "Files", "questionsAnswered", 60],
  ["First Full Set", "CircleDot", "completedQuizzes", 1],
  ["First Hourglass", "Timer", "timeMinutes", 5],
];

const RARE: Seed[] = [
  ["Twelve Quizzes Strong", "Medal", "completedQuizzes", 12],
  ["Fifteen in the Journal", "ScrollText", "completedQuizzes", 15],
  ["Twenty Quiz Climber", "MountainSnow", "completedQuizzes", 20],
  ["Twenty-Five Milestone", "Flag", "completedQuizzes", 25],
  ["Thirty Quiz Voyager", "Navigation", "completedQuizzes", 30],
  ["Five Hundred XP", "Coins", "totalXp", 500],
  ["Six Hundred Fifty XP", "Gem", "totalXp", 650],
  ["Eight Hundred XP", "Badge", "totalXp", 800],
  ["One Thousand XP", "Trophy", "totalXp", 1000],
  ["Twelve-Fifty XP", "Crown", "totalXp", 1250],
  ["Ten-Day Flame", "FlameKindling", "streakDays", 10],
  ["Fourteen-Day Focus", "CalendarHeart", "streakDays", 14],
  ["Three-Week Glow", "SunMedium", "streakDays", 21],
  ["Four-Week Rhythm", "CalendarRange", "streakDays", 28],
  ["Thirty-Day Lantern", "Lamp", "streakDays", 30],
  ["Perfect First", "Star", "perfectQuizzes", 1],
  ["Perfect Pair", "Stars", "perfectQuizzes", 2],
  ["Perfect Trio", "Sparkles", "perfectQuizzes", 3],
  ["Five Flawless Sets", "BadgeCheck", "perfectQuizzes", 5],
  ["Eight Perfect Runs", "Shield", "perfectQuizzes", 8],
  ["One Topic Mastered", "GraduationCap", "topicsMastered", 1],
  ["Two Topic Masters", "School", "topicsMastered", 2],
  ["Three Areas of Strength", "Brain", "topicsMastered", 3],
  ["Four Topic Laureate", "Award", "topicsMastered", 4],
  ["Five Skills in Bloom", "Flower", "topicsMastered", 5],
  ["Twenty Cards Known", "Library", "cardsKnown", 20],
  ["Twenty-Five Card Collection", "PanelsTopLeft", "cardsKnown", 25],
  ["Thirty Memory Marks", "BookmarkCheck", "cardsKnown", 30],
  ["Thirty-Five Cards Held", "BookCopy", "cardsKnown", 35],
  ["Forty Cards Remembered", "BookMarked", "cardsKnown", 40],
  ["Fifty Reviews Strong", "RefreshCw", "cardsReviewed", 50],
  ["Seventy-Five Recall Rounds", "BrainCircuit", "cardsReviewed", 75],
  ["A Hundred Flash Reviews", "RotateCw", "cardsReviewed", 100],
  ["Seventy Percent Club", "ChartNoAxesCombined", "accuracy", 70],
  ["Eighty Percent Clarity", "Gauge", "accuracy", 80],
  ["Eighty-Five Percent Precision", "Crosshair", "accuracy", 85],
  ["Grammar Ten", "BookOpen", "grammarQuizzes", 10],
  ["Grammar Twenty", "LibraryBig", "grammarQuizzes", 20],
  ["Vocabulary Ten", "Languages", "vocabularyQuizzes", 10],
  ["Vocabulary Twenty", "TextQuote", "vocabularyQuizzes", 20],
  ["Ten Study Days", "CalendarDays", "studyDays", 10],
  ["Fifteen Study Days", "CalendarCheck2", "studyDays", 15],
  ["Twenty Study Days", "CalendarClock", "studyDays", 20],
  ["Twenty-Five Day Record", "CalendarFold", "studyDays", 25],
  ["Thirty Days of Effort", "CalendarRange", "studyDays", 30],
];

const EPIC: Seed[] = [
  ["Thirty-Five Quiz Scholar", "GraduationCap", "completedQuizzes", 35],
  ["Forty Quiz Arc", "Route", "completedQuizzes", 40],
  ["Fifty Quiz Champion", "Trophy", "completedQuizzes", 50],
  ["Sixty Quiz Summit", "Mountain", "completedQuizzes", 60],
  ["Seventy-Five Deep Dives", "Compass", "completedQuizzes", 75],
  ["Fifteen Hundred XP", "Gem", "totalXp", 1500],
  ["Two Thousand XP", "Coins", "totalXp", 2000],
  ["Twenty-Five Hundred XP", "Crown", "totalXp", 2500],
  ["Three Thousand XP", "Sparkles", "totalXp", 3000],
  ["Four Thousand XP", "Award", "totalXp", 4000],
  ["Thirty-Five Day Streak", "Flame", "streakDays", 35],
  ["Forty-Five Day Streak", "FlameKindling", "streakDays", 45],
  ["Sixty-Day Current", "Waves", "streakDays", 60],
  ["Seventy-Five Day Rhythm", "Sun", "streakDays", 75],
  ["Ten Perfect Sets", "Stars", "perfectQuizzes", 10],
  ["Fifteen Perfect Sets", "BadgeCheck", "perfectQuizzes", 15],
  ["Twenty Perfect Sets", "ShieldCheck", "perfectQuizzes", 20],
  ["Six Topics Mastered", "School", "topicsMastered", 6],
  ["Eight Topics Mastered", "BookOpenCheck", "topicsMastered", 8],
  ["Ten Topics Mastered", "LibraryBig", "topicsMastered", 10],
  ["Twelve Topics Mastered", "Brain", "topicsMastered", 12],
  ["Five Hard Quizzes", "Swords", "hardQuizzes", 5],
  ["Ten Hard Quizzes", "Shield", "hardQuizzes", 10],
  ["Twenty Hard Quizzes", "MountainSnow", "hardQuizzes", 20],
  ["Ninety Percent Accuracy", "Crosshair", "accuracy", 90],
  ["Ninety-Two Percent Accuracy", "Target", "accuracy", 92],
  ["Four Grammar Topics Mastered", "BookMarked", "grammarTopicsMastered", 4],
  ["Six Grammar Topics Mastered", "Library", "grammarTopicsMastered", 6],
  ["Four Vocabulary Topics Mastered", "Languages", "vocabularyTopicsMastered", 4],
  ["Six Vocabulary Topics Mastered", "SpellCheck2", "vocabularyTopicsMastered", 6],
  ["One Hundred Fifty Reviews", "RefreshCcw", "cardsReviewed", 150],
  ["Two Hundred Fifty Reviews", "RotateCw", "cardsReviewed", 250],
  ["Forty Quiz Days", "CalendarDays", "studyDays", 40],
  ["Fifty Quiz Days", "CalendarRange", "studyDays", 50],
  ["Sixty Study Days", "CalendarHeart", "studyDays", 60],
];

const LEGENDARY: Seed[] = [
  ["Century of Challenges", "Trophy", "completedQuizzes", 100],
  ["One Hundred Twenty-Five Quizzes", "Medal", "completedQuizzes", 125],
  ["One Hundred Fifty Quizzes", "Crown", "completedQuizzes", 150],
  ["Five Thousand XP", "Gem", "totalXp", 5000],
  ["Seven Thousand Five Hundred XP", "Coins", "totalXp", 7500],
  ["Ten Thousand XP", "Award", "totalXp", 10000],
  ["Ninety-Day Streak", "Flame", "streakDays", 90],
  ["One Hundred Twenty-Day Streak", "Sun", "streakDays", 120],
  ["Thirty Perfect Quizzes", "Stars", "perfectQuizzes", 30],
  ["Fifty Perfect Quizzes", "Sparkles", "perfectQuizzes", 50],
  ["Fourteen Topics Mastered", "GraduationCap", "topicsMastered", 14],
  ["All Seventeen Topics Mastered", "School", "topicsMastered", 17],
  ["Every Difficulty Faced", "Swords", "difficultyVariety", 3],
  ["Ninety-Five Percent Accuracy", "Crosshair", "accuracy", 95],
  ["Thirty Hard Challenges", "ShieldCheck", "hardQuizzes", 30],
  ["Fifty Hard Challenges", "MountainSnow", "hardQuizzes", 50],
  ["Five Hundred Learning Minutes", "Timer", "timeMinutes", 500],
  ["Five Hundred Flashcard Reviews", "BrainCircuit", "cardsReviewed", 500],
  ["Every Flashcard Set Reviewed", "PanelsTopLeft", "flashcardSets", 17],
  ["Three Perfect in a Row", "BadgeCheck", "perfectStreak", 3],
  ["Five Perfect in a Row", "Shield", "perfectStreak", 5],
  ["Ten Perfect in a Row", "Badge", "perfectStreak", 10],
  ["Five Quizzes in a Day", "CalendarCheck2", "quizzesInOneDay", 5],
  ["Nine Grammar Topics Mastered", "BookOpenCheck", "grammarTopicsMastered", 9],
  ["Eight Vocabulary Topics Mastered", "Languages", "vocabularyTopicsMastered", 8],
];

const MYSTIC: Seed[] = [
  ["Two Hundred Quizzes", "Trophy", "completedQuizzes", 200],
  ["Three Hundred Quizzes", "Crown", "completedQuizzes", 300],
  ["Fifteen Thousand XP", "Gem", "totalXp", 15000],
  ["Twenty Thousand XP", "Sparkles", "totalXp", 20000],
  ["Thirty Thousand XP", "Award", "totalXp", 30000],
  ["One Hundred Fifty-Day Flame", "Flame", "streakDays", 150],
  ["Two Hundred Day Streak", "Sun", "streakDays", 200],
  ["Three Hundred Sixty-Five Days", "CalendarHeart", "streakDays", 365],
  ["Seventy-Five Perfect Quizzes", "Stars", "perfectQuizzes", 75],
  ["One Hundred Perfect Quizzes", "ShieldCheck", "perfectQuizzes", 100],
  ["Ninety-Eight Percent Accuracy", "Crosshair", "accuracy", 98],
  ["Perfect Accuracy Record", "Target", "accuracy", 100],
  ["Every Topic Mastered", "GraduationCap", "topicsMastered", 17],
  ["Nine Grammar Topics at Mastery", "BookOpenCheck", "grammarTopicsMastered", 9],
  ["Eight Vocabulary Topics at Mastery", "Languages", "vocabularyTopicsMastered", 8],
  ["One Hundred Hard Quizzes", "Swords", "hardQuizzes", 100],
  ["Twenty Perfect in a Row", "Badge", "perfectStreak", 20],
  ["One Hundred Fifty Study Days", "CalendarRange", "studyDays", 150],
  ["Two Thousand Learning Minutes", "Timer", "timeMinutes", 2000],
  ["All Seventeen Card Gardens", "PanelsTopLeft", "flashcardSets", 17],
];

const rarityCounts: Record<AwardRarity, number> = {
  Common: 60,
  Rare: 45,
  Epic: 35,
  Legendary: 25,
  Mystic: 20,
};

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const metricText: Record<AwardMetric, (target: number) => string> = {
  completedQuizzes: (n) => `complete ${n} ${n === 1 ? "quiz" : "quizzes"}`,
  totalXp: (n) => `earn ${n.toLocaleString()} XP from completed learning`,
  streakDays: (n) => `learn on ${n} consecutive calendar days`,
  perfectQuizzes: (n) => `complete ${n} perfect 15-question quizzes`,
  correctAnswers: (n) => `answer ${n.toLocaleString()} questions correctly`,
  questionsAnswered: (n) => `submit answers to ${n.toLocaleString()} quiz questions`,
  cardsKnown: (n) => `mark ${n} different flashcards as known`,
  cardsReviewed: (n) => `review ${n.toLocaleString()} flashcards`,
  topicsPracticed: (n) => `complete quizzes in ${n} different topics`,
  topicsMastered: (n) => `master ${n} topics with at least 80% accuracy across two quizzes`,
  grammarQuizzes: (n) => `complete ${n} grammar quizzes`,
  vocabularyQuizzes: (n) => `complete ${n} vocabulary quizzes`,
  easyQuizzes: (n) => `complete ${n} easy quizzes`,
  mediumQuizzes: (n) => `complete ${n} medium quizzes`,
  hardQuizzes: (n) => `complete ${n} hard quizzes`,
  accuracy: (n) => `reach ${n}% overall accuracy after at least three completed quizzes`,
  hardCorrectAnswers: (n) => `answer ${n} hard-quiz questions correctly`,
  studyDays: (n) => `learn on ${n} different calendar days`,
  timeMinutes: (n) => `spend ${n.toLocaleString()} minutes in completed quizzes`,
  flashcardSets: (n) => `review every flashcard in ${n} different topic sets`,
  perfectStreak: (n) => `complete ${n} perfect quizzes consecutively`,
  difficultyVariety: (n) => `complete quizzes at ${n} different difficulty levels`,
  grammarTopicsMastered: (n) => `master ${n} grammar topics with verified quiz practice`,
  vocabularyTopicsMastered: (n) => `master ${n} vocabulary topics with verified quiz practice`,
  highAccuracyTopics: (n) => `reach at least 90% accuracy in ${n} topics after three quizzes each`,
  quizzesInOneDay: (n) => `complete ${n} quizzes in one calendar day`,
};

function buildGroup(rarity: AwardRarity, seeds: Seed[]): AwardDefinition[] {
  return seeds.map(([name, icon, metric, target]) => {
    const condition = metricText[metric](target);
    return {
      id: `${rarity.toLowerCase()}-${slug(name)}`,
      name,
      icon,
      rarity,
      description: `Earn this award when you ${condition}. Cancelled quizzes never count.`,
      unlockCondition: `To unlock: ${condition}.`,
      progressRule: { metric, target },
    };
  });
}

export const AWARDS: AwardDefinition[] = [
  ...buildGroup("Common", COMMON),
  ...buildGroup("Rare", RARE),
  ...buildGroup("Epic", EPIC),
  ...buildGroup("Legendary", LEGENDARY),
  ...buildGroup("Mystic", MYSTIC),
];

function localCompleted(data: LearningData): QuizAttempt[] {
  return data.attempts.filter((attempt) => attempt.status === "completed" && attempt.verification === "local");
}

function currentStreak(dates: string[]): number {
  const unique = new Set(dates);
  const today = new Date();
  const toKey = (date: Date) => {
    const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
  };
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!unique.has(toKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (unique.has(toKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function topicCategory(topicId: string): TopicCategory | null {
  return TOPICS.find((topic) => topic.id === topicId)?.category ?? null;
}

function masteryByCategory(attempts: QuizAttempt[], category: TopicCategory): number {
  return TOPICS.filter((topic) => {
    if (topic.category !== category) return false;
    const topicAttempts = attempts.filter((attempt) => attempt.topicId === topic.id);
    if (topicAttempts.length < 2) return false;
    const correct = topicAttempts.reduce((sum, attempt) => sum + attempt.correctCount, 0);
    const answered = topicAttempts.reduce((sum, attempt) => sum + attempt.questions.length, 0);
    return answered > 0 && correct / answered >= 0.8;
  }).length;
}

export function metricValue(metric: AwardMetric, data: LearningData): number {
  const attempts = localCompleted(data);
  const cards = data.flashcards.filter((card) => card.verification === "local");
  const correct = attempts.reduce((sum, attempt) => sum + attempt.correctCount, 0);
  const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.questions.length, 0);
  const accuracy = totalQuestions ? (correct / totalQuestions) * 100 : 0;
  const uniqueTopics = new Set(attempts.map((attempt) => attempt.topicId));
  const topicsMastered = TOPICS.filter((topic) => {
    const related = attempts.filter((attempt) => attempt.topicId === topic.id);
    const count = related.reduce((sum, attempt) => sum + attempt.questions.length, 0);
    const right = related.reduce((sum, attempt) => sum + attempt.correctCount, 0);
    return related.length >= 2 && count > 0 && right / count >= 0.8;
  });
  const completedDates = attempts.map((attempt) => attempt.completedAt?.slice(0, 10) ?? "").filter(Boolean);

  switch (metric) {
    case "completedQuizzes": return attempts.length;
    case "totalXp": return data.xpRecords.filter((record) => record.verification === "local").reduce((sum, record) => sum + record.amount, 0);
    case "streakDays": return currentStreak(data.localActivityDates);
    case "perfectQuizzes": return attempts.filter((attempt) => attempt.correctCount === 15).length;
    case "correctAnswers": return correct;
    case "questionsAnswered": return attempts.reduce((sum, attempt) => sum + attempt.correctCount + attempt.incorrectCount, 0);
    case "cardsKnown": return cards.filter((card) => card.status === "known").length;
    case "cardsReviewed": return cards.reduce((sum, card) => sum + card.reviewCount, 0);
    case "topicsPracticed": return uniqueTopics.size;
    case "topicsMastered": return topicsMastered.length;
    case "grammarQuizzes": return attempts.filter((attempt) => topicCategory(attempt.topicId) === "Grammar").length;
    case "vocabularyQuizzes": return attempts.filter((attempt) => topicCategory(attempt.topicId) === "Vocabulary").length;
    case "easyQuizzes": return attempts.filter((attempt) => attempt.difficulty === "easy").length;
    case "mediumQuizzes": return attempts.filter((attempt) => attempt.difficulty === "medium").length;
    case "hardQuizzes": return attempts.filter((attempt) => attempt.difficulty === "hard").length;
    case "accuracy": return attempts.length >= 3 ? accuracy : 0;
    case "hardCorrectAnswers": return attempts.filter((attempt) => attempt.difficulty === "hard").reduce((sum, attempt) => sum + attempt.correctCount, 0);
    case "studyDays": return new Set(data.localActivityDates).size;
    case "timeMinutes": return Math.floor(attempts.reduce((sum, attempt) => sum + attempt.timeTakenSeconds, 0) / 60);
    case "flashcardSets": return TOPICS.filter((topic) => topic.flashcards.every((flashcard) => {
      const record = cards.find((card) => card.cardId === `${topic.id}:${flashcard.id}`);
      return Boolean(record && record.reviewCount > 0);
    })).length;
    case "perfectStreak": {
      const sorted = [...attempts].sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
      let streak = 0;
      for (const attempt of sorted) {
        if (attempt.correctCount !== 15) break;
        streak += 1;
      }
      return streak;
    }
    case "difficultyVariety": return new Set(attempts.map((attempt) => attempt.difficulty)).size;
    case "grammarTopicsMastered": return masteryByCategory(attempts, "Grammar");
    case "vocabularyTopicsMastered": return masteryByCategory(attempts, "Vocabulary");
    case "highAccuracyTopics": return TOPICS.filter((topic) => {
      const related = attempts.filter((attempt) => attempt.topicId === topic.id);
      const questions = related.reduce((sum, attempt) => sum + attempt.questions.length, 0);
      const right = related.reduce((sum, attempt) => sum + attempt.correctCount, 0);
      return related.length >= 3 && questions > 0 && right / questions >= 0.9;
    }).length;
    case "quizzesInOneDay": {
      const counts = completedDates.reduce<Record<string, number>>((map, date) => {
        map[date] = (map[date] ?? 0) + 1;
        return map;
      }, {});
      return Math.max(0, ...Object.values(counts));
    }
  }
}

export function getAwardViews(data: LearningData): AwardView[] {
  const unlocked = new Map(data.awards.map((award) => [award.id, award]));
  return AWARDS.map((award) => {
    const record = unlocked.get(award.id);
    const value = metricValue(award.progressRule.metric, data);
    return {
      ...award,
      unlocked: Boolean(record),
      unlockedAt: record?.unlockedAt ?? null,
      verification: record?.verification ?? null,
      progress: Math.min(value, award.progressRule.target),
      progressPercent: Math.min(100, (value / award.progressRule.target) * 100),
    };
  });
}

export function unlockEligibleAwards(data: LearningData, now = new Date().toISOString()): { data: LearningData; newlyUnlocked: AwardDefinition[] } {
  const unlockedIds = new Set(data.awards.map((award) => award.id));
  const eligible = AWARDS.filter((award) => !unlockedIds.has(award.id) && metricValue(award.progressRule.metric, data) >= award.progressRule.target);
  if (eligible.length === 0) return { data, newlyUnlocked: [] };
  const newUnlocks: StoredAwardUnlock[] = eligible.map((award) => ({ id: award.id, unlockedAt: now, verification: "local" }));
  return {
    data: { ...data, awards: [...data.awards, ...newUnlocks] },
    newlyUnlocked: eligible,
  };
}

const countCheck: [AwardRarity, Seed[], number][] = [
  ["Common", COMMON, 60],
  ["Rare", RARE, 45],
  ["Epic", EPIC, 35],
  ["Legendary", LEGENDARY, 25],
  ["Mystic", MYSTIC, 20],
];

if (AWARDS.length !== 185 || countCheck.some(([rarity, seeds, expected]) => seeds.length !== expected || rarityCounts[rarity] !== expected)) {
  throw new Error("The Awards Vault definition does not match its 185-award specification.");
}
if (new Set(AWARDS.map((award) => award.id)).size !== 185 || new Set(AWARDS.map((award) => award.name)).size !== 185) {
  throw new Error("Award IDs and names must be unique.");
}