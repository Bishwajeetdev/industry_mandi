import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../api/api";
import { fmt } from "../../utils/helpers";
import DashboardShell from "../../components/dashboard/DashboardShell";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ConfirmationModal from "../../components/common/ConfirmationModal";

function AdminVendorRecords() {
  const [params] = useSearchParams();
  const [state, setState] = useState({ loading: true, vendors: [], error: "", notice: "" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => params.get("status") || "all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [confirmReset, setConfirmReset] = useState(null);
  const pageSize = 10;

  const load = () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    api.get("/admin/vendors/records")
      .then((response) => setState((current) => ({ ...current, loading: false, vendors: response.data.data || [] })))
      .catch((error) => setState((current) => ({ ...current, loading: false, error: error.response?.data?.message || error.message })));
  };
  useEffect(() => { load(); }, []);

  const categories = [...new Set(state.vendors.map((vendor) => vendor.profile?.category).filter(Boolean))].sort();
  const filtered = state.vendors.filter((vendor) => {
    const profile = vendor.profile || {};
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [vendor.name, vendor.email, vendor._id, profile.company, profile.phone].some((value) => String(value || "").toLowerCase().includes(query));
    const matchesStatus = statusFilter === "all" || vendor.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || profile.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const setFilter = (setter, value) => { setter(value); setPage(1); };
  const notify = (message) => setState((current) => ({ ...current, notice: message }));

  const updateVendorStatus = async (vendor, status) => {
    try {
      const response = await api.patch(`/admin/vendors/${vendor._id}`, { status });
      setState((current) => ({ ...current, vendors: current.vendors.map((item) => item._id === vendor._id ? { ...item, ...response.data.data } : item) }));
      if (selected?._id === vendor._id) setSelected((current) => ({ ...current, ...response.data.data }));
      notify(response.data.message || "Vendor status updated.");
    } catch (error) { notify(error.response?.data?.message || error.message); }
  };
  const reviewDocument = async (vendor, documentName, status) => {
    try {
      const response = await api.patch(`/admin/vendors/${vendor._id}/documents`, { documentName, status });
      setState((current) => ({ ...current, vendors: current.vendors.map((item) => item._id === vendor._id ? { ...item, ...response.data.data } : item) }));
      setSelected((current) => ({ ...current, ...response.data.data }));
      notify(response.data.message || "Document review saved.");
    } catch (error) { notify(error.response?.data?.message || error.message); }
  };
  const resetPassword = async (vendor) => {
    try {
      const response = await api.post(`/admin/vendors/${vendor._id}/reset-password`);
      notify(`Temporary password: ${response.data.data.temporaryPassword}`);
    } catch (error) { notify(error.response?.data?.message || error.message); }
    finally { setConfirmReset(null); }
  };

  if (state.loading) return <DashboardShell role="admin" activeNav="/admin/vendors" title="Vendor Records"><Loading label="Loading vendor records…" /></DashboardShell>;
  if (state.error) return <DashboardShell role="admin" activeNav="/admin/vendors" title="Vendor Records"><ErrorState message={state.error} onRetry={load} /></DashboardShell>;
  return (
    <DashboardShell role="admin" activeNav="/admin/vendors" title="Vendor Records">
      <ConfirmationModal
        isOpen={Boolean(confirmReset)}
        title="Reset vendor password"
        message={`Reset the password for ${confirmReset?.email || "this vendor"}?`}
        confirmText="Reset password"
        onCancel={() => setConfirmReset(null)}
        onConfirm={() => resetPassword(confirmReset)}
      />
      {state.notice && <div className="alert alert-info d-flex justify-content-between align-items-center"><span>{state.notice}</span><button type="button" className="btn-close" onClick={() => notify("")} /></div>}
      <div className="db-card vendor-records-toolbar">
        <div><h3 className="db-card-title mb-1">Vendor directory</h3><p className="text-secondary mb-0 small">Review profile, store, payment, contact, and verification records.</p></div>
        <div className="vendor-records-filters">
          <input className="db-form-input" placeholder="Search name, ID, email, phone…" value={search} onChange={(e) => setFilter(setSearch, e.target.value)} />
          <select className="db-form-select" value={statusFilter} onChange={(e) => setFilter(setStatusFilter, e.target.value)}><option value="all">All statuses</option><option value="approved">Active</option><option value="suspended">Suspended</option><option value="pending">Pending</option><option value="rejected">Rejected</option></select>
          <select className="db-form-select" value={categoryFilter} onChange={(e) => setFilter(setCategoryFilter, e.target.value)}><option value="all">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
        </div>
      </div>
      <div className="db-card">
        <div className="db-card-header"><h3 className="db-card-title">{filtered.length} Vendor{filtered.length === 1 ? "" : "s"}</h3><button type="button" className="db-btn db-btn-outline db-btn-sm" onClick={load}><i className="bi bi-arrow-clockwise me-1" />Refresh</button></div>
        <div className="db-table-wrap"><table className="db-table vendor-records-table"><thead><tr><th>Vendor / Store</th><th>Category</th><th>Contact</th><th>Status</th><th>Verification</th><th style={{ textAlign: "right" }}>Action</th></tr></thead><tbody>
          {visible.length ? visible.map((vendor) => {
            const profile = vendor.profile || {};
            const documents = profile.documents || [];
            const verification = documents.length && documents.every((document) => document.status === "approved") ? "approved" : documents.some((document) => document.status === "rejected") ? "rejected" : "pending";
            return <tr key={vendor._id}><td><div className="vendor-record-name">{profile.company || vendor.name}</div><small className="db-cell-muted">{vendor.name} · ID {vendor._id.slice(-6)}</small></td><td>{profile.category || "—"}</td><td><div>{vendor.email}</div><small className="db-cell-muted">{profile.phone || "No phone"}</small></td><td><span className={`db-badge ${vendor.status === "approved" ? "success" : vendor.status === "suspended" ? "danger" : "warning"}`}>{vendor.status === "approved" ? "Active" : vendor.status}</span></td><td><span className={`db-badge ${verification === "approved" ? "success" : verification === "rejected" ? "danger" : "warning"}`}>{verification}</span></td><td style={{ textAlign: "right" }}><button type="button" className="db-btn db-btn-outline db-btn-sm" onClick={() => setSelected(vendor)}><i className="bi bi-eye me-1" />View</button></td></tr>;
          }) : <tr><td colSpan={6} className="text-center text-muted py-4">No vendors match the selected filters.</td></tr>}
        </tbody></table></div>
        <div className="vendor-records-pagination"><button type="button" className="db-btn db-btn-outline db-btn-sm" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button type="button" className="db-btn db-btn-outline db-btn-sm" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>Next</button></div>
      </div>
      {selected && <VendorRecordDetails vendor={selected} onClose={() => setSelected(null)} onStatusChange={updateVendorStatus} onDocumentReview={reviewDocument} onResetPassword={(vendor) => setConfirmReset(vendor)} />}
    </DashboardShell>
  );
}

function VendorRecordDetails({ vendor, onClose, onStatusChange, onDocumentReview, onResetPassword }) {
  const profile = vendor.profile || {};
  return <div className="db-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="db-modal vendor-record-details" role="dialog" aria-modal="true">
    <div className="db-modal-header"><div><span className="eyebrow dark">VENDOR RECORD</span><h3 className="db-modal-title">{profile.company || vendor.name}</h3><small className="text-muted">{vendor.email}</small></div><button type="button" className="db-modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button></div>
    <div className="db-modal-body">
      <div className="vendor-record-actionbar"><button type="button" className={`db-btn ${vendor.status === "suspended" ? "db-btn-primary" : "db-btn-danger"} db-btn-sm`} onClick={() => onStatusChange(vendor, vendor.status === "suspended" ? "approved" : "suspended")}>{vendor.status === "suspended" ? "Activate vendor" : "Suspend vendor"}</button><button type="button" className="db-btn db-btn-outline db-btn-sm" onClick={() => onResetPassword(vendor)}><i className="bi bi-key me-1" />Reset password</button></div>
      <RecordSection title="Vendor profile & store settings"><RecordGrid values={[["Owner", profile.ownerName || vendor.name], ["Category", profile.category], ["GSTIN", profile.gstNumber], ["Website", profile.website], ["Store slug", profile.slug], ["Store status", profile.storeStatus], ["Business hours", Object.values(profile.businessHours || {}).filter(Boolean).join(" · ") || "Not set"], ["Description", profile.description]]} /></RecordSection>
      <RecordSection title="Contact & multiple addresses"><RecordGrid values={[["Phone", profile.phone], ["Business address", formatAddress(profile.businessAddress)], ["Billing address", formatAddress(profile.billingAddress)], ["Shipping address", formatAddress(profile.shippingAddress)], ["Warehouse", formatAddress(profile.warehouseAddresses?.[0])]]} /></RecordSection>
      <RecordSection title="Payment & bank details"><RecordGrid values={[["Account holder", profile.bankAccount?.accountName], ["Bank", profile.bankAccount?.bankName], ["IFSC", profile.bankAccount?.ifsc], ["Account number", profile.bankAccount?.accountNumberMasked || "Masked"], ["Payout preference", profile.payoutPreference]]} /></RecordSection>
      <RecordSection title="Vendor verification"><div className="vendor-document-list">{(profile.documents || []).length ? profile.documents.map((document) => <div className="vendor-document-row" key={document.name}><div><strong>{document.name}</strong><span className={`db-badge ${document.status === "approved" ? "success" : document.status === "rejected" ? "danger" : "warning"}`}>{document.status}</span></div><div className="d-flex gap-2 align-items-center"><a href={document.url} target="_blank" rel="noreferrer" className="db-btn db-btn-outline db-btn-sm"><i className="bi bi-box-arrow-up-right me-1" />Preview</a>{document.status !== "approved" && <button type="button" className="db-btn db-btn-primary db-btn-sm" onClick={() => onDocumentReview(vendor, document.name, "approved")}>Approve</button>}{document.status !== "rejected" && <button type="button" className="db-btn db-btn-danger db-btn-sm" onClick={() => onDocumentReview(vendor, document.name, "rejected")}>Reject</button>}</div></div>) : <p className="text-muted mb-0">No verification documents submitted.</p>}</div></RecordSection>
    </div>
  </div></div>;
}

function RecordSection({ title, children }) { return <section className="vendor-record-section"><h4>{title}</h4>{children}</section>; }
function RecordGrid({ values }) { return <div className="vendor-record-grid">{values.map(([label, value]) => <div key={label}><small>{label}</small><strong>{value || "Not provided"}</strong></div>)}</div>; }
function formatAddress(address) { return address ? [address.line1, address.line2, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(", ") : ""; }


export default AdminVendorRecords;
