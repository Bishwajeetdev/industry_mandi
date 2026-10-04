import React from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";

function AdminAIPage() {
  return (
    <DashboardShell role="admin" activeNav="/admin/ai" title="AI Recommendation Intelligence">
      <div className="db-card">
        <div className="db-card-header">
          <h3 className="db-card-title">AI Decision Log</h3>
          <span className="db-badge success">Active</span>
        </div>
        <p className="text-secondary" style={{ fontSize: "0.88rem" }}>
          Recommendation quality, prompt benchmarks, and automated pairing confidence are monitored continuously.
        </p>
      </div>
    </DashboardShell>
  );
}


export default AdminAIPage;
