import { useState } from "react";
import {
  Activity,
  ArrowRight,
  ChartNoAxesCombined,
  ListChecks,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import type { User } from "../types";
import { Select } from "../components/controls";
import { ThemeControl } from "../components/appearance";
import { Avatar, ErrorMessage, label } from "../components/ui";

export function Welcome({
  users,
  loading,
  error,
  onRetry,
  onLogin,
}: {
  users: User[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  onLogin: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const selected = users.find((user) => user.id === selectedId);
  return (
    <div className="welcome-page">
      <header className="welcome-header">
        <a className="welcome-brand" href="/" aria-label="Signal welcome">
          <span className="welcome-brand-mark">
            <Activity size={22} strokeWidth={1.8} />
          </span>
          Signal
        </a>
        <ThemeControl />
      </header>
      <main id="main" className="welcome-main">
        <section className="welcome-intro" aria-labelledby="welcome-purpose">
          <span className="welcome-eyebrow">Your issue and risk workspace</span>
          <h2 id="welcome-purpose">
            Keep every issue
            <br />
            moving forward.
          </h2>
          <p>
            See what matters, bring the right people together, and follow every
            risk through to resolution.
          </p>
          <div className="welcome-features">
            <div>
              <ListChecks size={19} />
              <span>
                <strong>Clear priorities</strong>
                <span>Issues, owners and next steps in one place.</span>
              </span>
            </div>
            <div>
              <ChartNoAxesCombined size={19} />
              <span>
                <strong>A complete picture</strong>
                <span>Understand risk and see progress over time.</span>
              </span>
            </div>
            <div>
              <ShieldCheck size={19} />
              <span>
                <strong>Every decision, recorded</strong>
                <span>Keep assessments and history connected.</span>
              </span>
            </div>
          </div>
        </section>
        <section className="welcome-card" aria-labelledby="welcome-title">
          <span className="welcome-card-icon">
            <ArrowRight size={22} />
          </span>
          <h1 id="welcome-title">Welcome to Signal</h1>
          <p>Choose a user to open your workspace.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (selected && !loading && !error) onLogin(selected.id);
            }}
          >
            {loading ? (
              <p className="welcome-status" role="status">
                <LoaderCircle className="spin" size={17} />
                Loading users…
              </p>
            ) : error ? (
              <div className="welcome-load-error">
                <ErrorMessage error={error} />
                <button
                  type="button"
                  className="button secondary"
                  onClick={onRetry}
                >
                  Try again
                </button>
              </div>
            ) : users.length === 0 ? (
              <p className="welcome-status" role="status">
                No users are available yet.
              </p>
            ) : (
              <div className="welcome-user-field">
                <label>Choose user</label>
                <Select
                  label="Choose user"
                  value={selectedId}
                  placeholder="Select your user"
                  onValueChange={setSelectedId}
                  leading={
                    selected ? <Avatar user={selected} small /> : undefined
                  }
                  options={users.map((user) => ({
                    value: user.id,
                    label: user.full_name,
                    leading: <Avatar user={user} small />,
                  }))}
                />
                <p className="welcome-user-role">
                  {selected
                    ? `${label(selected.role)} workspace`
                    : "Your role sets your starting view."}
                </p>
              </div>
            )}
            <button
              type="submit"
              className="button primary welcome-login"
              disabled={!selected || loading || !!error}
            >
              Log in
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="welcome-note">
            No password needed. Choose a fictional user to explore the demo.
          </p>
        </section>
      </main>
    </div>
  );
}
