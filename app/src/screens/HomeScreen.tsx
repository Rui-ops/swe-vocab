import { StatCard } from "../components/StatCard";
import { ScreenLayout } from "../components/ScreenLayout";
import type { AppSettings, PackSummary, ProgressSnapshot, VocabularyItem } from "../types/models";

interface HomeScreenProps {
  settings: AppSettings;
  progress: ProgressSnapshot;
  packs: PackSummary[];
  vocabItems: VocabularyItem[];
  dueReviewCount: number;
  newItemCount: number;
  onStartStudy: () => void;
}

export function HomeScreen({
  settings,
  progress,
  packs,
  vocabItems,
  dueReviewCount,
  newItemCount,
  onStartStudy,
}: HomeScreenProps) {
  const enabledPackCount = settings.enabledPackIds.length;
  const enabledItemCount = vocabItems.filter((item) =>
    item.packIds.some((packId) => settings.enabledPackIds.includes(packId)),
  ).length;

  return (
    <ScreenLayout
      title="Daily review"
      subtitle="One focused daily loop: short recall, simple review timing, and local progress."
    >
      <div className="grid grid--two">
        <StatCard label="Level" value={settings.selectedLevel} hint="Current study level" />
        <StatCard label="Starter pack" value={enabledPackCount} hint={packs[0]?.title ?? "Core"} />
        <StatCard label="Due review" value={dueReviewCount} hint="Ready now" />
        <StatCard label="New items" value={newItemCount} hint={`${enabledItemCount} eligible`} />
      </div>

      <div className="panel">
        <h2>Start a real study session</h2>
        <p>
          The default path is Swedish to English recall using one starter pack. Reverse recall is
          optional and can stay off until the core habit loop feels solid.
        </p>
        <div className="actions">
          <button className="button button--primary" onClick={onStartStudy}>
            Start study
          </button>
        </div>
        <p className="meta">
          {progress.sessionsCompleted} sessions completed • {progress.masteredCount} mastered items
        </p>
      </div>
    </ScreenLayout>
  );
}
