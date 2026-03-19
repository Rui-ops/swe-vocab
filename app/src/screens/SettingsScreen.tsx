import { ScreenLayout } from "../components/ScreenLayout";
import type { AppSettings, CefrLevel, PackSummary, TestMode } from "../types/models";

interface SettingsScreenProps {
  levels: Array<{ id: CefrLevel; label: string }>;
  packs: PackSummary[];
  settings: AppSettings;
  onChange: (value: AppSettings) => void;
}

export function SettingsScreen({ levels, packs, settings, onChange }: SettingsScreenProps) {
  const toggleMode = (mode: TestMode) => {
    const enabled = settings.enabledTestModes.includes(mode);
    const nextModes = enabled
      ? settings.enabledTestModes.filter((entry) => entry !== mode)
      : [...settings.enabledTestModes, mode];

    onChange({
      ...settings,
      enabledTestModes: nextModes.length > 0 ? nextModes : [mode],
    });
  };

  const togglePack = (packId: string) => {
    const enabled = settings.enabledPackIds.includes(packId);
    onChange({
      ...settings,
      enabledPackIds: enabled
        ? settings.enabledPackIds.filter((entry) => entry !== packId)
        : [...settings.enabledPackIds, packId],
    });
  };

  return (
    <ScreenLayout
      title="Settings"
      subtitle="Daily study settings with CEFR core packs, one primary study direction, and daily limits."
    >
      <div className="stack">
        <label className="field">
          <span>Level</span>
          <select
            value={settings.selectedLevel}
            onChange={(event) =>
              onChange({
                ...settings,
                selectedLevel: event.target.value as CefrLevel,
              })
            }
          >
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.label}
              </option>
            ))}
          </select>
        </label>

        <div className="panel">
          <p className="field__label">Study direction</p>
          <p className="meta">Swedish {"->"} English is the primary v1 path. Reverse recall is optional.</p>
          <div className="toggle-row">
            <button
              className={`button ${settings.enabledTestModes.includes("svToEn") ? "button--primary" : "button--secondary"}`}
              onClick={() => toggleMode("svToEn")}
            >
              Primary: Swedish {"->"} English
            </button>
            <button
              className={`button ${settings.enabledTestModes.includes("enToSv") ? "button--primary" : "button--secondary"}`}
              onClick={() => toggleMode("enToSv")}
            >
              Optional: English {"->"} Swedish
            </button>
          </div>
        </div>

        <label className="field">
          <span>Daily new item count</span>
          <input
            type="number"
            min="1"
            max="100"
            value={settings.dailyNewItemCount}
            onChange={(event) =>
              onChange({
                ...settings,
                dailyNewItemCount: Number(event.target.value),
              })
            }
          />
        </label>

        <label className="field">
          <span>Daily review limit</span>
          <input
            type="number"
            min="1"
            max="50"
            value={settings.dailyReviewLimit}
            onChange={(event) =>
              onChange({
                ...settings,
                dailyReviewLimit: Number(event.target.value),
              })
            }
          />
        </label>

        <div className="panel">
          <p className="field__label">Enabled core packs</p>
          <p className="meta">
            The larger library is organized primarily by CEFR core packs. Keep the packs you want
            in your daily pool enabled.
          </p>
          {packs.map((pack) => (
            <label className="checkbox" key={pack.id}>
              <input
                type="checkbox"
                checked={settings.enabledPackIds.includes(pack.id)}
                onChange={() => togglePack(pack.id)}
              />
              <span>
                {pack.title} ({pack.itemCount})
              </span>
            </label>
          ))}
        </div>
      </div>
    </ScreenLayout>
  );
}
