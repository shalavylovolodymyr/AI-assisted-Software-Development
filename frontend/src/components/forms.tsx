import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import {
  Controller,
  useForm,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Select, DatePicker, type SelectOption } from "./controls";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useChange } from "../api";
import { useWorkspace } from "../Workspace";
import type { Detail, Issue } from "../types";
import { ErrorMessage, label, Modal } from "./ui";

function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  numeric = false,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: SelectOption[];
  numeric?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select
          label={label}
          value={String(field.value ?? "")}
          onValueChange={(value) =>
            field.onChange(numeric ? Number(value) : value)
          }
          onBlur={field.onBlur}
          inputRef={field.ref}
          options={options}
        />
      )}
    />
  );
}
function FormDate<T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>;
  name: Path<T>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <DatePicker
          value={field.value || ""}
          onValueChange={field.onChange}
          onBlur={field.onBlur}
          inputRef={field.ref}
        />
      )}
    />
  );
}

export const issueSchema = z.object({
  title: z.string().trim().min(1, "Enter an issue title.").max(180),
  description: z.string().trim().min(1, "Describe the issue.").max(10000),
  project_id: z.string().uuid("Choose a project."),
  assignee_id: z.string().uuid("Choose an owner."),
  category: z.enum([
    "SECURITY",
    "OPERATIONS",
    "COMPLIANCE",
    "TECHNOLOGY",
    "CUSTOMER",
    "OTHER",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  due_date: z.string(),
  likelihood: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  rationale: z
    .string()
    .trim()
    .min(1, "Explain the risk evaluation.")
    .max(10000),
});
type IssueValues = z.infer<typeof issueSchema>;
export const riskSchema = issueSchema.pick({
  likelihood: true,
  impact: true,
  rationale: true,
});
type RiskValues = z.infer<typeof riskSchema>;
const severity = (score: number) =>
  score <= 4
    ? "LOW"
    : score <= 9
      ? "MODERATE"
      : score <= 16
        ? "HIGH"
        : "CRITICAL";

function Submit({
  pending,
  text = "Save changes",
}: {
  pending: boolean;
  text?: string;
}) {
  return (
    <button className="button primary" type="submit" disabled={pending}>
      {pending ? (
        <LoaderCircle className="spin" size={16} />
      ) : (
        <ArrowRight size={16} />
      )}
      {pending ? "Saving…" : text}
    </button>
  );
}
function FieldError({ text }: { text?: string }) {
  return text ? (
    <span className="field-error" role="alert">
      {text}
    </span>
  ) : null;
}

export function IssueForm({ onClose }: { onClose: () => void }) {
  const { users, projects, user } = useWorkspace();
  const navigate = useNavigate();
  const change = useChange();
  const form = useForm<IssueValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      title: "",
      description: "",
      project_id: projects[0]?.id ?? "",
      assignee_id: user?.id ?? users[0]?.id ?? "",
      category: "OPERATIONS",
      priority: "HIGH",
      due_date: "",
      likelihood: 4,
      impact: 4,
      rationale: "",
    },
  });
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;
  const score = (watch("likelihood") || 0) * (watch("impact") || 0);
  async function submit(values: IssueValues) {
    try {
      const result = (await change.mutateAsync({
        path: "/issues",
        data: { ...values, due_date: values.due_date || null },
      })) as Issue;
      onClose();
      navigate(`/issues/${result.id}`);
    } catch {
      /* Render the server error below. */
    }
  }
  return (
    <form onSubmit={handleSubmit(submit)} className="form" noValidate>
      <label>
        Issue title
        <input
          autoFocus
          placeholder="What needs attention?"
          {...register("title")}
        />
        <FieldError text={errors.title?.message} />
      </label>
      <label>
        Description
        <textarea
          rows={3}
          placeholder="Describe the context, impact, and what you know."
          {...register("description")}
        />
        <FieldError text={errors.description?.message} />
      </label>
      <div className="form-grid">
        <label>
          Project
          <FormSelect
            control={control}
            name="project_id"
            label="Project"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
          <FieldError text={errors.project_id?.message} />
        </label>
        <label>
          Accountable owner
          <FormSelect
            control={control}
            name="assignee_id"
            label="Accountable owner"
            options={users.map((u) => ({ value: u.id, label: u.full_name }))}
          />
        </label>
        <label>
          Category
          <FormSelect
            control={control}
            name="category"
            label="Category"
            options={issueSchema.shape.category.options.map((v) => ({
              value: v,
              label: label(v),
            }))}
          />
        </label>
        <label>
          Priority
          <FormSelect
            control={control}
            name="priority"
            label="Priority"
            options={issueSchema.shape.priority.options.map((v) => ({
              value: v,
              label: label(v),
            }))}
          />
        </label>
        <label>
          Due date
          <FormDate control={control} name="due_date" />
        </label>
      </div>
      <div className="form-section">
        <ShieldCheck size={17} />
        <h3>Initial risk assessment</h3>
      </div>
      <div className="form-grid">
        <label>
          Likelihood
          <FormSelect
            control={control}
            name="likelihood"
            label="Likelihood"
            options={[
              "Rare",
              "Unlikely",
              "Possible",
              "Likely",
              "Almost certain",
            ].map((word, i) => ({
              value: String(i + 1),
              label: `${i + 1} · ${word}`,
            }))}
            numeric
          />
        </label>
        <label>
          Impact
          <FormSelect
            control={control}
            name="impact"
            label="Impact"
            options={["Negligible", "Minor", "Moderate", "Major", "Severe"].map(
              (word, i) => ({
                value: String(i + 1),
                label: `${i + 1} · ${word}`,
              }),
            )}
            numeric
          />
        </label>
      </div>
      <div className={`risk-preview ${severity(score).toLowerCase()}`}>
        <span>Estimated risk</span>
        <strong>
          {score}
          <small>/25</small>
        </strong>
        <span>{label(severity(score))}</span>
      </div>
      <label>
        Risk rationale
        <textarea
          rows={2}
          placeholder="Why did you choose these ratings?"
          {...register("rationale")}
        />
        <FieldError text={errors.rationale?.message} />
      </label>
      <ErrorMessage error={change.error} />
      <div className="form-footer">
        <button type="button" className="button secondary" onClick={onClose}>
          Cancel
        </button>
        <Submit pending={change.isPending} text="Create issue" />
      </div>
    </form>
  );
}

export function RiskForm({
  issue,
  onClose,
}: {
  issue: Detail;
  onClose: () => void;
}) {
  const change = useChange(() => {
    onClose();
  });
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RiskValues>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      likelihood: issue.risk?.likelihood || 3,
      impact: issue.risk?.impact || 3,
      rationale: "",
    },
  });
  const score = watch("likelihood") * watch("impact");
  return (
    <form
      className="form"
      onSubmit={handleSubmit((v) =>
        change.mutate({
          path: `/issues/${issue.id}/risk-assessments`,
          data: { ...v, expected_version: issue.version },
        }),
      )}
    >
      <div className="form-grid">
        <label>
          Likelihood
          <FormSelect
            control={control}
            name="likelihood"
            label="Likelihood"
            options={[
              "Rare",
              "Unlikely",
              "Possible",
              "Likely",
              "Almost certain",
            ].map((word, i) => ({
              value: String(i + 1),
              label: `${i + 1} · ${word}`,
            }))}
            numeric
          />
        </label>
        <label>
          Impact
          <FormSelect
            control={control}
            name="impact"
            label="Impact"
            options={["Negligible", "Minor", "Moderate", "Major", "Severe"].map(
              (word, i) => ({
                value: String(i + 1),
                label: `${i + 1} · ${word}`,
              }),
            )}
            numeric
          />
        </label>
      </div>
      <div className={`risk-preview ${severity(score).toLowerCase()}`}>
        <span>New risk score</span>
        <strong>
          {score}
          <small>/25</small>
        </strong>
        <span>{label(severity(score))}</span>
      </div>
      <label>
        Rationale
        <textarea
          autoFocus
          rows={4}
          placeholder="What changed, and how was it verified?"
          {...register("rationale")}
        />
        <FieldError text={errors.rationale?.message} />
      </label>

      <ErrorMessage error={change.error} />
      <div className="form-footer">
        <Submit pending={change.isPending} text="Record assessment" />
      </div>
    </form>
  );
}

const actionSchema = z.object({
  title: z.string().trim().min(1, "Enter an action title.").max(180),
  description: z.string().trim().min(1, "Describe the action."),
  owner_id: z.string().uuid(),
  due_date: z.string().min(1, "Choose a due date."),
});
export function ActionForm({
  issue,
  onClose,
}: {
  issue: Detail;
  onClose: () => void;
}) {
  const { users, user } = useWorkspace();
  const change = useChange(() => {
    onClose();
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof actionSchema>>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      owner_id: user?.id,
      title: "",
      description: "",
      due_date: "",
    },
  });
  return (
    <form
      className="form"
      onSubmit={handleSubmit((v) =>
        change.mutate({
          path: `/issues/${issue.id}/actions`,
          data: { ...v, expected_version: issue.version },
        }),
      )}
    >
      <label>
        Action title
        <input
          autoFocus
          placeholder="Define a concrete next step"
          {...register("title")}
        />
        <FieldError text={errors.title?.message} />
      </label>
      <label>
        Description
        <textarea rows={3} {...register("description")} />
        <FieldError text={errors.description?.message} />
      </label>
      <div className="form-grid">
        <label>
          Action owner
          <FormSelect
            control={control}
            name="owner_id"
            label="Action owner"
            options={users.map((u) => ({ value: u.id, label: u.full_name }))}
          />
        </label>
        <label>
          Due date
          <FormDate control={control} name="due_date" />
          <FieldError text={errors.due_date?.message} />
        </label>
      </div>
      <ErrorMessage error={change.error} />
      <div className="form-footer">
        <Submit pending={change.isPending} text="Add action" />
      </div>
    </form>
  );
}

const editSchema = issueSchema.pick({
  title: true,
  description: true,
  assignee_id: true,
  category: true,
  priority: true,
  due_date: true,
});
export function EditForm({
  issue,
  onClose,
}: {
  issue: Detail;
  onClose: () => void;
}) {
  const { users } = useWorkspace();
  const change = useChange(() => {
    onClose();
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: issue.title,
      description: issue.description,
      assignee_id: issue.assignee_id,
      category: issue.category,
      priority: issue.priority,
      due_date: issue.due_date || "",
    },
  });
  return (
    <form
      className="form"
      onSubmit={handleSubmit((v) =>
        change.mutate({
          path: `/issues/${issue.id}`,
          method: "PATCH",
          data: {
            ...v,
            due_date: v.due_date || null,
            expected_version: issue.version,
          },
        }),
      )}
    >
      <label>
        Issue title
        <input autoFocus {...register("title")} />
        <FieldError text={errors.title?.message} />
      </label>
      <label>
        Description
        <textarea rows={4} {...register("description")} />
        <FieldError text={errors.description?.message} />
      </label>
      <div className="form-grid">
        <label>
          Assignee
          <FormSelect
            control={control}
            name="assignee_id"
            label="Accountable owner"
            options={users.map((u) => ({ value: u.id, label: u.full_name }))}
          />
        </label>
        <label>
          Priority
          <FormSelect
            control={control}
            name="priority"
            label="Priority"
            options={issueSchema.shape.priority.options.map((v) => ({
              value: v,
              label: label(v),
            }))}
          />
        </label>
        <label>
          Category
          <FormSelect
            control={control}
            name="category"
            label="Category"
            options={issueSchema.shape.category.options.map((v) => ({
              value: v,
              label: label(v),
            }))}
          />
        </label>
        <label>
          Due date
          <FormDate control={control} name="due_date" />
        </label>
      </div>
      <ErrorMessage error={change.error} />
      <div className="form-footer">
        <Submit pending={change.isPending} />
      </div>
    </form>
  );
}

export function CreateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create an issue"
      description=""
      wide
    >
      <IssueForm onClose={onClose} />
    </Modal>
  );
}
