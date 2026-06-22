import React, { useEffect } from "react";
import { BsFileEarmarkCheckFill } from "react-icons/bs";
import { MdPeople } from "react-icons/md";
import ProjectCard from "../../components/ProjectCard";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjectDashboard } from "../../store/projectSlice";
import GreetingTimerCard from "../../components/dashboard-cards/GreetingTimerCard";
import BarCard from "../../components/dashboard-cards/BarCard";
import LineChartCard from "../../components/dashboard-cards/LineChartCard";
import StatCard from "../../components/dashboard-cards/StatCard";
import ProgressCard from "../../components/dashboard-cards/ProgressCard";
import TasksAssignedToMeCard from "../../components/dashboard-cards/TasksAssignedToMe";
import ActiveProjectsCard from "../../components/dashboard-cards/ActiveProjectsCard";
import UpcomingDeadlinesCard from "../../components/dashboard-cards/UpcomingDeadlinesCard";
import MyTeamMembersCard from "../../components/dashboard-cards/MyTeamMembersCard";
import TimeTrackingOverviewCard from "../../components/dashboard-cards/TimeTrackingOverviewCard";
import PageContainer from "../../components/ui/PageContainer";

const ProjectDashBoard = () => {
 const dispatch = useDispatch();
 const { dashboardData, loading } = useSelector((state) => state.projects);

 useEffect(() => {
 dispatch(fetchProjectDashboard());
 }, [dispatch]);

 if (loading) {
 return <div>Loading...</div>;
 }

 const leaveData = [
 {
 icon: <BsFileEarmarkCheckFill className="w-5 h-5 text-[#C8928D]" />,
 label: "Active Projects",
 available: dashboardData?.activeProjects || 0,
 badgeColor: "bg-[#FFC2C2]",
 },
 {
 icon: <BsFileEarmarkCheckFill className="w-5 h-5 text-[#EDB789]" />,
 label: "Completed Projects",
 available: dashboardData?.completedProjects || 0,
 badgeColor: "bg-[#F4D4B5]",
 },
 {
 icon: <BsFileEarmarkCheckFill className="w-5 h-5 text-[#8AC090]" />,
 label: "Opened Task",
 available: dashboardData?.openTasks || 0,
 badgeColor: "bg-[#B5F4BC]",
 },
 {
 icon: <MdPeople className="w-5 h-5 text-[#86ABEF]" />,
 label: "Project Group",
 available: dashboardData?.projectGroups || 0,
 badgeColor: "bg-[#AAC8FF]",
 },
 ];

 return (
 <PageContainer
 title="Project Dashboard"
 subtitle="Overview of your active projects and tasks"
 loading={loading}
 isCard={false}
 >
 <GreetingTimerCard />

 <div className="mt-6 flex flex-wrap gap-4 sm:gap-6">
 {leaveData.map((item, index) => (
 <div key={index} className="w-full sm:w-[48%] lg:w-[23%] text-text">
 <ProjectCard
 title={item.label}
 value={item.available}
 icon={item.icon}
 badgeColor={item.badgeColor}
 />
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
 <div className="">
 <ActiveProjectsCard />
 </div>
 <div className="">
 <BarCard />
 </div>
 <div className="">
 <TasksAssignedToMeCard />
 </div>
 <div className="">
 <UpcomingDeadlinesCard />
 </div>
 <div className="">
 <MyTeamMembersCard /> 
 </div>
 <div className="">
 <TimeTrackingOverviewCard /> 
 </div>
 </div>
 </PageContainer>
 );
};

export default ProjectDashBoard;
