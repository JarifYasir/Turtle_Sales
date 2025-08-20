import axios from "axios";
import { toast } from "react-toastify";

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1", // Use relative URL as fallback
  timeout: 15000, // Increased timeout
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Set to false to avoid potential CORS issues
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
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
  getAll: (params) => api.get("/workdays", { params }),
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
