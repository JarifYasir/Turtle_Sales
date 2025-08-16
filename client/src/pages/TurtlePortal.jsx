import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";
import axios from "axios";
import "../styles/TurtlePortal.css";

const TurtlePortal = () => {
  const { user, token, setUser, setToken } = useContext(UserContext);
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      toast.warn("Please login first to access dashboard");
      return;
    }

    checkUserRole();
  }, [token, navigate]);

  const checkUserRole = async () => {
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.get(
        "http://localhost:3000/api/v1/organization",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        setIsOwner(response.data.isOwner);
      }
    } catch (err) {
      // User doesn't have an organization
      if (err.response?.status === 404) {
        toast.info("Please create or join an organization first");
        navigate("/welcome");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="turtle-portal-container loading">
        <div className="loading-spinner"></div>
        <p>Loading portal...</p>
      </div>
    );
  }

  return (
    <div className="turtle-portal-container">
      <div className="portal-header">
        <h1>Turtle Portal</h1>
        <p>Welcome to your sales management dashboard</p>
      </div>

      <div className="portal-actions">
        <div className="action-card" onClick={() => navigate("/dashboard")}>
          <div className="action-icon">👤</div>
          <h3>Profile</h3>
          <p>View and manage your profile settings</p>
        </div>

        <div
          className="action-card"
          onClick={() => navigate("/view-timeslots")}
        >
          <div className="action-icon">📅</div>
          <h3>View Schedule</h3>
          <p>Check your work schedule and team assignments</p>
        </div>

        <div className="action-card" onClick={() => navigate("/view-sales")}>
          <div className="action-icon">📊</div>
          <h3>View Sales</h3>
          <p>View sales data and performance analytics</p>
        </div>

        {isOwner && (
          <>
            <div
              className="action-card"
              onClick={() => navigate("/manage-org")}
            >
              <div className="action-icon">🏢</div>
              <h3>Manage Organization</h3>
              <p>Configure organization settings and manage team</p>
            </div>

            <div
              className="action-card"
              onClick={() => navigate("/manage-timeslots")}
            >
              <div className="action-icon">⏰</div>
              <h3>Manage Timeslots</h3>
              <p>Assign work schedules and manage team availability</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TurtlePortal;
