import axios from "axios";
import { toast } from "react-toastify";

// Dynamic API URL detection based on client access method
const getApiBaseURL = () => {
  // If we have an explicit environment variable, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Otherwise, dynamically determine based on current location
  const hostname = window.location.hostname;
  const port = '3000'; // Server port
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port}/api/v1`;
  } else {
    // Use the same IP as the client is accessing
    return `http://${hostname}:${port}/api/v1`;
  }
};

// Create axios instance with dynamic config
const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Log the API base URL for debugging
console.log('🌐 API Base URL:', api.defaults.baseURL);

// Test connectivity function (can be called manually if needed)
export const testConnectivity = async () => {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    console.log('🟢 Server connectivity test:', response.status, response.data);
    return true;
  } catch (error) {
    console.error('🔴 Server connectivity test failed:', {
      message: error.message,
      code: error.code,
      status: error.response?.status
    });
    return false;
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const auth = localStorage.getItem("auth");
    if (auth) {
      try {
        const token = JSON.parse(auth);
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error("Error parsing auth token:", error);
        localStorage.removeItem("auth");
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error);

    // Handle different types of errors
    if (error.code === "ECONNABORTED") {
      toast.error("Request timeout. Please check your connection.");
    } else if (error.code === "NETWORK_ERROR" || error.code === "ERR_NETWORK") {
      toast.error("Network error. Please check your internet connection.");
    } else if (!error.response) {
      // This is usually a network error, CORS error, or server is down
      const errorMessage = error.message || "Network error occurred";
      if (
        errorMessage.includes("ERR_FAILED") ||
        errorMessage.includes("fetch")
      ) {
        toast.error(
          "Unable to connect to server. Please check if the server is running."
        );
      } else {
        toast.error("Network error. Please check your internet connection.");
      }
    } else {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Only show auth error if not already on login page
          if (!window.location.pathname.includes("/login")) {
            toast.error("Session expired. Please login again.");
            localStorage.removeItem("auth");
            window.location.href = "/login";
          }
          break;
        case 403:
          toast.error(
            "Access denied. You don't have permission for this action."
          );
          break;
        case 404:
          toast.error("Requested resource not found.");
          break;
        case 429:
          toast.error("Too many requests. Please try again in a moment.");
          break;
        case 500:
          toast.error("Server error. Please try again later.");
          break;
        default:
          toast.error(
            data?.msg || data?.message || "An unexpected error occurred."
          );
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  logout: () => api.post("/auth/logout"),
  refreshToken: () => api.post("/auth/refresh"),
  dashboard: () => api.get("/auth/dashboard"),
  updateProfile: (data) => api.put("/auth/update-profile", data),
  deleteAccount: () => api.delete("/auth/delete-account"),
};

export const organizationAPI = {
  create: (orgData) => api.post("/organization", orgData),
  join: (code) => api.post("/organization/join", { code }),
  getDetails: () => api.get("/organization"),
  updateDetails: (updates) => api.put("/organization", updates),
  getMembers: () => api.get("/organization/members"),
  removeMember: (userId) => api.delete(`/organization/members/${userId}`),
};

export const timeslotAPI = {
  getAll: (params) => api.get("/timeslots", { params }),
  create: (timeslot) => api.post("/timeslots", timeslot),
  update: (id, updates) => api.put(`/timeslots/${id}`, updates),
  delete: (id) => api.delete(`/timeslots/${id}`),
  assign: (id, userData) => api.post(`/timeslots/${id}/assign`, userData),
  unassign: (id, userId) => api.delete(`/timeslots/${id}/assign/${userId}`),
};

export const workdayAPI = {
  getAll: async (params) => {
    try {
      console.log('🔄 Fetching workdays from:', api.defaults.baseURL + '/workdays');
      const response = await api.get("/workdays", { params });
      console.log('✅ Workdays response:', response.status, response.data);
      return response;
    } catch (error) {
      console.error('❌ Workdays fetch error:', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      throw error;
    }
  },
  create: (workday) => api.post("/workdays", workday),
  update: (id, updates) => api.put(`/workdays/${id}`, updates),
  delete: (id) => api.delete(`/workdays/${id}`),
};

export const salesAPI = {
  getAll: (params) => api.get("/sales", { params }),
  create: (sale) => api.post("/sales", sale),
  update: (id, updates) => api.put(`/sales/${id}`, updates),
  delete: (id) => api.delete(`/sales/${id}`),
  getStats: (params) => api.get("/sales/stats", { params }),
};

// Utility functions
export const handleApiError = (error) => {
  console.error("API Error:", error);

  if (error.response?.data?.errors) {
    // Handle validation errors
    error.response.data.errors.forEach((err) => toast.error(err));
  } else if (error.response?.data?.msg) {
    toast.error(error.response.data.msg);
  } else if (error.message) {
    toast.error(error.message);
  } else {
    toast.error("An unexpected error occurred");
  }
};

// Helper for retry logic
export const retryRequest = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, i))
      );
    }
  }
};

export default api;
