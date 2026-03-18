import { describe, expect, it, beforeEach } from "vitest";
import {
  loadProgress,
  loadSessionHistory,
  loadSettings,
  saveProgress,
  saveSessionHistory,
  saveSettings,
  storageKeys,
} from "../lib/storage/localStorage";
import type { AppSettings, ProgressSnapshot, SessionSummary } from "../types/models";

const defaultSettings: AppSettings = {
  selectedLevel: "A2",
  enabledTestModes: ["svToEn"],
  dailyNewItemCount: 5,
  dailyReviewLimit: 10,
  enabledPackIds: ["a2_core"],
};

const defaultProgress: ProgressSnapshot = {
  sessionsCompleted: 0,
  itemsSeen: 0,
  learningCount: 0,
  masteredCount: 0,
  lastStudiedAt: null,
  itemRecords: {},
};

const defaultHistory: SessionSummary[] = [
  {
    id: "session-1",
    completedAt: "2026-03-16T10:00:00.000Z",
    mode: "svToEn",
    studiedCount: 3,
    easyCount: 1,
    hardCount: 1,
    wrongCount: 1,
  },
];

describe("local storage helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips settings", () => {
    saveSettings(defaultSettings);
    expect(loadSettings(defaultSettings)).toEqual(defaultSettings);
  });

  it("falls back for invalid JSON", () => {
    window.localStorage.setItem(storageKeys.progress, "{invalid");
    expect(loadProgress(defaultProgress)).toEqual(defaultProgress);
  });

  it("round-trips progress", () => {
    saveProgress(defaultProgress);
    expect(loadProgress(defaultProgress)).toEqual(defaultProgress);
  });

  it("round-trips session history", () => {
    saveSessionHistory(defaultHistory);
    expect(loadSessionHistory([])).toEqual(defaultHistory);
  });
});
