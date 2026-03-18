import type {
  AppSettings,
  CefrLevel,
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
  newItemCount: number;
  totalCount: number;
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

export function buildDailyStudyQueue(
  settings: AppSettings,
  vocabItems: VocabularyItem[],
  progress: ProgressSnapshot,
  now: string,
): VocabularyItem[] {
  const eligibleItems = getEligibleItems(settings, vocabItems);

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
  const newItems = eligibleItems
    .filter((item) => !progress.itemRecords[item.id] && !dueIds.has(item.id))
    .slice(0, settings.dailyNewItemCount);

  return [...dueItems, ...newItems];
}

export function getStudyQueueBreakdown(
  settings: AppSettings,
  vocabItems: VocabularyItem[],
  progress: ProgressSnapshot,
  now: string,
): StudyQueueBreakdown {
  const eligibleItems = getEligibleItems(settings, vocabItems);
  const dueReviewCount = eligibleItems.filter((item) => {
    const record = progress.itemRecords[item.id];
    return Boolean(record?.nextReviewAt && record.nextReviewAt <= now);
  }).length;
  const newItemCount = eligibleItems.filter((item) => !progress.itemRecords[item.id]).length;
  const totalCount =
    Math.min(dueReviewCount, settings.dailyReviewLimit) +
    Math.min(newItemCount, settings.dailyNewItemCount);

  return {
    dueReviewCount,
    newItemCount,
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
