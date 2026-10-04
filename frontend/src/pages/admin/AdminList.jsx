import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { api } from "../../api/api";
import { fmt } from "../../utils/helpers";
import DashboardShell from "../../components/dashboard/DashboardShell";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ConfirmationModal from "../../components/common/ConfirmationModal";

function AdminList() {
  const { resource } = useParams(),
    [params, setParams] = useSearchParams(),
    [state, setState] = useState({ loading: true, items: [], error: "" }),
    [editor, setEditor] = useState(null),
    [productImageFiles, setProductImageFiles] = useState([]),
    [adminImageFiles, setAdminImageFiles] = useState([]),    // { file, preview } for new uploads
    [adminRetained, setAdminRetained] = useState([]),        // existing images to keep
    [adminPrimaryIdx, setAdminPrimaryIdx] = useState(0),
    [notice, setNotice] = useState(""),
    [confirmDelete, setConfirmDelete] = useState(null),
    [filterOpen, setFilterOpen] = useState(false),
    status = params.get("status") || "",
    source = params.get("source") || "",
    search = params.get("q") || "";
  const [orderSearch, setOrderSearch] = useState(search);
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
    setAdminImageFiles([]);
    if (resource === "products") {
      const imgs = (record.images || []).map((img) =>
        typeof img === "string" ? { url: img, publicId: "", isPrimary: false } : img
      );
      setAdminRetained(imgs);
      const pi = imgs.findIndex((img) => img.isPrimary);
      setAdminPrimaryIdx(pi >= 0 ? pi : 0);
    }
    setNotice("");
  };
  const chooseAdminFiles = (e) => {
    const total = adminRetained.length + adminImageFiles.length;
    const remaining = Math.max(0, 8 - total);
    const valid = [...e.target.files]
      .filter((f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 5 * 1024 * 1024)
      .slice(0, remaining);
    const withPreviews = valid.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setAdminImageFiles((prev) => [...prev, ...withPreviews]);
    setProductImageFiles((prev) => [...prev, ...valid]);
    e.target.value = "";
  };
  const removeAdminRetained = (idx) => {
    setAdminRetained((prev) => prev.filter((_, i) => i !== idx));
    setAdminPrimaryIdx((prev) => (prev === idx ? 0 : prev > idx ? prev - 1 : prev));
  };
  const removeAdminNew = (idx) => {
    setAdminImageFiles((prev) => { URL.revokeObjectURL(prev[idx].preview); return prev.filter((_, i) => i !== idx); });
    setProductImageFiles((prev) => prev.filter((_, i) => i !== idx));
  };
  const load = () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    api
      .get(`/admin/resources/${resource}`, search ? { params: { q: search } } : undefined)
      .then((r) =>
        setState({
          loading: false,
          items: Array.isArray(r.data?.data) ? r.data.data : [],
          error: "",
        }),
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
  }, [resource, search]);
  useEffect(() => setOrderSearch(search), [search]);
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
        const retained = adminRetained.map((img, i) => ({ ...img, isPrimary: i === adminPrimaryIdx }));
        data.append("retainedImages", JSON.stringify(retained));
        data.append("primaryImageIndex", String(adminPrimaryIdx));
        productImageFiles.forEach((file) => data.append("images", file));
        response = await api.patch(`/admin/products/${editor._id}`, data);
        adminImageFiles.forEach(({ preview }) => URL.revokeObjectURL(preview));
        setAdminImageFiles([]);
        setProductImageFiles([]);
      } else {
        response = await api.patch(`/admin/resources/${resource}/${editor._id}`, changes);
      }
      setState((s) => ({ ...s, items: s.items.map((item) => item._id === editor._id ? { ...item, ...response.data.data } : item) }));
      setEditor(null);
      setNotice(response.data.message || "Record updated");
    } catch (error) { setNotice(error.response?.data?.message || error.message); }
  };
  const deleteRecord = async (record) => {
    try {
      const response = await api.delete(`/admin/resources/${resource}/${record._id}`);
      setState((s) => ({ ...s, items: s.items.filter((item) => item._id !== record._id) }));
      setNotice(response.data.message || "Record deleted");
    } catch (error) { setNotice(error.response?.data?.message || error.message); }
    finally { setConfirmDelete(null); }
  };
  if (state.loading) return <Loading label={`Loading ${resource}…`} />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;
  const items = state.items.filter((order) => {
    const matchesStatus = !status || order.status === status;
    const matchesSource = source !== "admin" || order.items?.some((item) => item.product?.submittedBy?.role === "admin");
    return matchesStatus && matchesSource;
  });
  const setOrderFilter = (key, value) => {
    const next = { status, source, q: search };
    if (value) next[key] = value;
    else delete next[key];
    setParams(Object.fromEntries(Object.entries(next).filter(([, current]) => current)));
    setFilterOpen(false);
  };
  const title = `${status ? `${status} ` : ""}${resource}`;
    return (
    <DashboardShell
      role="admin"
      activeNav={`/admin/${resource}`}
      title={resource.toUpperCase()}
      actions={
        <div className="d-flex gap-2">
          {resource === "products" && (
            <Link to="/admin/products/add" className="db-btn db-btn-primary db-btn-sm">
              <i className="bi bi-plus-lg me-1" /> Add Product
            </Link>
          )}
          <button type="button" className="db-btn db-btn-outline db-btn-sm" onClick={load}>
            <i className="bi bi-arrow-clockwise me-1" /> Refresh
          </button>
        </div>
      }
    >
      <ConfirmationModal
        isOpen={Boolean(confirmDelete)}
        title="Delete record"
        message={`Delete this ${resource.slice(0, -1)}? This cannot be undone.`}
        confirmText="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => deleteRecord(confirmDelete)}
      />
      {notice && <div className="db-badge info mb-3 d-inline-flex">{notice}</div>}

      {/* Editor Modal */}
      {editor && (
        <div className="db-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setEditor(null); }}>
          <form className="db-modal" onSubmit={saveRecord} role="dialog" aria-modal="true">
            <div className="db-modal-header">
              <h3 className="db-modal-title">Edit {editor.name || editor.product?.name || editor.orderNumber || "Record"}</h3>
              <button type="button" className="db-modal-close" onClick={() => setEditor(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="db-modal-body">
              {/* ── Image manager (products only) ── */}
              {resource === "products" && (
                <>
                  {adminRetained.length > 0 && (
                    <>
                      <p className="pim-section-label">Current images <small style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— hover to delete · click "Primary" to set cover</small></p>
                      <div className="pim-grid">
                        {adminRetained.map((img, idx) => (
                          <div key={img.publicId || img.url || idx} className={`pim-thumb${idx === adminPrimaryIdx ? " is-primary" : ""}`}>
                            <img src={img.url} alt={`Product image ${idx + 1}`} />
                            <div className="pim-thumb-overlay">
                              <button type="button" className="pim-thumb-del" onClick={() => removeAdminRetained(idx)} title="Remove image" aria-label="Remove image">
                                <i className="bi bi-x" />
                              </button>
                            </div>
                            {idx === adminPrimaryIdx
                              ? <span className="pim-primary-badge">Primary</span>
                              : <button type="button" className="pim-set-primary" onClick={() => setAdminPrimaryIdx(idx)}>Set primary</button>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {adminImageFiles.length > 0 && (
                    <>
                      <p className="pim-section-label">New images to upload</p>
                      <div className="pim-new-previews">
                        {adminImageFiles.map(({ preview }, idx) => (
                          <div key={preview} className="pim-new-thumb">
                            <img src={preview} alt={`New image ${idx + 1}`} />
                            <button type="button" className="pim-new-thumb-del" onClick={() => removeAdminNew(idx)} title="Remove" aria-label="Remove new image">
                              <i className="bi bi-x" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {(adminRetained.length + adminImageFiles.length) < 8 && (
                    <label className="pim-upload-zone">
                      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseAdminFiles} />
                      <i className="bi bi-cloud-upload" />
                      <span><strong>Click to upload</strong> or drag images here</span>
                    </label>
                  )}
                  <p className="pim-hint">{adminRetained.length + adminImageFiles.length}/8 images · JPG, PNG, WebP · max 5 MB each</p>
                  <hr className="pim-divider" />
                </>
              )}

              <div className="db-form-row db-form-row-2">
                {resourceFields.map((field) => (
                  <div key={field.key} style={{ gridColumn: field.type === "textarea" ? "span 2" : "span 1" }}>
                    <label className="db-form-label">{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea
                        rows={3}
                        className="db-form-textarea"
                        value={editor[field.key] || ""}
                        onChange={(e) => setEditor({ ...editor, [field.key]: e.target.value })}
                      />
                    ) : field.type === "select" ? (
                      <select
                        className="db-form-select"
                        value={editor[field.key] || field.options[0]}
                        onChange={(e) => setEditor({ ...editor, [field.key]: e.target.value })}
                      >
                        {field.options.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    ) : (
                      <input
                        className="db-form-input"
                        required={["name", "email", "category"].includes(field.key)}
                        type={field.type}
                        value={editor[field.key] ?? ""}
                        onChange={(e) => setEditor({ ...editor, [field.key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
                <div style={{ gridColumn: "span 2" }}>
                  <label className="db-form-label">Status</label>
                  <select
                    className="db-form-select"
                    required
                    value={editor.status || statusOptions[0]}
                    onChange={(e) => setEditor({ ...editor, status: e.target.value })}
                  >
                    {statusOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="db-modal-footer">
              <button type="button" className="db-btn db-btn-outline" onClick={() => setEditor(null)}>
                Discard
              </button>
              <button type="submit" className="db-btn db-btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Table Card */}
      <div className="db-card">
        <div className="db-card-header">
          <h3 className="db-card-title">{items.length} Record{items.length === 1 ? "" : "s"} Available</h3>
          <div className="d-flex gap-2">
            {resource === "orders" ? <div className="position-relative">
              <button type="button" className={`db-btn db-btn-outline db-btn-sm ${status || source ? "active" : ""}`} onClick={() => setFilterOpen((open) => !open)} aria-expanded={filterOpen}>
                <i className="bi bi-sliders me-1" /> Filters{source === "admin" && <span className="ms-1">(Admin catalog)</span>}{status && <span className="ms-1">({status})</span>}
              </button>
              {filterOpen && <div className="db-filter-menu">
                <form onSubmit={(event) => { event.preventDefault(); setOrderFilter("q", orderSearch.trim()); }}>
                  <label className="db-form-label" htmlFor="admin-order-search">Search order ID</label>
                  <div className="d-flex gap-2">
                    <input id="admin-order-search" className="db-form-input" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="ORD-... or Mongo ID" />
                    <button type="submit" className="db-btn db-btn-primary db-btn-sm" title="Search orders"><i className="bi bi-search" /></button>
                  </div>
                </form>
                <label className="db-form-label mt-3" htmlFor="admin-order-status-filter">Order status</label>
                <select id="admin-order-status-filter" className="db-form-select" value={status} onChange={(event) => setOrderFilter("status", event.target.value)}>
                  <option value="">All statuses</option>
                  {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <label className="db-form-label mt-3" htmlFor="admin-order-source-filter">Product source</label>
                <select id="admin-order-source-filter" className="db-form-select" value={source} onChange={(event) => setOrderFilter("source", event.target.value)}>
                  <option value="">All products</option>
                  <option value="admin">Admin catalog</option>
                </select>
                {(status || source || search) && <button type="button" className="db-btn db-btn-outline db-btn-sm mt-2 w-100" onClick={() => { setOrderSearch(""); setParams({}); setFilterOpen(false); }}>Clear filters</button>}
              </div>}
            </div> : <button type="button" className="db-btn db-btn-outline db-btn-sm">
              <i className="bi bi-sliders me-1" /> Filters
            </button>}
            <button type="button" className="db-btn db-btn-outline db-btn-sm">
              <i className="bi bi-download me-1" /> Download all
            </button>
          </div>
        </div>

        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              {resource === "orders" ? (
                <tr><th>Order</th><th>Buyer</th><th>Vendor</th><th>Items</th><th>Total</th><th>Status</th><th>Created</th><th style={{ textAlign: "right" }}>Actions</th></tr>
              ) : (
                <tr>
                  <th>Record Details</th>
                  <th>Role / Category</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Details</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              )}
            </thead>
            <tbody>
              {items.map((x) => resource === "orders" ? (
                <tr key={x._id}>
                  <td><div className="db-cell-bold">{x.orderNumber || `#${x._id.slice(-6).toUpperCase()}`}</div><small className="db-cell-muted">ID: {x._id.slice(-6)}</small></td>
                  <td><div className="db-cell-bold">{x.buyer?.name || "—"}</div><small className="db-cell-muted">{x.buyer?.email || ""}</small></td>
                  <td><div className="db-cell-bold">{x.vendor?.profile?.company || x.vendor?.name || "Platform"}</div><small className="db-cell-muted">{x.vendor?.email || ""}</small></td>
                  <td><div className="admin-order-items">{(x.items || []).length ? x.items.map((line, index) => <div key={`${line.product?._id || line.product || line.name}-${index}`}>{line.quantity || 1} × {line.name || line.product?.name || "Product"}{line.product?.submittedBy?.role === "admin" && <small className="db-badge success ms-1">Admin catalog</small>}</div>) : "—"}</div></td>
                  <td className="db-cell-bold">{fmt(x.total)}</td>
                  <td><span className={`db-badge ${x.status === "Delivered" ? "success" : x.status === "Cancelled" ? "danger" : "warning"}`}>{x.status || "Pending"}</span>{x.returnStatus && x.returnStatus !== "Not requested" && <small className="db-cell-muted d-block mt-1">Return: {x.returnStatus}</small>}</td>
                  <td className="db-cell-muted">{x.createdAt ? new Date(x.createdAt).toLocaleDateString() : "—"}</td>
                  <td style={{ textAlign: "right" }}><div className="d-inline-flex gap-1"><button type="button" className="db-btn db-btn-outline db-btn-sm" onClick={() => openEditor(x)} title="Edit"><i className="bi bi-pencil" /></button><button type="button" className="db-btn db-btn-danger db-btn-sm" onClick={() => setConfirmDelete(x)} title="Delete"><i className="bi bi-trash" /></button></div></td>
                </tr>
              ) : (
                <tr key={x._id}>
                  <td>
                    <div className="db-cell-bold">
                      {x.name || x.product?.name || x.submittedName || x.title || "Offer"}
                    </div>
                    <div className="db-cell-muted">
                      {x.email || x.vendor?.email || x.buyer?.email || x.brand || ""}
                    </div>
                  </td>
                  <td>{x.role || x.category || x.product?.name || "—"}</td>
                  <td>
                    <span className={`db-badge ${
                      x.status === "approved" || x.status === "published"
                        ? "success"
                        : x.status === "pending" || x.status === "draft"
                          ? "warning"
                          : "neutral"
                    }`}>
                      {x.status || "—"}
                    </span>
                  </td>
                  <td className="db-cell-muted">
                    {x.createdAt ? new Date(x.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <small className="db-cell-muted">ID: {x._id.slice(-6)}</small>
                    {x.price && <div className="db-cell-bold">{fmt(x.price)}</div>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="d-inline-flex gap-1">
                      <button
                        type="button"
                        className="db-btn db-btn-outline db-btn-sm"
                        onClick={() => openEditor(x)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        type="button"
                        className="db-btn db-btn-danger db-btn-sm"
                        onClick={() => setConfirmDelete(x)}
                        title="Delete"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={resource === "orders" ? 8 : 6} className="text-center py-4 text-muted">No {resource} found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}


export default AdminList;
