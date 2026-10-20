import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, Circle, LoaderCircle, X } from "lucide-react";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import type { User } from "../types";

export const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());
export const date = (value: string | null | undefined, time = false) =>
  value
    ? new Intl.DateTimeFormat(
        undefined,
        time
          ? {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }
          : { day: "numeric", month: "short", year: "numeric" },
      ).format(new Date(value.length === 10 ? value + "T12:00:00" : value))
    : "No due date";

export function Badge({ value }: { value: string }) {
  return (
    <span className={clsx("badge", value.toLowerCase())}>
      <span className="badge-dot" />
      {label(value)}
    </span>
  );
}
export function Avatar({
  user,
  small = false,
}: {
  user: User;
  small?: boolean;
}) {
  return (
    <span
      className={clsx("avatar", small && "small")}
      aria-label={user.full_name}
    >
      {user.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function Person({ user }: { user: User }) {
  return (
    <span className="person">
      <Avatar user={user} small />
      {user.full_name}
    </span>
  );
}
export function RiskScore({
  score,
  severity,
}: {
  score: number;
  severity: string;
}) {
  return (
    <span
      className={clsx("risk-score", severity.toLowerCase())}
      aria-label={`Risk ${score}, ${label(severity)}`}
    >
      {score}
      <span>/25</span>
    </span>
  );
}
export function State({
  loading,
  error,
  empty,
  children,
}: {
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  children?: ReactNode;
}) {
  if (loading)
    return (
      <div className="state" role="status">
        <LoaderCircle className="spin" size={22} />
        <p>Loading your workspace…</p>
      </div>
    );
  if (error)
    return (
      <div className="state error" role="alert">
        <AlertCircle size={24} />
        <h3>Unable to load this view</h3>
        <p>{error.message}</p>
        <button className="button secondary" onClick={() => location.reload()}>
          Try again
        </button>
      </div>
    );
  if (empty)
    return (
      <div className="state">
        <Circle size={24} />
        <h3>All clear here</h3>
        <p>No items match this view. Try adjusting your filters.</p>
      </div>
    );
  return children;
}
export function ErrorMessage({ error }: { error?: Error | null }) {
  return error ? (
    <div className="inline-error" role="alert">
      <AlertCircle size={16} />
      {error.message}
    </div>
  ) : null;
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className={clsx("modal", wide && "wide")}>
          <div className="modal-header">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description
                className={description ? undefined : "sr-only"}
              >
                {description || title}
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close dialog">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Progress({ value }: { value: number }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label="Mitigation progress"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}
