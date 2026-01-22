import React, { useState, useEffect } from "react";
import { FaSortDown } from "react-icons/fa"; 
import AddTaskDrawer from "../../Components/addTaskModal";
import SearchBar from "../../Components/SearchBar";
import MyTasksTable from "../../Components/MyTaskTable";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyTasks, createTask, updateTask } from "../../Store/taskSlice";
import { toast } from "react-toastify";

const MyTask = () => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((state) => state.tasks);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    dispatch(fetchMyTasks());
  }, [dispatch]);

  const handleCreateTask = async (taskData) => {
    try {
      await dispatch(createTask(taskData)).unwrap();
      toast.success('Task created successfully');
      setShowModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (id, updates) => {
    try {
      await dispatch(updateTask({ id, updates })).unwrap();
      toast.success('Task updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update task');
    }
  };

  const CustomTopBar = ({ openModal }) => {
    return (
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <SearchBar />
        <button className="flex items-center justify-center gap-2 bg-[#86B2AA] text-white text-sm px-4 py-2 rounded-md hover:brightness-110 w-full sm:w-auto">
          Sort By <FaSortDown className="text-xs" />
        </button>
      </div>
    );
  };

  return (
    <div className="px-4 py-2">
      <div className="p-8 rounded-xl bg-primary">
        <div className="bg-white px-8 py-4 font-semibold rounded-lg">
          My Tasks
        </div>
        <div className="my-6">
          <MyTasksTable 
            tasks={tasks} 
            loading={loading}
            onUpdate={handleUpdateTask}
          >
            <CustomTopBar openModal={() => setShowModal(true)} />
          </MyTasksTable>
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

export default MyTask;