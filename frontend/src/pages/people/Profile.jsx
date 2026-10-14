import { useEffect, useState } from "react";
import {
  MapPin,
  Clock,
  Mail,
  Briefcase,
  Phone,
  GraduationCap,
  Calendar,
  Users,
  Building2,
  Globe,
  FileText,
  Award,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import api from "../../axios";
import { FiCamera, FiEdit2 } from "react-icons/fi";
import { toast } from "react-toastify";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import Loader from "../../components/ui/Loader";
import { UserCircleIcon } from "@heroicons/react/24/solid";

const EASE = [0.16, 1, 0.3, 1];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
};
import { Image } from "antd";

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

  const handleAvatarUpload = async (e) => {
    if (targetUserId) return;
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size must be less than 25MB");
      return;
    }

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

  const handleCoverUpload = async (e) => {
    if (targetUserId) return;
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size must be less than 25MB");
      return;
    }

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
    <div className="fixed inset-0 flex items-center justify-center bg-surface z-50">
      <Loader size="xl" text="Loading profile..." />
    </div>
  );

  if (!user) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
          <UserCircleIcon className="text-muted text-3xl" />
        </div>
        <p className="text-muted text-sm font-medium">No user data available</p>
      </div>
    </div>
  );

  const profileStats = [
    { icon: Building2, label: "Department", value: user?.department?.name || "N/A", accent: "#6366F1" },
    { icon: Briefcase, label: "Designation", value: user.designation || user.role || "N/A", accent: "#F59E0B" },
    { icon: MapPin, label: "Location", value: user.branch || "N/A", accent: "#10B981" },
    { icon: Clock, label: "Time Zone", value: user.timeZone || "N/A", accent: "#F97316" },
    { icon: Mail, label: "Email", value: user.email, accent: "#8B5CF6" },
    { icon: Phone, label: "Work Phone", value: user.phoneNumber || "N/A", accent: "#EC4899" },
    { icon: Calendar, label: "Employee ID", value: user.empID || "N/A", accent: "#14B8A6" },
    { icon: Globe, label: "Employment", value: user.empType || "N/A", accent: "#F43F5E" },
  ];

  return (
    <PageContainer isCard={false}>
      <Motion.div variants={container} initial="hidden" animate="show" className="lm-plain-cards flex flex-col gap-4">

        {/* Hero Section */}
        <PortalHero
          label="User Profile"
          title={user.name}
          description="View personal and professional details"
          emblem={UserCircleIcon}
        />

        {/* Banner & Avatar Section */}
        <Motion.section variants={item} className="lm-card !p-0 overflow-hidden">
          <div className="relative">
            {/* Cover Image — the artwork is a 4:1 banner, so the
                wrapper tracks that exact ratio (no min/max height
                clamps): clamping made the box wider than 4:1 and
                object-cover cropped the banner top/bottom on large
                screens. */}
            <div className="h-32 md:h-auto md:aspect-[4/1] md:min-h-16 bg-gradient-to-br from-brand/20 via-brand-accent/10 to-brand-secondary/20 relative overflow-hidden">
              <img
                src={user.coverImage || "https://data3262.blob.core.windows.net/hr-portal/abidiPro/users/profile_photos/Abidi-Solutions-Banner%201_1774560002057.jpg"}
                alt="Cover"
                className="absolute inset-0 w-full h-full object-cover object-center"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/1200x300?text=No+Cover+Image' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Action Buttons */}
              {!targetUserId && (
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                  <label className="bg-surface/90 backdrop-blur-sm text-heading font-bold px-3 py-2 rounded-xl shadow-md hover:bg-surface transition-all text-xs flex items-center justify-center cursor-pointer border border-border-subtle">
                    {uploadingCover ? (
                      <Loader variant="spinner" size="sm" />
                    ) : (
                      <FiCamera size={16} className="text-white dark:text-current" />
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={handleCoverUpload}
                      disabled={uploadingCover}
                    />
                  </label>
                  <button
                    onClick={() => navigate("/people/edit-profile")}
                    className="bg-surface/90 backdrop-blur-sm text-heading font-bold px-4 py-2 rounded-xl shadow-md hover:bg-surface transition-all text-xs flex items-center gap-2 border border-border-subtle"
                  >
                    <FiEdit2 size={16} className="text-white dark:text-current" />
                    <span className="hidden sm:inline text-white dark:text-current">Edit</span>
                  </button>
                </div>
              )}
            </div>

            {/* Avatar & Name Section */}
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 relative z-10">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden ring-4 ring-surface shadow-xl bg-surface">
                    <img
                      src={user.avatar || `https://randomuser.me/api/portraits/lego/${user?._id ? user._id.length % 10 : 1}.jpg`}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {!targetUserId && (
                    <label className="absolute -bottom-2 -right-2 bg-brand text-on-brand p-2.5 rounded-xl shadow-lg cursor-pointer hover:bg-brand-accent transition-all border-2 border-surface">
                      {uploadingAvatar ? (
                        <Loader variant="spinner" size="sm" className="text-on-brand" />
                      ) : (
                        <FiCamera size={18} className="text-white dark:text-current" />
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  )}
                </div>

                {/* Name & Basic Info */}
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-muted font-bold text-sm uppercase tracking-wider mt-1">
                    {user.designation || user.role}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    {user.reportsTo?.name && (
                      <>
                        <span className="text-[10px] text-muted uppercase tracking-widest font-black">Reports to</span>
                        <span className="text-xs font-bold text-main bg-brand/10 px-2.5 py-1 rounded-full">
                          {user.reportsTo.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Motion.section>

        {/* Stats Grid */}
        <Motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {profileStats.slice(0, 4).map((stat, idx) => (
            <div
              key={idx}
              className="lm-card !p-4"
              style={{ "--lm-accent": stat.accent }}
            >
              <div className="flex items-center gap-3">
                <span className="lm-ico-emblem-square !w-10 !h-10">
                  <span className="lm-glow" aria-hidden="true" />
                  <stat.icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted truncate">
                    {stat.label}
                  </p>
                  <p className="text-sm font-bold text-heading truncate" title={stat.value}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </Motion.div>

        {/* Secondary Stats */}
        <Motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {profileStats.slice(4).map((stat, idx) => (
            <div
              key={idx}
              className="lm-card !p-4"
              style={{ "--lm-accent": stat.accent }}
            >
              <div className="flex items-center gap-3">
                <span className="lm-ico-emblem-square !w-10 !h-10">
                  <span className="lm-glow" aria-hidden="true" />
                  <stat.icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted truncate">
                    {stat.label}
                  </p>
                  <p className="text-sm font-bold text-heading truncate" title={stat.value}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </Motion.div>

        {/* About Section */}
        {user.about && (
          <Motion.section variants={item} className="lm-card !p-6" style={{ "--lm-accent": "#D4AF37" }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="lm-ico-emblem-square !w-10 !h-10">
                <span className="lm-glow" aria-hidden="true" />
                <FileText size={20} />
              </span>
              <div>
                <h3 className="text-sm font-black text-heading uppercase tracking-wider">About</h3>
                <p className="text-[10px] text-muted uppercase tracking-widest">Personal Bio</p>
              </div>
            </div>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap pl-13">
              {user.about}
            </p>
          </Motion.section>
        )}

        {/* Experience & Education Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Experience */}
          <Motion.section variants={item} className="lm-card !p-6" style={{ "--lm-accent": "#8B5CF6" }}>
            <div className="flex items-center gap-3 mb-5">
              <span className="lm-ico-emblem-square !w-10 !h-10">
                <span className="lm-glow" aria-hidden="true" />
                <Award size={20} />
              </span>
              <div>
                <h3 className="text-sm font-black text-heading uppercase tracking-wider">Experience</h3>
                <p className="text-[10px] text-muted uppercase tracking-widest">Work History</p>
              </div>
            </div>
            <div className="space-y-4">
              {user.experience?.length > 0 ? (
                user.experience.map((exp, idx) => (
                  <div key={idx} className="relative pl-5 border-l-2 border-border-subtle hover:border-brand transition-colors">
                    <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-purple-400 ring-4 ring-surface" />
                    <h4 className="font-bold text-sm text-heading">{exp.company}</h4>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">{exp.jobType}</p>
                    <p className="text-[10px] text-muted uppercase font-black tracking-wide mb-2">
                      {new Date(exp.startDate).toLocaleDateString()} – {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : "Present"}
                    </p>
                    <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center mx-auto mb-3">
                    <Briefcase size={20} className="text-muted" />
                  </div>
                  <p className="text-xs text-muted italic">No experience added</p>
                </div>
              )}
            </div>
          </Motion.section>

          {/* Education */}
          <Motion.section variants={item} className="lm-card !p-6" style={{ "--lm-accent": "#F59E0B" }}>
            <div className="flex items-center gap-3 mb-5">
              <span className="lm-ico-emblem-square !w-10 !h-10">
                <span className="lm-glow" aria-hidden="true" />
                <GraduationCap size={20} />
              </span>
              <div>
                <h3 className="text-sm font-black text-heading uppercase tracking-wider">Education</h3>
                <p className="text-[10px] text-muted uppercase tracking-widest">Academic Background</p>
              </div>
            </div>
            <div className="space-y-4">
              {user.education?.length > 0 ? (
                user.education.map((edu, idx) => (
                  <div key={idx} className="relative pl-5 border-l-2 border-border-subtle hover:border-brand transition-colors">
                    <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-surface" />
                    <h4 className="font-bold text-sm text-heading">{edu.degree}</h4>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">{edu.institution}</p>
                    <p className="text-[10px] text-muted uppercase font-black tracking-wide">
                      {edu.startYear} – {edu.endYear}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center mx-auto mb-3">
                    <GraduationCap size={20} className="text-muted" />
                  </div>
                  <p className="text-xs text-muted italic">No education added</p>
                </div>
              )}
            </div>
          </Motion.section>
        </div>

        {/* Skills Section */}
        {user.skills && user.skills.length > 0 && (
          <Motion.section variants={item} className="lm-card !p-6" style={{ "--lm-accent": "#10B981" }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="lm-ico-emblem-square !w-10 !h-10">
                <span className="lm-glow" aria-hidden="true" />
                <Users size={20} />
              </span>
              <div>
                <h3 className="text-sm font-black text-heading uppercase tracking-wider">Skills</h3>
                <p className="text-[10px] text-muted uppercase tracking-widest">Competencies</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-13">
              {user.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="lm-success-text px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Motion.section>
        )}
      </Motion.div>
    </PageContainer>
  );
}