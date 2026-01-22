import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useProject } from "../../Hooks/project/useProject";
import { useTasks } from "../../Hooks/project/useTask";
import { useTheme } from "../../context/ThemeContext"; // Keep this import
import ProjectHeader from "../../Components/project/ProjectHeader";
import TabNavigation from "../../Components/project/TabNavigation";
import KanbanBoard from "../../Components/project/KanbanBoard";
import CommentsSection from "../../Components/project/CommentSection";
import MyTasksView from "../../Components/project/MyTaskView";
import AddTaskDrawer from "../../Components/project/AddTaskDrawer";

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

  if (projectLoading) {
    return (
      <div className="px-4 py-2">
        <div 
          className="p-4 sm:p-6 lg:p-8 rounded-xl"
          style={{ backgroundColor: selectedTheme.colors.background }}
        >
          <div className="flex items-center justify-center h-64">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: selectedTheme.colors.primary }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 scrollbar-hide">
      <div 
        className="p-4 sm:p-6 lg:p-8 rounded-xl bg-primary"
        // style={{ backgroundColor: '#f9f7f3' }}
      >
        <ProjectHeader project={project} />
        
        <TabNavigation 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddTask={() => setShowModal(true)}
        />
        
        <div className="min-h-screen">
          {renderTabContent()}
        </div>
        
        <AddTaskDrawer
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateTask}
        />
      </div>
    </div>
  );
};

export default ProjectDetail;
