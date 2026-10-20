import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Select } from "./controls";

type Appearance = "light" | "dark" | "system";
const AppearanceContext = createContext<{
  mode: Appearance;
  setMode: (mode: Appearance) => void;
} | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Appearance>(() => {
    const stored = localStorage.getItem("signal-appearance");
    return stored === "light" || stored === "dark" ? stored : "system";
  });
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved =
        mode === "system" ? (media.matches ? "dark" : "light") : mode;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", resolved === "dark" ? "#181818" : "#f6f7f8");
    };
    localStorage.setItem("signal-appearance", mode);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [mode]);
  return (
    <AppearanceContext.Provider value={{ mode, setMode }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function ThemeControl() {
  const appearance = useContext(AppearanceContext);
  if (!appearance) throw new Error("ThemeControl requires AppearanceProvider");
  const { mode, setMode } = appearance;
  const Icon = mode === "system" ? Monitor : mode === "dark" ? Moon : Sun;
  return (
    <Select
      className="appearance-control"
      label="Appearance"
      value={mode}
      onValueChange={(value) => setMode(value as Appearance)}
      leading={<Icon size={17} />}
      options={[
        { value: "light", label: "Light", leading: <Sun size={15} /> },
        { value: "dark", label: "Dark", leading: <Moon size={15} /> },
        { value: "system", label: "System", leading: <Monitor size={15} /> },
      ]}
    />
  );
}
