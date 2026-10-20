export type Severity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type IssueStatus = "OPEN" | "IN_PROGRESS" | "MITIGATED" | "RESOLVED";
export type ActionStatus = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Category =
  | "SECURITY"
  | "OPERATIONS"
  | "COMPLIANCE"
  | "TECHNOLOGY"
  | "CUSTOMER"
  | "OTHER";
export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_color: string;
  created_at: string;
}
export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  owner_id: string;
  status: string;
  created_at: string;
}
export interface ProjectStats extends Project {
  owner: User;
  active_issues: number;
  critical_risks: number;
  progress: number;
}
export interface Risk {
  id: string;
  issue_id: string;
  likelihood: number;
  impact: number;
  score: number;
  severity: Severity;
  rationale: string;
  assessed_by: string;
  assessed_at: string;
  assessor?: User;
}
export interface Issue {
  id: string;
  reference_code: string;
  project_id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: IssueStatus;
  reporter_id: string;
  assignee_id: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  version: number;
  risk: Risk | null;
  project: Project;
  assignee: User;
  reporter: User;
}
export interface Action {
  id: string;
  issue_id: string;
  title: string;
  description: string;
  owner_id: string;
  status: ActionStatus;
  due_date: string;
  completed_at: string | null;
  created_at: string;
  owner: User;
  issue_reference: string;
  issue_title: string;
  issue_status: IssueStatus;
  issue_version: number;
  overdue: boolean;
}
export interface Audit {
  id: string;
  issue_id: string;
  actor_id: string;
  event_type: string;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown>;
  occurred_at: string;
  actor: User;
  issue_reference: string;
  issue_title: string;
}
export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: User;
}
export interface Detail extends Issue {
  assessments: Risk[];
  actions: Action[];
  comments: Comment[];
  activity: Audit[];
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
export interface Cell {
  impact: number;
  likelihood: number;
  score: number;
  severity: Severity;
  count: number;
  issues: Issue[];
}
export interface Summary {
  active_issues: number;
  critical_risks: number;
  overdue_actions: number;
  resolved_issues: number;
  total_issues: number;
  distribution: { severity: Severity; count: number }[];
  statuses: { status: IssueStatus; count: number }[];
  critical_issues: Issue[];
  activity: Audit[];
  matrix: Cell[];
  projects: ProjectStats[];
  mitigation: { done: number; total: number; progress: number };
  generated_at: string;
}

export interface TrendDay {
  date: string;
  created: number;
  resolved: number;
  active: number;
  average_risk: number | null;
  completed_actions: number;
  events: number;
}
export interface Analytics {
  days: number;
  generated_at: string;
  timeline: TrendDay[];
  metrics: {
    created: number;
    resolved: number;
    completed_actions: number;
    assessments: number;
    events: number;
    resolution_days: number | null;
  };
  categories: { category: Category; count: number }[];
  action_statuses: { status: ActionStatus; count: number }[];
  total_events: number;
}
