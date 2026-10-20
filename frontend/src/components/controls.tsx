import * as SelectPrimitive from "@radix-ui/react-select";
import * as Popover from "@radix-ui/react-popover";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { clsx } from "clsx";

export interface SelectOption {
  value: string;
  label: string;
  leading?: ReactNode;
}
const EMPTY = "__signal_empty__";

export function Select({
  label,
  value,
  onValueChange,
  options,
  className,
  placeholder = "Choose…",
  onBlur,
  inputRef,
  leading,
  disabled = false,
  iconOnly = false,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  placeholder?: string;
  onBlur?: () => void;
  inputRef?: Ref<HTMLButtonElement>;
  leading?: ReactNode;
  disabled?: boolean;
  iconOnly?: boolean;
}) {
  return (
    <SelectPrimitive.Root
      value={value || EMPTY}
      onValueChange={(v) => onValueChange(v === EMPTY ? "" : v)}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        ref={inputRef}
        onBlur={onBlur}
        aria-label={label}
        className={clsx(
          "select-trigger",
          className,
          iconOnly && "select-icon-only",
        )}
      >
        {leading && (
          <span className="select-leading" aria-hidden="true">
            {leading}
          </span>
        )}
        <span className={iconOnly ? "sr-only" : "select-value"}>
          <SelectPrimitive.Value placeholder={placeholder}>
            {options.find((o) => o.value === value)?.label || placeholder}
          </SelectPrimitive.Value>
        </span>
        <SelectPrimitive.Icon className="select-chevron">
          <ChevronDown size={14} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="select-menu"
          position="popper"
          sideOffset={6}
          collisionPadding={12}
        >
          <SelectPrimitive.ScrollUpButton className="select-scroll">
            <ChevronDown size={13} style={{ transform: "rotate(180deg)" }} />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="select-viewport">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value || EMPTY}
                value={option.value || EMPTY}
                className="select-option"
                textValue={option.label}
              >
                {option.leading && (
                  <span className="select-option-leading" aria-hidden="true">
                    {option.leading}
                  </span>
                )}
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="select-check">
                  <Check size={14} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="select-scroll">
            <ChevronDown size={13} />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export const TooltipProvider = Tooltip.Provider;
export function Hint({
  label,
  children,
  disabled = false,
  side = "top",
}: {
  label: string;
  children: ReactNode;
  disabled?: boolean;
  side?: "top" | "right" | "bottom" | "left";
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  return (
    <Tooltip.Root
      open={open && !disabled}
      onOpenChange={(value) => setOpen(value && !disabled)}
    >
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="tooltip" side={side} sideOffset={7}>
          {label}
          <Tooltip.Arrow className="tooltip-arrow" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function Checkbox({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className={clsx("checkbox-control", checked && "checked")}
      onClick={() => onCheckedChange(!checked)}
    >
      <span className="checkbox-box">
        {checked && <Check size={12} strokeWidth={2.2} />}
      </span>
      <span>{label}</span>
    </button>
  );
}

function iso(day: Date) {
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}
function parse(value: string) {
  return value ? new Date(value + "T12:00:00") : new Date();
}

export function DatePicker({
  label = "Due date",
  value,
  onValueChange,
  onBlur,
  inputRef,
}: {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  inputRef?: Ref<HTMLButtonElement>;
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(value || iso(new Date()));
  const calendarRef = useRef<HTMLDivElement>(null);
  function focusDate(key: string) {
    requestAnimationFrame(() =>
      calendarRef.current
        ?.querySelector<HTMLButtonElement>(`[data-date="${key}"]`)
        ?.focus(),
    );
  }
  const [month, setMonth] = useState(() => {
    const d = parse(value);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(start);
  gridStart.setDate(1 - ((start.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, index) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + index);
    return d;
  });
  const today = iso(new Date());
  const fullDate = (d: Date) =>
    new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  function choose(d: Date) {
    onValueChange(iso(d));
    setOpen(false);
  }
  function moveMonth(offset: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setFocused(iso(next));
  }
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          const d = parse(value);
          setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
          setFocused(iso(d));
        }
      }}
    >
      <Popover.Trigger asChild>
        <button
          ref={inputRef}
          type="button"
          aria-label={label}
          onBlur={onBlur}
          className={clsx("date-trigger", !value && "placeholder")}
        >
          <CalendarDays size={15} />
          <span>{value ? fullDate(parse(value)) : "Select date"}</span>
          <ChevronDown size={14} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="calendar-popover"
          sideOffset={7}
          align="start"
          collisionPadding={8}
          aria-label={`Choose ${label.toLowerCase()}`}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            focusDate(focused);
          }}
        >
          <div className="calendar-heading">
            <button
              type="button"
              className="icon-button"
              aria-label="Previous month"
              onClick={() => moveMonth(-1)}
            >
              <ChevronLeft size={17} />
            </button>
            <strong aria-live="polite">
              {new Intl.DateTimeFormat(undefined, {
                month: "long",
                year: "numeric",
              }).format(month)}
            </strong>
            <button
              type="button"
              className="icon-button"
              aria-label="Next month"
              onClick={() => moveMonth(1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="calendar-weekdays" aria-hidden="true">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div
            ref={calendarRef}
            className="calendar-grid"
            role="grid"
            aria-label="Calendar"
          >
            {Array.from({ length: 6 }, (_, week) => (
              <div role="row" key={week}>
                {days.slice(week * 7, week * 7 + 7).map((d) => (
                  <div
                    role="gridcell"
                    key={iso(d)}
                    aria-selected={value === iso(d)}
                  >
                    <button
                      type="button"
                      data-date={iso(d)}
                      tabIndex={focused === iso(d) ? 0 : -1}
                      onFocus={() => setFocused(iso(d))}
                      aria-label={fullDate(d)}
                      aria-current={iso(d) === today ? "date" : undefined}
                      className={clsx(
                        "calendar-day",
                        d.getMonth() !== month.getMonth() && "outside",
                        value === iso(d) && "selected",
                        iso(d) === today && "today",
                      )}
                      onClick={() => choose(d)}
                      onKeyDown={(event) => {
                        const offsets: Record<string, number> = {
                          ArrowLeft: -1,
                          ArrowRight: 1,
                          ArrowUp: -7,
                          ArrowDown: 7,
                        };
                        const next = new Date(d);
                        if (event.key in offsets)
                          next.setDate(d.getDate() + offsets[event.key]);
                        else if (event.key === "Home")
                          next.setDate(d.getDate() - ((d.getDay() + 6) % 7));
                        else if (event.key === "End")
                          next.setDate(
                            d.getDate() + 6 - ((d.getDay() + 6) % 7),
                          );
                        else if (
                          event.key === "PageUp" ||
                          event.key === "PageDown"
                        ) {
                          const offset = event.key === "PageUp" ? -1 : 1;
                          next.setDate(1);
                          next.setMonth(next.getMonth() + offset);
                          next.setDate(
                            Math.min(
                              d.getDate(),
                              new Date(
                                next.getFullYear(),
                                next.getMonth() + 1,
                                0,
                              ).getDate(),
                            ),
                          );
                        } else return;
                        event.preventDefault();
                        setFocused(iso(next));
                        if (
                          next.getMonth() !== month.getMonth() ||
                          next.getFullYear() !== month.getFullYear()
                        )
                          setMonth(
                            new Date(next.getFullYear(), next.getMonth(), 1),
                          );
                        focusDate(iso(next));
                      }}
                    >
                      {d.getDate()}
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="calendar-footer">
            <button
              type="button"
              className="text-button"
              onClick={() => choose(new Date())}
            >
              Today
            </button>
            <button
              type="button"
              className="text-button"
              disabled={!value}
              onClick={() => {
                onValueChange("");
                setOpen(false);
              }}
            >
              <X size={12} />
              Clear
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
