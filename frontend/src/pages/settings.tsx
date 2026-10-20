import { ThemeControl } from "../components/appearance";
import { Select } from "../components/controls";
import { usePreferences, type Preferences } from "../components/preferences";
import { PageHeader } from "./portfolio";

export function Settings() {
  const { preferences, updatePreferences } = usePreferences();
  return (
    <>
      <PageHeader title="Settings" />
      <section className="panel settings-panel" aria-label="Workspace settings">
        <div className="panel-header">
          <h2>Appearance</h2>
        </div>
        <div className="settings-row">
          <div>
            <strong>Theme</strong>
          </div>
          <ThemeControl />
        </div>
        <div className="settings-row">
          <div>
            <strong>Density</strong>
          </div>
          <Select
            label="Density"
            value={preferences.density}
            onValueChange={(value) =>
              updatePreferences({ density: value as Preferences["density"] })
            }
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
          />
        </div>
        <div className="settings-row">
          <div>
            <strong>Motion</strong>
          </div>
          <Select
            label="Motion"
            value={preferences.motion}
            onValueChange={(value) =>
              updatePreferences({ motion: value as Preferences["motion"] })
            }
            options={[
              { value: "system", label: "Follow system" },
              { value: "reduced", label: "Reduced" },
            ]}
          />
        </div>
      </section>
      <section className="panel settings-panel" aria-label="Data preferences">
        <div className="panel-header">
          <h2>Data</h2>
        </div>
        <div className="settings-row">
          <div>
            <strong>Default chart range</strong>
          </div>
          <Select
            label="Default chart range"
            value={preferences.chartRange}
            onValueChange={(value) =>
              updatePreferences({
                chartRange: value as Preferences["chartRange"],
              })
            }
            options={[30, 90, 180, 365].map((days) => ({
              value: String(days),
              label: `Last ${days} days`,
            }))}
          />
        </div>
        <div className="settings-row">
          <div>
            <strong>Background refresh</strong>
            <span>Every 30 seconds on live views</span>
          </div>
          <Select
            label="Background refresh"
            value={String(preferences.liveUpdates)}
            onValueChange={(value) =>
              updatePreferences({ liveUpdates: value === "true" })
            }
            options={[
              { value: "true", label: "On" },
              { value: "false", label: "Off" },
            ]}
          />
        </div>
      </section>
    </>
  );
}
