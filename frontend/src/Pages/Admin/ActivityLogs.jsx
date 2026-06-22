import React, { useState } from "react";
import PageContainer from "../../components/ui/PageContainer";
import TableWithPagination from "../../components/TableWithPagination";
import CalendarNavigator from "../../components/CalendarNavigator";
import SearchBar from "../../components/SearchBar";

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
 ]);

 const logColumns = [
 { key: "timestamp", label: "TimeStamp", sortable: true },
 { key: "category", label: "Category", sortable: true },
 { key: "logs", label: "Logs", sortable: true },
 { key: "status", label: "Status", sortable: true },
 { key: "date", label: "Date", sortable: true },
 ];

 return (
 <PageContainer
 title="Activity Logs"
 subtitle="View system activities and events"
 filters={
 <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
 <div className="w-full sm:w-auto">
 <SearchBar />
 </div>
 <div className="w-full sm:w-auto flex justify-center sm:justify-start">
 <CalendarNavigator
 onPrev={() => console.log("Previous")}
 onNext={() => console.log("Next")}
 onToday={() => console.log("Today")}
 />
 </div>
 </div>
 }
 >
 <div className="bg-surface rounded-[1.5rem] border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] overflow-hidden">
 <TableWithPagination 
 columns={logColumns} 
 data={users} 
 rowsPerPage={10}
 />
 </div>
 </PageContainer>
 );
};

export default ActivityLogs;