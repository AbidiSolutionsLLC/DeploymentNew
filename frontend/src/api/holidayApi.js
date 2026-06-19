import api from '../axios';

const API_URL = '/holidays';

const getAllHolidays = async () => {
  const response = await api.get(API_URL);
  return response.data?.data || response.data;
};

const createHoliday = async (holidayData) => {
  const response = await api.post(API_URL, holidayData);
  return response.data?.data || response.data;
};

const holidayApi = {
  getAllHolidays,
  createHoliday,
};

export default holidayApi;