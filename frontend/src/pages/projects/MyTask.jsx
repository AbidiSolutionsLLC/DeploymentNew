import React, { useState, useEffect } from "react";
import { FaSortDown } from "react-icons/fa"; 
import AddTaskDrawer from "../../components/addTaskModal";
import SearchBar from "../../components/SearchBar";
import MyTasksTable from "../../components/MyTaskTable";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyTasks, createTask, updateTask } from "../../store/taskSlice";
import { toast } from "react-toastify";

import PageContainer from "../../components/ui/PageContainer";
import useVariant from "../../components/prototype/useVariant";
import PrototypeSwitcher from "../../components/prototype/PrototypeSwitcher";
import MyTasksA from "./prototype/a/MyTasks";
import MyTasksB from "./prototype/b/MyTasks";
import MyTasksC from "./prototype/c/MyTasks";

// PROTOTYPE: `?variant=` renders one of three redesign proposals; absent → current UI.
const MyTask = () => {
 const dispatch = useDispatch();
 const { tasks, loading } = useSelector((state) => state.tasks);
 const [showModal, setShowModal] = useState(false);
 const { variant } = useVariant();

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

 const content =
  variant === "a" ? (
   <MyTasksA tasks={tasks} loading={loading} onNew={() => setShowModal(true)} />
  ) : variant === "b" ? (
   <MyTasksB tasks={tasks} loading={loading} onNew={() => setShowModal(true)} />
  ) : variant === "c" ? (
   <MyTasksC tasks={tasks} loading={loading} onNew={() => setShowModal(true)} />
  ) : (
   <PageContainer
    title="My Tasks"
    subtitle="View and manage tasks assigned to you"
    isCard={true}
    headerActions={
     <div className="flex items-center gap-3">
      <SearchBar />
      <button className="flex items-center gap-2 btn btn-primary py-2.5 px-4">
       Sort By <FaSortDown className="text-xs" />
      </button>
     </div>
    }
   >
    <div className="my-2">
     <MyTasksTable
      tasks={tasks}
      loading={loading}
      onUpdate={handleUpdateTask}
     />
    </div>
   </PageContainer>
  );

 return (
  <>
   {content}
   <AddTaskDrawer
    isOpen={showModal}
    onClose={() => setShowModal(false)}
    onSubmit={handleCreateTask}
   />
   <PrototypeSwitcher />
  </>
 );
};

export default MyTask;
