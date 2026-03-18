import { ScreenLayout } from "../components/ScreenLayout";
import { StatCard } from "../components/StatCard";
import type { ProgressSnapshot } from "../types/models";

interface ProgressScreenProps {
  progress: ProgressSnapshot;
  onResetProgress: () => void;
}

export function ProgressScreen({ progress, onResetProgress }: ProgressScreenProps) {
  return (
    <ScreenLayout
      title="Progress"
      subtitle="Persistent high-level progress based on completed study sessions."
    >
      <div className="grid grid--two">
        <StatCard label="Sessions" value={progress.sessionsCompleted} />
        <StatCard label="Items seen" value={progress.itemsSeen} />
        <StatCard label="Learning" value={progress.learningCount} />
        <StatCard label="Mastered" value={progress.masteredCount} />
      </div>
      <div className="actions">
        <button className="button button--secondary" onClick={onResetProgress}>
          Reset progress
        </button>
      </div>
      <p className="meta">
        Last studied: {progress.lastStudiedAt ? new Date(progress.lastStudiedAt).toLocaleString() : "Never"}
      </p>
    </ScreenLayout>
  );
}
