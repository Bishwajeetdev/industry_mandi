import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ConfirmationModal from "../common/ConfirmationModal";

function DashboardShell({ children, role, activeNav, title, actions }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState("");

  const currentRole = role || user?.role || "buyer";

  const navItems = {
    admin: [
      { section: "Main" },
      { to: "/admin", label: "Dashboard", icon: "bi-grid-1x2" },
      { section: "Inventory & Catalog" },
      { to: "/admin/products", label: "Products", icon: "bi-box-seam" },
      { to: "/admin/offers", label: "Offers", icon: "bi-tag" },
      { to: "/admin/pairings", label: "Pairings", icon: "bi-diagram-3" },
      { section: "Partners & Users" },
      { to: "/admin/vendors", label: "Suppliers", icon: "bi-shop" },
      { to: "/admin/users", label: "Users & Teams", icon: "bi-people" },
      { to: "/admin/orders", label: "Orders", icon: "bi-truck" },
    ],
    vendor: [
      { section: "Main" },
      { to: "/vendor", label: "Dashboard", icon: "bi-grid-1x2" },
      { section: "Inventory" },
      { to: "/vendor/products", label: "Products", icon: "bi-box-seam" },
      { to: "/vendor/offers", label: "Offers", icon: "bi-tag" },
      { to: "/vendor/pairing", label: "Product Pairing", icon: "bi-diagram-3" },
      { section: "Orders" },
      { to: "/vendor/orders", label: "Orders", icon: "bi-truck" },
    ],
    buyer: [
      { section: "Main" },
      { to: "/dashboard/buyer", label: "Dashboard", icon: "bi-grid-1x2" },
      { to: "/buyer/account?section=orders", label: "Orders", icon: "bi-truck", sectionKey: "orders" },
      { section: "Marketplace" },
      { to: "/products", label: "Inventory & Catalog", icon: "bi-box-seam" },
      { to: "/compare", label: "Reports & Compare", icon: "bi-bar-chart" },
      { to: "/price-finder", label: "Price Finder", icon: "bi-search" },
      { to: "/cart", label: "Active Cart", icon: "bi-bag" },
    ],
  }[currentRole] || [];
  const buyerSection = new URLSearchParams(location.search).get("section") || "profile";
  const buyerAccountMenuItems = [
    ["profile", "Buyer Profile", "bi-person"],
    ["addresses", "My Addresses", "bi-geo-alt"],
    ["payments", "Payment Credentials", "bi-credit-card"],
    ["notifications", "Notifications", "bi-bell"],
    ["security", "Account & Security", "bi-shield-lock"],
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <div className="db-shell">
      <div
        className={`db-sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`db-sidebar ${sidebarOpen ? "open" : ""}`}>
        <Link to="/" className="db-logo">
          <div className="db-logo-icon">
            {currentRole === "vendor" && user?.profile?.logo
              ? <img src={user.profile.logo} alt={`${user.name || "Vendor"} logo`} className="db-logo-image" />
              : <i className="bi bi-check2-circle text-white fs-5" />}
          </div>
          <div className="db-logo-text">
            <strong>INDUSTRY MANDI</strong>
            <span>{currentRole.toUpperCase()} WORKSPACE</span>
          </div>
        </Link>

        <nav className="db-nav">
          {navItems.map((item, idx) => {
            if (item.section) {
              return (
                <div key={idx} className="db-nav-section">
                  {item.section}
                </div>
              );
            }
            const isActive =
              (currentRole === "buyer" && item.sectionKey === buyerSection && location.pathname === "/buyer/account") ||
              activeNav === item.to ||
              (location.pathname === item.to && !item.sectionKey) ||
              (item.to !== "/admin" &&
                item.to !== "/vendor" &&
                item.to !== "/dashboard/buyer" &&
                item.to !== "/account" &&
                location.pathname.startsWith(item.to));

            return (
              <Link
                key={idx}
                to={item.to}
                className={`db-nav-link ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <i className={`bi ${item.icon}`} />
                <span>{item.label}</span>
                {item.badge && <span className="db-nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="db-sidebar-footer">
          {currentRole === "buyer" ? (
            <div className="db-account-menu-wrap">
              <button type="button" className="db-nav-link" title="Settings" aria-expanded={accountMenuAnchor === "sidebar"} onClick={() => setAccountMenuAnchor((anchor) => anchor === "sidebar" ? "" : "sidebar")}>
                <i className="bi bi-gear" />
                <span>Settings</span>
              </button>
              {accountMenuAnchor === "sidebar" && <nav className="db-account-menu" aria-label="Buyer account settings">{buyerAccountMenuItems.map(([section, label, icon]) => <Link key={section} to={`/buyer/account?section=${section}`} className={buyerSection === section && location.pathname === "/buyer/account" ? "active" : ""} onClick={() => setAccountMenuAnchor("")}><i className={`bi ${icon}`} /><span>{label}</span></Link>)}</nav>}
            </div>
          ) : (
            <Link to="/vendor/settings" className="db-nav-link" title="Settings"><i className="bi bi-gear" /><span>Settings</span></Link>
          )}
          <button
            type="button"
            className="db-nav-link text-danger"
            onClick={() => setConfirmLogout(true)}
          >
            <i className="bi bi-box-arrow-left text-danger" />
            <span className="text-danger">Log Out</span>
          </button>
        </div>
      </aside>
      <ConfirmationModal
        isOpen={confirmLogout}
        title="Confirm logout"
        message="Are you sure you want to log out of this account?"
        confirmText="Log out"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => { setConfirmLogout(false); logout(); }}
      />

      <header className="db-topbar">
        <button
          type="button"
          className="db-topbar-icon db-sidebar-toggle"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <i className="bi bi-list fs-5" />
        </button>

        <form className="db-search-bar" onSubmit={handleSearchSubmit}>
          <i className="bi bi-search" />
          <input
            type="text"
            placeholder="Search product, supplier, order"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </form>

        <div className="db-topbar-right">
          {currentRole === "admin" && (
            <Link
              to="/admin/notifications"
              className="db-topbar-icon"
              title="Notifications"
            >
              <i className="bi bi-bell" />
              <span className="db-topbar-notif-dot" />
            </Link>
          )}

          <Link
            to="/products"
            className="db-btn db-btn-outline db-btn-sm d-none d-md-inline-flex"
            style={{ padding: "6px 14px", borderRadius: 8 }}
          >
            <i className="bi bi-shop" /> Marketplace
          </Link>

          {currentRole === "buyer" ? (
            <div className="db-account-menu-wrap db-account-menu-profile">
              <button type="button" className="db-avatar" title={user?.name || "Profile"} aria-label="Open buyer profile menu" aria-expanded={accountMenuAnchor === "profile"} onClick={() => setAccountMenuAnchor((anchor) => anchor === "profile" ? "" : "profile")}>
                {user?.name ? user.name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase() : "U"}
              </button>
              {accountMenuAnchor === "profile" && <nav className="db-account-menu" aria-label="Buyer account">{buyerAccountMenuItems.map(([section, label, icon]) => <Link key={section} to={`/buyer/account?section=${section}`} className={buyerSection === section && location.pathname === "/buyer/account" ? "active" : ""} onClick={() => setAccountMenuAnchor("")}><i className={`bi ${icon}`} /><span>{label}</span></Link>)}</nav>}
            </div>
          ) : (
            <Link to={currentRole === "vendor" ? "/vendor/settings" : "/account"} className="db-avatar" title={user?.name || "Profile"} style={{ textDecoration: "none" }}>
              {currentRole === "vendor" && user?.profile?.logo ? <img src={user.profile.logo} alt={`${user.name || "Vendor"} logo`} className="db-avatar-image" /> : user?.name ? user.name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase() : "U"}
            </Link>
          )}
        </div>
      </header>

      <main className="db-content">
        {title && (
          <div className="db-page-header">
            <div>
              <h1>{title}</h1>
            </div>
            {actions && <div className="db-page-actions">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}



export default DashboardShell;
