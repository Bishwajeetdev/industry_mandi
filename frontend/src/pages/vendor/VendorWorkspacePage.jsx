import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/api";
import { fmt } from "../../utils/helpers";
import DashboardShell from "../../components/dashboard/DashboardShell";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";

function VendorWorkspacePage({ section }) {
  const [state, setState] = useState({ loading: true, saving: false, error: "", message: "", profile: null, orders: [] });
  const load = () => {
    api.get("/account")
      .then((response) => setState((current) => ({
        ...current,
        loading: false,
        profile: response.data.data.profile,
        orders: response.data.data.orders || [],
      })))
      .catch((error) => setState((current) => ({
        ...current,
        loading: false,
        error: error.response?.data?.message || error.message,
      })));
  };
  useEffect(() => {
    load();
  }, []);

  const updateProfile = (key, value) => {
    setState((current) => ({ ...current, profile: { ...current.profile, [key]: value } }));
  };
  const save = async (event) => {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: "", message: "" }));
    try {
      const response = await api.patch("/account", state.profile);
      setState((current) => ({ ...current, saving: false, profile: response.data.data, message: response.data.message || "Store details saved." }));
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.response?.data?.message || error.message }));
    }
  };
  const updateOrder = async (id, status) => {
    try {
      await api.patch(`/account/orders/${id}`, { status });
      load();
    } catch (error) {
      setState((current) => ({ ...current, error: error.response?.data?.message || error.message }));
    }
  };
  const cancelOrder = async (id) => {
    try {
      await api.patch(`/account/orders/${id}/cancel`);
      load();
    } catch (error) {
      setState((current) => ({ ...current, error: error.response?.data?.message || error.message }));
    }
  };

  if (state.loading) return <DashboardShell role="vendor" title={section === "orders" ? "Orders" : "Manage Store"}><Loading label="Loading vendor workspace…" /></DashboardShell>;
  if (state.error && !state.profile) return <DashboardShell role="vendor" title={section === "orders" ? "Orders" : "Manage Store"}><ErrorState message={state.error} onRetry={load} /></DashboardShell>;

  const profile = state.profile || {};
  return (
    <DashboardShell
      role="vendor"
      activeNav={section === "orders" ? "/vendor/orders" : "/vendor/store"}
      title={section === "orders" ? "Orders" : "Manage Store"}
    >
      {(state.error || state.message) && <div className={`alert ${state.error ? "alert-danger" : "alert-success"}`}>{state.error || state.message}</div>}
      {section === "orders" ? (
        <div className="vendor-orders-page">
          <div className="vendor-workspace-summary">
            <div><span className="eyebrow dark">VENDOR WORKSPACE</span><h2>Order fulfilment</h2><p>Track incoming procurement orders and keep buyers updated.</p></div>
            <div className="vendor-orders-count"><strong>{state.orders.length}</strong><span>Total orders</span></div>
          </div>
          {state.orders.length ? (
            <div className="vendor-order-list">
              {state.orders.map((order) => (
                <article className="vendor-order-card" key={order._id}>
                  <div className="vendor-order-card-head">
                    <div><span className="vendor-order-number">{order.orderNumber || "Order"}</span><h3>{order.buyer?.name || order.customer?.name || "Buyer procurement order"}</h3></div>
                    <span className="db-badge info">{order.status || "Pending"}</span>
                  </div>
                  <div className="vendor-order-meta">
                    <span><i className="bi bi-calendar3" /> {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Date unavailable"}</span>
                    <span><i className="bi bi-box-seam" /> {order.items?.length || 0} line items</span>
                    <strong>{fmt(order.total)}</strong>
                  </div>
                  <div className="vendor-order-actions">
                    <label htmlFor={`status-${order._id}`}>Update status</label>
                    <select id={`status-${order._id}`} value={order.status || "Pending"} onChange={(event) => updateOrder(order._id, event.target.value)}>
                      {["Pending", "Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    {order.status !== "Cancelled" && <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => cancelOrder(order._id)}>Cancel order</button>}
                  </div>
                </article>
              ))}
            </div>
          ) : <div className="dashboard-panel vendor-empty-state"><i className="bi bi-truck" /><h3>No orders yet</h3><p>Orders assigned to your store will appear here.</p></div>}
        </div>
      ) : (
        <form className="vendor-store-page" onSubmit={save}>
          <div className="vendor-workspace-summary">
            <div><span className="eyebrow dark">VENDOR WORKSPACE</span><h2>Manage your store</h2><p>Keep your business identity and fulfilment contact details up to date.</p></div>
            <i className="bi bi-shop vendor-store-icon" />
          </div>
          <div className="vendor-store-grid">
            <section className="dashboard-panel vendor-workspace-panel"><div className="vendor-section-heading"><i className="bi bi-building" /><div><h3>Business identity</h3><p>Shown to verified buyers across the marketplace.</p></div></div><div className="account-form-grid"><input required placeholder="Business name" value={profile.company || ""} onChange={(event) => updateProfile("company", event.target.value)} /><input placeholder="Owner name" value={profile.ownerName || ""} onChange={(event) => updateProfile("ownerName", event.target.value)} /><input placeholder="GST number" value={profile.gstNumber || ""} onChange={(event) => updateProfile("gstNumber", event.target.value)} /></div></section>
            <section className="dashboard-panel vendor-workspace-panel"><div className="vendor-section-heading"><i className="bi bi-telephone" /><div><h3>Contact details</h3><p>Used for order and support communication.</p></div></div><div className="account-form-grid"><input disabled placeholder="Business email" value={profile.email || ""} /><input placeholder="Business phone" value={profile.phone || ""} onChange={(event) => updateProfile("phone", event.target.value)} /></div></section>
          </div>
          <section className="dashboard-panel vendor-workspace-panel"><div className="vendor-section-heading"><i className="bi bi-geo-alt" /><div><h3>Business address</h3><p>Provide the location used for fulfilment and invoices.</p></div></div><div className="account-form-grid"><input placeholder="Address line 1" value={profile.businessAddress?.line1 || ""} onChange={(event) => updateProfile("businessAddress", { ...profile.businessAddress, line1: event.target.value })} /><input placeholder="Address line 2" value={profile.businessAddress?.line2 || ""} onChange={(event) => updateProfile("businessAddress", { ...profile.businessAddress, line2: event.target.value })} /><input placeholder="City" value={profile.businessAddress?.city || ""} onChange={(event) => updateProfile("businessAddress", { ...profile.businessAddress, city: event.target.value })} /><input placeholder="State" value={profile.businessAddress?.state || ""} onChange={(event) => updateProfile("businessAddress", { ...profile.businessAddress, state: event.target.value })} /><input placeholder="Postal code" value={profile.businessAddress?.postalCode || ""} onChange={(event) => updateProfile("businessAddress", { ...profile.businessAddress, postalCode: event.target.value })} /></div></section>
          <div className="vendor-store-footer"><span><i className="bi bi-shield-check" /> Your store details are only visible to verified buyers.</span><button className="btn btn-primary" disabled={state.saving}>{state.saving ? "Saving…" : "Save store details"}</button></div>
        </form>
      )}
    </DashboardShell>
  );
}


export default VendorWorkspacePage;
