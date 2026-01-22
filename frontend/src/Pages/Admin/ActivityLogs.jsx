import React, { useState } from "react";
import CreateUserModal from "../../Components/CreateUserModal";
import UserManagementTable from "../../Components/UserManagementTable";
import ActivityLogsTable from "../../Components/ActivityLogsTable";
 
const ActivityLogs = () => {
  const [users, setUsers] = useState([
  {
    "timestamp": "May 10, 2025 8:29 AM FDT",
    "category": "Notifications",
    "logs": "00.01",
    "status": "Active",
    "date": "12,5,2025"
  },
  {
    "timestamp": "May 11, 2025 2:15 PM FDT",
    "category": "System",
    "logs": "00.05",
    "status": "Inactive",
    "date": "13,5,2025"
  },
  {
    "timestamp": "May 12, 2025 9:00 AM FDT",
    "category": "API",
    "logs": "00.09",
    "status": "Active",
    "date": "14,5,2025"
  },
  {
    "timestamp": "May 13, 2025 6:45 AM FDT",
    "category": "Auth",
    "logs": "00.12",
    "status": "Pending",
    "date": "15,5,2025"
  },
  {
    "timestamp": "May 14, 2025 1:30 PM FDT",
    "category": "Security",
    "logs": "00.02",
    "status": "Active",
    "date": "16,5,2025"
  }
]
  )
 
  const [sortKey, setSortKey] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
 
  const handleCreateUser = () => setIsModalOpen(true);
 
  const handleSort = (e) => {
    const key = e.target.value;
    setSortKey(key);
    const sorted = [...users].sort((a, b) => a[key].localeCompare(b[key]));
    setUsers(sorted);
  };
 
  return (
    <div className='px-4 py-2 '>
      {/* roundercorner main Content */}
      <div className='p-8 rounded-xl bg-primary'>
      <div className='bg-white px-8 py-4 font-semibold rounded-lg'>Activity Logs</div>
       {/* attendance summary card view horizontal */}
       <div className='my-6'>
           <ActivityLogsTable  openModal={()=>setIsModalOpen(true)} users={users} />
        </div>
    </div>
 
      {/* Modal Component */}
      {/* <CreateUserModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        users={users}
        setUsers={setUsers}
      /> */}
    </div>
  );
};
 
export default ActivityLogs;
 
 