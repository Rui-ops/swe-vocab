import { StatCard } from "../components/StatCard";
import { ScreenLayout } from "../components/ScreenLayout";
import type { AppSettings, PackSummary, ProgressSnapshot, VocabularyItem } from "../types/models";

interface HomeScreenProps {
  settings: AppSettings;
  progress: ProgressSnapshot;
  packs: PackSummary[];
  vocabItems: VocabularyItem[];
  dueReviewCount: number;
  dailyPackSize: number;
  remainingNewItemCount: number;
  dailyPackGenerated: boolean;
  onStartStudy: () => void;
}

export function HomeScreen({
  settings,
  progress,
  packs,
  vocabItems,
  dueReviewCount,
  dailyPackSize,
  remainingNewItemCount,
  dailyPackGenerated,
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
        <StatCard label="Active packs" value={enabledPackCount} hint={packs[0]?.title ?? "Core"} />
        <StatCard label="Due review" value={dueReviewCount} hint="Ready now" />
        <StatCard
          label="Today's pack"
          value={remainingNewItemCount}
          hint={dailyPackGenerated ? `${dailyPackSize} generated today` : `${enabledItemCount} eligible`}
        />
      </div>

      <div className="panel">
        <h2>Start a real study session</h2>
        <p>
          One new-word pack is generated per local calendar day from your enabled CEFR core packs.
          It stays fixed for the whole day and refreshes on the next local day.
        </p>
        <div className="actions">
          <button className="button button--primary" onClick={onStartStudy}>
            Start study
          </button>
        </div>
        <p className="meta">
          {progress.sessionsCompleted} sessions completed • {progress.masteredCount} mastered items •{" "}
          {remainingNewItemCount} new words left today
        </p>
      </div>
    </ScreenLayout>
  );
}
