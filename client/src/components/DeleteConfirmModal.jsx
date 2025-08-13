import React from "react";
import "../styles/DeleteConfirmModal.css";

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Delete Account</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="warning-icon">⚠️</div>
          <p>Are you sure you want to delete your account?</p>
          <p className="warning-text">
            This action cannot be undone. All your data will be permanently
            removed.
          </p>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="delete-btn" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
