import React from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";

function AdminNotificationsPage() {
  return (
    <DashboardShell role="admin" activeNav="/admin/notifications" title="System Notifications">
      <div className="db-card">
        <div className="db-card-header">
          <h3 className="db-card-title">Escalations &amp; Updates</h3>
        </div>
        <div className="db-empty">
          <i className="bi bi-bell text-muted" />
          <p>No new system escalations or alerts at this moment.</p>
        </div>
      </div>
    </DashboardShell>
  );
}


export default AdminNotificationsPage;
