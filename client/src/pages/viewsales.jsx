import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ViewSales.css";
import api from "../utils/api";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const ViewSales = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(UserContext);
  const [sales, setSales] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("none"); // "none", "rep", "worker"
  const [selectedFilter, setSelectedFilter] = useState("");
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (user) {
      fetchSales();
    }
  }, [token, navigate, user]);

  // Refetch sales when window regains focus (handles case where sales were deleted by other users)
  useEffect(() => {
    const handleFocus = () => {
      if (user && token) {
        fetchSales();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user, token]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await api.get("/sales");

      if (response.data.success) {
        // Filter out any sales with missing required data to prevent render errors
        const validSales = (response.data.sales || []).filter(
          (sale) => sale && sale._id && sale.timeslot && sale.timeslot.date
        );
        setSales(validSales);
      }
    } catch (error) {
      console.error("Error fetching sales:", error);

      // Handle specific error types
      if (error.response?.status === 404) {
        toast.error("Please join an organization first");
        navigate("/welcome");
      } else {
        toast.error("Failed to load sales data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (saleId) => {
    try {
      const response = await api.delete(`/sales/${saleId}`);

      if (response.data.success) {
        toast.success("Sale deleted successfully");
        setSales(sales.filter((sale) => sale._id !== saleId));
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Failed to delete sale");
    }
  };

  const getDisplaySales = () => {
    if (!Array.isArray(sales)) return {};

    let filteredSales = sales;

    if (filterType === "rep" && selectedFilter) {
      filteredSales = sales.filter(
        (sale) => sale && sale.salesRepName === selectedFilter
      );
    } else if (filterType === "worker" && selectedFilter) {
      filteredSales = sales.filter(
        (sale) =>
          sale && sale.timeslot?.assignedWorker?.user?.name === selectedFilter
      );
    }

    return groupSalesByDate(filteredSales);
  };

  // Get unique sales reps
  const getUniqueSalesReps = () => {
    if (!Array.isArray(sales)) return [];

    const reps = [
      ...new Set(sales.map((sale) => sale?.salesRepName).filter(Boolean)),
    ];
    return reps.sort();
  };

  // Get unique workers
  const getUniqueWorkers = () => {
    if (!Array.isArray(sales)) return [];

    const workers = [
      ...new Set(
        sales
          .map((sale) => sale?.timeslot?.assignedWorker?.user?.name)
          .filter(Boolean)
      ),
    ];
    return workers.sort();
  };

  const groupSalesByDate = (sales) => {
    const grouped = {};
    sales.forEach((sale) => {
      if (!sale.timeslot) return;
      const dateKey = new Date(sale.timeslot.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(sale);
    });
    return grouped;
  };

  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [weekStartDate]);

  // Filter week dates to only include dates with sales
  const filteredDates = useMemo(() => {
    const displaySales = getDisplaySales();
    return weekDates.filter((date) => {
      const dateKey = date.toDateString();
      return displaySales[dateKey] && displaySales[dateKey].length > 0;
    });
  }, [weekDates, sales, filterType, selectedFilter]);

  const isCurrentDay = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatTimeslot = (timeslot) => {
    if (!timeslot) return "No timeslot information";
    const date = new Date(timeslot.date);
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return `${formattedDate}, ${timeslot.startTime} - ${timeslot.endTime}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const navigateToPreviousWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() - 7);
    setWeekStartDate(newDate);
  };

  const navigateToNextWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() + 7);
    setWeekStartDate(newDate);
  };

  const navigateToCurrentWeek = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const diff = today.getDate() - day;
    setWeekStartDate(new Date(today.setDate(diff)));
  };

  // Show loading if data is loading or user is not yet available
  if (loading || (!user && token)) {
    return (
      <div className="view-sales-container">
        <motion.div
          className="sales-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Sales Overview</h1>
        </motion.div>
        <div className="loading-spinner"></div>
        <p style={{ textAlign: "center", color: "var(--gray)" }}>
          {loading ? "Loading sales data..." : "Loading user data..."}
        </p>
      </div>
    );
  }

  return (
    <div className="view-sales-container">
      <motion.div
        className="sales-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Sales Overview</h1>
      </motion.div>

      {/* Filter Controls */}
      <motion.div
        className="filter-section"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "15px",
          margin: "20px 0",
          padding: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontWeight: "500", color: "#333" }}>Filter by:</label>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setSelectedFilter("");
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px",
            }}
          >
            <option value="none">No Filter</option>
            <option value="rep">Sales Rep</option>
            <option value="worker">Worker</option>
          </select>
        </div>

        {filterType !== "none" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontWeight: "500", color: "#333" }}>
              {filterType === "rep" ? "Sales Rep:" : "Worker:"}
            </label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                fontSize: "14px",
                minWidth: "150px",
              }}
            >
              <option value="">
                All {filterType === "rep" ? "Reps" : "Workers"}
              </option>
              {filterType === "rep"
                ? getUniqueSalesReps().map((rep) => (
                    <option key={rep} value={rep}>
                      {rep}
                    </option>
                  ))
                : getUniqueWorkers().map((worker) => (
                    <option key={worker} value={worker}>
                      {worker}
                    </option>
                  ))}
            </select>
          </div>
        )}
      </motion.div>

      <motion.div
        className="sales-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="calendar-view">
          <div className="calendar-header">
            <button onClick={navigateToPreviousWeek} className="toggle-btn">
              &laquo; Previous
            </button>
            <h2>Week of {weekStartDate.toLocaleDateString()}</h2>
            <div>
              <button
                onClick={navigateToCurrentWeek}
                className="toggle-btn"
                style={{ marginRight: "0.5rem" }}
              >
                Current
              </button>
              <button onClick={navigateToNextWeek} className="toggle-btn">
                Next &raquo;
              </button>
            </div>
          </div>

          <div className="week-slider">
            {filteredDates.length > 0 ? (
              filteredDates.map((date) => (
                <div
                  key={date.toDateString()}
                  className={`day-column ${
                    isCurrentDay(date) ? "current-day" : ""
                  }`}
                >
                  <div className="day-header">
                    <h3>
                      {date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </h3>
                  </div>
                  <div className="day-sales">
                    {(getDisplaySales()[date.toDateString()] || []).map(
                      (sale) => (
                        <motion.div
                          key={sale._id}
                          className="sale-card"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="sale-header">
                            <h3>
                              Rep: {sale.salesRepName || "Unknown"}
                              {sale.timeslot?.assignedWorker && (
                                <>
                                  , Worker:{" "}
                                  {sale.timeslot.assignedWorker.user?.name ||
                                    "Unknown"}
                                </>
                              )}
                            </h3>
                            <button
                              className="delete-btn"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this sale?"
                                  )
                                ) {
                                  handleDeleteSale(sale._id);
                                }
                              }}
                              title="Delete sale"
                            >
                              ×
                            </button>
                          </div>
                          <div className="sale-time">
                            {sale.timeslot.startTime} - {sale.timeslot.endTime}
                          </div>
                          <div className="sale-info">
                            <p>
                              <strong>Client:</strong> {sale.name}
                            </p>
                            <p>
                              <strong>Price:</strong>{" "}
                              {formatCurrency(sale.price)}
                            </p>
                            <p>
                              <strong>Phone:</strong> {sale.number}
                            </p>
                            <p>
                              <strong>Address:</strong> {sale.address}
                            </p>
                            <p className="sale-details">
                              <strong>Details:</strong>{" "}
                              {sale.details || "No additional details"}
                            </p>
                          </div>
                        </motion.div>
                      )
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-sales-message">
                <p>No sales found for the selected week.</p>
                <button onClick={navigateToCurrentWeek} className="toggle-btn">
                  View Current Week
                </button>
              </div>
            )}
          </div>
        </div>

        <button className="back-btn" onClick={() => navigate("/turtle-portal")}>
          ← Back to Portal
        </button>
      </motion.div>
    </div>
  );
};

export default ViewSales;
