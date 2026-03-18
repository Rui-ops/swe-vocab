import { useEffect, useState } from "react";
import levelsData from "../data/levels.json";
import packsData from "../data/packs.json";
import vocabMasterData from "../data/vocab_master.json";
import {
  applyCompletedSessionToProgress,
  applyRating,
  createStudySession,
  getCurrentStudyCard,
  revealCurrentCard,
} from "../features/study/session";
import { getStudyQueueBreakdown } from "../lib/review/engine";
import {
  loadProgress,
  loadSessionHistory,
  loadSettings,
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
  AppScreen,
  AppSettings,
  LevelSummary,
  PackSummary,
  ProgressSnapshot,
  RecallRating,
  SessionSummary,
  VocabularyItem,
} from "../types/models";

const levels = levelsData as LevelSummary[];
const packs = packsData as PackSummary[];
const vocabItems = vocabMasterData as VocabularyItem[];

const defaultSettings: AppSettings = {
  selectedLevel: "A2",
  enabledTestModes: ["svToEn"],
  dailyNewItemCount: 5,
  dailyReviewLimit: 10,
  enabledPackIds: packs.map((pack) => pack.id),
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

export function App() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings(defaultSettings));
  const [progress, setProgress] = useState<ProgressSnapshot>(() => loadProgress(defaultProgress));
  const [sessionHistory, setSessionHistory] = useState<SessionSummary[]>(() =>
    loadSessionHistory(defaultSessionHistory),
  );
  const [activeSession, setActiveSession] = useState<ActiveStudySession | null>(null);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    saveSessionHistory(sessionHistory);
  }, [sessionHistory]);

  const startStudy = () => {
    const now = new Date().toISOString();
    setActiveSession(createStudySession(settings, vocabItems, progress, now));
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
        setProgress((previous) =>
          applyCompletedSessionToProgress(previous, completedSummary, recordedResults),
        );
        setSessionHistory((previous) => [completedSummary, ...previous]);
        setScreen("summary");
      }

      return nextSession;
    });
  };

  const resetProgress = () => {
    setProgress(defaultProgress);
    setSessionHistory(defaultSessionHistory);
    setActiveSession(null);
  };

  const latestSummary = sessionHistory[0] ?? null;
  const currentCard = getCurrentStudyCard(activeSession);
  const queueBreakdown = getStudyQueueBreakdown(
    settings,
    vocabItems,
    progress,
    new Date().toISOString(),
  );

  return (
    <div className="app-shell">
      <div className="app-shell__backdrop" />
      <main className="app-shell__phone">
        <div className="app-shell__content">
          {screen === "home" ? (
            <HomeScreen
              settings={settings}
              progress={progress}
              packs={packs}
              vocabItems={vocabItems}
              dueReviewCount={queueBreakdown.dueReviewCount}
              newItemCount={queueBreakdown.newItemCount}
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
              settings={settings}
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
