import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import api from "../../axios";
import {
  FaChevronDown,
  FaChevronRight,
  FaCrown,
  FaCrosshairs,
  FaLocationArrow,
  FaRedo,
  FaSearchMinus,
  FaSearchPlus,
  FaSitemap,
  FaTimes,
  FaUserCheck,
  FaUserTie,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { motion as Motion } from "framer-motion";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import FilterPanel from "../../components/ui/FilterPanel";
import FilterRow from "../../components/ui/FilterRow";
import GlassInput from "../../components/ui/GlassInput";
import ModernSelect from "../../components/ui/ModernSelect";
import GlassButton from "../../components/ui/GlassButton";
import Loader from "../../components/ui/Loader";

const EASE = [0.16, 1, 0.3, 1];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } },
};

/* ------------------------------------------------------------------ *
 * Tree layout + connector styles
 * ------------------------------------------------------------------ */
const ORG_CSS = `
.oc-chart { --oc-line: color-mix(in srgb, var(--color-brand-primary) 55%, transparent); }
.oc-chart ul, .oc-chart li { list-style: none; margin: 0; padding: 0; }

.oc-chart ul.oc-tree { display: flex; justify-content: center; align-items: flex-start; gap: 64px; }
.oc-chart li.oc-branch { position: relative; display: flex; flex-direction: column; align-items: center; }

/* vertical stub: parent card bottom -> sibling rail */
.oc-chart ul.oc-kids {
  display: flex; justify-content: center; align-items: flex-start;
  position: relative; margin-top: 26px;
}
.oc-chart ul.oc-kids::before {
  content: ""; position: absolute; top: -26px; left: 50%; height: 26px;
  border-left: 2px solid var(--oc-line);
}
/* each child owns a slice of the sibling rail + its own drop line */
.oc-chart .oc-kids > li { position: relative; display: flex; flex-direction: column; align-items: center; padding: 26px 26px 0; }
.oc-chart .oc-kids > li::before { content: ""; position: absolute; top: 0; left: 50%; height: 26px; border-left: 2px solid var(--oc-line); }
.oc-chart .oc-kids > li::after { content: ""; position: absolute; top: 0; left: 0; right: 0; border-top: 2px solid var(--oc-line); }
.oc-chart .oc-kids > li:first-child::after { left: 50%; }
.oc-chart .oc-kids > li:last-child::after { right: 50%; }
.oc-chart .oc-kids > li:only-child::after { display: none; }

/* ------------------------------------------------------------------ *
 * Person card
 * ------------------------------------------------------------------ */
.oc-slot { position: relative; width: 16rem; }
.oc-card {
  position: relative; width: 100%; overflow: hidden;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: 1rem;
  box-shadow: 0 14px 30px -20px rgba(0, 0, 0, 0.55);
  transition: transform 0.25s ease, box-shadow 0.25s ease, opacity 0.3s ease, filter 0.3s ease;
}
.oc-card:hover { transform: translateY(-3px); box-shadow: 0 22px 40px -22px rgba(0, 0, 0, 0.6); }
.oc-bar { display: block; height: 6px; width: 100%; }

.oc-you {
  position: absolute; top: 10px; right: 10px; z-index: 3;
  font-size: 9px; font-weight: 900; letter-spacing: 0.09em; text-transform: uppercase;
  padding: 3px 7px; border-radius: 999px;
  background: var(--color-brand-primary); color: var(--color-text-on-brand);
  box-shadow: 0 6px 14px -8px rgba(0, 0, 0, 0.8);
}
.oc-flag {
  position: absolute; top: -11px; left: 50%; transform: translateX(-50%); z-index: 8;
  font-size: 9px; font-weight: 900; letter-spacing: 0.09em; text-transform: uppercase;
  padding: 3px 9px; border-radius: 999px; white-space: nowrap; pointer-events: none;
  background: var(--color-brand-primary); color: var(--color-text-on-brand);
  box-shadow: 0 8px 18px -8px rgba(0, 0, 0, 0.75);
}
.oc-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 7px 11px; border-top: 1px solid var(--color-border-secondary);
  background: color-mix(in srgb, var(--color-brand-primary) 7%, transparent);
  font-size: 9.5px; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase;
}
.oc-foot-btn {
  display: inline-flex; align-items: center; gap: 5px; padding: 0; border: 0;
  background: none; font: inherit; color: var(--color-text-secondary); cursor: pointer;
  transition: color 0.2s ease;
}
.oc-foot-btn:hover { color: var(--color-brand-text); }
.oc-locate {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 8px; flex-shrink: 0;
  border: 1px solid var(--color-border-secondary);
  background: var(--color-bg-primary); color: var(--color-text-secondary);
  cursor: pointer; transition: all 0.2s ease;
}
.oc-locate:hover { color: var(--color-brand-primary); border-color: var(--color-brand-primary); transform: scale(1.1); }

/* ------------------------------------------------------------------ *
 * Focus / highlight states
 * ------------------------------------------------------------------ */
.oc-chart.has-focus { --oc-line: color-mix(in srgb, var(--color-brand-primary) 26%, transparent); }
.oc-chart.has-focus .oc-slot.is-dim { opacity: 0.16; filter: grayscale(0.9); }
.oc-chart.has-focus .oc-slot.is-dim:hover { opacity: 0.55; filter: none; }

.oc-slot.is-me .oc-card { box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-brand-primary) 65%, transparent), 0 14px 30px -20px rgba(0, 0, 0, 0.55); }
.oc-slot.is-related .oc-card { box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-brand-primary) 35%, transparent), 0 14px 30px -20px rgba(0, 0, 0, 0.55); }
.oc-slot.is-active .oc-card {
  transform: translateY(-4px);
  box-shadow: 0 0 0 2px var(--color-bg-primary), 0 0 0 4px var(--color-brand-primary), 0 26px 46px -22px rgba(0, 0, 0, 0.6);
}
.oc-slot.is-active::after {
  content: ""; position: absolute; inset: -8px; border-radius: 1.25rem;
  border: 2px solid var(--color-brand-primary); pointer-events: none;
  animation: ocPing 1.9s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes ocPing { 0% { transform: scale(0.97); opacity: 0.7; } 70%, 100% { transform: scale(1.07); opacity: 0; } }

/* ------------------------------------------------------------------ *
 * Focus panel + legend
 * ------------------------------------------------------------------ */
.oc-panel {
  position: absolute; left: 14px; bottom: 14px; z-index: 40; width: 21rem;
  max-width: calc(100% - 28px); padding: 14px; border-radius: 18px;
  background: color-mix(in srgb, var(--color-bg-primary) 93%, transparent);
  backdrop-filter: blur(16px);
  border: 1px solid color-mix(in srgb, var(--color-brand-primary) 35%, var(--color-border-secondary));
  box-shadow: 0 28px 60px -26px rgba(0, 0, 0, 0.7);
}
.oc-panel-title { font-size: 10px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-brand-text); }
.oc-panel-sub { font-size: 12px; font-weight: 700; color: var(--color-text-secondary); }
.oc-stat {
  display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 800;
  padding: 3px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em;
  background: color-mix(in srgb, var(--color-brand-primary) 12%, transparent);
  color: var(--color-brand-text); border: 1px solid color-mix(in srgb, var(--color-brand-primary) 30%, transparent);
}
.oc-crumb {
  font-size: 11px; font-weight: 800; color: var(--color-text-secondary);
  background: none; border: 0; padding: 0; cursor: pointer; transition: color 0.2s ease;
}
.oc-crumb:hover { color: var(--color-brand-primary); }
.oc-crumb.is-current { color: var(--color-brand-text); cursor: default; }
.oc-chip-btn {
  font-size: 10.5px; font-weight: 800; padding: 4px 9px; border-radius: 999px;
  background: var(--color-bg-secondary); color: var(--color-text-secondary);
  border: 1px solid var(--color-border-secondary); cursor: pointer; transition: all 0.2s ease;
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.oc-chip-btn:hover { color: var(--color-brand-text); border-color: var(--color-brand-primary); }

.oc-legend {
  position: absolute; right: 14px; bottom: 14px; z-index: 30; display: none;
  align-items: center; gap: 12px; padding: 8px 12px; border-radius: 12px;
  background: color-mix(in srgb, var(--color-bg-primary) 90%, transparent);
  backdrop-filter: blur(12px); border: 1px solid var(--color-border-secondary);
  font-size: 10px; font-weight: 800; letter-spacing: 0.04em; color: var(--color-text-secondary);
}
@media (min-width: 1100px) { .oc-legend { display: flex; } }
.oc-legend i { width: 9px; height: 9px; border-radius: 999px; display: inline-block; margin-right: 5px; }
`;

const FOCUS_META = {
  self: { title: "Where am I?", flag: "You", memberFlag: null },
  team: { title: "Where is my team?", flag: "Your team", memberFlag: "Team" },
  manager: { title: "My Manager", flag: "Your manager", memberFlag: null },
  ceo: { title: "Our CEO (Chief Executive Officer)", flag: "Our CEO", memberFlag: null },
  node: { title: "In focus", flag: "Selected", memberFlag: null },
};

const getRoleColor = (role) => {
  if (!role) return { from: "#64748B", to: "#475569", accent: "#64748B" };

  const r = role.toLowerCase();

  if (r.includes("ceo") || r.includes("chief") || r.includes("executive")) {
    return { from: "#F59E0B", to: "#D97706", accent: "#F59E0B" };
  }
  if (r.includes("director") || r.includes("vp")) {
    return { from: "#8B5CF6", to: "#7C3AED", accent: "#8B5CF6" };
  }
  if (r.includes("manager") || r.includes("lead")) {
    return { from: "#6366F1", to: "#4F46E5", accent: "#6366F1" };
  }
  if (r.includes("engineer") || r.includes("developer")) {
    return { from: "#10B981", to: "#059669", accent: "#10B981" };
  }
  if (r.includes("hr") || r.includes("admin")) {
    return { from: "#EC4899", to: "#DB2777", accent: "#EC4899" };
  }

  return { from: "#64748B", to: "#475569", accent: "#64748B" };
};

const seniority = (node) => {
  const t = `${node.designation || ""} ${node.role || ""}`.toLowerCase();
  if (t.includes("ceo") || t.includes("chief executive") || t.includes("founder")) return 0;
  if (t.includes("chief") || t.includes("president") || t.includes("vp") || t.includes("vice president") || t.includes("director")) return 1;
  if (t.includes("head") || t.includes("manager") || t.includes("lead")) return 2;
  return 3;
};

const sortNodes = (nodes) =>
  [...nodes]
    .sort(
      (a, b) =>
        seniority(a) - seniority(b) ||
        (b.children?.length ? 1 : 0) - (a.children?.length ? 1 : 0) ||
        (a.name || "").localeCompare(b.name || "")
    )
    .map((n) => ({ ...n, children: n.children?.length ? sortNodes(n.children) : [] }));

const findCeoNode = (byId, depthOf) => {
  if (!byId || !byId.size) return null;
  const nodes = Array.from(byId.values());
  const matches = [];

  for (const node of nodes) {
    const des = (node.designation || "").trim();
    const role = (node.role || "").trim();

    // Check for both abbreviation "CEO" / "C.E.O." and full form "Chief Executive Officer" / "Chief Executive"
    const desHasCeoWord = /\b(ceo|c\.e\.o\.?)\b/i.test(des);
    const desHasFullForm = /\bchief\s+executive(\s+officer)?\b/i.test(des);
    const desHasCeoSub = des.toLowerCase().includes("ceo") || des.toLowerCase().includes("chief executive");

    const roleHasCeo = /\b(ceo|c\.e\.o\.?)\b/i.test(role);
    const roleHasFullForm = /\bchief\s+executive(\s+officer)?\b/i.test(role);

    if (!desHasCeoWord && !desHasFullForm && !desHasCeoSub && !roleHasCeo && !roleHasFullForm) {
      continue;
    }

    const lowerDes = des.toLowerCase();
    const isAssistant = /assistant|assoc|intern|secretary|deputy/i.test(lowerDes);

    let score = 0;
    if (lowerDes === "ceo" || lowerDes === "chief executive officer" || lowerDes === "chief executive") {
      score = 100;
    } else if (/^(ceo|c\.e\.o\.?|chief\s+executive(\s+officer)?)\b/i.test(des)) {
      score = 90;
    } else if ((desHasCeoWord || desHasFullForm) && !isAssistant) {
      score = 80;
    } else if (desHasCeoWord || desHasFullForm) {
      score = 50;
    } else if (desHasCeoSub && !isAssistant) {
      score = 40;
    } else if (roleHasCeo || roleHasFullForm) {
      score = 20;
    } else {
      score = 10;
    }

    const depth = depthOf?.get(node._id) ?? 999;
    matches.push({ node, score, depth });
  }

  if (!matches.length) return null;

  matches.sort((a, b) => b.score - a.score || a.depth - b.depth);
  return matches[0].node;
};

/* ------------------------------------------------------------------ *
 * One person card + its subtree
 * ------------------------------------------------------------------ */
const OrgNode = ({ node, ctx }) => {
  const colors = getRoleColor(node.designation || node.role);
  const childCount = node.children?.length || 0;
  const isCollapsed = ctx.collapsed.has(node._id);
  const isMe = node._id === ctx.meId;
  const isActive = ctx.focus ? ctx.focus.ids.has(node._id) : false;
  const isRelated = ctx.focus ? ctx.focus.related.has(node._id) : false;
  const isDim = Boolean(ctx.focus) && !isActive && !isRelated;
  const flag = !ctx.focus
    ? null
    : node._id === ctx.focus.id
    ? (ctx.focus.kind === "self" ? null : ctx.focus.flag)
    : isActive
    ? ctx.focus.memberFlag
    : null;

  const slotCls = [
    "oc-slot",
    isMe && "is-me",
    isActive && "is-active",
    isRelated && !isActive && "is-related",
    isDim && "is-dim",
  ]
    .filter(Boolean)
    .join(" ");

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      ctx.onCardClick(node);
    }
  };

  return (
    <li className="oc-branch">
      <div className={slotCls}>
        {flag && <span className="oc-flag">{flag}</span>}

        <div
          className="oc-card"
          data-node-id={node._id}
          role="button"
          tabIndex={0}
          aria-label={`${node.name}, ${node.designation || node.role}`}
          onClick={() => ctx.onCardClick(node)}
          onKeyDown={handleKey}
        >
          <span className="oc-bar" style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }} />

          <div className="relative p-4 flex flex-col items-center w-full">
            <div
              className="w-14 h-14 mb-2.5 rounded-2xl p-[3px] bg-surface border-2 shadow-sm"
              style={{ borderColor: colors.accent + "55" }}
            >
              <img
                src={node.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                alt={node.name}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            {isMe && <span className="oc-you">You</span>}

            <h3 className="text-[13px] font-black text-heading text-center leading-tight mb-1 w-full truncate px-1">
              {node.name}
            </h3>
            <p
              className="text-[11px] font-bold text-center mb-2 px-2 w-full truncate"
              style={{ color: colors.accent }}
            >
              {node.designation || node.role}
            </p>

            {node.department?.name && (
              <span className="inline-block max-w-full truncate px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand/10 text-brand border border-brand/20">
                {node.department.name}
              </span>
            )}
          </div>

          <div className="oc-foot">
            {childCount > 0 ? (
              <button
                type="button"
                className="oc-foot-btn"
                title={isCollapsed ? "Expand this branch" : "Collapse this branch"}
                onClick={(e) => {
                  e.stopPropagation();
                  ctx.onToggleCollapse(node._id);
                }}
              >
                <FaUsers size={10} />
                {isCollapsed ? `+${childCount}` : childCount} report{childCount > 1 ? "s" : ""}
                {isCollapsed ? <FaChevronRight size={9} /> : <FaChevronDown size={9} />}
              </button>
            ) : (
              <span className="oc-foot-btn">
                <FaUserTie size={10} />
                View profile
              </span>
            )}

            <button
              type="button"
              className="oc-locate"
              title="Center on this card"
              onClick={(e) => {
                e.stopPropagation();
                ctx.onLocate(node._id);
              }}
            >
              <FaCrosshairs size={10} />
            </button>
          </div>
        </div>
      </div>

      {childCount > 0 && !isCollapsed && (
        <ul className="oc-kids">
          {node.children.map((child) => (
            <OrgNode key={child._id} node={child} ctx={ctx} />
          ))}
        </ul>
      )}
    </li>
  );
};

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
const OrgChartPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [focus, setFocus] = useState(null);
  const [pendingCenter, setPendingCenter] = useState(null);
  const [scale, setScale] = useState(0.9);

  const tzRef = useRef(null);
  const contentRef = useRef(null);
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const userInfo = useSelector((state) => state.user?.userInfo);
  const currentUser = userInfo || user?.data?.user || user?.user || user;
  const myId = currentUser?._id || currentUser?.id || null;

  /* ---------------- fetch ---------------- */
  useEffect(() => {
    const fetchOrgChart = async () => {
      try {
        const response = await api.get("/users/org-chart");
        const chartData = Array.isArray(response.data) ? response.data : [];
        const sorted = sortNodes(chartData);
        setData(sorted);

        const depts = new Set();
        const extractDepts = (nodes) => {
          nodes.forEach((node) => {
            if (node.department?.name) depts.add(node.department.name);
            if (node.children) extractDepts(node.children);
          });
        };
        extractDepts(sorted);
        setDepartments(Array.from(depts).sort());
      } catch (error) {
        console.error("Failed to fetch chart", error);
        toast.error("Could not load the organization chart");
      } finally {
        setLoading(false);
      }
    };
    fetchOrgChart();
  }, []);

  /* ---------------- graph index ---------------- */
  const graph = useMemo(() => {
    const byId = new Map();
    const parentOf = new Map();
    const depthOf = new Map();

    const walk = (nodes, parentId, depth) => {
      nodes.forEach((n) => {
        byId.set(n._id, n);
        parentOf.set(n._id, parentId);
        depthOf.set(n._id, depth);
        if (n.children?.length) walk(n.children, n._id, depth + 1);
      });
    };
    walk(data, null, 0);

    const ceo = findCeoNode(byId, depthOf);

    const ancestorsOf = (id) => {
      const out = [];
      let cur = parentOf.get(id);
      let guard = 0;
      while (cur && guard++ < 100) {
        out.push(cur);
        cur = parentOf.get(cur);
      }
      return out;
    };

    const descendantsOf = (id) => {
      const out = [];
      const stack = [...(byId.get(id)?.children || []).map((c) => c._id)];
      while (stack.length) {
        const cur = stack.pop();
        out.push(cur);
        (byId.get(cur)?.children || []).forEach((c) => stack.push(c._id));
      }
      return out;
    };

    return { byId, parentOf, depthOf, ceo, ancestorsOf, descendantsOf };
  }, [data]);

  const myNode = myId ? graph.byId.get(myId) : null;

  /* ---------------- filtering ---------------- */
  const filteredData = useMemo(() => {
    if (!searchQuery && selectedDept === "all") return data;

    const matches = (node) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        node.name?.toLowerCase().includes(q) ||
        node.designation?.toLowerCase().includes(q) ||
        node.role?.toLowerCase().includes(q) ||
        node.department?.name?.toLowerCase().includes(q);
      const matchesDept = selectedDept === "all" || node.department?.name === selectedDept;
      return matchesSearch && matchesDept;
    };

    const filterNodes = (nodes) =>
      nodes
        .map((node) => {
          const kids = node.children ? filterNodes(node.children) : [];
          if (matches(node) || kids.length) return { ...node, children: kids };
          return null;
        })
        .filter(Boolean);

    return filterNodes(data);
  }, [data, searchQuery, selectedDept]);

  const visibleIds = useMemo(() => {
    const set = new Set();
    const walk = (nodes) =>
      nodes.forEach((n) => {
        set.add(n._id);
        if (n.children?.length) walk(n.children);
      });
    walk(filteredData);
    return set;
  }, [filteredData]);

  const totalNodes = visibleIds.size;

  const originalTotalNodes = useMemo(() => {
    let count = 0;
    const countNodes = (nodes) => nodes.forEach((n) => { count++; if (n.children?.length) countNodes(n.children); });
    countNodes(data);
    return count;
  }, [data]);

  const hasFilters = Boolean(searchQuery) || selectedDept !== "all";
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedDept("all");
  }, []);

  // searching hides nothing: unfold the whole tree so every match is reachable
  useEffect(() => {
    if (searchQuery || selectedDept !== "all") setCollapsed(new Set());
  }, [searchQuery, selectedDept]);

  const deptOptions = useMemo(
    () => [
      { value: "all", label: "All Departments" },
      ...departments.map((d) => ({ value: d, label: d })),
    ],
    [departments]
  );

  /* ---------------- quick-jump targets ---------------- */
  const managerId = myId ? graph.parentOf.get(myId) : null;

  /* ---------------- focus helpers ---------------- */
  const applyFocus = useCallback(
    (id, kind, extra = {}) => {
      const target = graph.byId.get(id);
      if (!target) return;

      const ancestors = graph.ancestorsOf(id);
      const descendants = kind === "team" ? graph.descendantsOf(id) : [];
      const ids = new Set([id, ...descendants]);

      let related = [];
      if (kind === "self") related = ancestors;
      else if (kind === "team") related = [];
      else if (kind === "manager" || kind === "ceo") {
        // light up the line from you to the target
        const up = myId ? graph.ancestorsOf(myId) : [];
        const idx = up.indexOf(id);
        const path = idx >= 0 ? up.slice(0, idx) : [];
        related = myId ? [myId, ...path] : [];
      } else related = ancestors;

      const expand = new Set(ancestors);
      if (kind === "self" || kind === "team" || kind === "node" || kind === "ceo") expand.add(id);

      setCollapsed((prev) => {
        const next = new Set(prev);
        expand.forEach((x) => next.delete(x));
        return next;
      });

      const meta = FOCUS_META[kind] || FOCUS_META.node;
      setFocus({
        kind,
        id,
        flag: meta.flag,
        memberFlag: meta.memberFlag,
        note: extra.note || null,
        ids,
        related: new Set(related.filter((r) => r && !ids.has(r))),
      });

      if (!visibleIds.has(id)) resetFilters();
      setPendingCenter({ id, scale: kind === "team" ? 0.85 : 1 });
    },
    [graph, myId, visibleIds, resetFilters]
  );

  const clearFocus = useCallback(() => {
    setFocus(null);
    setPendingCenter(null);
  }, []);

  const jump = useCallback(
    (kind) => {
      if (loading) return;

      if (kind === "ceo") {
        const ceoNode = graph.ceo || findCeoNode(graph.byId, graph.depthOf);
        if (!ceoNode) {
          toast.info("No profile with CEO or Chief Executive Officer designation found in the org chart.");
          return;
        }
        applyFocus(ceoNode._id, "ceo", {
          note: myId && ceoNode._id === myId ? "That's you — top of the chart." : "Top of the organization.",
        });
        return;
      }

      if (!myId || !myNode) {
        toast.info("Your profile isn't listed in the org chart yet.");
        return;
      }
      const ceoId = graph.ceo?._id;

      if (kind === "self") {
        applyFocus(myId, "self");
        return;
      }

      if (kind === "team") {
        const team = graph.descendantsOf(myId);
        applyFocus(myId, "team", {
          note: team.length
            ? `${team.length} ${team.length > 1 ? "people" : "person"} report up through you.`
            : "You have no direct reports yet — you're an individual contributor.",
        });
        if (!team.length) toast.info("You have no direct reports yet.");
        return;
      }

      if (kind === "manager") {
        if (!managerId) {
          toast.info(myId === ceoId ? "You sit at the top — there is no manager above you." : "No manager is assigned to your profile yet.");
          if (myId === ceoId) applyFocus(myId, "ceo", { note: "That's you — top of the chart." });
          return;
        }
        applyFocus(managerId, "manager", {
          note: `${graph.byId.get(managerId)?.name} is the person you report to.`,
        });
        return;
      }
    },
    [loading, myId, myNode, graph, managerId, applyFocus]
  );

  /* ---------------- center on a card ---------------- */
  useEffect(() => {
    if (!pendingCenter) return undefined;
    const { id, scale: targetScale } = pendingCenter;

    const timer = setTimeout(() => {
      const el = contentRef.current?.querySelector(`[data-node-id="${id}"]`);
      if (el && tzRef.current?.zoomToElement) {
        tzRef.current.zoomToElement(el, targetScale || 1, 650);
        setPendingCenter(null);
      }
    }, 90);

    return () => clearTimeout(timer);
  }, [pendingCenter, filteredData, collapsed]);

  /* ---------------- collapse / expand ---------------- */
  const toggleCollapse = useCallback((id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* ---------------- memoized tree ---------------- */
  const ctx = useMemo(
    () => ({
      meId: myId,
      focus,
      collapsed,
      onCardClick: (node) => navigate(`/people/profile/${node._id}`),
      onToggleCollapse: toggleCollapse,
      onLocate: (id) => applyFocus(id, "node"),
    }),
    [myId, focus, collapsed, navigate, toggleCollapse, applyFocus]
  );

  const treeEl = useMemo(() => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center mt-24 text-muted gap-4">
          <Loader size="lg" text="Mapping Hierarchy..." />
        </div>
      );
    }
    if (!filteredData?.length) {
      return (
        <div className="flex flex-col items-center mt-24 text-muted">
          <div className="w-20 h-20 rounded-2xl bg-surface flex items-center justify-center mb-4 border border-border">
            <FaSitemap size={32} className="text-muted" />
          </div>
          <p className="font-bold text-heading mb-1">No results found</p>
          <p className="text-sm text-muted text-center max-w-sm">
            {hasFilters
              ? "Try adjusting your search or filter criteria"
              : "No reporting hierarchy found. Ensure users have 'Reports To' assigned in their profiles."}
          </p>
          {hasFilters && (
            <GlassButton variant="secondary" size="sm" onClick={resetFilters} className="mt-4">
              Clear Filters
            </GlassButton>
          )}
        </div>
      );
    }
    return (
      <ul className="oc-tree">
        {filteredData.map((rootNode) => (
          <OrgNode key={rootNode._id} node={rootNode} ctx={ctx} />
        ))}
      </ul>
    );
  }, [loading, filteredData, ctx, hasFilters, resetFilters]);

  /* ---------------- focus panel model ---------------- */
  const activeFocus = focus && graph.byId.get(focus.id) ? focus : null;

  const focusInfo = useMemo(() => {
    if (!activeFocus) return null;
    const node = graph.byId.get(activeFocus.id);
    if (!node) return null;
    const ancestors = graph.ancestorsOf(activeFocus.id);
    const chain = [...ancestors].reverse().map((a) => graph.byId.get(a)).filter(Boolean);
    const reports = node.children || [];
    const teamSize = graph.descendantsOf(activeFocus.id).length;
    return {
      node,
      chain,
      reports,
      teamSize,
      level: (graph.depthOf.get(activeFocus.id) ?? 0) + 1,
    };
  }, [activeFocus, graph]);

  const focusTitle = activeFocus ? FOCUS_META[activeFocus.kind]?.title || "In focus" : "";

  /* Jump buttons rest in a neutral state; the one that is currently
     applied lights up gold so it is obvious which jump is active. */
  const jumpVariant = (kind) => (activeFocus?.kind === kind ? "primary" : "secondary");

  const handleClear = clearFocus;

  return (
    <PageContainer isCard={false}>
      <style>{ORG_CSS}</style>

      <Motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-4 w-full">
        <Motion.div variants={item}>
          <PortalHero
              label="Organization structure overview"
            title="Company Hierarchy"
            description="Interactive visualization of the organization's reporting structure and team relationships."
            chips={[
              { icon: FaUserTie, value: originalTotalNodes, label: " Total Members" },
              { pulse: true, value: totalNodes, label: " Visible" },
            ]}
          />
        </Motion.div>

        <Motion.div variants={item}>
          <FilterPanel
            title="Find & jump"
            subtitle="Search the hierarchy or jump straight to your place in it"
            hint="Tip: click a card to open the profile, or use the crosshair on a card to center it in the chart."
          >
            <div className="flex flex-col gap-3">
              <FilterRow>
                <GlassInput
                  placeholder="Search name, role, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <ModernSelect
                  label=""
                  name="dept"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  options={deptOptions}
                  className="w-full sm:w-56"
                />
                {hasFilters && (
                  <GlassButton variant="secondary" size="sm" icon={FaTimes} onClick={resetFilters}>
                    Clear
                  </GlassButton>
                )}
              </FilterRow>

              <FilterRow>
                <GlassButton variant={jumpVariant("self")} size="sm" icon={FaLocationArrow} onClick={() => jump("self")} disabled={loading}>
                  Where am I
                </GlassButton>
                <GlassButton variant={jumpVariant("team")} size="sm" icon={FaUsers} onClick={() => jump("team")} disabled={loading || !myNode}>
                  My team
                </GlassButton>
                <GlassButton variant={jumpVariant("manager")} size="sm" icon={FaUserCheck} onClick={() => jump("manager")} disabled={loading || !myNode || !managerId}>
                  My manager
                </GlassButton>
                <GlassButton
                  variant={jumpVariant("ceo")}
                  size="sm"
                  icon={FaCrown}
                  onClick={() => jump("ceo")}
                  title="Our CEO (Chief Executive Officer)"
                  disabled={loading || !data?.length}
                >
                  Our CEO
                </GlassButton>
                {activeFocus && (
                  <GlassButton variant="ghost" size="sm" icon={FaTimes} onClick={handleClear}>
                    Clear focus
                  </GlassButton>
                )}
              </FilterRow>
            </div>
          </FilterPanel>
        </Motion.div>

        <Motion.section variants={item} className="lm-card !p-0 overflow-hidden relative" style={{ "--lm-accent": "#D4AF37" }}>
          <TransformWrapper
            ref={tzRef}
            initialScale={0.9}
            minScale={0.3}
            maxScale={2.5}
            centerOnInit
            limitToBounds={false}
            wheel={{ step: 0.08 }}
            panning={{ disabled: false, velocityDisabled: false }}
            onTransformed={(_, state) => setScale((prev) => (prev === state.scale ? prev : state.scale))}
          >
            {() => (
              <>
                <div
                  className="flex flex-row items-center gap-1 bg-surface/95 backdrop-blur-sm p-1.5 rounded-xl border border-border shadow-lg"
                  style={{ position: "absolute", top: "0.75rem", right: "0.75rem", zIndex: 50, pointerEvents: "auto" }}
                >
                  <button type="button" onClick={() => tzRef.current?.zoomOut?.()} className="w-8 h-8 flex items-center justify-center hover:bg-brand/10 rounded-lg text-brand transition-all" title="Zoom Out"><FaSearchMinus size={14} /></button>
                  <span className="text-[11px] font-black text-muted tabular-nums w-10 text-center">{Math.round(scale * 100)}%</span>
                  <button type="button" onClick={() => tzRef.current?.zoomIn?.()} className="w-8 h-8 flex items-center justify-center hover:bg-brand/10 rounded-lg text-brand transition-all" title="Zoom In"><FaSearchPlus size={14} /></button>
                  <button type="button" onClick={() => tzRef.current?.resetTransform?.()} className="w-8 h-8 flex items-center justify-center hover:bg-brand/10 rounded-lg text-brand transition-all" title="Reset View"><FaRedo size={14} /></button>
                </div>

                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "clamp(420px, calc(100vh - 560px), 820px)" }}
                  contentStyle={{ width: "auto", height: "auto", minWidth: "100%", minHeight: "100%", display: "flex", justifyContent: "center" }}
                >
                  <div
                    ref={contentRef}
                    className={`oc-chart relative min-w-max w-max flex flex-col items-center py-12 px-10 ${activeFocus ? "has-focus" : ""}`}
                  >
                    <div
                      className="absolute inset-0 opacity-[0.03] pointer-events-none w-[5000px] h-[5000px] -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
                      style={{ backgroundImage: "radial-gradient(#D4AF37 1.5px, transparent 1.5px)", backgroundSize: "30px 30px" }}
                    />
                    <div className="relative z-10">{treeEl}</div>
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>

          <div className="oc-legend">
            <span><i style={{ background: "#F59E0B" }} />Executive</span>
            <span><i style={{ background: "#8B5CF6" }} />Director / VP</span>
            <span><i style={{ background: "#6366F1" }} />Manager / Lead</span>
            <span><i style={{ background: "#10B981" }} />Engineer</span>
            <span><i style={{ background: "#EC4899" }} />HR / Admin</span>
            <span><i style={{ background: "#64748B" }} />Other</span>
          </div>

          {activeFocus && focusInfo && (
            <div className="oc-panel">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1 h-4 rounded-full bg-brand flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="oc-panel-title">{focusTitle}</p>
                    <p className="oc-panel-sub truncate">{focusInfo.node.name}</p>
                  </div>
                </div>
                <button
                  onClick={handleClear}
                  className="p-1.5 rounded-lg border border-border-subtle text-muted hover:text-heading hover:bg-card-hover transition-all flex-shrink-0"
                  title="Clear focus"
                >
                  <FaTimes size={11} />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl p-[2px] bg-surface border-2 border-brand/40 flex-shrink-0 overflow-hidden">
                  <img
                    src={focusInfo.node.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                    alt={focusInfo.node.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-heading truncate">{focusInfo.node.name}</p>
                  <p className="text-xs font-bold text-brand-text truncate">
                    {focusInfo.node.designation || focusInfo.node.role}
                  </p>
                  {focusInfo.node.department?.name && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand/10 text-brand border border-brand/20">
                      {focusInfo.node.department.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="oc-stat">Level {focusInfo.level}</span>
                <span className="oc-stat">{focusInfo.reports.length} direct</span>
                <span className="oc-stat">{focusInfo.teamSize} in team</span>
              </div>

              {activeFocus.note && (
                <p className="mt-2 text-[11px] font-medium text-muted leading-relaxed">{activeFocus.note}</p>
              )}

              {focusInfo.chain.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  {focusInfo.chain.map((n) => (
                    <React.Fragment key={n._id}>
                      <button className="oc-crumb" onClick={() => applyFocus(n._id, "node")}>
                        {(n.name || "").split(" ")[0]}
                      </button>
                      <FaChevronRight size={8} className="text-muted" />
                    </React.Fragment>
                  ))}
                  <span className="oc-crumb is-current">{(focusInfo.node.name || "").split(" ")[0]}</span>
                </div>
              )}

              {activeFocus.kind === "team" && focusInfo.reports.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {focusInfo.reports.slice(0, 8).map((r) => (
                    <button key={r._id} className="oc-chip-btn" onClick={() => applyFocus(r._id, "node")}>
                      {r.name}
                    </button>
                  ))}
                  {focusInfo.reports.length > 8 && (
                    <span className="oc-chip-btn" style={{ cursor: "default" }}>
                      +{focusInfo.reports.length - 8} more
                    </span>
                  )}
                </div>
              )}

              <div className="mt-3.5 flex flex-wrap gap-2">
                <GlassButton
                  variant="primary"
                  size="sm"
                  icon={FaUserTie}
                  onClick={() => navigate(`/people/profile/${focusInfo.node._id}`)}
                >
                  Profile
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  size="sm"
                  icon={FaCrosshairs}
                  onClick={() => setPendingCenter({ id: activeFocus.id, scale: activeFocus.kind === "team" ? 0.85 : 1 })}
                >
                  Center
                </GlassButton>
                {activeFocus.kind !== "team" && myNode && (
                  <GlassButton variant="secondary" size="sm" icon={FaUsers} onClick={() => jump("team")}>
                    My team
                  </GlassButton>
                )}
              </div>
            </div>
          )}
        </Motion.section>
      </Motion.div>
    </PageContainer>
  );
};

export default OrgChartPage;
