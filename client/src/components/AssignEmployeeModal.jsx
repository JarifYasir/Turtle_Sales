import React, { useState } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/DeleteConfirmModal.css"; // Reuse existing modal styles

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

  if (!show || !timeslot) return null;

  const handleAssign = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    setLoading(true);
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/timeslots/assign/${timeslot._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            userId: selectedEmployee,
            notes: notes,
            action: "assign",
          }),
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success("Employee assigned successfully");
        fetchTimeslots();
        onClose();
        setSelectedEmployee("");
        setNotes("");
      } else {
        toast.error(data.msg || "Failed to assign employee");
      }
    } catch (error) {
      console.error("Error assigning employee:", error);
      toast.error("Failed to assign employee");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId) => {
    setLoading(true);
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/timeslots/assign/${timeslot._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            userId: userId,
            action: "remove",
          }),
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success("Employee removed successfully");
        fetchTimeslots();
      } else {
        toast.error(data.msg || "Failed to remove employee");
      }
    } catch (error) {
      console.error("Error removing employee:", error);
      toast.error("Failed to remove employee");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimeslot = () => {
    if (window.confirm("Are you sure you want to delete this timeslot?")) {
      onDeleteTimeslot(timeslot._id);
      onClose();
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          className="modal-content assign-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="modal-header">
            <h2>Manage Timeslot</h2>
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="modal-body">
            <div className="timeslot-info">
              <h3>
                {formatDate(timeslot.date)} - {formatTime(timeslot.startTime)} to{" "}
                {formatTime(timeslot.endTime)}
              </h3>
            </div>

            {/* Currently Assigned Employees */}
            {timeslot.assignedUsers && timeslot.assignedUsers.length > 0 && (
              <div className="assigned-section">
                <h4>Currently Assigned:</h4>
                <div className="assigned-users">
                  {timeslot.assignedUsers.map((assignment) => (
                    <div key={assignment.user._id} className="assigned-user">
                      <span>{assignment.user.name}</span>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveUser(assignment.user._id)}
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assign New Employee */}
            <div className="assign-section">
              <h4>Assign New Employee:</h4>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                disabled={loading}
              >
                <option value="">Select an employee...</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name}
                  </option>
                ))}
              </select>

              <textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="delete-btn"
              onClick={handleDeleteTimeslot}
              disabled={loading}
            >
              Delete Timeslot
            </button>
            <button className="cancel-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              className="assign-btn"
              onClick={handleAssign}
              disabled={loading || !selectedEmployee}
            >
              {loading ? "Assigning..." : "Assign Employee"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AssignEmployeeModal;
