import { createContext, useContext } from "react";
import type { ProjectStats, User } from "./types";

export const Workspace = createContext<{
  users: User[];
  projects: ProjectStats[];
  user?: User;
  demo: boolean;
}>({ users: [], projects: [], demo: false });
export const useWorkspace = () => useContext(Workspace);
