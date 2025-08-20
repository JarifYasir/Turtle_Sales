import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    JSON.parse(localStorage.getItem("auth")) || ""
  );

  useEffect(() => {
    const fetchUserData = async () => {
      if (token) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || "/api/v1"; // Use relative URL as fallback
          const response = await axios.get(`${apiUrl}/auth/dashboard`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 10000,
          });
          setUser(response.data.user);
        } catch (error) {
          console.error("Failed to fetch user data:", error);

          // Only clear token for authentication errors, not network errors
          if (error.response?.status === 401) {
            console.log("Token expired, clearing auth");
            localStorage.removeItem("auth");
            setToken("");
            setUser(null);
          } else if (error.response?.status === 429) {
            // Rate limited - don't clear token, just log it
            console.log("Rate limited on user data fetch");
          } else if (!error.response) {
            // Network error - don't clear token, server might be temporarily down
            console.log("Network error on user data fetch - keeping token");
          }
        }
      }
    };

    // Add a small delay to prevent rapid-fire requests
    const timeoutId = setTimeout(fetchUserData, 100);
    return () => clearTimeout(timeoutId);
  }, [token]);

  return (
    <UserContext.Provider value={{ user, setUser, token, setToken }}>
      {children}
    </UserContext.Provider>
  );
};
