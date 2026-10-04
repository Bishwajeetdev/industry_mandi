import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { fmt, getDisplayPrice } from "../utils/helpers";
import { notifyCartChanged } from "../utils/events";
import Loading from "../components/common/Loading";
import ErrorState from "../components/common/ErrorState";

function CartPage() {
  const { user, login, logout } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem("cart") || "[]"));
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: "Home", line1: "", line2: "", city: "", state: "", postalCode: "", country: "India" });
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [message, setMessage] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user?.role !== "buyer") {
      setAddresses([]);
      setSelectedAddressId("");
      return;
    }
    let active = true;
    setAddressLoading(true);
    setAddressError("");
    api.get("/buyer/addresses")
      .then((response) => {
        if (!active) return;
        const saved = response.data.data || [];
        setAddresses(saved);
        setSelectedAddressId((current) => current && saved.some((address) => String(address._id) === current)
          ? current
          : String(saved.find((address) => address.isDefault)?._id || saved[0]?._id || ""));
        setShowAddressForm(saved.length === 0);
      })
      .catch((error) => {
        if (active) setAddressError(error.response?.data?.message || error.message || "Unable to load saved addresses.");
      })
      .finally(() => { if (active) setAddressLoading(false); });
    return () => { active = false; };
  }, [user?.role]);

  const saveAddress = async (event) => {
    event.preventDefault();
    setAddressSaving(true);
    setAddressError("");
    try {
      const response = await api.post("/buyer/addresses", { ...addressForm, isDefault: addresses.length === 0 });
      const saved = response.data.data || [];
      setAddresses(saved);
      setSelectedAddressId(String(saved[saved.length - 1]?._id || ""));
      setAddressForm({ label: "Home", line1: "", line2: "", city: "", state: "", postalCode: "", country: "India" });
      setShowAddressForm(false);
    } catch (error) {
      setAddressError(error.response?.data?.message || error.message || "Unable to save this address.");
    } finally {
      setAddressSaving(false);
    }
  };

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
    setOrderPlaced(false);
    try {
      const payload = items.map((item) => ({
        product: item._id || item.product,
        slug: item.slug || item._id,
        sku: item.sku,
        name: item.name,
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      }));
      const response = await api.post("/orders", { items: payload, addressId: selectedAddressId });
      const numbers = (response.data?.data?.orders || []).map((order) => order.orderNumber).join(", ");
      localStorage.removeItem("cart");
      setItems([]);
      notifyCartChanged();
      setMessage(`Order placed successfully${numbers ? `: ${numbers}` : "! Direct OEM allocation confirmed."}`);
      setOrderPlaced(true);
      setShowAuthModal(false);
    } catch (e) {
      setOrderPlaced(false);
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
    if (!selectedAddressId) {
      setAddressError("Select or add a delivery address before placing your order.");
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
      {message && <div className={`alert ${orderPlaced ? "alert-success" : "alert-info"} mt-3 d-flex align-items-center justify-content-between gap-3 flex-wrap`}>
        <span>{message}</span>
        {orderPlaced && <Link to="/buyer/account?section=orders" className="btn btn-sm btn-outline-success">Track your orders <i className="bi bi-arrow-right ms-1" /></Link>}
      </div>}
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
              <section className="cart-address-section" aria-labelledby="cart-delivery-title">
                <div className="cart-address-heading">
                  <h2 id="cart-delivery-title">Delivery address</h2>
                  {user?.role === "buyer" && !showAddressForm && <button type="button" className="cart-address-add" onClick={() => { setAddressError(""); setShowAddressForm(true); }}>+ Add address</button>}
                </div>
                {user?.role !== "buyer" ? (
                  <p className="cart-address-note">Sign in as a buyer to choose a delivery address.</p>
                ) : addressLoading ? (
                  <p className="cart-address-note">Loading saved addresses…</p>
                ) : (
                  <>
                    {addresses.length > 0 && <div className="cart-address-list">
                      {addresses.map((address) => (
                        <label className={`cart-address-option ${selectedAddressId === String(address._id) ? "selected" : ""}`} key={address._id}>
                          <input type="radio" name="deliveryAddress" value={address._id} checked={selectedAddressId === String(address._id)} onChange={() => { setSelectedAddressId(String(address._id)); setAddressError(""); }} />
                          <span><strong>{address.label || "Delivery address"}{address.isDefault && <small>Default</small>}</strong><span>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</span><span>{address.city}, {address.state} {address.postalCode}</span><span>{address.country || "India"}</span></span>
                        </label>
                      ))}
                    </div>}
                    {showAddressForm && <form className="cart-address-form" onSubmit={saveAddress}>
                      <label>Address label<input className="form-control" value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} placeholder="Home, Office" /></label>
                      <label>Address line 1<input className="form-control" required value={addressForm.line1} onChange={(event) => setAddressForm({ ...addressForm, line1: event.target.value })} autoComplete="address-line1" /></label>
                      <label>Address line 2<input className="form-control" value={addressForm.line2} onChange={(event) => setAddressForm({ ...addressForm, line2: event.target.value })} autoComplete="address-line2" /></label>
                      <div className="cart-address-form-grid">
                        <label>City<input className="form-control" required value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} autoComplete="address-level2" /></label>
                        <label>State<input className="form-control" required value={addressForm.state} onChange={(event) => setAddressForm({ ...addressForm, state: event.target.value })} autoComplete="address-level1" /></label>
                        <label>Postal code<input className="form-control" required value={addressForm.postalCode} onChange={(event) => setAddressForm({ ...addressForm, postalCode: event.target.value })} autoComplete="postal-code" /></label>
                        <label>Country<input className="form-control" required value={addressForm.country} onChange={(event) => setAddressForm({ ...addressForm, country: event.target.value })} autoComplete="country-name" /></label>
                      </div>
                      <div className="cart-address-form-actions">
                        {addresses.length > 0 && <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowAddressForm(false)}>Cancel</button>}
                        <button type="submit" className="btn btn-primary btn-sm" disabled={addressSaving}>{addressSaving ? "Saving…" : "Save address"}</button>
                      </div>
                    </form>}
                    {addresses.length === 0 && !showAddressForm && <p className="cart-address-note">Add a delivery address to continue.</p>}
                  </>
                )}
                {addressError && <p className="cart-address-error" role="alert">{addressError}</p>}
              </section>
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
              <button className="btn btn-primary w-100 mt-3" disabled={checkingOut || addressLoading || (user?.role === "buyer" && !selectedAddressId)} onClick={checkout}>
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

export default CartPage;
