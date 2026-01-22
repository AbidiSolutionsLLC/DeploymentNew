import api from "../axios";

export const getAdminDashboardStats = async () => {
  const response = await api.get("/admin-dashboard/stats");
  return response.data;
};

