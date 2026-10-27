/**
 * taskHierarchy.js — Utilities for managing and navigating task dependency hierarchies
 */

/**
 * Checks if a status string or object represents a "Done/Completed" state.
 */
export function isStatusDone(status) {
  if (!status) return false;
  const s = String(typeof status === "object" ? status.label || status.category || "" : status)
    .trim()
    .toLowerCase();
  return (
    s === "done" ||
    s === "completed" ||
    s === "closed" ||
    s === "finished" ||
    s === "shipped" ||
    s === "resolved"
  );
}

/**
 * Gets tasks that are directly dependent on the given taskId (sub-dependent / blocked tasks).
 */
export function getDependentTasks(taskId, allTasks = []) {
  if (!taskId || !Array.isArray(allTasks)) return [];
  const idStr = String(taskId);
  return allTasks.filter((t) => {
    const tId = String(t?._id || t?.id || "");
    if (!tId || tId === idStr) return false;
    const deps = (t.dependencies || []).map((d) => String(d?._id || d?.id || d));
    return deps.includes(idStr);
  });
}

/**
 * Gets prerequisite tasks that the given task depends on (parent / blocker tasks).
 */
export function getPrerequisiteTasks(task, allTasks = []) {
  if (!task || !Array.isArray(allTasks)) return [];
  const depIds = (task.dependencies || []).map((d) => String(d?._id || d?.id || d));
  if (!depIds.length) return [];
  return allTasks.filter((t) => {
    const tId = String(t?._id || t?.id || "");
    return depIds.includes(tId);
  });
}

/**
 * Returns any prerequisite tasks that are not yet marked as Done/Completed.
 */
export function getUnresolvedPrerequisites(task, allTasks = [], isDoneCheck = isStatusDone) {
  const prerequisites = getPrerequisiteTasks(task, allTasks);
  return prerequisites.filter((p) => !isDoneCheck(p.status));
}

/**
 * Builds a hierarchical tree structure of tasks based on their dependencies.
 *
 * Rules:
 * - A task is a "Root" if it has no dependencies (or none of its dependencies exist in the task list).
 * - A task is a "Child" (sub-dependent) if another task in the list is its prerequisite.
 * - Multi-level dependencies (A -> B -> C) are supported.
 * - Cycle detection prevents infinite recursion loops.
 *
 * @param {Array} tasks - Flat list of task objects
 * @returns {Array} List of tree nodes: { task, children: [...], depth: number, parentIds: [...] }
 */
export function buildTaskHierarchy(tasks = []) {
  if (!Array.isArray(tasks) || tasks.length === 0) return [];

  const taskMap = new Map();
  tasks.forEach((t) => {
    const id = String(t?._id || t?.id || "");
    if (id) taskMap.set(id, t);
  });

  // Map of parentId -> array of child tasks (tasks that depend on parentId)
  const childrenMap = new Map();
  tasks.forEach((t) => {
    const childId = String(t?._id || t?.id || "");
    const depIds = (t.dependencies || []).map((d) => String(d?._id || d?.id || d));

    depIds.forEach((pId) => {
      if (taskMap.has(pId)) {
        if (!childrenMap.has(pId)) {
          childrenMap.set(pId, []);
        }
        childrenMap.get(pId).push(t);
      }
    });
  });

  // Identify roots: tasks that do not depend on any known task in this list
  const rootTasks = tasks.filter((t) => {
    const depIds = (t.dependencies || []).map((d) => String(d?._id || d?.id || d));
    const hasKnownParent = depIds.some((pId) => taskMap.has(pId));
    return !hasKnownParent;
  });

  // Recursive tree node builder with cycle detection and depth limit
  const visitedGlobally = new Set();
  const buildNode = (task, depth = 0, ancestorPath = new Set()) => {
    const id = String(task?._id || task?.id || "");
    visitedGlobally.add(id);

    const nextAncestors = new Set(ancestorPath);
    nextAncestors.add(id);

    const rawChildren = childrenMap.get(id) || [];
    const children = [];

    if (depth < 8) {
      rawChildren.forEach((childTask) => {
        const childId = String(childTask?._id || childTask?.id || "");
        // Prevent cyclic infinite recursion
        if (!nextAncestors.has(childId)) {
          children.push(buildNode(childTask, depth + 1, nextAncestors));
        }
      });
    }

    return {
      task,
      id,
      depth,
      children,
      hasChildren: children.length > 0,
      totalDescendants: countDescendants(children),
    };
  };

  const countDescendants = (childrenList) => {
    let count = childrenList.length;
    childrenList.forEach((c) => {
      count += countDescendants(c.children);
    });
    return count;
  };

  // Build root trees
  const treeRoots = rootTasks.map((t) => buildNode(t, 0));

  // Any remaining orphaned tasks that had cycles or unrooted references
  tasks.forEach((t) => {
    const id = String(t?._id || t?.id || "");
    if (!visitedGlobally.has(id)) {
      treeRoots.push(buildNode(t, 0));
    }
  });

  return treeRoots;
}
