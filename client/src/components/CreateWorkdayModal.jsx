import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";
import "../styles/WorkdayStyles.css";

const CreateWorkdayModal = ({
  show,
  onClose,
  date,
  onWorkdayCreated,
  employees = [],
}) => {
  const [timeslots, setTimeslots] = useState([
    {
      startTime: "09:00",
      endTime: "11:00",
      maxEmployees: 2,
      assignedUsers: [],
    },
  ]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && show && !loading) {
        handleClose();
      }
    };

    if (show) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [show, loading]);

  // Prevent scroll on mobile when modal is open
  useEffect(() => {
    if (show) {
      const preventDefault = (e) => e.preventDefault();
      document.addEventListener("touchmove", preventDefault, { passive: false });
      
      // Add viewport meta tag if not present (for better mobile experience)
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(viewportMeta);
      }
      
      return () => {
        document.removeEventListener("touchmove", preventDefault);
      };
    }
  }, [show]);

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
      },
    ]);
  };

  const removeTimeslot = (index) => {
    if (timeslots.length > 1) {
      setTimeslots(timeslots.filter((_, i) => i !== index));
    }
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

      // Validate that exactly the required number of workers are assigned
      if (slot.assignedUsers.length !== slot.maxEmployees) {
        toast.error(
          `You must select exactly ${slot.maxEmployees} worker${
            slot.maxEmployees !== 1 ? "s" : ""
          } for the ${slot.startTime} - ${slot.endTime} timeslot`
        );
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
      // Debug logging
      console.log("Sending workday data:");
      console.log("Date:", date.toISOString());
      console.log("Notes:", notes);
      console.log("Timeslots:", timeslots);
      timeslots.forEach((slot, index) => {
        console.log(`Timeslot ${index}:`, {
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxEmployees: slot.maxEmployees,
          assignedUsers: slot.assignedUsers,
          assignedUsersCount: slot.assignedUsers?.length || 0,
        });
      });

      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/workdays`,
        {
          date: date.toISOString(),
          timeslots,
          notes,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        toast.success("Workday created successfully!");
        onWorkdayCreated();
        handleClose();
      }
    } catch (err) {
      console.error("Error creating workday:", err);
      if (err.response?.data?.msg) {
        toast.error(err.response.data.msg);
      } else {
        toast.error("Failed to create workday");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTimeslots([
      {
        startTime: "09:00",
        endTime: "11:00",
        maxEmployees: 2,
        assignedUsers: [],
      },
    ]);
    setNotes("");
    // Reset body overflow when closing
    document.body.style.overflow = "unset";
    onClose();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
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
            className="create-workday-modal modern-modal compact-modal"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Compact Header */}
            <div className="modal-header modern-header compact-header">
              <div className="header-content compact-header-content">
                <div className="header-text">
                  <h1>Create Workday</h1>
                  <p className="header-subtitle">{date && formatDate(date)}</p>
                </div>
              </div>
              <button
                type="button"
                className="close-btn modern-close"
                onClick={handleClose}
              >
                <svg
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body modern-body compact-body">
              <div className="form-content compact-form-content">
                {/* Timeslots Section */}
                <div className="form-section timeslots-section compact-timeslots">
                  <div className="section-header compact-section-header">
                    <div className="section-title compact-section-title">
                      <h3>Timeslots</h3>
                    </div>
                    <button
                      type="button"
                      onClick={addTimeslot}
                      className="add-timeslot-btn compact-add-btn"
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                      Add Slot
                    </button>
                  </div>

                  <div className="timeslots-list compact-timeslots-list">
                    {timeslots.map((slot, index) => (
                      <motion.div
                        key={index}
                        className="timeslot-item compact-timeslot-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="timeslot-header compact-slot-header">
                          <div className="slot-indicator compact-slot-indicator">
                            <span className="slot-number">{index + 1}</span>
                          </div>
                          <div className="time-preview compact-time-preview">
                            {slot.startTime &&
                              slot.endTime &&
                              `${formatTime(slot.startTime)} - ${formatTime(
                                slot.endTime
                              )}`}
                          </div>
                          {timeslots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTimeslot(index)}
                              className="remove-timeslot-btn compact-remove-btn"
                              title="Remove this timeslot"
                            >
                              <svg
                                width="14"
                                height="14"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                              </svg>
                            </button>
                          )}
                        </div>

                        <div className="timeslot-inputs compact-inputs">
                          <div className="input-row compact-input-row">
                            <div className="input-group compact-input-group">
                              <label>Start</label>
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
                                className="compact-input"
                              />
                            </div>

                            <div className="input-group compact-input-group">
                              <label>End</label>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) =>
                                  updateTimeslot(index, "endTime", e.target.value)
                                }
                                required
                                className="compact-input"
                              />
                            </div>

                            <div className="input-group compact-input-group">
                              <label>Workers</label>
                              <select
                                value={slot.maxEmployees}
                                onChange={(e) => {
                                  const newCount = parseInt(e.target.value);
                                  updateTimeslot(index, "maxEmployees", newCount);
                                  // Reset assigned users if the new count is less than current assignments
                                  if (slot.assignedUsers.length > newCount) {
                                    updateTimeslot(index, "assignedUsers", []);
                                  }
                                }}
                                className="compact-select"
                              >
                                {[...Array(10)].map((_, i) => (
                                  <option key={i + 1} value={i + 1}>
                                    {i + 1}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="input-group compact-input-group employee-selection">
                            <label className="compact-label">
                              Select Workers ({slot.assignedUsers?.length || 0}/
                              {slot.maxEmployees})
                            </label>
                            <div
                              className={`compact-multiselect ${
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
                                    className={`employee-option compact-employee-option ${
                                      isSelected ? "selected" : ""
                                    } ${isDisabled ? "disabled" : ""}`}
                                    onClick={() =>
                                      !isDisabled &&
                                      handleEmployeeToggle(index, employee._id)
                                    }
                                    onTouchStart={(e) => {
                                      // Prevent double-tap zoom on mobile
                                      e.preventDefault();
                                    }}
                                    role="button"
                                    tabIndex={isDisabled ? -1 : 0}
                                    onKeyDown={(e) => {
                                      if ((e.key === "Enter" || e.key === " ") && !isDisabled) {
                                        e.preventDefault();
                                        handleEmployeeToggle(index, employee._id);
                                      }
                                    }}
                                    aria-pressed={isSelected}
                                    aria-disabled={isDisabled}
                                  >
                                    <div className="employee-info compact-employee-info">
                                      <span className="employee-name compact-employee-name">
                                        {employee.name}
                                      </span>
                                    </div>
                                    <div className="selection-indicator compact-selection-indicator">
                                      {isSelected && (
                                        <svg
                                          width="14"
                                          height="14"
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
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="form-section notes-section compact-notes-section">
                  <div className="section-header compact-section-header">
                    <div className="section-title compact-section-title">
                      <h3>Notes (Optional)</h3>
                    </div>
                  </div>

                  <textarea
                    id="workday-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special instructions or requirements..."
                    maxLength={300}
                    rows={3}
                    className="compact-textarea"
                  />
                  <div className="char-count compact-char-count">
                    <small>{notes.length}/300</small>
                  </div>
                </div>
              </div>

              {/* Compact Actions */}
              <div className="modal-actions compact-actions">
                <button
                  type="button"
                  onClick={handleClose}
                  className="cancel-btn compact-cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="create-btn compact-create-btn"
                  disabled={loading || timeslots.length === 0}
                >
                  {loading ? (
                    <>
                      <svg
                        width="14"
                        height="14"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        className="spinner"
                      >
                        <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg
                        width="14"
                        height="14"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                      </svg>
                      Create Workday
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

export default CreateWorkdayModal;
