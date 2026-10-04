import React from "react";

export function Loading({ label = "Loading…" }) {
  return (
    <div className="py-5 text-center text-secondary">
      <div className="spinner-border spinner-border-sm me-2" role="status" />
      <span>{label}</span>
    </div>
  );
}

export default Loading;
