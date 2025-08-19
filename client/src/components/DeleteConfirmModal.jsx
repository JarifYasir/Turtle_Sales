import React from "react";
import "../styles/DeleteConfirmModal.css";

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title = "Delete Account",
  message = "Are you sure you want to delete your account?",
  warningText = "This action cannot be undone. All your data will be permanently removed.",
  confirmText = "Delete Account",
  confirmButtonClass = "delete-btn",
  loadingText = "Deleting...",
  modalType = "delete",
}) => {
  if (!isOpen) return null;

  const modalClass =
    modalType === "leave" ? "modal-content leave-org-modal" : "modal-content";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="warning-icon">⚠️</div>
          <p>{message}</p>
          <p className="warning-text">{warningText}</p>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={confirmButtonClass}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
