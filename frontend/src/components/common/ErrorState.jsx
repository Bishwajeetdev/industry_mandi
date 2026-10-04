import React from "react";

export function ErrorState({ message, onRetry }) {
  return (
    <div className="alert alert-danger d-flex align-items-center justify-content-between my-3" role="alert">
      <div>
        <i className="bi bi-exclamation-triangle-fill me-2" />
        <span>{message || "An unexpected error occurred."}</span>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorState;
