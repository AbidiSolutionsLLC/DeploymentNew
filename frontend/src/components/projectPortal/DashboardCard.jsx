import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  FolderIcon,
  TrashIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { getInitials } from "../../utils/tableUtils";
import { personName, projectProgress, shortDate } from "./helpers";

const CARD_META = {
  activeProjects: {
    title: "Active Projects",
    sub: "Ongoing work & status",
    icon: FolderIcon,
    tone: "amber",
    viewAllPath: "/project/projects",
  },
  taskPriorities: {
    title: "Task Priorities",
    icon: ClockIcon,
    tone: "rose",
  },
  openTasks: {
    title: "Open Tasks",
    sub: "Assigned to you",
    icon: ClipboardDocumentCheckIcon,
    tone: "sky",
  },
  upcomingDeadlines: {
    title: "Upcoming Deadlines",
    sub: "Next tasks due",
    icon: CalendarDaysIcon,
    tone: "violet",
    className: "xl:col-span-2",
  },
  teamMembers: {
    title: "Team Members",
    icon: UsersIcon,
    tone: "amber",
  },
};

const ICON_TONES = {
  amber:
    "border-amber-100 bg-amber-50 text-amber-500 dark:border-[rgba(251,191,36,0.3)] dark:bg-[rgba(251,191,36,0.1)] dark:text-[#FBBF24]",
  rose:
    "border-rose-100 bg-rose-50 text-rose-500 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400",
  sky:
    "border-sky-100 bg-sky-50 text-sky-500 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-400",
  violet:
    "border-violet-100 bg-violet-50 text-violet-500 dark:border-violet-900/40 dark:bg-violet-900/20 dark:text-violet-400",
};

const STATUS_TONES = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  done: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  planning:
    "border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  progress:
    "border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  todo: "border-teal-200 bg-teal-50 text-teal-600 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  review:
    "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  hold: "border-amber-200 bg-amber-50 text-brand-text dark:border-[rgba(251,191,36,0.35)] dark:bg-[rgba(251,191,36,0.12)] dark:text-[#FBBF24]",
  blocked:
    "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  cancelled:
    "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  default:
    "border-border-subtle bg-app text-muted",
};

const statusKey = (value) =>
  String(value || "Todo").toLowerCase().replace(/[\s_-]+/g, "");

const statusLabel = (value) => {
  const raw = String(value || "Todo").trim();
  const key = statusKey(raw);
  if (key === "todo") return "To Do";
  if (key === "inprogress") return "In Progress";
  if (key === "inreview") return "In Review";
  if (key === "onhold") return "On Hold";
  return raw;
};

const StatusPill = ({ value }) => {
  const key = statusKey(value);
  const tone =
    STATUS_TONES[key] ||
    STATUS_TONES[
      key.includes("progress")
        ? "progress"
        : key.includes("review")
        ? "review"
        : key.includes("hold")
        ? "hold"
        : ""
    ] ||
    STATUS_TONES.default;

  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${tone}`}
    >
      {statusLabel(value)}
    </span>
  );
};

const progressTone = (status) => {
  const key = statusKey(status);
  if (key === "planning") return "bg-gradient-to-r from-sky-400 to-sky-500";
  if (key === "onhold") return "bg-gradient-to-r from-amber-400 to-amber-500";
  if (key === "completed") return "bg-gradient-to-r from-emerald-400 to-emerald-500";
  return "bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500";
};

const AVATAR_TONES = [
  "bg-amber-100 text-amber-700 dark:bg-[rgba(251,191,36,0.18)] dark:text-[#FBBF24]",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
];

const MemberAvatar = ({ name, index = 0 }) => (
  <span
    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold ${
      AVATAR_TONES[index % AVATAR_TONES.length]
    }`}
  >
    {getInitials(name)}
  </span>
);

const EmptyRow = ({ children }) => (
  <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-xs font-medium text-muted">
    {children}
  </div>
);

const ViewAllButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-brand-text transition-colors hover:text-brand-accent"
  >
    View all
    <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
  </button>
);

function ActiveProjectsCard({ projects }) {
  const items = projects.slice(0, 3);

  if (items.length === 0) {
    return <EmptyRow>No active projects yet.</EmptyRow>;
  }

  return (
    <ul className="flex flex-col">
      {items.map((p, i) => {
        const pct = projectProgress(p);
        return (
          <li
            key={p._id || i}
            className={`${
              i > 0 ? "border-t border-border-subtle" : ""
            } py-3.5 first:pt-0 last:pb-0`}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-100 bg-amber-50 text-amber-500 dark:border-[rgba(251,191,36,0.3)] dark:bg-[rgba(251,191,36,0.1)] dark:text-[#FBBF24]">
                <FolderIcon className="h-[18px] w-[18px]" />
              </span>
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-heading">
                {p.title}
              </p>
              <StatusPill value={p.status || "Planning"} />
            </div>

            <div className="mt-2.5 flex items-center gap-3 pl-12">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-border-subtle">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressTone(p.status)}`}
                  style={{ width: `${Math.max(Math.min(pct, 100), 2)}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-[11px] font-semibold text-muted tabular-nums">
                {pct}%
              </span>
              <span className="shrink-0 whitespace-nowrap border-l border-border-subtle pl-3 text-[11px] font-medium text-muted">
                Due {shortDate(p.dueDate)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PriorityDonut({ rows, total }) {
  const sum = rows.reduce((acc, row) => acc + (row.count || 0), 0);
  let cursor = 0;
  const segments = rows
    .map((row) => {
      const start = sum > 0 ? (cursor / sum) * 100 : 0;
      cursor += row.count || 0;
      const end = sum > 0 ? (cursor / sum) * 100 : 0;
      return `${row.hex} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div
      className="relative h-28 w-28 shrink-0 rounded-full"
      style={{
        background: sum
          ? `conic-gradient(from -90deg, ${segments})`
          : "conic-gradient(#E2E8F0 0% 100%)",
      }}
      role="img"
      aria-label="Task priority distribution"
    >
      <div className="absolute inset-[15px] rounded-full bg-surface" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black leading-none text-heading tabular-nums">
          {total}
        </span>
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">
          Total Tasks
        </span>
      </div>
    </div>
  );
}

function TaskPrioritiesCard({ data }) {
  const tasks = data.recentTasks || [];
  const priorities = data.taskPriorities || {
    high: tasks.filter((t) => t.priority === "High").length,
    medium: tasks.filter((t) => t.priority === "Medium" || !t.priority).length,
    low: tasks.filter((t) => t.priority === "Low").length,
    total: data.openTasks ?? tasks.length,
  };

  const total = priorities.total || 0;
  const rows = [
    { key: "high", label: "High", count: priorities.high || 0, dot: "bg-rose-500", hex: "#EF4444" },
    { key: "medium", label: "Medium", count: priorities.medium || 0, dot: "bg-amber-400", hex: "#F59E0B" },
    { key: "low", label: "Low", count: priorities.low || 0, dot: "bg-slate-400", hex: "#94A3B8" },
  ];

  return (
    <div className="flex flex-1 items-center gap-5">
      <PriorityDonut rows={rows} total={total} />

      <ul className="min-w-0 flex-1 divide-y divide-border-subtle">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.dot}`} />
            <p className="min-w-0 flex-1 truncate text-xs font-semibold text-heading">
              {row.label}
            </p>
            <span className="shrink-0 text-sm font-bold text-heading tabular-nums">
              {row.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpenTasksCard({ tasks }) {
  const items = tasks.slice(0, 3);

  if (items.length === 0) {
    return <EmptyRow>No open tasks assigned to you.</EmptyRow>;
  }

  return (
    <ul className="flex flex-col">
      {items.map((t, i) => (
        <li
          key={t._id || i}
          className={`${
            i > 0 ? "border-t border-border-subtle" : ""
          } flex items-center gap-3 py-3.5 first:pt-0 last:pb-0`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-100 bg-amber-50 text-amber-500 dark:border-[rgba(251,191,36,0.3)] dark:bg-[rgba(251,191,36,0.1)] dark:text-[#FBBF24]">
            <ClipboardDocumentCheckIcon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-heading">{t.title}</p>
            <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wider text-muted">
              {t.project?.title || "No project"}
            </p>
          </div>
          <StatusPill value={t.status || "Todo"} />
        </li>
      ))}
    </ul>
  );
}

function UpcomingDeadlinesCard({ deadlines }) {
  const items = deadlines.slice(0, 3);

  if (items.length === 0) {
    return <EmptyRow>No upcoming deadlines.</EmptyRow>;
  }

  return (
    <ul className="flex flex-col">
      {items.map((dl, i) => {
        const date = new Date(dl.dueDate);
        const valid = !Number.isNaN(date.getTime());
        return (
          <li
            key={i}
            className={`${
              i > 0 ? "border-t border-border-subtle" : ""
            } flex items-center gap-3 py-3 first:pt-0 last:pb-0`}
          >
            <div className="flex w-12 shrink-0 flex-col items-center rounded-xl border border-violet-100 bg-violet-50 py-1.5 dark:border-violet-900/40 dark:bg-violet-900/20">
              <span className="text-[9px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-300">
                {valid ? date.toLocaleDateString(undefined, { month: "short" }) : "—"}
              </span>
              <span className="text-base font-black leading-tight text-heading">
                {valid ? date.getDate() : "?"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-heading">{dl.task}</p>
              <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wider text-muted">
                {dl.project}
              </p>
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
          </li>
        );
      })}
    </ul>
  );
}

function TeamMembersCard({ team }) {
  const items = team.slice(0, 3);

  if (items.length === 0) {
    return <EmptyRow>No team members yet.</EmptyRow>;
  }

  return (
    <ul className="flex flex-col">
      {items.map((member, i) => {
        const name = personName(member);
        return (
          <li
            key={member._id || i}
            className={`${
              i > 0 ? "border-t border-border-subtle" : ""
            } flex items-center gap-3 py-3 first:pt-0 last:pb-0`}
          >
            <MemberAvatar name={name} index={i} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-heading">{name}</p>
              <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wider text-muted">
                {member.role || "Member"}
              </p>
            </div>
            <EllipsisVerticalIcon className="h-4 w-4 shrink-0 text-muted" />
          </li>
        );
      })}
    </ul>
  );
}

export default function DashboardCard({ card, data, onDelete }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const meta = CARD_META[card?.type];

  if (!meta) return null;

  const Icon = meta.icon;
  const tasks = data.recentTasks || [];
  const deadlines = data.upcomingDeadlines || [];
  const team = data.teamMembers || [];
  const priorities = data.taskPriorities || {};
  const priorityTotal = priorities.total || 0;

  let sub = meta.sub;
  if (card.type === "taskPriorities") {
    sub = `${priorities.high || 0} high · ${priorityTotal} open`;
  } else if (card.type === "teamMembers") {
    sub = `${team.length} people across your projects`;
  }

  let content = null;
  switch (card.type) {
    case "activeProjects":
      content = <ActiveProjectsCard projects={data.recentProjects || []} />;
      break;
    case "taskPriorities":
      content = <TaskPrioritiesCard data={data} />;
      break;
    case "openTasks":
      content = <OpenTasksCard tasks={tasks} />;
      break;
    case "upcomingDeadlines":
      content = <UpcomingDeadlinesCard deadlines={deadlines} />;
      break;
    case "teamMembers":
      content = <TeamMembersCard team={team} />;
      break;
    default:
      return null;
  }

  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border border-border-subtle bg-surface shadow-[0_10px_30px_-18px_rgba(15,23,42,0.18)] transition-shadow duration-300 hover:shadow-[0_18px_42px_-22px_rgba(15,23,42,0.28)] ${
        meta.className || ""
      }`}
    >
<div className="flex items-start gap-3 px-5 pt-5">
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${ICON_TONES[meta.tone]}`}
          >
            <Icon className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-bold leading-tight text-heading">
              {meta.title}
            </h3>
            {sub ? (
              <p className="mt-1 truncate text-xs font-medium text-muted">{sub}</p>
            ) : null}
          </div>

          <hr className="my-4 border-border-subtle opacity-40" />

          <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
          {meta.viewAllPath ? (
            <ViewAllButton onClick={() => navigate(meta.viewAllPath)} />
          ) : null}

          {onDelete ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="rounded-lg p-1 text-muted transition-colors hover:bg-card-hover hover:text-main"
                aria-label="Card options"
              >
                <EllipsisVerticalIcon className="h-4 w-4" />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-full z-50 mt-1 w-32 overflow-hidden rounded-xl border border-border-subtle bg-surface py-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(card.id);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center px-3 py-2 text-[10px] font-semibold text-danger hover:bg-danger-bg"
                  >
                    <TrashIcon className="mr-2 h-3 w-3" />
                    Delete Card
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5">{content}</div>
    </div>
  );
}
