import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FiUser,
  FiCalendar,
  FiBarChart2,
  FiHome,
  FiClock,
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
  FiArrowRight,
  FiLogOut,
} from "react-icons/fi";
import "../styles/TurtlePortal.css";
import LoadingSpinner from "../components/LoadingComponents";

const TurtlePortal = () => {
  const { user, token, setUser, setToken } = useContext(UserContext);
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    checkUserRole();
  }, [token, navigate]);

  const checkUserRole = async () => {
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/organization`,
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

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("auth");
    localStorage.removeItem("user");

    // Clear context state
    setUser(null);
    setToken(null);

    // Show success message
    toast.success("Logged out successfully");

    // Redirect to login page
    navigate("/login");
  };

  if (loading) {
    return (
      <LoadingSpinner
        size="large"
        text="Loading portal..."
        variant="turtle"
        fullScreen={false}
      />
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const employeeActions = [
    {
      icon: FiUser,
      title: "Profile",
      description: "View and manage your profile settings",
      route: "/dashboard",
      color: "blue",
    },
    {
      icon: FiCalendar,
      title: "Track Sales",
      description: "Record and track your daily sales activities",
      route: "/track-sales",
      color: "green",
    },
    {
      icon: FiBarChart2,
      title: "View Sales",
      description: "Analyze your sales performance and metrics",
      route: "/view-sales",
      color: "purple",
    },
    {
      icon: FiTrendingUp,
      title: "Leaderboard",
      description: "View team performance rankings and achievements",
      route: "/sales-leaderboard",
      color: "orange",
    },
  ];

  const managerActions = [
    {
      icon: FiHome,
      title: "Manage Organization",
      description: "Configure organization settings and manage team",
      route: "/manage-org",
      color: "orange",
    },
    {
      icon: FiClock,
      title: "Manage Timeslots",
      description: "Assign work schedules and manage team availability",
      route: "/manage-timeslots",
      color: "teal",
    },
    {
      icon: FiDollarSign,
      title: "Employee Paystub",
      description: "Manage and view employee payroll information",
      route: "/employee-paystub",
      color: "red",
    },
  ];

  return (
    <motion.div
      className="turtle-portal-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="portal-header" variants={cardVariants}>
        <div className="header-content">
          <div className="header-top">
            <div className="portal-brand">
              <div className="brand-icon">
                <FiTrendingUp />
              </div>
              <div className="brand-text">
                <h1>Turtle Portal</h1>
                <p className="brand-subtitle">Sales Management Platform</p>
              </div>
            </div>

            <div className="header-center">
              <div className="time-greeting">
                <h2>
                  Good{" "}
                  {new Date().getHours() < 12
                    ? "Morning"
                    : new Date().getHours() < 18
                    ? "Afternoon"
                    : "Evening"}
                </h2>
                <p>Ready to boost your sales performance</p>
              </div>
              <div className="quick-stats">
                <div className="stat-item">
                  <span className="stat-label">Role</span>
                  <span className="stat-value">
                    {isOwner ? "Manager" : "Employee"}
                  </span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-label">Today</span>
                  <span className="stat-value">
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="user-section">
              <div className="user-info">
                <div className="user-avatar">
                  <FiUser />
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.name || "User"}</span>
                  <span className="user-status">Online</span>
                </div>
              </div>
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <FiLogOut />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="portal-content">
        <motion.div className="section-header" variants={cardVariants}>
          <h2>Quick Actions</h2>
          <p>Access your most used features quickly</p>
        </motion.div>

        <motion.div className="portal-grid" variants={cardVariants}>
          {employeeActions.map((action, index) => (
            <motion.div
              key={action.title}
              className={`action-card ${action.color}`}
              onClick={() => navigate(action.route)}
              variants={cardVariants}
              whileHover={{
                y: -8,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="card-header">
                <div className={`action-icon ${action.color}`}>
                  <action.icon />
                </div>
                <FiArrowRight className="arrow-icon" />
              </div>
              <div className="card-content">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {isOwner && (
          <>
            <motion.div
              className="section-header manager-section"
              variants={cardVariants}
            >
              <h2>Manager Tools</h2>
              <p>Administrative functions for organization management</p>
            </motion.div>

            <motion.div
              className="portal-grid manager-grid"
              variants={cardVariants}
            >
              {managerActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  className={`action-card manager-card ${action.color}`}
                  onClick={() => navigate(action.route)}
                  variants={cardVariants}
                  whileHover={{
                    y: -8,
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="card-header">
                    <div className={`action-icon ${action.color}`}>
                      <action.icon />
                    </div>
                    <FiArrowRight className="arrow-icon" />
                  </div>
                  <div className="card-content">
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>
                  <div className="manager-badge">Manager</div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default TurtlePortal;
