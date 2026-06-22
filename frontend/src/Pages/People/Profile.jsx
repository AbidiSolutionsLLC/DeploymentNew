import { useEffect, useState } from "react";
import {
 MapPin,
 Clock,
 Mail,
 Briefcase,
 Phone,
 GraduationCap,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../axios";
import { FiCamera, FiEdit2 } from "react-icons/fi";
import { toast } from "react-toastify";
import PageContainer from "../../components/ui/PageContainer";

export default function Profile({ userId: propUserId }) {
 const navigate = useNavigate();
 const { id: paramUserId } = useParams();
 const [user, setUser] = useState(null);
 const [loading, setLoading] = useState(true);
 const [uploadingAvatar, setUploadingAvatar] = useState(false);
 const [uploadingCover, setUploadingCover] = useState(false);

 const targetUserId = propUserId || paramUserId;

 useEffect(() => {
 const fetchUser = async () => {
 try {
 let response;
 if (targetUserId) {
 response = await api.get(`/users/${targetUserId}`, { withCredentials: true });
 setUser(response.data.user || response.data);
 } else {
 response = await api.get("/auth/me", { withCredentials: true });
 setUser(response.data.user);
 }
 } catch (err) {
 console.error("Failed to load user profile", err);
 toast.error("Failed to load user profile");
 } finally {
 setLoading(false);
 }
 };
 fetchUser();
 }, [targetUserId]);

 // --- HANDLER: Upload Profile Picture ---
 const handleAvatarUpload = async (e) => {
 if (targetUserId) return;
 const file = e.target.files[0];
 if (!file) return;

 const formData = new FormData();
 formData.append('avatar', file);

 try {
 setUploadingAvatar(true);
 const response = await api.post(`/users/${user._id}/upload-avatar`, formData, {
 headers: { 'Content-Type': 'multipart/form-data' }
 });
 setUser(prev => ({ ...prev, avatar: response.data.avatarUrl }));
 toast.success("Profile picture updated!");
 } catch (err) {
 toast.error("Failed to update profile picture");
 } finally {
 setUploadingAvatar(false);
 }
 };

 // --- HANDLER: Upload Cover Banner ---
 const handleCoverUpload = async (e) => {
 if (targetUserId) return;
 const file = e.target.files[0];
 if (!file) return;

 const formData = new FormData();
 formData.append('coverImage', file);

 try {
 setUploadingCover(true);
 const response = await api.post(`/users/${user._id}/upload-cover`, formData, {
 headers: { 'Content-Type': 'multipart/form-data' }
 });
 setUser(prev => ({ ...prev, coverImage: response.data.coverUrl }));
 toast.success("Cover image updated!");
 } catch (err) {
 toast.error("Failed to update cover image");
 } finally {
 setUploadingCover(false);
 }
 };

 if (loading) return (
 <div className="text-center p-6 glass-card m-4">
 <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
 <p className="mt-3 text-muted text-xs font-medium uppercase tracking-wide">Loading...</p>
 </div>
 );

 if (!user) return <div className="text-red-500 text-center mt-10 text-sm">No user data available.</div>;

 const profileCards = [
 { icon: MapPin, label: "Location", value: user.branch || "N/A", bg: "bg-green-100", iconColor: "text-green-600" },
 { icon: Briefcase, label: "Department", value: user?.department?.name || "N/A", bg: "bg-yellow-100", iconColor: "text-yellow-600" },
 { icon: Clock, label: "Time Zone", value: user.timeZone || "N/A", bg: "bg-orange-100", iconColor: "text-orange-600" },
 { icon: Mail, label: "Email ID", value: user.email, bg: "bg-amber-100", iconColor: "text-amber-600" },
 { icon: Briefcase, label: "Shift", value: user.empType || "N/A", bg: "bg-indigo-100", iconColor: "text-indigo-600" },
 { icon: Phone, label: "Work phone", value: user.phoneNumber || "N/A", bg: "bg-green-100", iconColor: "text-green-600" },
 ];

 return (
 <PageContainer
 title="User Profile"
 subtitle="View your personal and professional details"
 >
 <div className="p-0 pb-8">
 
 {/* --- BANNER & AVATAR CONTAINER --- */}
 <div className="relative mb-16 md:mb-20"> {/* Add bottom margin for avatar overlap */}
 
 {/* Banner Image */}
 <div className="relative h-36 md:h-48 rounded-[1.5rem] overflow-hidden shadow-md group bg-slate-200">
 <img
 src={user.coverImage || "https://data3262.blob.core.windows.net/hr-portal/abidiPro/users/profile_photos/Abidi-Solutions-Banner%201_1774560002057.jpg"}
 alt="Banner"
 className="w-full h-full object-cover transition-transform duration-700"
 onError={(e) => {e.target.src = 'https://via.placeholder.com/1200x300?text=No+Cover+Image'}} // Fallback
 />
 <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

 {/* Top Right Actions */}
 {!targetUserId && (
 <div className="absolute top-4 right-4 flex gap-2 z-30">
 {/* Upload Banner Button */}
 <>
 <label
 htmlFor="cover-upload"
 className="bg-surface text-heading font-bold px-3 py-2 rounded-xl shadow-sm hover:bg-surface transition-all text-xs flex items-center justify-center cursor-pointer"
 title="Change Cover Image"
 >
 {uploadingCover ? (
 <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full"></div>
 ) : (
 <FiCamera size={16} />
 )}
 </label>
 <input
 id="cover-upload"
 type="file"
 accept="image/png,image/jpeg,image/jpg"
 className="hidden"
 onChange={handleCoverUpload}
 disabled={uploadingCover}
 />
 </>

 {/* Edit Profile Button */}
 <button
 onClick={() => navigate("/people/edit-profile")}
 className="bg-surface text-heading font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-surface transition-all text-xs flex items-center gap-2"
 >
 <FiEdit2 size={16} /> <span className="hidden sm:inline">Edit Profile</span>
 </button>
 </div>
 )}
 </div>

 {/* --- PROFILE PICTURE (Absolute positioned) --- */}
 <div className="absolute -bottom-12 md:-bottom-16 left-6 md:left-10 z-30">
 <div className="relative inline-block">
 <img
 src={user.avatar || `https://randomuser.me/api/portraits/lego/${user?._id ? user._id.length % 10 : 1}.jpg`}
 alt={user?.name}
 className="w-24 h-24 md:w-36 md:h-36 rounded-full object-cover shadow-xl border-[4px] border-white bg-surface"
 />

 {/* Small Circle Camera Button */}
 {!targetUserId && (
 <>
 <label
 htmlFor="avatar-upload"
 className="absolute bottom-0 right-0 bg-surface text-main p-2 md:p-2.5 rounded-full shadow-md cursor-pointer border border-border-subtle hover:bg-amber-50 hover:text-amber-600 transition-all"
 title="Change Profile Picture"
 >
 {uploadingAvatar ? (
 <div className="animate-spin h-4 w-4 md:h-5 md:w-5 border-2 border-amber-600 border-t-transparent rounded-full"></div>
 ) : (
 <FiCamera className="w-4 h-4 md:w-5 md:h-5" />
 )}
 </label>
 <input
 id="avatar-upload"
 type="file"
 accept="image/png,image/jpeg,image/jpg"
 className="hidden"
 onChange={handleAvatarUpload}
 disabled={uploadingAvatar}
 />
 </>
 )}
 </div>
 </div>
 </div>

 {/* --- INFO SECTION --- */}
 <div className="bg-surface rounded-[1.5rem] py-5 px-6 flex flex-col md:flex-row md:justify-between gap-4 shadow-sm border border-white/50 mb-6 relative z-0 mt-14 md:mt-0 pt-2 md:pt-5">
 <div className="flex flex-col min-w-0">
 <h1 className="font-black text-xl md:text-2xl text-heading tracking-tight break-words">
 {user.name}
 </h1>
 <p className="text-muted font-bold text-xs uppercase tracking-wider mt-1">{user.designation || user.role}</p>
 <p className="text-muted text-xs font-mono mt-0.5">{user.empID || "ID: --"}</p>
 </div>
 <div className="flex items-center gap-3 bg-surface px-4 py-2 rounded-2xl border border-border-subtle self-start md:self-center">
 <div>
 <p className="text-muted font-bold text-[10px] uppercase tracking-widest mb-0.5">Reporting To</p>
 <p className="font-bold text-main text-xs">
 {user.reportsTo?.name || "Not Assigned"}
 </p>
 </div>
 <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">
 {user.reportsTo?.name?.charAt(0) || "?"}
 </div>
 </div>
 </div>

 {/* Grid Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 my-6">
 {profileCards.map((item, idx) => (
 <div key={idx} className="flex items-center gap-3 p-4 bg-surface rounded-[1.2rem] shadow-sm border border-border-subtle/50 hover:shadow-md transition-all">
 <div className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-sm ${item.bg} shrink-0`}>
 <item.icon className={`h-5 w-5 ${item.iconColor}`} />
 </div>
 <div className="overflow-hidden">
 <div className="text-[10px] text-muted font-black uppercase tracking-wider truncate">{item.label}</div>
 <div className="text-sm font-bold text-main truncate" title={item.value}>{item.value}</div>
 </div>
 </div>
 ))}
 </div>

 {/* About */}
 {user.about && (
 <div className="mb-6 bg-surface rounded-[1.2rem] shadow-sm p-6 border border-border-subtle/50">
 <h3 className="font-black mb-3 text-heading text-xs uppercase tracking-widest flex items-center gap-2">
 <span className="w-1 h-4 bg-amber-500 rounded-full"></span> About
 </h3>
 <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{user.about}</p>
 </div>
 )}

 {/* Experience & Education */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Work */}
 <div className="bg-surface p-6 rounded-[1.5rem] shadow-sm border border-border-subtle/50 hover:shadow-md transition-all">
 <div className="flex items-center gap-3 mb-5 border-b border-border-subtle pb-3">
 <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
 <Briefcase size={18} />
 </div>
 <h3 className="text-sm font-black text-heading uppercase tracking-wider">Experience</h3>
 </div>
 <div className="space-y-6">
 {user.experience?.length > 0 ? (
 user.experience.map((exp, idx) => (
 <div key={idx} className="relative pl-4 border-l-2 border-border-subtle">
 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-purple-400"></div>
 <h4 className="font-bold text-sm text-heading">{exp.company}</h4>
 <p className="italic text-xs text-purple-600 font-medium mb-1">{exp.jobType}</p>
 <p className="text-[10px] text-muted uppercase font-bold tracking-wide mb-2">
 {new Date(exp.startDate).toLocaleDateString()} – {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : "Present"}
 </p>
 <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">{exp.description}</p>
 </div>
 ))
 ) : <p className="text-muted text-xs italic">No experience added.</p>}
 </div>
 </div>

 {/* Education */}
 <div className="bg-surface p-6 rounded-[1.5rem] shadow-sm border border-border-subtle/50 hover:shadow-md transition-all">
 <div className="flex items-center gap-3 mb-5 border-b border-border-subtle pb-3">
 <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
 <GraduationCap size={18} />
 </div>
 <h3 className="text-sm font-black text-heading uppercase tracking-wider">Education</h3>
 </div>
 <div className="space-y-6">
 {user.education?.length > 0 ? (
 user.education.map((edu, idx) => (
 <div key={idx} className="relative pl-4 border-l-2 border-border-subtle">
 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-amber-400"></div>
 <h4 className="font-bold text-sm text-heading">{edu.degree}</h4>
 <p className="text-xs text-muted font-medium mb-1">{edu.institution}</p>
 <p className="text-[10px] text-muted uppercase font-bold tracking-wide">
 {edu.startYear} – {edu.endYear}
 </p>
 </div>
 ))
 ) : <p className="text-muted text-xs italic">No education added.</p>}
 </div>
 </div>
 </div>
 </div>
 </PageContainer>
 );
}
