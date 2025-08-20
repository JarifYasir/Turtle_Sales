import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiBarChart2,
  FiTrendingUp,
  FiUsers,
  FiArrowLeft,
  FiTarget,
  FiStar,
  FiFilter,
  FiHome,
  FiCalendar,
  FiCircle,
} from "react-icons/fi";
import "../styles/SalesLeaderboard.css";
import LoadingSpinner from "../components/LoadingComponents";

const SalesLeaderboard = () => {
  const { user, token } = useContext(UserContext);
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("totalSales"); // 'totalSales' or 'totalRevenue'
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchLeaderboardData();
  }, [token, navigate]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/sales/leaderboard`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        // Remove any potential duplicates based on user ID
        const uniqueLeaderboard = response.data.leaderboard.filter(
          (member, index, array) =>
            array.findIndex((item) => item._id === member._id) === index
        );
        setLeaderboardData(uniqueLeaderboard);
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
      toast.error("Failed to load leaderboard data");
      if (err.response?.status === 404) {
        navigate("/welcome");
      }
    } finally {
      setLoading(false);
    }
  };

  const getSortedData = () => {
    const sorted = [...leaderboardData].sort((a, b) => {
      if (sortBy === "totalSales") {
        return (b.totalSales || 0) - (a.totalSales || 0);
      } else {
        return (b.totalRevenue || 0) - (a.totalRevenue || 0);
      }
    });
    return sorted;
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setAnimationKey((prev) => prev + 1);
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <FiStar className="rank-icon gold" />;
      case 2:
        return <FiCircle className="rank-icon silver" />;
      case 3:
        return <FiTarget className="rank-icon bronze" />;
      default:
        return <span className="rank-number">{rank}</span>;
    }
  };

  const getRankClass = (rank) => {
    switch (rank) {
      case 1:
        return "gold";
      case 2:
        return "silver";
      case 3:
        return "bronze";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        size="large"
        text="Loading leaderboard..."
        variant="turtle"
        fullScreen={false}
      />
    );
  }

  const sortedData = getSortedData();

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

  const listItemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      className="leaderboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="leaderboard-header" variants={cardVariants}>
        <div className="header-content">
          <button
            className="back-button"
            onClick={() => navigate("/turtle-portal")}
          >
            <FiArrowLeft />
            <span>Back to Portal</span>
          </button>

          <div className="header-main">
            <div className="header-icon">
              <FiTrendingUp />
            </div>
            <div className="header-text">
              <h1>Sales Leaderboard</h1>
              <p>Track performance and celebrate achievements</p>
            </div>
          </div>

          <div className="header-stats">
            <div className="stat-card">
              <FiUsers className="stat-icon" />
              <div className="stat-content">
                <span className="stat-value">{leaderboardData.length}</span>
                <span className="stat-label">Team Members</span>
              </div>
            </div>
            <div className="stat-card">
              <FiTarget className="stat-icon" />
              <div className="stat-content">
                <span className="stat-value">
                  {sortedData.reduce(
                    (sum, member) => sum + (member.totalSales || 0),
                    0
                  )}
                </span>
                <span className="stat-label">Total Sales</span>
              </div>
            </div>
            <div className="stat-card">
              <FiDollarSign className="stat-icon" />
              <div className="stat-content">
                <span className="stat-value">
                  $
                  {sortedData
                    .reduce((sum, member) => sum + (member.totalRevenue || 0), 0)
                    .toLocaleString()}
                </span>
                <span className="stat-label">Total Revenue</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="leaderboard-content">
        <motion.div className="controls-section" variants={cardVariants}>
          <div className="sort-controls">
            <div className="control-label">
              <FiFilter />
              <span>Sort by:</span>
            </div>
            <div className="sort-buttons">
              <button
                className={`sort-btn ${
                  sortBy === "totalSales" ? "active" : ""
                }`}
                onClick={() => handleSortChange("totalSales")}
              >
                <FiBarChart2 />
                <span>Most Sales</span>
              </button>
              <button
                className={`sort-btn ${
                  sortBy === "totalRevenue" ? "active" : ""
                }`}
                onClick={() => handleSortChange("totalRevenue")}
              >
                <FiTrendingUp />
                <span>Highest Revenue</span>
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="leaderboard-list"
          variants={cardVariants}
          key={animationKey}
        >
          {sortedData.length > 0 ? (
            sortedData.map((member, index) => {
              const rank = index + 1;
              const isCurrentUser = member._id === user?._id;

              return (
                <motion.div
                  key={`${member._id}-${animationKey}`}
                  className={`leaderboard-item ${getRankClass(rank)} ${
                    isCurrentUser ? "current-user" : ""
                  }`}
                  variants={listItemVariants}
                  whileHover={{
                    y: -4,
                    transition: { duration: 0.2 },
                  }}
                >
                  <div className="rank-section">{getRankIcon(rank)}</div>

                  <div className="member-info">
                    <div className="member-details">
                      <h3 className="member-name">
                        {member.name}
                        {isCurrentUser && (
                          <span className="you-badge">You</span>
                        )}
                      </h3>
                      <div className="member-stats">
                        <div className="stat-item">
                          <FiBarChart2 className="stat-icon-small" />
                          <span>{member.totalSales} sales</span>
                        </div>
                        <div className="stat-item">
                          <FiDollarSign className="stat-icon-small" />
                          <span>${(member.totalRevenue || 0).toLocaleString()}</span>
                        </div>
                        {member.totalSales > 0 && (
                          <div className="stat-item">
                            <FiTrendingUp className="stat-icon-small" />
                            <span>
                              ${(member.avgSaleValue || 0).toLocaleString()} avg
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="performance-metrics">
                    <div className="primary-metric">
                      <span className="metric-value">
                        {sortBy === "totalSales"
                          ? member.totalSales || 0
                          : `$${(member.totalRevenue || 0).toLocaleString()}`}
                      </span>
                      <span className="metric-label">
                        {sortBy === "totalSales" ? "Sales" : "Revenue"}
                      </span>
                    </div>
                  </div>

                  <div className="achievement-badges">
                    {rank <= 3 && (
                      <div
                        className={`achievement-badge ${getRankClass(rank)}`}
                      >
                        {rank === 1
                          ? "👑 Champion"
                          : rank === 2
                          ? "🥈 Runner-up"
                          : "🥉 Third Place"}
                      </div>
                    )}
                    {member.totalSales >= 10 && (
                      <div className="achievement-badge milestone">
                        🎯 Sales Pro
                      </div>
                    )}
                    {member.totalRevenue >= 10000 && (
                      <div className="achievement-badge milestone">
                        💰 Revenue Star
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div className="no-data" variants={cardVariants}>
              <FiBarChart2 className="no-data-icon" />
              <h3>No sales data available</h3>
              <p>
                Sales will appear here once team members start recording sales.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SalesLeaderboard;
