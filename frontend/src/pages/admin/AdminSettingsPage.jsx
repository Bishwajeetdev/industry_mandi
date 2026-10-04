import React from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";

function AdminSettingsPage() {
  return (
    <DashboardShell role="admin" activeNav="/admin/settings" title="Marketplace Controls">
      <div className="db-card">
        <div className="db-card-header">
          <h3 className="db-card-title">Policy &amp; AI Configuration</h3>
        </div>
        <div className="db-form-group">
          <label className="db-form-label">AI recommendation mode</label>
          <select className="db-form-select">
            <option>Human review + AI assist</option>
            <option>Manual review only</option>
          </select>
        </div>
      </div>
    </DashboardShell>
  );
}


export default AdminSettingsPage;
