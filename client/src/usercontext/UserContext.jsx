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
          const response = await axios.get(
            "http://localhost:3000/api/v1/dashboard",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setUser(response.data.user);
        } catch (error) {
          toast.error("Failed to fetch user data");
          // Clear invalid token
          localStorage.removeItem("auth");
          setToken("");
        }
      }
    };

    fetchUserData();
  }, [token]);

  return (
    <UserContext.Provider value={{ user, token, setUser, setToken }}>
      {children}
    </UserContext.Provider>
  );
};
