import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiFolder,
  FiPieChart,
  FiCheckSquare,
  FiCalendar,
  FiUsers,
  FiArrowRight,
  FiChevronRight,
} from "react-icons/fi";
import HomeCardShell from "../home/HomeCardShell";
import EmptyCardState from "../home/EmptyCardState";
import { getInitials } from "../../utils/tableUtils";
import { personName, projectProgress, shortDate } from "./helpers";

const CARD_META = {
  activeProjects: {
    title: "Active Projects",
    sub: "Ongoing work & status",
    icon: FiFolder,
    accent: "#F59E0B",
    viewAllPath: "/project/projects",
  },
  taskPriorities: {
    title: "Task Priorities",
    icon: FiPieChart,
    accent: "#F43F5E",
  },
  openTasks: {
    title: "Open Tasks",
    sub: "Assigned to you",
    icon: FiCheckSquare,
    accent: "#0EA5E9",
  },
  upcomingDeadlines: {
    title: "Upcoming Deadlines",
    sub: "Next tasks due",
    icon: FiCalendar,
    accent: "#8B5CF6",
    className: "xl:col-span-2",
  },
  teamMembers: {
    title: "Team Members",
    icon: FiUsers,
    accent: "#10B981",
  },
};

const STATUS_TONES = {
  active: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  done: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  planning: "border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  progress: "border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  todo: "border-teal-500/25 bg-teal-500/10 text-teal-600 dark:text-teal-400",
  review: "border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  hold: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  blocked: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  cancelled: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  default: "border-border-subtle bg-app text-muted",
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
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone}`}
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
  "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25",
  "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25",
];

const MemberAvatar = ({ name, index = 0 }) => (
  <span
    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-black ${
      AVATAR_TONES[index % AVATAR_TONES.length]
    }`}
  >
    {getInitials(name)}
  </span>
);

const ViewAllButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-bold text-brand-text transition-colors hover:text-brand-accent px-2 py-1 rounded-lg hover:bg-brand/10 shrink-0"
  >
    View all
    <FiArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
  </button>
);

function ActiveProjectsCard({ projects }) {
  const items = projects.slice(0, 3);

  if (items.length === 0) {
    return (
      <EmptyCardState
        message="No active projects yet"
        description="Your ongoing projects will appear here."
      />
    );
  }

  return (
    <ul className="space-y-2.5 flex-1 min-h-0">
      {items.map((p, i) => {
        const pct = projectProgress(p);
        return (
          <li
            key={p._id || i}
            className="bg-app rounded-xl p-2.5 border border-border-subtle/60 flex flex-col gap-2 hover:border-amber-500/30 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <FiFolder className="h-3.5 w-3.5" />
              </span>
              <p className="min-w-0 flex-1 truncate text-xs font-bold text-heading">
                {p.title}
              </p>
              <StatusPill value={p.status || "Planning"} />
            </div>

            <div className="flex items-center gap-2.5 pl-9">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface border border-border-subtle/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressTone(p.status)}`}
                  style={{ width: `${Math.max(Math.min(pct, 100), 2)}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-[10px] font-bold text-muted tabular-nums">
                {pct}%
              </span>
              <span className="shrink-0 whitespace-nowrap border-l border-border-subtle pl-2.5 text-[10px] font-semibold text-muted">
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
      className="relative h-24 w-24 shrink-0 rounded-full"
      style={{
        background: sum
          ? `conic-gradient(from -90deg, ${segments})`
          : "conic-gradient(#E2E8F0 0% 100%)",
      }}
      role="img"
      aria-label="Task priority distribution"
    >
      <div className="absolute inset-[13px] rounded-full bg-app flex flex-col items-center justify-center border border-border-subtle/50 shadow-inner">
        <span className="text-lg font-black leading-none text-heading tabular-nums">
          {total}
        </span>
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-muted">
          Tasks
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
    <div className="bg-app rounded-xl p-3 border border-border-subtle/60 flex flex-1 items-center gap-4">
      <PriorityDonut rows={rows} total={total} />

      <ul className="min-w-0 flex-1 space-y-2">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center justify-between gap-2 bg-surface/70 rounded-lg px-2.5 py-1.5 border border-border-subtle/40"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.dot}`} />
              <span className="truncate text-xs font-semibold text-main">
                {row.label}
              </span>
            </div>
            <span className="shrink-0 text-xs font-bold text-heading tabular-nums px-1.5 py-0.5 rounded bg-app border border-border-subtle/40">
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
    return (
      <EmptyCardState
        message="No open tasks"
        description="Tasks assigned to you will appear here."
      />
    );
  }

  return (
    <ul className="space-y-2 flex-1 min-h-0">
      {items.map((t, i) => (
        <li
          key={t._id || i}
          className="bg-app rounded-xl p-2.5 border border-border-subtle/60 flex items-center gap-2.5 hover:border-sky-500/30 transition-all"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20">
            <FiCheckSquare className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-heading">{t.title}</p>
            <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-wider text-muted">
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
    return (
      <EmptyCardState
        message="No upcoming deadlines"
        description="Deadlines will appear here as tasks approach due dates."
      />
    );
  }

  return (
    <ul className="space-y-2 flex-1 min-h-0">
      {items.map((dl, i) => {
        const date = new Date(dl.dueDate);
        const valid = !Number.isNaN(date.getTime());
        return (
          <li
            key={i}
            className="bg-app rounded-xl p-2.5 border border-border-subtle/60 flex items-center gap-3 hover:border-violet-500/30 transition-all"
          >
            <div className="flex w-10 shrink-0 flex-col items-center rounded-lg border border-violet-500/20 bg-violet-500/10 py-1">
              <span className="text-[8px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-300">
                {valid ? date.toLocaleDateString(undefined, { month: "short" }) : "—"}
              </span>
              <span className="text-sm font-black leading-tight text-heading">
                {valid ? date.getDate() : "?"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-heading">{dl.task}</p>
              <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-wider text-muted">
                {dl.project}
              </p>
            </div>
            <FiChevronRight className="h-4 w-4 shrink-0 text-muted/50" />
          </li>
        );
      })}
    </ul>
  );
}

function TeamMembersCard({ team }) {
  const items = team.slice(0, 3);

  if (items.length === 0) {
    return (
      <EmptyCardState
        message="No team members yet"
        description="Team members on your projects will appear here."
      />
    );
  }

  return (
    <ul className="space-y-2 flex-1 min-h-0">
      {items.map((member, i) => {
        const name = personName(member);
        return (
          <li
            key={member._id || i}
            className="bg-app rounded-xl p-2.5 border border-border-subtle/60 flex items-center gap-2.5 hover:border-emerald-500/30 transition-all"
          >
            <MemberAvatar name={name} index={i} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-heading">{name}</p>
              <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-wider text-muted">
                {member.role || "Member"}
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active" />
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

  // Close card menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!meta) return null;

  const tasks = data?.recentTasks || [];
  const deadlines = data?.upcomingDeadlines || [];
  const team = data?.teamMembers || [];
  const priorities = data?.taskPriorities || {};
  const priorityTotal = priorities.total || 0;

  let sub = meta.sub;
  if (card?.type === "taskPriorities") {
    sub = `${priorities.high || 0} high · ${priorityTotal} open`;
  } else if (card?.type === "teamMembers") {
    sub = `${team.length} people across your projects`;
  }

  let content = null;
  switch (card?.type) {
    case "activeProjects":
      content = <ActiveProjectsCard projects={data?.recentProjects || []} />;
      break;
    case "taskPriorities":
      content = <TaskPrioritiesCard data={data || {}} />;
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
    <HomeCardShell
      title={meta.title}
      sub={sub}
      icon={meta.icon}
      accent={meta.accent}
      className={meta.className || ""}
      onDelete={onDelete ? () => onDelete(card.id) : undefined}
      menuRef={menuRef}
      menuOpen={menuOpen}
      onToggleMenu={() => setMenuOpen(!menuOpen)}
      headerExtra={
        meta.viewAllPath ? (
          <ViewAllButton onClick={() => navigate(meta.viewAllPath)} />
        ) : null
      }
    >
      {content}
    </HomeCardShell>
  );
}
