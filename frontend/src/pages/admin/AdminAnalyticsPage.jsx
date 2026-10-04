import React from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";

function AdminAnalyticsPage() {
  return (
    <DashboardShell role="admin" activeNav="/admin/analytics" title="Reports & Analytics">
      <div className="db-card">
        <div className="db-card-header">
          <h3 className="db-card-title">Performance Metrics</h3>
          <span className="db-badge info">Updated Live</span>
        </div>
        <div className="db-overview-cols">
          <div className="db-overview-item">
            <div className="db-overview-icon blue"><i className="bi bi-currency-rupee" /></div>
            <div className="db-overview-data"><strong>₹48.2L</strong><span>GTV (Month to date)</span></div>
          </div>
          <div className="db-overview-item">
            <div className="db-overview-icon green"><i className="bi bi-graph-up" /></div>
            <div className="db-overview-data"><strong>5.8%</strong><span>Conversion Rate</span></div>
          </div>
          <div className="db-overview-item">
            <div className="db-overview-icon orange"><i className="bi bi-clock-history" /></div>
            <div className="db-overview-data"><strong>2.1d</strong><span>Avg. Review Cycle</span></div>
          </div>
          <div className="db-overview-item">
            <div className="db-overview-icon purple"><i className="bi bi-robot" /></div>
            <div className="db-overview-data"><strong>91%</strong><span>AI Match Score</span></div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}


export default AdminAnalyticsPage;
