import type {
  ActiveStudySession,
  AppSettings,
  DailyPackSnapshot,
  ProgressSnapshot,
  RecallRating,
  SessionItemResult,
  SessionSummary,
  StudyCard,
  VocabularyItem,
} from "../../types/models";
import { applySessionResultsToProgress, buildDailyStudyQueue } from "../../lib/review/engine";

export function createStudySession(
  settings: AppSettings,
  vocabItems: VocabularyItem[],
  progress: ProgressSnapshot,
  dailyPack: DailyPackSnapshot | null,
  now: string,
): ActiveStudySession | null {
  const studyQueue = buildDailyStudyQueue(settings, vocabItems, progress, dailyPack, now);
  const mode = settings.enabledTestModes[0];

  if (studyQueue.queue.length === 0 || !mode) {
    return null;
  }

  return {
    mode,
    queue: studyQueue.queue,
    currentIndex: 0,
    isAnswerRevealed: false,
    retryQueuedItemIds: [],
    results: [],
  };
}

export function getCurrentStudyCard(session: ActiveStudySession | null): StudyCard | null {
  if (!session) {
    return null;
  }

  const item = session.queue[session.currentIndex];
  if (!item) {
    return null;
  }

  return {
    itemId: item.id,
    mode: session.mode,
    prompt: session.mode === "svToEn" ? item.swedish : item.english.join(", "),
    answer: session.mode === "svToEn" ? item.english.join(", ") : item.swedish,
    exampleSv: item.exampleSv,
    exampleEn: item.exampleEn,
    position: session.currentIndex + 1,
    total: session.queue.length,
  };
}

export function revealCurrentCard(session: ActiveStudySession): ActiveStudySession {
  return {
    ...session,
    isAnswerRevealed: true,
  };
}

interface ApplyRatingResult {
  nextSession: ActiveStudySession | null;
  completedSummary: SessionSummary | null;
  recordedResults: SessionItemResult[];
}

export function applyRating(
  session: ActiveStudySession,
  rating: RecallRating,
  completedAt: string,
): ApplyRatingResult {
  if (!session.isAnswerRevealed) {
    return {
      nextSession: session,
      completedSummary: null,
      recordedResults: session.results,
    };
  }

  const currentItem = session.queue[session.currentIndex];
  if (!currentItem) {
    return {
      nextSession: null,
      completedSummary: null,
      recordedResults: session.results,
    };
  }

  const results = [
    ...session.results,
    {
      itemId: currentItem.id,
      mode: session.mode,
      rating,
    },
  ];

  const shouldQueueRetry =
    rating === "wrong" && !session.retryQueuedItemIds.includes(currentItem.id);
  const nextQueue = shouldQueueRetry ? [...session.queue, currentItem] : session.queue;
  const nextRetryQueuedItemIds = shouldQueueRetry
    ? [...session.retryQueuedItemIds, currentItem.id]
    : session.retryQueuedItemIds;

  if (session.currentIndex === nextQueue.length - 1) {
    return {
      nextSession: null,
      completedSummary: createSessionSummary(results, session.mode, completedAt),
      recordedResults: results,
    };
  }

  return {
    nextSession: {
      ...session,
      queue: nextQueue,
      currentIndex: session.currentIndex + 1,
      isAnswerRevealed: false,
      retryQueuedItemIds: nextRetryQueuedItemIds,
      results,
    },
    completedSummary: null,
    recordedResults: results,
  };
}

function createSessionSummary(
  results: ActiveStudySession["results"],
  mode: ActiveStudySession["mode"],
  completedAt: string,
): SessionSummary {
  const easyCount = results.filter((result) => result.rating === "easy").length;
  const hardCount = results.filter((result) => result.rating === "hard").length;
  const wrongCount = results.filter((result) => result.rating === "wrong").length;

  return {
    id: `session-${completedAt}`,
    completedAt,
    mode,
    studiedCount: results.length,
    reviewCount: 0,
    newCount: 0,
    easyCount,
    hardCount,
    wrongCount,
  };
}

export function applyCompletedSessionToProgress(
  progress: ProgressSnapshot,
  summary: SessionSummary,
  results: SessionItemResult[],
): ProgressSnapshot {
  return applySessionResultsToProgress(progress, results, summary.completedAt);
}
