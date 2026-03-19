import { useEffect, useMemo, useState } from "react";
import {
  applyCompletedSessionToProgress,
  applyRating,
  createStudySession,
  getCurrentStudyCard,
  revealCurrentCard,
} from "../features/study/session";
import {
  ensureDailyPack,
  getLocalDateKey,
  getStudyQueueBreakdown,
  updateDailyPackCompletion,
} from "../lib/review/engine";
import { getDatasetLoadErrorMessage, loadAppDataset } from "../lib/data/loadAppDataset";
import {
  loadDailyPack,
  loadProgress,
  loadSessionHistory,
  loadSettings,
  saveDailyPack,
  saveProgress,
  saveSessionHistory,
  saveSettings,
} from "../lib/storage/localStorage";
import { HomeScreen } from "../screens/HomeScreen";
import { ProgressScreen } from "../screens/ProgressScreen";
import { SessionSummaryScreen } from "../screens/SessionSummaryScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { StudyScreen } from "../screens/StudyScreen";
import type {
  ActiveStudySession,
  AppDataset,
  AppScreen,
  AppSettings,
  DailyPackSnapshot,
  ProgressSnapshot,
  RecallRating,
  SessionSummary,
} from "../types/models";

const baseDefaultSettings: AppSettings = {
  selectedLevel: "A2",
  enabledTestModes: ["svToEn"],
  dailyNewItemCount: 30,
  dailyReviewLimit: 10,
  enabledPackIds: [],
};

const defaultProgress: ProgressSnapshot = {
  sessionsCompleted: 0,
  itemsSeen: 0,
  learningCount: 0,
  masteredCount: 0,
  lastStudiedAt: null,
  itemRecords: {},
};

const defaultSessionHistory: SessionSummary[] = [];

const navItems: Array<{ id: AppScreen; label: string }> = [
  { id: "home", label: "Home" },
  { id: "study", label: "Study" },
  { id: "summary", label: "Summary" },
  { id: "progress", label: "Progress" },
  { id: "settings", label: "Settings" },
];

type DataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; dataset: AppDataset };

function normalizeSettings(settings: AppSettings, dataset: AppDataset): AppSettings {
  const availablePackIds = new Set(dataset.packs.map((pack) => pack.id));
  const enabledPackIds = settings.enabledPackIds.filter((packId) => availablePackIds.has(packId));

  if (enabledPackIds.length > 0) {
    return {
      ...settings,
      enabledPackIds,
    };
  }

  return {
    ...settings,
    enabledPackIds: dataset.packs.map((pack) => pack.id),
  };
}

export function App() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [dataState, setDataState] = useState<DataState>({ status: "loading" });
  const [dataLoadVersion, setDataLoadVersion] = useState(0);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings(baseDefaultSettings));
  const [progress, setProgress] = useState<ProgressSnapshot>(() => loadProgress(defaultProgress));
  const [sessionHistory, setSessionHistory] = useState<SessionSummary[]>(() =>
    loadSessionHistory(defaultSessionHistory),
  );
  const [dailyPack, setDailyPack] = useState<DailyPackSnapshot | null>(() => loadDailyPack(null));
  const [activeSession, setActiveSession] = useState<ActiveStudySession | null>(null);

  useEffect(() => {
    let cancelled = false;

    setDataState({ status: "loading" });

    void loadAppDataset()
      .then((dataset) => {
        if (cancelled) {
          return;
        }

        setDataState({ status: "ready", dataset });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setDataState({
          status: "error",
          message: getDatasetLoadErrorMessage(error),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [dataLoadVersion]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    saveSessionHistory(sessionHistory);
  }, [sessionHistory]);

  useEffect(() => {
    saveDailyPack(dailyPack);
  }, [dailyPack]);

  useEffect(() => {
    if (dataState.status !== "ready") {
      return;
    }

    const normalizedSettings = normalizeSettings(settings, dataState.dataset);
    const hasChanged = JSON.stringify(normalizedSettings) !== JSON.stringify(settings);

    if (hasChanged) {
      setSettings(normalizedSettings);
    }
  }, [dataState, settings]);

  const dataset = dataState.status === "ready" ? dataState.dataset : null;
  const effectiveSettings = dataset ? normalizeSettings(settings, dataset) : settings;
  const levels = dataset?.levels ?? [];
  const packs = dataset?.packs ?? [];
  const vocabItems = dataset?.vocabItems ?? [];

  const todayKey = getLocalDateKey(new Date());
  const ensuredDailyPack = useMemo(
    () => ensureDailyPack(effectiveSettings, vocabItems, progress, dailyPack, todayKey),
    [effectiveSettings, vocabItems, progress, dailyPack, todayKey],
  );

  useEffect(() => {
    if (dataState.status !== "ready") {
      return;
    }

    if (!dailyPack || dailyPack.date !== ensuredDailyPack.date) {
      setDailyPack(ensuredDailyPack);
    }
  }, [dataState.status, dailyPack, ensuredDailyPack]);

  const startStudy = () => {
    if (dataState.status !== "ready") {
      return;
    }

    const now = new Date().toISOString();
    setDailyPack(ensuredDailyPack);
    setActiveSession(createStudySession(effectiveSettings, vocabItems, progress, ensuredDailyPack, now));
    setScreen("study");
  };

  const revealAnswer = () => {
    setActiveSession((current) => {
      if (!current || current.isAnswerRevealed) {
        return current;
      }

      return revealCurrentCard(current);
    });
  };

  const rateCard = (rating: RecallRating) => {
    setActiveSession((current) => {
      if (!current) {
        return current;
      }

      const completedAt = new Date().toISOString();
      const { nextSession, completedSummary, recordedResults } = applyRating(current, rating, completedAt);

      if (completedSummary) {
        const dailyPackIds = new Set(ensuredDailyPack.newItemIds);
        const newCount = recordedResults.filter((result) => dailyPackIds.has(result.itemId)).length;
        const reviewCount = recordedResults.length - newCount;
        const summaryWithBreakdown: SessionSummary = {
          ...completedSummary,
          reviewCount,
          newCount,
        };

        setProgress((previous) =>
          applyCompletedSessionToProgress(previous, summaryWithBreakdown, recordedResults),
        );
        setDailyPack((previous) => updateDailyPackCompletion(previous, recordedResults));
        setSessionHistory((previous) => [summaryWithBreakdown, ...previous]);
        setScreen("summary");
      }

      return nextSession;
    });
  };

  const resetProgress = () => {
    setProgress(defaultProgress);
    setSessionHistory(defaultSessionHistory);
    setDailyPack(null);
    setActiveSession(null);
  };

  const latestSummary = sessionHistory[0] ?? null;
  const currentCard = getCurrentStudyCard(activeSession);
  const queueBreakdown = getStudyQueueBreakdown(
    effectiveSettings,
    vocabItems,
    progress,
    ensuredDailyPack,
    new Date().toISOString(),
  );

  const retryDataLoad = () => {
    setDataLoadVersion((current) => current + 1);
  };

  if (dataState.status === "loading") {
    return (
      <div className="app-shell">
        <div className="app-shell__backdrop" />
        <main className="app-shell__phone">
          <div className="app-shell__content">
            <div className="panel">
              <h1>Loading vocabulary library</h1>
              <p>Fetching levels, packs, and the current Swedish vocabulary dataset.</p>
              {typeof navigator !== "undefined" && navigator.onLine === false ? (
                <p className="meta">Offline mode works after one successful online load.</p>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (dataState.status === "error") {
    return (
      <div className="app-shell">
        <div className="app-shell__backdrop" />
        <main className="app-shell__phone">
          <div className="app-shell__content">
            <div className="panel">
              <h1>Could not load the vocabulary library</h1>
              <p>{dataState.message}</p>
              <div className="actions">
                <button className="button button--primary" onClick={retryDataLoad}>
                  Retry
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-shell__backdrop" />
      <main className="app-shell__phone">
        <div className="app-shell__content">
          {screen === "home" ? (
            <HomeScreen
              settings={effectiveSettings}
              progress={progress}
              packs={packs}
              vocabItems={vocabItems}
              dueReviewCount={queueBreakdown.dueReviewCount}
              dailyPackSize={queueBreakdown.dailyPackSize}
              remainingNewItemCount={queueBreakdown.remainingNewItemCount}
              dailyPackGenerated={queueBreakdown.dailyPackGenerated}
              onStartStudy={startStudy}
            />
          ) : null}
          {screen === "study" ? (
            <StudyScreen
              card={currentCard}
              isAnswerRevealed={activeSession?.isAnswerRevealed ?? false}
              onRevealAnswer={revealAnswer}
              onRate={rateCard}
              onGoToSettings={() => setScreen("settings")}
            />
          ) : null}
          {screen === "summary" ? <SessionSummaryScreen summary={latestSummary} /> : null}
          {screen === "progress" ? (
            <ProgressScreen progress={progress} onResetProgress={resetProgress} />
          ) : null}
          {screen === "settings" ? (
            <SettingsScreen
              levels={levels.map((level) => ({ id: level.id, label: level.label }))}
              packs={packs}
              settings={effectiveSettings}
              onChange={setSettings}
            />
          ) : null}
        </div>

        <nav className="tab-bar" aria-label="Primary">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`tab-bar__item ${screen === item.id ? "tab-bar__item--active" : ""}`}
              onClick={() => setScreen(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
