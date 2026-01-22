import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../axios";
import ApplyLeaveModal from "../../Components/LeaveModal";
import LeaveSummary from "../../Components/tabs/LeaveSummary";
import LeaveRequest from "./LeaveRequest";
import AddHolidayModal from "../../Components/AddHolidayModal";

const LeaveTracker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [holidayModal, setHolidayModal] = useState(false);
  const [adminRefresh, setAdminRefresh] = useState(0);
  const user = useSelector(state => state.auth.user);
  const [activeTab, setActiveTab] = useState(0);

  const handleHolidayAdded = () => {
    setAdminRefresh(i => ++i)
  };
  return (
    <div className="min-h-screen bg-transparent p-2">

      {/* Content Area */}
      <div className="bg-transparent">
        <LeaveSummary />
      </div>

      <ApplyLeaveModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onLeaveAdded={() => {
          // Refresh logic can be added here if needed
        }}
        userLeaves={user?.leaves || {}}
      />
      <AddHolidayModal
        isOpen={holidayModal}
        setIsOpen={setHolidayModal}
        onHolidayAdded={handleHolidayAdded}
      />
    </div>
  );
};

export default LeaveTracker;