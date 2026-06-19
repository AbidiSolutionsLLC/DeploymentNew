import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useProject } from "../../hooks/project/useProject";
import { useTasks } from "../../hooks/project/useTask";
import { useTheme } from "../../context/ThemeContext"; // Keep this import
import ProjectHeader from "../../components/project/ProjectHeader";
import TabNavigation from "../../components/project/TabNavigation";
import KanbanBoard from "../../components/project/KanbanBoard";
import CommentsSection from "../../components/project/CommentSection";
import MyTasksView from "../../components/project/MyTaskView";
import AddTaskDrawer from "../../components/project/AddTaskDrawer";

import PageContainer from "../../components/ui/PageContainer";

const ProjectDetail = () => {
  const { id } = useParams();
  const { selectedTheme } = useTheme(); // Correctly using selectedTheme
  const { project, loading: projectLoading } = useProject(id);
  const { tasks, loading: tasksLoading, updateTaskStatus, createTask } = useTasks(id);
  
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all-tasks");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreateTask = async (taskData) => {
    try {
      await createTask(taskData);
      toast.success('Task created successfully');
      setShowModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to create task');
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;

    try {
      await updateTaskStatus(draggableId, newStatus);
      toast.success('Task status updated');
    } catch (err) {
      toast.error('Failed to update task status');
    }
  };

  const filteredTasks = tasks?.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'all-tasks':
        return (
          <KanbanBoard 
            tasks={filteredTasks} 
            onDragEnd={handleDragEnd}
            loading={tasksLoading}
          />
        );
      case 'my-tasks':
        return <MyTasksView tasks={filteredTasks} onDragEnd={handleDragEnd} />;
      case 'comments':
        return <CommentsSection projectId={id} />;
      default:
        return (
          <KanbanBoard 
            tasks={filteredTasks} 
            onDragEnd={handleDragEnd}
            loading={tasksLoading}
          />
        );
    }
  };

  return (
    <PageContainer
      loading={projectLoading}
      isCard={false}
    >
      <div className="flex flex-col gap-4">
        {project && <ProjectHeader project={project} />}
        
        <TabNavigation 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddTask={() => setShowModal(true)}
        />
        
        <div className="w-full">
          {renderTabContent()}
        </div>
        
        <AddTaskDrawer
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateTask}
        />
      </div>
    </PageContainer>
  );
};

export default ProjectDetail;
