import { useState } from "react";
import { ListFilter, RotateCcw, Trash2 } from "lucide-react";
import { useChange } from "../api";
import { Hint } from "./controls";
import { ErrorMessage, Modal } from "./ui";

export function DeletedView({
  kind,
  deleted,
  onClick,
}: {
  kind: "issues" | "actions";
  deleted: boolean;
  onClick: () => void;
}) {
  const name = `Show ${deleted ? "current" : "deleted"} ${kind}`;
  return (
    <Hint label={name}>
      <button
        className="button secondary deleted-view-button"
        aria-label={name}
        aria-pressed={deleted}
        onClick={onClick}
      >
        {deleted ? <ListFilter size={17} /> : <Trash2 size={17} />}
        <span>{deleted ? `Current ${kind}` : `Deleted ${kind}`}</span>
      </button>
    </Hint>
  );
}

export function Removal({
  kind,
  id,
  version,
  title,
  restore = false,
  onDone,
}: {
  kind: "issue" | "action";
  id: string;
  version: number;
  title: string;
  restore?: boolean;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const change = useChange(() => {
    setOpen(false);
    onDone?.();
  });
  const name = `${restore ? "Restore" : "Delete"} ${kind}`;
  const mutate = () =>
    change.mutate({
      path: `/${kind === "issue" ? "issues" : "actions"}/${id}${restore ? "/restore" : ""}`,
      method: restore ? "POST" : "DELETE",
      data: { expected_version: version },
    });
  return (
    <div className="removal-control">
      <Hint label={name}>
        <button
          className="button secondary removal-button"
          aria-label={name}
          disabled={change.isPending}
          onClick={() => {
            change.reset();
            if (restore) mutate();
            else setOpen(true);
          }}
        >
          {restore ? (
            <>
              <RotateCcw size={16} />
              Restore
            </>
          ) : (
            <>
              <Trash2 size={17} />
              <span>Delete</span>
            </>
          )}
        </button>
      </Hint>
      {!open && <ErrorMessage error={change.error} />}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Delete ${kind}?`}
        description={title}
      >
        <div className="form">
          <p className="muted">
            Move this {kind} to Deleted. Its history is kept and it can be
            restored.
          </p>
          <ErrorMessage error={change.error} />
          <div className="form-footer">
            <button className="button secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="button primary"
              disabled={change.isPending}
              onClick={mutate}
            >
              {change.isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
