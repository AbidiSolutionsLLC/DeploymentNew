import {
  FiFolder,
  FiPieChart,
  FiCheckSquare,
  FiCalendar,
  FiUsers,
} from "react-icons/fi";

export const PROJECT_DASHBOARD_CARD_OPTIONS = [
  { id: "activeProjects", label: "Active Projects", icon: FiFolder },
  { id: "taskPriorities", label: "Task Priorities", icon: FiPieChart },
  { id: "openTasks", label: "Open Tasks", icon: FiCheckSquare },
  { id: "upcomingDeadlines", label: "Upcoming Deadlines", icon: FiCalendar },
  { id: "teamMembers", label: "Team Members", icon: FiUsers },
];
