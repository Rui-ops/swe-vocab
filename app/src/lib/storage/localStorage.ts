import type { AppSettings, ProgressSnapshot, SessionSummary } from "../../types/models";

const SETTINGS_KEY = "swedish-vocab.settings";
const PROGRESS_KEY = "swedish-vocab.progress";
const SESSION_HISTORY_KEY = "swedish-vocab.sessionHistory";

const hasWindow = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function safeRead<T>(key: string, fallback: T): T {
  if (!hasWindow()) {
    return fallback;
  }

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export const storageKeys = {
  settings: SETTINGS_KEY,
  progress: PROGRESS_KEY,
  sessionHistory: SESSION_HISTORY_KEY,
} as const;

export function loadSettings(fallback: AppSettings): AppSettings {
  return safeRead(SETTINGS_KEY, fallback);
}

export function saveSettings(value: AppSettings): void {
  safeWrite(SETTINGS_KEY, value);
}

export function loadProgress(fallback: ProgressSnapshot): ProgressSnapshot {
  return safeRead(PROGRESS_KEY, fallback);
}

export function saveProgress(value: ProgressSnapshot): void {
  safeWrite(PROGRESS_KEY, value);
}

export function loadSessionHistory(fallback: SessionSummary[]): SessionSummary[] {
  return safeRead(SESSION_HISTORY_KEY, fallback);
}

export function saveSessionHistory(value: SessionSummary[]): void {
  safeWrite(SESSION_HISTORY_KEY, value);
}

