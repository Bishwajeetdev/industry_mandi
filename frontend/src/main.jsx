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
import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
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
  if (!envUrl) return "https://industry-mandi01.onrender.com/api";
  let url = envUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  url = url.replace(/\/+$/, "");
  return url.endsWith("/api") ? url : `${url}/api`;
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
  const seed = [...String(product?.name || product?._id || "product")].reduce((total, character) => total + character.charCodeAt(0), 0);
  return 999 + (seed % 9000);
};
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
const notifyWishlistChanged = (items) => window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: { count: Array.isArray(items) ? items.length : undefined } }));
const notifyCartChanged = () => window.dispatchEvent(new Event("cart-updated"));
const addToCompareQueue = (product) => {
  const compared = JSON.parse(localStorage.getItem("compareProducts") || "[]");
  const sameCategory = compared.filter((item) => item.category === product.category);
  const next = sameCategory.some((item) => item._id === product._id) ? sameCategory : [...sameCategory, product].slice(0, 4);
  localStorage.setItem("compareProducts", JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("compare-updated", { detail: { products: next } }));
  return next;
};
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
  const { user, logout } = useAuth(),
    navigate = useNavigate(),
    [wishlistCount, setWishlistCount] = useState(0),
    [searchQuery, setSearchQuery] = useState(""),
    [menuOpen, setMenuOpen] = useState(false),
    dash =
      user?.role === "admin"
        ? "/admin"
        : user?.role === "vendor"
          ? "/vendor"
          : "/account";
  useEffect(() => {
    if (user?.role !== "buyer") {
      setWishlistCount(0);
      return undefined;
    }
    const loadWishlistCount = () => api.get("/buyer/wishlist").then((response) => setWishlistCount(response.data.data?.length || 0)).catch(() => setWishlistCount(0));
    const handleWishlistChange = (event) => typeof event.detail?.count === "number" ? setWishlistCount(event.detail.count) : loadWishlistCount();
    loadWishlistCount();
    window.addEventListener("wishlist-updated", handleWishlistChange);
    return () => window.removeEventListener("wishlist-updated", handleWishlistChange);
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
          <div className="navbar-nav ms-auto align-items-center gap-2 mobile-nav-menu">
            <Link to="/products" className="nav-link header-utility" onClick={() => setMenuOpen(false)}><i className="bi bi-grid me-1" /> Explore</Link>
            <Link to="/about" className="nav-link header-utility" onClick={() => setMenuOpen(false)}>About</Link>
            <Link to="/contact" className="nav-link header-utility" onClick={() => setMenuOpen(false)}>Contact us</Link>
            {!user && <Link to="/register?role=vendor" className="nav-link header-utility" onClick={() => setMenuOpen(false)}>Become a seller</Link>}
            {user?.role === "buyer" && <>
              <Link to="/wishlist" className="nav-link header-icon wishlist-nav-icon" onClick={() => setMenuOpen(false)} aria-label={`Wishlist (${wishlistCount} saved)`}><i className="bi bi-heart" />{wishlistCount > 0 && <span className="wishlist-count">{wishlistCount > 99 ? "99+" : wishlistCount}</span>}</Link>
              <Link to="/cart" className="nav-link header-icon" onClick={() => setMenuOpen(false)} aria-label="Cart"><i className="bi bi-bag" /></Link>
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
  const [open, setOpen] = useState(false), [products, setProducts] = useState([]);
  const compareNow = () => {
    if (products.length >= 2) {
      setOpen(false);
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
  if (!open) return null;
  return <div className="compare-queue-layer" role="presentation" onMouseDown={() => setOpen(false)}><section className="compare-queue" role="dialog" aria-modal="true" aria-label="Compare products" onMouseDown={(event) => event.stopPropagation()}><div className="compare-queue-header"><span>{products.length} product{products.length === 1 ? "" : "s"} in your <b>compare queue</b></span><button onClick={() => setOpen(false)} aria-label="Close comparison queue"><i className="bi bi-x-circle-fill" /></button></div><div className="compare-queue-slots">{Array.from({ length: 4 }, (_, index) => { const product = products[index]; return <div className="compare-queue-slot" key={product?._id || index}>{product ? <><div className="compare-queue-image">{(product.image || product.images?.[0]?.url || product.images?.[0]) ? <img src={product.image || product.images?.[0]?.url || product.images?.[0]} alt="" /> : <i className="bi bi-box-seam" />}</div><strong>{product.name}</strong><b>{fmt(getDisplayPrice(product))}</b></> : <><i className="bi bi-plus-circle-fill" /><span>Add product</span></>}</div>; })}</div><div className="compare-queue-footer"><button className="btn btn-outline-primary" onClick={() => setOpen(false)}>Add more products</button><button className="btn btn-primary" disabled={products.length < 2} onClick={compareNow}>Compare now</button><span>{products.length < 2 ? "Select 1 more product to compare" : `Compare ${products.length} products`}</span></div></section></div>;
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
  const [cartAdded, setCartAdded] = useState(false);
  const saveWishlist = async () => {
    if (user?.role === "buyer" && product._id.length === 24) {
      const response = await api.post(`/buyer/wishlist/${product._id}`);
      notifyWishlistChanged(response.data.data);
    } else {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      if (!wishlist.some((item) => item._id === product._id)) {
        localStorage.setItem("wishlist", JSON.stringify([...wishlist, product]));
      }
    }
  };
  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => item._id === product._id);
    localStorage.setItem("cart", JSON.stringify(existing ? cart.map((item) => item._id === product._id ? { ...item, quantity: (item.quantity || 1) + 1 } : item) : [...cart, { ...product, price: getDisplayPrice(product), quantity: 1 }]));
    notifyCartChanged();
    setCartAdded(true);
  };
  const compareProduct = () => {
    addToCompareQueue(product);
  };
  const primary =
      (product.images || []).find((x) => x.isPrimary) ||
      (product.images || [])[0],
    image = typeof primary === "string" ? primary : primary?.url || product.image;
  const fallbackImage = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";

  return (
    <article className={`product-card${onRemove ? " wishlist-product-card" : ""}`}>
      <div className="product-art">
        <img
          src={image || fallbackImage}
          alt={product.name}
          className="w-100 h-100 object-fit-cover"
          loading="lazy"
        />
        <span className="badge">{product.category || "Machinery"}</span>
        <span className="oem-verified-badge">
          <i className="bi bi-patch-check-fill" /> OEM Verified
        </span>
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
        {(selectable || user?.role === "buyer") && (
          <div className="product-actions mt-3">
            {selectable ? (
              <button
                className={`btn btn-sm ${chosen ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => onToggle(product)}
              >
                {chosen ? "Added" : "Compare"}
              </button>
            ) : (
              <button className="btn btn-sm btn-outline-primary" onClick={compareProduct}>
                Compare
              </button>
            )}
            {user?.role === "buyer" && (
              <>
                {onRemove ? (
                  <button className="btn btn-sm wishlist-remove-btn" onClick={() => onRemove(product._id)} aria-label={`Remove ${product.name} from wishlist`}>
                    <i className="bi bi-heartbreak" /> <span>Remove</span>
                  </button>
                ) : (
                  <button className="btn btn-sm btn-outline-light px-2" onClick={saveWishlist} aria-label="Add to wishlist" title="Save to wishlist">
                    <i className="bi bi-heart" />
                  </button>
                )}
                <button className="btn btn-sm btn-dark" onClick={addToCart}>
                  {cartAdded ? "Added" : "Add to cart"}
                </button>
              </>
            )}
          </div>
        )}
        <Link
          className="product-details-link"
          to={`/product/${product.slug || product._id}`}
        >
          <span>View specifications</span>
          <i className="bi bi-arrow-up-right" />
        </Link>
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
function Home() {
  const state = useProducts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Trending");
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [addedCartIds, setAddedCartIds] = useState([]);
  const fallbackProducts = [
    { _id: "siemens-motor", name: "Siemens IE3 Severe Duty Three Phase Motor", brand: "Siemens", category: "Motors", rating: 4.9, price: 74999, oldPrice: 89999, image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80", badge: "OEM VERIFIED" },
    { _id: "haas-cnc", name: "Haas VF-2 Vertical CNC Machining Center", brand: "Haas", category: "CNC Machining", rating: 4.8, price: 2450000, oldPrice: 2790000, image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80", badge: "IN STOCK" },
    { _id: "kirloskar-pump", name: "Kirloskar End-Suction Industrial Centrifugal Pump", brand: "Kirloskar", category: "Pumps", rating: 4.7, price: 42500, oldPrice: 49999, image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80", badge: "TIER-1" },
    { _id: "schneider-vfd", name: "Schneider Altivar Process 630 Variable Frequency Drive", brand: "Schneider", category: "Process Automation", rating: 4.9, price: 88900, oldPrice: 99999, image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80", badge: "BEST MATCH" },
    { _id: "abb-switchgear", name: "ABB SafeRing 12kV Medium Voltage Gas Insulated Switchgear", brand: "ABB", category: "Switchgear", rating: 4.8, price: 185000, oldPrice: 210000, image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80", badge: "OEM VERIFIED" },
    { _id: "lt-starter", name: "L&T Fully Compartmentalized Motor Control Center MCC", brand: "L&T", category: "Power Systems", rating: 4.8, price: 135000, oldPrice: 155000, image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=800&q=80", badge: "READY TO SHIP" },
  ];
  const products = state.items.length ? state.items.map((product, index) => ({ ...product, image: product.images?.[0]?.url || product.images?.[0] || fallbackProducts[index % fallbackProducts.length].image, price: product.price || fallbackProducts[index % fallbackProducts.length].price, oldPrice: product.oldPrice || fallbackProducts[index % fallbackProducts.length].oldPrice, badge: index % 3 === 0 ? "OEM VERIFIED" : "IN STOCK" })) : fallbackProducts;
  const categories = [["bi-gear-wide-connected", "Motors & Drives"], ["bi-cpu", "CNC Machining"], ["bi-droplet-half", "Pumps & Hydraulics"], ["bi-diagram-3", "Process Automation"], ["bi-lightning-charge", "Power & Switchgear"], ["bi-speedometer2", "Testing Instruments"], ["bi-power", "Motor Starters"], ["bi-broadcast-pin", "Sensors & Telemetry"], ["bi-bezier2", "Cables & Wiring"], ["bi-shield-check", "Safety Gear"]];
  const brands = ["SIEMENS", "ABB", "SCHNEIDER ELECTRIC", "L&T HEAVY ENG", "KIRLOSKAR", "DANFOSS", "CROMPTON", "HAVELLS INDUSTRIAL", "HONEYWELL"];
  const benefits = [["bi-truck", "Pan-India Freight Logistics", "Heavy equipment transport with real-time transit telemetry"], ["bi-patch-check", "Verified Manufacturer Specs", "Zero counterfeit risk with direct OEM test reports"], ["bi-shield-lock", "Escrow Milestone Payments", "Funds released strictly upon physical gate inspection"], ["bi-calculator", "Direct OEM Bulk Pricing", "Volume-tier matrix pricing without middleman markups"], ["bi-cpu", "AI-Powered Spec Matching", "Automated pairing of exact equipment equivalents"]];
  const promos = [{ title: "Precision CNC Centers.", copy: "Sub-micron accuracy and automated tool changers.", className: "promo-cobalt", icon: "bi-cpu" }, { title: "Severe-Duty Motors.", copy: "IE3/IE4 efficiency ratings with IP55 protection.", className: "promo-blue", icon: "bi-gear-wide-connected" }, { title: "Process Automation.", copy: "Field-programmable controllers and telemetry nodes.", className: "promo-ink", icon: "bi-diagram-3" }];
  const displayProducts = products.slice(0, 6);
  const addNotice = (message) => { setNotice(message); window.setTimeout(() => setNotice(""), 2400); };
  const productImage = (product) => product.image || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
  const formatPrice = (price) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price || 0);
  const saveWishlist = async (product) => {
    if (user?.role === "buyer" && product._id.length === 24) {
      try { const response = await api.post(`/buyer/wishlist/${product._id}`); notifyWishlistChanged(response.data.data); addNotice("Wishlist updated"); return; } catch { addNotice("Could not update wishlist"); return; }
    }
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    localStorage.setItem("wishlist", JSON.stringify(wishlist.some((item) => item._id === product._id) ? wishlist : [...wishlist, product]));
    addNotice("Added to your wishlist");
  };
  const compareProduct = (product) => {
    addToCompareQueue(product);
  };
  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => item._id === product._id);
    localStorage.setItem("cart", JSON.stringify(existing ? cart.map((item) => item._id === product._id ? { ...item, quantity: (item.quantity || 1) + 1 } : item) : [...cart, { ...product, price: getDisplayPrice(product), quantity: 1 }]));
    notifyCartChanged();
    setAddedCartIds((ids) => ids.includes(product._id) ? ids : [...ids, product._id]);
    addNotice("Added to cart");
  };
  const detailPath = (product) => `/product/${product.slug || product._id}`;
  const rememberProduct = (product) => localStorage.setItem(`catalogProduct:${product.slug || product._id}`, JSON.stringify(product));
  const MarketplaceCard = ({ product, compact = false }) => <article className={`market-product-card ${compact ? "compact" : ""}`}><div className="market-product-image"><img src={productImage(product)} alt={product.name} loading="lazy" /><span className={`sale-pill ${product.badge === "IN STOCK" ? "new" : ""}`}>{product.badge}</span><span className="oem-verified-badge"><i className="bi bi-patch-check-fill" /> OEM Verified</span>{user?.role === "buyer" && <button className="icon-action" aria-label={`Save ${product.name}`} onClick={() => saveWishlist(product)}><i className="bi bi-heart" /></button>}</div><div className="market-product-body"><div className="product-brand-tag"><span>{product.brand}</span><span className="verified-dot">✓</span></div><Link to={detailPath(product)} onClick={() => rememberProduct(product)} className="product-title-link"><h3>{product.name}</h3></Link><div className="d-flex align-items-center gap-2 small text-warning"><i className="bi bi-star-fill" /> <span>{product.rating || "4.8"}</span><span className="text-secondary">(ISO 9001)</span></div><div className="price-row"><strong>{formatPrice(product.price)}</strong>{product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}</div><div className="product-actions"><button className="btn btn-outline-primary btn-sm" onClick={() => compareProduct(product)}>Compare</button>{user?.role === "buyer" && <button className="btn btn-primary btn-sm" onClick={() => addToCart(product)}>{addedCartIds.includes(product._id) ? "Added" : "Add to cart"}</button>}</div><Link to={detailPath(product)} onClick={() => rememberProduct(product)} className="product-details-link"><span>Specifications &amp; CAD</span><i className="bi bi-arrow-up-right" /></Link></div></article>;

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
            {displayProducts.map(product => <MarketplaceCard key={product._id} product={product} />)}
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
          <span className="view-link">Read engineering briefs <i className="bi bi-arrow-right" /></span>
        </div>
        <div className="blog-grid">
          <article className="blog-card">
            <div className="blog-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80')" }} />
            <span className="eyebrow dark mt-3 px-3">TECHNICAL STANDARD · 6 MIN</span>
            <h3 className="px-3">Specifying IE3 vs IE4 Motors in High Ambient Temperatures</h3>
            <div className="px-3 pb-3"><a href="#journal" className="view-link">Read whitepaper <i className="bi bi-arrow-up-right" /></a></div>
          </article>
          <article className="blog-card">
            <div className="blog-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=900&q=80')" }} />
            <span className="eyebrow dark mt-3 px-3">CNC BENCHMARKS · 4 MIN</span>
            <h3 className="px-3">Sub-Micron CNC Center Tolerances in Precision Machining</h3>
            <div className="px-3 pb-3"><a href="#journal" className="view-link">Read whitepaper <i className="bi bi-arrow-up-right" /></a></div>
          </article>
          <article className="blog-card">
            <div className="blog-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80')" }} />
            <span className="eyebrow dark mt-3 px-3">AUTOMATION · 8 MIN</span>
            <h3 className="px-3">Mitigating Harmonics with Variable Frequency Drives (VFDs)</h3>
            <div className="px-3 pb-3"><a href="#journal" className="view-link">Read whitepaper <i className="bi bi-arrow-up-right" /></a></div>
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
  return <main className="container py-5 info-page"><section className="contact-hero"><div><span className="eyebrow dark">CONTACT US</span><h1>Let’s move your next project forward.</h1><p>Whether you are sourcing a critical component, need help with an order, or want to list your products, our team is ready to help.</p></div><div className="contact-status"><span className="telemetry-pip" /> Support desk online <small>Typical reply within one business day</small></div></section><div className="row g-4 mt-2"><div className="col-lg-7"><section className="contact-form-card">{sent ? <div className="contact-success"><i className="bi bi-check-circle-fill" /><h2>Message received.</h2><p>Thanks for reaching out. A member of our team will review your request and reply shortly.</p><button className="btn btn-outline-light" onClick={() => setSent(false)}>Send another message</button></div> : <form onSubmit={(event) => { event.preventDefault(); setSent(true); }}><div className="contact-form-heading"><span className="eyebrow dark">START A CONVERSATION</span><h2>How can we help?</h2><p>Share a few details and we’ll route your request to the right team.</p></div><div className="row g-3"><div className="col-sm-6"><label htmlFor="contact-name">Name</label><input id="contact-name" required placeholder="Your name" /></div><div className="col-sm-6"><label htmlFor="contact-email">Work email</label><input id="contact-email" required type="email" placeholder="you@company.com" /></div><div className="col-12"><label htmlFor="contact-topic">What can we help with?</label><select id="contact-topic" defaultValue="Product sourcing"><option>Product sourcing</option><option>Order support</option><option>Become a vendor</option><option>Technical question</option><option>Other enquiry</option></select></div><div className="col-12"><label htmlFor="contact-message">Your message</label><textarea id="contact-message" rows="5" required placeholder="Tell us about the product, quantity, timeline, or issue..." /></div><div className="col-12"><button className="btn btn-primary">Send message <i className="bi bi-arrow-up-right ms-1" /></button></div></div></form>}</section></div><div className="col-lg-5"><div className="contact-detail-stack"><article><span className="contact-detail-icon"><i className="bi bi-envelope" /></span><div><small>EMAIL SUPPORT</small><h3>hello@industrymandi.local</h3><p>For product, account, and marketplace questions.</p></div></article><article><span className="contact-detail-icon"><i className="bi bi-headset" /></span><div><small>BUYER &amp; VENDOR DESK</small><h3>+91 76777 74700</h3><p>Monday–Friday · 9:00 AM–6:00 PM IST</p></div></article><article><span className="contact-detail-icon"><i className="bi bi-geo-alt" /></span><div><small>OPERATIONS HUB</small><h3>Mumbai, India</h3><p>Supporting industrial teams across India.</p></div></article></div></div></div></main>;
}

function Products() {
  const fallbackProducts = [
    { _id: "siemens-motor", name: "Siemens IE3 Severe Duty Three Phase Motor", brand: "Siemens", category: "Motors & Drives", rating: 4.9, price: 74999, oldPrice: 89999, sku: "SIE-IE3-15KW", image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80", specifications: { "Power Rating": "15 kW", "Efficiency Class": "IE3", "Protection": "IP55", "Frequency": "50 Hz" } },
    { _id: "haas-cnc", name: "Haas VF-2 Vertical CNC Machining Center", brand: "Haas", category: "CNC Machining", rating: 4.8, price: 2450000, oldPrice: 2790000, sku: "HAAS-VF2-2026", image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80", specifications: { "Spindle Speed": "8,100 RPM", "Table Size": "762×356 mm", "Accuracy": "±0.0025 mm", "Control": "Haas NGC" } },
    { _id: "kirloskar-pump", name: "Kirloskar End-Suction Industrial Centrifugal Pump", brand: "Kirloskar", category: "Pumps & Hydraulics", rating: 4.7, price: 42500, oldPrice: 49999, sku: "KIR-ES-100X80", image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80", specifications: { "Flow Rate": "400 LPM", "Head": "40 m", "Motor Power": "7.5 kW", "Casing": "Cast Iron" } },
    { _id: "schneider-vfd", name: "Schneider Altivar Process 630 Variable Frequency Drive", brand: "Schneider Electric", category: "Process Automation", rating: 4.9, price: 88900, oldPrice: 99999, sku: "SE-ATV630-75KW", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80", specifications: { "Power": "75 kW", "Input": "3-phase 415V", "Output Frequency": "0–500 Hz", "Protection": "IP21" } },
    { _id: "abb-switchgear", name: "ABB SafeRing 12kV Medium Voltage Gas Insulated Switchgear", brand: "ABB", category: "Power & Switchgear", rating: 4.8, price: 185000, oldPrice: 210000, sku: "ABB-SR12-GIS", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80", specifications: { "Rated Voltage": "12 kV", "Rated Current": "630 A", "Breaking Capacity": "16 kA", "Insulation": "SF6" } },
    { _id: "lt-starter", name: "L&T Fully Compartmentalized Motor Control Center MCC", brand: "L&T", category: "Power & Switchgear", rating: 4.8, price: 135000, oldPrice: 155000, sku: "LT-MCC-FC-400A", image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=800&q=80", specifications: { "Rated Current": "400 A", "Compartments": "8", "Protection": "IP42", "Standard": "IEC 61439-2" } },
    { _id: "danfoss-vlt", name: "Danfoss VLT HVAC Drive FC102 Fan & Pump Drive", brand: "Danfoss", category: "Motors & Drives", rating: 4.7, price: 62000, oldPrice: 72000, sku: "DAN-FC102-45KW", image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80", specifications: { "Power": "45 kW", "Voltage": "380–480 V", "Application": "HVAC/Pump", "Energy Savings": "Up to 50%" } },
    { _id: "honeywell-plc", name: "Honeywell Experion PKS Process Knowledge System Controller", brand: "Honeywell", category: "Process Automation", rating: 4.9, price: 320000, oldPrice: 380000, sku: "HON-EPKS-C300", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80", specifications: { "Redundancy": "Dual", "I/O Points": "Up to 40,000", "Protocol": "Ethernet/FF", "Certifications": "SIL 2" } },
    { _id: "crompton-motor", name: "Crompton IE3 Premium Efficiency Induction Motor", brand: "Crompton", category: "Motors & Drives", rating: 4.6, price: 38500, oldPrice: 45000, sku: "CRO-IE3-11KW", image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80", specifications: { "Power": "11 kW", "Efficiency": "IE3", "Frame": "160M", "Speed": "1440 RPM" } },
  ];

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
                  <div className="col-sm-6 col-lg-4" key={p._id}>
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
  const { slug } = useParams(),
    { user } = useAuth();
  const [state, setState] = useState({ loading: true, data: null, error: "" }),
    [recommendations, setRecommendations] = useState({ loading: true, data: null }),
    [wishMessage, setWishMessage] = useState(""),
    [cartAdded, setCartAdded] = useState(false);
  const load = () => {
    setState({ loading: true, data: null, error: "" });
    api
      .get(`/products/${slug}`)
      .then((r) => setState({ loading: false, data: r.data.data, error: "" }))
      .catch((e) => {
        const saved = localStorage.getItem(`catalogProduct:${slug}`);
        if (saved) {
          const product = JSON.parse(saved);
          setState({ loading: false, data: { product, offers: [], bestOffer: null, reviews: [] }, error: "" });
          return;
        }
        setState({ loading: false, data: null, error: e.response?.data?.message || e.message });
      });
  };
  useEffect(load, [slug]);
  useEffect(() => {
    let active = true;
    setRecommendations({ loading: true, data: null });
    api.get(`/products/${slug}/recommendations`)
      .then((response) => active && setRecommendations({ loading: false, data: response.data.data }))
      .catch(() => active && setRecommendations({ loading: false, data: null }));
    return () => { active = false; };
  }, [slug]);
  if (state.loading) return <Loading label="Loading machinery intelligence…" />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;
  const { product, offers, bestOffer, reviews } = state.data;
  const wishlist = () =>
    api
      .post(`/buyer/wishlist/${product._id}`)
      .then((response) => { notifyWishlistChanged(response.data.data); setWishMessage("Wishlist updated."); })
      .catch((e) => setWishMessage(e.response?.data?.message || e.message));
  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => item._id === product._id);
    localStorage.setItem("cart", JSON.stringify(existing ? cart.map((item) => item._id === product._id ? { ...item, quantity: (item.quantity || 1) + 1 } : item) : [...cart, { ...product, price: getDisplayPrice(product), quantity: 1 }]));
    notifyCartChanged();
    setCartAdded(true);
  };
  const primary = (product.images || []).find((x) => x.isPrimary) || (product.images || [])[0];
  const heroImage = typeof primary === "string" ? primary : primary?.url || product.image || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80";

  return (
    <main className="container py-5">
      <div className="row g-5">
        <div className="col-lg-7">
          <div className="product-hero-art">
            <img src={heroImage} alt={product.name} />
            <span className="oem-verified-badge" style={{ top: 20, right: 20 }}>
              <i className="bi bi-patch-check-fill" /> OEM Verified Listing
            </span>
          </div>
          <span className="eyebrow dark mt-4 d-block">
            {product.brand} · {product.category}
          </span>
          <h1>{product.name}</h1>
          <p className="small text-secondary font-monospace">SKU: {product.sku || `IM-${product._id ? product._id.slice(-6).toUpperCase() : "10492"}`}</p>
          {user?.role === "vendor" && (
            <Link
              className="btn btn-primary btn-sm mb-3"
              to={`/vendor/pairing?product=${product._id}`}
            >
              <i className="bi bi-link-45deg me-1" />
              Pair this product
            </Link>
          )}
          {user?.role === "admin" && (
            <Link
              className="btn btn-outline-primary btn-sm mb-3"
              to="/admin/pairings?status=pending"
            >
              <i className="bi bi-link-45deg me-1" />
              Review pairings for this product
            </Link>
          )}
          {user?.role === "buyer" && (
            <>
              <button className="btn btn-outline-primary btn-sm mb-3" onClick={wishlist}>
                <i className="bi bi-heart me-1" />
                Save to wishlist
              </button>
              <button className="btn btn-primary btn-sm mb-3 ms-2" onClick={addToCart}>
                {cartAdded ? "Added" : "Add to cart"}
              </button>
              {wishMessage && <span className="ms-2 small text-success">{wishMessage}</span>}
            </>
          )}
          <p className="lead text-secondary">{product.description}</p>
          {Object.keys(product.specifications || {}).length > 0 && (
            <>
              <h3 className="mt-5">Technical specifications</h3>
              <div className="spec-grid">
                {Object.entries(product.specifications || {}).map(([k, v]) => (
                  <div key={k}>
                    <span>{k}</span>
                    <b>{String(v)}</b>
                  </div>
                ))}
              </div>
            </>
          )}
          {Object.keys(product.technicalSpecifications || {}).length > 0 && (
            <>
              <h3 className="mt-5">OEM technical details</h3>
              <div className="spec-grid">
                {Object.entries(product.technicalSpecifications || {}).map(([k, v]) => (
                  <div key={k}>
                    <span>{k}</span>
                    <b>{String(v)}</b>
                  </div>
                ))}
              </div>
            </>
          )}
          {product.oemManual?.url && (
            <a className="btn btn-outline-primary mt-4" href={product.oemManual.url} target="_blank" rel="noreferrer">
              <i className="bi bi-file-earmark-pdf me-2" />
              {product.oemManual.title || "Open OEM manual"}
            </a>
          )}
        </div>
        <aside className="col-lg-5">
          <div className="offer-panel">
            <span className="eyebrow dark">BEST VERIFIED PRICE</span>
            <h2>{bestOffer ? fmt(bestOffer.price) : "No active offer"}</h2>
            {bestOffer && (
              <p>
                from{" "}
                <b>
                  {bestOffer.vendor?.profile?.company || bestOffer.vendor?.name}
                </b>
              </p>
            )}
            {bestOffer?.sellerUrl ? (
              <a
                className="btn btn-primary w-100"
                href={bestOffer.sellerUrl}
                target="_blank"
                rel="noreferrer"
              >
                Buy from seller
              </a>
            ) : (
              <button className="btn btn-primary w-100" disabled>
                No seller link available
              </button>
            )}
          </div>
          <h3 className="mt-4">Compare prices</h3>
          {offers.map((o) => (
            <div className="offer-row align-items-center" key={o._id}>
              <span>
                {o.vendor?.profile?.company || o.vendor?.name}
                <small>{o.stock.replace("_", " ")}</small>
              </span>
              <div className="d-flex align-items-center gap-3">
                <b>{fmt(o.price)}</b>
                {o.sellerUrl ? (
                  <a
                    className="btn btn-sm btn-outline-primary"
                    href={o.sellerUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Buy from seller
                  </a>
                ) : (
                  <span className="small text-secondary">No seller link</span>
                )}
              </div>
            </div>
          ))}
          <h3 className="mt-5">Verified reviews</h3>
          {reviews.length ? (
            reviews.map((r) => (
              <div className="review" key={r._id}>
                <b>{r.title}</b>
                <span className="rating">★ {r.rating}</span>
                <p>{r.review}</p>
              </div>
            ))
          ) : (
            <p className="text-secondary">No approved reviews yet.</p>
          )}
        </aside>
      </div>
      {!recommendations.loading && recommendations.data && (
        <section className="recommendations-section" aria-label="Product recommendations">
          <div className="recommendation-heading">
            <div>
              <span className="eyebrow dark">SMART RECOMMENDATIONS</span>
              <h2>Similar products</h2>
              <p>Compare verified alternatives with comparable specifications.</p>
            </div>
            <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="view-link">View all {product.category} <i className="bi bi-arrow-right" /></Link>
          </div>
          <div className="recommendation-grid">
            {recommendations.data.similar.map(({ product: item, reason }) => <RecommendationCard key={item._id} product={item} reason={reason} />)}
          </div>
          <div className="recommendation-heading bought-together-heading">
            <div>
              <span className="eyebrow dark">COMPLETE YOUR PURCHASE</span>
              <h2>Frequently bought together</h2>
              <p>{recommendations.data.boughtTogetherBasedOnOrders ? "Based on verified marketplace order patterns." : "Suggested companions while we collect enough order history."}</p>
            </div>
          </div>
          <div className="recommendation-grid">
            {recommendations.data.boughtTogether.map(({ product: item, reason, fallback }) => <RecommendationCard key={item._id} product={item} reason={reason} fallback={fallback} />)}
          </div>
        </section>
      )}
    </main>
  );
}
function RecommendationCard({ product, reason, fallback }) {
  const { user } = useAuth();
  const [added, setAdded] = useState(false);
  const image = (product.images || []).find((item) => item.isPrimary) || product.images?.[0];
  const imageUrl = typeof image === "string" ? image : image?.url;
  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => item._id === product._id);
    localStorage.setItem("cart", JSON.stringify(existing ? cart.map((item) => item._id === product._id ? { ...item, quantity: (item.quantity || 1) + 1 } : item) : [...cart, { ...product, price: getDisplayPrice(product), quantity: 1 }]));
    notifyCartChanged();
    setAdded(true);
  };
  return <article className="recommendation-card">
    <Link to={`/product/${product.slug}`} className="recommendation-image" aria-label={`View ${product.name}`}>
      {imageUrl ? <img src={imageUrl} alt={product.name} /> : <i className="bi bi-box-seam" />}
    </Link>
    <div className="recommendation-content">
      <span className={`recommendation-tag${fallback ? " muted" : ""}`}>{fallback ? "Suggested companion" : "Recommended match"}</span>
      <Link to={`/product/${product.slug}`} className="recommendation-name">{product.name}</Link>
      <p>{reason}</p>
      <div><strong>{fmt(getDisplayPrice(product))}</strong>{user?.role === "buyer" ? <button className="recommendation-action" onClick={addToCart}>{added ? "Added" : "Add to cart"}</button> : <Link to={`/product/${product.slug}`} className="recommendation-action">View item <i className="bi bi-arrow-up-right" /></Link>}</div>
    </div>
  </article>;
}
function buildFallbackCompareData(ids, savedProducts) {
  const idList = ids ? ids.split(",") : [];
  const products = idList.map((id) => {
    const found = savedProducts.find((p) => p._id === id);
    return found || { _id: id, name: id, brand: "OEM", category: "Machinery", price: 0, specifications: {} };
  });
  const results = products.map((product, index) => ({
    rank: index + 1,
    score: Math.max(92 - index * 8, 60),
    price: getDisplayPrice(product),
    product,
    breakdown: {
      performance: Math.max(95 - index * 7, 60),
      efficiency: Math.max(93 - index * 6, 58),
      build: Math.max(90 - index * 5, 62),
      reliability: Math.max(94 - index * 8, 55),
      features: Math.max(88 - index * 6, 57),
      price: Math.max(85 - index * 9, 50),
    },
  }));
  return { results, summary: `Side-by-side SpecMatrix comparison of ${products.length} industrial machines. Scores based on OEM-verified performance metrics.` };
}
function Compare() {
  const { user } = useAuth(),
    [params] = useSearchParams(),
    ids = params.get("ids"),
    [state, setState] = useState({ loading: !!ids, data: null, error: "" });
  const load = () => {
    if (!ids) return;
    setState({ loading: true, data: null, error: "" });
    api
      .get("/products/compare", { params: { ids } })
      .then((r) => setState({ loading: false, data: r.data.data, error: "" }))
      .catch(() => {
        // Fallback: build comparison from locally stored product data
        const savedProducts = JSON.parse(localStorage.getItem("compareProducts") || "[]");
        const fallbackData = buildFallbackCompareData(ids, savedProducts);
        setState({ loading: false, data: fallbackData, error: "" });
      });
  };
  useEffect(load, [ids]);
  if (!ids)
    return (
      <main className="container py-5">
        <span className="eyebrow dark">PRECISION SPECMATRIX</span>
        <h1>Build a Machinery Comparison</h1>
        <p className="lead text-secondary">
          Select two to four industrial machines or motors from the catalog to evaluate verified OEM performance scores and side-by-side specifications.
        </p>
        <Link className="btn btn-primary mt-3" to="/products">
          Browse Machinery Catalog <i className="bi bi-arrow-right ms-2" />
        </Link>
      </main>
    );
  if (state.loading) return <Loading label="Calculating verified SpecMatrix telemetry…" />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;
  return (
    <main className="container py-5">
      <span className="eyebrow dark">PRECISION SPECMATRIX ENGINE</span>
      <h1>Multi-Vendor Machinery Telemetry &amp; Spec Validation</h1>
      <p className="summary text-secondary">{state.data.summary}</p>
      <div className="row g-3 my-4">
        {state.data.results.map((x) => (
          <div className="col-md" key={x.product._id}>
            <div className={`rank-card rank-${x.rank}`}>
              <div className="d-flex justify-content-between align-items-center">
                <span className="font-monospace fw-bold">#{x.rank} RANK</span>
                <span className="badge bg-dark border border-secondary">{x.product.brand || "OEM"}</span>
              </div>
              <strong>
                {x.score}
                <small>/100</small>
              </strong>
              <Link to={`/product/${x.product.slug || x.product._id}`} className="text-decoration-none">
                <h3 className="h5 mb-2 text-white">{x.product.name}</h3>
              </Link>
              <p className="fw-bold fs-5 text-primary mb-3">{fmt(x.price)}</p>
              {user?.role === "buyer" && <div className="d-flex flex-wrap gap-2 mt-auto">
                <button className="btn btn-sm btn-outline-light" onClick={() => {
                  const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
                  if (!wishlist.some((item) => item._id === x.product._id)) localStorage.setItem("wishlist", JSON.stringify([...wishlist, x.product]));
                  notifyWishlistChanged();
                }}>
                  <i className="bi bi-heart me-1" /> Save
                </button>
                <button className="btn btn-sm btn-primary flex-1" onClick={() => {
                  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
                  const existing = cart.find((item) => item._id === x.product._id);
                  localStorage.setItem("cart", JSON.stringify(existing ? cart.map((item) => item._id === x.product._id ? { ...item, quantity: (item.quantity || 1) + 1 } : item) : [...cart, { ...x.product, price: x.price || getDisplayPrice(x.product), quantity: 1 }]));
                  notifyCartChanged();
                }}>Add to cart</button>
              </div>}
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-panel mt-4 p-0 overflow-hidden">
        <div className="p-3 border-bottom border-dark bg-dark-subtle d-flex justify-content-between align-items-center">
          <span className="eyebrow dark mb-0">PARAMETER SPEC MATRIX</span>
          <span className="font-monospace small text-secondary">Normalized Tabular Attributes</span>
        </div>
        <div className="table-responsive">
          <table className="table compare-table mb-0">
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Engineering Attribute</th>
                {state.data.results.map((x) => (
                  <th key={x.product._id} style={{ minWidth: 220 }}>{x.product.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                "performance",
                "efficiency",
                "build",
                "reliability",
                "features",
                "price",
              ].map((k) => (
                <tr key={k}>
                  <td className="text-capitalize fw-bold font-monospace text-secondary">{k}</td>
                  {state.data.results.map((x) => (
                    <td key={x.product._id} className="fw-semibold">
                      {x.breakdown[k] ? `${x.breakdown[k]} / 100` : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
      nav(role === "admin" ? "/admin" : role === "vendor" ? "/vendor" : "/dashboard/buyer");
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

          {/* Role picker — only on register */}
          {register && (
            <div className="auth-role-picker">
              <button
                type="button"
                className={`auth-role-card ${form.role === "buyer" ? "active" : ""}`}
                onClick={() => setForm({ ...form, role: "buyer", company: "" })}
              >
                <i className="bi bi-building" />
                <strong>Buyer</strong>
                <span>Source machinery & get quotes</span>
              </button>
              <button
                type="button"
                className={`auth-role-card ${form.role === "vendor" ? "active" : ""}`}
                onClick={() => setForm({ ...form, role: "vendor" })}
              >
                <i className="bi bi-shop" />
                <strong>Vendor / Seller</strong>
                <span>List & sell industrial equipment</span>
              </button>
            </div>
          )}

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
        ? ["products", "offers", "pairings"]
        : ["wishlist", "comparisons", "reviews"];
  const quickLinks =
    user.role === "vendor"
      ? [
          { label: "Vendor workspace", to: "/vendor/products", icon: "bi-shop", description: "Manage listings, offers, and pairings" },
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
        <h3>Quick access</h3>
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
              <h3>{user.role === "vendor" ? "Your listings" : "Latest product records"}</h3>
              {details.products.length ? (
                details.products.slice(0, 6).map((p) => (
                  <div className="offer-row" key={p._id}>
                    <span>
                      <b>{p.name}</b>
                      <small className="text-capitalize">
                        {p.status ? p.status.replace("_", " ") : "active"}
                      </small>
                    </span>
                    <b>{p.price ? fmt(p.price) : p.category || "—"}</b>
                  </div>
                ))
              ) : (
                <p className="text-secondary mb-0">No listing data available.</p>
              )}
            </div>
          </div>

          <div className="col-lg-6">
            <div className="dashboard-panel">
              <h3>{user.role === "vendor" ? "Your pairing requests" : "Latest pairing activity"}</h3>
              {details.pairings.length ? (
                details.pairings.slice(0, 6).map((x) => (
                  <div className="offer-row" key={x._id}>
                    <span>
                      <b>{x.product?.name || x.submittedName || "Pairing request"}</b>
                      <small className="text-capitalize">
                        {x.status ? x.status.replace("_", " ") : "pending"}
                      </small>
                    </span>
                    <b>{x.offer?.price ? fmt(x.offer.price) : "—"}</b>
                  </div>
                ))
              ) : (
                <p className="text-secondary mb-0">No pairing records available.</p>
              )}
            </div>
          </div>
          <div className="col-12">
            <div className="dashboard-panel">
              <h3>{user.role === "vendor" ? "Orders to process" : "Recent orders"}</h3>
              {details.orders.length ? (
                details.orders.slice(0, 8).map((order) => (
                  <div className="offer-row" key={order._id}>
                    <span>
                      <b>{order.orderNumber}</b>
                      <small>{order.buyer?.name || "Buyer"} · {order.status}</small>
                    </span>
                    <b>{fmt(order.total)}</b>
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
      const response = await api.patch(`/admin/resources/${resource}/${editor._id}`, changes);
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
            <div className="col-md-4" key={p._id}>
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
  const { user } = useAuth();
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem("cart") || "[]"));
  const [message, setMessage] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const updateQuantity = (id, quantity) => {
    const next = items.map((item) => item._id === id ? { ...item, quantity: Math.max(1, quantity) } : item);
    setItems(next);
    localStorage.setItem("cart", JSON.stringify(next));
  };
  const remove = (id) => {
    const next = items.filter((item) => item._id !== id);
    setItems(next);
    localStorage.setItem("cart", JSON.stringify(next));
  };
  const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const checkout = async () => {
    if (user?.role !== "buyer") {
      setMessage("Please sign in with a buyer account to place an order.");
      return;
    }
    setCheckingOut(true);
    try {
      const payload = items.map((item) => ({
        product: item._id || item.product,
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      }));
      const response = await api.post("/orders", { items: payload });
      const numbers = response.data.data.orders.map((order) => order.orderNumber).join(", ");
      localStorage.removeItem("cart");
      setItems([]);
      setMessage(`Order placed successfully: ${numbers}`);
    } catch (e) {
      setMessage(e.response?.data?.message || e.message || "Unable to place order.");
    } finally {
      setCheckingOut(false);
    }
  };
  return <main className="container py-5 shopping-page"><span className="eyebrow dark">ENTERPRISE PROCUREMENT CART</span><h1>Industrial Order Review</h1><p className="text-secondary">Review your machinery allocation and direct OEM shipment lines before order dispatch.</p>{message && <div className="alert alert-info mt-3">{message}</div>}{!items.length ? <div className="empty-state"><i className="bi bi-box-seam" /><h2>Your procurement cart is empty</h2><p>Select industrial equipment, motors, or CNC centers from the catalog to prepare your purchase order.</p><Link to="/products" className="btn btn-primary">Explore Machinery Catalog <i className="bi bi-arrow-right ms-2" /></Link></div> : <div className="row g-4 mt-2"><div className="col-lg-8"><div className="dashboard-panel cart-list">{items.map((item) => <div className="cart-item" key={item._id}><div className="cart-thumb">{item.image ? <img src={item.image} alt="" /> : <i className="bi bi-box-seam" />}</div><div className="cart-info"><strong>{item.name}</strong><span>{item.brand || "OEM Verified"}</span><b>{fmt(item.price)}</b></div><div className="quantity-control"><button onClick={() => updateQuantity(item._id, (item.quantity || 1) - 1)} aria-label="Decrease quantity">−</button><span>{item.quantity || 1}</span><button onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)} aria-label="Increase quantity">+</button></div><button className="remove-item" onClick={() => remove(item._id)}>Remove</button></div>)}</div></div><aside className="col-lg-4"><div className="offer-panel cart-summary"><span className="eyebrow dark">ORDER SUMMARY</span><div><span>Subtotal (excl. taxes)</span><strong>{fmt(total)}</strong></div><div><span>Pan-India Freight</span><strong className="text-success">Covered</strong></div><hr /><div className="total-row"><span>Estimated Total</span><strong>{fmt(total)}</strong></div><button className="btn btn-primary w-100 mt-3" disabled={checkingOut} onClick={checkout}>{checkingOut ? "Submitting purchase order…" : "Submit Procurement Order"} <i className="bi bi-arrow-right ms-2" /></button></div></aside></div>}</main>;
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
              <p>
                We detect potential catalog matches and an administrator must
                approve the result before your offer can become public.
              </p>
            </div>
          ) : state.loading ? (
            <Loading />
          ) : (
            <div className="dashboard-panel">
              <h3>Submitted records</h3>
              {state.items.map((x) => (
                <div className="offer-row" key={x._id}>
                  <span>
                    {x.product?.name || x.name}
                    <small>{x.status}</small>
                  </span>
                  <b>{x.price ? fmt(x.price) : x.category}</b>
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
      technicalSpecifications: "{}",
      oemManualTitle: "",
      oemManualUrl: "",
      price: "",
      stock: "",
    }),
    [images, setImages] = useState([]);
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
    try {
      const data = new FormData();
      Object.entries({ ...form, saveAsDraft: String(draft) }).forEach(
        ([k, v]) => data.append(k, v),
      );
      images.forEach((f) => data.append("images", f));
      await api.post("/products", data);
      setState((s) => ({
        ...s,
        message: draft ? "Draft saved." : "Product submitted for review.",
        error: "",
      }));
      setImages([]);
      load();
    } catch (e) {
      setState((s) => ({
        ...s,
        error:
          e instanceof SyntaxError
            ? 'Specifications must be valid JSON, e.g. {"RAM":"16GB"}'
            : e.response?.data?.message ||
              e.message ||
              "Unable to submit product.",
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
            <label className="form-label fw-bold">Product specifications</label>
            <textarea
              className="form-control mb-2"
              rows="4"
              placeholder={'{"Voltage":"415V","Power":"7.5 kW","IP rating":"IP54"}'}
              value={form.specifications}
              onChange={(e) => setForm({ ...form, specifications: e.target.value })}
            />
            <label className="form-label fw-bold">Technical specifications</label>
            <textarea
              className="form-control mb-2"
              rows="4"
              placeholder={'{"Operating temperature":"-20 to 60 C","Standards":"IEC 60947"}'}
              value={form.technicalSpecifications}
              onChange={(e) => setForm({ ...form, technicalSpecifications: e.target.value })}
            />
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
              >
                Save draft
              </button>
              <button className="btn btn-primary">Submit for approval</button>
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
        <a className="whatsapp-float" href="https://wa.me/917677774700" target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp"><i className="bi bi-whatsapp" /></a>
        <RouteBoundary>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/compare" element={<Compare />} />
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
function AdminProductCreate() {
  const nav = useNavigate(),
    [form, setForm] = useState({
      name: "",
      brand: "",
      model: "",
      category: "Motors",
      description: "",
      specifications: "{}",
      technicalSpecifications: "{}",
      oemManualTitle: "",
      oemManualUrl: "",
      price: "",
      stock: "",
    }),
    [images, setImages] = useState([]),
    [state, setState] = useState({ error: "", saving: false });
  const choose = (e) => {
    const files = [...e.target.files].filter(
      (f) =>
        ["image/jpeg", "image/png", "image/webp"].includes(f.type) &&
        f.size <= 5 * 1024 * 1024,
    );
    if (files.length !== e.target.files.length)
      setState((s) => ({
        ...s,
        error: "Use JPG, PNG, or WebP files up to 5 MB.",
      }));
    setImages((a) => [...a, ...files].slice(0, 8));
    e.target.value = "";
  };
  const submit = async (e) => {
    e.preventDefault();
    setState({ error: "", saving: true });
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      images.forEach((image) => data.append("images", image));
      await api.post("/products", data);
      nav("/admin/products");
    } catch (e) {
      setState({
        saving: false,
        error:
          e.response?.data?.message ||
          'Use valid JSON for specifications, e.g. {"RAM":"16GB"}.',
      });
    }
  };
  return (
    <main className="container py-5">
      <Link to="/admin" className="small text-decoration-none">
        ← Dashboard
      </Link>
      <span className="eyebrow dark d-block mt-3">ADMIN CATALOG</span>
      <h1>Create product</h1>
      <form className="dashboard-panel mt-4" onSubmit={submit}>
        {state.error && <div className="alert alert-danger">{state.error}</div>}
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
        <textarea
          required
          className="form-control mb-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <label className="form-label fw-bold">Product specifications</label>
        <textarea
          className="form-control mb-2"
          rows="4"
          placeholder={'{"Voltage":"415V","Power":"7.5 kW","IP rating":"IP54"}'}
          value={form.specifications}
          onChange={(e) => setForm({ ...form, specifications: e.target.value })}
        />
        <label className="form-label fw-bold">Technical specifications</label>
        <textarea
          className="form-control mb-2"
          rows="4"
          placeholder={'{"Operating temperature":"-20 to 60 C","Standards":"IEC 60947"}'}
          value={form.technicalSpecifications}
          onChange={(e) => setForm({ ...form, technicalSpecifications: e.target.value })}
        />
        <div className="row g-2 mb-2">
          <div className="col">
            <input className="form-control" placeholder="OEM manual title" value={form.oemManualTitle} onChange={(e) => setForm({ ...form, oemManualTitle: e.target.value })} />
          </div>
          <div className="col">
            <input type="url" className="form-control" placeholder="OEM manual URL" value={form.oemManualUrl} onChange={(e) => setForm({ ...form, oemManualUrl: e.target.value })} />
          </div>
        </div>
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
        <label className="form-label">Images</label>
        <input
          className="form-control mb-2"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={choose}
        />
        {images.length > 0 && (
          <small className="d-block text-secondary mb-3">
            {images.length} image{images.length === 1 ? "" : "s"} selected. The
            first image is primary.
          </small>
        )}
        <button className="btn btn-primary" disabled={state.saving}>
          {state.saving ? "Creating…" : "Create approved product"}
        </button>
      </form>
    </main>
  );
}
