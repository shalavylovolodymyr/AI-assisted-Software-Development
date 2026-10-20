import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  ListChecks,
  ShieldAlert,
  Clock3,
  FolderKanban,
} from "lucide-react";
import { useData } from "../api";
import { useWorkspace } from "../Workspace";
import type { Action, Issue, Page, User } from "../types";
import { Select } from "../components/controls";
import { State } from "../components/ui";
import { Overview, PageHeader } from "./portfolio";
import { ActionList, IssueTable } from "./issues";
import {
  ExcelExport,
  actionSheets,
  issueSheets,
} from "../components/excel-export";
import { allPages } from "../components/export-fetch";

export function homeTitle(role?: string) {
  return role === "MEMBER"
    ? "My work"
    : role === "MANAGER"
      ? "Team focus"
      : "Overview";
}
export function Home({ onCreate }: { onCreate: () => void }) {
  const { user } = useWorkspace();
  if (!user) return <State loading />;
  return user.role === "ADMIN" ? (
    <Overview onCreate={onCreate} />
  ) : (
    <FocusedHome key={user.id} user={user} onCreate={onCreate} />
  );
}
function FocusedHome({ user, onCreate }: { user: User; onCreate: () => void }) {
  const { projects, demo } = useWorkspace();
  const owned = projects.filter((project) => project.owner_id === user.id);
  const manager = user.role === "MANAGER";
  const [projectId, setProjectId] = useState(owned[0]?.id || "");
  const project = owned.find((project) => project.id === projectId) || owned[0];
  const scoped =
    manager && project ? `project_id=${project.id}` : `assignee_id=${user.id}`;
  const issues = useData<Page<Issue>>(
    `/issues?active_only=true&${scoped}&sort=risk_score&page_size=6`,
    30000,
  );
  const actions = useData<Action[]>(`/actions?owner_id=${user.id}`, 30000);
  const queue = actions.data?.filter(
    (action) => !["DONE", "CANCELLED"].includes(action.status),
  );
  return (
    <>
      <PageHeader title={homeTitle(user.role)}>
        <ExcelExport
          title={`Signal ${homeTitle(user.role)}`}
          disabled={!issues.data || !actions.data}
          getSheets={async () => [
            ...issueSheets(
              await allPages<Issue>(
                "/issues",
                new URLSearchParams(`active_only=true&${scoped}`),
              ),
            ),
            ...actionSheets(queue || []),
            {
              name: "Scope",
              columns: ["Field", "Value"],
              rows: [
                ["User", user.full_name],
                [
                  "Project",
                  manager
                    ? project?.name || "My assignments"
                    : "All assigned projects",
                ],
              ],
            },
          ]}
        />
        {manager && owned.length > 1 && (
          <Select
            label="Focus project"
            value={project?.id || ""}
            onValueChange={setProjectId}
            options={owned.map((p) => ({ value: p.id, label: p.name }))}
          />
        )}
        {demo && (
          <button className="button primary" onClick={onCreate}>
            <Plus size={15} />
            Create issue
          </button>
        )}
      </PageHeader>
      <div className="focus-intro">
        <span className="focus-avatar">
          {user.full_name
            .split(" ")
            .map((word) => word[0])
            .join("")}
        </span>
        <div>
          <h2>
            {manager ? project?.name || "My assignments" : user.full_name}
          </h2>
          <span>{manager ? "Project manager" : "Personal queue"}</span>
        </div>
      </div>
      <div className="kpi-grid focus-kpis">
        {[
          {
            name: manager ? "Active issues" : "Assigned issues",
            value: issues.data?.total,
            icon: FolderKanban,
            to: `/issues?active_only=true&${scoped}`,
          },
          {
            name: manager ? "Critical risks" : "My actions",
            value: manager ? project?.critical_risks : queue?.length,
            icon: manager ? ShieldAlert : ListChecks,
            to: manager
              ? `/issues?severity=CRITICAL&active_only=true&${scoped}`
              : `/actions?owner_id=${user.id}`,
          },
          {
            name: "Overdue actions",
            value: queue?.filter((action) => action.overdue).length,
            icon: Clock3,
            to: `/actions?overdue=true&owner_id=${user.id}`,
          },
        ].map((item) => (
          <Link to={item.to} key={item.name} className="kpi-card">
            <div className="kpi-title">
              <span className="kpi-icon">
                <item.icon size={16} />
              </span>
              {item.name}
            </div>
            <div className="kpi-number">{item.value ?? "—"}</div>
          </Link>
        ))}
      </div>
      <section className="panel">
        <div className="panel-header">
          <h2>{manager ? "Project priorities" : "Assigned to me"}</h2>
          <Link
            className="quiet-link"
            to={`/issues?active_only=true&${scoped}`}
          >
            View all
          </Link>
        </div>
        <State loading={issues.isPending} error={issues.error}>
          {issues.data && <IssueTable issues={issues.data.items} />}
        </State>
      </section>
      <section className="panel focus-actions">
        <div className="panel-header">
          <h2>{manager ? "My actions" : "Next actions"}</h2>
          <Link className="quiet-link" to={`/actions?owner_id=${user.id}`}>
            View all
          </Link>
        </div>
        <State loading={actions.isPending} error={actions.error}>
          {queue && <ActionList actions={queue.slice(0, 6)} />}
        </State>
      </section>
    </>
  );
}
