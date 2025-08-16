import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ViewTimeslots.css";
import { motion } from "framer-motion";
import axios from "axios";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";

const ViewTimeslots = () => {
  const { user, token } = useContext(UserContext);
  const navigate = useNavigate();
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState(new Date());
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [selectedTimeslot, setSelectedTimeslot] = useState(null);
  const [saleForm, setSaleForm] = useState({
    name: "",
    number: "",
    address: "",
    price: "",
    details: "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchTimeslots();
  }, [token, navigate, selectedWeekStart]);

  const fetchTimeslots = async () => {
    try {
      setLoading(true);
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const startDate = new Date(selectedWeekStart);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);

      const response = await axios.get(
        `http://localhost:3000/api/v1/timeslots?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        setTimeslots(response.data.timeslots);
        setIsOwner(response.data.isOwner);
      }
    } catch (err) {
      console.error("Error fetching timeslots:", err);
      if (err.response?.status === 404) {
        toast.error("Please join an organization first");
        navigate("/welcome");
      } else {
        toast.error("Failed to load timeslots");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getWeekDates = () => {
    const dates = [];
    const start = new Date(selectedWeekStart);
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const groupTimeslotsByDate = () => {
    const grouped = {};
    timeslots.forEach((slot) => {
      const dateKey = new Date(slot.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(slot);
    });
    return grouped;
  };

  const getMyTimeslots = () => {
    return timeslots.filter(
      (slot) =>
        slot.assignedUsers &&
        slot.assignedUsers.some((assignment) => assignment.user._id === user.id)
    );
  };

  const getMyAssignmentInSlot = (slot) => {
    if (!slot.assignedUsers) return null;
    return slot.assignedUsers.find(
      (assignment) => assignment.user._id === user.id
    );
  };

  const getSlotStatus = (slot) => {
    if (!slot.assignedUsers || slot.assignedUsers.length === 0) {
      return "unassigned";
    }
    const isMySlot = slot.assignedUsers.some(
      (assignment) => assignment.user._id === user.id
    );
    if (isMySlot) {
      return "my-assignment";
    }
    return "other-assignment";
  };

  const handleTimeslotClick = (timeslot) => {
    // Get number of assigned cleaners and current sales
    const assignedCleanersCount = timeslot.assignedUsers
      ? timeslot.assignedUsers.length
      : 0;
    const currentSalesCount = timeslot.sales ? timeslot.sales.length : 0;

    // Check if there are available slots for sales
    if (currentSalesCount >= assignedCleanersCount) {
      toast.info("No more sales slots available for this timeslot");
      return;
    }

    if (assignedCleanersCount === 0) {
      toast.info(
        "No cleaners assigned to this timeslot. Sales cannot be recorded."
      );
      return;
    }

    // Check if timeslot already has maximum sales (equal to number of cleaners)
    if (currentSalesCount >= assignedCleanersCount) {
      toast.info(
        `This timeslot already has the maximum of ${assignedCleanersCount} sale${
          assignedCleanersCount !== 1 ? "s" : ""
        } (${assignedCleanersCount} cleaner${
          assignedCleanersCount !== 1 ? "s" : ""
        } assigned)`
      );
      return;
    }

    setSelectedTimeslot(timeslot);
    setShowSaleForm(true);
  };

  const handleSaleFormChange = (e) => {
    setSaleForm({
      ...saleForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();

    if (
      !saleForm.name ||
      !saleForm.number ||
      !saleForm.address ||
      !saleForm.details ||
      !saleForm.price
    ) {
      return;
    }

    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));

      const response = await axios.post(
        "http://localhost:3000/api/v1/sales",
        {
          timeslotId: selectedTimeslot._id,
          ...saleForm,
          price: parseFloat(saleForm.price),
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        toast.success("Sale recorded successfully!");
        setShowSaleForm(false);
        setSaleForm({
          name: "",
          number: "",
          address: "",
          price: "",
          details: "",
        });
        setSelectedTimeslot(null);
        fetchTimeslots();
      }
    } catch (error) {
      console.error("Error creating sale:", error);
      toast.error(error.response?.data?.msg || "Failed to record sale");
    }
  };

  const goToPreviousWeek = () => {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(selectedWeekStart.getDate() - 7);
    setSelectedWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(selectedWeekStart.getDate() + 7);
    setSelectedWeekStart(newStart);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay()
    );
    setSelectedWeekStart(startOfWeek);
  };

  if (loading) {
    return (
      <div className="timeslots-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading timeslots...</p>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates();
  const groupedTimeslots = groupTimeslotsByDate();
  const myTimeslots = getMyTimeslots();

  return (
    <div className="timeslots-container">
      <motion.div
        className="timeslots-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Sales Dashboard</h1>
        <p className="header-subtitle">Click timeslots to record sales</p>

        <div className="week-navigation">
          <button onClick={goToPreviousWeek} className="nav-btn">
            ← Previous Week
          </button>
          <button onClick={goToCurrentWeek} className="current-week-btn">
            Current Week
          </button>
          <button onClick={goToNextWeek} className="nav-btn">
            Next Week →
          </button>
        </div>

        <div className="week-display">
          <h3>
            {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
          </h3>
        </div>
      </motion.div>

      <motion.div
        className="my-assignments-summary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3>Sales Dashboard</h3>
        <p>
          <strong>{timeslots.length}</strong> available timeslots for sales
        </p>
        <p>Tap to log sale</p>
      </motion.div>

      <motion.div
        className="calendar-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {weekDates.map((date) => (
          <div key={date.toDateString()} className="day-column">
            <div className="day-header">
              <h3>{formatDate(date)}</h3>
            </div>
            <div className="day-timeslots">
              {groupedTimeslots[date.toDateString()]?.length > 0 ? (
                groupedTimeslots[date.toDateString()].map((timeslot) => {
                  const status = getSlotStatus(timeslot);
                  const salesCount = timeslot.sales ? timeslot.sales.length : 0;
                  const assignedCleanersCount = timeslot.assignedUsers
                    ? timeslot.assignedUsers.length
                    : 0;
                  const canClick =
                    timeslot.maxEmployees > 0 &&
                    salesCount < assignedCleanersCount &&
                    assignedCleanersCount > 0;

                  return (
                    <motion.div
                      key={timeslot._id}
                      className={`timeslot-card ${status} ${
                        canClick ? "clickable" : ""
                      }`}
                      whileHover={canClick ? { scale: 1.02 } : {}}
                      whileTap={canClick ? { scale: 0.98 } : {}}
                      onClick={() => canClick && handleTimeslotClick(timeslot)}
                    >
                      <div className="timeslot-time">
                        {formatTime(timeslot.startTime)} -{" "}
                        {formatTime(timeslot.endTime)}
                      </div>

                      <div className="timeslot-assignments">
                        <div
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: "bold",
                            marginBottom: "4px",
                          }}
                        >
                          Assigned Workers:
                        </div>
                        {timeslot.assignedUsers?.length > 0 ? (
                          timeslot.assignedUsers.map((assignment, idx) => (
                            <div
                              key={idx}
                              className={`assignment ${
                                assignment.user._id === user.id
                                  ? "my-assignment-user"
                                  : "other-assignment-user"
                              }`}
                            >
                              <span className="user-name">
                                {assignment.user.name}
                                {assignment.user._id === user.id && " (You)"}
                              </span>
                              {assignment.notes && (
                                <span className="assignment-notes">
                                  {assignment.notes}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="no-assignment">
                            No workers assigned
                          </div>
                        )}
                      </div>

                      {timeslot.sales && timeslot.sales.length > 0 && (
                        <div
                          style={{
                            marginTop: "8px",
                            padding: "6px",
                            backgroundColor:
                              timeslot.sales.length >= assignedCleanersCount
                                ? "#fff3cd"
                                : "#e8f5e8",
                            borderRadius: "4px",
                            border:
                              timeslot.sales.length >= assignedCleanersCount
                                ? "1px solid #ffeaa7"
                                : "1px solid #c3e6cb",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              color:
                                timeslot.sales.length >= assignedCleanersCount
                                  ? "#856404"
                                  : "#155724",
                            }}
                          >
                            💰 {timeslot.sales.length}/{assignedCleanersCount}{" "}
                            Sale
                            {timeslot.sales.length !== 1 ? "s" : ""}
                            {timeslot.sales.length >= assignedCleanersCount &&
                              " (FULL)"}
                            :
                          </div>
                          {timeslot.sales.map((sale, idx) => (
                            <div
                              key={idx}
                              style={{
                                fontSize: "0.7rem",
                                color:
                                  timeslot.sales.length >= assignedCleanersCount
                                    ? "#856404"
                                    : "#155724",
                              }}
                            >
                              ${sale.price} - {sale.name} by {sale.salesRepName}
                            </div>
                          ))}
                        </div>
                      )}

                      {(!timeslot.sales || timeslot.sales.length === 0) &&
                        !isOwner &&
                        timeslot.maxEmployees > 0 && (
                          <div
                            style={{
                              marginTop: "8px",
                              padding: "6px",
                              backgroundColor: "#d1ecf1",
                              borderRadius: "4px",
                              border: "1px solid #bee5eb",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: "bold",
                                color: "#0c5460",
                              }}
                            >
                              💰 0/{assignedCleanersCount} Sales - Available for
                              recording
                            </div>
                          </div>
                        )}

                      {canClick && salesCount < assignedCleanersCount && (
                        <div
                          style={{
                            marginTop: "8px",
                            textAlign: "center",
                            color: "#007bff",
                            fontSize: "0.8rem",
                            fontWeight: "500",
                          }}
                        >
                          ➕ Click to record sale (
                          {assignedCleanersCount - salesCount} spot
                          {assignedCleanersCount - salesCount !== 1
                            ? "s"
                            : ""}{" "}
                          left)
                        </div>
                      )}

                      {!isOwner &&
                        timeslot.maxEmployees > 0 &&
                        salesCount >= assignedCleanersCount &&
                        assignedCleanersCount > 0 && (
                          <div
                            style={{
                              marginTop: "8px",
                              textAlign: "center",
                              color: "#dc3545",
                              fontSize: "0.8rem",
                              fontWeight: "500",
                              backgroundColor: "#f8d7da",
                              padding: "4px",
                              borderRadius: "4px",
                              border: "1px solid #f5c6cb",
                            }}
                          >
                            🚫 Sales full ({assignedCleanersCount}/
                            {assignedCleanersCount})
                          </div>
                        )}
                    </motion.div>
                  );
                })
              ) : (
                <div className="no-timeslots">No available timeslots</div>
              )}
            </div>
          </div>
        ))}
      </motion.div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-color my-assignment"></div>
          <span>You are assigned as cleaner</span>
        </div>
        <div className="legend-item">
          <div className="legend-color other-assignment"></div>
          <span>Others assigned as cleaners</span>
        </div>
        <div className="legend-item">
          <div className="legend-color unassigned"></div>
          <span>No cleaners assigned</span>
        </div>
      </div>

      {/* SALE FORM MODAL */}
      {showSaleForm && selectedTimeslot && (
        <div className="sale-form-modal">
          <div className="sale-form-content">
            <div className="sale-form-header">
              <h3>Record Sale</h3>
              <p className="sale-form-date">
                {formatDate(selectedTimeslot.date)} •{" "}
                {formatTime(selectedTimeslot.startTime)} -{" "}
                {formatTime(selectedTimeslot.endTime)}
              </p>
              <p className="sale-form-rep">
                Sales Rep: <strong>{user.name}</strong>
              </p>
            </div>

            <form className="sale-form" onSubmit={handleSaleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Customer Name *"
                value={saleForm.name}
                onChange={handleSaleFormChange}
                required
              />

              <input
                type="tel"
                name="number"
                placeholder="Phone Number *"
                value={saleForm.number}
                onChange={handleSaleFormChange}
                required
              />

              <input
                type="number"
                name="price"
                placeholder="Price ($) *"
                value={saleForm.price}
                onChange={handleSaleFormChange}
                min="0"
                step="0.01"
                required
              />

              <div className="full-width">
                <textarea
                  name="address"
                  placeholder="Customer Address *"
                  value={saleForm.address}
                  onChange={handleSaleFormChange}
                  rows="2"
                  required
                />
              </div>

              <div className="full-width">
                <textarea
                  name="details"
                  placeholder="Sale Details *"
                  value={saleForm.details}
                  onChange={handleSaleFormChange}
                  rows="2"
                  required
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowSaleForm(false);
                    setSaleForm({
                      name: "",
                      number: "",
                      address: "",
                      price: "",
                      details: "",
                    });
                    setSelectedTimeslot(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Record Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewTimeslots;
