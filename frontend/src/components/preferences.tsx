import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Preferences = {
  density: "comfortable" | "compact";
  motion: "system" | "reduced";
  chartRange: "30" | "90" | "180" | "365";
  liveUpdates: boolean;
};

export const defaultPreferences: Preferences = {
  density: "comfortable",
  motion: "system",
  chartRange: "365",
  liveUpdates: true,
};

export function readPreferences(stored: string | null): Preferences {
  try {
    const value = JSON.parse(stored || "null");
    return {
      density: value?.density === "compact" ? "compact" : "comfortable",
      motion: value?.motion === "reduced" ? "reduced" : "system",
      chartRange: ["30", "90", "180", "365"].includes(value?.chartRange)
        ? value.chartRange
        : "365",
      liveUpdates:
        typeof value?.liveUpdates === "boolean" ? value.liveUpdates : true,
    };
  } catch {
    return { ...defaultPreferences };
  }
}

const PreferencesContext = createContext<{
  preferences: Preferences;
  updatePreferences: (changes: Partial<Preferences>) => void;
}>({
  preferences: defaultPreferences,
  updatePreferences: () => undefined,
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(() =>
    readPreferences(localStorage.getItem("signal-preferences")),
  );
  useEffect(() => {
    localStorage.setItem("signal-preferences", JSON.stringify(preferences));
    document.documentElement.dataset.density = preferences.density;
    document.documentElement.dataset.motion = preferences.motion;
  }, [preferences]);
  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        updatePreferences: (changes) =>
          setPreferences((current) => ({ ...current, ...changes })),
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);
