import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getBaseUrl } from '../config/api';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add a request interceptor to add the auth token and dynamic base URL
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. Set dynamic Base URL based on Tenant (Shop Name)
      const tenantId = await AsyncStorage.getItem('tenantId');
      config.baseURL = getBaseUrl(tenantId);

      // 2. Set Auth Token
      const token = await AsyncStorage.getItem('adminToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // 3. Set Tenant ID Header (optional, if your backend uses both subdomain and header)
      if (tenantId) {
        config.headers['X-Tenant-ID'] = tenantId;
      }
    } catch (error) {
      console.error('Error in request interceptor', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const login = async (username: string, password: string) => {
  const response = await api.post(API_CONFIG.ENDPOINTS.LOGIN, { username, password });
  return response.data;
};

export const verifyToken = async () => {
  const response = await api.get(API_CONFIG.ENDPOINTS.VERIFY);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get(API_CONFIG.ENDPOINTS.DASHBOARD_STATS);
  return response.data;
};

// ==================== CUSTOMERS ====================
export const getCustomers = async (page = 1, limit = 10, search = '') => {
  const response = await api.get(`${API_CONFIG.ENDPOINTS.CUSTOMERS}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  return response.data;
};

export const createCustomer = async (data: { name: string; phone: string }) => {
  const response = await api.post(API_CONFIG.ENDPOINTS.CUSTOMERS, data);
  return response.data;
};

export const updateCustomer = async (id: number, data: { name: string; phone: string }) => {
  const response = await api.put(`${API_CONFIG.ENDPOINTS.CUSTOMERS}/${id}`, data);
  return response.data;
};

export const deleteCustomer = async (id: number) => {
  const response = await api.delete(`${API_CONFIG.ENDPOINTS.CUSTOMERS}/${id}`);
  return response.data;
};

// ==================== BILLS ====================
export const getBills = async (page = 1, limit = 10, search = '') => {
  const response = await api.get(`${API_CONFIG.ENDPOINTS.BILLS}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  return response.data;
};

export const getBillById = async (id: number) => {
  const response = await api.get(`${API_CONFIG.ENDPOINTS.BILLS}/${id}`);
  return response.data;
};

export const createBill = async (data: any) => {
  const response = await api.post(API_CONFIG.ENDPOINTS.BILLS, data);
  return response.data;
};

export const updateBill = async (id: number, data: any) => {
  const response = await api.put(`${API_CONFIG.ENDPOINTS.BILLS}/${id}`, data);
  return response.data;
};

export const deleteBill = async (id: number) => {
  const response = await api.delete(`${API_CONFIG.ENDPOINTS.BILLS}/${id}`);
  return response.data;
};

export const addBillPayment = async (billId: number, data: { payment_method: string; amount: number; notes?: string }) => {
  const response = await api.post(`${API_CONFIG.ENDPOINTS.BILLS}/${billId}/payments`, data);
  return response.data;
};

export const getBillPayments = async (billId: number) => {
  const response = await api.get(`${API_CONFIG.ENDPOINTS.BILLS}/${billId}/payments`);
  return response.data;
};

export const deleteBillPayment = async (billId: number, paymentId: number) => {
  const response = await api.delete(`${API_CONFIG.ENDPOINTS.BILLS}/${billId}/payments/${paymentId}`);
  return response.data;
};

// ==================== MASTER DATA ====================
export const getServices = async () => {
  const response = await api.get(API_CONFIG.ENDPOINTS.SERVICES);
  return response.data;
};

export const getProducts = async () => {
  const response = await api.get(API_CONFIG.ENDPOINTS.PRODUCTS);
  return response.data;
};

export const getPackages = async () => {
  const response = await api.get(API_CONFIG.ENDPOINTS.PACKAGES);
  return response.data;
};

export const getEmployees = async () => {
  const response = await api.get(API_CONFIG.ENDPOINTS.EMPLOYEES);
  return response.data;
};

export const createEmployee = async (data: any) => {
  const response = await api.post(API_CONFIG.ENDPOINTS.EMPLOYEES, data);
  return response.data;
};

export const updateEmployee = async (id: number, data: any) => {
  const response = await api.put(`${API_CONFIG.ENDPOINTS.EMPLOYEES}/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id: number) => {
  const response = await api.delete(`${API_CONFIG.ENDPOINTS.EMPLOYEES}/${id}`);
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get(API_CONFIG.ENDPOINTS.CATEGORIES);
  return response.data;
};

export const getSettings = async () => {
  const response = await api.get(API_CONFIG.ENDPOINTS.SETTINGS);
  return response.data;
};

// ==================== OTHER ====================
export const getReports = async (params: { startDate?: string; endDate?: string; customerId?: string; serviceId?: string; paymentMethod?: string; page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, value.toString());
  });
  const response = await api.get(`${API_CONFIG.ENDPOINTS.REPORTS}/detailed?${queryParams.toString()}`);
  return response.data;
};

export const getRevenue = async () => {
  const response = await api.get(API_CONFIG.ENDPOINTS.REVENUE);
  return response.data;
};

export const getAppointments = async () => {
  const response = await api.get(API_CONFIG.ENDPOINTS.APPOINTMENTS);
  return response.data;
};

export const getAppointmentById = async (id: number) => {
  const response = await api.get(`${API_CONFIG.ENDPOINTS.APPOINTMENTS}/${id}`);
  return response.data;
};

export const createAppointment = async (data: any) => {
  const response = await api.post(API_CONFIG.ENDPOINTS.APPOINTMENTS, data);
  return response.data;
};

export const updateAppointment = async (id: number, data: any) => {
  const response = await api.put(`${API_CONFIG.ENDPOINTS.APPOINTMENTS}/${id}`, data);
  return response.data;
};

export const deleteAppointment = async (id: number) => {
  const response = await api.delete(`${API_CONFIG.ENDPOINTS.APPOINTMENTS}/${id}`);
  return response.data;
};

export const updateAppointmentStatus = async (id: number, status: string) => {
  const response = await api.patch(`${API_CONFIG.ENDPOINTS.APPOINTMENTS}/${id}/status`, { status });
  return response.data;
};

export const checkoutAppointment = async (id: number, data: any) => {
  const response = await api.post(`${API_CONFIG.ENDPOINTS.APPOINTMENTS}/${id}/checkout`, data);
  return response.data;
};

export const changePassword = async (password: string) => {
  const response = await api.put(`${API_CONFIG.ENDPOINTS.USERS}/change-password`, { password });
  return response.data;
};

export default api;
