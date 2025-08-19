import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";

const ManageWorkdayModal = ({
  show,
  onClose,
  workday,
  onWorkdayUpdated,
  employees,
}) => {
  const [timeslots, setTimeslots] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (workday) {
      setTimeslots(workday.timeslots || []);
      setNotes(workday.notes || "");
    }
  }, [workday]);

  const addTimeslot = () => {
    // Get the end time of the last timeslot as the start time for the new one
    const lastTimeslot = timeslots[timeslots.length - 1];
    const newStartTime = lastTimeslot ? lastTimeslot.endTime : "09:00";

    // Calculate a default end time (2 hours after start time)
    const startHour = parseInt(newStartTime.split(":")[0]);
    const startMinute = parseInt(newStartTime.split(":")[1]);
    const endHour = startHour + 2;
    const newEndTime = `${endHour.toString().padStart(2, "0")}:${startMinute
      .toString()
      .padStart(2, "0")}`;

    setTimeslots([
      ...timeslots,
      {
        startTime: newStartTime,
        endTime: newEndTime,
        maxEmployees: 2,
        assignedUsers: [],
        _id: new Date().getTime().toString(), // Temporary ID for new slots
      },
    ]);
  };

  const removeTimeslot = async (index, timeslotId) => {
    if (timeslots.length <= 1) {
      toast.error("At least one timeslot is required");
      return;
    }

    // If this is an existing timeslot (has real _id), confirm deletion
    if (timeslotId && timeslotId.length === 24) {
      if (
        !window.confirm(
          "Are you sure you want to delete this timeslot? This action cannot be undone."
        )
      ) {
        return;
      }

      try {
        const authToken = JSON.parse(localStorage.getItem("auth"));
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/workdays/${
            workday._id
          }/timeslots/${timeslotId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        toast.success("Timeslot deleted successfully");
        onWorkdayUpdated();
      } catch (err) {
        console.error("Error deleting timeslot:", err);
        toast.error("Failed to delete timeslot");
        return;
      }
    }

    // Remove from local state
    setTimeslots(timeslots.filter((_, i) => i !== index));
  };

  const updateTimeslot = (index, field, value) => {
    const updated = timeslots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    setTimeslots(updated);
  };

  const handleEmployeeToggle = (timeslotIndex, employeeId) => {
    const slot = timeslots[timeslotIndex];
    const isSelected = slot.assignedUsers?.some(
      (au) => au.user._id === employeeId
    );

    let newAssignedUsers;

    if (isSelected) {
      // Remove employee
      newAssignedUsers = slot.assignedUsers.filter(
        (au) => au.user._id !== employeeId
      );
    } else {
      // Add employee if under limit
      if (slot.assignedUsers.length >= slot.maxEmployees) {
        toast.error(
          `You can only select ${slot.maxEmployees} worker${
            slot.maxEmployees !== 1 ? "s" : ""
          } for this timeslot`
        );
        return;
      }

      const employee = employees.find((emp) => emp._id === employeeId);
      const newAssignment = {
        user: {
          _id: employeeId,
          name: employee ? employee.name : "Unknown",
        },
        notes: "",
      };

      newAssignedUsers = [...slot.assignedUsers, newAssignment];
    }

    updateTimeslot(timeslotIndex, "assignedUsers", newAssignedUsers);
  };

  const validateTimeslots = () => {
    for (let slot of timeslots) {
      if (!slot.startTime || !slot.endTime) {
        toast.error("Please fill in all start and end times");
        return false;
      }

      const start = new Date(`2000-01-01T${slot.startTime}:00`);
      const end = new Date(`2000-01-01T${slot.endTime}:00`);

      if (start >= end) {
        toast.error("End time must be after start time for all timeslots");
        return false;
      }

      if (slot.maxEmployees < 1 || slot.maxEmployees > 10) {
        toast.error("Number of workers must be between 1 and 10");
        return false;
      }
    }

    // Check for overlapping timeslots
    for (let i = 0; i < timeslots.length; i++) {
      for (let j = i + 1; j < timeslots.length; j++) {
        const slot1Start = new Date(`2000-01-01T${timeslots[i].startTime}:00`);
        const slot1End = new Date(`2000-01-01T${timeslots[i].endTime}:00`);
        const slot2Start = new Date(`2000-01-01T${timeslots[j].startTime}:00`);
        const slot2End = new Date(`2000-01-01T${timeslots[j].endTime}:00`);

        if (slot1Start < slot2End && slot1End > slot2Start) {
          toast.error("Timeslots cannot overlap");
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateTimeslots()) {
      return;
    }

    setLoading(true);
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/workdays/${workday._id}`,
        {
          timeslots,
          notes,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        toast.success("Workday updated successfully!");
        onWorkdayUpdated();
        handleClose();
      }
    } catch (err) {
      console.error("Error updating workday:", err);
      if (err.response?.data?.msg) {
        toast.error(err.response.data.msg);
      } else {
        toast.error("Failed to update workday");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
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

  if (!workday) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="modal-overlay modern-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="create-workday-modal modern-modal"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Header */}
            <div className="modal-header modern-header">
              <div className="header-content">
                <div className="header-icon">
                  <svg
                    width="28"
                    height="28"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </div>
                <div className="header-text">
                  <h1>Manage Workday</h1>
                  <p className="header-subtitle">{formatDate(workday.date)}</p>
                </div>
              </div>
              <button
                type="button"
                className="close-btn modern-close"
                onClick={handleClose}
              >
                <svg
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body modern-body">
              <div className="form-content">
                {/* Timeslots Section */}
                <div className="form-section timeslots-section">
                  <div className="section-header modern-section-header">
                    <div className="section-title">
                      <svg
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        className="section-icon"
                      >
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                        <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                      </svg>
                      <div>
                        <h3>Timeslots Configuration</h3>
                        <p className="section-subtitle">
                          Update work shifts and employee assignments
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addTimeslot}
                      className="add-timeslot-btn modern-add-btn"
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                      Add Timeslot
                    </button>
                  </div>

                  <div className="timeslots-list modern-timeslots-list">
                    {timeslots.map((slot, index) => (
                      <motion.div
                        key={slot._id || index}
                        className="timeslot-item modern-timeslot-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="timeslot-header">
                          <div className="slot-indicator">
                            <span className="slot-number">{index + 1}</span>
                          </div>
                          <div className="time-preview">
                            {slot.startTime &&
                              slot.endTime &&
                              `${formatTime(slot.startTime)} - ${formatTime(
                                slot.endTime
                              )}`}
                          </div>
                        </div>

                        <div className="timeslot-inputs modern-inputs">
                          <div className="input-group">
                            <label>Start Time</label>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) =>
                                updateTimeslot(
                                  index,
                                  "startTime",
                                  e.target.value
                                )
                              }
                              required
                              className="modern-input"
                            />
                          </div>

                          <div className="input-group">
                            <label>End Time</label>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) =>
                                updateTimeslot(index, "endTime", e.target.value)
                              }
                              required
                              className="modern-input"
                            />
                          </div>

                          <div className="input-group">
                            <label># of Workers</label>
                            <select
                              value={slot.maxEmployees}
                              onChange={(e) => {
                                const newCount = parseInt(e.target.value);
                                updateTimeslot(index, "maxEmployees", newCount);
                                // Reset assigned users if the new count is less than current assignments
                                if (slot.assignedUsers.length > newCount) {
                                  updateTimeslot(
                                    index,
                                    "assignedUsers",
                                    slot.assignedUsers.slice(0, newCount)
                                  );
                                }
                              }}
                              className="modern-select"
                            >
                              {[...Array(10)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1} {i === 0 ? "worker" : "workers"}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="input-group">
                            <label>
                              Select Workers ({slot.assignedUsers?.length || 0}/
                              {slot.maxEmployees})
                            </label>
                            <div
                              className={`custom-multiselect ${
                                slot.assignedUsers?.length === slot.maxEmployees
                                  ? "complete"
                                  : ""
                              }`}
                            >
                              {employees.map((employee) => {
                                const isSelected = slot.assignedUsers?.some(
                                  (au) => au.user._id === employee._id
                                );
                                const isDisabled =
                                  slot.assignedUsers?.length >=
                                    slot.maxEmployees && !isSelected;

                                return (
                                  <div
                                    key={employee._id}
                                    className={`employee-option ${
                                      isSelected ? "selected" : ""
                                    } ${isDisabled ? "disabled" : ""}`}
                                    onClick={() =>
                                      !isDisabled &&
                                      handleEmployeeToggle(index, employee._id)
                                    }
                                  >
                                    <div className="employee-info">
                                      <span className="employee-name">
                                        {employee.name}
                                      </span>
                                      <span className="employee-email">
                                        {employee.email}
                                      </span>
                                    </div>
                                    <div className="selection-indicator">
                                      {isSelected && (
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="currentColor"
                                        >
                                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <small className="multiselect-help-text">
                              Click to select/unselect workers. Capacity:{" "}
                              {slot.maxEmployees} worker
                              {slot.maxEmployees !== 1 ? "s" : ""}.
                            </small>
                          </div>
                        </div>

                        <div className="timeslot-actions">
                          {timeslots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTimeslot(index, slot._id)}
                              className="remove-timeslot-btn modern-remove-btn"
                              title="Remove this timeslot"
                            >
                              <svg
                                width="16"
                                height="16"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="form-section notes-section modern-notes-section">
                  <div className="section-header modern-section-header">
                    <div className="section-title">
                      <svg
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        className="section-icon"
                      >
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                      </svg>
                      <div>
                        <h3>Additional Notes</h3>
                        <p className="section-subtitle">
                          Optional instructions or special requirements
                        </p>
                      </div>
                    </div>
                  </div>

                  <textarea
                    id="workday-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any special instructions, requirements, or important information for this workday..."
                    maxLength={500}
                    rows={4}
                    className="modern-textarea"
                  />
                  <div className="char-count">
                    <small>{notes.length}/500 characters</small>
                  </div>
                </div>
              </div>

              {/* Enhanced Actions */}
              <div className="modal-actions modern-actions">
                <button
                  type="button"
                  onClick={handleClose}
                  className="cancel-btn modern-cancel-btn"
                  disabled={loading}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="create-btn modern-create-btn"
                  disabled={loading || timeslots.length === 0}
                >
                  {loading ? (
                    <>
                      <svg
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        className="spinner"
                      >
                        <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z" />
                      </svg>
                      Updating Workday...
                    </>
                  ) : (
                    <>
                      <svg
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                      </svg>
                      Update Workday
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ManageWorkdayModal;
