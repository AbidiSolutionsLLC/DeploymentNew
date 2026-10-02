import React, { useEffect } from "react";
import { BsFileEarmarkCheckFill } from "react-icons/bs";
import { MdPeople } from "react-icons/md";
import ProjectCard from "../../components/ProjectCard";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjectDashboard } from "../../store/projectSlice";
import BarCard from "../../components/dashboard-cards/BarCard";
import TasksAssignedToMeCard from "../../components/dashboard-cards/TasksAssignedToMe";
import ActiveProjectsCard from "../../components/dashboard-cards/ActiveProjectsCard";
import UpcomingDeadlinesCard from "../../components/dashboard-cards/UpcomingDeadlinesCard";
import MyTeamMembersCard from "../../components/dashboard-cards/MyTeamMembersCard";
import TimeTrackingOverviewCard from "../../components/dashboard-cards/TimeTrackingOverviewCard";
import PageContainer from "../../components/ui/PageContainer";
import Loader from "../../components/ui/Loader";
import useVariant from "../../components/prototype/useVariant";
import PrototypeSwitcher from "../../components/prototype/PrototypeSwitcher";
import DashboardA from "./prototype/a/Dashboard";
import DashboardB from "./prototype/b/Dashboard";
import DashboardC from "./prototype/c/Dashboard";

// PROTOTYPE: `?variant=` renders one of three redesign proposals; absent → current UI.
const ProjectDashBoard = () => {
 const dispatch = useDispatch();
 const { dashboardData, loading } = useSelector((state) => state.projects);
 const { variant } = useVariant();

 useEffect(() => {
 dispatch(fetchProjectDashboard());
 }, [dispatch]);

 if (loading) {
  return (
    <div className="flex justify-center items-center h-screen bg-app">
      <Loader size="xl" text="Loading Project Dashboard..." />
    </div>
  );
 }

  const leaveData = [
  {
  icon: <BsFileEarmarkCheckFill className="w-6 h-6 text-brand" />,
  label: "Active Projects",
  available: dashboardData?.activeProjects || 0,
  badgeColor: "bg-brand",
  },
  {
  icon: <BsFileEarmarkCheckFill className="w-6 h-6 text-green-500" />,
  label: "Completed Projects",
  available: dashboardData?.completedProjects || 0,
  badgeColor: "bg-green-500",
  },
  {
  icon: <BsFileEarmarkCheckFill className="w-6 h-6 text-blue-500" />,
  label: "Opened Task",
  available: dashboardData?.openTasks || 0,
  badgeColor: "bg-blue-500",
  },
  {
  icon: <MdPeople className="w-6 h-6 text-amber-500" />,
  label: "Project Group",
  available: dashboardData?.projectGroups || 0,
  badgeColor: "bg-amber-500",
  },
  ];

  const content =
    variant === "a" ? (
      <DashboardA data={dashboardData} />
    ) : variant === "b" ? (
      <DashboardB data={dashboardData} />
    ) : variant === "c" ? (
      <DashboardC data={dashboardData} />
    ) : (
      <PageContainer
        title="Project Dashboard"
        subtitle="Overview of your active projects and tasks"
        loading={loading}
        isCard={false}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {leaveData.map((item, index) => (
            <div key={index} className="w-full text-heading">
              <ProjectCard
                title={item.label}
                value={item.available}
                icon={item.icon}
                badgeColor={item.badgeColor}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 auto-rows-fr">
          <div className="h-full">
            <ActiveProjectsCard projects={dashboardData?.recentProjects || []} />
          </div>
          <div className="h-full">
            <BarCard timeTracking={dashboardData?.timeTracking} />
          </div>
          <div className="h-full">
            <TasksAssignedToMeCard tasks={dashboardData?.recentTasks || []} />
          </div>
          <div className="h-full">
            <UpcomingDeadlinesCard deadlines={dashboardData?.upcomingDeadlines || []} />
          </div>
          <div className="h-full">
            <MyTeamMembersCard teamMembers={dashboardData?.teamMembers || []} />
          </div>
          <div className="h-full">
            <TimeTrackingOverviewCard timeTracking={dashboardData?.timeTracking} />
          </div>
        </div>
      </PageContainer>
    );

  return (
    <>
      {content}
      <PrototypeSwitcher />
    </>
  );
};

export default ProjectDashBoard;

