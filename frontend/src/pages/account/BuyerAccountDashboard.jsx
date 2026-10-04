import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { fmt, getDisplayPrice } from "../../utils/helpers";
import { notifyCartChanged } from "../../utils/events";
import { clearCompareQueue } from "../../utils/compareStorage";
import DashboardShell from "../../components/dashboard/DashboardShell";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ConfirmationModal from "../../components/common/ConfirmationModal";

const buyerAccountSections = [
  ["profile", "Buyer Profile", "bi-person"],
  ["addresses", "My Addresses", "bi-geo-alt"],
  ["orders", "Orders", "bi-box-seam"],
  ["wishlist", "Saved Products", "bi-heart"],
  ["requests", "Product Requests", "bi-send"],
  ["payments", "Payments", "bi-credit-card"],
  ["notifications", "Notifications", "bi-bell"],
  ["security", "Account & Security", "bi-shield-lock"],
];

function BuyerAccountDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSection = searchParams.get("section") || "profile";
  const [activeSection, setActiveSection] = useState(requestedSection);
  const [state, setState] = useState({ loading: true, profile: null, orders: [], wishlist: [], notifications: [], addresses: [], requests: [], preferences: {}, error: "" });

  useEffect(() => {
    if (buyerAccountSections.some(([key]) => key === requestedSection)) setActiveSection(requestedSection);
  }, [requestedSection]);

  useEffect(() => {
    let active = true;
    const loadBuyerAccount = () => {
      Promise.all([api.get("/account"), api.get("/buyer/wishlist"), api.get("/buyer/notifications"), api.get("/buyer/addresses"), api.get("/buyer/product-requests"), api.get("/buyer/notification-preferences")])
        .then(([accountResponse, wishlistResponse, notificationResponse, addressResponse, requestResponse, preferenceResponse]) => {
          if (!active) return;
          const data = accountResponse.data.data || {};
          setState({
            loading: false,
            profile: data.profile || null,
            orders: data.orders || [],
            wishlist: wishlistResponse.data.data || [],
            notifications: notificationResponse.data.data || [],
            addresses: addressResponse.data.data || [],
            requests: requestResponse.data.data || [],
            preferences: preferenceResponse.data.data || {},
            error: "",
          });
        })
        .catch((error) => active && setState((current) => ({
          ...current,
          loading: false,
          error: error.response?.data?.message || error.message || "Unable to load your account.",
        })));
    };
    const refreshOrders = () => {
      api.get("/account")
        .then((response) => {
          if (active) setState((current) => ({ ...current, orders: response.data.data?.orders || [] }));
        })
        .catch(() => {});
    };
    loadBuyerAccount();
    window.addEventListener("focus", refreshOrders);
    const refreshTimer = window.setInterval(refreshOrders, 15000);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshOrders);
      window.clearInterval(refreshTimer);
    };
  }, []);

  const section = buyerAccountSections.find(([key]) => key === activeSection) || buyerAccountSections[0];
  if (state.loading) return <Loading label="Loading your buyer account…" />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => window.location.reload()} />;

  return (
    <DashboardShell role="buyer" activeNav={`/buyer/account?section=${activeSection}`} title="Buyer account">
      <div className="buyer-account-shell">
        <section className="buyer-account-content">
          <div className="buyer-account-heading">
            <div><span className="eyebrow dark">ACCOUNT WORKSPACE</span><h1>{section[1]}</h1><p>Manage your buyer information and marketplace activity in one place.</p></div>
            <span className="db-badge success"><i className="bi bi-shield-check me-1" />Protected</span>
          </div>
          <BuyerAccountSection
            section={activeSection}
            profile={state.profile}
            orders={state.orders}
            wishlist={state.wishlist}
            notifications={state.notifications}
            addresses={state.addresses}
            requests={state.requests}
            preferences={state.preferences}
            onReload={() => window.location.reload()}
          />
        </section>
      </div>
    </DashboardShell>
  );
}

function BuyerAccountSection({ section, profile, orders, wishlist, notifications, addresses, requests, preferences, onReload }) {
  const navigate = useNavigate();
  const content = {
    profile: ["Personal information", "Your name, contact details, and buyer identity will appear here."],
    addresses: ["Saved addresses", "Add, edit, remove, and select a default delivery address."],
    orders: ["Order history", `${orders.length} order${orders.length === 1 ? "" : "s"} available for review.`],
    wishlist: ["Saved products", `${wishlist.length} product${wishlist.length === 1 ? "" : "s"} saved for later.`],
    requests: ["Product requests", "Track requested equipment and availability updates."],
    payments: ["Payments", "Manage masked payment methods and review payment or refund activity."],
    notifications: ["Notifications", `${notifications.length} notification${notifications.length === 1 ? "" : "s"} available.`],
    security: ["Account security", "Update your password, sessions, preferences, and account controls."],
  }[section] || ["Buyer account", "Manage your account from this workspace."];
  const [form, setForm] = useState(profile || {});
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [newAddress, setNewAddress] = useState({ label: "Home", line1: "", city: "", state: "", postalCode: "", country: "India", isDefault: false });
  useEffect(() => setForm(profile || {}), [profile]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true); setFeedback("");
    try {
      const response = await api.patch(section === "profile" ? "/buyer/profile" : "/account", form);
      setFeedback(response.data.message || "Profile saved.");
    } catch (error) {
      setFeedback(error.response?.data?.message || error.message || "Unable to save profile.");
    } finally { setSaving(false); }
  };
  const cancelOrder = async (order) => {
    try { await api.patch(`/account/orders/${order._id}/cancel`); onReload(); }
    catch (error) { setFeedback(error.response?.data?.message || error.message); }
  };
  const removeWishlist = async (product) => {
    try { await api.post(`/buyer/wishlist/${product._id}`); onReload(); }
    catch (error) { setFeedback(error.response?.data?.message || error.message); }
  };
  const cancelRequest = async (request) => {
    try { await api.patch(`/buyer/product-requests/${request._id}/cancel`); onReload(); }
    catch (error) { setFeedback(error.response?.data?.message || error.message); }
  };
  const updatePreferences = async (key, value) => {
    try { await api.patch("/buyer/notification-preferences", { [key]: value }); setFeedback("Notification preference saved."); }
    catch (error) { setFeedback(error.response?.data?.message || error.message); }
  };
  const orderItemsSummary = (order) => (order.items || []).map((item) => `${item.name || item.product?.name || "Product"} × ${item.quantity || 1} · ${fmt((item.price || 0) * (item.quantity || 1))}`).join(" · ");
  const invoice = (order) => {
    const deliveryAddress = [order.shippingAddress?.label, order.shippingAddress?.line1, order.shippingAddress?.line2, [order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.postalCode].filter(Boolean).join(", "), order.shippingAddress?.country].filter(Boolean).join("\n");
    const productDetails = (order.items || []).map((item, index) => {
      const product = typeof item.product === "object" ? item.product : {};
      const quantity = item.quantity || 1;
      return `${index + 1}. ${item.name || product.name || "Product"}\n   Product ID: ${product._id || item.product || "N/A"}\n   Quantity: ${quantity}\n   Unit price: ${fmt(item.price)}\n   Line total: ${fmt((item.price || 0) * quantity)}`;
    }).join("\n\n");
    const blob = new Blob([`Industry Mandi invoice\n========================\nInvoice: ${order.invoiceNumber || "N/A"}\nOrder: ${order.orderNumber || "N/A"}\nDate: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}\nStatus: ${order.status || "Pending"}\n\nPRODUCT DETAILS\n----------------\n${productDetails || "No product details available."}\n\nTOTAL\n-----\nOrder total: ${fmt(order.total)}\n\nDELIVERY ADDRESS\n----------------\n${deliveryAddress || "No delivery address available."}\n\nTracking: ${order.tracking?.carrier || "Not assigned"}${order.tracking?.number ? ` ${order.tracking.number}` : ""}`], { type: "text/plain" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${order.orderNumber || "invoice"}.txt`; link.click(); URL.revokeObjectURL(link.href);
  };
  const openOrderProduct = (order) => {
    const product = order.items?.find((item) => item.product)?.product;
    if (product) navigate(`/product/${product.slug || product._id}`);
  };
  const address = form.businessAddress || {};
  return (
    <div className="buyer-account-panel buyer-account-panel-rich">
      <div className="buyer-account-panel-icon"><i className={`bi ${buyerAccountSections.find(([key]) => key === section)?.[2] || "bi-grid"}`} /></div>
      <div><h2>{content[0]}</h2><p>{content[1]}</p></div>
      {feedback && <div className="alert alert-info buyer-account-feedback">{feedback}</div>}
      {section === "profile" && <form className="buyer-account-form" onSubmit={saveProfile}><input required placeholder="Full name" value={form.name || ""} onChange={(event) => update("name", event.target.value)} /><input disabled placeholder="Email" value={form.email || ""} /><input placeholder="Phone number" value={form.phone || ""} onChange={(event) => update("phone", event.target.value)} /><input type="date" placeholder="Date of birth" value={form.dateOfBirth ? String(form.dateOfBirth).slice(0, 10) : ""} onChange={(event) => update("dateOfBirth", event.target.value)} /><select value={form.gender || ""} onChange={(event) => update("gender", event.target.value)}><option value="">Gender</option><option value="female">Female</option><option value="male">Male</option><option value="non-binary">Non-binary</option><option value="prefer-not-to-say">Prefer not to say</option></select><button className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button></form>}
      {section === "addresses" && <><form className="buyer-account-form" onSubmit={async (event) => { event.preventDefault(); try { await api.post("/buyer/addresses", newAddress); setNewAddress({ label: "Home", line1: "", city: "", state: "", postalCode: "", country: "India", isDefault: false }); onReload(); } catch (error) { setFeedback(error.response?.data?.message || error.message); } }}><input placeholder="Label (Home / Work)" value={newAddress.label} onChange={(event) => setNewAddress({ ...newAddress, label: event.target.value })} /><input required placeholder="Address line 1" value={newAddress.line1} onChange={(event) => setNewAddress({ ...newAddress, line1: event.target.value })} /><input required placeholder="City" value={newAddress.city} onChange={(event) => setNewAddress({ ...newAddress, city: event.target.value })} /><input required placeholder="State" value={newAddress.state} onChange={(event) => setNewAddress({ ...newAddress, state: event.target.value })} /><input required placeholder="Postal code" value={newAddress.postalCode} onChange={(event) => setNewAddress({ ...newAddress, postalCode: event.target.value })} /><label><input type="checkbox" checked={newAddress.isDefault} onChange={(event) => setNewAddress({ ...newAddress, isDefault: event.target.checked })} /> Set as default</label><button className="btn btn-primary">Add address</button></form><div className="buyer-account-list">{addresses.length ? addresses.map((item) => <div className="buyer-account-list-row" key={item._id}><div><strong>{item.label || "Saved address"} {item.isDefault && <span className="db-badge success ms-2">Default</span>}</strong><small>{[item.line1, item.line2, item.city, item.state, item.postalCode].filter(Boolean).join(", ")}</small></div><button className="btn btn-sm btn-outline-danger" onClick={() => setConfirmAction({ title: "Delete address", message: "Are you sure you want to delete this saved address?", confirmText: "Delete address", action: async () => { try { await api.delete(`/buyer/addresses/${item._id}`); onReload(); } catch (error) { setFeedback(error.response?.data?.message || error.message); } } })}>Delete</button></div>) : <div className="buyer-account-placeholder">No saved addresses yet.</div>}</div></>}
      {section === "orders" && <div className="buyer-account-list">{orders.length ? orders.map((order) => <div className="buyer-account-list-row" key={order._id} onClick={() => openOrderProduct(order)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openOrderProduct(order); } }} role={order.items?.some((item) => item.product) ? "link" : undefined} tabIndex={order.items?.some((item) => item.product) ? 0 : undefined} style={order.items?.some((item) => item.product) ? { cursor: "pointer" } : undefined}><div><strong>{order.orderNumber || "Order"}</strong><small>{orderItemsSummary(order)}</small><strong>{fmt(order.total)}</strong></div><span className="db-badge info">{order.status}</span><div className="buyer-account-row-actions" onClick={(event) => event.stopPropagation()}><button className="btn btn-sm btn-outline-primary" onClick={() => invoice(order)}>Invoice</button>{order.status !== "Cancelled" && order.status !== "Delivered" && <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirmAction({ title: "Cancel order", message: `Are you sure you want to cancel ${order.orderNumber || "this order"}?`, confirmText: "Cancel order", action: () => cancelOrder(order) })}>Cancel</button>}</div></div>) : <div className="buyer-account-placeholder">No orders yet.</div>}</div>}
      {section === "wishlist" && <div className="buyer-account-list">{wishlist.length ? wishlist.map((product) => <div className="buyer-account-list-row" key={product._id}><div><strong>{product.name}</strong><small>{product.category || "Saved product"}</small></div><span>{fmt(getDisplayPrice(product))}</span><button className="btn btn-sm btn-outline-danger" onClick={() => removeWishlist(product)}>Remove</button></div>) : <div className="buyer-account-placeholder">No saved products.</div>}</div>}
      {section === "notifications" && <><div className="buyer-account-list">{notifications.length ? notifications.map((notification) => <div className="buyer-account-list-row" key={notification._id}><div><strong>{notification.type || "Account update"}</strong><small>{notification.message}</small></div><small>{new Date(notification.createdAt).toLocaleDateString()}</small></div>) : <div className="buyer-account-placeholder">No notifications.</div>}</div><div className="buyer-account-list">{["orderUpdates", "priceFinder", "promotions", "account"].map((key) => <label className="buyer-account-list-row" key={key}><span>{key === "orderUpdates" ? "Order updates" : key === "priceFinder" ? "Product availability" : key[0].toUpperCase() + key.slice(1)}</span><input type="checkbox" checked={preferences[key] !== false} onChange={(event) => updatePreferences(key, event.target.checked)} /></label>)}</div></>}
      {section === "requests" && <div className="buyer-account-list">{requests.length ? requests.map((request) => <div className="buyer-account-list-row" key={request._id}><div><strong>{request.productName || request.productDetails?.name || "Product request"}</strong><small>{request.status} · {request.productUrl}</small></div>{request.status === "pending" && <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirmAction({ title: "Cancel product request", message: "Are you sure you want to cancel this product request?", confirmText: "Cancel request", action: () => cancelRequest(request) })}>Cancel</button>}</div>) : <div className="buyer-account-placeholder">No product requests yet.</div>}</div>}
      {section === "payments" && <div className="buyer-account-placeholder">No saved payment methods or payment history is available for this buyer account.</div>}
      {section === "security" && <div className="buyer-account-placeholder"><strong>Account security</strong><br />Password changes remain available in the existing account security flow.<br /><button className="btn btn-outline-danger mt-3" onClick={() => setConfirmAction({ title: "Deactivate buyer account", message: "This will deactivate your buyer account. Continue?", confirmText: "Deactivate account", action: async () => { try { await api.post("/buyer/account/deactivate"); localStorage.removeItem("token"); localStorage.removeItem("user"); clearCompareQueue(); window.dispatchEvent(new Event("account-logged-out")); window.location.href = "/"; } catch (error) { setFeedback(error.response?.data?.message || error.message); } } })}>Deactivate account</button></div>}
      <ConfirmationModal
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmText={confirmAction?.confirmText}
        onCancel={() => setConfirmAction(null)}
        onConfirm={async () => { const action = confirmAction?.action; setConfirmAction(null); if (action) await action(); }}
      />
    </div>
  );
}


export default BuyerAccountDashboard;
