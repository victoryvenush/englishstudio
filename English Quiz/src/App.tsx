import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft, ArrowLeftRight, ArrowRight, Award, Badge, BadgeCheck, BookCopy, BookMarked, BookOpen, BookOpenCheck,
  Bookmark, BookmarkCheck, Brain, BrainCircuit, CalendarCheck, CalendarCheck2, CalendarClock, CalendarDays,
  CalendarFold, CalendarHeart, CalendarRange, ChartNoAxesCombined, Check, ChevronDown, ChevronRight, Circle,
  CircleCheck, CircleCheckBig, CircleDollarSign, CircleDot, CircleHelp, CircleX, ClipboardCheck, ClipboardList,
  Clock3, Coins, Combine, Compass, Crosshair, Crown, DatabaseZap, Download, FilePenLine, Files, Fingerprint,
  Flag, FlagTriangleRight, Flame, FlameKindling, Flower, Flower2, Focus, Footprints, Gauge, Gem, GitMerge,
  GraduationCap, HardDrive, HardDriveDownload, History, House, Info, Keyboard, Lamp, Languages, Layers2,
  Layers3, Leaf, Library, LibraryBig, Lightbulb, ListChecks, LoaderCircle, LockKeyhole, LogOut, Map, MapPin,
  MapPinned, Medal, MessageCircleHeart, MessagesSquare, Milestone, Minus, Moon, Mountain, MountainSnow, Music2,
  Navigation, NotebookPen, NotebookTabs, Orbit, Palette, PanelsTopLeft, Play, Puzzle, Rainbow, RefreshCcw,
  RefreshCw, Repeat, Repeat2, Replace, RotateCcw, RotateCw, Route, Save, School, ScrollText, Search,
  SearchCheck, SearchX, Send, Settings2, Shield, ShieldAlert, ShieldCheck, Shuffle, Sparkles, SpellCheck,
  SpellCheck2, Star, Stars, Sun, SunMedium, Swords, Target, TextCursorInput, TextQuote, TextSearch, Timer,
  Trash2, TrendingUp, TriangleAlert, Trophy, Upload, UserRound, Waves, WholeWord, X, Zap,
  type LucideIcon,
} from "lucide-react";
import { AWARDS, getAwardViews, type AwardRarity, type AwardView } from "./awards";
import { createBackup, importNoticeMode, toImportedLearningData, validateBackupText, type BackupPreview } from "./backup";
import { normalizeFingerprint, TOPICS, TOPIC_BY_ID } from "./content";
import { generateAIQuiz, generateOfflineQuiz } from "./quiz";
import {
  beginQuiz,
  cancelQuiz,
  clearPendingCancellation,
  clearQuestionHistory,
  completeQuiz,
  getQuestionTypeLabel,
  getSettings,
  getStudentName,
  markBackupExported,
  markLessonComplete,
  mergeLearningData,
  readLearningData,
  reconcileInterruptedAttempt,
  recordPracticeResult,
  resetLearningProgress,
  saveInterruptedFlag,
  saveSettings,
  saveStudentName,
  saveQuizAnswer,
  updateFlashcardProgress,
  quizTimeLimit,
  normalizeAnswer,
  replaceLearningData,
} from "./storage";
import {
  DEFAULT_SETTINGS,
  emptyLearningData,
  type AppSettings,
  type BackupPackage,
  type Difficulty,
  type LearningData,
  type QuizQuestion,
  type Topic,
} from "./types";

type View = "welcome" | "home" | "learn" | "lesson" | "flashcards" | "awards" | "settings" | "quiz-setup" | "quiz-active" | "quiz-cancelled" | "results";
type NavView = "home" | "learn" | "flashcards" | "awards" | "settings";
type ToastState = { title: string; description?: string; tone: "success" | "info" | "warning" };
type DialogState = {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onConfirm: () => void | Promise<void>;
};
type PendingImport = { backup: BackupPackage; preview: BackupPreview; filename: string };

const LOCAL_NOTICE = "Your progress is saved on this browser and device. It does not automatically sync across devices. Clearing browser data may erase your progress. Download your JSON backup regularly so you can restore your learning data if needed.";
const BACKUP_REMINDER = "Protect your progress! Download your English Studio JSON backup regularly. Your learning data is stored only in this browser and may be lost if browser data is cleared or your device is changed.";
const BACKUP_REMINDER_KEY = "english-studio:backup-reminder-dismissed";

const iconComponents: Record<string, LucideIcon> = {
  ArrowLeft, ArrowLeftRight, ArrowRight, Award, Badge, BadgeCheck, BookCopy, BookMarked, BookOpen, BookOpenCheck,
  Bookmark, BookmarkCheck, Brain, BrainCircuit, CalendarCheck, CalendarCheck2, CalendarClock, CalendarDays,
  CalendarFold, CalendarHeart, CalendarRange, ChartNoAxesCombined, Check, ChevronDown, ChevronRight, Circle,
  CircleCheck, CircleCheckBig, CircleDollarSign, CircleDot, CircleHelp, CircleX, ClipboardCheck, ClipboardList,
  Clock3, Coins, Combine, Compass, Crosshair, Crown, DatabaseZap, Download, FilePenLine, Files, Fingerprint,
  Flag, FlagTriangleRight, Flame, FlameKindling, Flower, Flower2, Focus, Footprints, Gauge, Gem, GitMerge,
  GraduationCap, HardDrive, HardDriveDownload, History, House, Info, Keyboard, Lamp, Languages, Layers2,
  Layers3, Leaf, Library, LibraryBig, Lightbulb, ListChecks, LoaderCircle, LockKeyhole, LogOut, Map, MapPin,
  MapPinned, Medal, MessageCircleHeart, MessagesSquare, Milestone, Minus, Moon, Mountain, MountainSnow, Music2,
  Navigation, NotebookPen, NotebookTabs, Orbit, Palette, PanelsTopLeft, Play, Puzzle, Rainbow, RefreshCcw,
  RefreshCw, Repeat, Repeat2, Replace, RotateCcw, RotateCw, Route, Save, School, ScrollText, Search,
  SearchCheck, SearchX, Send, Settings2, Shield, ShieldAlert, ShieldCheck, Shuffle, Sparkles, SpellCheck,
  SpellCheck2, Star, Stars, Sun, SunMedium, Swords, Target, TextCursorInput, TextQuote, TextSearch, Timer,
  Trash2, TrendingUp, TriangleAlert, Trophy, Upload, UserRound, Waves, WholeWord, X, Zap,
};

function Icon({ name, size = 20, className = "", strokeWidth = 1.9 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  const IconComponent = iconComponents[name] ?? Sparkles;
  return <IconComponent size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`surface border-line rounded-[24px] border ${className}`}>{children}</div>;
}

function Button({
  children,
  onClick,
  variant = "primary",
  icon,
  className = "",
  disabled = false,
  type = "button",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark";
  icon?: string;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  title?: string;
}) {
  const variants: Record<NonNullable<typeof variant>, string> = {
    primary: "bg-[#5B5FEF] text-white shadow-[0_10px_22px_rgba(91,95,239,.2)] hover:bg-[#4f53df]",
    secondary: "surface border border-line text-ink hover:border-[#b9bbfa] hover:bg-soft",
    ghost: "text-muted hover:bg-soft hover:text-ink",
    danger: "bg-[#FFF0F0] text-[#C94949] hover:bg-[#FFE3E3]",
    dark: "bg-[#171A2E] text-white hover:bg-[#282b45]",
  };
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B5FEF]/20 disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
    >
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

function ProgressBar({ value, color = "#5B5FEF", height = "h-2" }: { value: number; color?: string; height?: string }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-[#E9EAF5] ${height}`} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`${height} rounded-full transition-[width] duration-700`} style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }} />
    </div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#5B5FEF] to-[#8B5CF6] text-white shadow-[0_8px_20px_rgba(91,95,239,.25)]">
        <Icon name="BookOpenCheck" size={22} />
      </div>
      {!compact && (
        <div className="min-w-0 leading-tight">
          <div className="text-[17px] font-extrabold tracking-[-.04em] text-ink">English Studio</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[.15em] text-muted">Learn with momentum</div>
        </div>
      )}
    </div>
  );
}

function LocalDataNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex gap-3 rounded-2xl border border-[#DFE0FF] bg-[#F2F1FF] px-4 py-3.5 text-sm text-[#4f5178] ${compact ? "text-xs leading-5" : "leading-6"}`}>
      <Icon name="ShieldCheck" size={19} className="mt-0.5 shrink-0 text-[#5B5FEF]" />
      <p>{LOCAL_NOTICE}</p>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <div className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#5B5FEF]">{eyebrow}</div>}
        <h1 className="text-2xl font-extrabold tracking-[-.045em] text-ink sm:text-[32px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const topicTone: Record<string, { background: string; foreground: string }> = {
  indigo: { background: "bg-[#F0F0FF]", foreground: "text-[#5B5FEF]" },
  violet: { background: "bg-[#F4EEFF]", foreground: "text-[#8353DF]" },
  coral: { background: "bg-[#FFF0EF]", foreground: "text-[#E66565]" },
  mint: { background: "bg-[#EAFBF5]", foreground: "text-[#159C74]" },
  sky: { background: "bg-[#EAF7FF]", foreground: "text-[#248BC1]" },
};

function TopicTile({ topic, progress, lessonDone, onClick }: { topic: Topic; progress?: { quizzes: number; correct: number; answered: number }; lessonDone: boolean; onClick: () => void }) {
  const tone = topicTone[topic.color] ?? topicTone.indigo;
  const accuracy = progress?.answered ? Math.round((progress.correct / progress.answered) * 100) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="surface border-line group flex min-h-[178px] flex-col rounded-[23px] border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#c4c5f8] hover:shadow-[0_14px_32px_rgba(39,42,88,.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B5FEF]/20 sm:p-5"
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-[15px] ${tone.background} ${tone.foreground}`}><Icon name={topic.icon} size={21} /></div>
        <span className="rounded-full bg-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-muted">{topic.category}</span>
      </div>
      <div className="mt-4 text-[10px] font-bold uppercase tracking-[.14em] text-muted">Topic {String(topic.number).padStart(2, "0")}</div>
      <h3 className="mt-1.5 text-[15px] font-bold leading-5 text-ink">{topic.name}</h3>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{topic.summary}</p>
      <div className="mt-auto flex w-full items-center justify-between gap-2 pt-4 text-[11px] font-semibold text-muted">
        <span>{lessonDone ? "Lesson saved" : progress?.quizzes ? `${progress.quizzes} quiz${progress.quizzes === 1 ? "" : "zes"}` : "Ready to explore"}</span>
        {accuracy !== null && <span className="text-[#5B5FEF]">{accuracy}% mastery</span>}
        {lessonDone && <Icon name="CircleCheck" size={15} className="text-[#21AF82]" />}
      </div>
    </button>
  );
}

function NavButton({ icon, label, active, onClick, mobile = false }: { icon: string; label: string; active: boolean; onClick: () => void; mobile?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`${mobile ? "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px]" : "flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-3.5 text-sm"} font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B5FEF]/20 ${active ? "bg-[#F0F0FF] text-[#5559E8]" : "text-muted hover:bg-soft hover:text-ink"}`}
    >
      <Icon name={icon} size={mobile ? 20 : 19} />
      <span className="truncate">{label}</span>
    </button>
  );
}

function difficultyLabel(difficulty: Difficulty): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

function formatClock(seconds: number): string {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function currentStreak(dates: string[]): number {
  const set = new Set(dates);
  const today = new Date();
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const key = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (!set.has(key(cursor))) cursor.setDate(cursor.getDate() - 1);
  let days = 0;
  while (set.has(key(cursor))) {
    days += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return days;
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "ES";
}

function rarityColors(rarity: AwardRarity): { background: string; border: string; text: string; icon: string } {
  const colorMap: Record<AwardRarity, { background: string; border: string; text: string; icon: string }> = {
    Common: { background: "bg-[#F0F1F5]", border: "border-[#D9DCE5]", text: "text-[#697080]", icon: "text-[#9299A8]" },
    Rare: { background: "bg-[#EAF5FF]", border: "border-[#B8DDF7]", text: "text-[#2876AA]", icon: "text-[#48B8F3]" },
    Epic: { background: "bg-[#F2EBFF]", border: "border-[#D7C5FF]", text: "text-[#7045BE]", icon: "text-[#8B5CF6]" },
    Legendary: { background: "bg-[#FFF6D9]", border: "border-[#F1D77A]", text: "text-[#9A7415]", icon: "text-[#D8A627]" },
    Mystic: { background: "bg-[#E9E9FF]", border: "border-[#B9BAF7]", text: "text-[#393A9B]", icon: "text-[#5B5FEF]" },
  };
  return colorMap[rarity];
}

function AwardTile({ award, onClick }: { award: AwardView; onClick: () => void }) {
  const colors = rarityColors(award.rarity);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`surface border-line group flex min-h-[163px] flex-col rounded-[22px] border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(39,42,88,.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B5FEF]/20 sm:p-5 ${award.unlocked ? "" : "opacity-[.78]"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-[15px] ${colors.background} ${colors.text} ${award.unlocked ? "" : "grayscale"}`}>
          <Icon name={award.icon} size={21} className={colors.icon} />
        </div>
        {award.unlocked ? <Icon name="CircleCheck" size={18} className="mt-1 text-[#36D6A5]" /> : <Icon name="LockKeyhole" size={16} className="mt-1 text-muted" />}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`text-[9px] font-extrabold uppercase tracking-[.15em] ${colors.text}`}>{award.rarity}</span>
        {award.verification === "imported_unverified" && <span className="text-[9px] font-semibold text-muted">Imported</span>}
      </div>
      <h3 className="mt-1.5 text-sm font-bold leading-5 text-ink">{award.name}</h3>
      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted">{award.description}</p>
      {!award.unlocked && (
        <div className="mt-auto pt-3">
          <ProgressBar value={award.progressPercent} color={award.rarity === "Mystic" ? "#5B5FEF" : award.rarity === "Legendary" ? "#D8A627" : award.rarity === "Epic" ? "#8B5CF6" : award.rarity === "Rare" ? "#48B8F3" : "#9299A8"} height="h-1.5" />
          <div className="mt-1.5 text-[10px] font-semibold text-muted">{award.progress.toLocaleString()} / {award.progressRule.target.toLocaleString()}</div>
        </div>
      )}
    </button>
  );
}

function Modal({
  dialog,
  busy,
  onClose,
  onConfirm,
}: {
  dialog: DialogState;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#111325]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="surface border-line max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border p-5 shadow-[0_24px_80px_rgba(13,16,40,.28)] sm:rounded-[28px] sm:p-7">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F2F1FF] text-[#5B5FEF]"><Icon name={dialog.destructive ? "TriangleAlert" : "ShieldCheck"} size={20} /></div>
            <h2 id="modal-title" className="text-xl font-extrabold tracking-[-.03em] text-ink">{dialog.title}</h2>
          </div>
          <button type="button" aria-label="Close dialog" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-soft" disabled={busy}><Icon name="X" /></button>
        </div>
        <div className="text-sm leading-6 text-muted">{dialog.description}</div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          {dialog.secondaryLabel && dialog.onSecondary && <Button variant="ghost" onClick={dialog.onSecondary} disabled={busy}>{dialog.secondaryLabel}</Button>}
          <Button variant={dialog.destructive ? "danger" : "primary"} onClick={onConfirm} disabled={busy} icon={busy ? "LoaderCircle" : undefined} className={busy ? "animate-spin" : ""}>{busy ? "Working..." : dialog.confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [name, setName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");
  const [data, setData] = useState<LearningData>(emptyLearningData());
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [view, setView] = useState<View>("welcome");
  const [selectedTopicId, setSelectedTopicId] = useState(TOPICS[0].id);
  const [categoryFilter, setCategoryFilter] = useState<"All" | "Grammar" | "Vocabulary">("All");
  const [topicSearch, setTopicSearch] = useState("");
  const [quizTopicId, setQuizTopicId] = useState(TOPICS[0].id);
  const [quizDifficulty, setQuizDifficulty] = useState<Difficulty>("easy");
  const [readyQuestions, setReadyQuestions] = useState<QuizQuestion[] | null>(null);
  const [readyMode, setReadyMode] = useState<"ai" | "offline" | null>(null);
  const [generationState, setGenerationState] = useState<"idle" | "ai" | "offline">("idle");
  const [generationError, setGenerationError] = useState("");
  const [focusQuestions, setFocusQuestions] = useState<string[]>([]);
  const [antiCheatAcknowledged, setAntiCheatAcknowledged] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});
  const activeAttemptIdRef = useRef<string | null>(null);
  const cancelOnceRef = useRef(false);
  const finishingRef = useRef(false);
  const finishActiveRef = useRef<(fromTimer?: boolean) => Promise<void>>(async () => undefined);
  const [quizLocked, setQuizLocked] = useState(false);
  const [quizCancelReason, setQuizCancelReason] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const remainingRef = useRef(0);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [finishError, setFinishError] = useState("");
  const [resultAttemptId, setResultAttemptId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceChoice, setPracticeChoice] = useState("");
  const [practiceChecked, setPracticeChecked] = useState(false);
  const [flashCategory, setFlashCategory] = useState<"All" | "Grammar" | "Vocabulary">("All");
  const [flashTopic, setFlashTopic] = useState("all");
  const [difficultOnly, setDifficultOnly] = useState(false);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashFlipped, setFlashFlipped] = useState(false);
  const [flashShuffleKey, setFlashShuffleKey] = useState(0);
  const [awardStatus, setAwardStatus] = useState<"all" | "unlocked" | "locked">("all");
  const [awardRarity, setAwardRarity] = useState<"All" | AwardRarity>("All");
  const [awardSearch, setAwardSearch] = useState("");
  const [awardSort, setAwardSort] = useState<"rarity" | "progress" | "recent">("rarity");
  const [selectedAward, setSelectedAward] = useState<AwardView | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [importError, setImportError] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const [backupError, setBackupError] = useState("");
  const [backupDismissedAt, setBackupDismissedAt] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: ToastState) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  useEffect(() => {
    let alive = true;
    const initialise = async () => {
      const localName = getStudentName();
      const localSettings = getSettings();
      setName(localName);
      setNameDraft(localName);
      setSettings(localSettings);
      try {
        const saved = await reconcileInterruptedAttempt();
        if (!alive) return;
        setData(saved);
        setView(saved.pendingCancellation ? "quiz-cancelled" : localName ? "home" : "welcome");
        try { setBackupDismissedAt(window.localStorage.getItem(BACKUP_REMINDER_KEY) ?? ""); } catch { setBackupDismissedAt(""); }
      } catch (error) {
        if (!alive) return;
        setStorageError(error instanceof Error ? error.message : "Local learning storage is unavailable.");
        setView(localName ? "home" : "welcome");
      } finally {
        if (alive) setLoaded(true);
      }
    };
    void initialise();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.classList.toggle("reduced-motion", settings.reducedMotion);
  }, [settings]);

  useEffect(() => {
    activeAttemptIdRef.current = data.activeAttempt?.id ?? null;
  }, [data.activeAttempt?.id]);

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  const completedAttempts = useMemo(() => data.attempts.filter((attempt) => attempt.status === "completed"), [data.attempts]);
  const totalXp = useMemo(() => data.xpRecords.reduce((sum, record) => sum + record.amount, 0), [data.xpRecords]);
  const currentLevel = Math.floor(totalXp / 250) + 1;
  const levelProgress = totalXp % 250;
  const overallAccuracy = data.stats.questionsAnswered ? Math.round((data.stats.correctAnswers / data.stats.questionsAnswered) * 100) : null;
  const streak = currentStreak(data.activityDates);
  const awardViews = useMemo(() => getAwardViews(data), [data]);
  const unlockedAwards = useMemo(() => awardViews.filter((award) => award.unlocked), [awardViews]);
  const selectedTopic = TOPIC_BY_ID[selectedTopicId] ?? TOPICS[0];
  const quizTopic = TOPIC_BY_ID[quizTopicId] ?? TOPICS[0];
  const currentAttempt = data.activeAttempt;
  const activeQuestion = currentAttempt?.questions[currentQuestionIndex] ?? null;
  const resultAttempt = data.attempts.find((attempt) => attempt.id === resultAttemptId && attempt.status === "completed") ?? null;

  const dismissBackupReminder = () => {
    const timestamp = new Date().toISOString();
    setBackupDismissedAt(timestamp);
    try { window.localStorage.setItem(BACKUP_REMINDER_KEY, timestamp); } catch { /* reminder can reappear next visit */ }
  };

  const reminderDismissedRecently = backupDismissedAt && Date.now() - new Date(backupDismissedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
  const backupDue = !data.lastExportAt
    || Date.now() - new Date(data.lastExportAt).getTime() > 14 * 24 * 60 * 60 * 1000
    || data.stats.completedQuizzes - data.completedAtLastExport >= 5;
  const showBackupReminder = backupDue && !reminderDismissedRecently;

  const progressForTopic = (topicId: string) => data.stats.topicPerformance[topicId];
  const chosenContinueTopic = useMemo(() => {
    const ranked = TOPICS.map((topic) => {
      const performance = data.stats.topicPerformance[topic.id];
      return { topic, quizzes: performance?.quizzes ?? 0, accuracy: performance?.answered ? performance.correct / performance.answered : 0 };
    }).sort((a, b) => {
      if (a.quizzes === 0 && b.quizzes > 0) return -1;
      if (b.quizzes === 0 && a.quizzes > 0) return 1;
      if (a.quizzes === 0 && b.quizzes === 0) return a.topic.number - b.topic.number;
      return a.accuracy - b.accuracy || a.quizzes - b.quizzes;
    });
    return ranked[0]?.topic ?? TOPICS[0];
  }, [data.stats.topicPerformance]);

  const navigate = async (target: NavView) => {
    if (view === "quiz-active" && currentAttempt?.status === "in_progress") {
      cancelRunningQuiz("The quiz was cancelled because you tried to leave the active quiz.", currentAttempt.id);
      return;
    }
    if (data.pendingCancellation) {
      try { setData(await clearPendingCancellation()); } catch { /* the cancellation record remains on disk */ }
    }
    setView(target);
  };

  const openLesson = (topicId: string) => {
    setSelectedTopicId(topicId);
    setPracticeIndex(0);
    setPracticeChoice("");
    setPracticeChecked(false);
    setView("lesson");
  };

  const openQuizSetup = (topicId: string, focus: string[] = [], difficulty: Difficulty = "easy") => {
    setSelectedTopicId(topicId);
    setQuizTopicId(topicId);
    setQuizDifficulty(difficulty);
    setReadyQuestions(null);
    setReadyMode(null);
    setGenerationState("idle");
    setGenerationError("");
    setFocusQuestions(focus.slice(0, 5));
    setAntiCheatAcknowledged(false);
    setView("quiz-setup");
  };

  const cancelRunningQuiz = useCallback((reason: string, specificAttemptId?: string) => {
    const attemptId = specificAttemptId ?? activeAttemptIdRef.current;
    if (!attemptId || cancelOnceRef.current) return;
    cancelOnceRef.current = true;
    setQuizLocked(true);
    setFinishDialogOpen(false);
    setQuizCancelReason(reason);
    setView("quiz-cancelled");
    void saveInterruptedFlag(attemptId);
    void cancelQuiz(attemptId, reason).then(({ data: nextData, cancelled }) => {
      setData(nextData);
      if (!cancelled) {
        const completed = nextData.attempts.find((attempt) => attempt.id === attemptId && attempt.status === "completed");
        if (completed) {
          setResultAttemptId(completed.id);
          setView("results");
          setQuizLocked(false);
          return;
        }
      }
    }).catch((error: unknown) => {
      setStorageError(error instanceof Error ? error.message : "Could not save the quiz cancellation.");
    });
  }, []);

  const finishActiveQuiz = useCallback(async (fromTimer = false) => {
    const activeId = activeAttemptIdRef.current;
    if (!activeId || cancelOnceRef.current || finishingRef.current) return;
    const active = data.activeAttempt;
    if (!active || active.id !== activeId || active.status !== "in_progress") return;
    if (!fromTimer && !finishDialogOpen) return;
    finishingRef.current = true;
    setQuizLocked(true);
    setFinishDialogOpen(false);
    setFinishError("");
    const elapsed = fromTimer ? active.timeLimitSeconds : active.timeLimitSeconds - remainingRef.current;
    try {
      const result = await completeQuiz(activeId, answersRef.current, elapsed);
      setData(result.data);
      if (!result.attempt) {
        setQuizCancelReason("The quiz was interrupted before its result could be saved.");
        setView("quiz-cancelled");
        return;
      }
      setResultAttemptId(result.attempt.id);
      setView("results");
      setQuizLocked(false);
      if (result.newlyUnlocked.length) {
        const first = result.newlyUnlocked[0];
        showToast({ title: `New award: ${first.name}`, description: result.newlyUnlocked.length > 1 ? `You unlocked ${result.newlyUnlocked.length} awards.` : first.description, tone: "success" });
      }
    } catch (error) {
      finishingRef.current = false;
      setQuizLocked(false);
      setFinishError(error instanceof Error ? error.message : "The result could not be saved. Please try again while the quiz remains open.");
    }
  }, [data.activeAttempt, finishDialogOpen, showToast]);

  finishActiveRef.current = finishActiveQuiz;

  useEffect(() => {
    if (view !== "quiz-active" || !currentAttempt || currentAttempt.status !== "in_progress" || quizLocked) return;
    const attemptId = currentAttempt.id;
    let blurTimer = 0;
    let lastValue = -1;
    const cancelForHidden = () => cancelRunningQuiz("The quiz was cancelled because the page became hidden or the active quiz window was left.", attemptId);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") cancelForHidden();
    };
    const onWindowBlur = () => {
      if (document.visibilityState === "hidden") {
        cancelForHidden();
        return;
      }
      window.clearTimeout(blurTimer);
      blurTimer = window.setTimeout(() => {
        if (document.visibilityState === "visible" && !document.hasFocus()) cancelForHidden();
      }, 350);
    };
    const onWindowFocus = () => window.clearTimeout(blurTimer);
    const onPageHide = () => {
      void saveInterruptedFlag(attemptId);
      cancelForHidden();
    };
    const onPopState = () => {
      window.history.pushState({ englishStudioQuiz: true }, "", window.location.href);
      cancelRunningQuiz("The quiz was cancelled because you tried to navigate away from the active quiz.", attemptId);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelRunningQuiz("The quiz was cancelled because you attempted to exit the active quiz.", attemptId);
      }
    };
    const onBeforeUnload = () => {
      void saveInterruptedFlag(attemptId);
      cancelForHidden();
    };
    window.history.pushState({ englishStudioQuiz: true }, "", window.location.href);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeunload", onBeforeUnload);
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(currentAttempt.startedAt).getTime()) / 1000);
      const left = Math.max(0, currentAttempt.timeLimitSeconds - elapsed);
      remainingRef.current = left;
      if (left !== lastValue) {
        lastValue = left;
        setRemainingSeconds(left);
      }
      if (left === 0) void finishActiveRef.current(true);
    }, 250);
    return () => {
      window.clearTimeout(blurTimer);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [view, currentAttempt?.id, currentAttempt?.status, quizLocked, cancelRunningQuiz]);

  const requestQuiz = async (mode: "ai" | "offline") => {
    if (!antiCheatAcknowledged) return;
    setGenerationState(mode);
    setGenerationError("");
    setReadyQuestions(null);
    setReadyMode(null);
    try {
      const seen = data.questionHistory.map((entry) => entry.fingerprint);
      const questions = mode === "ai"
        ? await generateAIQuiz(quizTopic, quizDifficulty, seen, focusQuestions)
        : generateOfflineQuiz(quizTopic, quizDifficulty, seen);
      if (questions.length !== 15) throw new Error("A quiz cannot start unless all 15 questions are valid.");
      setReadyQuestions(questions);
      setReadyMode(mode);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Quiz generation failed. Please retry.");
    } finally {
      setGenerationState("idle");
    }
  };

  const startReadyQuiz = async () => {
    if (!readyQuestions || readyQuestions.length !== 15 || !antiCheatAcknowledged) return;
    const now = new Date();
    const attemptId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `attempt-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
    const limit = quizTimeLimit(quizDifficulty);
    try {
      const attempt = await beginQuiz({ id: attemptId, topicId: quizTopic.id, difficulty: quizDifficulty, startedAt: now.toISOString(), timeLimitSeconds: limit, questions: readyQuestions });
      activeAttemptIdRef.current = attempt.id;
      cancelOnceRef.current = false;
      finishingRef.current = false;
      answersRef.current = {};
      setAnswers({});
      setCurrentQuestionIndex(0);
      remainingRef.current = limit;
      setRemainingSeconds(limit);
      setQuizLocked(false);
      setFinishError("");
      setQuizCancelReason("");
      setFinishDialogOpen(false);
      setData(await readLearningData());
      setView("quiz-active");
    } catch (error) {
      showToast({ title: "Quiz could not start", description: error instanceof Error ? error.message : "Please try again.", tone: "warning" });
    }
  };

  const updateAnswer = (question: QuizQuestion, answer: string) => {
    if (quizLocked || !currentAttempt || currentAttempt.status !== "in_progress") return;
    const nextAnswers = { ...answersRef.current };
    if (answer.trim()) nextAnswers[question.id] = answer;
    else delete nextAnswers[question.id];
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);
    void saveQuizAnswer(currentAttempt.id, question.id, answer).then(setData).catch((error: unknown) => {
      setFinishError(error instanceof Error ? error.message : "Your answer could not be saved locally.");
    });
  };

  const submitName = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = nameDraft.trim().replace(/\s+/g, " ");
    if (cleaned.length < 2 || cleaned.length > 32 || /[\u0000-\u001f]/.test(cleaned)) {
      setNameError("Enter a display name between 2 and 32 characters.");
      return;
    }
    try {
      saveStudentName(cleaned);
      setName(cleaned);
      setNameDraft(cleaned);
      setNameError("");
      setView("home");
      showToast({ title: `Welcome to English Studio, ${cleaned.split(" ")[0]}.`, description: "Your local profile is ready on this device.", tone: "success" });
    } catch {
      setNameError("The browser could not save your profile. Check that local storage is available.");
    }
  };

  const downloadMyData = async (): Promise<boolean> => {
    setBackupError("");
    setBackupMessage("");
    try {
      const currentData = await readLearningData();
      const backup = createBackup(name || "Student", settings, currentData);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `english-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setBackupMessage("Your JSON download has started. Save it somewhere safe so you can restore your progress later.");
      try {
        const nextData = await markBackupExported();
        setData(nextData);
      } catch {
        setBackupMessage("Your download was initiated, but this browser could not record the export date. Keep the downloaded JSON file safe.");
      }
      showToast({ title: "Backup download started", description: "Your English Studio JSON file is ready to save.", tone: "success" });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "The backup could not be created.";
      setBackupError(message);
      showToast({ title: "Backup unavailable", description: message, tone: "warning" });
      return false;
    }
  };

  const handleBackupFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setImportError("");
    setPendingImport(null);
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setImportError("This backup is larger than 10 MB and cannot be imported safely.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
      setImportError("Choose an English Studio .json backup file.");
      return;
    }
    try {
      const validation = validateBackupText(await file.text(), file.size);
      setPendingImport({ backup: validation.backup, preview: validation.preview, filename: file.name });
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "This backup could not be validated.");
    }
  };

  const confirmImport = (mode: "replace" | "merge") => {
    if (!pendingImport) return;
    const chosen = pendingImport;
    setDialog({
      title: mode === "replace" ? "Restore this backup?" : "Merge this backup?",
      description: <div className="space-y-3"><p>{importNoticeMode(mode)}</p><p className="rounded-xl bg-[#FFF6D9] px-3 py-2 text-xs leading-5 text-[#78611d]">Imported records are marked unverified. A browser-only JSON backup can be edited and is not a tamper-proof proof of learning.</p></div>,
      confirmLabel: mode === "replace" ? "Restore Backup" : "Merge Backup",
      onConfirm: async () => {
        const imported = toImportedLearningData(chosen.backup);
        let restored: LearningData;
        if (mode === "replace") {
          restored = await replaceLearningData(imported);
          saveStudentName(chosen.backup.profile.displayName);
          setName(chosen.backup.profile.displayName);
          setNameDraft(chosen.backup.profile.displayName);
          setSettings(chosen.backup.settings);
          saveSettings(chosen.backup.settings);
        } else {
          restored = await mergeLearningData(imported);
        }
        setData(restored);
        setPendingImport(null);
        setImportError("");
        setView("home");
        setBackupMessage(mode === "replace" ? "Your backup has been restored on this browser." : "Compatible records have been merged into this browser.");
        showToast({ title: mode === "replace" ? "Backup restored" : "Backup merged", description: "Imported history is labelled unverified on this device.", tone: "success" });
      },
    });
  };

  const resetDataNow = async () => {
    const next = await resetLearningProgress();
    setData(next);
    setPendingImport(null);
    setView("home");
    showToast({ title: "Learning progress reset", description: "Your name and preferences were kept.", tone: "info" });
  };

  const requestReset = () => {
    setDialog({
      title: "Reset all learning progress?",
      description: <div className="space-y-3"><p>This permanently removes quiz attempts, question fingerprints, XP records, flashcard progress, lesson progress, statistics and Awards Vault progress from this browser.</p><p className="font-semibold text-ink">Your display name and theme preference will stay. Download a JSON backup first if you may want to restore your progress.</p></div>,
      confirmLabel: "Download backup & reset",
      destructive: true,
      secondaryLabel: "Review reset options",
      onSecondary: () => setDialog({
        title: "Reset without a backup?",
        description: "This cannot be undone. All local learning progress will be erased from this browser and device.",
        confirmLabel: "Reset Progress",
        destructive: true,
        onConfirm: resetDataNow,
      }),
      onConfirm: async () => {
        const exported = await downloadMyData();
        if (exported) await resetDataNow();
      },
    });
  };

  const showClearHistoryDialog = () => setDialog({
    title: "Clear question history?",
    description: "This clears saved question fingerprints used for duplicate prevention. Completed quiz results and answer explanations will remain saved.",
    confirmLabel: "Clear Question History",
    destructive: true,
    onConfirm: async () => {
      setData(await clearQuestionHistory());
      showToast({ title: "Question history cleared", description: "Your completed quiz results are still saved.", tone: "info" });
    },
  });

  const updateSetting = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  const openLessonComplete = async (topicId: string) => {
    try {
      const result = await markLessonComplete(topicId);
      setData(result.data);
      showToast({ title: "Lesson progress saved", description: "This topic is marked complete on this device.", tone: "success" });
      if (result.newlyUnlocked.length) showToast({ title: `New award: ${result.newlyUnlocked[0].name}`, tone: "success" });
    } catch (error) {
      showToast({ title: "Progress could not be saved", description: error instanceof Error ? error.message : "Try again.", tone: "warning" });
    }
  };

  const checkPractice = async () => {
    const item = selectedTopic.practice[practiceIndex];
    if (!item || !practiceChoice || practiceChecked) return;
    const correct = normalizeFingerprint(practiceChoice) === normalizeFingerprint(item.answer);
    setPracticeChecked(true);
    try { setData(await recordPracticeResult(selectedTopic.id, practiceIndex, correct)); }
    catch (error) { showToast({ title: "Practice progress could not be saved", description: error instanceof Error ? error.message : "Try again.", tone: "warning" }); }
  };

  const markCard = async (cardId: string, status: "known" | "review") => {
    try {
      const result = await updateFlashcardProgress(cardId, status);
      setData(result.data);
      setFlashFlipped(false);
      if (result.newlyUnlocked.length) showToast({ title: `New award: ${result.newlyUnlocked[0].name}`, description: result.newlyUnlocked[0].description, tone: "success" });
    } catch (error) {
      showToast({ title: "Flashcard progress could not be saved", description: error instanceof Error ? error.message : "Try again.", tone: "warning" });
    }
  };

  const topicList = useMemo(() => TOPICS.filter((topic) => {
    const matchesCategory = categoryFilter === "All" || topic.category === categoryFilter;
    const query = topicSearch.trim().toLowerCase();
    return matchesCategory && (!query || topic.name.toLowerCase().includes(query) || topic.summary.toLowerCase().includes(query));
  }), [categoryFilter, topicSearch]);

  const flashcards = useMemo(() => {
    let items = TOPICS.flatMap((topic) => topic.flashcards.map((card) => ({
      ...card,
      cardId: `${topic.id}:${card.id}`,
      topicId: topic.id,
      topicName: topic.name,
      category: topic.category,
    })));
    if (flashCategory !== "All") items = items.filter((card) => card.category === flashCategory);
    if (flashTopic !== "all") items = items.filter((card) => card.topicId === flashTopic);
    if (difficultOnly) items = items.filter((card) => data.flashcards.find((progress) => progress.cardId === card.cardId)?.status === "review");
    if (flashShuffleKey > 0) {
      let seed = flashShuffleKey * 9301 + 49297;
      items = [...items].sort(() => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280 - 0.5;
      });
    }
    return items;
  }, [flashCategory, flashTopic, difficultOnly, data.flashcards, flashShuffleKey]);

  useEffect(() => {
    setFlashIndex(0);
    setFlashFlipped(false);
  }, [flashCategory, flashTopic, difficultOnly, flashShuffleKey]);

  useEffect(() => {
    if (view !== "flashcards") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, button")) return;
      if (event.key === " ") { event.preventDefault(); setFlashFlipped((value) => !value); }
      if (event.key === "ArrowRight") setFlashIndex((index) => Math.min(index + 1, flashcards.length - 1));
      if (event.key === "ArrowLeft") setFlashIndex((index) => Math.max(0, index - 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view, flashcards.length]);

  const awardRows = useMemo(() => {
    let rows = awardViews.filter((award) => {
      const matchesStatus = awardStatus === "all" || (awardStatus === "unlocked" ? award.unlocked : !award.unlocked);
      const matchesRarity = awardRarity === "All" || award.rarity === awardRarity;
      const matchesSearch = !awardSearch.trim() || `${award.name} ${award.description} ${award.rarity}`.toLowerCase().includes(awardSearch.trim().toLowerCase());
      return matchesStatus && matchesRarity && matchesSearch;
    });
    if (awardSort === "progress") rows = [...rows].sort((a, b) => b.progressPercent - a.progressPercent || a.name.localeCompare(b.name));
    else if (awardSort === "recent") rows = [...rows].sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? "") || b.progressPercent - a.progressPercent);
    else {
      const rarityOrder: AwardRarity[] = ["Mystic", "Legendary", "Epic", "Rare", "Common"];
      rows = [...rows].sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity) || a.name.localeCompare(b.name));
    }
    return rows;
  }, [awardViews, awardStatus, awardRarity, awardSearch, awardSort]);

  const completePractice = async () => {
    const item = selectedTopic.practice[practiceIndex];
    if (!item) return;
    if (practiceIndex < selectedTopic.practice.length - 1) {
      setPracticeIndex((index) => index + 1);
      setPracticeChoice("");
      setPracticeChecked(false);
      return;
    }
    await openLessonComplete(selectedTopic.id);
    setPracticeIndex(0);
    setPracticeChoice("");
    setPracticeChecked(false);
  };

  const navPage: NavView = view === "lesson" || view === "quiz-setup" || view === "results" ? "learn" : view === "settings" ? "settings" : view === "flashcards" ? "flashcards" : view === "awards" ? "awards" : "home";
  const navItems: { id: NavView; label: string; icon: string }[] = [
    { id: "home", label: "Home", icon: "House" },
    { id: "learn", label: "Learn", icon: "BookOpen" },
    { id: "flashcards", label: "Flashcards", icon: "Layers3" },
    { id: "awards", label: "Awards", icon: "Award" },
    { id: "settings", label: "Profile", icon: "UserRound" },
  ];

  if (!loaded) {
    return <div className="grid min-h-[100dvh] place-items-center bg-canvas px-6"><div className="flex flex-col items-center text-center"><div className="mb-4 h-12 w-12 animate-pulse rounded-[17px] bg-gradient-to-br from-[#5B5FEF] to-[#8B5CF6]" /><p className="text-sm font-semibold text-muted">Opening your local learning studio...</p></div></div>;
  }

  if (storageError) {
    return <div className="grid min-h-[100dvh] place-items-center bg-canvas p-5"><Surface className="w-full max-w-xl p-6 sm:p-8"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#C94949]"><Icon name="DatabaseZap" size={22} /></div><h1 className="text-xl font-extrabold text-ink">Local storage is unavailable</h1><p className="mt-2 text-sm leading-6 text-muted">English Studio needs IndexedDB in this browser to save quiz and learning progress. Your progress has not been moved to an external database.</p><p className="mt-3 rounded-2xl bg-soft p-3 text-xs leading-5 text-muted">{storageError}</p><Button className="mt-5" onClick={() => window.location.reload()} icon="RotateCw">Try again</Button></Surface></div>;
  }

  if (view === "welcome" || !name) {
    return (
      <div className="welcome-shell relative min-h-[100dvh] overflow-hidden bg-canvas px-5 py-6 sm:px-8 sm:py-10">
        <div className="welcome-orb welcome-orb-one" /><div className="welcome-orb welcome-orb-two" />
        <div className="relative mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-6xl flex-col">
          <header className="flex items-center justify-between"><BrandMark /><span className="hidden rounded-full border border-line bg-surface px-3 py-2 text-xs font-semibold text-muted sm:inline-flex">Class 10 English</span></header>
          <main className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-20">
            <div className="max-w-2xl animate-enter">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#DFE0FF] bg-[#F2F1FF] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#5659D9]"><Icon name="Sparkles" size={14} /> English Studio</div>
              <h1 className="max-w-xl text-[42px] font-extrabold leading-[1.04] tracking-[-.06em] text-ink sm:text-6xl">Your next level <span className="text-[#5B5FEF]">starts here.</span></h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted sm:text-lg">Master English, one challenge at a time. Build confidence across grammar and vocabulary with lessons made for Class 10.</p>
              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-semibold text-muted"><span className="inline-flex items-center gap-2"><Icon name="BookOpenCheck" size={17} className="text-[#5B5FEF]" />17 focused topics</span><span className="h-1 w-1 rounded-full bg-[#C7C9D9]" /><span className="inline-flex items-center gap-2"><Icon name="BrainCircuit" size={17} className="text-[#8B5CF6]" />Your learning, on your device</span></div>
            </div>
            <Surface className="animate-enter mx-auto w-full max-w-[460px] p-5 shadow-[0_24px_70px_rgba(61,63,130,.1)] sm:p-8">
              <div className="mb-6"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[17px] bg-[#F0F0FF] text-[#5B5FEF]"><Icon name="UserRound" size={23} /></div><h2 className="text-2xl font-extrabold tracking-[-.04em] text-ink">Let's make this yours.</h2><p className="mt-1 text-sm text-muted">Choose a display name to get started.</p></div>
              <form onSubmit={submitName} className="space-y-4">
                <label htmlFor="display-name" className="block text-xs font-bold text-ink">Your name</label>
                <input id="display-name" autoComplete="nickname" maxLength={32} value={nameDraft} onChange={(event) => { setNameDraft(event.target.value); setNameError(""); }} placeholder="e.g. Aanya" className="min-h-[52px] w-full rounded-2xl border border-line bg-surface px-4 text-base text-ink outline-none transition placeholder:text-[#A6A9BA] focus:border-[#7f82f4] focus:ring-4 focus:ring-[#5B5FEF]/10" />
                {nameError && <p role="alert" className="text-xs font-semibold text-[#C94949]">{nameError}</p>}
                <Button type="submit" className="w-full" icon="ArrowRight">Start Learning</Button>
              </form>
              <div className="mt-5 flex gap-2.5 rounded-2xl bg-soft p-3 text-xs leading-5 text-muted"><Icon name="HardDrive" size={17} className="mt-0.5 shrink-0 text-[#5B5FEF]" /><p>Your name is saved only on this browser. You can download a JSON backup and import it later from Settings. Backup files can be restored on this browser but do not sync your data to other devices.</p></div>
              <div className="mt-4"><LocalDataNotice compact /></div>
            </Surface>
          </main>
          <footer className="flex flex-col gap-2 border-t border-line pt-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between"><span>Developed by Venush</span><span>This is a local profile, not secure authentication.</span></footer>
        </div>
      </div>
    );
  }

  if (view === "quiz-cancelled") {
    return (
      <main className="quiz-world flex min-h-[100dvh] items-center justify-center bg-[#171A2E] px-5 py-10 text-white">
        <div className="w-full max-w-xl animate-enter text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[27px] bg-[#FF6B6B]/15 text-[#FF8A8A]"><Icon name="ShieldAlert" size={35} /></div>
          <div className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-[#a6a9c9]">English Studio | Integrity check</div>
          <h1 className="text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">Quiz Cancelled</h1>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[#c1c3d5] sm:text-base">Your quiz was automatically cancelled because you left the active quiz window or switched away from the quiz. No points or completion rewards were awarded.</p>
          {quizCancelReason && <p className="mx-auto mt-3 max-w-lg text-xs leading-5 text-[#888ca9]">{quizCancelReason}</p>}
          <div className="mx-auto mt-8 grid w-full max-w-md gap-3 sm:grid-cols-2">
            <Button onClick={async () => { try { setData(await clearPendingCancellation()); } catch { /* keep the safe cancelled state */ } openQuizSetup(quizTopicId); }} icon="RotateCw">Start a New Quiz</Button>
            <Button variant="dark" onClick={async () => { try { setData(await clearPendingCancellation()); } catch { /* cancellation remains recorded */ } setView("home"); }}>Return to Dashboard</Button>
          </div>
          <p className="mx-auto mt-8 max-w-md text-[11px] leading-5 text-[#888ca9]">Anti-cheat uses browser visibility and focus signals. It is a deterrent within browser capabilities, not tamper-proof proctoring.</p>
        </div>
      </main>
    );
  }

  if (view === "quiz-active" && currentAttempt?.status === "in_progress" && activeQuestion) {
    const answeredCount = Object.values(answers).filter((answer) => answer.trim()).length;
    const progress = ((currentQuestionIndex + 1) / currentAttempt.questions.length) * 100;
    return (
      <main className="quiz-world fixed inset-0 z-50 flex min-h-[100dvh] flex-col overflow-y-auto bg-[#171A2E] px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] text-white sm:px-7 sm:pt-6">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white/10 text-white"><Icon name="BookOpenCheck" size={20} /></div><div className="min-w-0"><div className="truncate text-sm font-extrabold">English Studio</div><div className="truncate text-[11px] text-[#a9acc5]">{quizTopic.name}</div></div></div>
          <div className={`flex min-h-[44px] items-center gap-2 rounded-2xl border px-3.5 font-mono text-sm font-bold tabular-nums ${remainingSeconds <= 60 ? "border-[#FF6B6B]/60 bg-[#FF6B6B]/15 text-[#FF8A8A]" : "border-white/10 bg-white/5 text-white"}`} aria-live="off"><Icon name="Timer" size={17} />{formatClock(remainingSeconds)}</div>
          <Button variant="ghost" className="min-h-[42px] px-2 text-[#c1c3d5] hover:bg-white/10 hover:text-white" onClick={() => cancelRunningQuiz("The quiz was cancelled because you exited the active quiz.", currentAttempt.id)} icon="LogOut"><span className="hidden sm:inline">Exit quiz</span></Button>
        </header>
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col py-5 sm:py-8">
          <div className="mb-6 flex items-center justify-between text-xs font-semibold text-[#a9acc5]"><span>Question <strong className="text-white">{currentQuestionIndex + 1}</strong> of 15</span><span>{difficultyLabel(currentAttempt.difficulty)} level | {answeredCount} answered</span></div>
          <ProgressBar value={progress} color="#8B5CF6" height="h-2" />
          <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-8 sm:py-12" aria-labelledby="quiz-question-title">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#999dc0]"><span>{getQuestionTypeLabel(activeQuestion)}</span><span className="h-1 w-1 rounded-full bg-[#676a87]" /><span>Question {String(currentQuestionIndex + 1).padStart(2, "0")}</span></div>
            <h1 id="quiz-question-title" className="max-w-3xl text-[25px] font-extrabold leading-[1.25] tracking-[-.035em] sm:text-[34px]">{activeQuestion.prompt}</h1>
            {activeQuestion.options.length > 0 ? (
              <div className="mt-7 grid gap-3 sm:mt-9 sm:grid-cols-2">
                {activeQuestion.options.map((option, index) => {
                  const selected = answers[activeQuestion.id] === option;
                  return <button key={`${activeQuestion.id}-${index}`} type="button" disabled={quizLocked} onClick={() => updateAnswer(activeQuestion, option)} className={`flex min-h-[60px] items-start gap-3 rounded-[18px] border px-4 py-4 text-left text-sm font-semibold leading-6 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B5CF6]/30 disabled:opacity-60 sm:min-h-[68px] sm:text-base ${selected ? "border-[#9b8cff] bg-[#6157C8]/25 text-white shadow-[0_0_0_2px_rgba(139,92,246,.15)]" : "border-white/10 bg-white/[.045] text-[#e6e6f0] hover:border-white/25 hover:bg-white/[.08]"}`}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-xs font-extrabold ${selected ? "bg-[#8B5CF6] text-white" : "bg-white/10 text-[#c7c9da]"}`}>{String.fromCharCode(65 + index)}</span><span>{option}</span>
                  </button>;
                })}
              </div>
            ) : (
              <label className="mt-7 block text-xs font-semibold text-[#b8bad0] sm:mt-9">Your answer
                <input disabled={quizLocked} value={answers[activeQuestion.id] ?? ""} onChange={(event) => updateAnswer(activeQuestion, event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && currentQuestionIndex < 14) setCurrentQuestionIndex((index) => index + 1); }} className="mt-2 min-h-[58px] w-full rounded-[18px] border border-white/15 bg-white/[.06] px-4 text-base text-white outline-none transition placeholder:text-[#7c7f9a] focus:border-[#a99bff] focus:ring-4 focus:ring-[#8B5CF6]/20 disabled:opacity-60" placeholder="Type your answer..." autoComplete="off" />
              </label>
            )}
            <div className="mt-4 text-[11px] text-[#777b99]">Your answers are saved only in IndexedDB on this browser and device.</div>
          </section>
          <footer className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 border-t border-white/10 pt-4 sm:pt-5">
            <Button variant="ghost" disabled={currentQuestionIndex === 0 || quizLocked} onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))} icon="ArrowLeft">Previous</Button>
            <div className="flex items-center gap-1.5" aria-label={`Question ${currentQuestionIndex + 1} of 15`}>
              {currentAttempt.questions.map((question, index) => <button key={question.id} type="button" aria-label={`Go to question ${index + 1}`} onClick={() => setCurrentQuestionIndex(index)} className={`h-2 rounded-full transition-all ${index === currentQuestionIndex ? "w-5 bg-[#9b8cff]" : answers[question.id]?.trim() ? "w-2 bg-[#36D6A5]" : "w-2 bg-white/20"}`} />)}
            </div>
            {currentQuestionIndex < 14 ? <Button onClick={() => setCurrentQuestionIndex((index) => Math.min(14, index + 1))} disabled={quizLocked} icon="ArrowRight">Next</Button> : <Button onClick={() => setFinishDialogOpen(true)} disabled={quizLocked} icon="Send">Finish Quiz</Button>}
          </footer>
          {finishError && <p role="alert" className="mx-auto mt-3 w-full max-w-5xl text-xs font-semibold text-[#FF9999]">{finishError}</p>}
        </div>
        {finishDialogOpen && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5">
            <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-t-[28px] border border-white/10 bg-[#22253D] p-5 text-white sm:rounded-[28px] sm:p-7">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F2F1FF]/10 text-[#B9A9FF]"><Icon name="Send" size={20} /></div><h2 className="text-xl font-extrabold">Submit this quiz?</h2><p className="mt-2 text-sm leading-6 text-[#c1c3d5]">{15 - answeredCount ? `You have ${15 - answeredCount} unanswered question${15 - answeredCount === 1 ? "" : "s"}.` : "All 15 questions have an answer."} Once submitted, your answers are scored and the attempt cannot be changed.</p>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setFinishDialogOpen(false)}>Keep reviewing</Button><Button onClick={() => void finishActiveQuiz(false)} icon="Check">Submit quiz</Button></div>
            </div>
          </div>
        )}
      </main>
    );
  }

  const completedToday = completedAttempts.filter((attempt) => attempt.completedAt && new Date(attempt.completedAt).toDateString() === new Date().toDateString()).length;
  const recentAttempts = [...data.attempts].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 4);
  const recentAwards = [...unlockedAwards].sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? "")).slice(0, 3);
  const knownCards = data.flashcards.filter((card) => card.status === "known").length;
  const reviewedCards = data.flashcards.reduce((sum, card) => sum + card.reviewCount, 0);

  let page: ReactNode = null;

  if (view === "home") {
    const firstName = name.trim().split(/\s+/)[0] || "Learner";
    page = (
      <div className="animate-enter space-y-5 sm:space-y-6">
        <section className="dashboard-hero relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#171A2E] via-[#24274A] to-[#5155D4] px-5 py-6 text-white shadow-[0_18px_45px_rgba(43,45,113,.16)] sm:px-8 sm:py-8">
          <div className="hero-orb hero-orb-a" /><div className="hero-orb hero-orb-b" />
          <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.19em] text-[#B9BAFF]"><Icon name="Sparkles" size={14} /> Your learning space</div>
              <h1 className="text-[30px] font-extrabold leading-[1.1] tracking-[-.045em] sm:text-[40px]">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {firstName}.</h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#D4D5E7]">Small, steady practice is how the big progress happens. Pick up where you left off.</p>
              <div className="mt-5 flex flex-wrap gap-2"><Button className="bg-white text-[#3336A4] shadow-none hover:bg-[#F0F0FF]" onClick={() => openLesson(chosenContinueTopic.id)} icon="ArrowRight">Continue learning</Button><Button variant="ghost" onClick={() => openQuizSetup(chosenContinueTopic.id)} className="text-white hover:bg-white/10 hover:text-white" icon="Zap">Quick challenge</Button></div>
            </div>
            <div className="relative grid w-full grid-cols-2 gap-3 md:max-w-[350px]">
              <div className="rounded-[21px] border border-white/10 bg-white/[.08] p-4 backdrop-blur-sm"><div className="flex items-center gap-2 text-[11px] font-semibold text-[#c5c7dc]"><Icon name="Trophy" size={16} className="text-[#FFD166]" /> Current level</div><div className="mt-2 text-3xl font-extrabold tracking-[-.04em]">{currentLevel}</div><div className="mt-1 text-[11px] text-[#c5c7dc]">{levelProgress} / 250 XP to level {currentLevel + 1}</div><div className="mt-3"><ProgressBar value={(levelProgress / 250) * 100} color="#FFD166" height="h-1.5" /></div></div>
              <div className="rounded-[21px] border border-white/10 bg-white/[.08] p-4 backdrop-blur-sm"><div className="flex items-center gap-2 text-[11px] font-semibold text-[#c5c7dc]"><Icon name="Flame" size={16} className="text-[#FF8A7A]" /> Learning streak</div><div className="mt-2 text-3xl font-extrabold tracking-[-.04em]">{streak}<span className="ml-1 text-sm font-semibold text-[#c5c7dc]">days</span></div><div className="mt-1 text-[11px] text-[#c5c7dc]">Based on saved learning activity</div><div className="mt-3 text-[11px] font-bold text-[#D7D7FF]">{data.stats.completedQuizzes} completed quizzes</div></div>
              <div className="col-span-2 flex items-center justify-between gap-4 rounded-[21px] border border-white/10 bg-white/[.08] p-4 backdrop-blur-sm"><div className="min-w-0"><div className="text-[11px] font-semibold text-[#c5c7dc]">Total experience</div><div className="mt-1 flex items-baseline gap-2"><span className="text-2xl font-extrabold tracking-[-.04em]">{totalXp.toLocaleString()}</span><span className="text-xs font-semibold text-[#c5c7dc]">XP earned</span></div></div><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#FFD166]/15 text-[#FFD166]"><Icon name="Sparkles" size={21} /></div></div>
            </div>
          </div>
        </section>

        <LocalDataNotice compact />

        {showBackupReminder && <section className="flex flex-col gap-4 rounded-[22px] border border-[#F1D77A] bg-[#FFF8E1] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#FFD166]/30 text-[#9A7415]"><Icon name="HardDriveDownload" size={20} /></div><div><h2 className="text-sm font-extrabold text-[#644d12]">A little backup goes a long way</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-[#78611d]">{BACKUP_REMINDER}</p></div></div><div className="flex shrink-0 gap-2"><Button onClick={() => { void navigate("settings"); }} icon="Download">Back up now</Button><button type="button" onClick={dismissBackupReminder} aria-label="Dismiss backup reminder for one week" className="flex h-11 w-11 items-center justify-center rounded-2xl text-[#78611d] hover:bg-[#F9EABD]"><Icon name="X" size={18} /></button></div></section>}

        <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <Surface className="flex flex-col justify-between gap-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><div className="mb-2 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#5B5FEF]"><Icon name="FlagTriangleRight" size={15} /> Daily quest</div><h2 className="text-xl font-extrabold tracking-[-.035em] text-ink">Finish one quiz today</h2><p className="mt-1 text-xs leading-5 text-muted">A focused 15-question session keeps your learning moving.</p></div><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#FFF6D9] text-[#C08C18]"><Icon name="Target" size={21} /></div></div>
            <div><div className="mb-2 flex items-center justify-between text-xs font-bold text-muted"><span>{Math.min(completedToday, 1)} of 1 complete</span><span>{completedToday ? "Quest complete" : "One small win"}</span></div><ProgressBar value={completedToday ? 100 : 0} color="#36D6A5" height="h-2.5" /></div>
            <Button onClick={() => openQuizSetup(chosenContinueTopic.id)} icon={completedToday ? "RotateCw" : "Zap"}>{completedToday ? "Take another challenge" : "Start today's quest"}</Button>
          </Surface>
          <Surface className="flex flex-col justify-between gap-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><div className="mb-2 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#159C74]"><Icon name="Compass" size={15} /> Continue learning</div><h2 className="text-xl font-extrabold tracking-[-.035em] text-ink">{chosenContinueTopic.name}</h2><p className="mt-1 text-xs leading-5 text-muted">{data.stats.topicPerformance[chosenContinueTopic.id]?.quizzes ? `Your current accuracy is ${Math.round((data.stats.topicPerformance[chosenContinueTopic.id].correct / Math.max(1, data.stats.topicPerformance[chosenContinueTopic.id].answered)) * 100)}%. Keep building on it.` : "Start with a clear lesson, then try a quick practice."}</p></div><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#EAFBF5] text-[#159C74]"><Icon name={chosenContinueTopic.icon} size={21} /></div></div>
            <div className="flex flex-wrap gap-2"><Button onClick={() => openLesson(chosenContinueTopic.id)} icon="BookOpen">Open lesson</Button><Button variant="secondary" onClick={() => openQuizSetup(chosenContinueTopic.id)} icon="Zap">Quiz</Button></div>
          </Surface>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3"><div><div className="mb-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-muted">Your learning paths</div><h2 className="text-xl font-extrabold tracking-[-.035em] text-ink">A good place to begin</h2></div><Button variant="ghost" onClick={() => { void navigate("learn"); }} icon="ArrowRight" className="px-2">All topics</Button></div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { title: "Grammar Galaxy", text: "Nine grammar topics, from sentence building to language functions.", icon: "Orbit", color: "text-[#5B5FEF]", bg: "bg-[#F0F0FF]", action: () => { setCategoryFilter("Grammar"); void navigate("learn"); } },
              { title: "Vocabulary Garden", text: "Nine vocabulary skills, from word forms to dictionary confidence.", icon: "Flower2", color: "text-[#169D77]", bg: "bg-[#EAFBF5]", action: () => { setCategoryFilter("Vocabulary"); void navigate("learn"); } },
              { title: "Flashcard Studio", text: `${TOPICS.reduce((sum, topic) => sum + topic.flashcards.length, 0)} quick prompts. Flip, review and remember.`, icon: "Layers3", color: "text-[#8659DE]", bg: "bg-[#F4EEFF]", action: () => { void navigate("flashcards"); } },
            ].map((path) => <button key={path.title} type="button" onClick={path.action} className="surface border-line flex min-h-[150px] flex-col rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 hover:border-[#c4c5f8] hover:shadow-[0_12px_26px_rgba(39,42,88,.07)] sm:p-5"><div className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${path.bg} ${path.color}`}><Icon name={path.icon} size={20} /></div><h3 className="mt-4 text-sm font-extrabold text-ink">{path.title}</h3><p className="mt-1 text-xs leading-5 text-muted">{path.text}</p><span className="mt-auto inline-flex items-center gap-1 pt-3 text-[11px] font-bold text-[#5B5FEF]">Explore <Icon name="ArrowRight" size={14} /></span></button>)}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
          <Surface className="p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3"><div><div className="mb-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-muted">Real practice, real progress</div><h2 className="text-lg font-extrabold text-ink">Topic mastery</h2></div><button type="button" onClick={() => { void navigate("learn"); }} className="text-xs font-bold text-[#5B5FEF]">View topics</button></div>
            <div className="space-y-3">{TOPICS.slice(0, 5).map((topic) => {
              const stats = data.stats.topicPerformance[topic.id];
              const accuracy = stats?.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;
              return <button type="button" key={topic.id} onClick={() => openLesson(topic.id)} className="flex w-full items-center gap-3 rounded-xl py-1.5 text-left hover:bg-soft">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-soft text-[#5B5FEF]"><Icon name={topic.icon} size={16} /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3 text-xs font-bold text-ink"><span className="truncate">{topic.name}</span><span className="shrink-0 text-muted">{stats?.answered ? `${accuracy}%` : "Not tried"}</span></span><span className="mt-1.5 block"><ProgressBar value={stats?.answered ? accuracy : 0} color={topic.category === "Grammar" ? "#5B5FEF" : "#36D6A5"} height="h-1.5" /></span></span>
              </button>;
            })}</div>
            <p className="mt-4 text-[10px] leading-4 text-muted">Accuracy uses completed quiz answers only. A topic with no quiz results is not rated yet.</p>
          </Surface>
          <Surface className="p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3"><div><div className="mb-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-muted">Latest activity</div><h2 className="text-lg font-extrabold text-ink">Recent quizzes</h2></div><div className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-[#EAF7FF] text-[#248BC1]"><Icon name="History" size={18} /></div></div>
            {recentAttempts.length ? <div className="space-y-1">{recentAttempts.map((attempt) => {
              const topic = TOPIC_BY_ID[attempt.topicId];
              return <div key={attempt.id} className="flex items-center gap-3 rounded-2xl px-2 py-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${attempt.status === "completed" ? "bg-[#EAFBF5] text-[#159C74]" : "bg-[#FFF0EF] text-[#E66565]"}`}><Icon name={attempt.status === "completed" ? "CircleCheck" : "ShieldX"} size={19} /></div>
                <div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-ink">{topic?.name ?? "Class 10 English"}</div><div className="mt-1 text-[10px] text-muted">{difficultyLabel(attempt.difficulty)} | {formatDate(attempt.completedAt ?? attempt.startedAt)}</div></div>
                {attempt.status === "completed" ? <div className="text-right"><div className="text-sm font-extrabold text-[#5B5FEF]">+{attempt.pointsEarned} XP</div><div className="text-[10px] text-muted">{attempt.correctCount}/15 correct</div></div> : <span className="text-[10px] font-bold text-[#D35C5C]">Cancelled | 0 XP</span>}
              </div>;
            })}</div> : <div className="flex min-h-[160px] flex-col items-center justify-center text-center"><div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-soft text-muted"><Icon name="ClipboardList" size={21} /></div><p className="mt-3 text-sm font-bold text-ink">Your first result is waiting.</p><p className="mt-1 max-w-xs text-xs leading-5 text-muted">Complete a quiz to see scores, accuracy and learning takeaways here.</p></div>}
            <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-4 text-[11px] font-semibold text-muted"><span>{data.stats.completedQuizzes} completed</span><span className="text-[#C7C9D9]">|</span><span>{overallAccuracy === null ? "Accuracy not rated" : `${overallAccuracy}% overall accuracy`}</span><span className="text-[#C7C9D9]">|</span><span>{formatDuration(data.stats.totalTimeSeconds)} quiz time</span></div>
          </Surface>
        </section>

        <section className="grid gap-4 md:grid-cols-[.9fr_1.1fr]">
          <Surface className="p-5 sm:p-6"><div className="mb-3 flex items-center justify-between"><div><div className="mb-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-muted">Your collection</div><h2 className="text-lg font-extrabold text-ink">Recent awards</h2></div><button type="button" onClick={() => { void navigate("awards"); }} className="text-xs font-bold text-[#5B5FEF]">Vault <Icon name="ArrowRight" size={13} className="inline" /></button></div>
            {recentAwards.length ? <div className="space-y-2">{recentAwards.map((award) => { const colors = rarityColors(award.rarity); return <button type="button" key={award.id} onClick={() => { setSelectedAward(award); void navigate("awards"); }} className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl bg-soft px-3 py-2.5 text-left"><span className={`flex h-9 w-9 items-center justify-center rounded-[13px] ${colors.background} ${colors.text}`}><Icon name={award.icon} size={18} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-ink">{award.name}</span><span className={`mt-0.5 block text-[9px] font-extrabold uppercase tracking-[.12em] ${colors.text}`}>{award.rarity}{award.verification === "imported_unverified" ? " | Imported" : ""}</span></span><Icon name="ChevronRight" size={16} className="text-muted" /></button>; })}</div> : <div className="rounded-2xl bg-soft p-4 text-xs leading-5 text-muted">No achievements unlocked yet. Complete lessons, review flashcards and finish quizzes to fill your vault.</div>}
          </Surface>
          <Surface className="flex flex-col justify-between gap-4 bg-[#F2F1FF] p-5 sm:flex-row sm:items-center sm:p-6"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-white text-[#5B5FEF] shadow-sm"><Icon name="ChartNoAxesCombined" size={21} /></div><div><div className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#5B5FEF]">Your pace</div><h2 className="mt-1 text-lg font-extrabold text-ink">{overallAccuracy === null ? "Your story starts here" : `${overallAccuracy}% accuracy so far`}</h2><p className="mt-1 max-w-lg text-xs leading-5 text-muted">{overallAccuracy === null ? "Start any topic to build a real picture of your strengths. Your dashboard updates as you learn." : `${data.stats.correctAnswers} correct answers across ${data.stats.questionsAnswered} submitted questions. Keep practising the topics that need a little more time.`}</p></div></div><Button onClick={() => { void navigate("settings"); }} variant="secondary" icon="Settings2">Settings</Button></Surface>
        </section>
      </div>
    );
  }

  if (view === "learn") {
    page = <div className="animate-enter"><PageHeading eyebrow="Class 10 curriculum" title="Learn something new." description="Seventeen focused topics. Start with a short lesson, practise the idea, then take a quiz when you are ready." actions={<Button onClick={() => openQuizSetup(chosenContinueTopic.id)} icon="Zap">Quick challenge</Button>} />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">{(["All", "Grammar", "Vocabulary"] as const).map((category) => <button type="button" key={category} onClick={() => setCategoryFilter(category)} className={`min-h-[42px] rounded-full px-4 text-xs font-bold transition ${categoryFilter === category ? "bg-[#5B5FEF] text-white" : "surface border border-line text-muted hover:text-ink"}`}>{category}{category === "All" ? ` | ${TOPICS.length}` : ` | ${TOPICS.filter((topic) => topic.category === category).length}`}</button>)}</div>
        <label className="relative block w-full sm:max-w-[290px]"><Icon name="Search" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input value={topicSearch} onChange={(event) => setTopicSearch(event.target.value)} placeholder="Find a topic" className="min-h-[44px] w-full rounded-2xl border border-line bg-surface pl-10 pr-4 text-sm text-ink outline-none focus:border-[#7f82f4] focus:ring-4 focus:ring-[#5B5FEF]/10" /></label>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted"><span className="font-semibold text-ink">{topicList.length} topics</span><span>|</span><span>{data.lessonProgress.length} lessons saved</span><span>|</span><span>{data.stats.completedQuizzes} completed quizzes</span></div>
      {topicList.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{topicList.map((topic) => <TopicTile key={topic.id} topic={topic} progress={progressForTopic(topic.id)} lessonDone={data.lessonProgress.includes(topic.id)} onClick={() => openLesson(topic.id)} />)}</div> : <Surface className="p-8 text-center"><p className="font-bold text-ink">No topics match that search.</p><Button className="mt-4" variant="secondary" onClick={() => { setTopicSearch(""); setCategoryFilter("All"); }}>Clear filters</Button></Surface>}
    </div>;
  }

  if (view === "lesson") {
    const topic = selectedTopic;
    const practice = topic.practice[practiceIndex];
    const practiceProgress = data.practiceProgress[`${topic.id}:${practiceIndex}`];
    const isSaved = data.lessonProgress.includes(topic.id);
    const tone = topicTone[topic.color] ?? topicTone.indigo;
    page = <div className="animate-enter">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-muted"><button type="button" onClick={() => { void navigate("learn"); }} className="hover:text-[#5B5FEF]">Learn</button><Icon name="ChevronRight" size={14} /><span className="truncate text-ink">{topic.name}</span></div>
      <section className="mb-5 rounded-[28px] bg-gradient-to-br from-[#F2F1FF] to-[#F7F8FF] p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div className="max-w-3xl"><div className="mb-3 flex flex-wrap items-center gap-2"><span className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${tone.background} ${tone.foreground}`}><Icon name={topic.icon} size={20} /></span><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#5B5FEF]">{topic.category} | Topic {String(topic.number).padStart(2, "0")}</span>{isSaved && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#159C74]"><Icon name="CircleCheck" size={13} /> Saved</span>}</div><h1 className="text-[26px] font-extrabold leading-tight tracking-[-.045em] text-ink sm:text-4xl">{topic.name}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{topic.summary}</p></div><div className="flex flex-wrap gap-2"><Button onClick={() => openQuizSetup(topic.id)} icon="Zap">Start a quiz</Button><Button variant="secondary" onClick={() => { setFlashTopic(topic.id); setFlashCategory(topic.category); void navigate("flashcards"); }} icon="Layers3">Flashcards</Button></div></div>
      </section>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-5">
          <Surface className="p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F0F0FF] text-[#5B5FEF]"><Icon name="Lightbulb" size={17} /></span><h2 className="text-lg font-extrabold text-ink">The idea</h2></div><div className="space-y-3">{topic.lesson.map((paragraph) => <p key={paragraph} className="flex gap-3 text-sm leading-7 text-muted"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B5CF6]" /><span>{paragraph}</span></p>)}</div><div className="mt-5 rounded-2xl border border-[#DFE0FF] bg-[#F7F6FF] p-4"><div className="mb-1 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#5B5FEF]">Keep in mind</div><p className="text-sm font-semibold leading-6 text-ink">{topic.keyRule}</p></div></Surface>
          <Surface className="p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF7FF] text-[#248BC1]"><Icon name="PanelsTopLeft" size={17} /></span><h2 className="text-lg font-extrabold text-ink">See it in a sentence</h2></div><div className="space-y-2">{topic.examples.map((example, index) => <div key={`${example.before}-${index}`} className="rounded-[18px] bg-soft p-4"><div className="mb-2 text-[10px] font-bold uppercase tracking-[.13em] text-muted">Example {index + 1}</div><p className="text-xs leading-5 text-muted">{example.before}</p><p className="mt-1 text-sm font-bold leading-6 text-ink">{example.after}</p><p className="mt-1 text-xs leading-5 text-muted">{example.note}</p></div>)}</div></Surface>
          <Surface className="p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF0EF] text-[#E66565]"><Icon name="TriangleAlert" size={17} /></span><h2 className="text-lg font-extrabold text-ink">Common mistakes</h2></div><div className="grid gap-3 sm:grid-cols-2">{topic.mistakes.map((mistake, index) => <div key={`${mistake.before}-${index}`} className="rounded-[18px] border border-[#F4D8D5] bg-[#FFF9F8] p-4"><div className="flex items-start gap-2"><Icon name="X" size={16} className="mt-0.5 shrink-0 text-[#E66565]" /><p className="text-xs font-semibold leading-5 text-[#9E5252]">{mistake.before}</p></div><div className="my-2 h-px bg-[#F4D8D5]" /><div className="flex items-start gap-2"><Icon name="Check" size={16} className="mt-0.5 shrink-0 text-[#159C74]" /><p className="text-xs font-bold leading-5 text-ink">{mistake.after}</p></div><p className="mt-2 text-[11px] leading-5 text-muted">{mistake.note}</p></div>)}</div></Surface>
        </div>
        <div className="space-y-5">
          <Surface className="overflow-hidden p-0"><div className="bg-[#171A2E] p-5 text-white sm:p-6"><div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#B9BAFF]"><Icon name="ListChecks" size={15} /> Check your understanding</div><h2 className="text-xl font-extrabold">Quick practice</h2><p className="mt-1 text-xs leading-5 text-[#c1c3d5]">Choose the best answer, then check your reasoning.</p></div>
            {practice && <div className="p-5 sm:p-6"><div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.12em] text-muted"><span>Practice {practiceIndex + 1} of {topic.practice.length}</span><span>{practiceProgress?.attempts ? `${practiceProgress.attempts} saved attempt${practiceProgress.attempts === 1 ? "" : "s"}` : "New"}</span></div><ProgressBar value={((practiceIndex + 1) / topic.practice.length) * 100} color="#8B5CF6" height="h-1.5" /><p className="mt-4 text-sm font-bold leading-6 text-ink">{practice.prompt}</p><div className="mt-3 space-y-2">{practice.options.map((option) => { const chosen = practiceChoice === option; const right = practiceChecked && normalizeFingerprint(option) === normalizeFingerprint(practice.answer); const wrong = practiceChecked && chosen && !right; return <button key={option} type="button" disabled={practiceChecked} onClick={() => setPracticeChoice(option)} className={`flex min-h-[44px] w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold leading-5 transition ${right ? "border-[#9de4cd] bg-[#effcf7] text-[#117a5a]" : wrong ? "border-[#ffc7c3] bg-[#fff4f3] text-[#b14c4c]" : chosen ? "border-[#a5a6fa] bg-[#F2F1FF] text-[#4d50c8]" : "border-line text-muted hover:bg-soft"}`}><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current/25">{right ? <Icon name="Check" size={12} /> : wrong ? <Icon name="X" size={12} /> : chosen ? <Icon name="Circle" size={9} /> : null}</span>{option}</button>; })}</div>
              {practiceChecked && <div className={`mt-4 rounded-2xl p-3 text-xs leading-5 ${normalizeFingerprint(practiceChoice) === normalizeFingerprint(practice.answer) ? "bg-[#EAFBF5] text-[#226f59]" : "bg-[#FFF6D9] text-[#785e18]"}`}><div className="font-extrabold">{normalizeFingerprint(practiceChoice) === normalizeFingerprint(practice.answer) ? "That's right." : `The correct answer is ${practice.answer}.`}</div><p className="mt-1">{practice.explanation} {practice.takeaway}</p></div>}
              <div className="mt-4 flex gap-2">{!practiceChecked ? <Button onClick={() => void checkPractice()} disabled={!practiceChoice} className="w-full" icon="Check">Check answer</Button> : <Button onClick={() => void completePractice()} className="w-full" icon={practiceIndex === topic.practice.length - 1 ? "CircleCheck" : "ArrowRight"}>{practiceIndex === topic.practice.length - 1 ? "Finish practice" : "Next question"}</Button>}</div>
            </div>}
          </Surface>
          <Surface className="p-5 sm:p-6"><div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#5B5FEF]"><Icon name="Layers3" size={15} /> Flashcard set</div><h2 className="text-lg font-extrabold text-ink">Remember it later.</h2><p className="mt-1 text-xs leading-5 text-muted">{topic.flashcards.length} topic flashcards are ready to review, flip and save.</p><Button className="mt-4 w-full" variant="secondary" onClick={() => { setFlashTopic(topic.id); setFlashCategory(topic.category); void navigate("flashcards"); }} icon="ArrowRight">Open flashcards</Button></Surface>
          <Surface className="p-5 sm:p-6"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#EAFBF5] text-[#159C74]"><Icon name="BookmarkCheck" size={20} /></div><div><h2 className="text-sm font-extrabold text-ink">Save this lesson</h2><p className="mt-1 text-xs leading-5 text-muted">Mark the topic complete after reading and practising. Your lesson status stays on this device.</p></div></div><Button className="mt-4 w-full" variant={isSaved ? "secondary" : "primary"} disabled={isSaved} onClick={() => void openLessonComplete(topic.id)} icon={isSaved ? "CircleCheck" : "BookmarkPlus"}>{isSaved ? "Lesson saved" : "Mark lesson complete"}</Button></Surface>
        </div>
      </div>
    </div>;
  }

  if (view === "quiz-setup") {
    const difficultyInfo: { id: Difficulty; time: string; subtitle: string; color: string; icon: string }[] = [
      { id: "easy", time: "8 minutes", subtitle: "Build your confidence", color: "#36D6A5", icon: "Leaf" },
      { id: "medium", time: "12 minutes", subtitle: "Find your steady pace", color: "#8B5CF6", icon: "Mountain" },
      { id: "hard", time: "15 minutes", subtitle: "Stretch your skills", color: "#FF6B6B", icon: "Flame" },
    ];
    page = <div className="animate-enter mx-auto max-w-4xl">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-muted"><button type="button" onClick={() => { void navigate("learn"); }} className="hover:text-[#5B5FEF]">Learn</button><Icon name="ChevronRight" size={14} /><span className="text-ink">Quiz setup</span></div>
      <PageHeading eyebrow="15 questions | one focused session" title="Set your challenge." description={`Build a fresh quiz for ${quizTopic.name}. Your selected difficulty sets the timer and completion bonus.`} />
      {focusQuestions.length > 0 && <div className="mb-5 rounded-2xl border border-[#DFE0FF] bg-[#F2F1FF] p-4 text-xs leading-5 text-[#4f5178]"><span className="font-extrabold">Focused review:</span> The AI quiz will emphasize the skills from your missed answers while creating new questions.</div>}
      <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <Surface className="p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-muted">Choose a level</div><h2 className="mt-1 text-lg font-extrabold text-ink">How far will you stretch?</h2></div><span className="rounded-full bg-[#F0F0FF] px-3 py-1.5 text-[10px] font-extrabold text-[#5559E8]">Exactly 15</span></div>
          <div className="space-y-2.5">{difficultyInfo.map((item) => <button key={item.id} type="button" onClick={() => { setQuizDifficulty(item.id); setReadyQuestions(null); setReadyMode(null); }} className={`flex min-h-[78px] w-full items-center gap-3 rounded-[18px] border p-3.5 text-left transition ${quizDifficulty === item.id ? "border-[#a5a6fa] bg-[#F8F7FF] shadow-[0_0_0_2px_rgba(91,95,239,.08)]" : "border-line hover:bg-soft"}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]" style={{ backgroundColor: `${item.color}1c`, color: item.color }}><Icon name={item.icon} size={19} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-ink">{item.id.charAt(0).toUpperCase() + item.id.slice(1)}</span><span className="mt-0.5 block text-xs text-muted">{item.subtitle} | {item.time}</span></span><span className="text-right"><span className="block text-[11px] font-extrabold text-ink">+{item.id === "easy" ? 10 : item.id === "medium" ? 20 : 30} XP</span><span className="block text-[9px] text-muted">completion bonus</span></span><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${quizDifficulty === item.id ? "border-[#5B5FEF] bg-[#5B5FEF] text-white" : "border-[#C8CAD8]"}`}>{quizDifficulty === item.id && <Icon name="Check" size={12} />}</span></button>)}</div>
          <div className="mt-5 rounded-2xl border border-[#F0D881] bg-[#FFF8E1] p-4 text-xs leading-5 text-[#78611d]"><div className="mb-1 flex items-center gap-2 font-extrabold"><Icon name="ShieldAlert" size={16} /> Anti-cheat mode is enabled</div><p>Leaving the quiz, switching tabs or windows, or hiding this page during the attempt will automatically cancel your quiz. Your cancelled attempt will not earn points or completion rewards.</p><p className="mt-2 text-[10px] leading-4">Focus and visibility checks work within browser capabilities. This is a deterrent, not tamper-proof proctoring.</p><label className="mt-3 flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl bg-white/70 px-3 text-xs font-bold text-[#594a1c]"><input type="checkbox" checked={antiCheatAcknowledged} onChange={(event) => { setAntiCheatAcknowledged(event.target.checked); setReadyQuestions(null); setReadyMode(null); }} className="h-4 w-4 accent-[#5B5FEF]" /><span>I have read and understand the quiz rules.</span></label></div>
        </Surface>
        <Surface className="flex flex-col p-5 sm:p-6"><div className="mb-4 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#F0F0FF] text-[#5B5FEF]"><Icon name={quizTopic.icon} size={21} /></div><div className="min-w-0"><div className="text-[10px] font-extrabold uppercase tracking-[.14em] text-muted">Selected topic</div><h2 className="mt-1 text-sm font-extrabold leading-5 text-ink">{quizTopic.name}</h2></div></div>
          <p className="mb-5 text-xs leading-5 text-muted">AI questions are generated securely by the Vercel API route when <code className="rounded bg-soft px-1">GROQ_API_KEY</code> is configured. Your attempts and question history stay in local browser storage.</p>
          <div className="mt-auto space-y-2.5">
            <Button className="w-full" disabled={!antiCheatAcknowledged || generationState !== "idle"} onClick={() => void requestQuiz("ai")} icon={generationState === "ai" ? "LoaderCircle" : "Sparkles"}>{generationState === "ai" ? "Creating 15 AI questions..." : "Generate AI Quiz"}</Button>
            <Button variant="secondary" className="w-full" disabled={!antiCheatAcknowledged || generationState !== "idle"} onClick={() => void requestQuiz("offline")} icon={generationState === "offline" ? "LoaderCircle" : "BookOpenCheck"}>{generationState === "offline" ? "Preparing 15 questions..." : "Use Offline Practice Set"}</Button>
          </div>
          {!antiCheatAcknowledged && <p className="mt-3 text-center text-[10px] font-semibold text-muted">Acknowledge the quiz rules to continue.</p>}
          {generationState !== "idle" && <div role="status" className="mt-4 flex items-center gap-2 rounded-2xl bg-soft p-3 text-xs font-semibold text-muted"><Icon name="LoaderCircle" size={16} className="animate-spin text-[#5B5FEF]" />Validating the full 15-question set before the timer starts.</div>}
          {generationError && <div role="alert" className="mt-4 rounded-2xl border border-[#F4D8D5] bg-[#FFF7F6] p-3 text-xs leading-5 text-[#9E5252]"><div className="font-extrabold">Quiz generation needs another try</div><p className="mt-1">{generationError}</p><Button variant="secondary" className="mt-3 min-h-[40px] w-full" onClick={() => void requestQuiz("ai")} disabled={!antiCheatAcknowledged || generationState !== "idle"} icon="RotateCw">Retry AI generation</Button></div>}
          {readyQuestions && <div className="mt-4 animate-enter rounded-2xl border border-[#B7E8D8] bg-[#EFFCF7] p-4"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-[#36D6A5]/20 text-[#159C74]"><Icon name="CircleCheck" size={19} /></div><div><div className="text-sm font-extrabold text-[#176A52]">15 questions validated</div><p className="mt-1 text-[11px] leading-5 text-[#477b69]">{readyMode === "ai" ? "Fresh questions from Groq" : "Offline practice set"} | {difficultyLabel(quizDifficulty)} | {difficultyInfo.find((item) => item.id === quizDifficulty)?.time}</p></div></div><Button className="mt-4 w-full" onClick={() => void startReadyQuiz()} icon="Play">Start quiz</Button></div>}
          <button type="button" onClick={() => { setSelectedTopicId(quizTopic.id); setView("lesson"); }} className="mt-4 flex min-h-[42px] w-full items-center justify-center gap-2 text-xs font-bold text-[#5B5FEF] hover:text-[#4448c7]"><Icon name="BookOpen" size={15} />Back to lesson</button>
        </Surface>
      </div>
    </div>;
  }

  if (view === "results" && resultAttempt) {
    const accuracy = Math.round((resultAttempt.correctCount / 15) * 100);
    const awardIds = new Set(data.awards.filter((award) => award.unlockedAt === resultAttempt.completedAt && award.verification === "local").map((award) => award.id));
    const justUnlocked = AWARDS.filter((award) => awardIds.has(award.id));
    const topic = TOPIC_BY_ID[resultAttempt.topicId] ?? TOPICS[0];
    const missedPrompts = resultAttempt.questions.filter((question) => normalizeAnswer(resultAttempt.answers[question.id] ?? "") !== normalizeAnswer(question.correctAnswer)).map((question) => question.prompt).slice(0, 5);
    page = <div className="animate-enter">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-muted"><button type="button" onClick={() => { void navigate("home"); }} className="hover:text-[#5B5FEF]">Home</button><Icon name="ChevronRight" size={14} /><span className="text-ink">Quiz results</span></div>
      <section className="relative mb-5 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#171A2E] to-[#353987] p-5 text-white sm:p-7"><div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between"><div><div className="mb-2 text-[10px] font-extrabold uppercase tracking-[.17em] text-[#B9BAFF]">Session complete | {difficultyLabel(resultAttempt.difficulty)}</div><h1 className="text-3xl font-extrabold tracking-[-.05em] sm:text-4xl">Nice work, {name.split(/\s+/)[0]}.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#D4D5E7]">{topic.name} | {formatDuration(resultAttempt.timeTakenSeconds)} used | {accuracy}% accuracy.</p></div><div className="flex items-center gap-4 rounded-[20px] border border-white/10 bg-white/[.08] px-5 py-4"><div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#FFD166]/20 text-[#FFD166]"><Icon name="Sparkles" size={23} /></div><div><div className="text-[10px] font-bold uppercase tracking-[.13em] text-[#c5c7dc]">Points earned</div><div className="text-3xl font-extrabold">{resultAttempt.pointsEarned} <span className="text-sm text-[#c5c7dc]">XP</span></div></div></div></div></section>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{[
        { label: "Correct", value: `${resultAttempt.correctCount} / 15`, icon: "CircleCheck", tone: "text-[#159C74]", bg: "bg-[#EAFBF5]" },
        { label: "Incorrect", value: resultAttempt.incorrectCount, icon: "CircleX", tone: "text-[#E66565]", bg: "bg-[#FFF0EF]" },
        { label: "Unanswered", value: resultAttempt.unansweredCount, icon: "CircleHelp", tone: "text-[#8A6A1A]", bg: "bg-[#FFF6D9]" },
        { label: "Accuracy", value: `${accuracy}%`, icon: "ChartNoAxesCombined", tone: "text-[#5B5FEF]", bg: "bg-[#F0F0FF]" },
      ].map((stat) => <Surface key={stat.label} className="p-4 sm:p-5"><div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-[13px] ${stat.bg} ${stat.tone}`}><Icon name={stat.icon} size={18} /></div><div className="text-xl font-extrabold text-ink">{stat.value}</div><div className="mt-1 text-[11px] font-semibold text-muted">{stat.label}</div></Surface>)}</div>
      {justUnlocked.length > 0 && <Surface className="mb-5 border-[#F1D77A] bg-[#FFF9E6] p-5"><div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#80631A]"><Icon name="Award" size={18} /> New awards unlocked</div><div className="flex flex-wrap gap-2">{justUnlocked.map((award) => <span key={award.id} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-ink"><Icon name={award.icon} size={15} className="text-[#D8A627]" />{award.name}</span>)}</div></Surface>}
      <div className="mb-6 flex flex-wrap gap-2"><Button onClick={() => openQuizSetup(topic.id, [], resultAttempt.difficulty)} icon="RotateCw">Retry Quiz</Button><Button variant="secondary" onClick={() => openQuizSetup(topic.id, missedPrompts, resultAttempt.difficulty)} icon="Target">Practise Mistakes</Button><Button variant="ghost" onClick={() => { void navigate("home"); }} icon="House">Return to Dashboard</Button></div>
      <Surface className="mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-muted">Progress updated</div><h2 className="mt-1 text-lg font-extrabold text-ink">Level {currentLevel} | {totalXp.toLocaleString()} total XP</h2><p className="mt-1 text-xs text-muted">{levelProgress} of 250 XP towards Level {currentLevel + 1} | {data.stats.completedQuizzes} completed quizzes saved.</p></div><div className="w-full sm:max-w-[220px]"><ProgressBar value={(levelProgress / 250) * 100} color="#8B5CF6" height="h-2.5" /></div></Surface>
      <section><div className="mb-3"><div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-muted">Review & learn</div><h2 className="mt-1 text-xl font-extrabold text-ink">Your answers and takeaways</h2></div><div className="space-y-2">{resultAttempt.questions.map((question, index) => {
        const submitted = resultAttempt.answers[question.id] ?? "";
        const right = normalizeFingerprint(submitted) === normalizeFingerprint(question.correctAnswer);
        return <details key={question.id} className="surface border-line group rounded-[18px] border"><summary className="flex min-h-[62px] cursor-pointer list-none items-center gap-3 px-4 py-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] text-xs font-extrabold ${right ? "bg-[#EAFBF5] text-[#159C74]" : submitted ? "bg-[#FFF0EF] text-[#D35C5C]" : "bg-soft text-muted"}`}>{right ? <Icon name="Check" size={15} /> : !submitted ? <Icon name="Minus" size={15} /> : <Icon name="X" size={15} />}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-ink">{index + 1}. {question.prompt}</span><span className="mt-0.5 block text-[10px] text-muted">{getQuestionTypeLabel(question)}</span></span><Icon name="ChevronDown" size={17} className="shrink-0 text-muted transition group-open:rotate-180" /></summary><div className="border-t border-line px-4 pb-4 pt-3 text-xs leading-5"><div className="grid gap-2 sm:grid-cols-2"><div className="rounded-xl bg-soft p-3"><div className="text-[9px] font-extrabold uppercase tracking-[.13em] text-muted">Your answer</div><div className={`mt-1 font-semibold ${right ? "text-[#159C74]" : "text-[#C55B5B]"}`}>{submitted || "No answer submitted"}</div></div><div className="rounded-xl bg-[#EFFCF7] p-3"><div className="text-[9px] font-extrabold uppercase tracking-[.13em] text-[#159C74]">Correct answer</div><div className="mt-1 font-bold text-ink">{question.correctAnswer}</div></div></div><p className="mt-3 text-muted"><strong className="text-ink">Why:</strong> {question.explanation}</p><p className="mt-2 text-[#5B5FEF]"><strong>Takeaway:</strong> {question.takeaway}</p></div></details>;
      })}</div></section>
    </div>;
  }

  if (view === "flashcards") {
    const card = flashcards[flashIndex];
    const cardProgress = card ? data.flashcards.find((entry) => entry.cardId === card.cardId) : undefined;
    const dueCount = TOPICS.reduce((sum, topic) => sum + topic.flashcards.filter((item) => data.flashcards.find((entry) => entry.cardId === `${topic.id}:${item.id}`)?.status === "review").length, 0);
    page = <div className="animate-enter"><PageHeading eyebrow="Recall, not rereading" title="Flashcard Studio." description="Flip a card, decide what you know, and save the review state on this device." actions={<Button variant="secondary" onClick={() => { setFlashShuffleKey((value) => value + 1); setFlashIndex(0); setFlashFlipped(false); }} icon="Shuffle">Shuffle</Button>} />
      <div className="mb-5 flex flex-col gap-3 rounded-[22px] bg-[#F2F1FF] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="flash-category">Category</label><select id="flash-category" value={flashCategory} onChange={(event) => setFlashCategory(event.target.value as typeof flashCategory)} className="min-h-[43px] rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink outline-none"><option value="All">All categories</option><option value="Grammar">Grammar</option><option value="Vocabulary">Vocabulary</option></select><label className="sr-only" htmlFor="flash-topic">Topic</label><select id="flash-topic" value={flashTopic} onChange={(event) => setFlashTopic(event.target.value)} className="min-h-[43px] max-w-[220px] rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink outline-none"><option value="all">All topics</option>{TOPICS.filter((topic) => flashCategory === "All" || topic.category === flashCategory).map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select><button type="button" aria-pressed={difficultOnly} onClick={() => setDifficultOnly((value) => !value)} className={`min-h-[43px] rounded-xl px-3 text-xs font-bold transition ${difficultOnly ? "bg-[#FF6B6B] text-white" : "border border-line bg-surface text-muted"}`}>Difficult only | {dueCount}</button></div><div className="flex items-center gap-2 text-[11px] font-semibold text-muted"><Icon name="BookmarkCheck" size={16} className="text-[#159C74]" />{knownCards} known | {reviewedCards} reviews saved</div></div>
      {card ? <div className="mx-auto grid w-full max-w-4xl gap-5 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col">
          <div className="mb-3 flex items-center justify-between text-xs font-bold text-muted"><span>Card {flashIndex + 1} of {flashcards.length}</span><span>{card.category} | {card.topicName}</span></div>
          <button type="button" aria-pressed={flashFlipped} aria-label={flashFlipped ? "Show question" : "Flip card to reveal answer"} onClick={() => setFlashFlipped((value) => !value)} className="flash-card-outer relative min-h-[290px] w-full rounded-[30px] text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B5FEF]/25 sm:min-h-[365px]">
            <div className={`flash-card-inner absolute inset-0 ${flashFlipped ? "is-flipped" : ""}`}>
              <div className="flash-card-face surface border-line absolute inset-0 flex flex-col justify-between rounded-[30px] border p-5 shadow-[0_18px_45px_rgba(43,45,113,.08)] sm:p-8"><div className="flex items-center justify-between"><span className="rounded-full bg-[#F0F0FF] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#5B5FEF]">Question</span><Icon name="RotateCw" size={18} className="text-muted" /></div><div className="mx-auto max-w-xl py-6 text-center"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[19px] bg-[#F2F1FF] text-[#5B5FEF]"><Icon name={TOPIC_BY_ID[card.topicId]?.icon ?? "Layers3"} size={25} /></div><h2 className="text-2xl font-extrabold leading-tight tracking-[-.04em] text-ink sm:text-3xl">{card.front}</h2><p className="mt-3 text-xs text-muted">Tap or press Space to reveal</p></div><div className="flex items-center justify-between text-[10px] font-semibold text-muted"><span>{card.topicName}</span><span>{cardProgress?.status === "review" ? "Needs another look" : cardProgress?.status === "known" ? "Marked known" : "Not reviewed yet"}</span></div></div>
              <div className="flash-card-face flash-card-back surface border-line absolute inset-0 flex flex-col justify-between rounded-[30px] border p-5 shadow-[0_18px_45px_rgba(43,45,113,.08)] sm:p-8"><div className="flex items-center justify-between"><span className="rounded-full bg-[#EAFBF5] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#159C74]">Answer</span><Icon name="Sparkles" size={18} className="text-[#D8A627]" /></div><div className="mx-auto max-w-xl py-6 text-center"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[19px] bg-[#EAFBF5] text-[#159C74]"><Icon name="Lightbulb" size={25} /></div><h2 className="text-xl font-extrabold leading-7 tracking-[-.03em] text-ink sm:text-2xl">{card.back}</h2><p className="mt-3 text-xs text-muted">How well did you recall it?</p></div><div className="flex items-center justify-between text-[10px] font-semibold text-muted"><span>{card.topicName}</span><span>Saved review: {cardProgress?.reviewCount ?? 0}</span></div></div>
            </div>
          </button>
          <div className="mt-4 flex items-center justify-between gap-2"><Button variant="secondary" disabled={flashIndex === 0} onClick={() => { setFlashIndex((index) => Math.max(0, index - 1)); setFlashFlipped(false); }} icon="ArrowLeft">Previous</Button><Button variant="ghost" onClick={() => { setFlashIndex(0); setFlashFlipped(false); }}>Restart session</Button><Button variant="secondary" disabled={flashIndex >= flashcards.length - 1} onClick={() => { setFlashIndex((index) => Math.min(flashcards.length - 1, index + 1)); setFlashFlipped(false); }} icon="ArrowRight">Next</Button></div>
        </div>
        <aside className="space-y-3"><Surface className="p-4"><div className="mb-3 text-xs font-extrabold text-ink">Your session</div><div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-muted"><span>Position</span><span>{flashIndex + 1} / {flashcards.length}</span></div><ProgressBar value={((flashIndex + 1) / Math.max(1, flashcards.length)) * 100} color="#8B5CF6" height="h-2" /><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#EAFBF5] p-3"><div className="text-lg font-extrabold text-[#159C74]">{knownCards}</div><div className="text-[10px] font-semibold text-muted">Known cards</div></div><div className="rounded-xl bg-[#FFF6D9] p-3"><div className="text-lg font-extrabold text-[#9A7415]">{dueCount}</div><div className="text-[10px] font-semibold text-muted">Difficult</div></div></div></Surface><Surface className="p-4"><div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-ink"><Icon name="Keyboard" size={16} className="text-[#5B5FEF]" />Keyboard shortcuts</div><p className="text-[11px] leading-5 text-muted">Space flips the card. Arrow keys move between cards. All controls are also available by touch.</p></Surface>
          {card && <div className="grid gap-2"><Button variant="secondary" className="w-full" onClick={() => void markCard(card.cardId, "review")} icon="RotateCcw">Review Again</Button><Button className="w-full" onClick={() => void markCard(card.cardId, "known")} icon="Check">Know It</Button></div>}
        </aside>
      </div> : <Surface className="mx-auto max-w-2xl p-8 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#EAFBF5] text-[#159C74]"><Icon name="CircleCheck" size={22} /></div><h2 className="mt-4 text-lg font-extrabold text-ink">No cards need a review right now.</h2><p className="mt-1 text-sm leading-6 text-muted">Change filters or mark cards as difficult to build a review set.</p><Button className="mt-4" variant="secondary" onClick={() => { setDifficultOnly(false); setFlashTopic("all"); setFlashCategory("All"); }}>Show all flashcards</Button></Surface>}
    </div>;
  }

  if (view === "awards") {
    const rarityCounts: Record<AwardRarity, number> = { Common: 60, Rare: 45, Epic: 35, Legendary: 25, Mystic: 20 };
    const rarityOrder: AwardRarity[] = ["Common", "Rare", "Epic", "Legendary", "Mystic"];
    page = <div className="animate-enter"><PageHeading eyebrow="A collection built by learning" title="Awards Vault." description="185 deterministic achievements. Every unlock comes from saved learning activity, never from random drops or cancelled quizzes." />
      <section className="mb-5 rounded-[25px] bg-gradient-to-r from-[#171A2E] to-[#383B88] p-5 text-white sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="mb-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#B9BAFF]">Collection progress</div><div className="flex items-baseline gap-2"><span className="text-4xl font-extrabold tracking-[-.05em]">{unlockedAwards.length}</span><span className="text-sm font-semibold text-[#c5c7dc]">of 185 awards</span></div><div className="mt-3 max-w-md"><ProgressBar value={(unlockedAwards.length / 185) * 100} color="#FFD166" height="h-2.5" /></div></div><div className="grid grid-cols-5 gap-1.5 sm:gap-2">{rarityOrder.map((rarity) => <div key={rarity} className="min-w-[52px] rounded-xl border border-white/10 bg-white/[.06] px-2 py-2 text-center"><div className="text-sm font-extrabold">{awardViews.filter((award) => award.rarity === rarity && award.unlocked).length}</div><div className="mt-0.5 text-[8px] font-bold uppercase tracking-[.1em] text-[#c5c7dc]">{rarity}</div></div>)}</div></div><p className="mt-4 text-[10px] leading-5 text-[#b9bbd1]">Awards restored from a JSON backup are shown as imported and unverified. Browser-only backups cannot prove that a learning record was not edited.</p></section>
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <label className="relative"><Icon name="Search" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input value={awardSearch} onChange={(event) => setAwardSearch(event.target.value)} placeholder="Search awards" className="min-h-[44px] w-full rounded-2xl border border-line bg-surface pl-10 pr-4 text-sm text-ink outline-none focus:border-[#7f82f4] focus:ring-4 focus:ring-[#5B5FEF]/10" /></label>
        <label className="sr-only" htmlFor="award-filter">Award state</label><select id="award-filter" value={awardStatus} onChange={(event) => setAwardStatus(event.target.value as typeof awardStatus)} className="min-h-[44px] rounded-2xl border border-line bg-surface px-3 text-xs font-semibold text-ink outline-none"><option value="all">All awards</option><option value="unlocked">Unlocked</option><option value="locked">Locked</option></select>
        <label className="sr-only" htmlFor="award-sort">Sort awards</label><select id="award-sort" value={awardSort} onChange={(event) => setAwardSort(event.target.value as typeof awardSort)} className="min-h-[44px] rounded-2xl border border-line bg-surface px-3 text-xs font-semibold text-ink outline-none"><option value="rarity">Sort: rarity</option><option value="progress">Sort: progress</option><option value="recent">Sort: recent unlocks</option></select>
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">{(["All", ...rarityOrder] as const).map((rarity) => <button type="button" key={rarity} onClick={() => setAwardRarity(rarity as typeof awardRarity)} className={`min-h-[40px] shrink-0 rounded-full px-3.5 text-[11px] font-bold transition ${awardRarity === rarity ? "bg-[#171A2E] text-white" : "surface border border-line text-muted hover:text-ink"}`}>{rarity}{rarity !== "All" ? ` | ${rarityCounts[rarity]}` : ""}</button>)}</div>
      {awardRows.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{awardRows.map((award) => <AwardTile key={award.id} award={award} onClick={() => setSelectedAward(award)} />)}</div> : <Surface className="p-8 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-soft text-muted"><Icon name="SearchX" size={21} /></div><h2 className="mt-3 font-extrabold text-ink">No awards match these filters.</h2><p className="mt-1 text-xs text-muted">Try another rarity or search term.</p></Surface>}
    </div>;
  }

  if (view === "settings") {
    const saveProfileName = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const cleaned = nameDraft.trim().replace(/\s+/g, " ");
      if (cleaned.length < 2 || cleaned.length > 32 || /[\u0000-\u001f]/.test(cleaned)) { setNameError("Enter a display name between 2 and 32 characters."); return; }
      try { saveStudentName(cleaned); setName(cleaned); setNameDraft(cleaned); setNameError(""); showToast({ title: "Display name updated", tone: "success" }); }
      catch { setNameError("The browser could not save your name."); }
    };
    page = <div className="animate-enter"><PageHeading eyebrow="Your profile, your device" title="Settings." description="Manage your local profile, learning preferences and backups. No external account is used." />
      <div className="grid gap-5 xl:grid-cols-[.82fr_1.18fr]">
        <div className="space-y-5">
          <Surface className="p-5 sm:p-6"><div className="mb-4 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-[#F0F0FF] text-[#5B5FEF] text-sm font-extrabold">{initials(name)}</div><div><div className="text-[10px] font-extrabold uppercase tracking-[.14em] text-muted">Local profile</div><h2 className="text-lg font-extrabold text-ink">{name}</h2></div></div><form onSubmit={saveProfileName} className="space-y-3"><label htmlFor="settings-name" className="block text-xs font-bold text-ink">Edit display name</label><input id="settings-name" maxLength={32} autoComplete="nickname" value={nameDraft} onChange={(event) => { setNameDraft(event.target.value); setNameError(""); }} className="min-h-[48px] w-full rounded-2xl border border-line bg-surface px-4 text-sm text-ink outline-none focus:border-[#7f82f4] focus:ring-4 focus:ring-[#5B5FEF]/10" />{nameError && <p role="alert" className="text-xs font-semibold text-[#C94949]">{nameError}</p>}<Button type="submit" variant="secondary" icon="Save">Save name</Button></form><p className="mt-4 text-[10px] leading-5 text-muted">A display name is a local profile only. It is not a password-protected account.</p></Surface>
          <Surface className="p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-[#F2F1FF] text-[#5B5FEF]"><Icon name="Palette" size={18} /></div><div><h2 className="text-sm font-extrabold text-ink">Appearance</h2><p className="text-[11px] text-muted">Choose a comfortable reading theme.</p></div></div><div className="grid grid-cols-2 gap-2"><button type="button" aria-pressed={settings.theme === "light"} onClick={() => updateSetting({ theme: "light" })} className={`flex min-h-[70px] items-center gap-3 rounded-2xl border p-3 text-left ${settings.theme === "light" ? "border-[#a5a6fa] bg-[#F8F7FF]" : "border-line"}`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8F9FF] text-[#5B5FEF]"><Icon name="Sun" size={18} /></span><span className="text-xs font-bold text-ink">Light</span></button><button type="button" aria-pressed={settings.theme === "dark"} onClick={() => updateSetting({ theme: "dark" })} className={`flex min-h-[70px] items-center gap-3 rounded-2xl border p-3 text-left ${settings.theme === "dark" ? "border-[#8d8ff5] bg-[#25243b]" : "border-line"}`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25243b] text-white"><Icon name="Moon" size={18} /></span><span className="text-xs font-bold text-ink">Midnight</span></button></div><label className="mt-3 flex min-h-[48px] items-center gap-3 rounded-xl px-1 text-xs font-semibold text-ink"><input type="checkbox" checked={settings.reducedMotion} onChange={(event) => updateSetting({ reducedMotion: event.target.checked })} className="h-4 w-4 accent-[#5B5FEF]" />Reduce non-essential animation</label><p className="mt-1 text-[10px] leading-4 text-muted">The app also respects your device's reduced-motion preference.</p></Surface>
          <Surface className="p-5 sm:p-6"><div className="mb-2 flex items-center gap-2"><Icon name="Info" size={18} className="text-[#5B5FEF]" /><h2 className="text-sm font-extrabold text-ink">About English Studio</h2></div><p className="text-xs leading-5 text-muted">A Class 10 English learning companion for grammar, vocabulary, quizzes and flashcards. AI quiz requests run through a server-side Groq API route when configured. Student data remains in browser storage.</p><div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs"><span className="text-muted">Developer credit</span><span className="font-extrabold text-ink">Developed by Venush</span></div></Surface>
        </div>

        <div className="space-y-5">
          <Surface className="overflow-hidden p-0"><div className="bg-gradient-to-r from-[#F0F0FF] to-[#F7F2FF] p-5 sm:p-6"><div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#5B5FEF]"><Icon name="HardDriveDownload" size={16} /> Backup & Restore</div><h2 className="text-xl font-extrabold tracking-[-.035em] text-ink">Your learning belongs to you.</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-muted">Download a versioned JSON backup and import it on this or another browser. Backups do not sync automatically and cannot be treated as tamper-proof.</p></div>
            <div className="space-y-4 p-5 sm:p-6"><LocalDataNotice compact /><div className="rounded-2xl border border-[#F1D77A] bg-[#FFF8E1] p-4 text-xs leading-5 text-[#78611d]"><div className="mb-1 flex items-center gap-2 font-extrabold"><Icon name="Shield" size={16} /> Backup reminder</div>{BACKUP_REMINDER}<div className="mt-2 font-semibold">Last successful download initiated: {formatTimestamp(data.lastExportAt)}</div></div>
              <div className="grid gap-2 sm:grid-cols-2"><Button onClick={() => void downloadMyData()} icon="Download">Download My Data (.json)</Button><Button variant="secondary" onClick={() => importInputRef.current?.click()} icon="Upload">Import My Data (.json)</Button></div>
              <input ref={importInputRef} type="file" accept=".json,application/json" aria-label="Choose an English Studio JSON backup" className="hidden" onChange={(event) => void handleBackupFile(event)} />
              {backupMessage && <p role="status" className="rounded-xl bg-[#EAFBF5] px-3 py-2 text-xs font-semibold leading-5 text-[#176A52]">{backupMessage}</p>}
              {backupError && <p role="alert" className="rounded-xl bg-[#FFF0EF] px-3 py-2 text-xs font-semibold leading-5 text-[#A44646]">{backupError}</p>}
              {importError && <p role="alert" className="rounded-xl bg-[#FFF0EF] px-3 py-2 text-xs font-semibold leading-5 text-[#A44646]">{importError}</p>}
              {pendingImport && <div className="animate-enter rounded-[20px] border border-[#B7E8D8] bg-[#F4FCF8] p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#159C74]">Backup validated</div><h3 className="mt-1 break-all text-sm font-extrabold text-ink">{pendingImport.filename}</h3><p className="mt-1 text-[11px] text-muted">Exported {formatTimestamp(pendingImport.preview.exportedAt)} | profile: {pendingImport.preview.displayName}</p></div><Icon name="CircleCheck" size={20} className="shrink-0 text-[#159C74]" /></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{[{label:"Completed",value:pendingImport.preview.completedQuizzes},{label:"Cancelled",value:pendingImport.preview.cancelledQuizzes},{label:"Flashcards",value:pendingImport.preview.flashcardRecords},{label:"Awards",value:pendingImport.preview.unlockedAwards},{label:"Questions",value:pendingImport.preview.questionFingerprints},{label:"XP",value:pendingImport.preview.xp}].map((item) => <div key={item.label} className="rounded-xl bg-white px-3 py-2"><div className="text-sm font-extrabold text-ink">{item.value.toLocaleString()}</div><div className="text-[9px] font-semibold uppercase tracking-[.1em] text-muted">{item.label}</div></div>)}</div><div className="mt-4 rounded-xl bg-[#FFF6D9] p-3 text-[10px] leading-5 text-[#78611d]">Imported history will be labelled unverified. Quiz and award records from a JSON backup are not signed by a trusted server.</div><div className="mt-3 grid gap-2 sm:grid-cols-2"><Button variant="danger" onClick={() => confirmImport("replace")} icon="Replace">Restore Backup</Button><Button variant="secondary" onClick={() => confirmImport("merge")} icon="GitMerge">Merge Backup</Button></div></div>}
              <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2"><div className="rounded-2xl bg-soft p-4"><div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-ink"><Icon name="Fingerprint" size={16} className="text-[#5B5FEF]" />Question history</div><p className="text-[10px] leading-5 text-muted">{data.questionHistory.length} saved fingerprints. Clear this list to restart duplicate prevention; your completed quiz answers stay saved.</p><Button className="mt-3 min-h-[40px] w-full" variant="secondary" onClick={showClearHistoryDialog} disabled={!data.questionHistory.length} icon="Trash2">Clear Question History</Button></div><div className="rounded-2xl bg-[#FFF7F6] p-4"><div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-[#A44646]"><Icon name="TriangleAlert" size={16} />Reset progress</div><p className="text-[10px] leading-5 text-[#916666]">Erase all learning records from this browser. Your display name and theme preferences will remain.</p><Button className="mt-3 min-h-[40px] w-full" variant="danger" onClick={requestReset} icon="RotateCcw">Reset Progress</Button></div></div>
            </div>
          </Surface>
          <LocalDataNotice compact />
        </div>
      </div>
    </div>;
  }

  const headerLabel = view === "lesson" ? "Topic lesson" : view === "quiz-setup" ? "Quiz setup" : view === "results" ? "Quiz results" : navItems.find((item) => item.id === navPage)?.label ?? "Home";
  const avatar = <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#5B5FEF] to-[#8B5CF6] text-xs font-extrabold text-white">{initials(name)}</div>;

  return (
    <div className="app-frame min-h-[100dvh] bg-canvas text-ink">
      <aside className="desktop-sidebar fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
        <button type="button" onClick={() => { void navigate("home"); }} className="mb-7 rounded-xl p-1 text-left"><BrandMark /></button>
        <div className="mb-2 px-3 text-[9px] font-extrabold uppercase tracking-[.18em] text-muted">Workspace</div>
        <nav className="space-y-1" aria-label="Main navigation">{navItems.map((item) => <NavButton key={item.id} icon={item.icon} label={item.label} active={navPage === item.id} onClick={() => void navigate(item.id)} />)}</nav>
        <div className="mt-auto space-y-4">
          <div className="rounded-[20px] bg-[#F2F1FF] p-4"><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#5B5FEF]"><Icon name="Sparkles" size={14} />Keep your streak</div><p className="mt-2 text-xs leading-5 text-[#5c5e83]">{streak ? `${streak} day${streak === 1 ? "" : "s"} in a row. A little practice today keeps it alive.` : "A short quiz or flashcard review starts your learning streak."}</p><Button variant="secondary" className="mt-3 min-h-[39px] w-full bg-white" onClick={() => openQuizSetup(chosenContinueTopic.id)} icon="Zap">Quick quiz</Button></div>
          <div className="flex items-center gap-3 rounded-[18px] border border-line p-3">{avatar}<div className="min-w-0 flex-1"><div className="truncate text-xs font-extrabold text-ink">{name}</div><div className="text-[10px] text-muted">Level {currentLevel} | {totalXp} XP</div></div><button type="button" aria-label="Open profile settings" onClick={() => void navigate("settings")} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-soft"><Icon name="Settings2" size={17} /></button></div>
          <div className="px-1 text-[10px] text-muted">Developed by Venush</div>
        </div>
      </aside>
      <div className="min-h-[100dvh] lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex min-h-[64px] items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur-md sm:px-6 lg:hidden"><button type="button" onClick={() => void navigate("home")} className="rounded-xl text-left"><BrandMark compact /></button><div className="flex items-center gap-2"><span className="max-w-[140px] truncate text-xs font-bold text-ink">{headerLabel}</span><button type="button" aria-label="Open profile settings" onClick={() => void navigate("settings")} className="rounded-[14px]">{avatar}</button></div></header>
        <main className="mx-auto w-full max-w-[1500px] px-4 pb-[calc(94px+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-10 lg:pt-8">{page}</main>
      </div>
      <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 flex min-h-[70px] items-stretch border-t border-line bg-surface/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1.5 shadow-[0_-8px_25px_rgba(27,31,63,.07)] backdrop-blur-md lg:hidden" aria-label="Main navigation">{navItems.map((item) => <NavButton key={item.id} icon={item.icon} label={item.label} active={navPage === item.id} mobile onClick={() => void navigate(item.id)} />)}</nav>

      {selectedAward && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center bg-[#111325]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedAward(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="award-detail-title" className="surface border-line max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] border p-5 shadow-[0_24px_80px_rgba(13,16,40,.28)] sm:rounded-[28px] sm:p-7">
            <div className="mb-4 flex items-start justify-between"><div className={`flex h-14 w-14 items-center justify-center rounded-[19px] ${rarityColors(selectedAward.rarity).background} ${rarityColors(selectedAward.rarity).text}`}><Icon name={selectedAward.icon} size={26} /></div><button type="button" aria-label="Close award detail" onClick={() => setSelectedAward(null)} className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-soft"><Icon name="X" /></button></div>
            <div className={`text-[10px] font-extrabold uppercase tracking-[.15em] ${rarityColors(selectedAward.rarity).text}`}>{selectedAward.rarity} award</div><h2 id="award-detail-title" className="mt-1 text-2xl font-extrabold tracking-[-.04em] text-ink">{selectedAward.name}</h2><p className="mt-2 text-sm leading-6 text-muted">{selectedAward.description}</p><div className="mt-4 rounded-2xl bg-soft p-4"><div className="text-[10px] font-extrabold uppercase tracking-[.13em] text-muted">Unlock condition</div><p className="mt-1 text-xs leading-5 text-ink">{selectedAward.unlockCondition}</p></div>
            {!selectedAward.unlocked && <div className="mt-4"><div className="mb-2 flex justify-between text-xs font-bold text-muted"><span>Progress</span><span>{selectedAward.progress.toLocaleString()} / {selectedAward.progressRule.target.toLocaleString()}</span></div><ProgressBar value={selectedAward.progressPercent} color={selectedAward.rarity === "Mystic" ? "#5B5FEF" : selectedAward.rarity === "Legendary" ? "#D8A627" : selectedAward.rarity === "Epic" ? "#8B5CF6" : selectedAward.rarity === "Rare" ? "#48B8F3" : "#9299A8"} height="h-2" /></div>}
            {selectedAward.unlocked && <p className="mt-4 rounded-2xl bg-[#EAFBF5] p-3 text-xs font-semibold leading-5 text-[#176A52]">Unlocked {formatTimestamp(selectedAward.unlockedAt)}{selectedAward.verification === "imported_unverified" ? " | Imported from an unverified browser backup." : " | Earned by saved learning activity on this device."}</p>}
          </div>
        </div>
      )}
      {dialog && <Modal dialog={dialog} busy={dialogBusy} onClose={() => { if (!dialogBusy) setDialog(null); }} onConfirm={() => { if (dialogBusy) return; setDialogBusy(true); void Promise.resolve(dialog.onConfirm()).then(() => setDialog(null)).catch((error: unknown) => { showToast({ title: "Action could not be completed", description: error instanceof Error ? error.message : "Please try again.", tone: "warning" }); }).finally(() => setDialogBusy(false)); }} />}
      {toast && <div role="status" className="toast-enter fixed inset-x-3 bottom-[calc(82px+env(safe-area-inset-bottom))] z-[90] mx-auto flex max-w-md items-start gap-3 rounded-[18px] border border-line bg-surface px-4 py-3.5 shadow-[0_18px_45px_rgba(25,28,65,.18)] sm:inset-x-auto sm:right-6 sm:bottom-6"><div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] ${toast.tone === "success" ? "bg-[#EAFBF5] text-[#159C74]" : toast.tone === "warning" ? "bg-[#FFF6D9] text-[#9A7415]" : "bg-[#F0F0FF] text-[#5B5FEF]"}`}><Icon name={toast.tone === "success" ? "CircleCheck" : toast.tone === "warning" ? "TriangleAlert" : "Info"} size={17} /></div><div className="min-w-0 flex-1"><div className="text-xs font-extrabold text-ink">{toast.title}</div>{toast.description && <p className="mt-0.5 text-[10px] leading-4 text-muted">{toast.description}</p>}</div><button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-soft"><Icon name="X" size={15} /></button></div>}
    </div>
  );
}