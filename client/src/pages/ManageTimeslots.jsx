import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ManageTimeslots.css";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";
import AssignEmployeeModal from "../components/AssignEmployeeModal";

const ManageTimeslots = () => {
  const { user, token } = useContext(UserContext);
  const navigate = useNavigate();

  const [timeslots, setTimeslots] = useState([]);
  const [orgMembers, setOrgMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState(new Date());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchOrgMembers();
    generateTimeslots();
  }, [token, navigate]);

  useEffect(() => {
    if (orgMembers.length > 0) {
      fetchTimeslots();
    }
  }, [selectedWeekStart, orgMembers]);

  const fetchOrgMembers = async () => {
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.get(
        "http://localhost:3000/api/v1/organization",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        setOrgMembers(response.data.organization.members || []);
        setIsOwner(response.data.isOwner);

        if (!response.data.isOwner) {
          toast.error("Only organization owners can manage timeslots");
          navigate("/turtle-portal");
        }
      }
    } catch (err) {
      console.error("Error fetching organization:", err);
      toast.error("Failed to load organization data");
      navigate("/turtle-portal");
    }
  };

  const generateTimeslots = async () => {
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      await axios.post(
        "http://localhost:3000/api/v1/timeslots/generate",
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
    } catch (err) {
      console.error("Error generating timeslots:", err);
      // Don't show error for generation as it might just mean slots already exist
    }
  };

  const fetchTimeslots = async () => {
    try {
      setLoading(true);
      const authToken = JSON.parse(localStorage.getItem("auth"));

      const startDate = new Date(selectedWeekStart);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);

      const response = await axios.get(
        `http://localhost:3000/api/v1/timeslots?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&management=true`,
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
      toast.error("Failed to load timeslots");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSlot = async (
    timeslotId,
    userId,
    notes,
    action = "assign"
  ) => {
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));

      const response = await axios.put(
        `http://localhost:3000/api/v1/timeslots/assign/${timeslotId}`,
        { userId, notes, action },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        toast.success(response.data.msg);
        fetchTimeslots();
      }
    } catch (err) {
      console.error("Error assigning timeslot:", err);
      if (err.response?.data?.msg) {
        toast.error(err.response.data.msg);
      } else {
        toast.error("Failed to assign timeslot");
      }
    }
  };

  const handleDeleteSlot = async (timeslotId) => {
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));

      const response = await axios.delete(
        `http://localhost:3000/api/v1/timeslots/${timeslotId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        toast.success("Timeslot deleted successfully");
        fetchTimeslots();
      }
    } catch (err) {
      console.error("Error deleting timeslot:", err);
      toast.error("Failed to delete timeslot");
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
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

  const handleOpenAssignModal = (slot) => {
    setSelectedSlot(slot);
    setShowAssignModal(true);
  };

  const handleCloseAssignModal = () => {
    setSelectedSlot(null);
    setShowAssignModal(false);
  };

  if (loading) {
    return (
      <div className="manage-timeslots-container loading">
        <div className="loading-spinner"></div>
        <p>Loading timeslots...</p>
      </div>
    );
  }

  const groupedSlots = groupTimeslotsByDate();
  const weekDates = getWeekDates();

  return (
    <div className="manage-timeslots-container">
      <motion.div
        className="manage-timeslots-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Manage Work Timeslots</h1>
        <p>Assign employees to work timeslots for your organization</p>
      </motion.div>

      <motion.div
        className="week-navigation"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
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
      </motion.div>

      <motion.div
        className="timeslots-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {weekDates.map((date) => {
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
                <h3>{formatDate(date)}</h3>
              </div>

              <div className="timeslots-list">
                {daySlots.length === 0 ? (
                  <div className="no-slots">No timeslots available</div>
                ) : (
                  daySlots.map((slot) => (
                    <TimeslotCard
                      key={slot._id}
                      slot={slot}
                      onAssign={handleAssignSlot}
                      onDelete={handleDeleteSlot}
                      onOpenAssignModal={() => handleOpenAssignModal(slot)}
                      formatTime={formatTime}
                    />
                  ))
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Assignment Modal */}
      <AssignEmployeeModal
        show={showAssignModal}
        onClose={handleCloseAssignModal}
        timeslot={selectedSlot}
        fetchTimeslots={fetchTimeslots}
        employees={orgMembers.map((member) => member.user)}
        onDeleteTimeslot={handleDeleteSlot}
      />
    </div>
  );
};

const TimeslotCard = ({ slot, onAssign, onOpenAssignModal, formatTime }) => {
  const handleRemoveUser = (userId) => {
    onAssign(slot._id, userId, "", "remove");
  };

  const canAddMore =
    (slot.assignedUsers?.length || 0) < (slot.maxEmployees || 2);

  return (
    <motion.div
      className={`timeslot-card ${
        slot.assignedUsers?.length > 0 ? "assigned" : "unassigned"
      }`}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="slot-time">
        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
      </div>

      <div className="slot-capacity">
        {slot.assignedUsers?.length || 0} / {slot.maxEmployees || 2} employees
      </div>

      {slot.assignedUsers && slot.assignedUsers.length > 0 ? (
        <div className="assigned-info">
          {slot.assignedUsers.map((assignment) => (
            <div key={assignment.user._id} className="assigned-user-item">
              <div className="assigned-user">
                <strong>{assignment.user.name}</strong>
                <button
                  onClick={() => handleRemoveUser(assignment.user._id)}
                  className="remove-user-btn"
                  aria-label="Remove user"
                >
                  ×
                </button>
              </div>
              {assignment.notes && (
                <div className="slot-notes">{assignment.notes}</div>
              )}
            </div>
          ))}

          {canAddMore && (
            <button onClick={onOpenAssignModal} className="add-more-btn">
              Add Employee
            </button>
          )}
        </div>
      ) : (
        <div className="unassigned-info">
          <span className="unassigned-text">No employees assigned</span>
          <button onClick={onOpenAssignModal} className="assign-btn">
            Assign Employee
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ManageTimeslots;
