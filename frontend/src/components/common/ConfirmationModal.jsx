import React, { useEffect } from "react";

function ConfirmationModal({
  isOpen,
  title = "Confirm action",
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = true,
  isLoading = false,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isLoading) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="db-modal-backdrop confirmation-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) onCancel();
      }}
    >
      <div className="db-modal confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirmation-modal-title" aria-describedby="confirmation-modal-message">
        <div className="db-modal-header">
          <div>
            <span className={`eyebrow ${isDanger ? "text-danger" : "dark"}`}>CONFIRM ACTION</span>
            <h3 id="confirmation-modal-title" className="db-modal-title">{title}</h3>
          </div>
          <button type="button" className="db-modal-close" onClick={onCancel} disabled={isLoading} aria-label="Close confirmation dialog">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="db-modal-body confirmation-modal-body">
          <p id="confirmation-modal-message">{message}</p>
          <div className="confirmation-modal-actions">
            <button type="button" className="db-btn db-btn-outline" onClick={onCancel} disabled={isLoading}>{cancelText}</button>
            <button type="button" className={`db-btn ${isDanger ? "db-btn-danger" : "db-btn-primary"}`} onClick={onConfirm} disabled={isLoading}>
              {isLoading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              {isLoading ? "Please wait…" : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default ConfirmationModal;
