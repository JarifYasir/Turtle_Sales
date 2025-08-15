import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ManageTimeslots.css";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";

const ManageTimeslots = () => {
  const { user, token } = useContext(UserContext);
  const navigate = useNavigate();

  const [timeslots, setTimeslots] = useState([]);
  const [orgMembers, setOrgMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [assigningSlot, setAssigningSlot] = useState(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState(new Date());

  useEffect(() => {
    if (!token) {
      navigate("/login");
      toast.warn("Please login first to access this page");
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
      setAssigningSlot(timeslotId);
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
    } finally {
      setAssigningSlot(null);
    }
  };

  const handleDeleteSlot = async (timeslotId) => {
    if (!window.confirm("Are you sure you want to delete this timeslot?")) {
      return;
    }

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
      <div className="manage-timeslots-header">
        <h1>Manage Work Timeslots</h1>
        <p>Assign up to 2 employees per 2-hour work timeslot</p>
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

      <div className="timeslots-grid">
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
                      members={orgMembers}
                      onAssign={handleAssignSlot}
                      onDelete={handleDeleteSlot}
                      isAssigning={assigningSlot === slot._id}
                      formatTime={formatTime}
                    />
                  ))
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const TimeslotCard = ({
  slot,
  members,
  onAssign,
  onDelete,
  isAssigning,
  formatTime,
}) => {
  const [selectedUser, setSelectedUser] = useState("");
  const [notes, setNotes] = useState("");
  const [showAssignForm, setShowAssignForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedUser) {
      onAssign(slot._id, selectedUser, notes, "assign");
      setSelectedUser("");
      setNotes("");
      setShowAssignForm(false);
    }
  };

  const handleRemoveUser = (userId) => {
    onAssign(slot._id, userId, "", "remove");
  };

  const getAvailableMembers = () => {
    const assignedUserIds =
      slot.assignedUsers?.map((assignment) => assignment.user._id) || [];
    return members.filter(
      (member) => !assignedUserIds.includes(member.user._id)
    );
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
          {slot.assignedUsers.map((assignment, index) => (
            <div key={assignment.user._id} className="assigned-user-item">
              <div className="assigned-user">
                <strong>{assignment.user.name}</strong>
                <button
                  onClick={() => handleRemoveUser(assignment.user._id)}
                  className="remove-user-btn"
                  disabled={isAssigning}
                  title="Remove user"
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
            <button
              onClick={() => setShowAssignForm(!showAssignForm)}
              className="add-more-btn"
              disabled={isAssigning}
            >
              {showAssignForm ? "Cancel" : "Add Employee"}
            </button>
          )}
        </div>
      ) : (
        <div className="unassigned-info">
          <span className="unassigned-text">No employees assigned</span>
          <button
            onClick={() => setShowAssignForm(true)}
            className="assign-btn"
            disabled={isAssigning}
          >
            Assign Employee
          </button>
        </div>
      )}

      <AnimatePresence>
        {showAssignForm && (
          <motion.form
            className="assign-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="user-select"
              required
            >
              <option value="">Select an employee</option>
              {getAvailableMembers().map((member) => (
                <option key={member.user._id} value={member.user._id}>
                  {member.user.name}
                </option>
              ))}
            </select>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="notes-input"
              rows="2"
            />

            <div className="form-actions">
              <button
                type="submit"
                className="save-btn"
                disabled={isAssigning || !selectedUser}
              >
                {isAssigning ? "Assigning..." : "Assign"}
              </button>
              <button
                type="button"
                onClick={() => setShowAssignForm(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onDelete(slot._id)}
                className="delete-btn"
              >
                Delete Slot
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ManageTimeslots;
