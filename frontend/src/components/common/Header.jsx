import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { fmt, getDashboardPath } from "../../utils/helpers";
import { notifyCartChanged } from "../../utils/events";
import favicon from "../../assets/favicon.png";
import ConfirmationModal from "./ConfirmationModal";

function Header() {
  const { user, login, logout } = useAuth(),
    navigate = useNavigate(),
    [wishlistCount, setWishlistCount] = useState(0),
    [cartCount, setCartCount] = useState(0),
    [searchQuery, setSearchQuery] = useState(""),
    [menuOpen, setMenuOpen] = useState(false),
    [showSignInModal, setShowSignInModal] = useState(null),
    [signInForm, setSignInForm] = useState({ email: "", password: "" }),
    [signInLoading, setSignInLoading] = useState(false),
    [signInError, setSignInError] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [confirmLogout, setConfirmLogout] = useState(false),
    dash = getDashboardPath(user?.role);

  useEffect(() => {
    const loadCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };
    loadCartCount();
    window.addEventListener("cart-updated", loadCartCount);
    return () => window.removeEventListener("cart-updated", loadCartCount);
  }, []);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    if (!user) {
      setSignInError("");
      setShowSignInModal("wishlist");
    } else {
      navigate("/wishlist");
    }
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    if (!user) {
      setSignInError("");
      setShowSignInModal("cart");
    } else {
      navigate("/cart");
    }
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setSignInLoading(true);
    setSignInError("");
    try {
      const r = await api.post("/auth/login", signInForm);
      login(r.data.data);
      const dest = showSignInModal === "wishlist" ? "/wishlist" : "/cart";
      setShowSignInModal(null);
      setSignInForm({ email: "", password: "" });
      navigate(dest);
    } catch (err) {
      setSignInError(
        err.response?.data?.message ||
        "Invalid email or password. Please verify your credentials."
      );
    } finally {
      setSignInLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "buyer") {
      const loadWishlistCount = () =>
        api
          .get("/buyer/wishlist")
          .then((response) => {
            const items = Array.isArray(response.data?.data) ? response.data.data : [];
            setWishlistCount(items.length);
            try {
              localStorage.setItem("wishlist", JSON.stringify(items));
            } catch {}
          })
          .catch(() => setWishlistCount(0));
      const handleWishlistChange = (event) =>
        typeof event.detail?.count === "number" ? setWishlistCount(event.detail.count) : loadWishlistCount();
      loadWishlistCount();
      window.addEventListener("wishlist-updated", handleWishlistChange);
      return () => window.removeEventListener("wishlist-updated", handleWishlistChange);
    } else {
      const loadGuestWishlist = () => {
        try {
          const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
          setWishlistCount(list.length);
        } catch {
          setWishlistCount(0);
        }
      };
      loadGuestWishlist();
      const handleWishlistChange = (event) =>
        typeof event.detail?.count === "number" ? setWishlistCount(event.detail.count) : loadGuestWishlist();
      window.addEventListener("wishlist-updated", handleWishlistChange);
      return () => window.removeEventListener("wishlist-updated", handleWishlistChange);
    }
  }, [user?.role]);

  const location = useLocation();
  if (
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/vendor") ||
    location.pathname.startsWith("/dashboard")
  ) {
    return null;
  }

  return (
    <>
      <div className="topbar">
        <span><span className="telemetry-pip" /> Live Industrial Procurement Gateway · ISO 9001:2015 Tier-1 Grid</span>
        <span className="d-none d-md-inline">·</span>
        <span className="d-none d-md-inline">Direct OEM pricing and verified benchmark telemetry</span>
      </div>
      <nav className={`navbar navbar-expand-lg navbar-dark ${menuOpen ? "mobile-menu-open" : ""}`}>
        <div className="container">
          <Link className="navbar-brand" to="/">
            <span className="brand-dot">
              <img src={favicon} alt="Industry Mandi logo" />
            </span>
            <div className="d-flex flex-column text-start">
              <span className="brand-name">INDUSTRY MANDI</span>
              <span className="brand-subtext">Industrial Exchange</span>
            </div>
          </Link>
          <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            <i className={`bi ${menuOpen ? "bi-x-lg" : "bi-list"}`} />
          </button>
          <form className="market-search" onSubmit={(event) => { event.preventDefault(); navigate(searchQuery.trim() ? `/products?q=${encodeURIComponent(searchQuery.trim())}` : "/products"); }}>
            <i className="bi bi-search" />
            <input aria-label="Search machinery" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search 12,000+ machines, models, OEMs..." />
            <kbd className="search-shortcut-badge">⌘K</kbd>
            <button type="submit">Search</button>
          </form>
          <div className="navbar-nav ms-auto align-items-center gap-1 flex-nowrap mobile-nav-menu">
            <Link to="/products" className="nav-link header-utility" onClick={() => setMenuOpen(false)}><i className="bi bi-grid me-1" /> Explore</Link>
            <Link to="/price-finder" className="nav-link header-utility" onClick={() => setMenuOpen(false)}><i className="bi bi-tags me-1" /> Price Finder</Link>
            <Link to="/about" className="nav-link header-utility header-secondary-link" onClick={() => setMenuOpen(false)}>About</Link>
            <Link to="/contact" className="nav-link header-utility header-secondary-link" onClick={() => setMenuOpen(false)}>Contact us</Link>
            {!user && <Link to="/register?role=vendor" className="nav-link header-utility header-secondary-link" onClick={() => setMenuOpen(false)}>Become a seller</Link>}
            {(!user || user?.role === "buyer") && <>
              <button
                type="button"
                className="nav-link header-icon wishlist-nav-icon"
                onClick={handleWishlistClick}
                aria-label={`Wishlist (${wishlistCount} saved)`}
                title="Wishlist"
              >
                <i className="bi bi-heart" />
                {wishlistCount > 0 && <span className="wishlist-count">{wishlistCount > 99 ? "99+" : wishlistCount}</span>}
              </button>
              <button
                type="button"
                className="nav-link header-icon"
                onClick={handleCartClick}
                aria-label={`Cart (${cartCount} items)`}
                title="Cart"
              >
                <i className="bi bi-bag" />
                {cartCount > 0 && <span className="wishlist-count">{cartCount > 99 ? "99+" : cartCount}</span>}
              </button>
            </>}
            {user ? (
              <>
                <Link to={dash} className="nav-link header-utility" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); setConfirmLogout(true); }}
                  className="btn btn-sm btn-outline-light"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link header-utility" onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <ConfirmationModal
        isOpen={confirmLogout}
        title="Confirm logout"
        message="Are you sure you want to log out of your account?"
        confirmText="Log out"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => { setConfirmLogout(false); logout(); }}
      />

      {showSignInModal && (
        <div
          className="compare-modal-backdrop"
          style={{ zIndex: 2300 }}
          onClick={() => {
            setShowSignInModal(null);
            setSignInError("");
          }}
        >
          <div
            className="compare-modal-content cart-auth-modal"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="compare-modal-header border-bottom">
              <div>
                <span className="eyebrow dark">AUTHENTICATION REQUIRED</span>
                <h3 className="h5 mb-0 d-flex align-items-center gap-2">
                  <i
                    className={`bi ${
                      showSignInModal === "wishlist"
                        ? "bi-heart text-danger"
                        : "bi-bag text-primary"
                    }`}
                  />
                  {showSignInModal === "wishlist"
                    ? "Sign In to Access Wishlist"
                    : "Sign In to Access Cart"}
                </h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => {
                  setShowSignInModal(null);
                  setSignInError("");
                }}
                aria-label="Close"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-secondary small mb-3">
                {showSignInModal === "wishlist"
                  ? "Please sign in to view and manage your saved machinery and procurement wishlist."
                  : "Please sign in to view your procurement cart and proceed with direct OEM orders."}
              </p>

              {signInError && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-circle me-1" /> {signInError}
                </div>
              )}

              <form onSubmit={handleSignInSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    placeholder="buyer@company.com"
                    value={signInForm.email}
                    onChange={(e) =>
                      setSignInForm({ ...signInForm, email: e.target.value })
                    }
                    autoFocus
                  />
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <label className="form-label small fw-semibold text-secondary mb-1">
                      Password
                    </label>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none small text-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="form-control"
                    placeholder="••••••••"
                    value={signInForm.password}
                    onChange={(e) =>
                      setSignInForm({ ...signInForm, password: e.target.value })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-2"
                  disabled={signInLoading}
                >
                  {signInLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Signing In…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-1" /> Sign In
                    </>
                  )}
                </button>

                <div className="d-flex align-items-center my-3">
                  <hr className="flex-grow-1 m-0 text-secondary" />
                  <span className="px-2 text-secondary small">or</span>
                  <hr className="flex-grow-1 m-0 text-secondary" />
                </div>

                <div className="text-center small text-secondary">
                  Don’t have an account yet?{" "}
                  <Link
                    to={`/register?role=buyer&redirect=${encodeURIComponent(
                      showSignInModal === "wishlist" ? "/wishlist" : "/cart"
                    )}`}
                    className="text-primary text-decoration-none fw-semibold"
                    onClick={() => {
                      setShowSignInModal(null);
                      setMenuOpen(false);
                    }}
                  >
                    Register as Buyer
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
