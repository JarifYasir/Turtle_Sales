import React from "react";
import "../styles/Landing.css";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const featureVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="landing">
      <motion.div
        className="content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="hero-section" variants={itemVariants}>
          <motion.h1 className="title" variants={itemVariants}>
            Streamline Your Door-to-Door Sales Workflow
          </motion.h1>
          <motion.p className="subtitle" variants={itemVariants}>
            Organize schedules, track sales activities, and monitor performance
            — all in one centralized hub designed for modern teams.
          </motion.p>
          <motion.button
            className="get-started-btn"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGetStarted}
          >
            Get Started – Try Turtle Free
          </motion.button>
          <motion.p className="trust-indicator" variants={itemVariants}>
            No credit card required • Free 14-day trial
          </motion.p>
        </motion.div>

        <motion.div className="features-section">
          <motion.h2 className="features-title" variants={itemVariants}>
            Why Choose Turtle?
          </motion.h2>
          <motion.div className="features">
            <motion.div
              className="feature-card"
              variants={featureVariants}
              whileHover={{ scale: 1.02 }}
            >
              <div className="feature-header">
                <span className="feature-icon">🗓️</span>
                <h3>Centralized Scheduling</h3>
              </div>
              <p>
                Assign and update sales routes instantly and keep your team
                coordinated with real-time updates.
              </p>
            </motion.div>

            <motion.div
              className="feature-card"
              variants={featureVariants}
              whileHover={{ scale: 1.02 }}
            >
              <div className="feature-header">
                <span className="feature-icon">�</span>
                <h3>Recording Sales</h3>
              </div>
              <p>
                Easily track and record sales with detailed customer information
                and real-time updates for your team.
              </p>
            </motion.div>

            <motion.div
              className="feature-card"
              variants={featureVariants}
              whileHover={{ scale: 1.02 }}
            >
              <div className="feature-header">
                <span className="feature-icon">�</span>
                <h3>Generating Paystub</h3>
              </div>
              <p>
                Automatically generate detailed paystubs for employees based on
                their completed work and sales performance.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Landing;
