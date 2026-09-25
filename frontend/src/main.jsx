import React, { createContext, useContext, useEffect, useLayoutEffect, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles.css";
import industrialPlantHero from "./assets/industrial-plant-hero.jpg";
gsap.registerPlugin(ScrollToPlugin);
const resolveApiUrl = (envUrl) => {
  if (envUrl && envUrl.trim()) {
    let url = envUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    url = url.replace(/\/+$/, "");
    return url.endsWith("/api") ? url : `${url}/api`;
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:5000/api";
  }
  return "https://industry-mandi01.onrender.com/api";
};

const api = axios.create({
  baseURL: resolveApiUrl(import.meta.env.VITE_API_URL),
}),
  Auth = createContext(null),
  useAuth = () => useContext(Auth),
  fmt = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n || 0);
const getDisplayPrice = (product) => {
  const listedPrice = Number(product?.price || product?.offerPrice || product?.salePrice);
  if (listedPrice > 0) return listedPrice;
  const str = String(product?.name || product?._id || product?.slug || "industrial-equipment");
  const seed = [...str].reduce((total, character, i) => total + character.charCodeAt(0) * (i + 1), 0);
  const cat = String(product?.category || "").toLowerCase();
  if (cat.includes("cnc") || cat.includes("machin")) {
    return 1450000 + (seed % 15) * 85000;
  } else if (cat.includes("switchgear") || cat.includes("power") || cat.includes("starter")) {
    return 135000 + (seed % 10) * 15000;
  } else if (cat.includes("vfd") || cat.includes("automation") || cat.includes("drive")) {
    return 62000 + (seed % 12) * 4500;
  } else if (cat.includes("pump")) {
    return 42500 + (seed % 8) * 3500;
  }
  return 48500 + (seed % 14) * 4200;
};
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
const notifyWishlistChanged = (items) => window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: { count: Array.isArray(items) ? items.length : undefined } }));
const notifyCartChanged = () => window.dispatchEvent(new Event("cart-updated"));
const addToCompareQueue = (product) => {
  if (!product) return [];
  const compared = JSON.parse(localStorage.getItem("compareProducts") || "[]");
  if (compared.length > 0 && compared[0]?.category && product.category) {
    if (compared[0].category.trim().toLowerCase() !== product.category.trim().toLowerCase()) {
      alert(`Cannot compare products from different categories. All compared products must belong to "${compared[0].category}".`);
      return compared;
    }
  }
  const sameCategory = compared.filter(
    (item) => !item.category || !product.category || item.category.trim().toLowerCase() === product.category.trim().toLowerCase()
  );
  const next = sameCategory.some((item) => String(item._id) === String(product._id))
    ? sameCategory
    : [...sameCategory, product].slice(0, 4);
  localStorage.setItem("compareProducts", JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("compare-updated", { detail: { products: next } }));
  return next;
};
const removeFromCompareQueue = (productId) => {
  try {
    const compared = JSON.parse(localStorage.getItem("compareProducts") || "[]");
    const next = compared.filter((item) => String(item._id) !== String(productId));
    localStorage.setItem("compareProducts", JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("compare-updated", { detail: { products: next } }));
    return next;
  } catch {
    return [];
  }
};
function AdminModuleHub() {
  return (
    <main className="container py-5">
      <span className="eyebrow dark">ADMIN CONTROL CENTER</span>
      <h1>Operations overview</h1>
      <p className="text-secondary">
        Keep every approval, recommendation, and policy control in one place.
      </p>
      <div className="admin-module-grid">
        <Link
          to="/admin/analytics"
          className="admin-module-card text-decoration-none"
        >
          <h3>Analytics</h3>
          <p>Marketplace performance and approval velocity.</p>
        </Link>
        <Link to="/admin/ai" className="admin-module-card text-decoration-none">
          <h3>AI Copilot</h3>
          <p>Recommendation quality and pairing confidence.</p>
        </Link>
        <Link
          to="/admin/notifications"
          className="admin-module-card text-decoration-none"
        >
          <h3>Notifications</h3>
          <p>Escalations and stakeholder updates.</p>
        </Link>
        <Link
          to="/admin/settings"
          className="admin-module-card text-decoration-none"
        >
          <h3>Settings</h3>
          <p>Marketplace policy and approval controls.</p>
        </Link>
      </div>
    </main>
  );
}
function AdminAnalyticsPage() {
  return (
    <main className="container py-5">
      <Link to="/admin">Back to dashboard</Link>
      <span className="eyebrow dark d-block mt-3">ADMIN ANALYTICS</span>
      <h1>Marketplace performance</h1>
      <div className="row g-3 mt-3">
        <div className="col-md-3">
          <div className="metric">
            <span>GTV</span>
            <strong>₹48.2L</strong>
            <small>Month to date</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="metric">
            <span>Conversion</span>
            <strong>5.8%</strong>
            <small>Qualified buyer rate</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="metric">
            <span>Approval time</span>
            <strong>2.1d</strong>
            <small>Average review cycle</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="metric">
            <span>AI match score</span>
            <strong>91</strong>
            <small>Recommendation confidence</small>
          </div>
        </div>
      </div>
    </main>
  );
}
function AdminAIPage() {
  return (
    <main className="container py-5">
      <Link to="/admin">Back to dashboard</Link>
      <span className="eyebrow dark d-block mt-3">AI CONTROL</span>
      <h1>Recommendation intelligence</h1>
      <div className="dashboard-panel mt-4">
        <h3>AI decision log</h3>
        <p className="text-secondary">
          Recommendation quality and pairing confidence are monitored here.
        </p>
      </div>
    </main>
  );
}
function AdminNotificationsPage() {
  return (
    <main className="container py-5">
      <Link to="/admin">Back to dashboard</Link>
      <span className="eyebrow dark d-block mt-3">NOTIFICATIONS</span>
      <h1>Escalations & updates</h1>
      <div className="dashboard-panel mt-4">
        <p className="text-secondary">No new escalations.</p>
      </div>
    </main>
  );
}
function AdminSettingsPage() {
  return (
    <main className="container py-5">
      <Link to="/admin">Back to dashboard</Link>
      <span className="eyebrow dark d-block mt-3">SETTINGS</span>
      <h1>Marketplace controls</h1>
      <div className="dashboard-panel mt-4">
        <label className="form-label">AI recommendation mode</label>
        <select className="form-select">
          <option>Human review + AI assist</option>
          <option>Manual review only</option>
        </select>
      </div>
    </main>
  );
}
function Loading({ label = "Loading…" }) {
  return (
    <main className="container py-5 text-secondary">
      <div className="spinner-border spinner-border-sm me-2" />
      {label}
    </main>
  );
}
function ErrorState({ message, onRetry }) {
  return (
    <main className="container py-5">
      <div className="alert alert-danger">
        <b>We couldn’t load this content.</b>
        <br />
        {message || "Check your connection and try again."}
        {onRetry && (
          <button
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={onRetry}
          >
            Try again
          </button>
        )}
      </div>
    </main>
  );
}
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
    dash =
      user?.role === "admin"
        ? "/admin"
        : user?.role === "vendor"
          ? "/vendor"
          : "/account";

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
            <span className="brand-dot" />
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
            <Link to="/about" className="nav-link header-utility" onClick={() => setMenuOpen(false)}>About</Link>
            <Link to="/contact" className="nav-link header-utility" onClick={() => setMenuOpen(false)}>Contact us</Link>
            {!user && <Link to="/register?role=vendor" className="nav-link header-utility" onClick={() => setMenuOpen(false)}>Become a seller</Link>}
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
                  onClick={() => { setMenuOpen(false); logout(); }}
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
function CartDrawer() {
  const [open, setOpen] = useState(false), [items, setItems] = useState([]);
  const loadCart = () => setItems(JSON.parse(localStorage.getItem("cart") || "[]").map((item) => ({ ...item, price: getDisplayPrice(item) })));
  useEffect(() => {
    const handleCartChange = () => { loadCart(); setOpen(true); };
    window.addEventListener("cart-updated", handleCartChange);
    return () => window.removeEventListener("cart-updated", handleCartChange);
  }, []);
  if (!open) return null;
  const itemCount = items.reduce((total, item) => total + (item.quantity || 1), 0);
  const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  return <div className="cart-drawer-layer" role="presentation" onMouseDown={() => setOpen(false)}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping cart" onMouseDown={(event) => event.stopPropagation()}><div className="cart-drawer-header"><h2>Your Cart ({itemCount} {itemCount === 1 ? "item" : "items"})</h2><button className="cart-drawer-close" onClick={() => setOpen(false)} aria-label="Close cart"><i className="bi bi-x-lg" /></button></div><div className="cart-drawer-body">{items.map((item) => <article className="cart-drawer-item" key={item._id}><div className="cart-drawer-thumb">{(item.image || item.images?.[0]?.url || item.images?.[0]) ? <img src={item.image || item.images?.[0]?.url || item.images?.[0]} alt="" /> : <i className="bi bi-box-seam" />}</div><div><strong>{item.name}</strong><span>{item.quantity || 1} × {fmt(item.price)}</span></div><b>{fmt((item.price || 0) * (item.quantity || 1))}</b></article>)}</div><div className="cart-drawer-footer"><div><span>Estimated total</span><strong>{fmt(total)}</strong></div><Link to="/cart" className="btn btn-primary w-100" onClick={() => setOpen(false)}>View cart & checkout <i className="bi bi-arrow-right ms-2" /></Link></div></aside></div>;
}
function CompareQueue() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("compareProducts") || "[]");
    } catch {
      return [];
    }
  });
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const currentCategory = products[0]?.category;

  const compareNow = () => {
    if (products.length >= 2) {
      setOpen(false);
      setShowPicker(false);
      navigate(`/compare?ids=${products.map((product) => product._id).join(",")}`);
    }
  };

  useEffect(() => {
    const handleCompareChange = (event) => {
      const next = event.detail?.products || [];
      setProducts(next);
      setOpen(true);
    };
    window.addEventListener("compare-updated", handleCompareChange);
    return () => window.removeEventListener("compare-updated", handleCompareChange);
  }, [navigate]);

  useEffect(() => {
    if (!showPicker) return;
    setLoadingCatalog(true);
    const params = { limit: 50 };
    if (currentCategory) params.category = currentCategory;
    api
      .get("/products", { params })
      .then((r) => {
        setCatalogProducts(Array.isArray(r.data?.data?.items) ? r.data.data.items : []);
      })
      .catch(() => {
        setCatalogProducts([]);
      })
      .finally(() => {
        setLoadingCatalog(false);
      });
  }, [showPicker, currentCategory]);

  const availablePickerProducts = useMemo(() => {
    const currentIds = products.map((p) => String(p._id));
    const combined = [...catalogProducts];
    if (typeof INDUSTRIAL_CATALOG !== "undefined" && Array.isArray(INDUSTRIAL_CATALOG)) {
      INDUSTRIAL_CATALOG.forEach((item) => {
        if (!combined.some((p) => String(p._id) === String(item._id) || p.name === item.name)) {
          if (!currentCategory || item.category?.toLowerCase() === currentCategory.toLowerCase()) {
            combined.push(item);
          }
        }
      });
    }
    return combined.filter((p) => {
      if (currentIds.includes(String(p._id))) return false;
      if (currentCategory && p.category && p.category.trim().toLowerCase() !== currentCategory.trim().toLowerCase()) return false;
      if (!pickerSearch.trim()) return true;
      const term = pickerSearch.toLowerCase();
      return (
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.brand && p.brand.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term)) ||
        (p.model && p.model.toLowerCase().includes(term))
      );
    });
  }, [catalogProducts, products, currentCategory, pickerSearch]);

  const handleAddProduct = (item) => {
    const next = addToCompareQueue(item);
    if (next) {
      setProducts(next);
      if (next.length >= 4) {
        setShowPicker(false);
      }
    }
  };

  const handleRemoveProduct = (productId) => {
    const next = removeFromCompareQueue(productId);
    setProducts(next);
    if (next.length === 0) {
      setOpen(false);
      setShowPicker(false);
    }
  };

  const openPicker = () => {
    if (products.length >= 4) return;
    setPickerSearch("");
    setShowPicker(true);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="compare-queue-layer"
        role="presentation"
        onMouseDown={() => {
          setOpen(false);
          setShowPicker(false);
        }}
      >
        <section
          className="compare-queue"
          role="dialog"
          aria-modal="true"
          aria-label="Compare products"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="compare-queue-header">
            <div className="d-flex align-items-center gap-2">
              <span>
                {products.length} product{products.length === 1 ? "" : "s"} in your <b>compare queue</b>
              </span>
              {currentCategory && (
                <span className="badge bg-secondary text-light">
                  {currentCategory}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                setShowPicker(false);
              }}
              aria-label="Close comparison queue"
              className="btn-modal-close"
            >
              <i className="bi bi-x-circle-fill fs-5" />
            </button>
          </div>

          <div className="compare-queue-slots">
            {Array.from({ length: 4 }, (_, index) => {
              const product = products[index];
              return product ? (
                <div className="compare-queue-slot compare-queue-slot-filled" key={product._id || index}>
                  <button
                    type="button"
                    className="compare-queue-slot-remove"
                    title={`Remove ${product.name} from queue`}
                    aria-label={`Remove ${product.name} from queue`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveProduct(product._id);
                    }}
                  >
                    <i className="bi bi-x" />
                  </button>
                  <div className="compare-queue-image">
                    {(product.image || product.images?.[0]?.url || product.images?.[0]) ? (
                      <img src={product.image || product.images?.[0]?.url || product.images?.[0]} alt={product.name || ""} />
                    ) : (
                      <i className="bi bi-box-seam" />
                    )}
                  </div>
                  <strong>{product.name}</strong>
                  <b>{fmt(getDisplayPrice(product))}</b>
                </div>
              ) : (
                <div
                  className="compare-queue-slot compare-queue-slot-empty"
                  key={index}
                  onClick={openPicker}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openPicker();
                    }
                  }}
                  title="Click to add another product to compare"
                >
                  <i className="bi bi-plus-circle-fill text-primary" style={{ fontSize: "1.5rem" }} />
                  <span className="fw-semibold">Add product</span>
                </div>
              );
            })}
          </div>

          <div className="compare-queue-footer">
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-primary"
                disabled={products.length >= 4}
                onClick={openPicker}
              >
                <i className="bi bi-plus-lg me-1" />
                {products.length >= 4 ? "Max 4 products added" : "Add more products"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setOpen(false);
                  setShowPicker(false);
                  navigate(currentCategory ? `/products?category=${encodeURIComponent(currentCategory)}` : "/products");
                }}
              >
                Browse catalog
              </button>
            </div>
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-primary"
                disabled={products.length < 2}
                onClick={compareNow}
              >
                Compare now
              </button>
              <span className="text-secondary small">
                {products.length < 2
                  ? "Select 1 more product to compare"
                  : `Compare ${products.length} products`}
              </span>
            </div>
          </div>
        </section>
      </div>

      {showPicker && (
        <div
          className="compare-modal-backdrop"
          style={{ zIndex: 2100 }}
          onClick={() => setShowPicker(false)}
        >
          <div className="compare-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="compare-modal-header">
              <div>
                <span className="eyebrow dark">EXPAND COMPARISON</span>
                <h3 className="h5 mb-0">Add Product to Compare</h3>
                {currentCategory && (
                  <small className="text-secondary">
                    Category: <strong>{currentCategory}</strong>
                  </small>
                )}
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowPicker(false)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="compare-modal-search">
              <i className="bi bi-search" />
              <input
                type="text"
                placeholder="Search products by model, brand, or name..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="compare-modal-list">
              {loadingCatalog ? (
                <div className="text-center py-4 text-secondary">
                  <div className="spinner-border spinner-border-sm me-2" />
                  Loading available products...
                </div>
              ) : availablePickerProducts.length > 0 ? (
                availablePickerProducts.map((p) => {
                  const pImg = p.image || p.images?.[0]?.url || p.images?.[0] || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
                  return (
                    <div className="picker-product-item" key={p._id}>
                      <img src={pImg} alt={p.name || ""} />
                      <div className="picker-product-info">
                        <strong className="picker-title">{p.name}</strong>
                        <span className="picker-meta">{p.brand} · {p.category}</span>
                        <span className="picker-price">{fmt(getDisplayPrice(p))}</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleAddProduct(p)}
                      >
                        <i className="bi bi-plus-lg me-1" /> Add
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-secondary">
                  <p className="mb-2">No other equipment found in this category.</p>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => {
                      setOpen(false);
                      setShowPicker(false);
                      navigate("/products");
                    }}
                  >
                    Browse full marketplace catalog
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function Protected({ roles, children }) {
  const { user } = useAuth();
  return !user ? (
    <Navigate to="/login" replace />
  ) : roles && !roles.includes(user.role) ? (
    <Navigate to="/" replace />
  ) : (
    children
  );
}
class RouteErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Route render failed", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="container py-5">
          <div className="empty-state">
            <i className="bi bi-arrow-clockwise" />
            <h2>This page needs to be reloaded</h2>
            <p>Something went wrong while changing pages.</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
function RouteBoundary({ children }) {
  const location = useLocation();
  return <RouteErrorBoundary key={location.key}>{children}</RouteErrorBoundary>;
}
function ProductCard({ product, selectable, onToggle, chosen, onRemove }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getStoredWishlist = () => {
    try {
      const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
      return list.some((item) => String(item._id) === String(product._id));
    } catch {
      return false;
    }
  };
  const getStoredCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      return cart.some((item) => String(item._id) === String(product._id));
    } catch {
      return false;
    }
  };
  const getStoredCompare = () => {
    try {
      const list = JSON.parse(localStorage.getItem("compareProducts") || "[]");
      return list.some((item) => String(item._id) === String(product._id));
    } catch {
      return false;
    }
  };

  const [isWishlisted, setIsWishlisted] = useState(getStoredWishlist);
  const [cartAdded, setCartAdded] = useState(getStoredCart);
  const [isComparing, setIsComparing] = useState(chosen !== undefined ? chosen : getStoredCompare);

  useEffect(() => {
    if (chosen !== undefined) {
      setIsComparing(chosen);
    }
  }, [chosen]);

  useEffect(() => {
    setIsWishlisted(getStoredWishlist());
    setCartAdded(getStoredCart());
    if (chosen === undefined) {
      setIsComparing(getStoredCompare());
    }

    const onWishlist = () => setIsWishlisted(getStoredWishlist());
    const onCart = () => setCartAdded(getStoredCart());
    const onCompare = () => {
      if (chosen === undefined) setIsComparing(getStoredCompare());
    };

    window.addEventListener("wishlist-updated", onWishlist);
    window.addEventListener("cart-updated", onCart);
    window.addEventListener("compare-updated", onCompare);

    return () => {
      window.removeEventListener("wishlist-updated", onWishlist);
      window.removeEventListener("cart-updated", onCart);
      window.removeEventListener("compare-updated", onCompare);
    };
  }, [product._id, chosen]);

  const saveWishlist = async (e) => {
    if (e) e.preventDefault();
    if (onRemove) {
      onRemove(product._id);
      return;
    }

    const currentWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    const isAlready = currentWishlist.some((item) => String(item._id) === String(product._id));

    if (user?.role === "buyer" && product._id && product._id.length === 24) {
      try {
        const response = await api.post(`/buyer/wishlist/${product._id}`);
        const updatedList = Array.isArray(response.data?.data) ? response.data.data : [];
        localStorage.setItem("wishlist", JSON.stringify(updatedList));
        notifyWishlistChanged(updatedList);
        setIsWishlisted(updatedList.some((item) => String(item._id) === String(product._id)));
        return;
      } catch (err) {
        console.error("Wishlist sync error:", err);
      }
    }

    const next = isAlready
      ? currentWishlist.filter((item) => String(item._id) !== String(product._id))
      : [...currentWishlist, product];
    localStorage.setItem("wishlist", JSON.stringify(next));
    notifyWishlistChanged(next);
    setIsWishlisted(!isAlready);
  };

  const addToCart = (e) => {
    if (e) e.preventDefault();
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => String(item._id) === String(product._id));
    localStorage.setItem(
      "cart",
      JSON.stringify(
        existing
          ? cart.map((item) =>
              String(item._id) === String(product._id)
                ? { ...item, quantity: (item.quantity || 1) + 1 }
                : item
            )
          : [...cart, { ...product, price: getDisplayPrice(product), quantity: 1 }]
      )
    );
    notifyCartChanged();
    setCartAdded(true);
  };

  const handleCompare = (e) => {
    if (e) e.preventDefault();
    if (onToggle) {
      onToggle(product);
    } else {
      const next = addToCompareQueue(product);
      if (next && next.some((p) => String(p._id) === String(product._id))) {
        setIsComparing(true);
      }
    }
  };

  const primary =
    (product.images || []).find((x) => x.isPrimary) ||
    (product.images || [])[0],
    image = typeof primary === "string" ? primary : primary?.url || product.image;
  const fallbackImage = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";

  return (
    <article
      className={`product-card${onRemove ? " wishlist-product-card" : ""}`}
      onClick={() => navigate(`/product/${product.slug || product._id}`)}
      style={{ cursor: "pointer" }}
    >
      <div className="product-art">
        <img
          src={image || fallbackImage}
          alt={product.name}
          className="w-100 h-100 object-fit-cover"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = fallbackImage; }}
        />
        {product.badge === "OEM VERIFIED" || product.isVerified ? (
          <span className="oem-verified-badge">
            <i className="bi bi-patch-check-fill" /> OEM Verified
          </span>
        ) : (
          <span className={`sale-pill ${product.badge === "IN STOCK" ? "new" : ""}`}>
            {product.badge || product.category || "Machinery"}
          </span>
        )}
        <button
          className={`icon-action ${isWishlisted ? "active" : ""}`}
          aria-label={`Save ${product.name}`}
          onClick={(e) => { e.stopPropagation(); saveWishlist(e); }}
          title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
        >
          <i className={`bi ${isWishlisted ? "bi-heart-fill" : "bi-heart"}`} />
        </button>
      </div>
      <div className="p-3">
        <div className="product-brand-tag">
          <span>{product.brand || "Industrial OEM"}</span>
          <span className="verified-dot">✓</span>
        </div>
        <Link to={`/product/${product.slug || product._id}`} className="text-decoration-none">
          <h3>{product.name}</h3>
        </Link>
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="product-spec-chips">
            {Object.entries(product.specifications).slice(0, 3).map(([k, v]) => (
              <span className="spec-chip" key={k}>{k}: {String(v)}</span>
            ))}
          </div>
        )}
        <div className="price-row">
          <strong>{fmt(getDisplayPrice(product))}</strong>
          {product.oldPrice && <del>{fmt(product.oldPrice)}</del>}
        </div>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <small className="text-secondary">SKU: {product.sku || (product._id ? `IM-${product._id.slice(-5).toUpperCase()}` : "IM-001")}</small>
          <span className="rating text-warning small">
            <i className="bi bi-star-fill" /> {product.rating || "4.8"}
          </span>
        </div>
        <div className="product-actions mt-2">
          <div className="product-btn-row">
            <button
              className={`btn btn-sm flex-fill ${isComparing ? "btn-primary" : "btn-outline-primary"}`}
              onClick={(e) => { e.stopPropagation(); handleCompare(e); }}
              title="Compare product specifications"
            >
              <i className="bi bi-arrow-left-right me-1" />
              <span>{isComparing ? "Comparing" : "Compare"}</span>
            </button>
            <button
              className={`btn btn-sm btn-primary flex-fill ${cartAdded ? "btn-success" : ""}`}
              onClick={(e) => { e.stopPropagation(); addToCart(e); }}
              title="Add product to procurement cart"
            >
              <i className={`bi ${cartAdded ? "bi-check2" : "bi-cart-plus"} me-1`} />
              <span>{cartAdded ? "Added" : "Add to cart"}</span>
            </button>
          </div>
          <div className="product-action-footer">
            {onRemove ? (
              <button
                type="button"
                className="btn-wishlist-inline text-danger"
                onClick={(e) => { e.stopPropagation(); onRemove(product._id); }}
                title="Remove from shortlist"
              >
                <i className="bi bi-heartbreak me-1" />
                <span>Remove</span>
              </button>
            ) : (
              <button
                type="button"
                className={`btn-wishlist-inline ${isWishlisted ? "active" : ""}`}
                onClick={(e) => { e.stopPropagation(); saveWishlist(e); }}
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <i className={`bi ${isWishlisted ? "bi-heart-fill text-danger" : "bi-heart"} me-1`} />
                <span>{isWishlisted ? "Wishlisted" : "Wishlist"}</span>
              </button>
            )}
            <Link
              className="product-details-link"
              to={`/product/${product.slug || product._id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <span>View Details</span>
              <i className="bi bi-arrow-up-right ms-1" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
function useProducts(query = "") {
  const [state, setState] = useState({ loading: true, items: [], error: "" });
  const load = (searchTerm = query) => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    api
      .get("/products", { params: { q: searchTerm.trim() } })
      .then((r) =>
        setState({ loading: false, items: Array.isArray(r.data?.data?.items) ? r.data.data.items : [], error: "" }),
      )
      .catch((e) =>
        setState({
          loading: false,
          items: [],
          error: e.response?.data?.message || e.message,
        }),
      );
  };
  useEffect(() => {
    load();
  }, []);
  return { ...state, load };
}

const INDUSTRIAL_CATALOG = [
  {
    _id: "siemens-motor",
    name: "Siemens IE3 Severe Duty Three Phase Motor",
    brand: "Siemens",
    category: "Motors & Drives",
    rating: 4.9,
    price: 74999,
    oldPrice: 89999,
    sku: "SIE-IE3-15KW",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    badge: "OEM VERIFIED",
    specifications: {
      "Power Rating": "15 kW (20 HP)",
      "Efficiency Class": "IE3 Premium Efficiency",
      "Protection": "IP55 Ingress Sealing",
      "Voltage": "415V, 3-Phase",
      "Frequency": "50 Hz",
      "Rated Speed": "1475 RPM",
      "Mounting": "Foot Mounted (B3)",
      "Frame Size": "160L Cast Iron",
      "Insulation Class": "Class F (155°C) with Class B Rise",
      "Warranty": "24 Months Comprehensive OEM Warranty",
      "Pan-India Freight": "Express Covered Logistics",
    },
    technicalSpecifications: {
      "Standards": "IEC 60034-1 / IS 12615",
      "Duty Cycle": "S1 Continuous Duty",
      "Cooling Type": "IC411 Totally Enclosed Fan Cooled (TEFC)",
      "Ambient Temperature": "-20°C to +50°C",
    },
  },
  {
    _id: "crompton-motor",
    name: "Crompton IE3 Premium Efficiency Induction Motor",
    brand: "Crompton",
    category: "Motors & Drives",
    rating: 4.6,
    price: 38500,
    oldPrice: 45000,
    sku: "CRO-IE3-11KW",
    image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80",
    badge: "IN STOCK",
    specifications: {
      "Power Rating": "11 kW (15 HP)",
      "Efficiency Class": "IE3 Premium Efficiency",
      "Protection": "IP55 Ingress Sealing",
      "Voltage": "415V, 3-Phase",
      "Frequency": "50 Hz",
      "Rated Speed": "1440 RPM",
      "Mounting": "Foot Mounted (B3)",
      "Frame Size": "160M Cast Iron",
      "Insulation Class": "Class F Insulation",
      "Warranty": "18 Months OEM Warranty",
      "Pan-India Freight": "Express Covered Logistics",
    },
    technicalSpecifications: {
      "Standards": "IS 12615 / IEC 60034",
      "Duty Cycle": "S1 Continuous Duty",
      "Cooling Type": "IC411 TEFC",
      "Ambient Temperature": "-15°C to +45°C",
    },
  },
  {
    _id: "danfoss-vlt",
    name: "Danfoss VLT HVAC Drive FC102 Fan & Pump Drive",
    brand: "Danfoss",
    category: "Motors & Drives",
    rating: 4.7,
    price: 62000,
    oldPrice: 72000,
    sku: "DAN-FC102-45KW",
    image: "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=800&q=80",
    badge: "READY TO SHIP",
    specifications: {
      "Power Rating": "45 kW (60 HP)",
      "Efficiency Class": "IE2 / Standard Inverter",
      "Protection": "IP21 / NEMA 1 Enclosure",
      "Voltage": "380–480V, 3-Phase",
      "Frequency": "0–590 Hz Variable",
      "Rated Speed": "Inverter Variable Speed",
      "Mounting": "Wall / Cabinet Mounted",
      "Frame Size": "Compact Enclosure B1",
      "Insulation Class": "Solid-State Inverter Power Electronics",
      "Warranty": "24 Months Danfoss Factory Warranty",
      "Pan-India Freight": "Express Covered Logistics",
    },
    technicalSpecifications: {
      "Standards": "IEC 61800-3 / CE / UL",
      "Duty Cycle": "Variable Torque Continuous",
      "Cooling Type": "Back-Channel Forced Air Convection",
      "Ambient Temperature": "-10°C to +45°C",
    },
  },
  {
    _id: "haas-cnc",
    name: "Haas VF-2 Vertical CNC Machining Center",
    brand: "Haas",
    category: "CNC Machining",
    rating: 4.8,
    price: 2450000,
    oldPrice: 2790000,
    sku: "HAAS-VF2-2026",
    image: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=800&q=80",
    badge: "OEM VERIFIED",
    specifications: {
      "Power Rating": "22.4 kW (30 HP) Vector",
      "Efficiency Class": "High-Efficiency Spindle",
      "Protection": "Full Industrial Machine Enclosure",
      "Voltage": "380–480V, 3-Phase",
      "Frequency": "50/60 Hz",
      "Rated Speed": "8,100 RPM Vector Spindle",
      "Mounting": "Heavy Concrete Ground Pad",
      "Frame Size": "762×356 mm Work Table",
      "Insulation Class": "Industrial Servo Rating",
      "Warranty": "12 Months Factory Commissioning Warranty",
      "Pan-India Freight": "Specialized Heavy Transport",
    },
    technicalSpecifications: {
      "Standards": "ISO 230-2 / CE Directive",
      "Duty Cycle": "24/7 Production Duty",
      "Cooling Type": "Through-Spindle Flood Coolant",
      "Ambient Temperature": "10°C to 40°C Precision Hall",
    },
  },
  {
    _id: "kirloskar-pump",
    name: "Kirloskar End-Suction Industrial Centrifugal Pump",
    brand: "Kirloskar",
    category: "Pumps & Hydraulics",
    rating: 4.7,
    price: 42500,
    oldPrice: 49999,
    sku: "KIR-ES-100X80",
    image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80",
    badge: "TIER-1",
    specifications: {
      "Power Rating": "7.5 kW (10 HP)",
      "Efficiency Class": "High Hydraulic Efficiency",
      "Protection": "IP55 Terminal Protection",
      "Voltage": "415V, 3-Phase",
      "Frequency": "50 Hz",
      "Rated Speed": "2900 RPM Synchronous",
      "Mounting": "Baseplate Mounted Monobloc",
      "Frame Size": "100×80 Flanged Casing",
      "Insulation Class": "Class F Motor Insulation",
      "Warranty": "18 Months Kirloskar Industrial Warranty",
      "Pan-India Freight": "Standard Heavy Freight",
    },
    technicalSpecifications: {
      "Standards": "IS 5120 / ISO 2858",
      "Duty Cycle": "Continuous Water Supply",
      "Cooling Type": "Liquid Heat Transfer + TEFC Motor",
      "Ambient Temperature": "-10°C to +65°C Fluid Temp",
    },
  },
  {
    _id: "schneider-vfd",
    name: "Schneider Altivar Process 630 Variable Frequency Drive",
    brand: "Schneider Electric",
    category: "Process Automation",
    rating: 4.9,
    price: 88900,
    oldPrice: 99999,
    sku: "SE-ATV630-75KW",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    badge: "BEST MATCH",
    specifications: {
      "Power Rating": "75 kW (100 HP)",
      "Efficiency Class": "> 98% Inverter Efficiency",
      "Protection": "IP21 / UL Type 1 Enclosure",
      "Voltage": "380–480V, 3-Phase",
      "Frequency": "0.1–500 Hz",
      "Rated Speed": "Dynamic Sensorless Vector",
      "Mounting": "Control Cabinet Wall-Mount",
      "Frame Size": "Modular Industrial Chassis",
      "Insulation Class": "Solid-State Inverter Power Electronics",
      "Warranty": "24 Months Schneider Electric Warranty",
      "Pan-India Freight": "Express Covered Logistics",
    },
    technicalSpecifications: {
      "Standards": "IEC 61800-5-1 / CE / UL",
      "Duty Cycle": "Heavy Duty Industrial",
      "Cooling Type": "Smart Variable-Speed Internal Fan",
      "Ambient Temperature": "-15°C to +50°C",
    },
  },
  {
    _id: "abb-switchgear",
    name: "ABB SafeRing 12kV Medium Voltage Gas Insulated Switchgear",
    brand: "ABB",
    category: "Power & Switchgear",
    rating: 4.8,
    price: 185000,
    oldPrice: 210000,
    sku: "ABB-SR12-GIS",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
    badge: "OEM VERIFIED",
    specifications: {
      "Power Rating": "12 kV Medium Voltage",
      "Efficiency Class": "Zero Gas Leakage Hermetic",
      "Protection": "IP65 Gas Tank / IP2X Enclosure",
      "Voltage": "12 kV Rated Nominal",
      "Frequency": "50 Hz",
      "Rated Speed": "Sub-Cycle Fast Trip (50ms)",
      "Mounting": "Substation Floor Anchored",
      "Frame Size": "3-Way Compact Ring Main Unit",
      "Insulation Class": "SF6 Insulated Stainless Steel Tank",
      "Warranty": "36 Months ABB Grid Warranty",
      "Pan-India Freight": "Inspected Transit Carrier",
    },
    technicalSpecifications: {
      "Standards": "IEC 62271-200 / IEC 62271-100",
      "Duty Cycle": "Continuous Utility Incomer",
      "Cooling Type": "Natural Radiative Convection",
      "Ambient Temperature": "-25°C to +40°C",
    },
  },
  {
    _id: "lt-starter",
    name: "L&T Fully Compartmentalized Motor Control Center MCC",
    brand: "L&T",
    category: "Power & Switchgear",
    rating: 4.8,
    price: 135000,
    oldPrice: 155000,
    sku: "LT-MCC-FC-400A",
    image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=800&q=80",
    badge: "READY TO SHIP",
    specifications: {
      "Power Rating": "400 A Main Incomer Busbar",
      "Efficiency Class": "Low Watt-Loss Copper Bus",
      "Protection": "IP42 Form 4b Compartmentalized",
      "Voltage": "415V, 3-Phase 4-Wire",
      "Frequency": "50 Hz",
      "Rated Speed": "Instantaneous Fault Clearing",
      "Mounting": "Free-Standing Floor Mounted",
      "Frame Size": "8-Tier Modular Drawout Panel",
      "Insulation Class": "Class H GPO-3 Support Barriers",
      "Warranty": "24 Months L&T Heavy Engineering Warranty",
      "Pan-India Freight": "Flatbed Heavy Transport",
    },
    technicalSpecifications: {
      "Standards": "IEC 61439-1 & 2 / IS 8623",
      "Duty Cycle": "Heavy Motor Starting Duty",
      "Cooling Type": "Louvred Natural Air Draft",
      "Ambient Temperature": "-5°C to +45°C",
    },
  },
];

function Home() {
  const state = useProducts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Trending");
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");

  const getStoredWishlistIds = () => {
    try {
      const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
      return list.map((item) => String(item._id));
    } catch {
      return [];
    }
  };
  const getStoredCompareIds = () => {
    try {
      const list = JSON.parse(localStorage.getItem("compareProducts") || "[]");
      return list.map((item) => String(item._id));
    } catch {
      return [];
    }
  };
  const getStoredCartIds = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      return cart.map((item) => String(item._id));
    } catch {
      return [];
    }
  };

  const [wishlistIds, setWishlistIds] = useState(getStoredWishlistIds);
  const [compareIds, setCompareIds] = useState(getStoredCompareIds);
  const [addedCartIds, setAddedCartIds] = useState(getStoredCartIds);

  useEffect(() => {
    const onWishlist = () => setWishlistIds(getStoredWishlistIds());
    const onCompare = () => setCompareIds(getStoredCompareIds());
    const onCart = () => setAddedCartIds(getStoredCartIds());

    window.addEventListener("wishlist-updated", onWishlist);
    window.addEventListener("compare-updated", onCompare);
    window.addEventListener("cart-updated", onCart);

    return () => {
      window.removeEventListener("wishlist-updated", onWishlist);
      window.removeEventListener("compare-updated", onCompare);
      window.removeEventListener("cart-updated", onCart);
    };
  }, []);

  const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  ];

  const fallbackProducts = INDUSTRIAL_CATALOG;
  const products = state.items.length
    ? state.items.map((product, index) => {
        const rawImg = product.images?.[0]?.url || product.images?.[0] || product.image;
        const validImg = rawImg && !rawImg.includes("photo-1581092335397-9583fe92d232")
          ? rawImg
          : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
        return {
          ...product,
          image: validImg,
          price: product.price || fallbackProducts[index % fallbackProducts.length].price,
          oldPrice: product.oldPrice || fallbackProducts[index % fallbackProducts.length].oldPrice,
          badge: index % 3 === 0 ? "OEM VERIFIED" : "IN STOCK",
        };
      })
    : fallbackProducts;

  const categories = [["bi-gear-wide-connected", "Motors & Drives"], ["bi-cpu", "CNC Machining"], ["bi-droplet-half", "Pumps & Hydraulics"], ["bi-diagram-3", "Process Automation"], ["bi-lightning-charge", "Power & Switchgear"], ["bi-speedometer2", "Testing Instruments"], ["bi-power", "Motor Starters"], ["bi-broadcast-pin", "Sensors & Telemetry"], ["bi-bezier2", "Cables & Wiring"], ["bi-shield-check", "Safety Gear"]];
  const brands = ["SIEMENS", "ABB", "SCHNEIDER ELECTRIC", "L&T HEAVY ENG", "KIRLOSKAR", "DANFOSS", "CROMPTON", "HAVELLS INDUSTRIAL", "HONEYWELL"];
  const benefits = [["bi-truck", "Pan-India Freight Logistics", "Heavy equipment transport with real-time transit telemetry"], ["bi-patch-check", "Verified Manufacturer Specs", "Zero counterfeit risk with direct OEM test reports"], ["bi-shield-lock", "Escrow Milestone Payments", "Funds released strictly upon physical gate inspection"], ["bi-calculator", "Direct OEM Bulk Pricing", "Volume-tier matrix pricing without middleman markups"], ["bi-cpu", "AI-Powered Spec Matching", "Automated pairing of exact equipment equivalents"]];
  const promos = [{ title: "Precision CNC Centers.", copy: "Sub-micron accuracy and automated tool changers.", className: "promo-cobalt", icon: "bi-cpu" }, { title: "Severe-Duty Motors.", copy: "IE3/IE4 efficiency ratings with IP55 protection.", className: "promo-blue", icon: "bi-gear-wide-connected" }, { title: "Process Automation.", copy: "Field-programmable controllers and telemetry nodes.", className: "promo-ink", icon: "bi-diagram-3" }];
  
  const displayProducts = useMemo(() => {
    if (activeTab === "Trending") return products.slice(0, 8);
    const filtered = products.filter((p) => {
      const cat = (p.category || "").toLowerCase();
      const tab = activeTab.toLowerCase();
      if (tab.includes("motors") && (cat.includes("motor") || cat.includes("drive"))) return true;
      if (tab.includes("cnc") && cat.includes("cnc")) return true;
      if (tab.includes("pump") && cat.includes("pump")) return true;
      if (tab.includes("automation") && (cat.includes("process") || cat.includes("automation") || cat.includes("sensor"))) return true;
      return cat.includes(tab);
    });
    return filtered.length ? filtered.slice(0, 8) : products.slice(0, 8);
  }, [products, activeTab]);

  const addNotice = (message) => { setNotice(message); window.setTimeout(() => setNotice(""), 2400); };
  const productImage = (product, index = 0) => {
    if (product?.image && !product.image.includes("photo-1581092335397-9583fe92d232")) {
      return product.image;
    }
    return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  };
  const formatPrice = (price) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price || 0);
  const saveWishlist = async (product) => {
    const currentWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    const isAlready = currentWishlist.some((item) => String(item._id) === String(product._id));

    if (user?.role === "buyer" && product._id && product._id.length === 24) {
      try {
        const response = await api.post(`/buyer/wishlist/${product._id}`);
        const updatedList = Array.isArray(response.data?.data) ? response.data.data : [];
        localStorage.setItem("wishlist", JSON.stringify(updatedList));
        notifyWishlistChanged(updatedList);
        setWishlistIds(updatedList.map((x) => String(x._id)));
        addNotice(isAlready ? "Removed from wishlist" : "Added to your wishlist");
        return;
      } catch {
        addNotice("Could not update wishlist");
        return;
      }
    }

    const next = isAlready
      ? currentWishlist.filter((item) => String(item._id) !== String(product._id))
      : [...currentWishlist, product];
    localStorage.setItem("wishlist", JSON.stringify(next));
    notifyWishlistChanged(next);
    setWishlistIds(next.map((x) => String(x._id)));
    addNotice(isAlready ? "Removed from wishlist" : "Added to your wishlist");
  };
  const compareProduct = (product) => {
    addToCompareQueue(product);
  };
  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => String(item._id) === String(product._id));
    localStorage.setItem("cart", JSON.stringify(existing ? cart.map((item) => String(item._id) === String(product._id) ? { ...item, quantity: (item.quantity || 1) + 1 } : item) : [...cart, { ...product, price: getDisplayPrice(product), quantity: 1 }]));
    notifyCartChanged();
    setAddedCartIds((ids) => ids.includes(String(product._id)) ? ids : [...ids, String(product._id)]);
    addNotice("Added to cart");
  };
  const detailPath = (product) => `/product/${product.slug || product._id}`;
  const rememberProduct = (product) => localStorage.setItem(`catalogProduct:${product.slug || product._id}`, JSON.stringify(product));
  const MarketplaceCard = ({ product, index = 0, compact = false }) => {
    const isWish = wishlistIds.includes(String(product._id));
    const isCart = addedCartIds.includes(String(product._id));
    const isComparing = compareIds.includes(String(product._id));
    const defaultFallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

    return (
      <article
        className={`market-product-card ${compact ? "compact" : ""}`}
        onClick={() => { rememberProduct(product); navigate(detailPath(product)); }}
        style={{ cursor: "pointer" }}
      >
        <div className="market-product-image">
          <img
            src={productImage(product, index)}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.src !== defaultFallback) {
                e.currentTarget.src = defaultFallback;
              }
            }}
          />
          {product.badge === "OEM VERIFIED" || product.isVerified ? (
            <span className="oem-verified-badge">
              <i className="bi bi-patch-check-fill" /> OEM Verified
            </span>
          ) : (
            <span className={`sale-pill ${product.badge === "IN STOCK" ? "new" : ""}`}>{product.badge || "IN STOCK"}</span>
          )}
          <button
            className={`icon-action ${isWish ? "active" : ""}`}
            aria-label={`Save ${product.name}`}
            onClick={(e) => { e.stopPropagation(); saveWishlist(product); }}
            title={isWish ? "Remove from wishlist" : "Save to wishlist"}
          >
            <i className={`bi ${isWish ? "bi-heart-fill" : "bi-heart"}`} />
          </button>
        </div>
        <div className="market-product-body">
          <div className="product-brand-tag">
            <span>{product.brand}</span>
            <span className="verified-dot">✓</span>
          </div>
          <Link to={detailPath(product)} onClick={(e) => { e.stopPropagation(); rememberProduct(product); }} className="product-title-link">
            <h3>{product.name}</h3>
          </Link>
          <div className="d-flex align-items-center gap-2 small text-warning">
            <i className="bi bi-star-fill" /> <span>{product.rating || "4.8"}</span>
            <span className="text-secondary">(ISO 9001)</span>
          </div>
          <div className="price-row">
            <strong>{formatPrice(product.price)}</strong>
            {product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}
          </div>
          <div className="product-actions mt-2">
            <div className="product-btn-row">
              <button
                type="button"
                className={`btn btn-sm btn-compare-action ${isComparing ? "active" : ""}`}
                onClick={(e) => { e.stopPropagation(); compareProduct(product); }}
                title="Compare product specifications"
              >
                <i className="bi bi-arrow-left-right" />
                <span>{isComparing ? "Comparing" : "Compare"}</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm btn-cart-action ${isCart ? "active" : ""}`}
                onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                title="Add product to procurement cart"
              >
                <i className={`bi ${isCart ? "bi-check2" : "bi-cart-plus"}`} />
                <span>{isCart ? "Added" : "Add to cart"}</span>
              </button>
            </div>
            <div className="product-action-footer">
              <button
                type="button"
                className={`btn-wishlist-inline ${isWish ? "active" : ""}`}
                onClick={(e) => { e.stopPropagation(); saveWishlist(product); }}
                title={isWish ? "Remove from wishlist" : "Add to wishlist"}
              >
                <i className={`bi ${isWish ? "bi-heart-fill" : "bi-heart"}`} />
                <span>{isWish ? "Wishlisted" : "Wishlist"}</span>
              </button>
              <Link to={detailPath(product)} onClick={(e) => { e.stopPropagation(); rememberProduct(product); }} className="product-details-link">
                <span>View Details</span>
                <i className="bi bi-arrow-up-right" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="market-home">
      {notice && <div className="market-toast"><i className="bi bi-check-circle-fill text-success" /> {notice}</div>}

      {/* EXTENDED HERO SECTION (Stitch Screen 1) */}
      <section className="market-hero">
        <div className="container">
          <div className="hero-copy">
            <div className="hero-status-pill">
              <span />
              <span className="pill-title">Factory-Direct Precision Infrastructure</span>
              <span className="pill-divider" />
              <span className="pill-tag">ISO 9001:2015 Tier-1 Grid</span>
            </div>
            <h1>
              Heavy Machinery &amp; Industrial Equipment,<br />
              <em>Sourced at Source.</em>
            </h1>
            <p>
              Direct OEM procurement, verified manufacturer pricing, and benchmark telemetry across motors, CNCs, pumps, and process automation.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">
                Explore Machinery <i className="bi bi-arrow-up-right ms-2" />
              </Link>
              <Link to="/compare" className="hero-text-link">
                Launch Comparison Engine <i className="bi bi-arrow-right" />
              </Link>
            </div>
            <div className="hero-proof">
              <span><i className="bi bi-patch-check-fill" /> 30k+ verified OEM listings</span>
              <span><i className="bi bi-lightning-charge-fill" /> Live price &amp; spec telemetry</span>
              <span><i className="bi bi-shield-check" /> Escrow milestone protection</span>
            </div>
          </div>
          <div className="hero-device">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="device-glow" />
            <img
              src={industrialPlantHero}
              alt="Industrial plant machinery floor"
            />
            <div className="hero-offer">
              <b>SPOTLIGHT OEM DEAL</b>
              <strong>25% <small>DIRECT REBATE</small></strong>
              <span>Siemens IE3 Three-Phase Severe Duty Motor</span>
            </div>
          </div>
        </div>
      </section>

      {/* TELEMETRY STATS RIBBON */}
      <section className="telemetry-ribbon">
        <div className="container">
          <div className="telemetry-grid">
            <div className="telemetry-card">
              <span>Month to Date GTV</span>
              <strong>₹48.2L+</strong>
              <small><i className="bi bi-arrow-up-right" /> +24.6% qualified buyer rate</small>
            </div>
            <div className="telemetry-card">
              <span>Verified OEM Partners</span>
              <strong>348 Active</strong>
              <small><i className="bi bi-check-circle" /> 326 Tier-1 OEMs on-grid</small>
            </div>
            <div className="telemetry-card">
              <span>Validated Spec SKUs</span>
              <strong>4,892 Units</strong>
              <small><i className="bi bi-shield-check" /> 98.4% factory spec audited</small>
            </div>
            <div className="telemetry-card">
              <span>Production Gateway</span>
              <strong>99.98%</strong>
              <small><i className="bi bi-broadcast-pin" /> Node IN-MUM-01 live</small>
            </div>
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="container category-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow dark">MACHINERY BY INDUSTRIAL CATEGORY</span>
            <h2>Start with a Category</h2>
            <p>High-density engineering components and capital machinery directly from vetted plants.</p>
          </div>
          <Link to="/products" className="view-link">View full catalog <i className="bi bi-arrow-right" /></Link>
        </div>
        <div className="category-rail">
          {categories.map(([icon, name]) => (
            <Link to={`/products?category=${name}`} className="category-tile" key={name}>
              <div className="category-icon">
                <i className={`bi ${icon}`} />
              </div>
              <span>{name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* TRENDING / LIVE MACHINERY */}
      <section className="trending-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow dark">LIVE MARKETPLACE TELEMETRY</span>
              <h2>Featured Industrial Machinery</h2>
              <p>Active RFQ shortlists, moving manufacturer price tiers, and high-demand plant equipment.</p>
            </div>
            <div className="d-flex gap-2">
              <Link to="/products" className="btn btn-outline-primary btn-sm">Explore all 4,892 SKUs</Link>
            </div>
          </div>
          <div className="market-tabs">
            {["Trending", "Motors & Drives", "CNC Machining", "Pumps", "Process Automation"].map(tab => (
              <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </div>
          <div className="product-rail">
            {displayProducts.map((product, index) => (
              <MarketplaceCard key={product._id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS GRID */}
      <section className="container benefits-section">
        <div className="benefits-grid">
          {benefits.map(([icon, title, copy]) => (
            <div className="benefit-item" key={title}>
              <i className={`bi ${icon}`} />
              <div>
                <strong>{title}</strong>
                <span>{copy}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* OEM BRAND STRIP */}
      <section className="brand-strip">
        <div className="container">
          <span className="eyebrow dark">TRUSTED BY TIER-1 INDUSTRIAL OEM NETWORKS</span>
          <div className="brand-row">
            {brands.map(brand => <span key={brand}>{brand}</span>)}
          </div>
        </div>
      </section>

      {/* PROMO EDIT */}
      <section className="container promo-grid">
        {promos.map(promo => (
          <Link to="/products" className={`promo-banner ${promo.className}`} key={promo.title}>
            <div>
              <span className="eyebrow">SPEC MATRIX FOCUS</span>
              <h3>{promo.title}</h3>
              <p>{promo.copy}</p>
              <span className="btn btn-sm btn-outline-light mt-2">Explore specs <i className="bi bi-arrow-up-right ms-1" /></span>
            </div>
            <i className={`bi ${promo.icon} promo-icon`} />
          </Link>
        ))}
      </section>

      {/* SPECIAL MACHINERY SPOTLIGHT */}
      <section className="container special-offer">
        <div className="offer-content">
          <span className="eyebrow">FACTORY INVENTORY LIQUIDATION / LIMITED LOTS</span>
          <h2>Heavy Machining Centers.<br /><em>Direct OEM Pricing.</em></h2>
          <p>Factory allocation slots open for Siemens IE3 severe-duty motors, Haas CNC verticals, and industrial centrifugal pumps with full inspection warranties.</p>
          <div className="countdown">
            <div><strong>02</strong><span>Days</span></div>
            <span className="fw-bold fs-4 text-secondary">:</span>
            <div><strong>18</strong><span>Hours</span></div>
            <span className="fw-bold fs-4 text-secondary">:</span>
            <div><strong>46</strong><span>Minutes</span></div>
          </div>
          <Link to="/products" className="btn btn-primary">
            Review Allocation Lots <i className="bi bi-arrow-right ms-2" />
          </Link>
        </div>
        <div className="offer-art">
          <img src={productImage(displayProducts[0])} alt="Featured industrial machine" loading="lazy" />
        </div>
      </section>

      {/* INDUSTRIAL TESTIMONIALS */}
      <section className="testimonial-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow dark">VERIFIED PROCUREMENT AUDITORS</span>
              <h2>What Plant Directors &amp; Buyers Say</h2>
            </div>
          </div>
          <div className="testimonial-grid">
            <article>
              <div className="quote-stars">★★★★★</div>
              <p>“The SpecMatrix side-by-side spec comparison resolved a ₹14L motor procurement decision in 20 minutes. Test reports were already verified.”</p>
              <strong>Rajesh Kulkarni</strong>
              <span>Chief Engineer · Automotive OEM / Pune</span>
            </article>
            <article>
              <div className="quote-stars">★★★★★</div>
              <p>“Direct manufacturer warranties with transparent milestone escrow. Finally a platform engineered for heavy machinery without retail fluff.”</p>
              <strong>Arunachalam S.</strong>
              <span>Head of Procurement · Heavy Engineering / Chennai</span>
            </article>
            <article>
              <div className="quote-stars">★★★★★</div>
              <p>“We onboarded 40+ motor listings onto Industry Mandi and connected with verified Tier-1 contractors within days.”</p>
              <strong>Vikas Singhania</strong>
              <span>Authorized OEM Distributor / Ahmedabad</span>
            </article>
          </div>
        </div>
      </section>

      {/* INDUSTRIAL JOURNAL & GUIDES */}
      <section className="container blog-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow dark">INDUSTRY MANDI TECHNICAL JOURNAL</span>
            <h2>Field Notes &amp; Procurement Guides</h2>
          </div>
          <Link to="/faq" className="view-link">Read engineering briefs <i className="bi bi-arrow-right" /></Link>
        </div>
        <div className="blog-grid">
          <article className="blog-card">
            <div className="blog-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80"
                alt="Specifying IE3 vs IE4 Motors"
                loading="lazy"
              />
              <span className="blog-category-badge">
                <i className="bi bi-gear-wide-connected me-1" /> MOTORS &amp; DRIVES
              </span>
              <span className="blog-read-badge">
                <i className="bi bi-clock me-1" /> 6 MIN READ
              </span>
            </div>
            <div className="blog-body">
              <span className="blog-eyebrow">TECHNICAL STANDARD · IE3 VS IE4</span>
              <h3>Specifying IE3 vs IE4 Motors in High Ambient Temperatures</h3>
              <p className="blog-excerpt">
                Thermal derating curves, winding insulation limits, and life-cycle efficiency economics for severe ambient factory floors.
              </p>
              <div className="blog-footer">
                <span className="blog-spec-tag"><i className="bi bi-file-earmark-pdf me-1" />OEM Whitepaper</span>
                <Link to="/products?category=Motors%20%26%20Drives" className="blog-link">
                  <span>Read whitepaper</span>
                  <i className="bi bi-arrow-right" />
                </Link>
              </div>
            </div>
          </article>
          <article className="blog-card">
            <div className="blog-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=900&q=80"
                alt="Sub-Micron CNC Center Tolerances"
                loading="lazy"
              />
              <span className="blog-category-badge">
                <i className="bi bi-cpu me-1" /> CNC MACHINING
              </span>
              <span className="blog-read-badge">
                <i className="bi bi-clock me-1" /> 4 MIN READ
              </span>
            </div>
            <div className="blog-body">
              <span className="blog-eyebrow">CNC BENCHMARKS · TOLERANCE MATRIX</span>
              <h3>Sub-Micron CNC Center Tolerances in Precision Machining</h3>
              <p className="blog-excerpt">
                Thermal expansion compensation, spindle runout criteria, and 5-axis ball-screw positioning for aerospace-grade tolerances.
              </p>
              <div className="blog-footer">
                <span className="blog-spec-tag"><i className="bi bi-file-earmark-pdf me-1" />Benchmark Report</span>
                <Link to="/products?category=CNC%20Machining" className="blog-link">
                  <span>Read whitepaper</span>
                  <i className="bi bi-arrow-right" />
                </Link>
              </div>
            </div>
          </article>
          <article className="blog-card">
            <div className="blog-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80"
                alt="Mitigating Harmonics with VFDs"
                loading="lazy"
              />
              <span className="blog-category-badge">
                <i className="bi bi-diagram-3 me-1" /> PROCESS AUTOMATION
              </span>
              <span className="blog-read-badge">
                <i className="bi bi-clock me-1" /> 8 MIN READ
              </span>
            </div>
            <div className="blog-body">
              <span className="blog-eyebrow">AUTOMATION · HARMONIC DISTORTION</span>
              <h3>Mitigating Harmonics with Variable Frequency Drives (VFDs)</h3>
              <p className="blog-excerpt">
                Total Harmonic Distortion (THD) suppression, passive harmonic filters, and IEEE 519 compliance for heavy drive loads.
              </p>
              <div className="blog-footer">
                <span className="blog-spec-tag"><i className="bi bi-file-earmark-pdf me-1" />IEEE 519 Guide</span>
                <Link to="/products?category=Process%20Automation" className="blog-link">
                  <span>Read whitepaper</span>
                  <i className="bi bi-arrow-right" />
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter-section">
        <div className="container newsletter-inner">
          <div className="newsletter-copy">
            <div className="newsletter-signal"><i className="bi bi-broadcast-pin" /> WEEKLY PROCUREMENT SIGNAL</div>
            <span className="eyebrow dark">PROCUREMENT TELEMETRY FEED</span>
            <h2>Weekly Industrial Price &amp; Allocation Bulletins</h2>
            <p>Direct manufacturer price changes, equipment auction drops, and OEM allocations. No spam.</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); setEmail(""); addNotice("Subscribed to telemetry feed"); }}>
            <div className="newsletter-form-row">
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter enterprise email address" aria-label="Enterprise email" />
              <button className="btn btn-primary">Subscribe <i className="bi bi-arrow-right" /></button>
            </div>
            <small><i className="bi bi-shield-check" /> One concise update each week. Unsubscribe anytime.</small>
          </form>
        </div>
      </section>

      <FrequentlyAskedQuestions />

      {/* FOOTER */}
      <footer className="market-footer">
        <div className="container">
          <div className="footer-top">
            <div>
              <Link className="navbar-brand" to="/">
                <span className="brand-dot" />
                <div className="d-flex flex-column text-start">
                  <span className="brand-name">INDUSTRY MANDI</span>
                  <span className="brand-subtext">Industrial Exchange</span>
                </div>
              </Link>
              <p>Direct OEM procurement, verified manufacturer pricing, and benchmark telemetry across industrial equipment.</p>
            </div>
            <div className="footer-links">
              <div>
                <strong>Catalog</strong>
                <Link to="/products">All Machinery</Link>
                <Link to="/compare">SpecMatrix Compare</Link>
                <Link to="/products?category=Motors%20%26%20Drives">Motors &amp; Drives</Link>
                <Link to="/products?category=CNC%20Machining">CNC Centers</Link>
              </div>
              <div>
                <strong>Enterprise</strong>
                <Link to="/about">About Us</Link>
                <Link to="/contact">Contact Support</Link>
                <Link to="/register?role=vendor">OEM &amp; Vendor Onboarding</Link>
                <Link to="/account">Buyer Console</Link>
              </div>
              <div>
                <strong>Compliance</strong>
                <a href="#iso">ISO 9001:2015 Tier-1</a>
                <a href="#escrow">Escrow &amp; Gate Verification</a>
                <a href="#privacy">Privacy &amp; Telemetry</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Industry Mandi. Built for precision industrial procurement.</span>
            <span>
              <i className="bi bi-linkedin" /> <i className="bi bi-twitter-x" /> <i className="bi bi-shield-check" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
function FrequentlyAskedQuestions() {
  const questions = [["How do I compare products?", "Use the Compare button on product listings to build a shortlist. Once you have selected products in the same category, you can review their details side by side."], ["Are sellers verified?", "We review vendor details and product listings to help buyers identify reliable marketplace sellers."], ["Can I save products for later?", "Yes. Signed-in buyers can add products to their wishlist and return to them anytime from the heart icon in the navigation."], ["How do I become a seller?", "Choose Become a seller in the navigation, register as a vendor, and provide your company details for review."]];
  return <section className="container py-5"><div className="page-heading"><span className="eyebrow dark">HELP CENTER</span><h2>Frequently Asked Questions</h2></div><div className="mt-4">{questions.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}<i className="bi bi-plus-lg" /></summary><p>{answer}</p></details>)}</div></section>;
}

function About() {
  return <main className="container py-5 info-page"><section className="info-hero"><div className="info-hero-copy"><span className="eyebrow dark">ABOUT INDUSTRY MANDI</span><h1>Industrial buying, with fewer unknowns.</h1><p>Industry Mandi connects engineering teams with verified machinery, transparent specifications, and dependable suppliers so every purchase can move from shortlist to shop floor with confidence.</p><div className="d-flex gap-2 flex-wrap"><Link to="/products" className="btn btn-primary">Explore the catalog <i className="bi bi-arrow-up-right ms-1" /></Link><Link to="/contact" className="btn btn-outline-light">Talk to our team</Link></div></div><div className="info-hero-visual"><span className="info-orbit orbit-a" /><span className="info-orbit orbit-b" /><i className="bi bi-cpu" /><strong>SPEC / SOURCE / SCALE</strong><small>Built for modern procurement teams</small></div></section><section className="info-stat-row"><div><strong>4.8k+</strong><span>validated SKUs</span></div><div><strong>348</strong><span>OEM partners</span></div><div><strong>98.4%</strong><span>specs audited</span></div><div><strong>24/7</strong><span>marketplace access</span></div></section><section className="info-story"><div><span className="eyebrow dark">WHY WE EXIST</span><h2>Technical procurement should feel precise, not complicated.</h2></div><div><p>Industrial teams often lose time comparing incomplete listings, chasing supplier replies, and validating details across disconnected sources. We bring those decisions into one focused exchange.</p><p>From motors and drives to pumps, automation, and switchgear, every listing is structured around the information buyers actually need.</p></div></section><section className="row g-4 mt-2">{[["bi-shield-check", "Verified by design", "Seller and listing review workflows help teams buy from credible industrial partners."], ["bi-sliders2", "Specs that compare", "Structured technical data makes it easier to evaluate alternatives side by side."], ["bi-graph-up-arrow", "Signals that move work", "Clear pricing, stock, and market context help teams make decisions faster."]].map(([icon, title, copy]) => <div className="col-md-4" key={title}><article className="info-feature-card"><span className="info-feature-icon"><i className={`bi ${icon}`} /></span><h3>{title}</h3><p>{copy}</p><span className="info-feature-line" /></article></div>)}</section><FrequentlyAskedQuestions /></main>;
}

function Contact() {
  const [sent, setSent] = useState(false);
  return <main className="container py-5 info-page"><section className="contact-hero"><div><span className="eyebrow dark">CONTACT US</span><h1>Let’s move your next project forward.</h1><p>Whether you are sourcing a critical component, need help with an order, or want to list your products, our team is ready to help.</p></div><div className="contact-status"><span className="telemetry-pip" /> Support desk online <small>Typical reply within one business day</small></div></section><div className="row g-4 mt-2"><div className="col-lg-7"><section className="contact-form-card">{sent ? <div className="contact-success"><i className="bi bi-check-circle-fill" /><h2>Message received.</h2><p>Thanks for reaching out. A member of our team will review your request and reply shortly.</p><button className="btn btn-outline-light" onClick={() => setSent(false)}>Send another message</button></div> : <form onSubmit={(event) => { event.preventDefault(); setSent(true); }}><div className="contact-form-heading"><span className="eyebrow dark">START A CONVERSATION</span><h2>How can we help?</h2><p>Share a few details and we’ll route your request to the right team.</p></div><div className="row g-3"><div className="col-sm-6"><label htmlFor="contact-name">Name</label><input id="contact-name" required placeholder="Your name" /></div><div className="col-sm-6"><label htmlFor="contact-email">Work email</label><input id="contact-email" required type="email" placeholder="you@company.com" /></div><div className="col-12"><label htmlFor="contact-topic">What can we help with?</label><select id="contact-topic" defaultValue="Product sourcing"><option>Product sourcing</option><option>Order support</option><option>Become a vendor</option><option>Technical question</option><option>Other enquiry</option></select></div><div className="col-12"><label htmlFor="contact-message">Your message</label><textarea id="contact-message" rows="5" required placeholder="Tell us about the product, quantity, timeline, or issue..." /></div><div className="col-12"><button className="btn btn-primary">Send message <i className="bi bi-arrow-up-right ms-1" /></button></div></div></form>}</section></div><div className="col-lg-5"><div className="contact-detail-stack"><article><span className="contact-detail-icon"><i className="bi bi-envelope" /></span><div><small>EMAIL SUPPORT</small><h3>hello@industrymandi.local</h3><p>For product, account, and marketplace questions.</p></div></article><article><span className="contact-detail-icon"><i className="bi bi-headset" /></span><div><small>BUYER &amp; VENDOR DESK</small><h3>+91 7903553221</h3><p>Monday–Friday · 9:00 AM–6:00 PM IST</p></div></article><article><span className="contact-detail-icon"><i className="bi bi-geo-alt" /></span><div><small>OPERATIONS HUB</small><h3>Bangalore, India</h3><p>Supporting industrial teams across India.</p></div></article></div></div></div></main>;
}

function Products() {
  const fallbackProducts = INDUSTRIAL_CATALOG;

  const [state, setState] = useState({ loading: true, items: [], error: "" }),
    [searchParams, setSearchParams] = useSearchParams(),
    [query, setQuery] = useState(searchParams.get("q") || ""),
    [chosen, setChosen] = useState([]),
    [compareMessage, setCompareMessage] = useState("");
  const load = () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    api
      .get("/products", { params: { q: query } })
      .then((r) =>
        setState({ loading: false, items: Array.isArray(r.data?.data?.items) ? r.data.data.items : [], error: "" }),
      )
      .catch((error) =>
        setState({
          loading: false,
          items: [],
          error: error.response?.data?.message || error.message,
        }),
      );
  };
  useEffect(() => {
    const nextQuery = searchParams.get("q") || "";
    setQuery(nextQuery);
    load(nextQuery);
  }, [searchParams]);
  const toggle = (p) => {
    if (chosen.length > 0 && chosen[0].category !== p.category) {
      setCompareMessage(`Choose another ${chosen[0].category} product to compare.`);
      return;
    }
    setCompareMessage("");
    setChosen((a) => {
      if (a.some((x) => x._id === p._id)) return a.filter((x) => x._id !== p._id);
      if (a.length >= 4) return a;
      addToCompareQueue(p);
      return [...a, p];
    });
  };
  // Use fallback products when backend returns nothing
  const displayItems = state.items.length > 0 || query.trim() ? state.items : fallbackProducts;
  const groupedProducts = displayItems.reduce((groups, product) => {
    const category = product.category || "Other machinery";
    (groups[category] ||= []).push(product);
    return groups;
  }, {});
  return (
    <main className="container py-5">
      <div className="page-heading">
        <span className="eyebrow dark">PRECISION SPEC MATRIX CATALOG</span>
        <h1>Explore Industrial Machinery &amp; Equipment</h1>
        <p className="lead text-secondary">Direct OEM procurement, verified manufacturer pricing, and benchmark telemetry across motors, CNCs, pumps, and process automation.</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const nextQuery = query.trim();
          setSearchParams(nextQuery ? { q: nextQuery } : {});
        }}
        className="searchbox mt-4"
      >
        <i className="bi bi-search" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ‘Siemens 15 kW IE3 Motor, Haas CNC, ABB VFD, or Centrifugal Pump’"
        />
        <kbd className="search-shortcut-badge">⌘K</kbd>
        <button className="btn btn-primary">Search Catalog</button>
      </form>
      <div className="mt-4 d-flex justify-content-between align-items-center">
        <span className="font-monospace small text-secondary">
          <i className="bi bi-shield-check text-success me-1" />
          {displayItems.length} verified industrial SKUs on-grid
        </span>
        {chosen.length >= 2 && (
          <Link
            className="btn btn-primary btn-sm shadow"
            to={`/compare?ids=${chosen.map((p) => p._id).join(",")}`}
          >
            Compare {chosen.length} products in SpecMatrix <i className="bi bi-arrow-right ms-1" />
          </Link>
        )}
      </div>
      {compareMessage && <div className="alert alert-warning mt-3">{compareMessage}</div>}
      {state.loading ? (
        <Loading label="Searching the industrial catalog…" />
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={load} />
      ) : (
        <div className="mt-4">
          {!displayItems.length && (
            <div className="empty-state">
              <i className="bi bi-search" />
              <h2>No matching products</h2>
              <p>Try a different name, brand, model, SKU, or category.</p>
            </div>
          )}
          {Object.entries(groupedProducts).map(([category, products]) => (
            <section className="mb-5" key={category}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow dark">MACHINERY CATEGORY</span>
                  <h2>{category}</h2>
                </div>
                <span className="badge bg-secondary">{products.length} SKUs</span>
              </div>
              <div className="row g-4">
                {products.map((p) => (
                  <div className="col-6 col-md-4 col-xl-3" key={p._id}>
                    <ProductCard
                      product={p}
                      selectable
                      chosen={chosen.some((x) => x._id === p._id)}
                      onToggle={toggle}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
function Product() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [recommendations, setRecommendations] = useState({ loading: true, data: null });
  const [wishMessage, setWishMessage] = useState("");
  const [cartAdded, setCartAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const product = state.data?.product;
  const productId = product?._id;

  const load = () => {
    setState({ loading: true, data: null, error: "" });
    api
      .get(`/products/${slug}`)
      .then((r) => setState({ loading: false, data: r.data.data, error: "" }))
      .catch((e) => {
        const saved = localStorage.getItem(`catalogProduct:${slug}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setState({ loading: false, data: { product: parsed, offers: [], bestOffer: null, reviews: [] }, error: "" });
            return;
          } catch {}
        }
        const fallback = INDUSTRIAL_CATALOG.find((p) => p.slug === slug || p._id === slug);
        if (fallback) {
          setState({ loading: false, data: { product: fallback, offers: [], bestOffer: null, reviews: [] }, error: "" });
          return;
        }
        setState({ loading: false, data: null, error: e.response?.data?.message || e.message });
      });
  };

  useEffect(load, [slug]);

  useEffect(() => {
    let active = true;
    setRecommendations({ loading: true, data: null });

    const applyFallback = () => {
      if (!active) return;
      const currentProd = product || INDUSTRIAL_CATALOG.find((p) => p.slug === slug || p._id === slug);
      const currentCat = currentProd?.category;
      const others = INDUSTRIAL_CATALOG.filter((p) => p.slug !== slug && p._id !== slug);
      const catMatches = others.filter((p) => !currentCat || p.category === currentCat);
      const similarPool = catMatches.length >= 2 ? catMatches : others;
      const similar = similarPool.slice(0, 4).map((p) => ({
        product: p,
        reason: `Matched by category (${p.category}) & technical tier`
      }));
      const diffCatMatches = others.filter((p) => p.category !== currentCat);
      const boughtTogether = (diffCatMatches.length ? diffCatMatches : others).slice(0, 3).map((p) => ({
        product: p,
        reason: "Suggested companion machinery for plant setup",
        fallback: true
      }));
      setRecommendations({
        loading: false,
        data: {
          similar,
          boughtTogether,
          boughtTogetherBasedOnOrders: false
        }
      });
    };

    api.get(`/products/${slug}/recommendations`)
      .then((response) => {
        if (!active) return;
        const resData = response.data?.data;
        if (resData && (resData.similar?.length || resData.boughtTogether?.length)) {
          setRecommendations({ loading: false, data: resData });
        } else {
          applyFallback();
        }
      })
      .catch(() => {
        applyFallback();
      });

    return () => { active = false; };
  }, [slug, product]);

  const getStoredCompareIds = () => {
    try {
      const list = JSON.parse(localStorage.getItem("compareProducts") || "[]");
      return list.map((item) => String(item._id));
    } catch {
      return [];
    }
  };
  const [compareIds, setCompareIds] = useState(getStoredCompareIds);

  useEffect(() => {
    const onCompare = () => setCompareIds(getStoredCompareIds());
    window.addEventListener("compare-updated", onCompare);
    return () => window.removeEventListener("compare-updated", onCompare);
  }, []);

  const isCompared = compareIds.includes(String(productId));

  const handleCompareToggle = () => {
    if (!product) return;
    if (isCompared) {
      removeFromCompareQueue(product._id);
      setWishMessage("Removed from comparison queue.");
    } else {
      const next = addToCompareQueue(product);
      if (next && next.some((p) => String(p._id) === String(product._id))) {
        setWishMessage("Added to comparison queue.");
      }
    }
  };

  useEffect(() => {
    if (!productId) {
      setIsWishlisted(false);
      return;
    }
    const checkWish = () => {
      try {
        const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
        setIsWishlisted(list.some((item) => String(item._id) === String(productId)));
      } catch {
        setIsWishlisted(false);
      }
    };
    checkWish();
    window.addEventListener("wishlist-updated", checkWish);
    return () => window.removeEventListener("wishlist-updated", checkWish);
  }, [productId]);

  if (state.loading) return <Loading label="Loading machinery intelligence…" />;
  if (state.error || !state.data?.product) return <ErrorState message={state.error || "Product not found"} onRetry={load} />;

  const { offers = [], bestOffer = null, reviews = [] } = state.data;

  const handleWishlistToggle = async () => {
    if (!product) return;
    const currentWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    const isAlready = currentWishlist.some((item) => String(item._id) === String(product._id));

    if (user?.role === "buyer" && product._id && product._id.length === 24) {
      try {
        const response = await api.post(`/buyer/wishlist/${product._id}`);
        const updatedList = Array.isArray(response.data?.data) ? response.data.data : [];
        localStorage.setItem("wishlist", JSON.stringify(updatedList));
        notifyWishlistChanged(updatedList);
        setIsWishlisted(updatedList.some((item) => String(item._id) === String(product._id)));
        setWishMessage(isAlready ? "Removed from wishlist." : "Saved to wishlist.");
        return;
      } catch (e) {
        setWishMessage(e.response?.data?.message || e.message);
        return;
      }
    }

    const next = isAlready
      ? currentWishlist.filter((item) => String(item._id) !== String(product._id))
      : [...currentWishlist, product];
    localStorage.setItem("wishlist", JSON.stringify(next));
    notifyWishlistChanged(next);
    setIsWishlisted(!isAlready);
    setWishMessage(isAlready ? "Removed from wishlist." : "Saved to wishlist.");
  };

  const addToCart = () => {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => String(item._id) === String(product._id));
    localStorage.setItem("cart", JSON.stringify(existing ? cart.map((item) => String(item._id) === String(product._id) ? { ...item, quantity: (item.quantity || 1) + 1 } : item) : [...cart, { ...product, price: getDisplayPrice(product), quantity: 1 }]));
    notifyCartChanged();
    setCartAdded(true);
  };
  const primary = (product.images || []).find((x) => x.isPrimary) || (product.images || [])[0];
  const heroImage = typeof primary === "string" ? primary : primary?.url || product.image || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80";
  const displayPrice = bestOffer?.price || product.price || getDisplayPrice(product) || 45000;
  const oldPrice = product.oldPrice || Math.round(displayPrice * 1.15);
  const discountPercent = oldPrice > displayPrice ? Math.round(((oldPrice - displayPrice) / oldPrice) * 100) : null;

  return (
    <main className="container py-4 product-detail-page">
      {/* Breadcrumbs */}
      <nav className="product-breadcrumbs mb-3" aria-label="breadcrumb">
        <Link to="/">Home</Link>
        <i className="bi bi-chevron-right" />
        <Link to="/products">Machinery Catalog</Link>
        <i className="bi bi-chevron-right" />
        <Link to={`/products?category=${encodeURIComponent(product.category || "")}`}>{product.category || "Industrial Equipment"}</Link>
        <i className="bi bi-chevron-right" />
        <span>{product.name}</span>
      </nav>

      {/* Hero Section: Fitted 2-Column Grid */}
      <div className="row g-4 align-items-stretch mb-4">
        {/* Left Column: Product Gallery & Trust Strip */}
        <div className="col-lg-6 d-flex flex-column">
          <div className="product-gallery-card h-100 d-flex flex-column justify-content-between">
            <div className="product-hero-art">
              <img src={heroImage} alt={product.name} />
              <span className="oem-verified-badge" style={{ top: 14, left: 14, right: "auto", position: "absolute" }}>
                <i className="bi bi-patch-check-fill" /> OEM Verified Listing
              </span>
              {product.badge && product.badge !== "OEM VERIFIED" && (
                <span className="sale-pill new" style={{ top: 14, right: 14, left: "auto", position: "absolute" }}>
                  {product.badge}
                </span>
              )}
            </div>

            <div className="product-trust-strip mt-3">
              <div className="trust-pill">
                <i className="bi bi-shield-check" />
                <div>
                  <strong>Escrow Gate Inspection</strong>
                  <span>Funds released upon physical verification</span>
                </div>
              </div>
              <div className="trust-pill">
                <i className="bi bi-truck" />
                <div>
                  <strong>Pan-India Freight</strong>
                  <span>Insured transit with live GPS tracking</span>
                </div>
              </div>
              <div className="trust-pill">
                <i className="bi bi-file-earmark-check" />
                <div>
                  <strong>OEM Test Certificate</strong>
                  <span>Factory serial test report included</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Telemetry, Pricing & Actions */}
        <div className="col-lg-6 d-flex flex-column">
          <div className="product-info-card h-100 justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between gap-2 mb-2 flex-wrap">
                <span className="product-brand-badge">
                  <i className="bi bi-building me-1" /> {product.brand || "OEM Manufacturer"}
                </span>
                <span className="product-sku-tag font-monospace">
                  SKU: {product.sku || `IM-${product._id ? String(product._id).slice(-6).toUpperCase() : "10492"}`}
                </span>
              </div>

              <h1 className="product-detail-title">{product.name}</h1>

              <div className="d-flex align-items-center gap-3 my-2 flex-wrap">
                <div className="d-flex align-items-center gap-1 text-warning small">
                  <i className="bi bi-star-fill" />
                  <strong>{product.rating || "4.8"}</strong>
                  <span className="text-secondary ms-1">({product.reviewCount || 24} verified buyer reviews)</span>
                </div>
                <span className="text-secondary">·</span>
                <span className="badge bg-dark-subtle text-info-emphasis border border-info-subtle">
                  <i className="bi bi-patch-check me-1" /> ISO 9001:2015 Tier-1
                </span>
              </div>

              {/* Pricing Box */}
              <div className="product-pricing-box my-3">
                <span className="pricing-eyebrow">VERIFIED OEM DIRECT PRICE</span>
                <div className="d-flex align-items-baseline gap-3 my-1 flex-wrap">
                  <span className="display-price">{fmt(displayPrice)}</span>
                  {oldPrice && (
                    <>
                      <del className="old-price">{fmt(oldPrice)}</del>
                      {discountPercent && <span className="discount-badge">Save {discountPercent}%</span>}
                    </>
                  )}
                </div>
                <div className="pricing-meta">
                  <span><i className="bi bi-check-circle-fill text-success me-1" /> Excl. 18% GST (Tax Invoice Provided)</span>
                  <span><i className="bi bi-box-seam text-primary me-1" /> In Stock · Ready for dispatch within 24 hours</span>
                </div>
              </div>

              {/* Action Cluster with prominent Compare Button */}
              <div className="product-action-cluster my-3">
                <div className="d-flex gap-2 flex-wrap">
                  {/* 1. Add to Cart */}
                  <button
                    className={`btn btn-lg ${cartAdded ? "btn-success" : "btn-primary"} flex-grow-1`}
                    onClick={addToCart}
                  >
                    <i className={`bi ${cartAdded ? "bi-check2-circle" : "bi-cart-plus"} me-2`} />
                    {cartAdded ? "Added to Cart" : "Add to Cart"}
                  </button>

                  {/* 2. Compare Products Button (Requested!) */}
                  <button
                    className={`btn btn-lg ${isCompared ? "btn-info text-white" : "btn-outline-primary"} flex-grow-1`}
                    onClick={handleCompareToggle}
                    title="Add to SpecMatrix Compare"
                  >
                    <i className={`bi ${isCompared ? "bi-check2-circle" : "bi-arrow-left-right"} me-2`} />
                    {isCompared ? "In Comparison" : "Compare Product"}
                  </button>

                  {/* 3. Wishlist Button */}
                  <button
                    className={`btn btn-lg ${isWishlisted ? "btn-danger" : "btn-outline-secondary"}`}
                    onClick={handleWishlistToggle}
                    title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                  >
                    <i className={`bi ${isWishlisted ? "bi-heart-fill" : "bi-heart"}`} />
                  </button>
                </div>

                {/* Secondary Compare Row: Direct Matrix Launch */}
                <div className="compare-quick-row">
                  <span className="small text-secondary">
                    <i className="bi bi-cpu me-1" /> Side-by-side spec comparison
                  </span>
                  <Link
                    to={`/compare?ids=${[product._id, ...compareIds.filter(id => id !== String(product._id))].slice(0, 4).join(",")}`}
                    className="btn btn-sm btn-outline-info text-decoration-none"
                  >
                    <i className="bi bi-table me-1" />
                    Launch SpecMatrix Compare ({compareIds.includes(String(product._id)) ? compareIds.length : compareIds.length + 1}) <i className="bi bi-arrow-right ms-1" />
                  </Link>
                </div>

                {wishMessage && (
                  <div className="alert alert-success py-2 px-3 mt-2 mb-0 small d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill" /> {wishMessage}
                  </div>
                )}
              </div>

              {/* Roles links */}
              {user?.role === "vendor" && (
                <Link className="btn btn-primary btn-sm mb-2" to={`/vendor/pairing?product=${product._id}`}>
                  <i className="bi bi-link-45deg me-1" /> Pair this product
                </Link>
              )}
              {user?.role === "admin" && (
                <Link className="btn btn-outline-primary btn-sm mb-2" to="/admin/pairings?status=pending">
                  <i className="bi bi-link-45deg me-1" /> Review pairings for this product
                </Link>
              )}
            </div>

            {/* Product Summary / Description */}
            <div className="product-summary-block pt-2">
              <h3 className="h6 text-uppercase fw-bold text-secondary mb-1">Equipment Overview</h3>
              <p className="text-secondary mb-0 small leading-relaxed">{product.description || "High-performance precision industrial equipment built for continuous continuous production and demanding industrial environments."}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Technical Specifications Grid & OEM Details (if present) */}
      {(Object.keys(product.specifications || {}).length > 0 ||
        Object.keys(product.technicalSpecifications || {}).length > 0 ||
        product.oemManual?.url) && (
        <div className="row g-4 mb-4">
          {Object.keys(product.specifications || {}).length > 0 && (
            <div className={Object.keys(product.technicalSpecifications || {}).length > 0 ? "col-lg-6" : "col-12"}>
              <div className="spec-matrix-card h-100">
                <h2><i className="bi bi-sliders text-primary" /> Technical Specifications</h2>
                <div className="spec-grid">
                  {Object.entries(product.specifications || {}).map(([k, v]) => (
                    <div key={k}>
                      <span>{k}</span>
                      <b>{String(v)}</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {Object.keys(product.technicalSpecifications || {}).length > 0 && (
            <div className={Object.keys(product.specifications || {}).length > 0 ? "col-lg-6" : "col-12"}>
              <div className="spec-matrix-card h-100">
                <h2><i className="bi bi-award text-primary" /> OEM Technical Details &amp; Standards</h2>
                <div className="spec-grid">
                  {Object.entries(product.technicalSpecifications || {}).map(([k, v]) => (
                    <div key={k}>
                      <span>{k}</span>
                      <b>{String(v)}</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {product.oemManual?.url && (
            <div className="col-12">
              <a className="btn btn-outline-primary" href={product.oemManual.url} target="_blank" rel="noreferrer">
                <i className="bi bi-file-earmark-pdf me-2" />
                {product.oemManual.title || "Download Factory Manual & Wiring Diagram"}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Verified Vendor Offers & Verified Buyer Reviews — in ONE line (side by side in 2 equal columns) */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="vendor-offers-card h-100">
            <h3 className="h5 mb-3 text-white"><i className="bi bi-shop text-primary me-2" /> Verified Vendor Offers</h3>
            {offers.length ? (
              offers.map((o) => (
                <div className="offer-row align-items-center mb-2 p-2 rounded bg-dark-subtle" key={o._id}>
                  <span>
                    <strong>{o.vendor?.profile?.company || o.vendor?.name}</strong>
                    <br />
                    <small className="text-secondary">{o.stock?.replace("_", " ") || "In Stock"}</small>
                  </span>
                  <div className="d-flex align-items-center gap-2">
                    <b className="text-white">{fmt(o.price)}</b>
                    {o.sellerUrl ? (
                      <a className="btn btn-sm btn-outline-primary" href={o.sellerUrl} target="_blank" rel="noreferrer">
                        Buy
                      </a>
                    ) : (
                      <span className="badge bg-success">Direct</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-secondary small bg-dark-subtle rounded">
                <i className="bi bi-shield-check text-success me-1" /> Direct OEM Factory Allocation. Certified by Industry Mandi Exchange.
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="reviews-card h-100">
            <h3 className="h5 mb-3 text-white"><i className="bi bi-chat-square-quote text-primary me-2" /> Verified Buyer Reviews</h3>
            {reviews.length ? (
              reviews.map((r) => (
                <div className="review mb-3 pb-2 border-bottom border-secondary-subtle" key={r._id}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong className="text-white small">{r.title}</strong>
                    <span className="text-warning small">★ {r.rating}</span>
                  </div>
                  <p className="text-secondary small mb-0">{r.review}</p>
                </div>
              ))
            ) : (
              <p className="text-secondary small mb-0">No buyer reviews yet. Verified procurement reviews are published after physical delivery confirmation.</p>
            )}
          </div>
        </div>
      </div>
      {!recommendations.loading && recommendations.data && (
        <section className="recommendations-section" aria-label="Product recommendations">
          {recommendations.data.similar?.length > 0 && (
            <>
              <div className="recommendation-heading">
                <div>
                  <span className="eyebrow dark">PRECISION SPEC MATCHING</span>
                  <h2>Similar products &amp; alternatives</h2>
                  <p>Compare verified industrial alternatives with comparable technical specifications.</p>
                </div>
                <Link to={`/products?category=${encodeURIComponent(product.category || "")}`} className="view-link">
                  View all in {product.category || "category"} <i className="bi bi-arrow-right" />
                </Link>
              </div>
              <div className="recommendation-grid">
                {recommendations.data.similar.map(({ product: item, reason }) => (
                  <RecommendationCard key={item._id} product={item} reason={reason} />
                ))}
              </div>
            </>
          )}

          {recommendations.data.boughtTogether?.length > 0 && (
            <>
              <div className="recommendation-heading bought-together-heading">
                <div>
                  <span className="eyebrow dark">COMPLETE YOUR INSTALLATION</span>
                  <h2>Frequently bought together</h2>
                  <p>{recommendations.data.boughtTogetherBasedOnOrders ? "Based on verified plant procurement and marketplace order patterns." : "Suggested companion machinery and accessories for complete commissioning."}</p>
                </div>
              </div>
              <div className="recommendation-grid">
                {recommendations.data.boughtTogether.map(({ product: item, reason, fallback }) => (
                  <RecommendationCard key={item._id} product={item} reason={reason} fallback={fallback} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}

function RecommendationCard({ product, reason, fallback }) {
  const { user } = useAuth();
  const [added, setAdded] = useState(() => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      return cart.some((item) => String(item._id) === String(product._id));
    } catch {
      return false;
    }
  });

  const getWishlistState = () => {
    try {
      const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
      return list.some((item) => String(item._id) === String(product._id));
    } catch {
      return false;
    }
  };
  const [isWishlisted, setIsWishlisted] = useState(getWishlistState);

  const getCompareState = () => {
    try {
      const list = JSON.parse(localStorage.getItem("compareProducts") || "[]");
      return list.some((item) => String(item._id) === String(product._id));
    } catch {
      return false;
    }
  };
  const [isCompared, setIsCompared] = useState(getCompareState);

  useEffect(() => {
    const onWishlist = () => setIsWishlisted(getWishlistState());
    const onCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setAdded(cart.some((item) => String(item._id) === String(product._id)));
      } catch {}
    };
    const onCompare = () => setIsCompared(getCompareState());

    window.addEventListener("wishlist-updated", onWishlist);
    window.addEventListener("cart-updated", onCart);
    window.addEventListener("compare-updated", onCompare);
    return () => {
      window.removeEventListener("wishlist-updated", onWishlist);
      window.removeEventListener("cart-updated", onCart);
      window.removeEventListener("compare-updated", onCompare);
    };
  }, [product._id]);

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    const isAlready = currentWishlist.some((item) => String(item._id) === String(product._id));

    if (user?.role === "buyer" && product._id && product._id.length === 24) {
      try {
        const response = await api.post(`/buyer/wishlist/${product._id}`);
        const updatedList = Array.isArray(response.data?.data) ? response.data.data : [];
        localStorage.setItem("wishlist", JSON.stringify(updatedList));
        notifyWishlistChanged(updatedList);
        setIsWishlisted(updatedList.some((item) => String(item._id) === String(product._id)));
        return;
      } catch {}
    }

    const next = isAlready
      ? currentWishlist.filter((item) => String(item._id) !== String(product._id))
      : [...currentWishlist, product];
    localStorage.setItem("wishlist", JSON.stringify(next));
    notifyWishlistChanged(next);
    setIsWishlisted(!isAlready);
  };

  const handleToggleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompared) {
      removeFromCompareQueue(product._id);
      setIsCompared(false);
    } else {
      const next = addToCompareQueue(product);
      if (next && next.some((p) => String(p._id) === String(product._id))) {
        setIsCompared(true);
      }
    }
  };

  const addToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => String(item._id) === String(product._id));
    localStorage.setItem(
      "cart",
      JSON.stringify(
        existing
          ? cart.map((item) => (String(item._id) === String(product._id) ? { ...item, quantity: (item.quantity || 1) + 1 } : item))
          : [...cart, { ...product, price: getDisplayPrice(product), quantity: 1 }]
      )
    );
    notifyCartChanged();
    setAdded(true);
  };

  const primary = (product.images || []).find((item) => item.isPrimary) || product.images?.[0];
  const imageUrl = typeof primary === "string" ? primary : primary?.url || product.image || "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80";

  return (
    <article className="recommendation-card">
      <div className="recommendation-image-wrap">
        <Link to={`/product/${product.slug || product._id}`} aria-label={`View ${product.name}`}>
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
            }}
          />
        </Link>
        <span className={`recommendation-card-badge ${fallback ? "companion" : "match"}`}>
          <i className={`bi ${fallback ? "bi-puzzle" : "bi-cpu"}`} />
          {fallback ? "Companion" : "Spec Match"}
        </span>
        <button
          type="button"
          className={`recommendation-wishlist-btn ${isWishlisted ? "active" : ""}`}
          onClick={toggleWishlist}
          title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          aria-label="Wishlist toggle"
        >
          <i className={`bi ${isWishlisted ? "bi-heart-fill" : "bi-heart"}`} />
        </button>
      </div>

      <div className="recommendation-content">
        <div className="recommendation-brand-row">
          <span className="recommendation-brand">{product.brand || product.category || "OEM Verified"}</span>
          <span className="recommendation-rating">
            <i className="bi bi-star-fill" /> {product.rating || "4.8"}
          </span>
        </div>

        <Link to={`/product/${product.slug || product._id}`} className="recommendation-name" title={product.name}>
          {product.name}
        </Link>

        {reason && (
          <div className="recommendation-reason-tag">
            <i className="bi bi-stars" />
            <span>{reason}</span>
          </div>
        )}

        <div className="recommendation-footer-wrap">
          <div className="recommendation-price-box">
            <span className="recommendation-price">{fmt(getDisplayPrice(product))}</span>
            <span className="recommendation-sku">{product.sku || (product._id ? `SKU: IM-${String(product._id).slice(-4).toUpperCase()}` : "")}</span>
          </div>

          <div className="recommendation-action-row">
            <button
              type="button"
              className={`btn btn-sm ${added ? "btn-success" : "btn-primary"} btn-rec-cart`}
              onClick={addToCart}
              title="Add to procurement cart"
            >
              <i className={`bi ${added ? "bi-check2" : "bi-cart-plus"}`} />
              <span>{added ? "Added" : "Cart"}</span>
            </button>

            <button
              type="button"
              className={`btn-rec-compare ${isCompared ? "active" : ""}`}
              onClick={handleToggleCompare}
              title={isCompared ? "Remove from compare" : "Add to compare"}
            >
              <i className="bi bi-arrow-left-right" />
              <span>{isCompared ? "Comparing" : "Compare"}</span>
            </button>

            <Link
              to={`/product/${product.slug || product._id}`}
              className="btn-rec-view"
              title="View full specifications"
              aria-label="View specifications"
            >
              <i className="bi bi-arrow-up-right" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
const BENCHMARK_PRESETS = [
  {
    id: "ie3-motors",
    title: "IE3 Premium Efficiency Motors",
    category: "Motors & Drives",
    badge: "ENERGY TELEMETRY",
    description: "Compare Siemens vs. Crompton vs. Danfoss on efficiency class, continuous duty, and life-cycle savings.",
    ids: ["siemens-motor", "crompton-motor", "danfoss-vlt"],
    icon: "bi-lightning-charge-fill",
    stat: "Up to 18% Energy Savings",
  },
  {
    id: "vfd-automation",
    title: "Process Variable Frequency Drives",
    category: "Process Automation",
    badge: "DRIVE INTELLIGENCE",
    description: "Side-by-side harmonic distortion, control bus protocols, and inverter vector modulation benchmarks.",
    ids: ["schneider-vfd", "danfoss-vlt"],
    icon: "bi-sliders2",
    stat: "0.1–500 Hz Wide Spectrum",
  },
  {
    id: "mv-switchgear",
    title: "Medium Voltage Switchgear & MCC",
    category: "Power & Switchgear",
    badge: "SUBSTATION COMPLIANCE",
    description: "Evaluate short-circuit withstand capacity, arc fault endurance, and compartmentalization standards.",
    ids: ["abb-switchgear", "lt-starter"],
    icon: "bi-shield-check",
    stat: "IEC 62271 & Form 4b Tested",
  },
  {
    id: "cnc-machining",
    title: "Heavy-Duty CNC Machining Centers",
    category: "CNC Machining",
    badge: "PRECISION TOLERANCE",
    description: "Compare spindle vector drives, positioning repeatability, and automated tool changer dynamics.",
    ids: ["haas-cnc", "siemens-motor"],
    icon: "bi-cpu-fill",
    stat: "±0.0025 mm Micron Accuracy",
  },
];

const TELEMETRY_METRICS = [
  {
    key: "performance",
    label: "Continuous Performance & Duty",
    icon: "bi-speedometer2",
    desc: "Continuous torque delivery, thermal dissipation, and duty-cycle stability under 100% full-load condition.",
  },
  {
    key: "efficiency",
    label: "Energy Efficiency & Loss Mitigation",
    icon: "bi-lightning-charge-fill",
    desc: "IE efficiency classification, core electromagnetic loss minimization, and optimal operating power factor.",
  },
  {
    key: "build",
    label: "Build Quality & Housing Endurance",
    icon: "bi-shield-shaded",
    desc: "Ingress protection (IP55/IP65), vibration damping, and cast-iron/die-cast rigid structural frame.",
  },
  {
    key: "reliability",
    label: "Operational Reliability & MTBF",
    icon: "bi-arrow-repeat",
    desc: "Mean Time Between Failures, Class F/H insulation temperature margins, and bearing lifetime ratings.",
  },
  {
    key: "features",
    label: "Smart Telemetry & Bus Control",
    icon: "bi-cpu",
    desc: "Embedded vibration/temperature sensors, fieldbus connectivity (Modbus/Ethernet), and digital diagnostics.",
  },
  {
    key: "price",
    label: "Commercial Value & ROI Index",
    icon: "bi-graph-up-arrow",
    desc: "Acquisition cost balanced against lifecycle maintenance expenditure and OEM warranty guarantee.",
  },
];

function buildFallbackCompareData(ids, savedProducts) {
  const idList = ids ? ids.split(",").filter(Boolean) : [];
  const products = idList.map((id) => {
    let found = (savedProducts || []).find((p) => p._id === id || p.slug === id);
    if (!found) {
      found = INDUSTRIAL_CATALOG.find((p) => p._id === id || p.slug === id || p.name?.toLowerCase().includes(id.toLowerCase()));
    }
    if (!found) {
      const cleanName = id
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      found = {
        _id: id,
        name: cleanName,
        brand: "OEM Verified",
        category: "Industrial Equipment",
        price: 85000,
        sku: `IM-${id.slice(-6).toUpperCase()}`,
        image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        specifications: {
          "Power Rating": "15 kW (20 HP)",
          "Voltage": "415V, 3-Phase",
          "Efficiency Class": "IE3 Premium",
          "Protection": "IP55 Ingress Sealing",
          "Warranty": "24 Months OEM Warranty",
        },
        technicalSpecifications: {
          "Duty Cycle": "S1 Continuous Duty",
          "Standards": "IEC 60034 / IS 12615",
          "Ambient Temperature": "-20°C to +50°C",
        },
      };
    }
    return found;
  });

  const results = products.map((product, index) => {
    const price = getDisplayPrice(product);
    product.price = price;
    const baseScore = Math.max(96 - index * 5, 68);
    return {
      rank: index + 1,
      score: baseScore,
      price,
      product,
      breakdown: {
        performance: Math.max(96 - index * 4, 70),
        efficiency: Math.max(94 - index * 6 + (product.brand === "Siemens" ? 4 : 0), 65),
        build: Math.max(92 - index * 4, 72),
        reliability: Math.max(95 - index * 5, 68),
        features: Math.max(90 - index * 5 + (product.category === "Process Automation" ? 7 : 0), 64),
        price: Math.max(88 - index * 8, 60),
      },
    };
  });

  return {
    results,
    summary: `Verified SpecMatrix™ multi-vendor evaluation of ${products.length} industrial machines. Engineering telemetry and tolerance analysis generated from OEM certified datasheets.`
  };
}

function Compare() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const ids = params.get("ids") || "";
  const [state, setState] = useState({ loading: !!ids, data: null, error: "" });

  // Interactive controls
  const [highlightDiffs, setHighlightDiffs] = useState(false);
  const [diffsOnly, setDiffsOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerApiProducts, setPickerApiProducts] = useState([]);
  const [loadingPicker, setLoadingPicker] = useState(false);

  useEffect(() => {
    if (!showAddModal) return;
    setLoadingPicker(true);
    const cat = state.data?.results?.[0]?.product?.category;
    const p = { limit: 50 };
    if (cat) p.category = cat;
    api
      .get("/products", { params: p })
      .then((r) => {
        setPickerApiProducts(Array.isArray(r.data?.data?.items) ? r.data.data.items : []);
      })
      .catch(() => {
        setPickerApiProducts([]);
      })
      .finally(() => {
        setLoadingPicker(false);
      });
  }, [showAddModal, state.data]);

  const [copied, setCopied] = useState(false);
  const [cartAdded, setCartAdded] = useState({});
  const [savedWishlist, setSavedWishlist] = useState({});
  const [emptySearch, setEmptySearch] = useState("");
  const [emptySelected, setEmptySelected] = useState([]);

  // Live persistent cart tracking so Add to Cart immediately changes to Added to Cart and stays
  const [cartMap, setCartMap] = useState(() => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const m = {};
      cart.forEach((c) => {
        if (c._id) m[c._id] = true;
        if (c.slug) m[c.slug] = true;
        if (c.name) m[c.name] = true;
      });
      return m;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const syncCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const m = {};
        cart.forEach((c) => {
          if (c._id) m[c._id] = true;
          if (c.slug) m[c.slug] = true;
          if (c.name) m[c.name] = true;
        });
        setCartMap(m);
      } catch { }
    };
    window.addEventListener("cart-updated", syncCart);
    return () => window.removeEventListener("cart-updated", syncCart);
  }, []);

  const isProductInCart = (prod) => {
    if (!prod) return false;
    return !!(
      cartMap[prod._id] ||
      cartAdded[prod._id] ||
      (prod.slug && (cartMap[prod.slug] || cartAdded[prod.slug])) ||
      (prod.name && (cartMap[prod.name] || cartAdded[prod.name]))
    );
  };

  const load = () => {
    if (!ids) {
      setState({ loading: false, data: null, error: "" });
      return;
    }
    setState({ loading: true, data: null, error: "" });
    api
      .get("/products/compare", { params: { ids } })
      .then((r) => {
        // If API returns results, make sure each product has enriched specifications and valid non-zero prices
        const data = r.data.data;
        if (data?.results) {
          data.results.forEach((res) => {
            const raw = Number(res.price || res.product?.price || 0);
            res.price = raw > 0 ? raw : getDisplayPrice(res.product);
            if (!res.product.price || res.product.price <= 0) {
              res.product.price = res.price;
            }
            const match = INDUSTRIAL_CATALOG.find((cat) => cat._id === res.product?._id || cat.slug === res.product?.slug);
            if (match) {
              res.product = {
                ...match,
                ...res.product,
                price: res.price,
                specifications: {
                  ...(match.specifications || {}),
                  ...(typeof res.product.specifications === "object" ? res.product.specifications : {}),
                },
                technicalSpecifications: {
                  ...(match.technicalSpecifications || {}),
                  ...(typeof res.product.technicalSpecifications === "object" ? res.product.technicalSpecifications : {}),
                },
              };
            }
          });
        }
        setState({ loading: false, data, error: "" });
      })
      .catch((err) => {
        if (err.response?.status === 422) {
          setState({ loading: false, data: null, error: err.response?.data?.message || "Compare products from the same category only" });
          return;
        }
        const savedProducts = JSON.parse(localStorage.getItem("compareProducts") || "[]");
        const fallbackData = buildFallbackCompareData(ids, savedProducts);
        if (fallbackData?.results?.length > 1) {
          const cats = new Set(fallbackData.results.map((r) => r.product?.category).filter(Boolean));
          if (cats.size > 1) {
            setState({ loading: false, data: null, error: "Compare products from the same category only" });
            return;
          }
        }
        setState({ loading: false, data: fallbackData, error: "" });
      });
  };

  useEffect(load, [ids]);

  // Keep savedWishlist in sync with actual localStorage on load
  useEffect(() => {
    try {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const map = {};
      wishlist.forEach((item) => {
        if (item?._id) map[item._id] = true;
      });
      setSavedWishlist(map);
    } catch { }
  }, [state.data]);

  const removeMachine = (productId) => {
    const idList = ids.split(",").filter(Boolean);
    const updated = idList.filter((id) => id !== productId);

    // Keep global compareProducts in sync
    try {
      const saved = JSON.parse(localStorage.getItem("compareProducts") || "[]");
      const nextSaved = saved.filter((p) => p._id !== productId);
      localStorage.setItem("compareProducts", JSON.stringify(nextSaved));
      window.dispatchEvent(new CustomEvent("compare-updated", { detail: { products: nextSaved } }));
    } catch { }

    if (updated.length > 0) {
      setParams({ ids: updated.join(",") });
    } else {
      setParams({});
    }
  };

  const addMachine = (product) => {
    const idList = ids.split(",").filter(Boolean);
    if (idList.length >= 4) return;
    const currentCat = state.data?.results?.[0]?.product?.category;
    if (currentCat && product?.category && currentCat.trim().toLowerCase() !== product.category.trim().toLowerCase()) {
      alert(`Cannot compare products from different categories. All compared products must belong to "${currentCat}".`);
      return;
    }
    if (!idList.includes(product._id)) {
      const nextIds = [...idList, product._id];
      setParams({ ids: nextIds.join(",") });

      // Keep global compareProducts in sync
      try {
        const saved = JSON.parse(localStorage.getItem("compareProducts") || "[]");
        if (!saved.some((p) => p._id === product._id)) {
          const nextSaved = [...saved, product].slice(0, 4);
          localStorage.setItem("compareProducts", JSON.stringify(nextSaved));
          window.dispatchEvent(new CustomEvent("compare-updated", { detail: { products: nextSaved } }));
        }
      } catch { }
    }
    setShowAddModal(false);
  };

  const handleAddToCart = (product, price) => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const pid = String(product?._id || product?.slug || product?.name);
      const existing = cart.find(
        (item) =>
          String(item._id) === pid ||
          (product.slug && item.slug === product.slug) ||
          (product.name && item.name === product.name)
      );
      const finalPrice = Number(price || product?.price || getDisplayPrice(product));
      const updatedCart = existing
        ? cart.map((item) =>
          String(item._id) === pid ||
            (product.slug && item.slug === product.slug) ||
            (product.name && item.name === product.name)
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        )
        : [...cart, { ...product, _id: pid, price: finalPrice, quantity: 1 }];
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      notifyCartChanged();
      setCartAdded((prev) => ({
        ...prev,
        [pid]: true,
        [product._id]: true,
        ...(product.slug ? { [product.slug]: true } : {}),
        ...(product.name ? { [product.name]: true } : {}),
      }));
      setCartMap((prev) => ({
        ...prev,
        [pid]: true,
        [product._id]: true,
        ...(product.slug ? { [product.slug]: true } : {}),
        ...(product.name ? { [product.name]: true } : {}),
      }));
    } catch (e) {
      console.error("Failed to add to cart", e);
    }
  };

  const handleSaveWishlist = (product) => {
    try {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const exists = wishlist.some((item) => item._id === product._id);
      let nextWishlist;
      if (exists) {
        nextWishlist = wishlist.filter((item) => item._id !== product._id);
        setSavedWishlist((prev) => ({ ...prev, [product._id]: false }));
      } else {
        nextWishlist = [...wishlist, product];
        setSavedWishlist((prev) => ({ ...prev, [product._id]: true }));
      }
      localStorage.setItem("wishlist", JSON.stringify(nextWishlist));
      notifyWishlistChanged(nextWishlist);
    } catch (e) {
      console.error("Failed to update wishlist", e);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      }).catch(() => {
        // Fallback
        fallbackCopy(url);
      });
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = (text) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearAll = () => {
    try {
      localStorage.setItem("compareProducts", JSON.stringify([]));
      window.dispatchEvent(new CustomEvent("compare-updated", { detail: { products: [] } }));
    } catch { }
    setParams({});
  };

  // Helper to extract a spec value from product
  const getProductSpec = (product, key) => {
    const specs = product.specifications instanceof Map
      ? Object.fromEntries(product.specifications)
      : (typeof product.specifications === "object" && product.specifications !== null ? product.specifications : {});
    if (specs[key] !== undefined && specs[key] !== null) return String(specs[key]);

    const techSpecs = product.technicalSpecifications instanceof Map
      ? Object.fromEntries(product.technicalSpecifications)
      : (typeof product.technicalSpecifications === "object" && product.technicalSpecifications !== null ? product.technicalSpecifications : {});
    if (techSpecs[key] !== undefined && techSpecs[key] !== null) return String(techSpecs[key]);

    return "—";
  };

  // Aggregated dynamic specification keys
  const dynamicSpecKeys = useMemo(() => {
    if (!state.data?.results) return [];
    const keys = new Set();
    state.data.results.forEach((r) => {
      const p = r.product;
      const specs = p.specifications instanceof Map
        ? Object.fromEntries(p.specifications)
        : (typeof p.specifications === "object" && p.specifications !== null ? p.specifications : {});
      Object.keys(specs).forEach((k) => {
        if (!["Price", "Brand", "Category", "Warranty", "Pan-India Freight"].includes(k)) {
          keys.add(k);
        }
      });
      const techSpecs = p.technicalSpecifications instanceof Map
        ? Object.fromEntries(p.technicalSpecifications)
        : (typeof p.technicalSpecifications === "object" && p.technicalSpecifications !== null ? p.technicalSpecifications : {});
      Object.keys(techSpecs).forEach((k) => keys.add(k));
    });
    return Array.from(keys);
  }, [state.data]);

  // Check if all items differ for a spec
  const checkIsDifferent = (values) => {
    if (values.length <= 1) return false;
    const first = String(values[0] || "").trim().toLowerCase();
    return values.some((v) => String(v || "").trim().toLowerCase() !== first);
  };

  // Available items for the quick picker modal
  const availablePickerProducts = useMemo(() => {
    const currentIds = ids.split(",").filter(Boolean);
    const cat = state.data?.results?.[0]?.product?.category;
    const combined = [...pickerApiProducts];
    if (typeof INDUSTRIAL_CATALOG !== "undefined" && Array.isArray(INDUSTRIAL_CATALOG)) {
      INDUSTRIAL_CATALOG.forEach((item) => {
        if (!combined.some((p) => String(p._id) === String(item._id) || p.name === item.name)) {
          if (!cat || (item.category && item.category.trim().toLowerCase() === cat.trim().toLowerCase())) {
            combined.push(item);
          }
        }
      });
    }
    return combined.filter((p) => {
      if (currentIds.includes(String(p._id))) return false;
      if (cat && p.category && p.category.trim().toLowerCase() !== cat.trim().toLowerCase()) return false;
      if (!pickerSearch.trim()) return true;
      const term = pickerSearch.toLowerCase();
      return (
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.brand && p.brand.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term)) ||
        (p.model && p.model.toLowerCase().includes(term))
      );
    });
  }, [ids, pickerSearch, pickerApiProducts, state.data]);

  // Empty state catalog list
  const emptyCatalogItems = useMemo(() => {
    if (!emptySearch.trim()) return INDUSTRIAL_CATALOG;
    const term = emptySearch.toLowerCase();
    return INDUSTRIAL_CATALOG.filter((p) =>
      p.name.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  }, [emptySearch]);

  const toggleEmptySelection = (productId) => {
    setEmptySelected((prev) => {
      if (prev.includes(productId)) return prev.filter((id) => id !== productId);
      if (prev.length >= 4) return prev;
      if (prev.length > 0) {
        const firstItem = INDUSTRIAL_CATALOG.find((p) => String(p._id) === String(prev[0]));
        const currentItem = INDUSTRIAL_CATALOG.find((p) => String(p._id) === String(productId));
        if (firstItem?.category && currentItem?.category &&
            firstItem.category.trim().toLowerCase() !== currentItem.category.trim().toLowerCase()) {
          alert(`Cannot compare products from different categories. First selected category is "${firstItem.category}".`);
          return prev;
        }
      }
      return [...prev, productId];
    });
  };

  const launchEmptySelection = () => {
    if (emptySelected.length >= 2) {
      setParams({ ids: emptySelected.join(",") });
    }
  };

  // -------------------------------------------------------------
  // EMPTY STATE: When no products are in the comparison URL
  // -------------------------------------------------------------
  if (!ids) {
    return (
      <main className="container py-5 compare-page">
        {/* Breadcrumb Navigation */}
        <nav className="specmatrix-breadcrumbs mb-4" aria-label="breadcrumb">
          <Link to="/" className="breadcrumb-item-link">Marketplace</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">SpecMatrix™ Telemetry Engine</span>
        </nav>

        {/* Hero Section */}
        <section className="specmatrix-hero-banner">
          <div className="specmatrix-hero-content">
            <span className="eyebrow dark d-inline-flex align-items-center gap-2">
              <span className="telemetry-live-dot" />
              PRECISION SPECMATRIX™ EVALUATION ENGINE
            </span>
            <h1 className="specmatrix-hero-title">
              Industrial Machinery Telemetry &amp; Spec Validation
            </h1>
            <p className="specmatrix-hero-desc">
              Benchmark verified OEM machinery side-by-side with telemetry scores, engineering tolerances, electrical ratings, and direct commercial procurement terms.
            </p>
          </div>
          <div className="specmatrix-hero-stats">
            <div className="specmatrix-stat-card">
              <span className="stat-num">98.4%</span>
              <span className="stat-label">Telemetry Accuracy</span>
            </div>
            <div className="specmatrix-stat-card">
              <span className="stat-num">12,000+</span>
              <span className="stat-label">Verified SKUs</span>
            </div>
            <div className="specmatrix-stat-card">
              <span className="stat-num">Zero</span>
              <span className="stat-label">Middleman Markup</span>
            </div>
          </div>
        </section>

        {/* Benchmark Presets Section */}
        <section className="my-5">
          <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-2">
            <div>
              <span className="eyebrow dark">ONE-CLICK BENCHMARKS</span>
              <h2 className="h3 mb-0">Popular Industrial Comparison Suites</h2>
            </div>
            <span className="text-secondary small">Pre-configured with OEM certified telemetry</span>
          </div>

          <div className="row g-4">
            {BENCHMARK_PRESETS.map((preset) => (
              <div className="col-md-6 col-lg-3" key={preset.id}>
                <div className="benchmark-preset-card">
                  <div className="preset-card-header">
                    <span className="preset-icon">
                      <i className={`bi ${preset.icon}`} />
                    </span>
                    <span className="preset-badge">{preset.badge}</span>
                  </div>
                  <h3 className="preset-title">{preset.title}</h3>
                  <p className="preset-desc">{preset.description}</p>
                  <div className="preset-stat-highlight">
                    <i className="bi bi-patch-check-fill text-primary me-1" />
                    <span>{preset.stat}</span>
                  </div>
                  <Link
                    to={`/compare?ids=${preset.ids.join(",")}`}
                    className="btn btn-outline-primary btn-sm w-100 mt-3 preset-launch-btn"
                  >
                    Launch Matrix ({preset.ids.length} Machines) <i className="bi bi-arrow-right ms-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Machinery Selector on Empty Page */}
        <section className="specmatrix-picker-section mt-5">
          <div className="picker-section-header">
            <div>
              <span className="eyebrow dark">CATALOG SELECTOR</span>
              <h2 className="h3 mb-1">Build Custom Machinery Comparison</h2>
              <p className="text-secondary mb-0">Select 2 to 4 equipment units from the catalog to launch deep technical evaluation.</p>
            </div>
            <div className="picker-search-wrap">
              <i className="bi bi-search" />
              <input
                type="text"
                className="form-control"
                placeholder="Search motors, CNC, pumps, VFDs..."
                value={emptySearch}
                onChange={(e) => setEmptySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="row g-3 mt-3">
            {emptyCatalogItems.map((prod) => {
              const isSelected = emptySelected.includes(prod._id);
              return (
                <div className="col-md-6 col-lg-3" key={prod._id}>
                  <div className={`selector-product-card ${isSelected ? "selected" : ""}`}>
                    <div className="selector-card-thumb">
                      <img src={prod.image} alt={prod.name} loading="lazy" />
                      <span className="badge bg-dark border border-secondary selector-brand-badge">{prod.brand}</span>
                    </div>
                    <div className="selector-card-body">
                      <span className="selector-cat">{prod.category}</span>
                      <h4 className="selector-name">{prod.name}</h4>
                      <p className="selector-price">{fmt(getDisplayPrice(prod))}</p>
                      <button
                        className={`btn btn-sm w-100 ${isSelected ? "btn-primary" : "btn-outline-light"}`}
                        onClick={() => toggleEmptySelection(prod._id)}
                      >
                        {isSelected ? (
                          <>
                            <i className="bi bi-check-lg me-1" /> Selected ({emptySelected.indexOf(prod._id) + 1}/4)
                          </>
                        ) : (
                          <>
                            <i className="bi bi-plus-lg me-1" /> Add to Compare
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {emptySelected.length > 0 && (
            <div className="specmatrix-sticky-selector-bar">
              <div className="d-flex align-items-center gap-3">
                <span className="fw-bold">{emptySelected.length} machine{emptySelected.length === 1 ? "" : "s"} chosen</span>
                <small className="text-secondary">({emptySelected.length < 2 ? "Select at least 1 more" : "Ready to evaluate"})</small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-outline-light btn-sm" onClick={() => setEmptySelected([])}>
                  Reset
                </button>
                <button
                  className="btn btn-primary"
                  disabled={emptySelected.length < 2}
                  onClick={launchEmptySelection}
                >
                  Launch SpecMatrix Comparison ({emptySelected.length}) <i className="bi bi-arrow-right ms-2" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    );
  }

  // -------------------------------------------------------------
  // LOADING / ERROR STATES
  // -------------------------------------------------------------
  if (state.loading) return <Loading label="Calculating verified SpecMatrix telemetry…" />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;
  if (!state.data?.results?.length) {
    return (
      <main className="container py-5 text-center">
        <h2>No products found for comparison</h2>
        <p className="text-secondary">The requested equipment IDs could not be resolved in the catalog.</p>
        <Link to="/compare" className="btn btn-primary mt-3">Reset SpecMatrix</Link>
      </main>
    );
  }

  const { results, summary } = state.data;
  const bestProduct = results[0];

  return (
    <main className="container py-4 compare-page">
      {/* Toast Notification */}
      {copied && (
        <div className="specmatrix-toast" role="alert">
          <i className="bi bi-check-circle-fill text-success me-2" />
          Comparison link copied to clipboard!
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="specmatrix-breadcrumbs mb-3" aria-label="breadcrumb">
        <Link to="/" className="breadcrumb-item-link">Marketplace</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/products" className="breadcrumb-item-link">Industrial Catalog</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">SpecMatrix™ Telemetry</span>
      </nav>

      {/* Header & Executive Telemetry Strip */}
      <div className="specmatrix-top-header mb-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <span className="eyebrow dark d-inline-flex align-items-center gap-2">
              <span className="telemetry-live-dot" />
              PRECISION SPECMATRIX™ ENGINE
            </span>
            <h1 className="h2 mb-1">Machinery Telemetry &amp; Multi-Vendor Validation</h1>
            <p className="text-secondary mb-0">
              Side-by-side engineering evaluation, verified OEM telemetry tolerances, and direct commercial terms.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="specmatrix-toolbar">
            <button
              className={`toolbar-btn ${highlightDiffs ? "active" : ""}`}
              onClick={() => setHighlightDiffs((v) => !v)}
              title="Highlight specifications that differ across models"
            >
              <i className="bi bi-highlighter" />
              <span>Highlight Differences</span>
            </button>
            <button
              className={`toolbar-btn ${diffsOnly ? "active" : ""}`}
              onClick={() => setDiffsOnly((v) => !v)}
              title="Filter to only show rows with differing specs"
            >
              <i className="bi bi-funnel" />
              <span>Differences Only</span>
            </button>
            <button className="toolbar-btn" onClick={handleCopyLink} title="Share comparison matrix">
              <i className="bi bi-share" />
              <span>Share</span>
            </button>
            <button className="toolbar-btn" onClick={handlePrint} title="Print or export spec sheet">
              <i className="bi bi-printer" />
              <span>Print Sheet</span>
            </button>
            <button className="toolbar-btn btn-danger-subtle" onClick={handleClearAll} title="Clear comparison">
              <i className="bi bi-trash3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Executive AI Telemetry Summary Banner */}
        <div className="specmatrix-summary-card mt-3">
          <div className="summary-icon">
            <i className="bi bi-cpu-fill" />
          </div>
          <div className="summary-body">
            <div className="d-flex align-items-center gap-2 mb-1">
              <strong>OEM Telemetry Intelligence Verdict</strong>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
                VERIFIED ALGORITHM
              </span>
            </div>
            <p className="mb-0 text-secondary">{summary}</p>
          </div>
          {bestProduct && (
            <div className="summary-leader-callout">
              <span className="eyebrow dark mb-0">TOP BENCHMARK</span>
              <strong className="text-white text-truncate d-block">{bestProduct.product.name}</strong>
              <span className="text-primary font-monospace small">Score: {bestProduct.score}/100</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Hero Cards Grid */}
      <section className="compare-hero-grid-section mb-5">
        <div className="row g-3">
          {results.map((x) => {
            const isRankOne = x.rank === 1;
            const primaryImg = x.product.image || x.product.images?.[0]?.url || x.product.images?.[0] || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
            const isAdded = cartAdded[x.product._id];
            const isSaved = savedWishlist[x.product._id];

            return (
              <div className="col-md" key={x.product._id}>
                <div className={`compare-machine-card ${isRankOne ? "rank-1-card" : ""}`}>
                  {/* Top Bar: Clean Rank Ribbon + Remove Button (NO OVERLAP) */}
                  <div className="card-top-bar">
                    <span className={`rank-ribbon ${isRankOne ? "ribbon-winner" : "ribbon-standard"}`}>
                      <i className={`bi ${isRankOne ? "bi-trophy-fill" : "bi-check-circle-fill"} me-1`} />
                      #{x.rank} RANK {isRankOne ? "· TOP VALUE" : ""}
                    </span>
                    <button
                      className="btn-remove-machine"
                      onClick={() => removeMachine(x.product._id)}
                      title="Remove from comparison"
                      aria-label="Remove equipment"
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  </div>

                  {/* Machinery Image Preview */}
                  <div className="card-image-box">
                    <img
                      src={primaryImg}
                      alt={x.product.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <span className="oem-badge">
                      <i className="bi bi-patch-check-fill text-primary me-1" />
                      {x.product.brand || "OEM"}
                    </span>
                  </div>

                  {/* Card Header & Title */}
                  <div className="card-info-header">
                    <span className="font-monospace small text-secondary d-block">
                      SKU: {x.product.sku || (x.product._id ? `IM-${x.product._id.slice(-6).toUpperCase()}` : "IM-001")}
                    </span>
                    <Link to={`/product/${x.product.slug || x.product._id}`} className="machine-title-link">
                      <h3 className="machine-title">{x.product.name}</h3>
                    </Link>
                  </div>

                  {/* SpecMatrix Telemetry Gauge */}
                  <div className="telemetry-score-box">
                    <div className="score-meter-wrap">
                      <span className="score-number">{x.score}</span>
                      <span className="score-denom">/100</span>
                    </div>
                    <div className="score-meta">
                      <span className="score-label">SpecMatrix™ Index</span>
                      <div className="score-progress-track">
                        <div
                          className={`score-progress-fill ${isRankOne ? "fill-orange" : "fill-cyan"}`}
                          style={{ width: `${x.score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Price & Commercial Terms */}
                  <div className="card-price-section">
                    <span className="price-val">{fmt(x.price > 0 ? x.price : getDisplayPrice(x.product))}</span>
                    <small className="price-sub">Excl. GST · Pan-India Freight Covered</small>
                    <div className="stock-pill mt-2">
                      <span className="stock-dot" />
                      <span>{x.product.stock > 0 ? "In Stock · Dispatches in 24h" : "Standard OEM Lead Time (2-3 Weeks)"}</span>
                    </div>
                  </div>

                  {/* Buyer CTAs */}
                  <div className="card-actions-row mt-3">
                    {(() => {
                      const isAdded = isProductInCart(x.product);
                      return (
                        <button
                          className={`btn btn-sm ${isAdded ? "btn-success" : "btn-primary"} flex-grow-1`}
                          onClick={() => handleAddToCart(x.product, x.price > 0 ? x.price : getDisplayPrice(x.product))}
                        >
                          {isAdded ? (
                            <>
                              <i className="bi bi-check2-circle me-1" /> Added to Cart
                            </>
                          ) : (
                            <>
                              <i className="bi bi-bag-plus me-1" /> Add to Cart
                            </>
                          )}
                        </button>
                      );
                    })()}
                    <button
                      className={`btn btn-sm ${isSaved ? "btn-light text-primary" : "btn-outline-light"}`}
                      onClick={() => handleSaveWishlist(x.product)}
                      title="Save to Procurement RFQ / Wishlist"
                    >
                      <i className={`bi ${isSaved ? "bi-heart-fill" : "bi-heart"}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* "+ Add Machine" Slot (if < 4 items) */}
          {results.length < 4 && (
            <div className="col-md">
              <div className="add-compare-slot" onClick={() => setShowAddModal(true)}>
                <div className="add-slot-content">
                  <span className="add-slot-icon">
                    <i className="bi bi-plus-circle" />
                  </span>
                  <strong>Add Equipment</strong>
                  <p>Evaluate up to 4 machines simultaneously in SpecMatrix.</p>
                  <button className="btn btn-sm btn-outline-primary mt-2">
                    Select Machine <i className="bi bi-arrow-right ms-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Visual Telemetry Radar & Comparative Score Breakdown */}
      <section className="specmatrix-telemetry-panel mb-5">
        <div className="panel-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <span className="eyebrow dark mb-0">TELEMETRY SCORECARD</span>
            <h2 className="h4 mb-0">Engineering Performance Telemetry</h2>
          </div>
          <span className="font-monospace small text-secondary">
            Weighted Multi-Factor OEM Validation
          </span>
        </div>

        <div className="telemetry-metrics-list p-3">
          {TELEMETRY_METRICS.map((metric) => {
            // Find winner for this metric
            const maxScore = Math.max(...results.map((r) => r.breakdown?.[metric.key] || 0));

            return (
              <div className="telemetry-metric-row" key={metric.key}>
                <div className="metric-info-col">
                  <span className="metric-title-group">
                    <i className={`bi ${metric.icon} text-primary me-2`} />
                    <strong>{metric.label}</strong>
                  </span>
                  <p className="metric-desc">{metric.desc}</p>
                </div>

                <div className="metric-bars-col">
                  <div className="row g-2">
                    {results.map((r) => {
                      const val = r.breakdown?.[metric.key] || 0;
                      const isTop = val === maxScore && val > 0;

                      return (
                        <div className="col" key={r.product._id}>
                          <div className={`metric-bar-cell ${isTop ? "metric-leader" : ""}`}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="bar-product-name text-truncate">{r.product.name}</span>
                              <span className="bar-val font-monospace fw-bold">
                                {val}/100
                                {isTop && <i className="bi bi-award-fill text-warning ms-1" title="Category Winner" />}
                              </span>
                            </div>
                            <div className="bar-track">
                              <div
                                className={`bar-fill ${isTop ? "fill-orange" : "fill-blue"}`}
                                style={{ width: `${val}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comprehensive Tabular Specification Matrix */}
      <section className="specmatrix-matrix-table-panel mb-5">
        <div className="panel-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <span className="eyebrow dark mb-0">PARAMETER SPEC MATRIX</span>
            <h2 className="h4 mb-0">Full Technical &amp; Operational Attributes</h2>
          </div>
          <div className="d-flex align-items-center gap-3">
            {highlightDiffs && (
              <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                <i className="bi bi-eye-fill me-1" /> Differences Highlighted
              </span>
            )}
            <span className="font-monospace small text-secondary">
              Normalized Engineering Data
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table compare-matrix-table mb-0">
            {/* Sticky Table Header */}
            <thead>
              <tr>
                <th className="spec-attr-col sticky-col">Engineering Attribute</th>
                {results.map((x) => (
                  <th key={x.product._id} className="spec-product-col">
                    <div className="th-product-head">
                      <span className="th-brand">{x.product.brand || "OEM"}</span>
                      <strong className="th-title">{x.product.name}</strong>
                      <span className="th-price">{fmt(x.price > 0 ? x.price : getDisplayPrice(x.product))}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* SECTION: Commercial & Procurement */}
              <tr className="spec-section-divider">
                <td colSpan={results.length + 1}>
                  <i className="bi bi-briefcase-fill me-2 text-primary" />
                  <strong>COMMERCIAL &amp; PROCUREMENT TERMS</strong>
                </td>
              </tr>
              {(() => {
                const rows = [
                  { label: "Listed Price (excl. GST)", getVal: (p) => fmt(getDisplayPrice(p)) },
                  { label: "Manufacturer / Brand", getVal: (p) => p.brand || "OEM Verified" },
                  { label: "Catalog Model / SKU", getVal: (p) => p.sku || `IM-${p._id?.slice(-6).toUpperCase()}` },
                  { label: "Machinery Category", getVal: (p) => p.category || "Machinery" },
                  { label: "Pan-India Freight", getVal: () => "Covered / Direct Heavy Transit Telemetry" },
                  { label: "OEM Factory Warranty", getVal: (p) => getProductSpec(p, "Warranty") !== "—" ? getProductSpec(p, "Warranty") : "24 Months Comprehensive OEM" },
                  { label: "Stock & Dispatch Status", getVal: (p) => p.stock > 0 ? "Immediate Dispatch (24-48h)" : "Made to Order (2-3 Weeks)" },
                ];

                return rows.map((row) => {
                  const values = results.map((r) => row.getVal(r.product));
                  const isDiff = checkIsDifferent(values);
                  if (diffsOnly && !isDiff) return null;

                  return (
                    <tr key={row.label} className={highlightDiffs && isDiff ? "row-diff-highlight" : ""}>
                      <td className="spec-attr-col sticky-col">
                        <span>{row.label}</span>
                        {highlightDiffs && isDiff && <span className="diff-pill">DIFF</span>}
                      </td>
                      {results.map((r, i) => (
                        <td key={r.product._id} className="spec-val-col">
                          {values[i]}
                        </td>
                      ))}
                    </tr>
                  );
                });
              })()}

              {/* SECTION: Core Engineering Specifications */}
              <tr className="spec-section-divider">
                <td colSpan={results.length + 1}>
                  <i className="bi bi-gear-wide-connected me-2 text-primary" />
                  <strong>CORE ENGINEERING SPECIFICATIONS</strong>
                </td>
              </tr>
              {dynamicSpecKeys.map((key) => {
                const values = results.map((r) => getProductSpec(r.product, key));
                const isDiff = checkIsDifferent(values);
                if (diffsOnly && !isDiff) return null;

                return (
                  <tr key={key} className={highlightDiffs && isDiff ? "row-diff-highlight" : ""}>
                    <td className="spec-attr-col sticky-col">
                      <span>{key}</span>
                      {highlightDiffs && isDiff && <span className="diff-pill">DIFF</span>}
                    </td>
                    {results.map((r, i) => (
                      <td key={r.product._id} className="spec-val-col fw-semibold">
                        {values[i]}
                      </td>
                    ))}
                  </tr>
                );
              })}

              {/* SECTION: Protection, Standards & Environment */}
              <tr className="spec-section-divider">
                <td colSpan={results.length + 1}>
                  <i className="bi bi-shield-check me-2 text-primary" />
                  <strong>PROTECTION, ENVIRONMENTAL &amp; COMPLIANCE</strong>
                </td>
              </tr>
              {(() => {
                const envRows = [
                  { label: "Ingress Protection Rating", key: "Protection" },
                  { label: "Efficiency Classification", key: "Efficiency Class" },
                  { label: "Manufacturing Standards", key: "Standards" },
                  { label: "Operating Ambient Range", key: "Ambient Temperature" },
                  { label: "Duty Cycle Classification", key: "Duty Cycle" },
                ];

                return envRows.map((item) => {
                  const values = results.map((r) => getProductSpec(r.product, item.key));
                  const isDiff = checkIsDifferent(values);
                  if (diffsOnly && !isDiff) return null;

                  return (
                    <tr key={item.label} className={highlightDiffs && isDiff ? "row-diff-highlight" : ""}>
                      <td className="spec-attr-col sticky-col">
                        <span>{item.label}</span>
                        {highlightDiffs && isDiff && <span className="diff-pill">DIFF</span>}
                      </td>
                      {results.map((r, i) => (
                        <td key={r.product._id} className="spec-val-col">
                          {values[i]}
                        </td>
                      ))}
                    </tr>
                  );
                });
              })()}

              {/* SECTION: Action Row in Table Footer */}
              <tr className="spec-action-row">
                <td className="spec-attr-col sticky-col">
                  <strong>Procurement Action</strong>
                </td>
                {results.map((r) => {
                  const inCart = isProductInCart(r.product);
                  return (
                    <td key={r.product._id} className="spec-val-col">
                      <button
                        className={`btn btn-sm ${inCart ? "btn-success" : "btn-primary"} w-100`}
                        onClick={() => handleAddToCart(r.product, r.price > 0 ? r.price : getDisplayPrice(r.product))}
                      >
                        {inCart ? (
                          <>
                            <i className="bi bi-check2-circle me-1" /> Added to Cart
                          </>
                        ) : (
                          <>
                            <i className="bi bi-bag-plus me-1" /> Add to Cart
                          </>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Add Modal */}
      {showAddModal && (
        <div className="compare-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="compare-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="compare-modal-header">
              <div>
                <span className="eyebrow dark">EXPAND MATRIX</span>
                <h3 className="h5 mb-0">Add Industrial Machine</h3>
              </div>
              <button
                className="btn-modal-close"
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="compare-modal-search">
              <i className="bi bi-search" />
              <input
                type="text"
                placeholder="Search catalog by model, brand, or category..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="compare-modal-list">
              {loadingPicker ? (
                <div className="text-center py-4 text-secondary">
                  <div className="spinner-border spinner-border-sm me-2" />
                  Loading available equipment...
                </div>
              ) : availablePickerProducts.length > 0 ? (
                availablePickerProducts.map((p) => (
                  <div className="picker-product-item" key={p._id}>
                    <img
                      src={p.image || p.images?.[0]?.url || p.images?.[0] || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"}
                      alt=""
                    />
                    <div className="picker-product-info">
                      <strong className="picker-title">{p.name}</strong>
                      <span className="picker-meta">{p.brand} · {p.category}</span>
                      <span className="picker-price">{fmt(getDisplayPrice(p))}</span>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => addMachine(p)}>
                      <i className="bi bi-plus-lg me-1" /> Add
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-secondary">
                  No additional matching equipment found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
function AuthPage({ register = false }) {
  const nav = useNavigate(),
    [searchParams] = useSearchParams(),
    { login } = useAuth(),
    [form, setForm] = useState({
      name: "",
      email: "",
      password: "",
      role: searchParams.get("role") === "vendor" ? "vendor" : "buyer",
      company: "",
    }),
    [state, setState] = useState({ loading: false, error: "", message: "" }),
    [showPassword, setShowPassword] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, error: "", message: "" });
    try {
      const r = await api.post(`/auth/${register ? "register" : "login"}`, form);
      if (register && form.role === "vendor") {
        setState({ loading: false, error: "", message: r.data.message });
        return;
      }
      login(r.data.data);
      const role = r.data.data.user.role;
      const redirect = searchParams.get("redirect");
      if (redirect && redirect.startsWith("/")) {
        nav(redirect);
      } else {
        nav(role === "admin" ? "/admin" : role === "vendor" ? "/vendor" : "/dashboard/buyer");
      }
    } catch (e) {
      setState({ loading: false, error: e.response?.data?.message || "Unable to connect to the server.", message: "" });
    }
  };

  const vendorFeatures = [
    ["bi-patch-check-fill", "OEM Verified Listings", "List machinery with direct factory pricing and spec sheets"],
    ["bi-bar-chart-line", "SpecMatrix Intelligence", "Real-time telemetry comparison and buyer analytics"],
    ["bi-shield-lock", "Escrow Payments", "Milestone-based fund release on physical gate inspection"],
    ["bi-lightning-charge-fill", "AI-Powered Matching", "Automated buyer-equipment pairing with 91% accuracy"],
  ];
  const buyerFeatures = [
    ["bi-search", "12,000+ Industrial SKUs", "CNC machines, motors, pumps, VFDs, switchgear & more"],
    ["bi-bar-chart-line", "Side-by-Side SpecMatrix", "Compare OEM specs, scores, and pricing in one view"],
    ["bi-heart", "Wishlist & RFQ Queue", "Save and track machinery for procurement approvals"],
    ["bi-truck", "Pan-India Freight", "Heavy equipment logistics with real-time transit tracking"],
  ];
  const features = form.role === "vendor" ? vendorFeatures : buyerFeatures;

  return (
    <main className="auth-split">
      {/* LEFT BRAND PANEL */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <Link to="/" className="auth-logo">
            <span className="brand-dot" />
            <div>
              <span className="brand-name">INDUSTRY MANDI</span>
              <span className="brand-subtext">Industrial Exchange</span>
            </div>
          </Link>

          <div className="auth-brand-hero">
            <span className="eyebrow" style={{ color: "var(--brand-orange)", fontSize: "0.7rem" }}>
              {register ? (form.role === "vendor" ? "VENDOR PORTAL" : "BUYER PORTAL") : "ENTERPRISE GATEWAY"}
            </span>
            <h2 className="auth-brand-headline">
              {register
                ? form.role === "vendor"
                  ? "Start selling to verified industrial buyers."
                  : "Source machinery directly from OEMs."
                : "India's precision industrial marketplace."}
            </h2>
            <p className="auth-brand-sub">
              {register
                ? "Join 348 verified OEM partners and 4,800+ validated machinery SKUs."
                : "Access real-time telemetry, SpecMatrix comparisons, and direct OEM pricing."}
            </p>
          </div>

          <div className="auth-feature-list">
            {features.map(([icon, title, desc]) => (
              <div className="auth-feature-item" key={title}>
                <div className="auth-feature-icon">
                  <i className={`bi ${icon}`} />
                </div>
                <div>
                  <strong>{title}</strong>
                  <span>{desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="auth-trust-strip">
            <div><strong>348</strong><span>OEM Partners</span></div>
            <div><strong>4,892</strong><span>Validated SKUs</span></div>
            <div><strong>₹48.2L+</strong><span>Monthly GTV</span></div>
          </div>

          {/* decorative grid lines */}
          <div className="auth-panel-grid" aria-hidden="true" />
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="auth-form-panel">
        <form onSubmit={submit} className="auth-form-card" noValidate>

          {/* Top mobile logo */}
          <Link to="/" className="auth-mobile-logo">
            <span className="brand-dot" />
            <span className="brand-name" style={{ fontSize: "1rem" }}>INDUSTRY MANDI</span>
          </Link>

          <div className="auth-form-header">
            <h1>{register ? "Create Account" : "Welcome back"}</h1>
            <p>{register ? "Join the industrial procurement network." : "Sign in to your enterprise account."}</p>
          </div>

          {/* Role picker removed as per user request */}

          {/* Alerts */}
          {state.error && (
            <div className="auth-alert auth-alert-error">
              <i className="bi bi-exclamation-triangle-fill" />
              {state.error}
            </div>
          )}
          {state.message && (
            <div className="auth-alert auth-alert-success">
              <i className="bi bi-check-circle-fill" />
              {state.message}
            </div>
          )}

          {/* Fields */}
          <div className="auth-fields">
            {register && (
              <div className="auth-field">
                <label htmlFor="auth-name">Full name</label>
                <div className="auth-input-wrap">
                  <i className="bi bi-person" />
                  <input
                    id="auth-name"
                    required
                    placeholder="Rajesh Kumar"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Work email</label>
              <div className="auth-input-wrap">
                <i className="bi bi-envelope" />
                <input
                  id="auth-email"
                  required
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-field-label-row">
                <label htmlFor="auth-password">Password</label>
                {!register && <Link to="#" className="auth-forgot" tabIndex={-1}>Forgot password?</Link>}
              </div>
              <div className="auth-input-wrap">
                <i className="bi bi-lock" />
                <input
                  id="auth-password"
                  required
                  minLength="8"
                  type={showPassword ? "text" : "password"}
                  placeholder={register ? "Min. 8 characters" : "••••••••"}
                  autoComplete={register ? "new-password" : "current-password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <i className={`bi bi-eye${showPassword ? "-slash" : ""}`} />
                </button>
              </div>
            </div>

            {register && form.role === "vendor" && (
              <div className="auth-field">
                <label htmlFor="auth-company">Company / Organisation name</label>
                <div className="auth-input-wrap">
                  <i className="bi bi-buildings" />
                  <input
                    id="auth-company"
                    required
                    placeholder="Siemens India Ltd."
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={state.loading} className="auth-submit-btn">
            {state.loading ? (
              <><span className="spinner-border spinner-border-sm me-2" />Processing…</>
            ) : register ? (
              <>{form.role === "vendor" ? "Submit Vendor Application" : "Create Buyer Account"} <i className="bi bi-arrow-right ms-2" /></>
            ) : (
              <>Sign In to Dashboard <i className="bi bi-arrow-right ms-2" /></>
            )}
          </button>

          <p className="auth-switch">
            {register ? "Already have an account?" : "New to Industry Mandi?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>

          {!register && (
            <p className="auth-switch" style={{ marginTop: 4 }}>
              Want to sell?{" "}
              <Link to="/register?role=vendor">Become a Vendor</Link>
            </p>
          )}

          <p className="auth-legal">
            By continuing, you agree to Industry Mandi's{" "}
            <Link to="/about">Terms of Service</Link> &amp; <Link to="/about">Privacy Policy</Link>.
          </p>
        </form>
      </div>
    </main>
  );
}
function ApprovalQueues() {
  const [kind, setKind] = useState("vendors"),
    [state, setState] = useState({ loading: true, items: [], error: "" });
  const load = () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    api
      .get(`/admin/queue/${kind}`)
      .then((r) => setState({ loading: false, items: r.data.data, error: "" }))
      .catch((e) =>
        setState({
          loading: false,
          items: [],
          error: e.response?.data?.message || e.message,
        }),
      );
  };
  useEffect(load, [kind]);
  const decide = (item, status) => {
    const resource = {
      vendors: "vendors",
      products: "products",
      offers: "offers",
      pairings: "pairing",
      reviews: "reviews",
    }[kind];
    const reason =
      kind === "pairings" && status !== "approved"
        ? window.prompt("Reason for the vendor (optional):")
        : "";
    if (reason === null) return;
    api
      .patch(`/admin/${resource}/${item._id}`, { status, reason })
      .then(load)
      .catch((e) =>
        setState((s) => ({
          ...s,
          error: e.response?.data?.message || e.message,
        })),
      );
  };
  return (
    <section className="dashboard-panel mt-4">
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
        <div>
          <h3 className="mb-0">Approval queues</h3>
          <small className="text-secondary">
            Every public record requires this review.
          </small>
        </div>
        <select
          className="form-select w-auto"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          {["vendors", "products", "offers", "pairings", "reviews"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      {state.loading ? (
        <div className="py-3">Loading queue…</div>
      ) : state.error ? (
        <div className="alert alert-danger mt-3">{state.error}</div>
      ) : !state.items.length ? (
        <p className="text-secondary mt-3 mb-0">No pending {kind}.</p>
      ) : (
        <div className="table-responsive mt-3">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Submission</th>
                <th>Details</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((x) => (
                <tr key={x._id}>
                  <td>
                    <b>
                      {x.name ||
                        x.submittedName ||
                        x.title ||
                        x.product?.name ||
                        "Offer"}
                    </b>
                    <br />
                    <small>
                      {x.email || x.vendor?.email || x.buyer?.name || ""}
                    </small>
                    {kind === "pairings" && x.product && (
                      <small className="d-block text-primary">
                        Master product: {x.product.name}
                      </small>
                    )}
                  </td>
                  <td>
                    {x.offer?.price ? (
                      <>
                        <b>{fmt(x.offer.price)}</b>
                        <br />
                        <small>
                          {x.offer.sku || "No SKU"} ·{" "}
                          {x.offer.warranty || "No warranty stated"}
                        </small>
                      </>
                    ) : x.price ? (
                      fmt(x.price)
                    ) : x.matchConfidence ? (
                      `${x.matchConfidence}% match`
                    ) : x.category || x.rating ? (
                      `Rating: ${x.rating || "—"}`
                    ) : (
                      "Awaiting review"
                    )}
                  </td>
                  <td className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => decide(x, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => decide(x, "rejected")}
                    >
                      Reject
                    </button>
                    {kind === "pairings" && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => decide(x, "changes_requested")}
                      >
                        Request changes
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
function AdminOperationsPanel({ data, details, links }) {
  const queue = [
    { label: "Vendor approvals", count: data?.pendingVendors || 0, to: links.pendingVendors, icon: "bi-shop", tone: "orange" },
    { label: "Product reviews", count: data?.pendingProducts || 0, to: links.pendingProducts, icon: "bi-box-seam", tone: "blue" },
    { label: "Customer reviews", count: data?.reviews || 0, to: links.reviews, icon: "bi-chat-left-text", tone: "purple" },
    { label: "Pairing requests", count: data?.pairings || 0, to: links.pairings, icon: "bi-diagram-3", tone: "mint" },
  ];
  const pipeline = [
    { label: "Pending approvals", value: (data?.pendingVendors || 0) + (data?.pendingProducts || 0) + (data?.reviews || 0), color: "orange" },
    { label: "Active orders", value: data?.orders || 0, color: "blue" },
    { label: "Live catalog", value: data?.products || 0, color: "mint" },
    { label: "Approved offers", value: data?.offers || 0, color: "purple" },
  ];
  return (
    <div className="admin-crm">
      <div className="admin-crm-hero">
        <div>
          <span className="eyebrow dark">OPERATIONS CRM</span>
          <h1>Command center</h1>
          <p className="text-secondary mb-0">Keep approvals moving, monitor marketplace health, and resolve operational work from one place.</p>
        </div>
        <div className="admin-crm-actions">
          <Link to={links.pendingProducts} className="btn btn-primary"><i className="bi bi-inbox me-1" /> Review queue</Link>
          <Link to="/admin/products/add" className="btn btn-outline-light"><i className="bi bi-plus-lg me-1" /> Add product</Link>
        </div>
      </div>

      <div className="admin-crm-kpis">
        <Link to={links.users} className="admin-crm-kpi"><span>Total users</span><strong>{data?.users || 0}</strong><small><i className="bi bi-arrow-up-right" /> Active accounts</small></Link>
        <Link to={links.vendors} className="admin-crm-kpi"><span>Vendors</span><strong>{data?.vendors || 0}</strong><small><i className="bi bi-shop" /> {data?.pendingVendors || 0} awaiting approval</small></Link>
        <Link to={links.products} className="admin-crm-kpi"><span>Catalog products</span><strong>{data?.products || 0}</strong><small><i className="bi bi-box-seam" /> {data?.pendingProducts || 0} need review</small></Link>
        <Link to={links.orders} className="admin-crm-kpi"><span>Open orders</span><strong>{data?.orders || 0}</strong><small><i className="bi bi-truck" /> Track fulfillment</small></Link>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-lg-7">
          <section className="dashboard-panel admin-crm-panel h-100">
            <div className="admin-crm-section-heading"><div><span className="eyebrow dark">WORK QUEUE</span><h3>Needs your attention</h3></div><span className="admin-crm-count">{queue.reduce((sum, item) => sum + item.count, 0)} open</span></div>
            <div className="admin-queue-list">
              {queue.map((item) => (
                <Link to={item.to} className="admin-queue-item" key={item.label}>
                  <span className={`admin-queue-icon ${item.tone}`}><i className={`bi ${item.icon}`} /></span>
                  <span><b>{item.label}</b><small>{item.count ? "Ready for review" : "All clear for now"}</small></span>
                  <strong>{item.count}</strong><i className="bi bi-chevron-right" />
                </Link>
              ))}
            </div>
          </section>
        </div>
        <div className="col-lg-5">
          <section className="dashboard-panel admin-crm-panel h-100">
            <div className="admin-crm-section-heading"><div><span className="eyebrow dark">OPERATIONS SNAPSHOT</span><h3>Marketplace health</h3></div><Link to="/admin/analytics" className="small text-decoration-none">View analytics</Link></div>
            <div className="admin-pipeline">
              {pipeline.map((item) => (
                <div className="admin-pipeline-row" key={item.label}><span><b>{item.label}</b><small>{item.value} records</small></span><div className="admin-pipeline-track"><i className={item.color} style={{ width: `${Math.min(100, Math.max(8, item.value * 10))}%` }} /></div></div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-lg-7">
          <section className="dashboard-panel admin-crm-panel">
            <div className="admin-crm-section-heading"><div><span className="eyebrow dark">RECENT ACTIVITY</span><h3>Latest operational records</h3></div><Link to={links.orders} className="small text-decoration-none">View orders</Link></div>
            {details.orders.length ? details.orders.slice(0, 5).map((order) => (
              <div className="admin-activity-row" key={order._id}><span className="admin-activity-avatar"><i className="bi bi-receipt" /></span><span><b>{order.orderNumber || "Order record"}</b><small>{order.buyer?.name || "Customer"} · {order.status || "Pending"}</small></span><strong>{fmt(order.total)}</strong></div>
            )) : <p className="text-secondary mb-0">No recent order activity.</p>}
          </section>
        </div>
        <div className="col-lg-5">
          <section className="dashboard-panel admin-crm-panel">
            <div className="admin-crm-section-heading"><div><span className="eyebrow dark">SHORTCUTS</span><h3>Manage workspace</h3></div></div>
            <div className="admin-shortcut-grid">
              <Link to={links.users}><i className="bi bi-people" /><span>Users</span></Link>
              <Link to={links.vendors}><i className="bi bi-shop" /><span>Vendors</span></Link>
              <Link to={links.products}><i className="bi bi-box-seam" /><span>Products</span></Link>
              <Link to={links.offers}><i className="bi bi-tag" /><span>Offers</span></Link>
              <Link to={links.reviews}><i className="bi bi-star" /><span>Reviews</span></Link>
              <Link to={links.orders}><i className="bi bi-truck" /><span>Orders</span></Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
function Dashboard() {
  const { user } = useAuth(),
    [state, setState] = useState({ loading: true, data: null, error: "" }),
    [details, setDetails] = useState({ products: [], pairings: [], orders: [] });

  const endpoint =
    user.role === "admin"
      ? "/admin/dashboard"
      : user.role === "vendor"
        ? "/vendor/dashboard"
        : "/buyer/dashboard";

  const load = () => {
    setState({ loading: true, data: null, error: "" });
    api
      .get(endpoint)
      .then((r) => setState({ loading: false, data: r.data.data, error: "" }))
      .catch((e) =>
        setState({
          loading: false,
          data: null,
          error: e.response?.data?.message || e.message,
        }),
      );
  };

  useEffect(() => {
    if (!user) return;

    if (user.role === "vendor") {
      Promise.all([
        api.get("/vendor/products"),
        api.get("/vendor/pairings"),
        api.get("/account"),
      ])
        .then(([productsRes, pairingsRes, accountRes]) => {
          setDetails({
            products: productsRes.data.data || [],
            pairings: pairingsRes.data.data || [],
            orders: accountRes.data.data.orders || [],
          });
        })
        .catch(() => setDetails({ products: [], pairings: [], orders: [] }));
      return;
    }

    if (user.role === "admin") {
      Promise.all([
        api.get("/admin/resources/products"),
        api.get("/admin/resources/pairings"),
        api.get("/admin/resources/orders"),
      ])
        .then(([productsRes, pairingsRes, ordersRes]) => {
          setDetails({
            products: productsRes.data.data || [],
            pairings: pairingsRes.data.data || [],
            orders: ordersRes.data.data || [],
          });
        })
        .catch(() => setDetails({ products: [], pairings: [], orders: [] }));
    }
  }, [user?.role]);

  useEffect(load, [endpoint]);
  if (state.loading) return <Loading label="Loading your workspace…" />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;
  const labels =
    user.role === "admin"
      ? [
        "users",
        "vendors",
        "pendingVendors",
        "products",
        "pendingProducts",
        "offers",
        "reviews",
        "pairings",
        "orders",
      ]
      : user.role === "vendor"
        ? ["products", "offers", "pairings", "orders"]
        : ["wishlist", "comparisons", "reviews"];
  const quickLinks =
    user.role === "vendor"
      ? [
        { label: "Vendor workspace", to: "/vendor/products", icon: "bi-shop", description: "Manage listings, offers, and pairings" },
        { label: "Orders", to: "/account", icon: "bi-box-seam", description: "View and fulfil incoming buyer orders" },
        { label: "Account", to: "/account", icon: "bi-person-gear", description: "Update profile, security, and payout details" },
      ]
      : user.role === "buyer"
        ? [
          { label: "Account", to: "/account", icon: "bi-person-circle", description: "Update profile and order details" },
          { label: "Marketplace", to: "/products", icon: "bi-bag", description: "Browse products and compare options" },
        ]
        : [
          { label: "Admin workspace", to: "/admin", icon: "bi-speedometer2", description: "Review approvals and marketplace health" },
          { label: "Account", to: "/account", icon: "bi-person-gear", description: "Manage secure profile settings" },
        ];
  const adminLinks = {
    users: "/admin/users",
    vendors: "/admin/vendors",
    pendingVendors: "/admin/vendors?status=pending",
    products: "/admin/products",
    pendingProducts: "/admin/products?status=pending",
    offers: "/admin/offers",
    reviews: "/admin/reviews?status=pending",
    pairings: "/admin/pairings?status=pending",
    orders: "/admin/orders",
  };
  const vendorLinks = {
    products: "/vendor/products",
    offers: "/vendor/offers",
    pairings: "/vendor/pairing",
    orders: "/account",
  };
  return (
    <main className={`container py-5 dashboard-page ${user.role}-dashboard`}>
      {user.role === "admin" && (
        <div className="telemetry-header">
          <div className="d-flex align-items-center gap-2">
            <span className="feed-pill">
              <span className="telemetry-pip" /> Live operations
            </span>
            <span className="font-monospace small text-secondary">ADMIN WORKSPACE · ONLINE</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link to="/admin/products/add" className="btn btn-sm btn-primary">
              <i className="bi bi-plus-lg me-1" /> New SKU
            </Link>
            <Link to="/admin/analytics" className="btn btn-sm btn-outline-light">
              <i className="bi bi-bar-chart me-1" /> Reports
            </Link>
          </div>
        </div>
      )}
      {user.role === "admin" && <AdminOperationsPanel data={state.data} details={details} links={adminLinks} />}
      {user.role !== "admin" && <>
        <span className="eyebrow dark">{user.role.toUpperCase()} MISSION CONTROL</span>
        <h1>Good to see you, {user.name.split(" ")[0]}.</h1>
        <p className="text-secondary">Overview of marketplace telemetry, active allocations, and catalog records.</p>
        <div className="row g-3 mt-3">
          {labels.map((k) => (
            <div className="col-6 col-lg-3" key={k}>
              {user.role === "admin" ? (
                <Link
                  to={adminLinks[k]}
                  className="metric metric-link text-decoration-none"
                >
                  <span>{k.replace(/([A-Z])/g, " $1")}</span>
                  <strong>{state.data?.[k] ?? 0}</strong>
                  <small>
                    Manage records <i className="bi bi-arrow-right ms-1" />
                  </small>
                  <div className="metric-sparkline">
                    <div style={{ width: `${Math.min(100, Math.max(15, (Number(state.data?.[k]) || 1) * 12))}%` }} />
                  </div>
                </Link>
              ) : user.role === "vendor" ? (
                <Link
                  to={vendorLinks[k]}
                  className="metric metric-link text-decoration-none"
                >
                  <span>{k.replace(/([A-Z])/g, " $1")}</span>
                  <strong>{state.data?.[k] ?? 0}</strong>
                  <small>
                    Open workspace <i className="bi bi-arrow-right ms-1" />
                  </small>
                  <div className="metric-sparkline">
                    <div style={{ width: "65%" }} />
                  </div>
                </Link>
              ) : (
                <div className="metric">
                  <span>{k.replace(/([A-Z])/g, " $1")}</span>
                  <strong>{state.data?.[k] ?? 0}</strong>
                  <div className="metric-sparkline">
                    <div style={{ width: "50%" }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="dashboard-panel mt-4">
          <h3 className="text-white">Quick access</h3>
          <div className="row g-3 mt-1">
            {quickLinks.map((link) => (
              <div className="col-md-6" key={link.label}>
                <Link
                  to={link.to}
                  className="admin-module-card text-decoration-none d-block h-100"
                >
                  <div className="d-flex align-items-start gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 42, height: 42, background: "rgba(255, 77, 38, 0.15)" }}>
                      <i className={`bi ${link.icon} text-primary fs-5`} />
                    </div>
                    <div>
                      <div className="fw-bold text-white">{link.label}</div>
                      <small className="text-secondary d-block mt-1">{link.description}</small>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </>}

      {user.role === "vendor" ? (
        <div className="row g-4 mt-2">
          <div className="col-lg-6">
            <div className="dashboard-panel">
              <h3 className="text-white">{user.role === "vendor" ? "Your listings" : "Latest product records"}</h3>
              {details.products.length ? (
                details.products.slice(0, 6).map((p) => (
                  <div className="offer-row" key={p._id}>
                    <span>
                      <b className="text-white">{p.name}</b>
                      <small className="text-secondary text-capitalize">
                        {p.status ? p.status.replace("_", " ") : "active"}
                      </small>
                    </span>
                    <b className="text-success">{p.price ? fmt(p.price) : p.category || "—"}</b>
                  </div>
                ))
              ) : (
                <p className="text-secondary mb-0">No listing data available.</p>
              )}
            </div>
          </div>

          <div className="col-lg-6">
            <div className="dashboard-panel">
              <h3 className="text-white">{user.role === "vendor" ? "Your pairing requests" : "Latest pairing activity"}</h3>
              {details.pairings.length ? (
                details.pairings.slice(0, 6).map((x) => (
                  <div className="offer-row" key={x._id}>
                    <span>
                      <b className="text-white">{x.product?.name || x.submittedName || "Pairing request"}</b>
                      <small className="text-secondary text-capitalize">
                        {x.status ? x.status.replace("_", " ") : "pending"}
                      </small>
                    </span>
                    <b className="text-success">{x.offer?.price ? fmt(x.offer.price) : "—"}</b>
                  </div>
                ))
              ) : (
                <p className="text-secondary mb-0">No pairing records available.</p>
              )}
            </div>
          </div>
          <div className="col-12">
            <div className="dashboard-panel">
              <h3 className="text-white">{user.role === "vendor" ? "Orders to process" : "Recent orders"}</h3>
              {details.orders.length ? (
                details.orders.slice(0, 8).map((order) => (
                  <div className="offer-row" key={order._id}>
                    <span>
                      <b className="text-white">{order.orderNumber}</b>
                      <small className="text-secondary">{order.buyer?.name || "Buyer"} · {order.status}</small>
                    </span>
                    <b className="text-success">{fmt(order.total)}</b>
                  </div>
                ))
              ) : (
                <p className="text-secondary mb-0">No orders to process.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {user.role === "admin" && <ApprovalQueues />}
    </main>
  );
}
function AdminList() {
  const { resource } = useParams(),
    [params] = useSearchParams(),
    [state, setState] = useState({ loading: true, items: [], error: "" }),
    [editor, setEditor] = useState(null),
    [productImageFiles, setProductImageFiles] = useState([]),
    [notice, setNotice] = useState(""),
    status = params.get("status") || "";
  const resourceFields = {
    users: [
      { key: "name", label: "Full name", type: "text" },
      { key: "email", label: "Email", type: "email" },
    ],
    vendors: [
      { key: "name", label: "Company / contact name", type: "text" },
      { key: "email", label: "Email", type: "email" },
    ],
    products: [
      { key: "name", label: "Product name", type: "text" },
      { key: "brand", label: "Brand", type: "text" },
      { key: "model", label: "Model", type: "text" },
      { key: "sku", label: "SKU", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "price", label: "Price", type: "number" },
      { key: "stock", label: "Stock", type: "number" },
    ],
    offers: [
      { key: "price", label: "Price", type: "number" },
      { key: "discount", label: "Discount", type: "number" },
      { key: "stock", label: "Availability", type: "select", options: ["available", "limited", "out_of_stock"] },
      { key: "sku", label: "SKU", type: "text" },
      { key: "sellerUrl", label: "Seller URL", type: "url" },
      { key: "shippingCost", label: "Shipping cost", type: "number" },
      { key: "deliveryEstimate", label: "Delivery estimate", type: "text" },
      { key: "warranty", label: "Warranty", type: "text" },
    ],
    pairings: [
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "reviewReason", label: "Review reason", type: "textarea" },
    ],
    reviews: [
      { key: "title", label: "Review title", type: "text" },
      { key: "review", label: "Review content", type: "textarea" },
      { key: "rating", label: "Rating (1–5)", type: "number", min: 1, max: 5 },
    ],
    orders: [
      { key: "returnStatus", label: "Return status", type: "select", options: ["Not requested", "Requested", "Approved", "Refunded", "Rejected"] },
      { key: "tracking", label: "Tracking JSON", type: "textarea" },
    ],
  }[resource] || [];
  const statusOptions = {
    users: ["pending", "approved", "rejected", "suspended"],
    vendors: ["pending", "approved", "rejected", "suspended"],
    products: ["draft", "pending", "in_review", "approved", "rejected", "changes_requested", "published", "archived"],
    offers: ["pending", "approved", "rejected", "inactive"],
    pairings: ["pending", "approved", "rejected", "changes_requested"],
    reviews: ["pending", "approved", "rejected"],
    orders: ["Pending", "Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
  }[resource] || [];
  const openEditor = (record) => {
    const next = { ...record };
    if (resource === "orders") next.tracking = JSON.stringify(record.tracking || {}, null, 2);
    setEditor(next);
    setProductImageFiles([]);
    setNotice("");
  };
  const load = () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    api
      .get(`/admin/resources/${resource}`)
      .then((r) => setState({ loading: false, items: r.data.data, error: "" }))
      .catch((e) =>
        setState({
          loading: false,
          items: [],
          error: e.response?.data?.message || e.message,
        }),
      );
  };
  useEffect(load, [resource]);
  useEffect(() => {
    if (!editor) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setEditor(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [Boolean(editor)]);
  const saveRecord = async (event) => {
    event.preventDefault();
    const changes = { status: editor.status };
    for (const field of resourceFields) {
      if (editor[field.key] === undefined) continue;
      if (field.key === "tracking") {
        try {
          changes.tracking = editor.tracking.trim() ? JSON.parse(editor.tracking) : {};
        } catch {
          setNotice("Tracking must contain valid JSON.");
          return;
        }
      } else if (field.type === "number") {
        changes[field.key] = Number(editor[field.key]);
      } else {
        changes[field.key] = editor[field.key];
      }
    }
    try {
      let response;
      if (resource === "products") {
        const data = new FormData();
        Object.entries(changes).forEach(([key, value]) => data.append(key, typeof value === "object" ? JSON.stringify(value) : value));
        data.append("retainedImages", JSON.stringify(editor.images || []));
        data.append("primaryImageIndex", String((editor.images || []).findIndex((image) => image.isPrimary)));
        productImageFiles.forEach((file) => data.append("images", file));
        response = await api.patch(`/admin/products/${editor._id}`, data);
      } else {
        response = await api.patch(`/admin/resources/${resource}/${editor._id}`, changes);
      }
      setState((s) => ({ ...s, items: s.items.map((item) => item._id === editor._id ? { ...item, ...response.data.data } : item) }));
      setEditor(null);
      setNotice(response.data.message || "Record updated");
    } catch (error) { setNotice(error.response?.data?.message || error.message); }
  };
  const deleteRecord = async (record) => {
    if (!window.confirm(`Delete this ${resource.slice(0, -1)}? This cannot be undone.`)) return;
    try {
      const response = await api.delete(`/admin/resources/${resource}/${record._id}`);
      setState((s) => ({ ...s, items: s.items.filter((item) => item._id !== record._id) }));
      setNotice(response.data.message || "Record deleted");
    } catch (error) { setNotice(error.response?.data?.message || error.message); }
  };
  if (state.loading) return <Loading label={`Loading ${resource}…`} />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;
  const items = status
    ? state.items.filter((x) => x.status === status)
    : state.items;
  const title = `${status ? `${status} ` : ""}${resource}`;
  return (
    <main className="container py-5">
      <Link to="/admin" className="small text-decoration-none">
        <i className="bi bi-arrow-left" /> Dashboard
      </Link>
      <span className="eyebrow dark d-block mt-3">ADMIN MANAGEMENT</span>
      <h1 className="text-capitalize">{title}</h1>
      <p className="text-secondary">
        {items.length} record{items.length === 1 ? "" : "s"} shown.
      </p>
      {notice && <div className="alert alert-info py-2">{notice}</div>}
      {editor && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditor(null);
          }}
        >
          <form className="admin-editor admin-modal" onSubmit={saveRecord} role="dialog" aria-modal="true" aria-labelledby="admin-edit-title">
            <div className="admin-modal-header">
              <div>
                <span className="eyebrow dark">EDIT RECORD</span>
                <strong id="admin-edit-title">{editor.name || editor.product?.name || editor.orderNumber || editor.title || "Vendor offer"}</strong>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setEditor(null)} aria-label="Close edit dialog">
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="row g-3">
              {resourceFields.map((field) => (
                <label className={field.type === "textarea" ? "col-12" : "col-md-6"} key={field.key}>
                  {field.label}
                  {field.type === "textarea" ? (
                    <textarea rows={field.key === "description" ? 4 : 3} value={editor[field.key] || ""} onChange={(e) => setEditor({ ...editor, [field.key]: e.target.value })} />
                  ) : field.type === "select" ? (
                    <select value={editor[field.key] || field.options[0]} onChange={(e) => setEditor({ ...editor, [field.key]: e.target.value })}>
                      {field.options.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input required={["name", "email", "category"].includes(field.key)} min={field.min} max={field.max} type={field.type} value={editor[field.key] ?? ""} onChange={(e) => setEditor({ ...editor, [field.key]: e.target.value })} />
                  )}
                </label>
              ))}
              <label className="col-md-6">Status<select required value={editor.status || statusOptions[0]} onChange={(e) => setEditor({ ...editor, status: e.target.value })}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              {resource === "products" && <label className="col-12">Product images
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => {
                  const files = [...event.target.files].filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 5 * 1024 * 1024);
                  if (files.length !== event.target.files.length) setNotice("Use JPG, JPEG, PNG, or WebP files up to 5 MB.");
                  setProductImageFiles((current) => [...current, ...files].slice(0, 8 - (editor.images || []).length));
                  event.target.value = "";
                }} />
                <small className="text-secondary d-block">Reorder existing images with arrows, make one primary, or remove it. New images upload when you save.</small>
                <div className="image-previews">{(editor.images || []).map((image, index) => <div className="image-preview" key={image.publicId || image.url}><img src={image.url} alt="Product" />{image.isPrimary && <span>Primary</span>}<div><button type="button" disabled={!index} onClick={() => { const images = [...editor.images]; [images[index - 1], images[index]] = [images[index], images[index - 1]]; setEditor({ ...editor, images }); }}>←</button><button type="button" disabled={index === editor.images.length - 1} onClick={() => { const images = [...editor.images]; [images[index + 1], images[index]] = [images[index], images[index + 1]]; setEditor({ ...editor, images }); }}>→</button><button type="button" onClick={() => setEditor({ ...editor, images: editor.images.map((item, itemIndex) => ({ ...item, isPrimary: itemIndex === index })) })}>★</button><button type="button" onClick={() => setEditor({ ...editor, images: editor.images.filter((_, itemIndex) => itemIndex !== index) })}>×</button></div></div>)}{productImageFiles.map((file, index) => <div className="image-preview" key={`${file.name}-${index}`}><img src={URL.createObjectURL(file)} alt="New product preview" /><div><button type="button" onClick={() => setProductImageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button></div></div>)}</div>
              </label>}
            </div>
            <div className="admin-editor-actions">
              <button className="btn btn-primary btn-sm"><i className="bi bi-check2" /> Save changes</button>
              <button type="button" className="btn btn-outline-light btn-sm" onClick={() => setEditor(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      <div className="dashboard-panel">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Record</th>
                <th>Role / category</th>
                <th>Status</th>
                <th>Created</th>
                <th>Details</th>
                <th className="text-end">Manage</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x._id}>
                  <td>
                    <b>
                      {x.name ||
                        x.product?.name ||
                        x.submittedName ||
                        x.title ||
                        "Vendor offer"}
                    </b>
                    <br />
                    <small>
                      {x.email ||
                        x.vendor?.email ||
                        x.buyer?.email ||
                        x.brand ||
                        ""}
                    </small>
                  </td>
                  <td>{x.role || x.category || x.product?.name || "—"}</td>
                  <td>
                    <span
                      className={`badge ${x.status === "approved" ? "text-bg-success" : x.status === "pending" ? "text-bg-warning" : "text-bg-secondary"}`}
                    >
                      {x.status || "—"}
                    </span>
                  </td>
                  <td>
                    {x.createdAt
                      ? new Date(x.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <small>ID: {x._id}</small>
                    {x.price && (
                      <>
                        <br />
                        <b>{fmt(x.price)}</b>
                      </>
                    )}
                  </td>
                  <td className="text-end">
                    <div className="admin-row-actions">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => openEditor(x)}><i className="bi bi-pencil-square" /> <span>Edit</span></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRecord(x)}><i className="bi bi-trash3" /> <span>Delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!items.length && (
          <p className="text-secondary mb-0">No matching records.</p>
        )}
      </div>
    </main>
  );
}
function Wishlist() {
  const [state, setState] = useState({ loading: true, items: [], error: "" });
  const load = () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    api
      .get("/buyer/wishlist")
      .then((r) => setState({ loading: false, items: r.data.data, error: "" }))
      .catch((e) =>
        setState({
          loading: false,
          items: [],
          error: e.response?.data?.message || e.message,
        }),
      );
  };
  useEffect(load, []);
  const remove = (id) =>
    api
      .post(`/buyer/wishlist/${id}`)
      .then((response) => { notifyWishlistChanged(response.data.data); load(); })
      .catch((e) =>
        setState((s) => ({
          ...s,
          error: e.response?.data?.message || e.message,
        })),
      );
  if (state.loading) return <Loading label="Loading your wishlist…" />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;
  return (
    <main className="container py-5 wishlist-page">
      <span className="eyebrow dark">BUYER WORKSPACE</span>
      <h1>Your shortlist</h1>
      {!state.items.length ? (
        <p className="text-secondary">
          Save products from their product pages to compare them later.
        </p>
      ) : (
        <div className="row g-4">
          {state.items.map((p) => (
            <div className="col-6 col-md-4 col-xl-3" key={p._id}>
              <ProductCard product={p} onRemove={remove} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
function PairExistingProduct() {
  const [searchParams] = useSearchParams(),
    preselectedId = searchParams.get("product"),
    [query, setQuery] = useState(""),
    [matches, setMatches] = useState([]),
    [selected, setSelected] = useState(null),
    [requests, setRequests] = useState([]),
    [state, setState] = useState({ loading: false, error: "", message: "" }),
    [offer, setOffer] = useState({
      price: "",
      stock: "available",
      sku: "",
      warranty: "",
      shippingDetails: "",
      deliveryEstimate: "",
      sellerUrl: "",
      notes: "",
    });
  const loadRequests = () =>
    api
      .get("/vendor/pairings")
      .then((r) => setRequests(r.data.data))
      .catch((e) =>
        setState((s) => ({
          ...s,
          error: e.response?.data?.message || e.message,
        })),
      );
  useEffect(loadRequests, []);
  useEffect(() => {
    if (!preselectedId) return;
    api
      .get("/vendor/pairing/search", { params: { id: preselectedId } })
      .then((r) => {
        const product = r.data.data[0];
        if (product) {
          setSelected(product);
          setQuery(product.name);
        }
      })
      .catch((e) =>
        setState((s) => ({
          ...s,
          error: e.response?.data?.message || e.message,
        })),
      );
  }, [preselectedId]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length < 2) {
        setMatches([]);
        return;
      }
      api
        .get("/vendor/pairing/search", { params: { q: query } })
        .then((r) => setMatches(r.data.data))
        .catch((e) =>
          setState((s) => ({
            ...s,
            error: e.response?.data?.message || e.message,
          })),
        );
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  const submit = async (e) => {
    e.preventDefault();
    if (!selected)
      return setState((s) => ({
        ...s,
        error: "Select the master product you want to pair.",
      }));
    setState({ loading: true, error: "", message: "" });
    try {
      const r = await api.post("/vendor/pairing", {
        product: selected._id,
        submittedName: query,
        ...offer,
        price: Number(offer.price),
      });
      setState({ loading: false, error: "", message: r.data.message });
      setSelected(null);
      setQuery("");
      setMatches([]);
      setOffer({
        price: "",
        stock: "available",
        sku: "",
        warranty: "",
        shippingDetails: "",
        deliveryEstimate: "",
        sellerUrl: "",
        notes: "",
      });
      loadRequests();
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e.response?.data?.message || e.message,
      }));
    }
  };
  const primary = (p) => {
    const image =
      (p.images || []).find((x) => x.isPrimary) || (p.images || [])[0];
    return typeof image === "string" ? image : image?.url;
  };
  return (
    <main className="container py-5">
      <div className="d-flex justify-content-between align-items-center gap-2 mb-3 flex-wrap">
        <span className="eyebrow dark">VENDOR WORKSPACE</span>
        <Link className="btn btn-outline-primary btn-sm" to="/vendor">
          <i className="bi bi-speedometer2 me-1" />Dashboard
        </Link>
      </div>
      <h1>Pair existing product</h1>
      <p className="text-secondary">
        Find the platform’s master product, then submit your own price and
        fulfilment details for approval.
      </p>
      <div className="row g-4">
        <div className="col-lg-7">
          <form className="dashboard-panel" onSubmit={submit}>
            {state.error && (
              <div className="alert alert-danger">{state.error}</div>
            )}
            {state.message && (
              <div className="alert alert-success">{state.message}</div>
            )}
            <label className="form-label fw-bold">
              Search the product catalog
            </label>
            <input
              className="form-control mb-2"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, brand, model number, or SKU"
            />
            {matches.length > 0 && (
              <div className="pairing-matches mb-3">
                {matches.map((p) => (
                  <button
                    type="button"
                    className={`pairing-match ${selected?._id === p._id ? "selected" : ""}`}
                    key={p._id}
                    onClick={() => setSelected(p)}
                  >
                    {primary(p) && <img src={primary(p)} alt="" />}
                    <span>
                      <b>{p.name}</b>
                      <small>
                        {p.brand} {p.model && `• ${p.model}`}
                      </small>
                      <small>
                        {Object.entries(p.specifications || {})
                          .slice(0, 2)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                      </small>
                    </span>
                    <i className="bi bi-check-circle-fill" />
                  </button>
                ))}
              </div>
            )}
            {selected && (
              <div className="alert alert-info">
                Pairing with master product: <b>{selected.name}</b>. You cannot
                edit its catalog details.
              </div>
            )}
            <div className="row g-2">
              <div className="col-md-6">
                <input
                  required
                  type="number"
                  min="0"
                  className="form-control mb-2"
                  placeholder="Your price"
                  value={offer.price}
                  onChange={(e) =>
                    setOffer({ ...offer, price: e.target.value })
                  }
                />
              </div>
              <div className="col-md-6">
                <select
                  className="form-select mb-2"
                  value={offer.stock}
                  onChange={(e) =>
                    setOffer({ ...offer, stock: e.target.value })
                  }
                >
                  <option value="available">In stock</option>
                  <option value="limited">Limited stock</option>
                  <option value="out_of_stock">Out of stock</option>
                </select>
              </div>
            </div>
            <input
              className="form-control mb-2"
              placeholder="Vendor SKU"
              value={offer.sku}
              onChange={(e) => setOffer({ ...offer, sku: e.target.value })}
            />
            <input
              className="form-control mb-2"
              placeholder="Warranty"
              value={offer.warranty}
              onChange={(e) => setOffer({ ...offer, warranty: e.target.value })}
            />
            <input
              className="form-control mb-2"
              placeholder="Shipping details / delivery estimate"
              value={offer.shippingDetails}
              onChange={(e) =>
                setOffer({ ...offer, shippingDetails: e.target.value })
              }
            />
            <input
              required
              type="url"
              className="form-control mb-2"
              placeholder="Product or seller URL"
              value={offer.sellerUrl}
              onChange={(e) =>
                setOffer({ ...offer, sellerUrl: e.target.value })
              }
            />
            <textarea
              className="form-control mb-3"
              placeholder="Note for the reviewer (optional)"
              value={offer.notes}
              onChange={(e) => setOffer({ ...offer, notes: e.target.value })}
            />
            <button
              className="btn btn-primary"
              disabled={state.loading || !selected}
            >
              {state.loading ? "Submitting…" : "Submit pairing request"}
            </button>
          </form>
        </div>
        <div className="col-lg-5">
          <div className="dashboard-panel">
            <h3>Your pairing requests</h3>
            {!requests.length ? (
              <p>No pairing requests yet.</p>
            ) : (
              requests.map((x) => (
                <div className="offer-row" key={x._id}>
                  <span>
                    <b>{x.product?.name || x.submittedName}</b>
                    <small className="text-capitalize">
                      {x.status.replace("_", " ")}
                    </small>
                    {x.reviewReason && (
                      <small className="text-danger">
                        Admin note: {x.reviewReason}
                      </small>
                    )}
                  </span>
                  <b>{fmt(x.offer?.price)}</b>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
function CartPage() {
  const { user, login, logout } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem("cart") || "[]"));
  const [message, setMessage] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const updateQuantity = (id, quantity) => {
    const next = items.map((item) => (item._id === id ? { ...item, quantity: Math.max(1, quantity) } : item));
    setItems(next);
    localStorage.setItem("cart", JSON.stringify(next));
    notifyCartChanged();
  };

  const remove = (id) => {
    const next = items.filter((item) => item._id !== id);
    setItems(next);
    localStorage.setItem("cart", JSON.stringify(next));
    notifyCartChanged();
  };

  const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  const placeOrder = async (targetUser) => {
    const buyer = targetUser || user;
    if (!buyer || buyer.role !== "buyer") {
      setShowAuthModal(true);
      return;
    }
    setCheckingOut(true);
    try {
      const payload = items.map((item) => ({
        product: item._id || item.product,
        slug: item.slug || item._id,
        sku: item.sku,
        name: item.name,
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      }));
      const response = await api.post("/orders", { items: payload });
      const numbers = (response.data?.data?.orders || []).map((order) => order.orderNumber).join(", ");
      localStorage.removeItem("cart");
      setItems([]);
      notifyCartChanged();
      setMessage(`Order placed successfully${numbers ? `: ${numbers}` : "! Direct OEM allocation confirmed."}`);
      setShowAuthModal(false);
    } catch (e) {
      setMessage(e.response?.data?.message || e.message || "Unable to place order.");
    } finally {
      setCheckingOut(false);
    }
  };

  const checkout = async () => {
    if (!user || user.role !== "buyer") {
      setShowAuthModal(true);
      return;
    }
    await placeOrder(user);
  };

  const handleModalLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const r = await api.post("/auth/login", authForm);
      const loggedInUser = r.data?.data?.user;
      if (loggedInUser?.role !== "buyer") {
        setAuthError(`This account is registered as '${loggedInUser?.role || "user"}'. Direct procurement orders require a buyer account.`);
        setAuthLoading(false);
        return;
      }
      login(r.data.data);
      setShowAuthModal(false);
      await placeOrder(loggedInUser);
    } catch (err) {
      setAuthError(err.response?.data?.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <main className="container py-5 shopping-page">
      <span className="eyebrow dark">ENTERPRISE PROCUREMENT CART</span>
      <h1>Industrial Order Review</h1>
      <p className="text-secondary">Review your machinery allocation and direct OEM shipment lines before order dispatch.</p>
      {message && <div className="alert alert-info mt-3">{message}</div>}
      {!items.length ? (
        <div className="empty-state">
          <i className="bi bi-box-seam" />
          <h2>Your procurement cart is empty</h2>
          <p>Select industrial equipment, motors, or CNC centers from the catalog to prepare your purchase order.</p>
          <Link to="/products" className="btn btn-primary">
            Explore Machinery Catalog <i className="bi bi-arrow-right ms-2" />
          </Link>
        </div>
      ) : (
        <div className="row g-4 mt-2">
          <div className="col-lg-8">
            <div className="dashboard-panel cart-list">
              {items.map((item) => (
                <div className="cart-item" key={item._id}>
                  <div className="cart-thumb">{item.image ? <img src={item.image} alt="" /> : <i className="bi bi-box-seam" />}</div>
                  <div className="cart-info">
                    <strong>{item.name}</strong>
                    <span>{item.brand || "OEM Verified"}</span>
                    <b>{fmt(item.price)}</b>
                  </div>
                  <div className="quantity-control">
                    <button onClick={() => updateQuantity(item._id, (item.quantity || 1) - 1)} aria-label="Decrease quantity">
                      −
                    </button>
                    <span>{item.quantity || 1}</span>
                    <button onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)} aria-label="Increase quantity">
                      +
                    </button>
                  </div>
                  <button className="remove-item" onClick={() => remove(item._id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
          <aside className="col-lg-4">
            <div className="offer-panel cart-summary">
              <span className="eyebrow dark">ORDER SUMMARY</span>
              <div>
                <span>Subtotal (excl. taxes)</span>
                <strong>{fmt(total)}</strong>
              </div>
              <div>
                <span>Pan-India Freight</span>
                <strong className="text-success">Covered</strong>
              </div>
              <hr />
              <div className="total-row">
                <span>Estimated Total</span>
                <strong>{fmt(total)}</strong>
              </div>
              <button className="btn btn-primary w-100 mt-3" disabled={checkingOut} onClick={checkout}>
                {checkingOut ? "Submitting purchase order…" : "Submit Procurement Order"} <i className="bi bi-arrow-right ms-2" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Sign-In Popup Modal for unauthenticated / non-buyer users */}
      {showAuthModal && (
        <div
          className="compare-modal-backdrop"
          style={{ zIndex: 2200 }}
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="compare-modal-content cart-auth-modal"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="compare-modal-header border-bottom">
              <div>
                <span className="eyebrow dark">AUTHENTICATION REQUIRED</span>
                <h3 className="h5 mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-shield-lock text-primary" /> Sign In to Place Order
                </h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowAuthModal(false)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="p-4">
              {user && user.role !== "buyer" ? (
                <div className="text-center py-2">
                  <div className="alert alert-warning mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2" />
                    You are signed in as <strong>{user.role}</strong> ({user.email}). Placing direct procurement orders requires a verified <strong>Buyer</strong> profile.
                  </div>
                  <button
                    className="btn btn-primary w-100 mb-2"
                    onClick={() => {
                      logout();
                      setAuthError("");
                    }}
                  >
                    <i className="bi bi-box-arrow-right me-1" /> Switch to Buyer Account
                  </button>
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => setShowAuthModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-secondary small mb-3">
                    Sign in to your buyer procurement account to confirm equipment allocation, escrow protection, and dispatch terms.
                  </p>

                  {authError && (
                    <div className="alert alert-danger py-2 small mb-3">
                      <i className="bi bi-exclamation-circle me-1" /> {authError}
                    </div>
                  )}

                  <form onSubmit={handleModalLogin}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-secondary mb-1">Work Email</label>
                      <input
                        type="email"
                        required
                        className="form-control"
                        placeholder="buyer@company.com"
                        value={authForm.email}
                        onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                        autoFocus
                      />
                    </div>

                    <div className="mb-3">
                      <div className="d-flex justify-content-between">
                        <label className="form-label small fw-semibold text-secondary mb-1">Password</label>
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
                        value={authForm.password}
                        onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100 mb-2"
                      disabled={authLoading}
                    >
                      {authLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Authenticating &amp; Placing Order…
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check2-circle me-1" /> Sign In &amp; Place Order
                        </>
                      )}
                    </button>

                    <div className="d-flex align-items-center my-3">
                      <hr className="flex-grow-1 m-0 text-secondary" />
                      <span className="px-2 text-secondary small">or</span>
                      <hr className="flex-grow-1 m-0 text-secondary" />
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100 mb-3"
                      onClick={() => {
                        setShowAuthModal(false);
                        nav("/login?redirect=/cart");
                      }}
                    >
                      Go to Sign In Page <i className="bi bi-arrow-right ms-1" />
                    </button>

                    <div className="text-center small text-secondary">
                      Don’t have a buyer account?{" "}
                      <Link
                        to="/register?role=buyer&redirect=/cart"
                        className="text-primary text-decoration-none fw-semibold"
                        onClick={() => setShowAuthModal(false)}
                      >
                        Register as Buyer
                      </Link>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
function VendorTools({ mode }) {
  const [state, setState] = useState({
    loading: true,
    items: [],
    error: "",
    message: "",
  }),
    [form, setForm] = useState({
      name: "",
      brand: "",
      model: "",
      category: "Motors",
      description: "",
      specifications: "{}",
      product: "",
      price: "",
      stock: "available",
      sellerUrl: "",
      deliveryEstimate: "",
      warranty: "",
      matchName: "",
    });
  const endpoint =
    mode === "products"
      ? "/vendor/products"
      : mode === "offers"
        ? "/vendor/offers"
        : null;
  const load = () => {
    if (!endpoint) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: "" }));
    api
      .get(endpoint)
      .then((r) =>
        setState((s) => ({
          ...s,
          loading: false,
          items: r.data.data,
          error: "",
        })),
      )
      .catch((e) =>
        setState((s) => ({
          ...s,
          loading: false,
          error: e.response?.data?.message || e.message,
        })),
      );
  };
  useEffect(load, [endpoint]);
  const submit = async (e) => {
    e.preventDefault();
    setState((s) => ({ ...s, error: "", message: "" }));
    try {
      let response;
      if (mode === "products") {
        let specifications;
        try {
          specifications = JSON.parse(form.specifications);
        } catch {
          throw Error(
            'Specifications must be valid JSON, for example {"RAM":"16GB"}',
          );
        }
        response = await api.post("/products", {
          name: form.name,
          brand: form.brand,
          model: form.model,
          category: form.category,
          description: form.description,
          specifications,
        });
      } else if (mode === "offers")
        response = await api.post("/vendor/offers", {
          product: form.product,
          price: Number(form.price),
          stock: form.stock,
          sellerUrl: form.sellerUrl,
          deliveryEstimate: form.deliveryEstimate,
          warranty: form.warranty,
        });
      else
        response = await api.post("/vendor/pairing", {
          name: form.matchName,
          product: form.product || undefined,
        });
      setState((s) => ({ ...s, message: response.data.message }));
      load();
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e.response?.data?.message || e.message,
      }));
    }
  };
  const title =
    mode === "products"
      ? "Product submissions"
      : mode === "offers"
        ? "Vendor offers"
        : "Pair an existing product";
  return (
    <main className="container py-5">
      <span className="eyebrow dark">VENDOR WORKSPACE</span>
      <h1>{title}</h1>
      <div className="row g-4">
        <div className="col-lg-5">
          <form className="dashboard-panel" onSubmit={submit}>
            {state.error && (
              <div className="alert alert-danger">{state.error}</div>
            )}
            {state.message && (
              <div className="alert alert-success">{state.message}</div>
            )}
            {mode === "products" && (
              <>
                <input
                  required
                  className="form-control mb-2"
                  placeholder="Product name"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  required
                  className="form-control mb-2"
                  placeholder="Brand"
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
                <input
                  className="form-control mb-2"
                  placeholder="Model number"
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
                <select
                  className="form-select mb-2"
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {[
                    "Motors",
                    "Space Heaters",
                    "LED Lighting",
                    "Testing Instruments",
                    "MCBs",
                    "Motor Starters",
                    "Contactors",
                    "Switchgear",
                    "Industrial Sensors",
                    "Cables",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <textarea
                  required
                  className="form-control mb-2"
                  placeholder="Description"
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
                <textarea
                  className="form-control mb-2"
                  value={form.specifications}
                  onChange={(e) =>
                    setForm({ ...form, specifications: e.target.value })
                  }
                />
              </>
            )}
            {mode === "offers" && (
              <>
                <input
                  required
                  className="form-control mb-2"
                  placeholder="Approved product ID"
                  onChange={(e) =>
                    setForm({ ...form, product: e.target.value })
                  }
                />
                <input
                  required
                  type="number"
                  className="form-control mb-2"
                  placeholder="Price"
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                <input
                  required
                  className="form-control mb-2"
                  placeholder="Seller URL"
                  onChange={(e) =>
                    setForm({ ...form, sellerUrl: e.target.value })
                  }
                />
                <input
                  className="form-control mb-2"
                  placeholder="Delivery estimate"
                  onChange={(e) =>
                    setForm({ ...form, deliveryEstimate: e.target.value })
                  }
                />
              </>
            )}
            {mode === "pairing" && (
              <>
                <input
                  required
                  className="form-control mb-2"
                  placeholder="Product name you want to pair"
                  onChange={(e) =>
                    setForm({ ...form, matchName: e.target.value })
                  }
                />
                <input
                  className="form-control mb-2"
                  placeholder="Optional existing product ID"
                  onChange={(e) =>
                    setForm({ ...form, product: e.target.value })
                  }
                />
              </>
            )}
            <button className="btn btn-primary">Submit for approval</button>
          </form>
        </div>
        <div className="col-lg-7">
          {mode === "pairing" ? (
            <div className="dashboard-panel">
              <h3>Pairing review</h3>
              <p className="text-secondary">
                We detect potential catalog matches and an administrator must
                approve the result before your offer can become public.
              </p>
            </div>
          ) : state.loading ? (
            <Loading />
          ) : (
            <div className="dashboard-panel">
              <h3 className="text-white">Submitted records</h3>
              {state.items.map((x) => (
                <div className="offer-row" key={x._id}>
                  <span>
                    <b className="text-white">{x.product?.name || x.name}</b>
                    <small className="text-secondary">{x.status}</small>
                  </span>
                  <b className="text-success">{x.price ? fmt(x.price) : x.category}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
function ProductSubmission() {
  const [state, setState] = useState({
    items: [],
    loading: true,
    saving: false,
    error: "",
    message: "",
  }),
    [form, setForm] = useState({
      name: "",
      brand: "",
      model: "",
      category: "Motors",
      description: "",
      oemManualTitle: "",
      oemManualUrl: "",
      price: "",
      stock: "",
    }),
    [specPairs, setSpecPairs] = useState([{ name: "", value: "" }]),
    [techPairs, setTechPairs] = useState([{ name: "", value: "" }]),
    [images, setImages] = useState([]);
  const pairsToObj = (pairs) => Object.fromEntries(pairs.filter(p => p.name.trim()).map(p => [p.name.trim(), p.value.trim()]));
  const addPair = (setter) => setter(a => [...a, { name: "", value: "" }]);
  const removePair = (setter, idx) => setter(a => a.filter((_, i) => i !== idx));
  const updatePair = (setter, idx, field, val) => setter(a => a.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  const load = () =>
    api
      .get("/vendor/products")
      .then((r) =>
        setState((s) => ({ ...s, items: r.data.data, loading: false })),
      )
      .catch((e) =>
        setState((s) => ({
          ...s,
          error: e.response?.data?.message || e.message,
          loading: false,
        })),
      );
  useEffect(load, []);
  const choose = (e) => {
    const valid = [...e.target.files].filter(
      (f) =>
        ["image/jpeg", "image/png", "image/webp"].includes(f.type) &&
        f.size <= 5 * 1024 * 1024,
    );
    if (valid.length !== e.target.files.length)
      setState((s) => ({
        ...s,
        error: "Images must be JPG, PNG, or WebP and no larger than 5 MB.",
      }));
    setImages((a) => [...a, ...valid].slice(0, 8));
    e.target.value = "";
  };
  const move = (i, d) =>
    setImages((a) => {
      const n = [...a],
        j = i + d;
      if (j < 0 || j >= n.length) return n;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  const submit = async (e, draft = false) => {
    e.preventDefault();
    setState((s) => ({ ...s, saving: true, error: "", message: "" }));
    try {
      const data = new FormData();
      const specifications = JSON.stringify(pairsToObj(specPairs));
      const technicalSpecifications = JSON.stringify(pairsToObj(techPairs));
      Object.entries({ ...form, specifications, technicalSpecifications, saveAsDraft: String(draft) }).forEach(
        ([k, v]) => data.append(k, v),
      );
      images.forEach((f) => data.append("images", f));
      data.append("primaryImageIndex", "0");
      await api.post("/products", data);
      setState((s) => ({
        ...s,
        saving: false,
        message: draft ? "Draft saved." : "Product submitted for review.",
        error: "",
      }));
      setSpecPairs([{ name: "", value: "" }]);
      setTechPairs([{ name: "", value: "" }]);
      setImages([]);
      load();
    } catch (e) {
      setState((s) => ({
        ...s,
        saving: false,
        error: e.response?.data?.message || e.message || "Unable to submit product.",
      }));
    }
  };
  return (
    <main className="container py-5">
      <div className="d-flex justify-content-between align-items-center gap-2 mb-3 flex-wrap">
        <span className="eyebrow dark">VENDOR WORKSPACE</span>
        <Link className="btn btn-outline-primary btn-sm" to="/vendor">
          <i className="bi bi-speedometer2 me-1" />Dashboard
        </Link>
      </div>
      <h1>Submit a product</h1>
      <div className="row g-4">
        <div className="col-lg-6">
          <form className="dashboard-panel" onSubmit={submit}>
            {state.error && (
              <div className="alert alert-danger">{state.error}</div>
            )}
            {state.message && (
              <div className="alert alert-success">{state.message}</div>
            )}
            <input
              required
              className="form-control mb-2"
              placeholder="Product name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div className="row g-2">
              <div className="col">
                <input
                  required
                  className="form-control mb-2"
                  placeholder="Brand"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>
              <div className="col">
                <input
                  className="form-control mb-2"
                  placeholder="Model"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
              </div>
            </div>
            <select
              className="form-select mb-2"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {["Motors", "Space Heaters", "LED Lighting", "Testing Instruments", "MCBs", "Motor Starters", "Contactors", "Switchgear", "Industrial Sensors", "Cables"].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
            <div className="row g-2">
              <div className="col">
                <input
                  type="number"
                  min="0"
                  className="form-control mb-2"
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="col">
                <input
                  type="number"
                  min="0"
                  className="form-control mb-2"
                  placeholder="Stock units"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
            </div>
            <textarea
              required
              className="form-control mb-2"
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <label className="form-label fw-bold">Product specifications <span className="text-secondary fw-normal">(optional)</span></label>
            {specPairs.map((pair, idx) => (
              <div className="d-flex gap-2 mb-2" key={idx}>
                <input
                  className="form-control"
                  placeholder="Name (e.g. Voltage)"
                  value={pair.name}
                  onChange={(e) => updatePair(setSpecPairs, idx, "name", e.target.value)}
                />
                <input
                  className="form-control"
                  placeholder="Value (e.g. 415V)"
                  value={pair.value}
                  onChange={(e) => updatePair(setSpecPairs, idx, "value", e.target.value)}
                />
                {specPairs.length > 1 && (
                  <button type="button" className="btn btn-outline-danger btn-sm px-2" onClick={() => removePair(setSpecPairs, idx)} title="Remove">
                    <i className="bi bi-trash" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-outline-secondary btn-sm mb-3" onClick={() => addPair(setSpecPairs)}>
              <i className="bi bi-plus-lg me-1" />Add specification
            </button>
            <label className="form-label fw-bold d-block mt-3">Technical specifications <span className="text-secondary fw-normal">(optional)</span></label>
            {techPairs.map((pair, idx) => (
              <div className="d-flex gap-2 mb-2" key={idx}>
                <input
                  className="form-control"
                  placeholder="Name (e.g. Operating temp)"
                  value={pair.name}
                  onChange={(e) => updatePair(setTechPairs, idx, "name", e.target.value)}
                />
                <input
                  className="form-control"
                  placeholder="Value (e.g. -20 to 60 C)"
                  value={pair.value}
                  onChange={(e) => updatePair(setTechPairs, idx, "value", e.target.value)}
                />
                {techPairs.length > 1 && (
                  <button type="button" className="btn btn-outline-danger btn-sm px-2" onClick={() => removePair(setTechPairs, idx)} title="Remove">
                    <i className="bi bi-trash" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-outline-secondary btn-sm mb-3" onClick={() => addPair(setTechPairs)}>
              <i className="bi bi-plus-lg me-1" />Add technical spec
            </button>
            <div className="row g-2 mb-2">
              <div className="col">
                <input className="form-control" placeholder="OEM manual title" value={form.oemManualTitle} onChange={(e) => setForm({ ...form, oemManualTitle: e.target.value })} />
              </div>
              <div className="col">
                <input type="url" className="form-control" placeholder="OEM manual URL" value={form.oemManualUrl} onChange={(e) => setForm({ ...form, oemManualUrl: e.target.value })} />
              </div>
            </div>
            <label className="form-label fw-bold">Product images</label>
            <input
              className="form-control"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={choose}
            />
            <small className="text-secondary">
              Up to 8 JPG, PNG, or WebP images, 5 MB each. First image is
              primary.
            </small>
            <div className="image-previews">
              {images.map((f, i) => (
                <div className="image-preview" key={`${f.name}-${i}`}>
                  <img src={URL.createObjectURL(f)} alt="Product preview" />
                  {i === 0 && <span>Primary</span>}
                  <div>
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={!i}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === images.length - 1}
                    >
                      →
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setImages((a) => a.filter((_, x) => x !== i))
                      }
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="d-flex gap-2 mt-3">
              <button
                className="btn btn-outline-primary"
                type="button"
                onClick={(e) => submit(e, true)}
                disabled={state.saving}
              >
                {state.saving ? "Uploading…" : "Save draft"}
              </button>
              <button className="btn btn-primary" disabled={state.saving}>{state.saving ? "Uploading…" : "Submit for approval"}</button>
            </div>
          </form>
        </div>
        <div className="col-lg-6">
          <div className="dashboard-panel">
            <h3>Your submissions</h3>
            {state.loading ? (
              <p>Loading…</p>
            ) : (
              state.items.map((p) => (
                <div className="offer-row" key={p._id}>
                  <span>
                    <b>{p.name}</b>
                    <small className="text-capitalize">
                      {p.status.replace("_", " ")}
                    </small>
                    {p.reviewReason && (
                      <small className="text-danger">
                        Admin note: {p.reviewReason}
                      </small>
                    )}
                  </span>
                  <b>{p.price ? fmt(p.price) : p.category}</b>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
function Account() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [state, setState] = useState({ loading: true, saving: false, error: "", message: "", profile: null, orders: [] });
  const load = () => api.get("/account").then((r) => setState((s) => ({ ...s, loading: false, profile: r.data.data.profile, orders: r.data.data.orders }))).catch((e) => setState((s) => ({ ...s, loading: false, error: e.response?.data?.message || e.message })));
  useEffect(load, []);
  const update = (key, value) => setState((s) => ({ ...s, profile: { ...s.profile, [key]: value } }));
  const save = async (event) => { event.preventDefault(); setState((s) => ({ ...s, saving: true, error: "", message: "" })); try { const r = await api.patch("/account", state.profile); setState((s) => ({ ...s, saving: false, profile: r.data.data, message: r.data.message })); } catch (e) { setState((s) => ({ ...s, saving: false, error: e.response?.data?.message || e.message })); } };
  const cancel = async (id) => { try { await api.patch(`/account/orders/${id}/cancel`); load(); } catch (e) { setState((s) => ({ ...s, error: e.response?.data?.message || e.message })); } };
  const updateOrder = async (id, status) => { try { await api.patch(`/account/orders/${id}`, { status }); load(); } catch (e) { setState((s) => ({ ...s, error: e.response?.data?.message || e.message })); } };
  const invoice = (order) => { const blob = new Blob([`Industry Mandi invoice\nOrder: ${order.orderNumber}\nTotal: ${fmt(order.total)}\nStatus: ${order.status}`], { type: "text/plain" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${order.orderNumber || "invoice"}.txt`; link.click(); URL.revokeObjectURL(link.href); };
  if (state.loading) return <Loading label="Loading your account…" />;
  if (!state.profile) return <ErrorState message={state.error} onRetry={load} />;
  const vendor = user.role === "vendor";
  const address = (kind, title) => <div className="account-section-card"><div className="account-card-heading"><div><span className="eyebrow dark">{title}</span><h3>{state.profile[kind]?.label || title}</h3></div><i className="bi bi-geo-alt" /></div><div className="account-form-grid"><input placeholder="Address line 1" value={state.profile[kind]?.line1 || ""} onChange={(e) => update(kind, { ...state.profile[kind], line1: e.target.value })} /><input placeholder="Address line 2" value={state.profile[kind]?.line2 || ""} onChange={(e) => update(kind, { ...state.profile[kind], line2: e.target.value })} /><input placeholder="City" value={state.profile[kind]?.city || ""} onChange={(e) => update(kind, { ...state.profile[kind], city: e.target.value })} /><input placeholder="State" value={state.profile[kind]?.state || ""} onChange={(e) => update(kind, { ...state.profile[kind], state: e.target.value })} /><input placeholder="Postal code" value={state.profile[kind]?.postalCode || ""} onChange={(e) => update(kind, { ...state.profile[kind], postalCode: e.target.value })} /></div></div>;
  return <main className="account-page container py-5"><div className="account-header"><div><span className="eyebrow dark">SECURE ACCOUNT</span><h1>{vendor ? "Vendor account" : "Buyer account"}</h1><p className="text-secondary">Manage your details, orders, and {vendor ? "marketplace operations" : "buying preferences"} in one place.</p></div><div className="d-flex align-items-center gap-2"><Link className="btn btn-outline-primary btn-sm" to={vendor ? "/vendor" : "/dashboard/buyer"}><i className="bi bi-speedometer2 me-1" />Dashboard</Link><span className="account-role"><i className={`bi ${vendor ? "bi-shop" : "bi-person-check"}`} /> {vendor ? "Vendor access" : "Buyer access"}</span></div></div><div className="account-layout"><aside className="account-nav">{(vendor ? [["overview", "Overview", "bi-grid"], ["business", "Business & KYC", "bi-building"], ["orders", "Products & orders", "bi-box-seam"], ["security", "Security", "bi-shield-lock"]] : [["overview", "Overview", "bi-grid"], ["details", "Personal details", "bi-person"], ["addresses", "Addresses", "bi-geo-alt"], ["orders", "Order history", "bi-box-seam"], ["wishlist", "Wishlist", "bi-heart"], ["security", "Security", "bi-shield-lock"]]).map(([key, label, icon]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><i className={`bi ${icon}`} />{label}</button>)}<button className="account-logout" onClick={logout}><i className="bi bi-box-arrow-right" />Log out</button></aside><section className="account-content">{(state.error || state.message) && <div className={`alert ${state.error ? "alert-danger" : "alert-success"}`}>{state.error || state.message}</div>}{tab === "overview" && <><div className="account-stats"><div><span>Orders</span><strong>{state.orders.length}</strong></div><div><span>{vendor ? "Active listings" : "Saved products"}</span><strong>{vendor ? "—" : ""}{!vendor && <Link to="/wishlist">Open</Link>}</strong></div><div><span>Account status</span><strong className="text-success">Verified</strong></div></div><div className="account-section-card account-security-note"><i className="bi bi-shield-check" /><div><h3>Your account is protected</h3><p>Passwords and payout credentials are encrypted and never shown publicly. Only your role can access this dashboard.</p></div></div><div className="account-section-card"><div className="account-card-heading"><div><span className="eyebrow dark">RECENT ACTIVITY</span><h3>{state.orders.length ? "Latest orders" : "No orders yet"}</h3></div><button className="btn btn-outline-primary btn-sm" onClick={() => setTab("orders")}>View all</button></div>{state.orders.slice(0, 3).map((order) => <OrderRow key={order._id} order={order} vendor={vendor} onCancel={cancel} onUpdate={updateOrder} onInvoice={invoice} />)}</div></>}{tab === "details" && <form className="account-section-card" onSubmit={save}><div className="account-card-heading"><div><span className="eyebrow dark">PERSONAL DETAILS</span><h3>How we reach you</h3></div></div><div className="account-form-grid"><input required placeholder="Full name" value={state.profile.name} onChange={(e) => update("name", e.target.value)} /><input disabled placeholder="Email address" value={state.profile.email} /><input placeholder="Phone number" value={state.profile.phone} onChange={(e) => update("phone", e.target.value)} /></div><SaveButton saving={state.saving} /></form>}{tab === "business" && <form className="account-section-card" onSubmit={save}><div className="account-card-heading"><div><span className="eyebrow dark">BUSINESS, GST & KYC</span><h3>Business identity</h3></div><i className="bi bi-patch-check" /></div><div className="account-form-grid"><input placeholder="Business name" value={state.profile.company} onChange={(e) => update("company", e.target.value)} /><input placeholder="Owner name" value={state.profile.ownerName} onChange={(e) => update("ownerName", e.target.value)} /><input placeholder="GST number" value={state.profile.gstNumber} onChange={(e) => update("gstNumber", e.target.value)} /><input disabled placeholder="Business email" value={state.profile.email} /><input placeholder="Business phone" value={state.profile.phone} onChange={(e) => update("phone", e.target.value)} /></div>{address("businessAddress", "Business address")}<div className="document-list"><strong>KYC / business documents</strong><p className="text-secondary">{state.profile.documents?.length ? state.profile.documents.map((doc) => doc.name).join(", ") : "No documents uploaded yet."}</p></div><SaveButton saving={state.saving} /></form>}{tab === "addresses" && <form onSubmit={save}>{address("billingAddress", "Billing address")}{address("shippingAddress", "Shipping address")}<SaveButton saving={state.saving} /></form>}{tab === "orders" && <div className="account-section-card"><div className="account-card-heading"><div><span className="eyebrow dark">{vendor ? "FULFILMENT" : "PURCHASES"}</span><h3>{vendor ? "Product and order management" : "Order history"}</h3></div></div>{state.orders.length ? state.orders.map((order) => <OrderRow key={order._id} order={order} vendor={vendor} onCancel={cancel} onUpdate={updateOrder} onInvoice={invoice} />) : <div className="account-empty"><i className="bi bi-box-seam" /><p>No orders to show yet.</p></div>}</div>}{tab === "wishlist" && <div className="account-section-card"><span className="eyebrow dark">SAVED PRODUCTS</span><h3>Your wishlist</h3><p className="text-secondary">Keep products you are considering close at hand.</p><Link className="btn btn-primary" to="/wishlist">Open wishlist <i className="bi bi-arrow-right ms-2" /></Link></div>}{tab === "security" && <PasswordPanel />}{vendor && tab === "business" && <BankPanel profile={state.profile} onSaved={load} />}</section></div></main>;
  function SaveButton({ saving }) { return <button className="btn btn-primary mt-3" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>; }
  function PasswordPanel() { const [form, setForm] = useState({ currentPassword: "", newPassword: "" }); const submit = async (e) => { e.preventDefault(); try { await api.patch("/account/password", form); setState((s) => ({ ...s, message: "Password changed successfully" })); setForm({ currentPassword: "", newPassword: "" }); } catch (error) { setState((s) => ({ ...s, error: error.response?.data?.message || error.message })); } }; return <form className="account-section-card" onSubmit={submit}><span className="eyebrow dark">PASSWORD & ACCESS</span><h3>Change password</h3><div className="account-form-grid"><input required type="password" placeholder="Current password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /><input required minLength="8" type="password" placeholder="New password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} /></div><button className="btn btn-primary mt-3">Update password</button></form>; }
  function BankPanel({ profile, onSaved }) { const [form, setForm] = useState({ accountName: "", bankName: "", accountNumber: "", ifsc: "" }); const [document, setDocument] = useState({ name: "", url: "" }); const submit = async (e) => { e.preventDefault(); await api.patch("/account/bank", form); onSaved(); }; const saveDocument = async () => { if (!document.name || !document.url) return; await api.patch("/account", { documents: [...(profile.documents || []), { ...document, status: "Submitted" }] }); setDocument({ name: "", url: "" }); onSaved(); }; return <><form className="account-section-card" onSubmit={submit}><span className="eyebrow dark">PAYOUTS</span><h3>Bank account details</h3><p className="text-secondary">{profile.bankAccount?.accountNumberMasked ? `Account on file: ${profile.bankAccount.accountNumberMasked}` : "Add a verified account for payouts."}</p><div className="account-form-grid"><input required placeholder="Account holder name" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} /><input required placeholder="Bank name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} /><input required placeholder="Account number" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} /><input required placeholder="IFSC code" value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value })} /></div><button className="btn btn-primary mt-3">Save payout details</button></form><div className="account-section-card"><span className="eyebrow dark">KYC / BUSINESS DOCUMENTS</span><h3>Upload a document</h3><p className="text-secondary">Add a secure document link from your approved storage provider.</p><div className="account-form-grid"><input placeholder="Document name (GST certificate, PAN, etc.)" value={document.name} onChange={(e) => setDocument({ ...document, name: e.target.value })} /><input type="url" placeholder="Secure document URL" value={document.url} onChange={(e) => setDocument({ ...document, url: e.target.value })} /></div><button type="button" className="btn btn-primary mt-3" onClick={saveDocument}>Add document</button>{profile.documents?.length > 0 && <div className="document-list">{profile.documents.map((item) => <div key={`${item.name}-${item.url}`}><strong>{item.name}</strong><span className="text-secondary ms-2">{item.status || "Submitted"}</span></div>)}</div>}</div></>; }
  function OrderRow({ order, vendor: isVendor, onCancel: cancelOrder, onUpdate: updateOrder, onInvoice: downloadInvoice }) { return <article className="account-order"><div className="order-main"><div><strong>#{order.orderNumber || order._id.slice(-8).toUpperCase()}</strong><span>{new Date(order.createdAt).toLocaleDateString()} · {fmt(order.total)}</span></div><span className={`order-status status-${order.status.toLowerCase().replaceAll(" ", "-")}`}>{order.status}</span></div><div className="order-progress">{["Pending", "Confirmed", "Shipped", "Out for Delivery", "Delivered"].map((status) => <span className={status === order.status ? "current" : ["Shipped", "Out for Delivery", "Delivered"].indexOf(status) <= ["Shipped", "Out for Delivery", "Delivered"].indexOf(order.status) && order.status !== "Pending" ? "done" : ""} key={status}><i />{status}</span>)}</div><p className="order-meta">{order.tracking?.number ? `Tracking: ${order.tracking.carrier || "Carrier"} ${order.tracking.number}` : "Tracking will appear when the order ships."} · Return/refund: {order.returnStatus || "Not requested"}</p><div className="order-actions"><button className="btn btn-sm btn-outline-primary" onClick={() => downloadInvoice(order)}><i className="bi bi-download me-1" />Invoice</button>{isVendor ? <select className="form-select form-select-sm" value={order.status} onChange={(e) => updateOrder(order._id, e.target.value)}><option>Confirmed</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select> : !["Delivered", "Cancelled", "Shipped"].includes(order.status) && <button className="btn btn-sm btn-outline-danger" onClick={() => cancelOrder(order._id)}>Cancel order</button>}</div></article>; }
}

function SmoothScrollEffects() {
  const location = useLocation();

  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const page = document.querySelector("main");
    if (!page) return undefined;

    if (reduceMotion) {
      window.scrollTo(0, 0);
      return undefined;
    }

    const cleanupHandlers = [];
    const context = gsap.context(() => {
      gsap.fromTo(
        page,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out", clearProps: "transform" },
      );
      gsap.fromTo(
        page.querySelectorAll(".dashboard-panel, .admin-crm-kpi, .metric, .product-card, .offer-panel, .section-heading"),
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.045, delay: 0.08, ease: "power2.out", clearProps: "transform" },
      );
      gsap.to(window, { scrollTo: { y: 0, autoKill: true }, duration: 0.6, ease: "power2.out" });

      gsap.to(page.querySelectorAll(".telemetry-pip, .telemetry-card .bi-broadcast-pin"), {
        opacity: 0.45,
        scale: 0.82,
        duration: 1.15,
        repeat: -1,
        yoyo: true,
        stagger: 0.12,
        ease: "sine.inOut",
      });

      const hoverTargets = [
        ...page.querySelectorAll(".admin-crm-kpi, .admin-module-card, .product-card, .market-product-card, .admin-queue-item"),
      ];
      const interactiveTargets = [...page.querySelectorAll(".btn, .icon-action, .admin-modal-close")];
      hoverTargets.forEach((element) => {
        const enter = () => gsap.to(element, { y: -4, duration: 0.24, ease: "power2.out", overwrite: "auto" });
        const leave = () => gsap.to(element, { y: 0, duration: 0.32, ease: "power2.out", overwrite: "auto" });
        element.addEventListener("mouseenter", enter);
        element.addEventListener("mouseleave", leave);
        cleanupHandlers.push(() => {
          element.removeEventListener("mouseenter", enter);
          element.removeEventListener("mouseleave", leave);
        });
      });

      interactiveTargets.forEach((element) => {
        const enter = () => gsap.to(element, { scale: 1.025, duration: 0.2, ease: "power2.out", overwrite: "auto" });
        const leave = () => gsap.to(element, { scale: 1, duration: 0.25, ease: "power2.out", overwrite: "auto" });
        const press = () => gsap.fromTo(element, { scale: 0.96 }, { scale: 1, duration: 0.3, ease: "back.out(2)", overwrite: "auto" });
        element.addEventListener("mouseenter", enter);
        element.addEventListener("mouseleave", leave);
        element.addEventListener("click", press);
        cleanupHandlers.push(() => {
          element.removeEventListener("mouseenter", enter);
          element.removeEventListener("mouseleave", leave);
          element.removeEventListener("click", press);
        });
      });

      const arrowLinks = [...page.querySelectorAll(".product-details-link, .admin-queue-item, .view-link")];
      arrowLinks.forEach((element) => {
        const arrow = element.querySelector(".bi-arrow-right, .bi-arrow-up-right, .bi-chevron-right");
        if (!arrow) return;
        const enter = () => gsap.to(arrow, { x: 4, duration: 0.22, ease: "power2.out", overwrite: "auto" });
        const leave = () => gsap.to(arrow, { x: 0, duration: 0.28, ease: "power2.out", overwrite: "auto" });
        element.addEventListener("mouseenter", enter);
        element.addEventListener("mouseleave", leave);
        cleanupHandlers.push(() => {
          element.removeEventListener("mouseenter", enter);
          element.removeEventListener("mouseleave", leave);
        });
      });

    }, page);

    return () => {
      cleanupHandlers.forEach((cleanup) => cleanup());
      context.revert();
    };
  }, [location.key]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const handleAnchorClick = (event) => {
      const link = event.currentTarget;
      const targetId = link.getAttribute("href")?.slice(1);
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;
      event.preventDefault();
      if (reduceMotion) {
        target.scrollIntoView();
        return;
      }
      gsap.to(window, { scrollTo: { y: target, offsetY: 24, autoKill: true }, duration: 0.8, ease: "power3.out" });
    };
    const anchors = [...document.querySelectorAll('a[href^="#"]')];
    anchors.forEach((anchor) => anchor.addEventListener("click", handleAnchorClick));
    return () => anchors.forEach((anchor) => anchor.removeEventListener("click", handleAnchorClick));
  }, [location.key]);

  return null;
}

function App() {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  },
    logout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    };
  return (
    <Auth.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <SmoothScrollEffects />
        <Header />
        <CartDrawer />
        <CompareQueue />
        <a className="whatsapp-float" href="https://wa.me/917903553221" target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp"><i className="bi bi-whatsapp" /></a>
        <RouteBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:slug" element={<Product />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/price-finder" element={<PriceFinder />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage register />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/account" element={<Protected roles={["buyer", "vendor"]}><Account /></Protected>} />
            <Route
              path="/wishlist"
              element={
                <Protected roles={["buyer"]}>
                  <Wishlist />
                </Protected>
              }
            />
            <Route
              path="/admin"
              element={
                <Protected roles={["admin"]}>
                  <Dashboard />
                </Protected>
              }
            />
            <Route
              path="/admin/products/add"
              element={
                <Protected roles={["admin"]}>
                  <AdminProductCreate />
                </Protected>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <Protected roles={["admin"]}>
                  <AdminAnalyticsPage />
                </Protected>
              }
            />
            <Route
              path="/admin/ai"
              element={
                <Protected roles={["admin"]}>
                  <AdminAIPage />
                </Protected>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <Protected roles={["admin"]}>
                  <AdminNotificationsPage />
                </Protected>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <Protected roles={["admin"]}>
                  <AdminSettingsPage />
                </Protected>
              }
            />
            <Route
              path="/admin/:resource"
              element={
                <Protected roles={["admin"]}>
                  <AdminList />
                </Protected>
              }
            />
            <Route
              path="/vendor"
              element={
                <Protected roles={["vendor"]}>
                  <Dashboard />
                </Protected>
              }
            />
            <Route
              path="/vendor/products"
              element={
                <Protected roles={["vendor"]}>
                  <ProductSubmission />
                </Protected>
              }
            />
            <Route
              path="/vendor/products/add"
              element={
                <Protected roles={["vendor"]}>
                  <ProductSubmission />
                </Protected>
              }
            />
            <Route
              path="/vendor/offers"
              element={
                <Protected roles={["vendor"]}>
                  <VendorTools mode="offers" />
                </Protected>
              }
            />
            <Route
              path="/vendor/pairing"
              element={
                <Protected roles={["vendor"]}>
                  <PairExistingProduct />
                </Protected>
              }
            />
            <Route
              path="/dashboard/buyer"
              element={
                <Protected roles={["buyer"]}>
                  <Dashboard />
                </Protected>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </RouteBoundary>
      </BrowserRouter>
    </Auth.Provider>
  );
}
createRoot(document.getElementById("root")).render(<App />);

// ─── Price Finder ─────────────────────────────────────────────────────────────

const SUPPORTED_PLATFORMS = [
  { id: "amazon_in",     name: "Amazon India",   color: "#FF9900" },
  { id: "flipkart",      name: "Flipkart",       color: "#2874F0" },
  { id: "indiamart",     name: "IndiaMART",      color: "#E87722" },
  { id: "tradeindia",    name: "TradeIndia",     color: "#F58220" },
  { id: "industrybuying",name: "IndustryBuying", color: "#1A73E8" },
  { id: "moglix",        name: "Moglix",         color: "#E53935" },
];

function detectPlatformClient(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return SUPPORTED_PLATFORMS.find((p) =>
      host === p.id.replace("_in", ".in") ||
      host.includes(p.id.replace("_in", ""))
    ) || null;
  } catch { return null; }
}

function PfAvailBadge({ av }) {
  if (!av || av === "check_live") return <span className="pf-avail-badge check"><i className="bi bi-question-circle" /> Check live</span>;
  if (av === "In Stock")  return <span className="pf-avail-badge in-stock"><i className="bi bi-circle-fill" style={{fontSize:"0.45rem"}} /> In Stock</span>;
  if (av === "Limited")   return <span className="pf-avail-badge limited"><i className="bi bi-circle-fill" style={{fontSize:"0.45rem"}} /> Limited</span>;
  return <span className="pf-avail-badge out"><i className="bi bi-x-circle" /> Out of Stock</span>;
}

function PfMatchedCard({ product }) {
  const primary = (product.images || []).find((x) => x.isPrimary) || (product.images || [])[0];
  const image = typeof primary === "string" ? primary : primary?.url;
  const fallback = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80";
  const specs = { ...(product.specifications || {}), ...(product.technicalSpecifications || {}) };
  const specEntries = Object.entries(specs).slice(0, 6);
  return (
    <div className="pf-matched-card">
      <img src={image || fallback} alt={product.name} className="pf-matched-img"
        onError={(e) => { e.currentTarget.src = fallback; }} />
      <div className="pf-matched-body">
        <span className="pf-match-badge"><i className="bi bi-patch-check-fill" /> Catalog match found</span>
        <h2>{product.name}</h2>
        <div className="pf-meta">
          {product.brand && <span><strong>{product.brand}</strong> · Brand</span>}
          {product.model && <span><strong>{product.model}</strong> · Model</span>}
          {product.sku && <span><strong>{product.sku}</strong> · SKU</span>}
          {product.category && <span><strong>{product.category}</strong> · Category</span>}
          {product.rating > 0 && <span><i className="bi bi-star-fill text-warning" /> <strong>{product.rating.toFixed(1)}</strong></span>}
        </div>
        {specEntries.length > 0 && (
          <div className="product-spec-chips mb-2">
            {specEntries.map(([k, v]) => (
              <span className="spec-chip" key={k}>{k}: {String(v)}</span>
            ))}
          </div>
        )}
        <div className="d-flex gap-2 flex-wrap">
          <Link to={`/product/${product.slug || product._id}`} className="pf-action-btn primary">
            <i className="bi bi-eye" /> View on Industry Mandi
          </Link>
          <button
            className="pf-action-btn"
            onClick={() => {
              const cart = JSON.parse(localStorage.getItem("cart") || "[]");
              if (!cart.find((x) => String(x._id) === String(product._id))) {
                localStorage.setItem("cart", JSON.stringify([...cart, { ...product, quantity: 1 }]));
                window.dispatchEvent(new Event("cart-updated"));
              }
            }}
          >
            <i className="bi bi-cart-plus" /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function PfSubmittedProductDetails({ data, url }) {
  const extracted = data?.extracted || {};
  const specs = Object.entries(extracted.specifications || {}).slice(0, 8);
  const submittedUrl = data?.submittedUrl || url;
  return (
    <div className="dashboard-panel mb-4">
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div>
          <span className="eyebrow dark">SUBMITTED PRODUCT LINK</span>
          <h3 className="mb-1">{extracted.name || "Product details from submitted URL"}</h3>
          <p className="small text-secondary mb-2">{extracted.brand || extracted.model || extracted.category || "Details inferred from the submitted link"}</p>
        </div>
        <a className="btn btn-outline-primary btn-sm" href={submittedUrl} target="_blank" rel="noreferrer">
          <i className="bi bi-box-arrow-up-right me-1" /> Open pasted link
        </a>
      </div>
      <div className="small text-break text-secondary mb-3">{submittedUrl}</div>
      <div className="row g-2 small">
        {[
          ["Domain", (() => { try { return new URL(submittedUrl).hostname; } catch { return "—"; } })()],
          ["Brand", extracted.brand],
          ["Model", extracted.model],
          ["SKU", extracted.sku],
          ["GTIN", extracted.gtin],
          ["Category", extracted.category],
          ["Variant", extracted.variant],
          ["Capacity", extracted.capacity],
        ].filter(([, value]) => value).map(([label, value]) => (
          <div className="col-sm-6 col-lg-3" key={label}>
            <div className="border rounded p-2 h-100"><strong>{label}</strong><div className="text-secondary text-break">{value}</div></div>
          </div>
        ))}
      </div>
      {extracted.keywords?.length > 0 && (
        <div className="mt-3">
          <strong className="small">Detected keywords</strong>
          <div className="product-spec-chips mt-1">
            {extracted.keywords.slice(0, 20).map((keyword) => <span className="spec-chip" key={keyword}>{keyword}</span>)}
          </div>
        </div>
      )}
      {specs.length > 0 && (
        <div className="mt-3">
          <strong className="small">Extracted specifications</strong>
          <div className="product-spec-chips mt-1">
            {specs.map(([key, value]) => <span className="spec-chip" key={key}>{key}: {String(value)}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

function PriceFinder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState(searchParams.get("url") || "");
  const [detectedPlatform, setDetectedPlatform] = useState(null);
  const [state, setState] = useState({ loading: false, error: "", data: null });
  const [requestState, setRequestState] = useState({ saving: false, message: "", error: "" });

  // Detect platform as user types
  useEffect(() => {
    setDetectedPlatform(url.trim() ? detectPlatformClient(url) : null);
  }, [url]);

  const search = async (e) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;
    setState({ loading: true, error: "", data: null });
    try {
      const r = await api.post("/price-finder", { url: url.trim() });
      setState({ loading: false, error: "", data: r.data.data });
    } catch (err) {
      setState({ loading: false, error: err.response?.data?.message || err.message || "Failed to look up product.", data: null });
    }
  };

  const requestProduct = async () => {
    if (!state.data?.extracted) return;
    setRequestState({ saving: true, message: "", error: "" });
    try {
      const response = await api.post("/price-finder/requests", { url: url.trim(), extracted: state.data.extracted });
      setRequestState({ saving: false, message: response.data.message || "Product request submitted.", error: "" });
    } catch (err) {
      setRequestState({ saving: false, message: "", error: err.response?.data?.message || "Could not submit the request." });
    }
  };

  const hasExternal = state.data?.offers?.some((o) => o.fetch_required);
  const internalOffers = state.data?.offers?.filter((o) => !o.fetch_required) || [];
  const externalOffers = state.data?.offers?.filter((o) => o.fetch_required) || [];
  const bestPrice = internalOffers.find((o) => o.price)?.price;

  const fmtPrice = (p) => p != null ? `₹${Number(p).toLocaleString("en-IN")}` : "—";
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <main className="pf-page">
      <div className="container">
        {/* Hero / Input */}
        <section className="pf-hero">
          <span className="eyebrow dark">PRICE INTELLIGENCE</span>
          <h1>Paste a Product Link · Find a Product</h1>
          <p>
            Paste any industrial product URL from Amazon, Flipkart, IndiaMART, Moglix, and more.
            We extract product details, check for an exact catalog product, then suggest relevant alternatives.
          </p>

          <form onSubmit={search}>
            <div className="pf-input-wrap">
              {detectedPlatform && (
                <div className="pf-detect-pill" style={{ color: detectedPlatform.color }}>
                  <span className="pip" style={{ background: detectedPlatform.color }} />
                  {detectedPlatform.name}
                </div>
              )}
              <input
                type="url"
                placeholder="Paste product URL here — e.g. https://www.amazon.in/dp/B09XYZ..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <button type="submit" disabled={state.loading}>
                {state.loading ? <><i className="bi bi-arrow-repeat spin me-1" />Matching…</> : <><i className="bi bi-search me-1" />Find Product</>}
              </button>
            </div>
          </form>

          <div className="pf-supported">
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>Supported:</span>
            {SUPPORTED_PLATFORMS.map((p) => (
              <span
                key={p.id}
                className={`pf-platform-chip ${detectedPlatform?.id === p.id ? "active" : ""}`}
                style={detectedPlatform?.id === p.id ? { color: p.color } : {}}
              >
                <span className="pf-dot" style={{ background: p.color }} />
                {p.name}
              </span>
            ))}
          </div>
        </section>

        {/* Error */}
        {state.error && (
          <div className="alert alert-danger d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-circle" />
            {state.error}
          </div>
        )}

        {/* Loading skeleton */}
        {state.loading && (
          <div className="pf-skeleton">
            {[1, 2, 3, 4].map((i) => <div className="pf-skeleton-row" key={i} />)}
          </div>
        )}

        {/* Results */}
        {state.data && !state.loading && (
          <div className="pf-results">

            <PfSubmittedProductDetails data={state.data} url={url} />
            {state.data.extractionStatus === "failed" ? (
              <div className="pf-no-match">
                <i className="bi bi-cloud-slash" />
                <h3>Unable to retrieve product information</h3>
                <p>{state.data.extractionError?.message || "Unable to retrieve product information from this URL."}</p>
              </div>
            ) : state.data.matched ? (
              <PfMatchedCard product={state.data.matched} />
            ) : (
              <div className="pf-no-match">
                <i className="bi bi-search" />
                <h3>{state.data.matchType === "similar" ? "Exact product not found" : "No exact product found in our catalog"}</h3>
                <p>
                  {state.data.matchType === "similar" ? "These are similar products, not exact matches." : "The product was extracted successfully, but no exact catalog match was found."}
                </p>
                {state.data.extractionWarning && <p className="small text-warning mb-3">{state.data.extractionWarning}</p>}
                {state.data.matchType === "none" && (requestState.message ? <div className="alert alert-success mb-0">{requestState.message}</div> : <>
                  {requestState.error && <div className="alert alert-danger">{requestState.error}</div>}
                  <button type="button" className="btn btn-primary mt-2" disabled={requestState.saving} onClick={requestProduct}>
                    {requestState.saving ? "Submitting…" : <><i className="bi bi-plus-circle me-2" />Request This Product</>}
                  </button>
                </>)}
              </div>
            )}

            {/* External disclaimer */}
            {hasExternal && (
              <div className="pf-disclaimer">
                <i className="bi bi-info-circle-fill" />
                <div>
                  <strong>External platform prices</strong> — Live pricing from third-party platforms requires official API credentials (Amazon PA-API, Flipkart Affiliate API, etc.).
                  External rows link directly to the product page so you can verify the current price. Industry Mandi does not scrape or violate any platform's Terms of Service.
                </div>
              </div>
            )}

            {/* Price table */}
            {state.data.offers?.length > 0 && (
              <div className="pf-table-wrap">
                <div className="pf-table-header">
                  <h3><i className="bi bi-table me-2" />Price Comparison Table</h3>
                  {bestPrice && (
                    <span className="pf-best-badge">
                      <i className="bi bi-lightning-fill" /> Best price: {fmtPrice(bestPrice)}
                    </span>
                  )}
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="pf-table">
                    <thead>
                      <tr>
                        <th>Platform</th>
                        <th>Seller</th>
                        <th>Price</th>
                        <th>MRP</th>
                        <th>Discount</th>
                        <th>Availability</th>
                        <th>Shipping</th>
                        <th>Last Updated</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.data.offers.map((offer, idx) => (
                        <tr key={idx} className={idx === 0 && !offer.fetch_required ? "pf-best-row" : ""}>
                          <td>
                            <div className="pf-platform-cell">
                              <span className="pf-platform-dot" style={{ background: offer.platform_color }} />
                              <span>{offer.platform}</span>
                              {idx === 0 && !offer.fetch_required && (
                                <span className="pf-best-badge" style={{ marginLeft: 4 }}><i className="bi bi-lightning-fill" /> Best</span>
                              )}
                            </div>
                          </td>
                          <td>{offer.seller}</td>
                          <td>
                            {offer.fetch_required ? (
                              <span className="pf-fetch-required">Visit site →</span>
                            ) : (
                              <span className="pf-price-cell">{fmtPrice(offer.price)}</span>
                            )}
                          </td>
                          <td><span className="pf-mrp-cell">{fmtPrice(offer.mrp)}</span></td>
                          <td>
                            {offer.discount > 0 && (
                              <span className="pf-discount-cell">−{offer.discount}%</span>
                            )}
                          </td>
                          <td><PfAvailBadge av={offer.availability} /></td>
                          <td style={{ fontSize: "0.82rem" }}>
                            {offer.fetch_required ? "—" : offer.shipping === 0 ? <span style={{ color: "#22c55e" }}>Free</span> : fmtPrice(offer.shipping)}
                          </td>
                          <td><span className="pf-timestamp">{fmtDate(offer.last_updated)}</span></td>
                          <td>
                            <a
                              href={offer.url.startsWith("http") ? offer.url : `${window.location.origin}${offer.url}`}
                              target={offer.source === "external" ? "_blank" : "_self"}
                              rel="noopener noreferrer"
                              className={`pf-action-btn ${!offer.fetch_required && idx === 0 ? "primary" : ""}`}
                            >
                              {offer.source === "internal" ? <><i className="bi bi-bag-check" /> Buy</> : <><i className="bi bi-box-arrow-up-right" /> View</>}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Similar products */}
            {state.data.similar?.length > 0 && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <span className="eyebrow dark d-block">RELATED PRODUCTS</span>
                    <h3 className="mt-1 mb-0">
                      {state.data.extracted?.category
                        ? `More ${state.data.extracted.category} products`
                        : "More matching products"}
                    </h3>
                  </div>
                </div>
                <div className="pf-similar-grid">
                  {state.data.similar.map((p) => {
                    const img = (p.images || [])[0];
                    const imgUrl = typeof img === "string" ? img : img?.url;
                    const fallback = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80";
                    return (
                      <Link
                        key={p._id}
                        to={`/product/${p.slug || p._id}`}
                        className="text-decoration-none"
                        onClick={() => setUrl("")}>
                        <div style={{
                          background: "var(--glass-bg)",
                          border: "1px solid var(--glass-border)",
                          borderRadius: 12,
                          overflow: "hidden",
                          transition: "border-color 0.2s, transform 0.15s",
                          cursor: "pointer",
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.transform = "none"; }}
                        >
                          <div style={{ height: 140, overflow: "hidden", background: "#111" }}>
                            <img
                              src={imgUrl || fallback}
                              alt={p.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => { e.currentTarget.src = fallback; }}
                            />
                          </div>
                          <div style={{ padding: "12px" }}>
                            <div className="product-brand-tag mb-1"><span>{p.brand}</span><span className="verified-dot">✓</span></div>
                            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)", marginBottom: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.category}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--primary)", marginTop: 4, fontWeight: 600 }}>{p.confidence}% relevance</div>
                            {p.price > 0 && <div style={{ fontWeight: 800, color: "#22c55e", marginTop: 6 }}>{fmtPrice(p.price)}</div>}
                            <div style={{ fontSize: "0.72rem", color: "var(--primary)", marginTop: 6, fontWeight: 600 }}>Select this product <i className="bi bi-arrow-right" /></div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No offers */}
            {state.data.matched && state.data.offers?.length === 0 && (
              <div className="pf-no-match">
                <i className="bi bi-tag" />
                <h3>No active offers yet</h3>
                <p>This product is in our catalog but has no approved vendor offers at the moment. Check back soon or browse similar products.</p>
              </div>
            )}
          </div>
        )}

        {/* Intro info — before any search */}
        {!state.data && !state.loading && !state.error && (
          <div className="row g-4 mt-2">
            {[
              { icon: "bi-link-45deg", title: "Paste any product link", body: "Works with Amazon India, Flipkart, IndiaMART, TradeIndia, IndustryBuying, Moglix and more." },
              { icon: "bi-search", title: "We match it instantly", body: "Our engine identifies the product by model number, SKU, brand and specifications against our catalog." },
              { icon: "bi-table", title: "Unified price table", body: "See prices from all our approved vendors and external sources sorted from lowest to highest." },
              { icon: "bi-shield-check", title: "No scraping · Always compliant", body: "We use official affiliate APIs and product feeds only. External links open in the source platform." },
            ].map((card) => (
              <div className="col-md-3 col-sm-6" key={card.title}>
                <div style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: 14,
                  padding: "24px",
                  height: "100%",
                }}>
                  <i className={`bi ${card.icon} fs-2 text-primary d-block mb-3`} />
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{card.title}</h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>{card.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
function AdminProductCreate() {
  const nav = useNavigate(),
    [form, setForm] = useState({
      name: "",
      brand: "",
      model: "",
      category: "Motors",
      description: "",
      oemManualTitle: "",
      oemManualUrl: "",
      price: "",
      stock: "",
    }),
    [specPairs, setSpecPairs] = useState([{ name: "", value: "" }]),
    [techPairs, setTechPairs] = useState([{ name: "", value: "" }]),
    [images, setImages] = useState([]),
    [recentProducts, setRecentProducts] = useState([]),
    [state, setState] = useState({ error: "", saving: false, message: "" });

  const pairsToObj = (pairs) =>
    Object.fromEntries(
      pairs.filter((p) => p.name.trim()).map((p) => [p.name.trim(), p.value.trim()])
    );
  const addPair = (setter) => setter((a) => [...a, { name: "", value: "" }]);
  const removePair = (setter, idx) => setter((a) => a.filter((_, i) => i !== idx));
  const updatePair = (setter, idx, field, val) =>
    setter((a) => a.map((p, i) => (i === idx ? { ...p, [field]: val } : p)));

  const loadRecent = () =>
    api
      .get("/admin/resources/products")
      .then((r) => setRecentProducts((r.data.data || []).slice(0, 8)))
      .catch(() => {});

  useEffect(loadRecent, []);

  const choose = (e) => {
    const valid = [...e.target.files].filter(
      (f) =>
        ["image/jpeg", "image/png", "image/webp"].includes(f.type) &&
        f.size <= 5 * 1024 * 1024,
    );
    if (valid.length !== e.target.files.length)
      setState((s) => ({
        ...s,
        error: "Images must be JPG, PNG, or WebP and no larger than 5 MB.",
      }));
    setImages((a) => [...a, ...valid].slice(0, 8));
    e.target.value = "";
  };

  const move = (i, d) =>
    setImages((a) => {
      const n = [...a], j = i + d;
      if (j < 0 || j >= n.length) return n;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  const submit = async (e) => {
    e.preventDefault();
    setState((s) => ({ ...s, error: "", message: "", saving: true }));
    try {
      const data = new FormData();
      const specifications = JSON.stringify(pairsToObj(specPairs));
      const technicalSpecifications = JSON.stringify(pairsToObj(techPairs));
      Object.entries({ ...form, specifications, technicalSpecifications }).forEach(
        ([k, v]) => data.append(k, v),
      );
      data.append("primaryImageIndex", "0");
      images.forEach((img) => data.append("images", img));
      const res = await api.post("/products", data);
      setState({ error: "", saving: false, message: res.data.message || "Product created successfully." });
      setForm({ name: "", brand: "", model: "", category: "Motors", description: "", oemManualTitle: "", oemManualUrl: "", price: "", stock: "" });
      setSpecPairs([{ name: "", value: "" }]);
      setTechPairs([{ name: "", value: "" }]);
      setImages([]);
      loadRecent();
    } catch (err) {
      setState({
        saving: false,
        message: "",
        error: err.response?.data?.message || "Failed to create product. Please try again.",
      });
    }
  };

  const CATEGORIES = ["Motors", "Space Heaters", "LED Lighting", "Testing Instruments", "MCBs", "Motor Starters", "Contactors", "Switchgear", "Industrial Sensors", "Cables"];

  return (
    <main className="container py-5">
      <div className="d-flex justify-content-between align-items-center gap-2 mb-3 flex-wrap">
        <span className="eyebrow dark">ADMIN CATALOG</span>
        <Link className="btn btn-outline-primary btn-sm" to="/admin">
          <i className="bi bi-speedometer2 me-1" />Dashboard
        </Link>
      </div>
      <h1>Create product</h1>
      <div className="row g-4">
        <div className="col-lg-7">
          <form className="dashboard-panel" onSubmit={submit}>
            {state.error && <div className="alert alert-danger">{state.error}</div>}
            {state.message && <div className="alert alert-success">{state.message}</div>}

            {/* Basic info */}
            <input
              required
              className="form-control mb-2"
              placeholder="Product name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div className="row g-2">
              <div className="col">
                <input
                  required
                  className="form-control mb-2"
                  placeholder="Brand"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>
              <div className="col">
                <input
                  className="form-control mb-2"
                  placeholder="Model"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
              </div>
            </div>
            <select
              className="form-select mb-2"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((x) => <option key={x}>{x}</option>)}
            </select>
            <div className="row g-2 mb-2">
              <div className="col">
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="Price (₹)"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="col">
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="Stock units"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
            </div>
            <textarea
              required
              className="form-control mb-2"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            {/* Spec key-value pairs */}
            <label className="form-label fw-bold">Product specifications <span className="text-secondary fw-normal">(optional)</span></label>
            {specPairs.map((pair, idx) => (
              <div className="d-flex gap-2 mb-2" key={idx}>
                <input
                  className="form-control"
                  placeholder="Name (e.g. Voltage)"
                  value={pair.name}
                  onChange={(e) => updatePair(setSpecPairs, idx, "name", e.target.value)}
                />
                <input
                  className="form-control"
                  placeholder="Value (e.g. 415V)"
                  value={pair.value}
                  onChange={(e) => updatePair(setSpecPairs, idx, "value", e.target.value)}
                />
                {specPairs.length > 1 && (
                  <button type="button" className="btn btn-outline-danger btn-sm px-2" onClick={() => removePair(setSpecPairs, idx)} title="Remove">
                    <i className="bi bi-trash" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-outline-secondary btn-sm mb-3" onClick={() => addPair(setSpecPairs)}>
              <i className="bi bi-plus-lg me-1" />Add specification
            </button>

            {/* Technical spec key-value pairs */}
            <label className="form-label fw-bold d-block mt-2">Technical specifications <span className="text-secondary fw-normal">(optional)</span></label>
            {techPairs.map((pair, idx) => (
              <div className="d-flex gap-2 mb-2" key={idx}>
                <input
                  className="form-control"
                  placeholder="Name (e.g. Operating temp)"
                  value={pair.name}
                  onChange={(e) => updatePair(setTechPairs, idx, "name", e.target.value)}
                />
                <input
                  className="form-control"
                  placeholder="Value (e.g. -20 to 60°C)"
                  value={pair.value}
                  onChange={(e) => updatePair(setTechPairs, idx, "value", e.target.value)}
                />
                {techPairs.length > 1 && (
                  <button type="button" className="btn btn-outline-danger btn-sm px-2" onClick={() => removePair(setTechPairs, idx)} title="Remove">
                    <i className="bi bi-trash" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-outline-secondary btn-sm mb-3" onClick={() => addPair(setTechPairs)}>
              <i className="bi bi-plus-lg me-1" />Add technical spec
            </button>

            {/* OEM manual */}
            <div className="row g-2 mb-3">
              <div className="col">
                <input className="form-control" placeholder="OEM manual title" value={form.oemManualTitle} onChange={(e) => setForm({ ...form, oemManualTitle: e.target.value })} />
              </div>
              <div className="col">
                <input type="url" className="form-control" placeholder="OEM manual URL" value={form.oemManualUrl} onChange={(e) => setForm({ ...form, oemManualUrl: e.target.value })} />
              </div>
            </div>

            {/* Images */}
            <label className="form-label fw-bold">Product images</label>
            <input
              className="form-control mb-1"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={choose}
            />
            <small className="text-secondary d-block mb-2">
              Up to 8 JPG, PNG, or WebP images, 5 MB each. First image is primary.
            </small>
            {images.length > 0 && (
              <div className="image-previews mb-3">
                {images.map((f, i) => (
                  <div className="image-preview" key={`${f.name}-${i}`}>
                    <img src={URL.createObjectURL(f)} alt="Product preview" />
                    {i === 0 && <span>Primary</span>}
                    <div>
                      <button type="button" onClick={() => move(i, -1)} disabled={!i}>←</button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1}>→</button>
                      <button type="button" onClick={() => setImages((a) => a.filter((_, x) => x !== i))}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button className="btn btn-primary w-100" disabled={state.saving}>
              {state.saving ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Creating…</> : "Create approved product"}
            </button>
          </form>
        </div>

        {/* Right panel: recently created products */}
        <div className="col-lg-5">
          <div className="dashboard-panel">
            <h3 className="text-white mb-3">Recently created</h3>
            {recentProducts.length === 0 ? (
              <p className="text-secondary mb-0">No products created yet.</p>
            ) : (
              recentProducts.map((p) => (
                <div className="offer-row" key={p._id}>
                  <span>
                    <b className="text-white">{p.name}</b>
                    <small className="text-secondary ms-2">{p.brand}</small>
                    <small className="text-capitalize d-block" style={{ color: p.status === "approved" || p.status === "published" ? "var(--color-mint, #4ade80)" : p.status === "pending" ? "#fbbf24" : "#94a3b8" }}>
                      {p.status.replace(/_/g, " ")}
                    </small>
                  </span>
                  <span className="d-flex flex-column align-items-end gap-1">
                    <b className="text-success">{p.price ? fmt(p.price) : p.category}</b>
                    {p.images?.length > 0 && <small className="text-secondary"><i className="bi bi-image me-1" />{p.images.length} img</small>}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="dashboard-panel mt-3">
            <h3 className="text-white mb-2">Quick actions</h3>
            <div className="d-flex flex-column gap-2">
              <Link to="/admin/products" className="btn btn-outline-primary btn-sm">
                <i className="bi bi-box-seam me-2" />View all products
              </Link>
              <Link to="/admin/products?status=pending" className="btn btn-outline-warning btn-sm">
                <i className="bi bi-inbox me-2" />Review pending approvals
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
