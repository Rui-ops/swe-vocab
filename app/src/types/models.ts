export type CefrLevel = "A1" | "A2" | "B1" | "B1+" | "B2" | "C1" | "unknown";

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "preposition"
  | "conjunction"
  | "interjection"
  | "phrase"
  | "other";

export type TestMode = "svToEn" | "enToSv";

export type ItemState = "new" | "learning" | "review" | "mastered";

export type RecallRating = "easy" | "hard" | "wrong";

export interface SourceReference {
  name: string;
  sourceId: string;
}

export interface VocabularyItem {
  id: string;
  lemma: string;
  swedish: string;
  english: string[];
  partOfSpeech: PartOfSpeech;
  frequencyRank: number;
  cefrLevel: CefrLevel;
  packIds: string[];
  tags: string[];
  priority: number;
  sources: SourceReference[];
  exampleSv?: string | null;
  exampleEn?: string | null;
  phonetic?: string | null;
  audioUrl?: string | null;
  notes?: string;
  normalizedKey?: string;
  isPhrase?: boolean;
}

export interface PackSummary {
  id: string;
  title: string;
  description: string;
  cefrLevel: CefrLevel;
  itemCount: number;
  tags: string[];
}

export interface LevelSummary {
  id: CefrLevel;
  label: string;
  description: string;
}

export interface AppSettings {
  selectedLevel: CefrLevel;
  enabledTestModes: TestMode[];
  dailyNewItemCount: number;
  dailyReviewLimit: number;
  enabledPackIds: string[];
}

export interface ProgressItemRecord {
  itemId: string;
  state: ItemState;
  seenCount: number;
  mastered: boolean;
  nextReviewAt: string | null;
  lastRating: RecallRating | null;
}

export interface ProgressSnapshot {
  sessionsCompleted: number;
  itemsSeen: number;
  learningCount: number;
  masteredCount: number;
  lastStudiedAt: string | null;
  itemRecords: Record<string, ProgressItemRecord>;
}

export interface StudyCard {
  itemId: string;
  mode: TestMode;
  prompt: string;
  answer: string;
  exampleSv?: string | null;
  exampleEn?: string | null;
  position: number;
  total: number;
}

export interface SessionItemResult {
  itemId: string;
  mode: TestMode;
  rating: RecallRating;
}

export interface ActiveStudySession {
  mode: TestMode;
  queue: VocabularyItem[];
  currentIndex: number;
  isAnswerRevealed: boolean;
  retryQueuedItemIds: string[];
  results: SessionItemResult[];
}

export interface SessionSummary {
  id: string;
  completedAt: string;
  mode: TestMode;
  studiedCount: number;
  easyCount: number;
  hardCount: number;
  wrongCount: number;
}

export type AppScreen =
  | "home"
  | "study"
  | "summary"
  | "packs"
  | "progress"
  | "settings";
