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

  useEffect(() => {
    if (!token) {
      navigate("/login");
      toast.warn("Please login first to access this page");
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
    timeslots.forEach(slot => {
      const dateKey = new Date(slot.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(slot);
    });
    return grouped;
  };

  const getMyTimeslots = () => {
    return timeslots.filter(slot => 
      slot.assignedUser && slot.assignedUser._id === user.id
    );
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
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    setSelectedWeekStart(startOfWeek);
  };

  if (loading) {
    return (
      <div className="view-timeslots-container loading">
        <div className="loading-spinner"></div>
        <p>Loading timeslots...</p>
      </div>
    );
  }

  const groupedSlots = groupTimeslotsByDate();
  const weekDates = getWeekDates();
  const myTimeslots = getMyTimeslots();

  return (
    <div className="view-timeslots-container">
      <div className="view-timeslots-header">
        <h1>Work Schedule</h1>
        <p>{isOwner ? "Team schedule overview" : "Your work schedule and team assignments"}</p>
      </div>

      <div className="week-navigation">
        <button onClick={goToPreviousWeek} className="nav-btn">
          ← Previous Week
        </button>
        <div className="current-week">
          <span>
            {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
          </span>
        </div>
        <button onClick={goToCurrentWeek} className="nav-btn current-btn">
          Current Week
        </button>
        <button onClick={goToNextWeek} className="nav-btn">
          Next Week →
        </button>
      </div>

      {!isOwner && (
        <div className="my-schedule-summary">
          <h3>Your Assignments This Week</h3>
          {myTimeslots.length === 0 ? (
            <p className="no-assignments">No assignments this week</p>
          ) : (
            <div className="my-timeslots">
              {myTimeslots.map(slot => (
                <div key={slot._id} className="my-timeslot">
                  <span className="slot-date">{formatDate(slot.date)}</span>
                  <span className="slot-time">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </span>
                  {slot.notes && (
                    <span className="slot-notes">{slot.notes}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="schedule-grid">
        {weekDates.map(date => {
          const dateKey = date.toDateString();
          const daySlots = groupedSlots[dateKey] || [];
          
          return (
            <motion.div
              key={dateKey}
              className="day-column"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="day-header">
                <h3>{date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</h3>
              </div>
              
              <div className="day-timeslots">
                {daySlots.length === 0 ? (
                  <div className="no-slots">No timeslots</div>
                ) : (
                  daySlots.map(slot => (
                    <div
                      key={slot._id}
                      className={`view-timeslot-card ${
                        slot.assignedUser 
                          ? slot.assignedUser._id === user.id 
                            ? 'my-assignment' 
                            : 'other-assignment'
                          : 'unassigned'
                      }`}
                    >
                      <div className="slot-time">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </div>
                      
                      {slot.assignedUser ? (
                        <div className="assigned-info">
                          <div className="assigned-user">
                            {slot.assignedUser._id === user.id ? (
                              <strong>You</strong>
                            ) : (
                              <span>{slot.assignedUser.name}</span>
                            )}
                          </div>
                          {slot.notes && (
                            <div className="slot-notes">{slot.notes}</div>
                          )}
                        </div>
                      ) : (
                        <div className="unassigned-info">
                          <span>Available</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {isOwner && (
        <div className="manage-link">
          <button 
            onClick={() => navigate("/manage-timeslots")}
            className="manage-btn"
          >
            Manage Timeslots
          </button>
        </div>
      )}
    </div>
  );
};

export default ViewTimeslots;
