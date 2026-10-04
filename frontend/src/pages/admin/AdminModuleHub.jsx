import React from "react";
import { Link } from "react-router-dom";
import DashboardShell from "../../components/dashboard/DashboardShell";

function AdminModuleHub() {
  return (
    <DashboardShell role="admin" activeNav="/admin" title="Operations Hub">
      <div className="db-stats-grid">
        <Link to="/admin/analytics" className="db-stat-card blue">
          <div className="db-stat-label">Analytics & Reports</div>
          <div className="db-stat-value">Marketplace</div>
          <div className="db-stat-sub">Review velocity & GTV</div>
        </Link>
        <Link to="/admin/ai" className="db-stat-card green">
          <div className="db-stat-label">AI Copilot</div>
          <div className="db-stat-value">Intelligence</div>
          <div className="db-stat-sub">Confidence & pairing</div>
        </Link>
        <Link to="/admin/notifications" className="db-stat-card amber">
          <div className="db-stat-label">Notifications</div>
          <div className="db-stat-value">Escalations</div>
          <div className="db-stat-sub">Stakeholder alerts</div>
        </Link>
        <Link to="/admin/settings" className="db-stat-card red">
          <div className="db-stat-label">Settings</div>
          <div className="db-stat-value">Policies</div>
          <div className="db-stat-sub">Marketplace controls</div>
        </Link>
      </div>
    </DashboardShell>
  );
}


export default AdminModuleHub;
