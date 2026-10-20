import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ChartNoAxesCombined,
  Grid2X2,
  ListFilter,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Issue, Page } from "../types";
import { RiskScore } from "./ui";

const shortcuts = [
  { id: "charts", title: "Charts", to: "/charts", icon: ChartNoAxesCombined },
  { id: "issues", title: "Issues", to: "/issues", icon: ListFilter },
  { id: "matrix", title: "Risk matrix", to: "/risk-matrix", icon: Grid2X2 },
];
export function WorkspaceSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(input.trim());
      setSelected(0);
    }, 180);
    return () => clearTimeout(timer);
  }, [input]);
  const query = useQuery<Page<Issue>, Error>({
    queryKey: ["signal", "search", term],
    queryFn: () =>
      api(`/issues?search=${encodeURIComponent(term)}&page_size=7`),
    enabled: open && !!term,
  });
  const searching = !!input.trim();
  const results = searching
    ? term === input.trim()
      ? query.data?.items || []
      : []
    : [];
  const destinations = searching
    ? results.map((issue) => ({ id: issue.id, to: `/issues/${issue.id}` }))
    : shortcuts;
  const active = destinations[selected];
  function close() {
    onOpenChange(false);
    setInput("");
    setTerm("");
    setSelected(0);
  }
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (value) onOpenChange(true);
        else close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="search-overlay" />
        <Dialog.Content className="search-dialog">
          <Dialog.Title className="sr-only">Search workspace</Dialog.Title>
          <Dialog.Description className="sr-only">
            Find an issue by title or reference, or open a workspace view.
          </Dialog.Description>
          <div className="search-dialog-bar">
            <div className="search-input-row">
              <Search size={19} />
              <input
                role="combobox"
                aria-label="Search issues"
                aria-autocomplete="list"
                aria-expanded="true"
                aria-controls="workspace-search-results"
                aria-activedescendant={
                  active ? `search-${active.id}` : undefined
                }
                placeholder="Search issues…"
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  setSelected(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelected((index) =>
                      destinations.length
                        ? (index +
                            (event.key === "ArrowDown"
                              ? 1
                              : destinations.length - 1)) %
                          destinations.length
                        : 0,
                    );
                  } else if (event.key === "Enter") {
                    event.preventDefault();
                    if (active) navigate(active.to);
                    else if (input.trim())
                      navigate(
                        `/issues?search=${encodeURIComponent(input.trim())}`,
                      );
                    else return;
                    close();
                  }
                }}
              />
              {searching && query.isFetching ? (
                <LoaderCircle size={16} className="spin" />
              ) : null}
            </div>
            <Dialog.Close className="icon-button" aria-label="Close search">
              <X size={18} />
            </Dialog.Close>
          </div>
          <div
            className="search-results"
            id="workspace-search-results"
            role="listbox"
            aria-label="Search results"
          >
            {!searching &&
              shortcuts.map((item, index) => (
                <Link
                  id={`search-${item.id}`}
                  key={item.id}
                  to={item.to}
                  role="option"
                  aria-selected={index === selected}
                  onMouseMove={() => setSelected(index)}
                  onClick={close}
                >
                  <item.icon size={18} />
                  <span>{item.title}</span>
                </Link>
              ))}
            {searching &&
              results.map((issue, index) => (
                <Link
                  id={`search-${issue.id}`}
                  to={`/issues/${issue.id}`}
                  key={issue.id}
                  role="option"
                  aria-selected={index === selected}
                  onMouseMove={() => setSelected(index)}
                  onClick={close}
                >
                  <div className="search-result-title">
                    <code>{issue.reference_code}</code>
                    <strong>{issue.title}</strong>
                    <small>{issue.project.name}</small>
                  </div>
                  {issue.risk && (
                    <RiskScore
                      score={issue.risk.score}
                      severity={issue.risk.severity}
                    />
                  )}
                </Link>
              ))}
          </div>
          {searching &&
            term === input.trim() &&
            !query.isFetching &&
            !results.length && (
              <p className="search-empty" role="status">
                {query.error
                  ? "Search unavailable. Try again."
                  : "No issues found."}
              </p>
            )}
          {searching && query.data && query.data.total > 7 && (
            <Link
              className="search-all"
              to={`/issues?search=${encodeURIComponent(term)}`}
              onClick={close}
            >
              View all {query.data.total} results
            </Link>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
