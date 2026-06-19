import api from "../axios";

const adminDashboardApi = {
  getAdminDashboardStats: async () => {
    const response = await api.get("/admin-dashboard/stats");
    return response.data?.data || response.data;
  }
};

export default adminDashboardApi;

