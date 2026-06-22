import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../axios";
import ApplyLeaveModal from "../../components/LeaveModal";
import LeaveSummary from "../../components/tabs/LeaveSummary";
import LeaveRequest from "./LeaveRequest";
import AddHolidayModal from "../../components/AddHolidayModal";

import PageContainer from "../../components/ui/PageContainer";

const LeaveTracker = () => {
 const [isOpen, setIsOpen] = useState(false);
 const [holidayModal, setHolidayModal] = useState(false);
 const [adminRefresh, setAdminRefresh] = useState(0);
 const {userInfo} = useSelector(state => state.user);
 const [activeTab, setActiveTab] = useState(0);

 const handleHolidayAdded = () => {
 setAdminRefresh(i => ++i)
 };
 return (
 <PageContainer
 title="Leave Tracker"
 subtitle="Manage and track employee leaves"
 isCard={false}
 >
 <div className="w-full">
 <LeaveSummary />
 </div>

 <ApplyLeaveModal
 isOpen={isOpen}
 setIsOpen={setIsOpen}
 onLeaveAdded={() => {
 // Refresh logic can be added here if needed
 }}
 userLeaves={userInfo?.leaves || {}}
 />
 <AddHolidayModal
 isOpen={holidayModal}
 setIsOpen={setHolidayModal}
 onHolidayAdded={handleHolidayAdded}
 />
 </PageContainer>
 );
};

export default LeaveTracker;