import { ScreenLayout } from "../components/ScreenLayout";
import { StatCard } from "../components/StatCard";
import type { SessionSummary } from "../types/models";

interface SessionSummaryScreenProps {
  summary: SessionSummary | null;
}

export function SessionSummaryScreen({ summary }: SessionSummaryScreenProps) {
  if (!summary) {
    return (
      <ScreenLayout
        title="Session summary"
        subtitle="Finish a study session to see your latest totals here."
      >
        <div className="panel">
          <h2>No completed session yet</h2>
          <p>Your first finished study session will populate this summary screen.</p>
        </div>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Session summary"
      subtitle="Counts-only recap for your most recently completed study session."
    >
      <div className="panel">
        <p className="eyebrow">Mode</p>
        <h2>{summary.mode === "svToEn" ? "Swedish -> English" : "English -> Swedish"}</h2>
        <p className="meta">{new Date(summary.completedAt).toLocaleString()}</p>
        <p className="meta">
          {summary.reviewCount} review • {summary.newCount} from today&apos;s pack
        </p>
      </div>
      <div className="grid grid--two">
        <StatCard label="Studied" value={summary.studiedCount} />
        <StatCard label="Easy" value={summary.easyCount} />
        <StatCard label="Hard" value={summary.hardCount} />
        <StatCard label="Wrong" value={summary.wrongCount} />
      </div>
    </ScreenLayout>
  );
}
