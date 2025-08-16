import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";
import "../styles/ManageTimeslots.css";

const AssignEmployeeModal = ({
  show,
  onClose,
  timeslot,
  fetchTimeslots,
  employees,
  onDeleteTimeslot,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    // Reset form when modal opens with a new timeslot
    if (show) {
      setSelectedEmployee("");
      setNotes("");
    }
  }, [show, timeslot]);

  if (!show || !timeslot) return null;

  const formatDate = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    const options = { hour: "numeric", minute: "numeric", hour12: true };
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString(
      undefined,
      options
    );
  };

  const handleAssign = async (e) => {
    e.preventDefault();

    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    try {
      setLoading(true);
      const authToken = JSON.parse(localStorage.getItem("auth"));

      await axios.put(
        `http://localhost:3000/api/v1/timeslots/assign/${timeslot._id}`,
        {
          userId: selectedEmployee,
          notes,
          action: "assign",
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      toast.success("Employee assigned successfully!");
      setSelectedEmployee("");
      setNotes("");
      fetchTimeslots();
      onClose();
    } catch (error) {
      console.error("Error assigning employee:", error);
      toast.error(error.response?.data?.msg || "Failed to assign employee");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this timeslot?")) {
      return;
    }

    try {
      setDeleteLoading(true);
      const authToken = JSON.parse(localStorage.getItem("auth"));

      await axios.delete(
        `http://localhost:3000/api/v1/timeslots/${timeslot._id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      toast.success("Timeslot deleted successfully!");
      fetchTimeslots();
      onClose();
      if (onDeleteTimeslot) {
        onDeleteTimeslot(timeslot._id);
      }
    } catch (error) {
      console.error("Error deleting timeslot:", error);
      toast.error(error.response?.data?.msg || "Failed to delete timeslot");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="assign-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="assign-modal compact"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="assign-modal-header">
              <h3>Assign Employee</h3>
              <button className="close-modal-btn" onClick={onClose}>
                ×
              </button>
            </div>

            <div className="assign-modal-details">
              <div className="modal-date-time">
                <div className="modal-info-item">
                  <span className="modal-label">Date:</span>
                  <span className="modal-value compact-value">
                    {new Date(timeslot.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-label">Time:</span>
                  <span className="modal-value compact-value">
                    {formatTime(timeslot.startTime)} -{" "}
                    {formatTime(timeslot.endTime)}
                  </span>
                </div>
              </div>

              <div className="modal-split-layout">
                <div className="modal-column">
                  <div className="form-group">
                    <label htmlFor="employee-select">Employee</label>
                    <select
                      id="employee-select"
                      className="modal-select"
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                      <option value="">-- Select employee --</option>
                      {employees.map((employee) => (
                        <option key={employee._id} value={employee._id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group compact-form-group">
                    <label htmlFor="notes-textarea">Notes (Optional)</label>
                    <textarea
                      id="notes-textarea"
                      className="modal-textarea compact-textarea"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Brief notes..."
                      rows="2"
                    />
                  </div>
                </div>

                <div className="modal-column">
                  <h4 className="current-assignments-label">
                    Current Assignments
                  </h4>
                  <div className="current-assignments-container">
                    {timeslot.assignments && timeslot.assignments.length > 0 ? (
                      <div className="modal-assigned-users compact-users">
                        {timeslot.assignments.map((assignment) => (
                          <div
                            key={assignment._id}
                            className="modal-assigned-user compact-user"
                          >
                            {assignment.employee?.name || "Unknown Employee"}
                            {assignment.notes && (
                              <span className="compact-notes">
                                {assignment.notes}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-assignments">None</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-actions compact-actions">
                <button
                  type="button"
                  className="delete-slot-btn"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete Slot"}
                </button>
                <div className="main-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="assign-btn"
                    onClick={handleAssign}
                    disabled={loading || !selectedEmployee}
                  >
                    {loading ? "Assigning..." : "Assign"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AssignEmployeeModal;
