import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../usercontext/UserContext";
import { motion } from "framer-motion";
import {
  FiCpu,
  FiMessageSquare,
  FiTrendingUp,
  FiBook,
  FiZap,
  FiArrowLeft,
  FiArrowRight,
} from "react-icons/fi";
import "../styles/AISalesTraining.css";
import tobiIcon from "../assets/tobi.png";

const AISalesTraining = () => {
  const { token } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!token) {
      navigate("/login");
      return;
    }
  }, [token, navigate]);

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

  const itemVariants = {
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

  const features = [
    {
      icon: FiMessageSquare,
      title: "Interactive AI Coach",
      description: "Practice sales conversations with our intelligent AI agent",
      color: "blue",
    },
    {
      icon: FiTrendingUp,
      title: "Performance Analytics",
      description: "Track your progress and identify areas for improvement",
      color: "green",
    },
    {
      icon: FiBook,
      title: "Sales Scripts & Tips",
      description: "Access proven scripts and strategies that work",
      color: "purple",
    },
    {
      icon: FiZap,
      title: "Real-time Feedback",
      description: "Get instant feedback on your pitch and techniques",
      color: "orange",
    },
  ];

  return (
    <motion.div
      className="ai-training-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="training-header" variants={itemVariants}>
        <button className="back-btn" onClick={() => navigate("/turtle-portal")}>
          <FiArrowLeft />
          <span>Back to Portal</span>
        </button>
      </motion.div>

      <motion.div className="main-cta-section" variants={itemVariants}>
        <div className="tobi-intro">
          <div className="tobi-avatar">
            <img src={tobiIcon} alt="Tobi AI" />
          </div>
          <h2>Meet Tobi</h2>
          <p className="tobi-tagline">Your Personal AI Sales Coach</p>
        </div>

        <button className="practice-btn">
          <span>Practice with Tobi Right Now!</span>
          <FiArrowRight />
        </button>

        <div className="about-tobi">
          <h3>About Tobi</h3>
          <p>
            Tobi is an advanced AI-powered sales coach designed specifically for
            door-to-door sales professionals. With years of sales knowledge and
            proven strategies built into its training, Tobi helps you practice
            real-world sales scenarios, refine your pitch, and overcome
            objections with confidence.
          </p>
          <div className="tobi-stats">
            <div className="stat-box">
              <div className="stat-icon">
                <FiMessageSquare />
              </div>
              <div className="stat-text">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Available</span>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">
                <FiTrendingUp />
              </div>
              <div className="stat-text">
                <span className="stat-number">Instant</span>
                <span className="stat-label">Feedback</span>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">
                <FiBook />
              </div>
              <div className="stat-text">
                <span className="stat-number">100+</span>
                <span className="stat-label">Scenarios</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div className="features-section" variants={containerVariants}>
        <h3 className="features-title">What You'll Learn</h3>
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className={`feature-card ${feature.color}`}
              variants={itemVariants}
              whileHover={{
                y: -8,
                transition: { duration: 0.2 },
              }}
            >
              <div className={`feature-icon ${feature.color}`}>
                <feature.icon />
              </div>
              <h4>{feature.title}</h4>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AISalesTraining;
