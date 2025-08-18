import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";
import AssignEmployeeModal from "./AssignEmployeeModal";

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
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTimeslot, setSelectedTimeslot] = useState(null);

  useEffect(() => {
    if (workday) {
      setTimeslots(workday.timeslots || []);
      setNotes(workday.notes || "");
    }
  }, [workday]);

  const addTimeslot = () => {
    setTimeslots([
      ...timeslots,
      {
        startTime: "12:00",
        endTime: "14:00",
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
          `http://localhost:3000/api/v1/workdays/${workday._id}/timeslots/${timeslotId}`,
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
        toast.error("Max employees must be between 1 and 10");
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
        `http://localhost:3000/api/v1/workdays/${workday._id}`,
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

  const handleAssignEmployee = (timeslot) => {
    setSelectedTimeslot({
      ...timeslot,
      _id: timeslot._id,
      workdayId: workday._id,
    });
    setShowAssignModal(true);
  };

  const handleRemoveUser = async (timeslotId, userId) => {
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      await axios.put(
        `http://localhost:3000/api/v1/workdays/${workday._id}/timeslots/${timeslotId}/assign`,
        { userId, action: "remove" },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      toast.success("Employee removed successfully");
      onWorkdayUpdated();
    } catch (err) {
      console.error("Error removing employee:", err);
      toast.error("Failed to remove employee");
    }
  };

  if (!workday) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="manage-workday-modal"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Manage Workday</h2>
              <p>{formatDate(workday.date)}</p>
              <button className="close-btn" onClick={handleClose}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Current Assignments */}
              <div className="assignments-section">
                <h3>Current Timeslots & Assignments</h3>
                <div className="current-timeslots">
                  {timeslots.map((slot, index) => (
                    <div key={slot._id || index} className="timeslot-summary">
                      <div className="timeslot-header">
                        <span className="time-range">
                          {formatTime(slot.startTime)} -{" "}
                          {formatTime(slot.endTime)}
                        </span>
                        <span className="capacity">
                          {slot.assignedUsers?.length || 0}/{slot.maxEmployees}
                        </span>
                      </div>

                      {slot.assignedUsers && slot.assignedUsers.length > 0 ? (
                        <div className="assigned-employees">
                          {slot.assignedUsers.map((assignment) => (
                            <div
                              key={assignment.user._id}
                              className="employee-assignment"
                            >
                              <span className="employee-name">
                                {assignment.user.name}
                              </span>
                              <button
                                onClick={() =>
                                  handleRemoveUser(
                                    slot._id,
                                    assignment.user._id
                                  )
                                }
                                className="remove-btn"
                                title="Remove employee"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-assignments">
                          No employees assigned
                        </div>
                      )}

                      <div className="timeslot-actions">
                        <button
                          type="button"
                          onClick={() => handleAssignEmployee(slot)}
                          className="assign-employee-btn"
                          disabled={
                            slot.assignedUsers?.length >= slot.maxEmployees
                          }
                        >
                          {slot.assignedUsers?.length >= slot.maxEmployees
                            ? "Full"
                            : "Assign Employee"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Timeslots */}
              <form onSubmit={handleSubmit}>
                <div className="timeslots-section">
                  <div className="section-header">
                    <h3>Edit Timeslots</h3>
                    <button
                      type="button"
                      onClick={addTimeslot}
                      className="add-timeslot-btn"
                    >
                      + Add Timeslot
                    </button>
                  </div>

                  <div className="timeslots-list">
                    {timeslots.map((slot, index) => (
                      <motion.div
                        key={slot._id || index}
                        className="timeslot-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="timeslot-inputs">
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
                            />
                          </div>
                          <div className="input-group">
                            <label>Max Employees</label>
                            <select
                              value={slot.maxEmployees}
                              onChange={(e) =>
                                updateTimeslot(
                                  index,
                                  "maxEmployees",
                                  parseInt(e.target.value)
                                )
                              }
                            >
                              {[...Array(10)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTimeslot(index, slot._id)}
                            className="remove-timeslot-btn"
                            title="Remove timeslot"
                          >
                            ×
                          </button>
                        </div>
                        {slot.assignedUsers?.length > 0 && (
                          <div className="assigned-warning">
                            ⚠️ {slot.assignedUsers.length} employee(s) assigned
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="notes-section">
                  <label htmlFor="workday-notes">
                    <h3>Notes</h3>
                  </label>
                  <textarea
                    id="workday-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this workday..."
                    maxLength={500}
                    rows={3}
                  />
                  <small>{notes.length}/500 characters</small>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="cancel-btn"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Assignment Modal */}
      {selectedTimeslot && (
        <AssignEmployeeModal
          show={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedTimeslot(null);
          }}
          timeslot={selectedTimeslot}
          fetchTimeslots={onWorkdayUpdated}
          employees={employees}
          isWorkday={true}
        />
      )}
    </AnimatePresence>
  );
};

export default ManageWorkdayModal;
