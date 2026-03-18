import { ScreenLayout } from "../components/ScreenLayout";
import type { AppSettings, PackSummary } from "../types/models";

interface PacksScreenProps {
  packs: PackSummary[];
  settings: AppSettings;
}

export function PacksScreen({ packs, settings }: PacksScreenProps) {
  return (
    <ScreenLayout
      title="Packs"
      subtitle="Supporting view only. Lean v1 succeeds with one starter pack and a reliable daily loop."
    >
      <div className="stack">
        {packs.map((pack) => {
          const enabled = settings.enabledPackIds.includes(pack.id);
          return (
            <article className="panel" key={pack.id}>
              <div className="panel__row">
                <div>
                  <h2>{pack.title}</h2>
                  <p>{pack.description}</p>
                </div>
                <span className={`pill ${enabled ? "pill--active" : ""}`}>
                  {enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="meta">
                {pack.cefrLevel} • {pack.itemCount} items • {pack.tags.join(", ")}
              </p>
            </article>
          );
        })}
      </div>
    </ScreenLayout>
  );
}
