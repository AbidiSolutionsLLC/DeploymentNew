import React, { useState, useEffect } from "react";
import ProjectTasksTable from "../../Components/ProjectTaskTable";
import AddTaskDrawer from "../../Components/addTaskModal";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjectById, fetchProjectTasks } from "../../Store/projectSlice";
import { createTask } from "../../Store/taskSlice";  
import { toast } from "react-toastify";
import { FaSortDown, FaPlus } from "react-icons/fa"; 
import SearchBar from "../../Components/SearchBar";    

const Project = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, tasks, loading, error } = useSelector((state) => state.projects);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchProjectTasks(id));
    }
  }, [dispatch, id]);

  const handleCreateTask = async (taskData) => {
    try {
      await dispatch(createTask({ projectId: id, taskData })).unwrap();
      toast.success('Task created successfully');
      setShowModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to create task');
    }
  };

  const CustomTopBar = ({ openModal }) => {
    return (
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <SearchBar />
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <button className="flex items-center justify-center gap-2 bg-[#86B2AA] text-white text-sm px-4 py-2 rounded-md hover:brightness-110 w-full sm:w-auto">
            Sort By <FaSortDown className="text-xs" />
          </button>
          <button
            onClick={openModal}
            className="flex items-center justify-center gap-2 bg-[#86B2AA] text-white text-sm px-4 py-2 rounded-md hover:brightness-110 w-full sm:w-auto"
          >
            <FaPlus /> Add Task
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 py-2">
      <div className="p-8 rounded-xl bg-primary">
        <div className="bg-white px-8 py-4 font-semibold rounded-lg">
          {currentProject?.name || 'Project'}
        </div>
        <div className="my-6">
          <ProjectTasksTable tasks={tasks} loading={loading}>
            <CustomTopBar openModal={() => setShowModal(true)} />
          </ProjectTasksTable>
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

export default Project;