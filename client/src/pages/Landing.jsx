import React from "react";
import "../styles/Landing.css";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login"); // Adjust path if needed
  };

  return (
    <div className="landing">
      <div className="content">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="title">Streamline Your Door-to-Door Sales Workflow</h1>
          <p className="subtitle">
            Organize schedules, track sales activities, and monitor performance
            — all in one centralized hub designed for modern teams.
          </p>
          <motion.button
            className="get-started-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGetStarted}
          >
            Get Started – Try Turtle Free
          </motion.button>
          <div className="features">
            <div className="feature-card">
              <span className="feature-icon">🗓️</span>
              <h3>Centralized Scheduling</h3>
              <p>
                Assign and update sales routes instantly and keep your team
                coordinated.
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📍</span>
              <h3>Live Activity Tracking</h3>
              <p>
                Monitor team progress in real time for accountability and
                results.
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📊</span>
              <h3>Performance Analytics</h3>
              <p>
                Gain insights into team and personal performance to optimize
                outcomes.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
