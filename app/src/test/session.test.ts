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
  getStudyQueueBreakdown,
} from "../lib/review/engine";
import type { AppSettings, ProgressSnapshot, VocabularyItem } from "../types/models";

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
    cefrLevel: "B1",
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

describe("review engine", () => {
  it("builds a queue from due review items plus capped new items", () => {
    expect(buildDailyStudyQueue(settings, vocabItems, seededProgress, now).map((item) => item.id)).toEqual([
      "1",
      "2",
    ]);
  });

  it("exposes due and new counts for the home screen", () => {
    expect(getStudyQueueBreakdown(settings, vocabItems, seededProgress, now)).toEqual({
      dueReviewCount: 1,
      newItemCount: 1,
      totalCount: 2,
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
    const session = createStudySession(settings, vocabItems, seededProgress, now);
    expect(session?.mode).toBe("svToEn");
  });

  it("returns null when no eligible items are available", () => {
    expect(
      createStudySession({ ...settings, enabledPackIds: ["missing"] }, vocabItems, emptyProgress, now),
    ).toBeNull();
  });

  it("blocks rating before reveal", () => {
    const session = createStudySession(settings, vocabItems, emptyProgress, now);
    if (!session) {
      throw new Error("session should exist");
    }

    const result = applyRating(session, "easy", now);
    expect(result.nextSession?.results).toEqual([]);
    expect(result.completedSummary).toBeNull();
  });

  it("queues one retry for a wrong answer near the end of the session", () => {
    const firstSession = createStudySession(settings, vocabItems, emptyProgress, now);
    if (!firstSession) {
      throw new Error("session should exist");
    }

    const wrongResult = applyRating(revealCurrentCard(firstSession), "wrong", now);
    expect(wrongResult.nextSession?.queue).toHaveLength(3);
    expect(wrongResult.nextSession?.retryQueuedItemIds).toEqual(["1"]);

    const secondCard = getCurrentStudyCard(wrongResult.nextSession);
    expect(secondCard?.itemId).toBe("2");
    expect(secondCard?.position).toBe(2);
  });

  it("completes on the last queued card and includes retry results in the summary", () => {
    const firstSession = createStudySession(settings, vocabItems, emptyProgress, now);
    if (!firstSession) {
      throw new Error("session should exist");
    }

    const first = applyRating(revealCurrentCard(firstSession), "wrong", now);
    if (!first.nextSession) {
      throw new Error("next session should exist");
    }

    const second = applyRating(revealCurrentCard(first.nextSession), "easy", now);
    if (!second.nextSession) {
      throw new Error("next session should exist");
    }

    const retryCard = getCurrentStudyCard(second.nextSession);
    expect(retryCard?.itemId).toBe("1");
    expect(retryCard?.position).toBe(3);

    const finalResult = applyRating(revealCurrentCard(second.nextSession), "easy", now);
    expect(finalResult.nextSession).toBeNull();
    expect(finalResult.completedSummary).toEqual({
      id: `session-${now}`,
      completedAt: now,
      mode: "svToEn",
      studiedCount: 3,
      easyCount: 2,
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
