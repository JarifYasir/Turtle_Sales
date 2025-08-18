import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ManageTimeslots.css";
import "../styles/WorkdayStyles.css";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";
import CreateWorkdayModal from "../components/CreateWorkdayModal";
import ManageWorkdayModal from "../components/ManageWorkdayModal";

const ManageTimeslots = () => {
  const { user, token } = useContext(UserContext);
  const navigate = useNavigate();

  const [workdays, setWorkdays] = useState([]);
  const [orgMembers, setOrgMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedWorkday, setSelectedWorkday] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchOrgMembers();
  }, [token, navigate]);

  useEffect(() => {
    if (orgMembers.length > 0) {
      fetchWorkdays();
    }
  }, [selectedWeekStart, orgMembers]);

  const fetchOrgMembers = async () => {
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/organization`,
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

  const fetchWorkdays = async () => {
    try {
      setLoading(true);
      const authToken = JSON.parse(localStorage.getItem("auth"));

      const startDate = new Date(selectedWeekStart);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);

      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/workdays?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        setWorkdays(response.data.workdays);
        setIsOwner(response.data.isOwner);
      }
    } catch (err) {
      console.error("Error fetching workdays:", err);
      toast.error("Failed to load workdays");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkday = (date) => {
    setSelectedDate(date);
    setShowCreateModal(true);
  };

  const handleManageWorkday = (workday) => {
    setSelectedWorkday(workday);
    setShowManageModal(true);
  };

  const handleDeleteWorkday = async (workdayId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this entire workday? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/workdays/${workdayId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        toast.success("Workday deleted successfully");
        fetchWorkdays();
      }
    } catch (err) {
      console.error("Error deleting workday:", err);
      toast.error("Failed to delete workday");
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

  const getWorkdayByDate = (date) => {
    const dateKey = date.toDateString();
    return workdays.find(
      (workday) => new Date(workday.date).toDateString() === dateKey
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
    const startOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay()
    );
    setSelectedWeekStart(startOfWeek);
  };

  const getTotalEmployeesForDay = (workday) => {
    if (!workday || !workday.timeslots) return 0;
    return workday.timeslots.reduce(
      (total, slot) => total + (slot.assignedUsers?.length || 0),
      0
    );
  };

  const getTotalTimeslotsForDay = (workday) => {
    return workday ? workday.timeslots?.length || 0 : 0;
  };

  if (loading) {
    return (
      <div className="manage-timeslots-container loading">
        <div className="loading-spinner"></div>
        <p>Loading workdays...</p>
      </div>
    );
  }

  const weekDates = getWeekDates();

  return (
    <div className="manage-timeslots-container">
      <motion.div
        className="manage-timeslots-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Manage Workdays</h1>
        <p>
          Create and manage workdays with custom timeslots for your organization
        </p>
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
        className="workdays-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {weekDates.map((date) => {
          const workday = getWorkdayByDate(date);

          return (
            <motion.div
              key={date.toDateString()}
              className="day-column"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="day-header">
                <h3>{formatDate(date)}</h3>
                <div className="day-info">
                  {workday ? (
                    <>
                      <span className="workday-stats">
                        {getTotalTimeslotsForDay(workday)} timeslots •{" "}
                        {getTotalEmployeesForDay(workday)} employees
                      </span>
                    </>
                  ) : (
                    <span className="no-workday">No workday scheduled</span>
                  )}
                </div>
              </div>

              <div className="workday-content">
                {workday ? (
                  <WorkdayCard
                    workday={workday}
                    onManage={() => handleManageWorkday(workday)}
                    onDelete={() => handleDeleteWorkday(workday._id)}
                    formatTime={formatTime}
                  />
                ) : (
                  <div className="no-workday-card">
                    <div className="no-workday-message">
                      <p>No workday scheduled</p>
                      <button
                        onClick={() => handleCreateWorkday(date)}
                        className="create-workday-btn"
                      >
                        Create Workday
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Create Workday Modal */}
      <CreateWorkdayModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        date={selectedDate}
        onWorkdayCreated={fetchWorkdays}
        employees={orgMembers.map((member) => member.user)}
      />

      {/* Manage Workday Modal */}
      <ManageWorkdayModal
        show={showManageModal}
        onClose={() => setShowManageModal(false)}
        workday={selectedWorkday}
        onWorkdayUpdated={fetchWorkdays}
        employees={orgMembers.map((member) => member.user)}
      />
    </div>
  );
};

const WorkdayCard = ({ workday, onManage, onDelete, formatTime }) => {
  const getTotalAssignedEmployees = () => {
    return workday.timeslots.reduce(
      (total, slot) => total + (slot.assignedUsers?.length || 0),
      0
    );
  };

  const getTotalCapacity = () => {
    return workday.timeslots.reduce(
      (total, slot) => total + (slot.maxEmployees || 0),
      0
    );
  };

  const getTimeRange = () => {
    if (!workday.timeslots || workday.timeslots.length === 0)
      return "No timeslots";

    const startTimes = workday.timeslots.map((slot) => slot.startTime).sort();
    const endTimes = workday.timeslots.map((slot) => slot.endTime).sort();

    return `${formatTime(startTimes[0])} - ${formatTime(
      endTimes[endTimes.length - 1]
    )}`;
  };

  return (
    <motion.div
      className="workday-card"
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="workday-summary">
        <div className="workday-time-range">{getTimeRange()}</div>
        <div className="workday-capacity">
          {getTotalAssignedEmployees()} / {getTotalCapacity()} employees
          assigned
        </div>
        <div className="workday-slots-count">
          {workday.timeslots.length} timeslot
          {workday.timeslots.length !== 1 ? "s" : ""}
        </div>
      </div>

      {workday.notes && (
        <div className="workday-notes">
          <small>{workday.notes}</small>
        </div>
      )}

      <div className="workday-timeslots-preview">
        {workday.timeslots.slice(0, 3).map((slot) => (
          <div key={slot._id} className="timeslot-preview">
            <span className="preview-time">
              {formatTime(slot.startTime)}-{formatTime(slot.endTime)}
            </span>
            <span className="preview-capacity">
              ({slot.assignedUsers?.length || 0}/{slot.maxEmployees})
            </span>
          </div>
        ))}
        {workday.timeslots.length > 3 && (
          <div className="more-timeslots">
            +{workday.timeslots.length - 3} more
          </div>
        )}
      </div>

      <div className="workday-actions">
        <button onClick={onManage} className="manage-btn">
          Manage Workday
        </button>
        <button
          onClick={onDelete}
          className="delete-workday-btn"
          title="Delete entire workday"
        >
          Delete
        </button>
      </div>
    </motion.div>
  );
};

export default ManageTimeslots;
