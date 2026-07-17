import axiosInstance from "../axios";

export const payrollApi = {
  previewPayroll: async (startDate, endDate, standardHours) => {
    try {
      const response = await axiosInstance.get('/payroll/preview', {
        params: { startDate, endDate, standardHours }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  generatePayslips: async (payload) => {
    try {
      // payload expects: { payslips: [...], periodStartDate, periodEndDate, standardHours }
      const response = await axiosInstance.post('/payroll/generate', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPayslipHistory: async () => {
    try {
      const response = await axiosInstance.get('/payroll/history');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
