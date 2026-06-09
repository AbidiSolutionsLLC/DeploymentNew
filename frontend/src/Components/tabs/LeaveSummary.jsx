import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { refreshUserData } from "../../slices/userSlice";
import { FaMoneyBillWave, FaHospital, FaEye, FaEdit } from "react-icons/fa";
import { MdEventAvailable } from "react-icons/md";
import ApplyLeaveModal from "../../Components/LeaveModal";
import EditLeaveModal from "../../Components/EditLeaveModal";
import HolidayTable from "../../Components/HolidayTable";
import ViewLeaveModal from "../../Components/ViewLeaveModal";
import api from "../../axios";
import { parseISOToLocalDate, formatDisplayDate, calculateWorkingDays } from "../../utils/dateUtils";
import { toast } from "react-toastify";
import DataTable from "../../Components/DataTable";

const LeaveSummary = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [editingLeave, setEditingLeave] = useState(null);
    const dispatch = useDispatch();
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState({
        holidays: true,
    });
    const [errorMsg, setErrorMsg] = useState("");

    const { user } = useSelector((state) => state.auth);
    const { userInfo, refreshing } = useSelector((state) => state.user);

    useEffect(() => {
        if (user?.user?._id) {
            dispatch(refreshUserData(user.user._id));
        }
    }, [dispatch, user]);

    const userData = userInfo

    // Extract data from user
    const leaveBalances = userData?.leaves || {};
    const availableLeaves = userData?.avalaibleLeaves || 0;
    const bookedLeaves = userData?.bookedLeaves || 0;
    const leaveHistory = userData?.leaveHistory || [];


    // Calculate total leaves
    const totalLeaves = Object.values(leaveBalances).reduce((sum, balance) => sum + (balance || 0), 0);

    // Refresh user data on component mount
    useEffect(() => {
        if (userData?._id) {
            dispatch(refreshUserData(userData._id));
        }
    }, [dispatch, userData?._id]);


    const fetchHolidays = async () => {
        try {
            const response = await api.get("/holidays");
            setHolidays(response.data);
            console.log("holidays", holidays);

        } catch (err) {
            console.error("Failed to fetch holidays:", err);
            setErrorMsg(err.response?.data?.message || "Failed to load holidays");
        } finally {
            setLoading(prev => ({ ...prev, holidays: false }));
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    // Create leave data cards
    const leaveData = [
        {
            icon: <FaMoneyBillWave />,
            label: "PTO (Paid Time Off)",
            available: leaveBalances.pto || 0,
            badgeColor: "bg-gradient-to-r from-green-500 to-green-600",
        },
        {
            icon: <FaHospital />,
            label: "Sick Leave",
            available: leaveBalances.sick || 0,
            badgeColor: "bg-gradient-to-r from-blue-500 to-blue-600",
        }
    ];

    // Format applied leaves
    const formatAppliedLeaves = () => {
        return leaveHistory.map(leave => ({
            id: leave.leaveId,
            startDate: formatDisplayDate(leave.startDate),
            endDate: leave.endDate,
            appliedAt: leave.appliedAt ? formatDisplayDate(leave.appliedAt) : (leave.createdAt ? formatDisplayDate(leave.createdAt) : '-'),
            leaveType: leave.leaveType || leave.type || "-",
            reason: leave.reason || "-",
            duration: leave.duration || `${calculateWorkingDays(
                parseISOToLocalDate(leave.startDate), 
                parseISOToLocalDate(leave.endDate)
            )} days`,
            status: leave.status || "Pending",
        }));
    };

    const appliedLeaves = formatAppliedLeaves();

    // Handle view leave
    const handleViewLeave = async (leave) => {
        try {
            // Fetch full leave details from API
            const response = await api.get(`/leaves/${leave.id}`);
            const fullLeaveData = response.data.data;

            setSelectedLeave({
                id: fullLeaveData._id,
                startDate: fullLeaveData.startDate,
                endDate: fullLeaveData.endDate,
                appliedAt: fullLeaveData.appliedAt || fullLeaveData.createdAt,
                name: fullLeaveData.employeeName,
                email: fullLeaveData.email,
                leaveType: fullLeaveData.leaveType,
                reason: fullLeaveData.reason || "-",
                duration: leave.duration,
                status: fullLeaveData.status,
            });
            setViewModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch leave details:", error);
            // Fallback to basic data
            setSelectedLeave({
                ...leave,
                name: user?.user?.name || user?.name,
                email: user?.user?.email || user?.email,
            });
            setViewModalOpen(true);
        }
    };

    // Handle edit leave
    const handleEditLeave = async (leave) => {
        try {
            // Fetch full leave details from API
            const response = await api.get(`/leaves/${leave.id}`);
            const fullLeaveData = response.data.data;

            setEditingLeave(fullLeaveData);
            setEditModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch leave details for editing:", error);
            toast.error("Failed to load leave for editing");
        }
    };

    // Handle leave edit submission
    const handleLeaveEdited = () => {
        // Refresh user data when a leave is edited
        if (userData?._id) {
            dispatch(refreshUserData(userData._id));
        }
        setEditModalOpen(false);
        setEditingLeave(null);
    };

    // Handle leave addition callback
    const handleLeaveAdded = () => {
        // Refresh user data when a new leave is added
        if (userData?._id) {
            dispatch(refreshUserData(userData._id));
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-4">
            {/* View Leave Modal */}
            {selectedLeave && (
                <ViewLeaveModal
                    isOpen={viewModalOpen}
                    setIsOpen={setViewModalOpen}
                    leaveData={selectedLeave}
                    isAdminPortal={false}
                />
            )}

            {/* Leave Summary Header */}
            <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-6 p-4">
                <div className="flex flex-col items-center sm:flex-row sm:justify-between sm:items-center">
                    <div>
                        <div className="text-base font-bold text-slate-800 uppercase tracking-tight mb-2">
                            Leave Summary
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-xs text-slate-700 font-medium">
                                    Available Leaves: <span className="font-bold text-slate-800">{availableLeaves}</span>
                                </span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                <span className="text-xs text-slate-700 font-medium">
                                    Booked Leaves: <span className="font-bold text-slate-800">{bookedLeaves}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {refreshing && (
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                Refreshing...
                            </div>
                        )}
                        <button
                            onClick={() => setIsOpen(true)}
                            className="px-6 py-3 bg-[#64748b] text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            Apply Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Leave Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {/* Total Leaves Card */}
                <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-slate-700 text-sm font-medium uppercase tracking-wide">Total Leaves</div>
                        <div className="text-blue-600">
                            <MdEventAvailable size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{totalLeaves}</div>
                    <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full mt-2"></div>
                </div>

                {/* Individual Leave Type Cards */}
                {leaveData.map((item, index) => (
                    <div key={index} className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-slate-700 text-sm font-medium uppercase tracking-wide">{item.label}</div>
                            <div className="text-slate-600">
                                {item.icon}
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-slate-800">{item.available}</div>
                        <div className={`h-1 w-full ${item.badgeColor} rounded-full mt-2`}></div>
                    </div>
                ))}
            </div>

            {/* Applied Leaves Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h1 className="text-base font-bold text-slate-800 uppercase tracking-tight">Applied Leaves</h1>
                    <button
                        onClick={() => userData?._id && dispatch(refreshUserData(userData._id))}
                        className="text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>

                <DataTable 
                    data={appliedLeaves}
                    loading={refreshing}
                    emptyMessage="No leave records found"
                    columns={[
                        { key: "startDate", label: "Start Date", sortable: true },
                        { key: "endDate", label: "End Date", sortable: true, render: (val) => formatDisplayDate(val) },
                        { key: "leaveType", label: "Leave Type", sortable: true },
                        { 
                            key: "reason", 
                            label: "Reason", 
                            sortable: false,
                            render: (val) => (
                                <span className="block max-w-[220px] truncate" title={val}>
                                    {val}
                                </span>
                            )
                        },
                        { key: "duration", label: "Duration", sortable: true },
                        { 
                            key: "status", 
                            label: "Status", 
                            sortable: true,
                            render: (val) => (
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide ${
                                    val === "Approved" ? "bg-green-100 text-green-800" : 
                                    val === "Rejected" ? "bg-red-100 text-red-800" : 
                                    "bg-yellow-100 text-yellow-800"
                                }`}>
                                    {val}
                                </span>
                            )
                        },
                        { key: "appliedAt", label: "Applied Date", sortable: true }
                    ]}
                    rowActions={[
                        {
                            icon: <FaEye size={12} />,
                            label: "View",
                            onClick: (row) => handleViewLeave(row)
                        },
                        {
                            icon: <FaEdit size={12} />,
                            label: "Edit",
                            onClick: (row) => {
                                if (row.status === 'Pending') {
                                    handleEditLeave(row);
                                } else {
                                    toast.info("Only pending leaves can be edited");
                                }
                            }
                        }
                    ].filter(Boolean)}
                />
            </div>

            {/* Holidays Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 mb-6">
                <h1 className="text-base font-bold text-slate-800 uppercase tracking-tight mb-4">Holidays</h1>
                {loading.holidays ? (
                    <div className="p-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
                        <p className="mt-2 text-slate-600 text-xs font-medium uppercase tracking-wide">Loading holidays...</p>
                    </div>
                ) : errorMsg ? (
                    <div className="text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm font-medium">{errorMsg}</div>
                ) : (
                    <HolidayTable holidays={holidays} searchTerm="" />
                )}
            </div>

            <ApplyLeaveModal
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                onLeaveAdded={handleLeaveAdded}
            />
            
            {editingLeave && (
                <EditLeaveModal
                    isOpen={editModalOpen}
                    setIsOpen={setEditModalOpen}
                    leaveData={editingLeave}
                    onLeaveEdited={handleLeaveEdited}
                />
            )}
        </div>
    );
};

export default LeaveSummary;