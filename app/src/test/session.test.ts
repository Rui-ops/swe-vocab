import { describe, expect, it } from "vitest";
import {
  applyCompletedSessionToProgress,
  applyRating,
  createStudySession,
  getCurrentStudyCard,
  revealCurrentCard,
} from "../features/study/session";
import {
  applySessionResultsToProgress,
  buildDailyStudyQueue,
  ensureDailyPack,
  getLocalDateKey,
  getStudyQueueBreakdown,
  updateDailyPackCompletion,
} from "../lib/review/engine";
import type {
  AppSettings,
  DailyPackSnapshot,
  ProgressSnapshot,
  VocabularyItem,
} from "../types/models";

const now = "2026-03-18T10:00:00.000Z";

const settings: AppSettings = {
  selectedLevel: "A2",
  enabledTestModes: ["svToEn", "enToSv"],
  dailyNewItemCount: 2,
  dailyReviewLimit: 1,
  enabledPackIds: ["core"],
};

const vocabItems: VocabularyItem[] = [
  {
    id: "1",
    lemma: "dag",
    swedish: "dag",
    english: ["day"],
    partOfSpeech: "noun",
    frequencyRank: 1,
    cefrLevel: "A1",
    packIds: ["core"],
    tags: [],
    priority: 5,
    sources: [{ name: "test", sourceId: "1" }],
  },
  {
    id: "2",
    lemma: "försöka",
    swedish: "försöka",
    english: ["try"],
    partOfSpeech: "verb",
    frequencyRank: 2,
    cefrLevel: "A2",
    packIds: ["core"],
    tags: [],
    priority: 4,
    sources: [{ name: "test", sourceId: "2" }],
  },
  {
    id: "3",
    lemma: "avancerad",
    swedish: "avancerad",
    english: ["advanced"],
    partOfSpeech: "adjective",
    frequencyRank: 3,
    cefrLevel: "A2",
    packIds: ["core"],
    tags: [],
    priority: 3,
    sources: [{ name: "test", sourceId: "3" }],
  },
  {
    id: "4",
    lemma: "annan",
    swedish: "annan",
    english: ["other"],
    partOfSpeech: "adjective",
    frequencyRank: 4,
    cefrLevel: "A1",
    packIds: ["other"],
    tags: [],
    priority: 3,
    sources: [{ name: "test", sourceId: "4" }],
  },
];

const emptyProgress: ProgressSnapshot = {
  sessionsCompleted: 0,
  itemsSeen: 0,
  learningCount: 0,
  masteredCount: 0,
  lastStudiedAt: null,
  itemRecords: {},
};

const seededProgress: ProgressSnapshot = {
  sessionsCompleted: 1,
  itemsSeen: 1,
  learningCount: 1,
  masteredCount: 0,
  lastStudiedAt: "2026-03-17T10:00:00.000Z",
  itemRecords: {
    "1": {
      itemId: "1",
      state: "learning",
      seenCount: 1,
      mastered: false,
      nextReviewAt: "2026-03-17T10:00:00.000Z",
      lastRating: "hard",
    },
  },
};

const todayDailyPack: DailyPackSnapshot = {
  date: "2026-03-18",
  newItemIds: ["2", "3"],
  completedNewItemIds: [],
  generated: true,
};

describe("daily pack and review engine", () => {
  it("formats local date keys", () => {
    expect(getLocalDateKey(new Date("2026-03-18T10:00:00.000Z"))).toBe("2026-03-18");
  });

  it("generates one fixed pack for a given day", () => {
    const pack = ensureDailyPack(settings, vocabItems, emptyProgress, null, "2026-03-18");
    expect(pack).toEqual({
      date: "2026-03-18",
      newItemIds: ["1", "2"],
      completedNewItemIds: [],
      generated: true,
    });
  });

  it("reuses an existing pack on the same day", () => {
    expect(ensureDailyPack(settings, vocabItems, emptyProgress, todayDailyPack, "2026-03-18")).toBe(
      todayDailyPack,
    );
  });

  it("builds queue from due reviews plus remaining items in today's pack", () => {
    const queue = buildDailyStudyQueue(settings, vocabItems, seededProgress, todayDailyPack, now);
    expect(queue.dueItems.map((item) => item.id)).toEqual(["1"]);
    expect(queue.newItems.map((item) => item.id)).toEqual(["2", "3"]);
    expect(queue.queue.map((item) => item.id)).toEqual(["1", "2", "3"]);
  });

  it("does not backfill a new pack after the current day's pack is exhausted", () => {
    const exhaustedPack: DailyPackSnapshot = {
      ...todayDailyPack,
      completedNewItemIds: ["2", "3"],
    };
    const queue = buildDailyStudyQueue(settings, vocabItems, seededProgress, exhaustedPack, now);
    expect(queue.newItems).toEqual([]);
    expect(queue.queue.map((item) => item.id)).toEqual(["1"]);
  });

  it("exposes today's pack metrics for the home screen", () => {
    expect(getStudyQueueBreakdown(settings, vocabItems, seededProgress, todayDailyPack, now)).toEqual({
      dueReviewCount: 1,
      dailyPackSize: 2,
      remainingNewItemCount: 2,
      dailyPackGenerated: true,
      totalCount: 3,
    });
  });

  it("updates daily pack completion after a session", () => {
    expect(
      updateDailyPackCompletion(todayDailyPack, [
        { itemId: "2", mode: "svToEn", rating: "easy" },
        { itemId: "1", mode: "svToEn", rating: "hard" },
      ]),
    ).toEqual({
      ...todayDailyPack,
      completedNewItemIds: ["2"],
    });
  });

  it("updates item states and aggregate progress from session results", () => {
    const updated = applySessionResultsToProgress(
      seededProgress,
      [
        { itemId: "1", mode: "svToEn", rating: "easy" },
        { itemId: "2", mode: "svToEn", rating: "wrong" },
      ],
      now,
    );

    expect(updated.sessionsCompleted).toBe(2);
    expect(updated.itemsSeen).toBe(2);
    expect(updated.learningCount).toBe(2);
    expect(updated.masteredCount).toBe(0);
    expect(updated.itemRecords["1"]).toMatchObject({
      state: "review",
      seenCount: 2,
      lastRating: "easy",
    });
    expect(updated.itemRecords["2"]).toMatchObject({
      state: "learning",
      seenCount: 1,
      lastRating: "wrong",
    });
  });
});

describe("study session helpers", () => {
  it("uses the first enabled mode for the session", () => {
    const session = createStudySession(settings, vocabItems, seededProgress, todayDailyPack, now);
    expect(session?.mode).toBe("svToEn");
  });

  it("returns null when no eligible items are available", () => {
    expect(
      createStudySession(
        { ...settings, enabledPackIds: ["missing"] },
        vocabItems,
        emptyProgress,
        null,
        now,
      ),
    ).toBeNull();
  });

  it("blocks rating before reveal", () => {
    const session = createStudySession(settings, vocabItems, emptyProgress, todayDailyPack, now);
    if (!session) {
      throw new Error("session should exist");
    }

    const result = applyRating(session, "easy", now);
    expect(result.nextSession?.results).toEqual([]);
    expect(result.completedSummary).toBeNull();
  });

  it("queues one retry for a wrong answer near the end of the session", () => {
    const firstSession = createStudySession(settings, vocabItems, emptyProgress, todayDailyPack, now);
    if (!firstSession) {
      throw new Error("session should exist");
    }

    const wrongResult = applyRating(revealCurrentCard(firstSession), "wrong", now);
    expect(wrongResult.nextSession?.queue).toHaveLength(3);
    expect(wrongResult.nextSession?.retryQueuedItemIds).toEqual(["2"]);

    const secondCard = getCurrentStudyCard(wrongResult.nextSession);
    expect(secondCard?.itemId).toBe("3");
    expect(secondCard?.position).toBe(2);
  });

  it("completes on the last queued card and includes summary totals", () => {
    const session = createStudySession(settings, vocabItems, seededProgress, todayDailyPack, now);
    if (!session) {
      throw new Error("session should exist");
    }

    const first = applyRating(revealCurrentCard(session), "easy", now);
    if (!first.nextSession) {
      throw new Error("next session should exist");
    }

    const second = applyRating(revealCurrentCard(first.nextSession), "easy", now);
    if (!second.nextSession) {
      throw new Error("next session should exist");
    }

    const final = applyRating(revealCurrentCard(second.nextSession), "wrong", now);
    expect(final.nextSession?.queue).toHaveLength(4);

    if (!final.nextSession) {
      throw new Error("retry session should exist");
    }

    const retry = applyRating(revealCurrentCard(final.nextSession), "easy", now);
    expect(retry.nextSession).toBeNull();
    expect(retry.completedSummary).toEqual({
      id: `session-${now}`,
      completedAt: now,
      mode: "svToEn",
      studiedCount: 4,
      reviewCount: 0,
      newCount: 0,
      easyCount: 3,
      hardCount: 0,
      wrongCount: 1,
    });
  });

  it("applies a completed session to stored progress", () => {
    const updated = applyCompletedSessionToProgress(
      emptyProgress,
      {
        id: "session-1",
        completedAt: now,
        mode: "svToEn",
        studiedCount: 3,
        reviewCount: 1,
        newCount: 2,
        easyCount: 2,
        hardCount: 0,
        wrongCount: 1,
      },
      [
        { itemId: "1", mode: "svToEn", rating: "wrong" },
        { itemId: "2", mode: "svToEn", rating: "easy" },
        { itemId: "1", mode: "svToEn", rating: "easy" },
      ],
    );

    expect(updated).toMatchObject({
      sessionsCompleted: 1,
      itemsSeen: 2,
      learningCount: 2,
      masteredCount: 0,
      lastStudiedAt: now,
    });
    expect(updated.itemRecords["1"]).toMatchObject({
      state: "review",
      seenCount: 2,
      lastRating: "easy",
    });
  });
});
