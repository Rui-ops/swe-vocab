import type {
  AppSettings,
  CefrLevel,
  DailyPackSnapshot,
  ItemState,
  ProgressItemRecord,
  ProgressSnapshot,
  RecallRating,
  SessionItemResult,
  VocabularyItem,
} from "../../types/models";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const cefrRank: Record<CefrLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  "B1+": 4,
  B2: 5,
  C1: 6,
  unknown: 99,
};

export interface StudyQueueBreakdown {
  dueReviewCount: number;
  dailyPackSize: number;
  remainingNewItemCount: number;
  dailyPackGenerated: boolean;
  totalCount: number;
}

export interface DailyStudyQueue {
  dueItems: VocabularyItem[];
  newItems: VocabularyItem[];
  queue: VocabularyItem[];
}

function addDays(isoDate: string, days: number): string {
  return new Date(new Date(isoDate).getTime() + days * DAY_IN_MS).toISOString();
}

function isLevelAllowed(selectedLevel: CefrLevel, itemLevel: CefrLevel): boolean {
  if (itemLevel === "unknown") {
    return false;
  }

  return cefrRank[itemLevel] <= cefrRank[selectedLevel];
}

function isEligibleItem(settings: AppSettings, item: VocabularyItem): boolean {
  return (
    item.packIds.some((packId) => settings.enabledPackIds.includes(packId)) &&
    isLevelAllowed(settings.selectedLevel, item.cefrLevel)
  );
}

function getEligibleItems(settings: AppSettings, vocabItems: VocabularyItem[]): VocabularyItem[] {
  return vocabItems.filter((item) => isEligibleItem(settings, item));
}

function getUnseenEligibleItems(
  settings: AppSettings,
  vocabItems: VocabularyItem[],
  progress: ProgressSnapshot,
): VocabularyItem[] {
  return getEligibleItems(settings, vocabItems).filter((item) => !progress.itemRecords[item.id]);
}

export function getLocalDateKey(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ensureDailyPack(
  settings: AppSettings,
  vocabItems: VocabularyItem[],
  progress: ProgressSnapshot,
  existingDailyPack: DailyPackSnapshot | null,
  todayKey: string,
): DailyPackSnapshot {
  if (existingDailyPack && existingDailyPack.date === todayKey) {
    return existingDailyPack;
  }

  const unseenEligibleItems = getUnseenEligibleItems(settings, vocabItems, progress).slice(
    0,
    settings.dailyNewItemCount,
  );

  return {
    date: todayKey,
    newItemIds: unseenEligibleItems.map((item) => item.id),
    completedNewItemIds: [],
    generated: true,
  };
}

export function buildDailyStudyQueue(
  settings: AppSettings,
  vocabItems: VocabularyItem[],
  progress: ProgressSnapshot,
  dailyPack: DailyPackSnapshot | null,
  now: string,
): DailyStudyQueue {
  const eligibleItems = getEligibleItems(settings, vocabItems);
  const itemMap = new Map(eligibleItems.map((item) => [item.id, item]));

  const dueItems = eligibleItems
    .filter((item) => {
      const record = progress.itemRecords[item.id];
      return Boolean(record?.nextReviewAt && record.nextReviewAt <= now);
    })
    .sort((left, right) => {
      const leftDate = progress.itemRecords[left.id]?.nextReviewAt ?? "";
      const rightDate = progress.itemRecords[right.id]?.nextReviewAt ?? "";
      return leftDate.localeCompare(rightDate);
    })
    .slice(0, settings.dailyReviewLimit);

  const dueIds = new Set(dueItems.map((item) => item.id));
  const completedNewItemIds = new Set(dailyPack?.completedNewItemIds ?? []);
  const newItems = (dailyPack?.newItemIds ?? [])
    .filter((itemId) => !completedNewItemIds.has(itemId))
    .map((itemId) => itemMap.get(itemId))
    .filter((item): item is VocabularyItem => Boolean(item))
    .filter((item) => !dueIds.has(item.id));

  return {
    dueItems,
    newItems,
    queue: [...dueItems, ...newItems],
  };
}

export function getStudyQueueBreakdown(
  settings: AppSettings,
  vocabItems: VocabularyItem[],
  progress: ProgressSnapshot,
  dailyPack: DailyPackSnapshot | null,
  now: string,
): StudyQueueBreakdown {
  const eligibleItems = getEligibleItems(settings, vocabItems);
  const dueReviewCount = eligibleItems.filter((item) => {
    const record = progress.itemRecords[item.id];
    return Boolean(record?.nextReviewAt && record.nextReviewAt <= now);
  }).length;
  const remainingNewItemCount =
    (dailyPack?.newItemIds.length ?? 0) - (dailyPack?.completedNewItemIds.length ?? 0);
  const totalCount =
    Math.min(dueReviewCount, settings.dailyReviewLimit) + Math.max(remainingNewItemCount, 0);

  return {
    dueReviewCount,
    dailyPackSize: dailyPack?.newItemIds.length ?? 0,
    remainingNewItemCount: Math.max(remainingNewItemCount, 0),
    dailyPackGenerated: Boolean(dailyPack?.generated),
    totalCount,
  };
}

function createDefaultRecord(itemId: string): ProgressItemRecord {
  return {
    itemId,
    state: "new",
    seenCount: 0,
    mastered: false,
    nextReviewAt: null,
    lastRating: null,
  };
}

interface ReviewTransition {
  state: ItemState;
  mastered: boolean;
  daysUntilReview: number;
}

function getTransition(state: ItemState, rating: RecallRating): ReviewTransition {
  if (state === "new") {
    if (rating === "easy") {
      return { state: "review", mastered: false, daysUntilReview: 3 };
    }

    return { state: "learning", mastered: false, daysUntilReview: 1 };
  }

  if (state === "learning") {
    if (rating === "easy") {
      return { state: "review", mastered: false, daysUntilReview: 3 };
    }

    return { state: "learning", mastered: false, daysUntilReview: 1 };
  }

  if (state === "review") {
    if (rating === "easy") {
      return { state: "mastered", mastered: true, daysUntilReview: 14 };
    }
    if (rating === "hard") {
      return { state: "review", mastered: false, daysUntilReview: 2 };
    }

    return { state: "learning", mastered: false, daysUntilReview: 1 };
  }

  if (rating === "easy") {
    return { state: "mastered", mastered: true, daysUntilReview: 30 };
  }
  if (rating === "hard") {
    return { state: "review", mastered: false, daysUntilReview: 3 };
  }

  return { state: "learning", mastered: false, daysUntilReview: 1 };
}

function materializeTransition(
  record: ProgressItemRecord,
  rating: RecallRating,
  completedAt: string,
): ProgressItemRecord {
  const transition = getTransition(record.state, rating);

  return {
    ...record,
    state: transition.state,
    mastered: transition.mastered,
    seenCount: record.seenCount + 1,
    lastRating: rating,
    nextReviewAt: addDays(completedAt, transition.daysUntilReview),
  };
}

export function applySessionResultsToProgress(
  progress: ProgressSnapshot,
  results: SessionItemResult[],
  completedAt: string,
): ProgressSnapshot {
  const nextRecords = { ...progress.itemRecords };

  for (const result of results) {
    const current = nextRecords[result.itemId] ?? createDefaultRecord(result.itemId);
    nextRecords[result.itemId] = materializeTransition(current, result.rating, completedAt);
  }

  const records = Object.values(nextRecords);
  const learningCount = records.filter(
    (record) => record.state === "learning" || record.state === "review",
  ).length;
  const masteredCount = records.filter((record) => record.state === "mastered").length;

  return {
    ...progress,
    sessionsCompleted: progress.sessionsCompleted + 1,
    itemsSeen: records.length,
    learningCount,
    masteredCount,
    lastStudiedAt: completedAt,
    itemRecords: nextRecords,
  };
}

export function updateDailyPackCompletion(
  dailyPack: DailyPackSnapshot | null,
  results: SessionItemResult[],
): DailyPackSnapshot | null {
  if (!dailyPack) {
    return null;
  }

  const packIds = new Set(dailyPack.newItemIds);
  const nextCompleted = new Set(dailyPack.completedNewItemIds);

  for (const result of results) {
    if (packIds.has(result.itemId)) {
      nextCompleted.add(result.itemId);
    }
  }

  return {
    ...dailyPack,
    completedNewItemIds: Array.from(nextCompleted),
  };
}
