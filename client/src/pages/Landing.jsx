import React from "react";
import "../styles/Landing.css";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo.png";

const Landing = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };

  const handleLearnMore = () => {
    document.getElementById("features-section").scrollIntoView({
      behavior: "smooth",
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  const featureVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const statsVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const stepsVariants = {
    hidden: { opacity: 0, x: -30 },
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
        {/* Hero Section */}
        <motion.div className="hero-section" variants={itemVariants}>
          <motion.div className="hero-badge" variants={itemVariants}>
            <span className="badge-text">🚀 Streamline Your Sales Process</span>
          </motion.div>

          <motion.h1 className="hero-title" variants={itemVariants}>
            Organize Your
            <span className="gradient-text"> Door-to-Door Sales </span>
            Team
          </motion.h1>

          <motion.p className="hero-subtitle" variants={itemVariants}>
            One platform to manage all aspects of door-to-door sales. Record and track sales, manage reps and workers, streamline payroll operations.
          </motion.p>

          <motion.div className="hero-actions" variants={itemVariants}>
            <motion.button
              className="cta-primary"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetStarted}
            >
              Get Started
              <span className="cta-arrow">→</span>
            </motion.button>

            <motion.button
              className="cta-secondary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLearnMore}
            >
              Learn More
            </motion.button>
          </motion.div>

          <motion.div className="trust-indicators" variants={itemVariants}>
            <div className="trust-item">
              <span className="trust-icon">✓</span>
              <span>Easy to Use</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">✓</span>
              <span>Organized Workflow</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">✓</span>
              <span>Team Management</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Key Benefits Section */}
        <motion.div
          className="benefits-section"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div className="benefit-card" variants={statsVariants}>
            <div className="benefit-icon">🎯</div>
            <h3>Organized Workflow</h3>
            <p>Streamline your door-to-door sales operations</p>
          </motion.div>
          <motion.div className="benefit-card" variants={statsVariants}>
            <div className="benefit-icon">📈</div>
            <h3>Track Performance</h3>
            <p>Monitor sales activities and team progress</p>
          </motion.div>
          <motion.div className="benefit-card" variants={statsVariants}>
            <div className="benefit-icon">💼</div>
            <h3>Manage Teams</h3>
            <p>Coordinate schedules and assignments efficiently</p>
          </motion.div>
        </motion.div>

        {/* Features Section - Compact */}
        <motion.div className="features-section compact" id="features-section">
          <motion.div className="section-header" variants={itemVariants}>
            <motion.h2
              className="section-title compact"
              variants={itemVariants}
            >
              Key Features
            </motion.h2>
          </motion.div>

          <motion.div
            className="features-grid compact"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.div
              className="feature-card compact"
              variants={featureVariants}
              whileHover={{
                y: -6,
                transition: { duration: 0.3, ease: "easeOut" },
              }}
            >
              <div className="feature-icon-wrapper compact">
                <div className="feature-icon">🗓️</div>
              </div>
              <h3 className="feature-title">Schedule Management</h3>
              <p className="feature-description compact">
                Create work schedules, assign time slots, and track hours
              </p>
            </motion.div>

            <motion.div
              className="feature-card compact"
              variants={featureVariants}
              whileHover={{
                y: -6,
                transition: { duration: 0.3, ease: "easeOut" },
              }}
            >
              <div className="feature-icon-wrapper compact">
                <div className="feature-icon">📊</div>
              </div>
              <h3 className="feature-title">Sales Tracking</h3>
              <p className="feature-description compact">
                Record sales activities and monitor team performance
              </p>
            </motion.div>

            <motion.div
              className="feature-card compact"
              variants={featureVariants}
              whileHover={{
                y: -6,
                transition: { duration: 0.3, ease: "easeOut" },
              }}
            >
              <div className="feature-icon-wrapper compact">
                <div className="feature-icon">💰</div>
              </div>
              <h3 className="feature-title">Payroll & Paystubs</h3>
              <p className="feature-description compact">
                Generate paystubs based on work hours and performance
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="footer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <div className="footer-content">
          <div className="footer-logo">
            <img src={Logo} alt="Turtle Sales" className="footer-logo-img" />
            <span className="footer-logo-text">Turtle Sales</span>
          </div>
          <p className="footer-text">
            © 2025 Turtle Sales by Yasir Corp. Making door-to-door sales easy.
          </p>
        </div>
      </motion.footer>
    </div>
  );
};

export default Landing;
