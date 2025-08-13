import React, { useState } from "react";
import "../styles/EditNameModal.css";

const EditNameModal = ({ isOpen, onClose, onSubmit, currentName, loading }) => {
  const [name, setName] = useState(currentName || "");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    if (name.trim().length > 50) {
      setError("Name cannot exceed 50 characters");
      return;
    }

    setError("");
    onSubmit(name.trim());
  };

  const handleClose = () => {
    if (!loading) {
      setName(currentName || "");
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="edit-modal-overlay" onClick={handleClose}>
      <div
        className="edit-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="edit-modal-header">Edit Name</div>

        <form className="edit-modal-form" onSubmit={handleSubmit}>
          <div className="edit-modal-field">
            <label className="edit-modal-label">New username</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="edit-modal-input"
              placeholder="Enter a new username"
              disabled={loading}
              autoFocus
            />
            {error && <div className="edit-modal-error">{error}</div>}
          </div>

          <div className="edit-modal-buttons">
            <button
              type="button"
              className="edit-modal-cancel-btn"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="edit-modal-save-btn"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNameModal;
