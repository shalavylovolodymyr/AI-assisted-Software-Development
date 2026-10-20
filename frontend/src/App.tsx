import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ChartNoAxesCombined,
  FolderKanban,
  Grid2X2,
  LayoutDashboard,
  ListChecks,
  ListFilter,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useData } from "./api";
import { Workspace } from "./Workspace";
import type { ProjectStats, User } from "./types";
import { Avatar, State } from "./components/ui";
import { Hint, Select, TooltipProvider } from "./components/controls";
import { CreateModal } from "./components/forms";
import {
  RiskMatrixPage,
  Projects,
  ActivityPage,
  About,
  ChartsPage,
} from "./pages/portfolio";
import { Home } from "./pages/home";
import { Settings } from "./pages/settings";
import { WorkspaceSearch } from "./components/workspace-search";
import { IssueDetailPage, Issues, Actions } from "./pages/issues";
import { Welcome } from "./pages/welcome";

const nav = [
  { to: "/", name: "Overview", icon: LayoutDashboard },
  { to: "/charts", name: "Charts", icon: ChartNoAxesCombined },
  { to: "/issues", name: "Issues", icon: ListFilter },
  { to: "/risk-matrix", name: "Risk matrix", icon: Grid2X2 },
  { to: "/actions", name: "Actions", icon: ListChecks },
  { to: "/projects", name: "Projects", icon: FolderKanban },
  { to: "/activity", name: "Activity", icon: Activity },
  { to: "/settings", name: "Settings", icon: Settings2 },
];
export default function App() {
  const people = useData<User[]>("/users");
  const navigate = useNavigate();
  const [userId, setUserId] = useState(
    () => localStorage.getItem("signal-session-user") || "",
  );
  const user = people.data?.find((person) => person.id === userId);
  useEffect(() => {
    if (people.data && userId && !user) {
      localStorage.removeItem("signal-session-user");
      localStorage.removeItem("signal-user");
      setUserId("");
    }
  }, [people.data, userId, user]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === "signal-session-user" || event.key === null)
        setUserId(localStorage.getItem("signal-session-user") || "");
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function chooseUser(id: string) {
    if (!people.data?.some((person) => person.id === id)) return;
    localStorage.setItem("signal-session-user", id);
    setUserId(id);
  }
  function logout() {
    localStorage.removeItem("signal-session-user");
    localStorage.removeItem("signal-user");
    setUserId("");
    navigate("/", { replace: true });
  }
  return (
    <TooltipProvider delayDuration={250}>
      {user ? (
        <WorkspaceApp
          user={user}
          users={people.data || []}
          onUserChange={chooseUser}
          onLogout={logout}
        />
      ) : userId && people.isPending ? (
        <State loading />
      ) : (
        <Welcome
          users={people.data || []}
          loading={people.isPending}
          error={people.error}
          onRetry={() => void people.refetch()}
          onLogin={chooseUser}
        />
      )}
    </TooltipProvider>
  );
}

function WorkspaceApp({
  user,
  users,
  onUserChange,
  onLogout,
}: {
  user: User;
  users: User[];
  onUserChange: (id: string) => void;
  onLogout: () => void;
}) {
  const location = useLocation();
  const projects = useData<ProjectStats[]>("/projects");
  const config = useData<{ demo_mode: boolean; deletion?: boolean }>("/config");
  const [create, setCreate] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("signal-sidebar-hidden") === "true",
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const navigationButton = useRef<HTMLButtonElement>(null);
  const closeNavigationButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 760px)");
    const change = () => {
      if (!mobile.matches) setDrawer(false);
    };
    mobile.addEventListener("change", change);
    return () => mobile.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!drawer) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeNavigationButton.current?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape" && !event.defaultPrevented) {
        setDrawer(false);
        requestAnimationFrame(() =>
          navigationButton.current?.focus({ preventScroll: true }),
        );
      } else if (event.key === "Tab") {
        const items = Array.from(
          document.querySelectorAll<HTMLElement>(
            "#workspace-sidebar button:not(:disabled), #workspace-sidebar a[href]",
          ),
        ).filter(
          (element) =>
            element.getClientRects().length &&
            getComputedStyle(element).visibility === "visible",
        );
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first && last) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last &&
          first
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", escape);
    };
  }, [drawer]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  return (
    <Workspace.Provider
      value={{
        users,
        projects: projects.data || [],
        user,
        demo: config.data?.demo_mode || false,
        deletion: config.data?.deletion || false,
      }}
    >
      <a className="skip-link" href="#main" tabIndex={drawer ? -1 : 0}>
        Skip to content
      </a>
      <button
        aria-label="Dismiss navigation"
        aria-hidden={!drawer}
        tabIndex={-1}
        className={`drawer-scrim ${drawer ? "open" : ""}`}
        onClick={() => setDrawer(false)}
      />
      <aside
        id="workspace-sidebar"
        role={drawer ? "dialog" : undefined}
        aria-modal={drawer ? true : undefined}
        aria-label={drawer ? "Navigation" : undefined}
        className={`sidebar ${drawer ? "expanded" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
      >
        <div className="sidebar-shortcuts">
          <Hint
            label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            side="right"
            disabled={!sidebarCollapsed || drawer}
          >
            <button
              className="sidebar-item sidebar-toggle desktop-only"
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              aria-expanded={!sidebarCollapsed}
              aria-controls="workspace-sidebar"
              onClick={() => {
                const collapsed = !sidebarCollapsed;
                setSidebarCollapsed(collapsed);
                localStorage.setItem(
                  "signal-sidebar-hidden",
                  String(collapsed),
                );
              }}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
              <span className="nav-text">Collapse sidebar</span>
            </button>
          </Hint>
          <button
            ref={closeNavigationButton}
            className="sidebar-item mobile-only"
            onClick={() => setDrawer(false)}
            aria-label="Close navigation"
          >
            <X size={19} />
            <span className="nav-text">Close sidebar</span>
          </button>
          {config.data?.demo_mode && (
            <Hint
              label="New issue"
              side="right"
              disabled={!sidebarCollapsed || drawer}
            >
              <button
                className="sidebar-item sidebar-new-issue"
                aria-label="New issue"
                onClick={() => {
                  setDrawer(false);
                  setCreate(true);
                }}
              >
                <Plus size={18} strokeWidth={1.7} />
                <span className="nav-text">New issue</span>
              </button>
            </Hint>
          )}
          <Hint
            label="Search workspace"
            side="right"
            disabled={!sidebarCollapsed || drawer}
          >
            <button
              className="sidebar-item sidebar-search"
              aria-label="Search workspace"
              onClick={() => {
                setDrawer(false);
                setSearchOpen(true);
              }}
            >
              <Search size={18} strokeWidth={1.7} />
              <span className="nav-text">Search</span>
            </button>
          </Hint>
        </div>
        <nav aria-label="Workspace">
          {nav.map((n) => (
            <Hint
              key={n.to}
              label={n.name}
              disabled={!sidebarCollapsed || drawer}
              side="right"
            >
              <NavLink
                to={n.to}
                aria-label={n.name}
                end={n.to === "/"}
                onClick={() => setDrawer(false)}
              >
                <n.icon size={18} strokeWidth={1.7} />
                <span className="nav-text">{n.name}</span>
              </NavLink>
            </Hint>
          ))}
        </nav>
        {user && (
          <div className="sidebar-profile">
            <Select
              iconOnly={sidebarCollapsed && !drawer}
              className="user-selector account-control"
              label="Demo user"
              value={user.id}
              onValueChange={onUserChange}
              leading={<Avatar user={user} small />}
              options={users.map((u) => ({
                value: u.id,
                label: u.full_name,
                leading: <Avatar user={u} small />,
              }))}
            />
            <Hint
              label="Log out"
              side="right"
              disabled={!sidebarCollapsed || drawer}
            >
              <button
                className="sidebar-item sidebar-logout"
                aria-label="Log out"
                onClick={onLogout}
              >
                <LogOut size={18} strokeWidth={1.7} />
                <span className="nav-text">Log out</span>
              </button>
            </Hint>
          </div>
        )}
      </aside>
      <div
        className={`app-content ${sidebarCollapsed ? "sidebar-compact" : ""}`}
        inert={drawer}
      >
        <header className={`topbar ${sidebarCollapsed ? "rail-header" : ""}`}>
          <button
            ref={navigationButton}
            className="icon-button mobile-only"
            onClick={() => setDrawer(true)}
            aria-label="Open navigation"
            aria-expanded={drawer}
            aria-controls="workspace-sidebar"
          >
            <Menu size={20} />
          </button>
          <div
            id="page-toolbar"
            className="page-toolbar"
            data-title={
              nav.find((item) => item.to === location.pathname)?.name || "Issue"
            }
          />
          {config.data?.demo_mode &&
            !["/", "/issues"].includes(location.pathname) && (
              <Hint label="New issue">
                <button
                  className="icon-button mobile-only"
                  aria-label="New issue"
                  onClick={() => setCreate(true)}
                >
                  <Plus size={19} />
                </button>
              </Hint>
            )}
          {location.pathname.startsWith("/issues/") && (
            <Hint label="Search workspace">
              <button
                className="icon-button"
                aria-label="Search workspace"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={18} />
              </button>
            </Hint>
          )}
        </header>
        <main id="main">
          <Routes>
            <Route
              path="/"
              element={<Home onCreate={() => setCreate(true)} />}
            />
            <Route
              path="/issues"
              element={<Issues onCreate={() => setCreate(true)} />}
            />
            <Route path="/issues/:id" element={<IssueDetailPage />} />
            <Route path="/charts" element={<ChartsPage />} />
            <Route path="/risk-matrix" element={<RiskMatrixPage />} />
            <Route path="/actions" element={<Actions />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
            <Route
              path="*"
              element={
                <div className="state">
                  <h1>Page not found</h1>
                  <Link to="/">Return to overview</Link>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
      <WorkspaceSearch open={searchOpen} onOpenChange={setSearchOpen} />

      <CreateModal open={create} onClose={() => setCreate(false)} />
    </Workspace.Provider>
  );
}
