import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { refreshUserData } from "../../slices/userSlice";
import { FaMoneyBillWave, FaHospital } from "react-icons/fa";
import { MdEventAvailable } from "react-icons/md";
import ApplyLeaveModal from "../../Components/LeaveModal";
import HolidayTable from "../../Components/HolidayTable";
import api from "../../axios";


const LeaveSummary = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dispatch = useDispatch();
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState({
        holidays: true,
    });
    const [errorMsg, setErrorMsg] = useState("");

    const { userInfo, refreshing } = useSelector((state) => state.user);

    useEffect(() => {
        if (userInfo?._id) {
            dispatch(refreshUserData(userInfo._id));
        }
    }, [dispatch, userInfo?._id]);

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
            date: new Date(leave.startDate || leave.date || Date.now()).toLocaleDateString(),
            leaveType: leave.leaveType || leave.type || "-",
            reason: leave.reason || "-",
            duration: leave.duration || `${Math.ceil(
                (new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24) + 1
            )} days`,
            status: leave.status || "Pending",
        }));
    };

    const appliedLeaves = formatAppliedLeaves();

    // Handle leave addition callback
    const handleLeaveAdded = () => {
        // Refresh user data when a new leave is added
        if (userData?._id) {
            dispatch(refreshUserData(userData._id));
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-4">
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
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-base font-bold text-slate-800 uppercase tracking-tight">Applied Leaves</h1>
                    <button
                        onClick={() => userData?._id && dispatch(refreshUserData(userData._id))}
                        className="text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>

                {refreshing ? (
                    <div className="p-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
                        <p className="mt-2 text-slate-600 text-xs font-medium uppercase tracking-wide">Loading leaves...</p>
                    </div>
                ) : appliedLeaves.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm bg-slate-50/80 rounded-lg">
                        <div className="flex flex-col items-center gap-2">
                            <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <p className="font-medium text-slate-500">No leave records found</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-100/80 backdrop-blur-sm text-slate-800">
                                    {["Date", "Leave Type", "Reason", "Duration", "Status"].map((header, index) => (
                                        <th
                                            key={index}
                                            className={`p-4 font-semibold text-xs uppercase tracking-wide border-b border-slate-200 text-left ${index === 0 ? "rounded-tl-lg" : ""
                                                } ${index === 4 ? "rounded-tr-lg" : ""
                                                }`}
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {appliedLeaves.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 text-slate-700 font-medium">{item.date}</td>
                                        <td className="p-4 text-slate-600">{item.leaveType}</td>
                                        <td className="p-4 text-slate-600">{item.reason}</td>
                                        <td className="p-4 text-slate-700 font-medium">{item.duration}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide ${item.status === "Approved"
                                                    ? "bg-green-100 text-green-800"
                                                    : item.status === "Rejected"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
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
        </div>
    );
};

export default LeaveSummary;