import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ViewSales.css";
import axios from "axios";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const ViewSales = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(UserContext);
  const [sales, setSales] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMySales, setShowMySales] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
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
    fetchSales();
    fetchOrganizationInfo();
  }, [token, navigate]);

  const fetchOrganizationInfo = async () => {
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
        if (response.data.isOwner) {
          setEmployees(response.data.organization.members || []);
        }
      }
    } catch (error) {
      console.error("Error fetching organization info:", error);
      toast.error("Failed to load organization information");
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.get("http://localhost:3000/api/v1/sales", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        setSales(response.data.sales);
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (!isOwner) return;

    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.delete(
        `http://localhost:3000/api/v1/sales/${saleId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

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
    let filteredSales = sales;
    if (isOwner && selectedEmployee) {
      filteredSales = sales.filter((sale) => sale.userId === selectedEmployee);
    } else if (!isOwner && showMySales) {
      filteredSales = sales.filter((sale) => sale.userId === user.id);
    }
    return groupSalesByDate(filteredSales);
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
  }, [weekDates, sales, selectedEmployee, showMySales, user]);

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

  if (loading) {
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
          Loading sales data...
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
        <div className="filter-controls">
          {isOwner ? (
            <select
              value={selectedEmployee || ""}
              onChange={(e) => setSelectedEmployee(e.target.value || null)}
              className="employee-select"
            >
              <option value="">All Sales</option>
              {employees.map((emp) => (
                <option key={emp.user} value={emp.user}>
                  {emp.name}
                </option>
              ))}
            </select>
          ) : (
            <button
              className="toggle-btn"
              onClick={() => setShowMySales(!showMySales)}
            >
              {showMySales ? "Show All Sales" : "Show My Sales"}
            </button>
          )}
        </div>
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
                    {getDisplaySales()[date.toDateString()].map((sale) => (
                      <motion.div
                        key={sale._id}
                        className="sale-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="sale-header">
                          <h3>{sale.salesRepName || "Unknown"}</h3>
                          {isOwner && (
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
                          )}
                        </div>
                        <div className="sale-time">
                          {sale.timeslot.startTime} - {sale.timeslot.endTime}
                        </div>
                        <div className="sale-info">
                          <p>
                            <strong>Client:</strong> {sale.name}
                          </p>
                          <p>
                            <strong>Price:</strong> {formatCurrency(sale.price)}
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
                    ))}
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
