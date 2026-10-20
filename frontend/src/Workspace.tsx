import { createContext, useContext } from "react";
import type { ProjectStats, User } from "./types";

export const Workspace = createContext<{
  users: User[];
  projects: ProjectStats[];
  user?: User;
  demo: boolean;
  deletion?: boolean;
}>({ users: [], projects: [], demo: false, deletion: false });
export const useWorkspace = () => useContext(Workspace);
