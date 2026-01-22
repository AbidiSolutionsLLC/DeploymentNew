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
import { FiCamera } from "react-icons/fi";
import { toast } from "react-toastify";

export default function Profile({ userId: propUserId }) {
  const navigate = useNavigate();
  const { id: paramUserId } = useParams(); // Get userId from URL params if available
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Determine which userId to use: prop > param > current user from auth/me
  const targetUserId = propUserId || paramUserId;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let response;
        
        if (targetUserId) {
          // Fetch specific user by ID
          response = await api.get(`/users/${targetUserId}`, {
            withCredentials: true,
          });
          setUser(response.data.user || response.data);
        } else {
          // Fallback to current user
          response = await api.get("/auth/me", {
            withCredentials: true,
          });
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

  if (loading) {
    return (
      <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
        <p className="mt-3 text-slate-600 text-xs font-medium uppercase tracking-wide">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-red-500 text-center mt-10 text-sm">
        No user data available.
      </div>
    );
  }

  const profileCards = [
    {
      icon: MapPin,
      label: "Location",
      value: user.branch || "N/A",
      bg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Briefcase,
      label: "Department",
      value: user?.department?.name || "N/A",
      bg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      icon: Clock,
      label: "Time Zone",
      value: user.timeZone || "N/A",
      bg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: Mail,
      label: "Email ID",
      value: user.email,
      bg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Briefcase,
      label: "Shift",
      value: user.empType || "N/A",
      bg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      icon: Phone,
      label: "Work phone",
      value: user.phoneNumber || "N/A",
      bg: "bg-green-100",
      iconColor: "text-green-600",
    },
  ];

  const handleAvatarUpload = async (e) => {
    // Only allow avatar upload for current user (not when viewing others)
    if (targetUserId) {
      toast.info("You can only update your own profile picture");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploading(true);
      const response = await api.post(`/users/${user._id}/upload-avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUser(prev => ({ ...prev, avatar: response.data.avatarUrl }));
      toast.success("Profile picture updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile picture");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="overflow-hidden bg-transparent p-2 m-4 min-h-[700px]">
      {/* Banner & Edit Button */}
      <div className="relative h-28 rounded-[1.2rem] overflow-hidden shadow-md ">
        <img
          src={`https://picsum.photos/1200/200?random=${user._id}`}
          alt="Banner"
          className="w-full h-full object-cover"
        />
        {/* Only show Edit button for current user's profile */}
        {!targetUserId && (
          <button
            onClick={() => navigate("/people/edit-profile")}
            className="absolute top-4 right-4 bg-white/30 backdrop-blur-lg text-slate-800 font-medium px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 hover:scale-105 text-sm ring-1 ring-white/20"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Picture */}
      <div className="relative -mt-14 pl-6 z-5">
        <div className="relative group">
          <img
            src={user.avatar || `https://randomuser.me/api/portraits/lego/${user?._id ? user._id.length % 10 : 1}.jpg`}
            alt={user?.name || "User"}
            className="w-28 h-28 rounded-full object-cover shadow-lg border-2 border-white"
          />
          {/* Only show camera upload for current user's profile */}
          {!targetUserId && (
            <>
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <FiCamera className="text-white text-xl" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info Summary */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] py-4 pr-4 pl-6 mt-4 flex flex-wrap justify-between gap-4 shadow-sm border border-white/50 mb-6">
        <div className="flex flex-col min-w-0">
          <p className="font-bold text-slate-800 truncate text-sm uppercase tracking-tight">
            {user.empID || "ID"} - {user.name}
          </p>
          <p className="text-slate-600 truncate text-sm">{user.designation || user.role}</p>
        </div>
        <div className="flex flex-col min-w-0">
          <p className="text-slate-800 font-bold text-sm uppercase tracking-wide">Reporting to</p>
          <p className="font-medium text-slate-600 text-sm break-words">
            {user.reportsTo?.name || "—"}
          </p>
        </div>
      </div>

      {/* Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {profileCards.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-sm border border-white/50"
          >
            <div
              className={`w-11 h-11 flex items-center justify-center rounded-lg shadow-md ${item.bg}`}
            >
              <item.icon className={`h-5 w-5 ${item.iconColor}`} />
            </div>
            <div>
              <div className="text-xs text-slate-800 font-bold uppercase tracking-wide">{item.label}</div>
              <div className="text-sm text-slate-700">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* About */}
      {user.about && (
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-sm p-4 border border-white/50">
          <h3 className="font-bold mb-3 text-slate-800 text-sm uppercase tracking-wide">About</h3>
          <p className="text-sm text-slate-700">{user.about}</p>
        </div>
      )}

      {/* Work & Education */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-[1.2rem] shadow-sm border border-white/50 hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="text-purple-600 w-5 h-5" />
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">
              Work Experience
            </h3>
          </div>
          <div className="text-sm text-slate-700 space-y-4">
            {user.experience && user.experience.length > 0 ? (
              user.experience.map((exp, idx) => (
                <div key={idx} className="border-b border-slate-200 pb-3">
                  <div className="font-bold text-sm text-slate-800">
                    {exp.company}
                  </div>
                  <div className="italic text-xs text-slate-600 mt-1">{exp.jobType}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(exp.startDate).toLocaleDateString()} –{" "}
                    {exp.endDate
                      ? new Date(exp.endDate).toLocaleDateString()
                      : "Present"}
                  </div>
                  <div className="text-xs mt-2 text-slate-700">{exp.description}</div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No work experience available.</p>
            )}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-[1.2rem] shadow-sm border border-white/50 hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="text-blue-600 w-5 h-5" />
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">Education</h3>
          </div>
          <div className="text-sm text-slate-700 space-y-4">
            {user.education && user.education.length > 0 ? (
              user.education.map((edu, idx) => (
                <div key={idx} className="border-b border-slate-200 pb-3">
                  <div className="font-bold text-sm text-slate-800">
                    {edu.degree}
                  </div>
                  <div className="text-sm text-slate-700 mt-1">{edu.institution}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {edu.startYear} – {edu.endYear}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No education history available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}