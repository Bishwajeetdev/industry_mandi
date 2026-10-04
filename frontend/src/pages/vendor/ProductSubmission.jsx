import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { fmt } from "../../utils/helpers";
import DashboardShell from "../../components/dashboard/DashboardShell";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";

function ProductSubmission() {
  const [state, setState] = useState({
    items: [],
    loading: true,
    saving: false,
    error: "",
    message: "",
  }),
    [showModal, setShowModal] = useState(false),
    [editingProduct, setEditingProduct] = useState(null),
    [editForm, setEditForm] = useState({}),
    [editImages, setEditImages] = useState([]),        // existing saved images to retain
    [editImageFiles, setEditImageFiles] = useState([]), // { file, preview } new uploads
    [editPrimaryIdx, setEditPrimaryIdx] = useState(0),  // index among retained images
    [searchQuery, setSearchQuery] = useState(""),
    [filterCategory, setFilterCategory] = useState("all"),
    [filterApproval, setFilterApproval] = useState("all"),
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

  const pairsToObj = (pairs) =>
    Object.fromEntries(
      pairs.filter((p) => p.name.trim()).map((p) => [p.name.trim(), p.value.trim()])
    );
  const addPair = (setter) => setter((a) => [...a, { name: "", value: "" }]);
  const removePair = (setter, idx) => setter((a) => a.filter((_, i) => i !== idx));
  const updatePair = (setter, idx, field, val) =>
    setter((a) => a.map((p, i) => (i === idx ? { ...p, [field]: val } : p)));

  const load = () =>
    api
      .get("/vendor/products")
      .then((r) => {
        const products = Array.isArray(r.data) ? r.data : r.data?.data;
        if (!Array.isArray(products)) {
          throw new Error("Unexpected response from the vendor products API.");
        }
        setState((s) => ({
          ...s,
          items: products,
          loading: false,
          error: "",
        }));
      })
      .catch((e) =>
        setState((s) => ({
          ...s,
          error: e.response?.data?.message || e.message,
          loading: false,
        })),
      );

  useEffect(() => {
    load();
  }, []);

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

  const submit = async (e) => {
    e.preventDefault();
    setState((s) => ({ ...s, saving: true, error: "", message: "" }));
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
      const submittedProduct = res.data?.data;
      setFilterApproval("pending");
      setState((s) => ({
        ...s,
        saving: false,
        message: res.data.message || "Product submitted for review.",
        error: "",
        items: submittedProduct
          ? [submittedProduct, ...s.items.filter((item) => item._id !== submittedProduct._id)]
          : s.items,
      }));
      setForm({
        name: "",
        brand: "",
        model: "",
        category: "Motors",
        description: "",
        oemManualTitle: "",
        oemManualUrl: "",
        price: "",
        stock: "",
      });
      setSpecPairs([{ name: "", value: "" }]);
      setTechPairs([{ name: "", value: "" }]);
      setImages([]);
      setShowModal(false);
      if (!submittedProduct) load();
    } catch (e) {
      setState((s) => ({
        ...s,
        saving: false,
        error: e.response?.data?.message || e.message || "Unable to submit product.",
      }));
    }
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name || "",
      brand: product.brand || "",
      model: product.model || "",
      category: product.category || "Motors",
      description: product.description || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
    });
    // Normalise images array — backend stores objects {url, publicId, isPrimary} or strings
    const imgs = (product.images || []).map((img) =>
      typeof img === "string" ? { url: img, publicId: "", isPrimary: false } : img
    );
    setEditImages(imgs);
    setEditImageFiles([]);
    const primaryIdx = imgs.findIndex((img) => img.isPrimary);
    setEditPrimaryIdx(primaryIdx >= 0 ? primaryIdx : 0);
  };

  const chooseEditFiles = (e) => {
    const total = editImages.length + editImageFiles.length;
    const remaining = Math.max(0, 8 - total);
    const valid = [...e.target.files]
      .filter((f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 5 * 1024 * 1024)
      .slice(0, remaining);
    if (valid.length < e.target.files.length)
      setState((s) => ({ ...s, error: "Images must be JPG, PNG, or WebP · max 5 MB each · max 8 total." }));
    const withPreviews = valid.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setEditImageFiles((prev) => [...prev, ...withPreviews]);
    e.target.value = "";
  };

  const removeEditExisting = (idx) => {
    setEditImages((prev) => prev.filter((_, i) => i !== idx));
    setEditPrimaryIdx((prev) => (prev === idx ? 0 : prev > idx ? prev - 1 : prev));
  };

  const removeEditNew = (idx) => {
    setEditImageFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editingProduct) return;
    setState((current) => ({ ...current, saving: true, error: "", message: "" }));
    try {
      const data = new FormData();
      Object.entries(editForm).forEach(([k, v]) => data.append(k, v));
      // Mark which of the existing images are retained (and set primary flag)
      const retained = editImages.map((img, i) => ({ ...img, isPrimary: i === editPrimaryIdx }));
      data.append("retainedImages", JSON.stringify(retained));
      data.append("primaryImageIndex", String(editPrimaryIdx));
      editImageFiles.forEach(({ file }) => data.append("images", file));
      const response = await api.patch(`/vendor/products/${editingProduct._id}`, data);
      const updatedProduct = response.data.data;
      setState((current) => ({
        ...current,
        saving: false,
        message: response.data.message || "Product updated and submitted for approval.",
        items: current.items.map((product) => product._id === updatedProduct._id ? updatedProduct : product),
      }));
      // Revoke any object URLs we created
      editImageFiles.forEach(({ preview }) => URL.revokeObjectURL(preview));
      setEditImageFiles([]);
      setFilterApproval("pending");
      setEditingProduct(null);
    } catch (error) {
      setState((current) => ({
        ...current,
        saving: false,
        error: error.response?.data?.message || error.message || "Unable to update product.",
      }));
    }
  };

  const categories = ["Motors", "Space Heaters", "LED Lighting", "Testing Instruments", "MCBs", "Motor Starters", "Contactors", "Switchgear", "Industrial Sensors", "Cables"];

  const getApprovalStatus = (product) => String(product.status ?? product.approvalStatus ?? "pending").toLowerCase();
  const getStockQuantity = (product) => {
    if (product.stock === null || product.stock === undefined || product.stock === "") return null;
    const quantity = Number(product.stock);
    return Number.isFinite(quantity) ? quantity : null;
  };
  const productCategoryCount = new Set(state.items.map((product) => product.category).filter(Boolean)).size;
  const approvedProductCount = state.items.filter((product) => ["approved", "published"].includes(getApprovalStatus(product))).length;
  const lowStockCount = state.items.filter((product) => {
    const quantity = getStockQuantity(product);
    return quantity !== null && quantity < 5;
  }).length;
  const filteredItems = state.items.filter((p) => {
    const matchesSearch = !searchQuery || (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.brand || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === "all" || p.category === filterCategory;
    const matchesApproval = filterApproval === "all" || getApprovalStatus(p) === filterApproval;
    return matchesSearch && matchesCat && matchesApproval;
  });
  const waitingApprovalCount = state.items.filter((product) => getApprovalStatus(product) === "pending").length;

  return (
    <DashboardShell role="vendor" activeNav="/vendor/products">
      {/* ── Top Overall Inventory Card (Image 2) ── */}
      <div className="db-card">
        <div className="db-card-header">
          <h3 className="db-card-title">Overall Inventory</h3>
        </div>
        <div className="db-overview-cols">
          <div className="db-overview-item">
            <div className="db-overview-icon blue">
              <i className="bi bi-grid-3x3-gap" />
            </div>
            <div className="db-overview-data">
              <strong>{productCategoryCount}</strong>
              <span>Product categories</span>
            </div>
          </div>

          <div className="db-overview-item">
            <div className="db-overview-icon orange">
              <i className="bi bi-box-seam" />
            </div>
            <div className="db-overview-data">
              <strong>{state.items.length}</strong>
              <span>Total products</span>
            </div>
          </div>

          <div className="db-overview-item">
            <div className="db-overview-icon purple">
              <i className="bi bi-star" />
            </div>
            <div className="db-overview-data">
              <strong>{approvedProductCount}</strong>
              <span>Approved products</span>
            </div>
          </div>

          <div className="db-overview-item">
            <div className="db-overview-icon red">
              <i className="bi bi-exclamation-triangle" />
            </div>
            <div className="db-overview-data">
              <strong>{lowStockCount}</strong>
              <span>Low stock · below 5</span>
            </div>
          </div>
        </div>
      </div>

      {state.message && <div className="db-badge success mb-3 d-inline-flex">{state.message}</div>}
      {state.error && <div className="db-badge danger mb-3 d-inline-flex">{state.error}</div>}

      {/* ── Main Products Card (Image 2) ── */}
      <div className="db-card">
        <div className="db-card-header">
          <h3 className="db-card-title">Products</h3>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              className="db-btn db-btn-primary db-btn-sm"
              onClick={() => setShowModal(true)}
            >
              Add Product
            </button>
            <button
              type="button"
              className="db-btn db-btn-outline db-btn-sm"
              onClick={() => setSearchQuery(searchQuery ? "" : " ")}
            >
              <i className="bi bi-sliders me-1" /> Filters
            </button>
            <button
              type="button"
              className="db-btn db-btn-outline db-btn-sm"
              onClick={() => alert("Inventory records ready for export.")}
            >
              Download all
            </button>
          </div>
        </div>

        {/* Filter input */}
        <div className="mb-3 d-flex gap-2">
          <input
            type="text"
            className="db-form-input"
            style={{ maxWidth: 320 }}
            placeholder="Filter product name or brand..."
            value={searchQuery.trim()}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="db-form-select"
            style={{ maxWidth: 200 }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="db-form-select"
            style={{ maxWidth: 230 }}
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
            aria-label="Filter by approval status"
          >
            <option value="all">All approval statuses</option>
            <option value="pending">Waiting for approval ({waitingApprovalCount})</option>
            <option value="in_review">In review</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">Changes requested</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Table matching Image 2 */}
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                <th>Products</th>
                <th>SKU</th>
                <th>Buying Price</th>
                <th>Quantity</th>
                <th>Category</th>
                <th>Availability</th>
                <th>Approval Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length ? (
                filteredItems.map((p) => {
                  const stockNum = getStockQuantity(p);
                  const hasStock = stockNum !== null;
                  const isLow = hasStock && stockNum > 0 && stockNum < 5;
                  const isOut = stockNum === 0;
                  const status = getApprovalStatus(p);
                  const approvalStatus = {
                    pending: "Waiting for approval",
                    in_review: "In review",
                    approved: "Approved",
                    published: "Published",
                    changes_requested: "Changes requested",
                    rejected: "Rejected",
                    draft: "Draft",
                    archived: "Archived",
                  }[status] || status.replaceAll("_", " ");
                  const approvalBadge = ["pending", "in_review", "changes_requested"].includes(status)
                    ? "warning"
                    : ["approved", "published"].includes(status)
                      ? "success"
                      : status === "rejected"
                        ? "danger"
                        : "info";
                  return (
                    <tr key={p._id}>
                      <td className="db-cell-bold">
                        {p.name}
                        {p.brand && <small className="db-cell-muted d-block">{p.brand}</small>}
                      </td>
                      <td>{p.sku || "—"}</td>
                      <td>{p.price !== null && p.price !== undefined && p.price !== "" ? fmt(p.price) : "—"}</td>
                      <td>{hasStock ? stockNum : "—"}</td>
                      <td className="db-cell-muted">{p.category || "—"}</td>
                      <td>
                        {hasStock
                          ? <span className={`db-badge ${isOut ? "danger" : isLow ? "warning" : "success"}`}>{isOut ? "Out of stock" : isLow ? "Low stock" : "In stock"}</span>
                          : <span className="db-badge info">Not set</span>}
                      </td>
                      <td><span className={`db-badge ${approvalBadge}`}>{approvalStatus}</span></td>
                      <td>
                        {["draft", "rejected", "changes_requested", "approved", "published"].includes(status)
                          ? <button type="button" className="db-btn db-btn-outline db-btn-sm" onClick={() => openEdit(p)}><i className="bi bi-pencil" /> Edit</button>
                          : <span className="text-muted">Under review</span>}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted">
                    {filterApproval === "pending" ? "No products are waiting for approval." : state.items.length ? "No products match the selected filters." : "No products listed for this vendor."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination matching Image 2 */}
        <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top">
          <button type="button" className="db-btn db-btn-outline db-btn-sm" disabled>
            Previous
          </button>
          <span className="text-muted" style={{ fontSize: "0.82rem" }}>
            Page 1 of {Math.max(1, Math.ceil(filteredItems.length / 10))}
          </span>
          <button type="button" className="db-btn db-btn-outline db-btn-sm" disabled>
            Next
          </button>
        </div>
      </div>

      {editingProduct && (
        <div className="db-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget && !state.saving) setEditingProduct(null); }}>
          <form className="db-modal" onSubmit={saveEdit} style={{ maxWidth: 660 }}>
            <div className="db-modal-header">
              <h3 className="db-modal-title">Edit product</h3>
              <button type="button" className="db-modal-close" onClick={() => setEditingProduct(null)} disabled={state.saving} aria-label="Close edit product"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="db-modal-body">
              <p className="text-secondary" style={{ marginBottom: 18 }}>Saving changes will send this product back for approval.</p>

              {/* ── Image manager ── */}
              {editImages.length > 0 && (
                <>
                  <p className="pim-section-label">Current images <small style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— hover to delete · click "Primary" to set cover</small></p>
                  <div className="pim-grid">
                    {editImages.map((img, idx) => (
                      <div key={img.publicId || img.url || idx} className={`pim-thumb${idx === editPrimaryIdx ? " is-primary" : ""}`}>
                        <img src={img.url} alt={`Product image ${idx + 1}`} />
                        <div className="pim-thumb-overlay">
                          <button type="button" className="pim-thumb-del" onClick={() => removeEditExisting(idx)} title="Remove image" aria-label="Remove image">
                            <i className="bi bi-x" />
                          </button>
                        </div>
                        {idx === editPrimaryIdx
                          ? <span className="pim-primary-badge">Primary</span>
                          : <button type="button" className="pim-set-primary" onClick={() => setEditPrimaryIdx(idx)}>Set primary</button>}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* New file previews */}
              {editImageFiles.length > 0 && (
                <>
                  <p className="pim-section-label">New images to upload</p>
                  <div className="pim-new-previews">
                    {editImageFiles.map(({ preview }, idx) => (
                      <div key={preview} className="pim-new-thumb">
                        <img src={preview} alt={`New image ${idx + 1}`} />
                        <button type="button" className="pim-new-thumb-del" onClick={() => removeEditNew(idx)} title="Remove" aria-label="Remove new image">
                          <i className="bi bi-x" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Upload zone — hidden when at 8-image limit */}
              {(editImages.length + editImageFiles.length) < 8 && (
                <label className="pim-upload-zone">
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseEditFiles} />
                  <i className="bi bi-cloud-upload" />
                  <span><strong>Click to upload</strong> or drag images here</span>
                </label>
              )}
              <p className="pim-hint">{editImages.length + editImageFiles.length}/8 images · JPG, PNG, WebP · max 5 MB each</p>

              <hr className="pim-divider" />

              {/* ── Product details ── */}
              <div className="db-form-group"><label className="db-form-label">Product name</label><input required className="db-form-input" value={editForm.name || ""} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></div>
              <div className="db-form-row db-form-row-2">
                <div><label className="db-form-label">Brand</label><input className="db-form-input" value={editForm.brand || ""} onChange={(event) => setEditForm({ ...editForm, brand: event.target.value })} /></div>
                <div><label className="db-form-label">Model</label><input className="db-form-input" value={editForm.model || ""} onChange={(event) => setEditForm({ ...editForm, model: event.target.value })} /></div>
              </div>
              <div className="db-form-group"><label className="db-form-label">Category</label><select className="db-form-select" value={editForm.category || "Motors"} onChange={(event) => setEditForm({ ...editForm, category: event.target.value })}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></div>
              <div className="db-form-row db-form-row-2">
                <div><label className="db-form-label">Price</label><input type="number" min="0" className="db-form-input" value={editForm.price} onChange={(event) => setEditForm({ ...editForm, price: event.target.value })} /></div>
                <div><label className="db-form-label">Stock</label><input type="number" min="0" className="db-form-input" value={editForm.stock} onChange={(event) => setEditForm({ ...editForm, stock: event.target.value })} /></div>
              </div>
              <div className="db-form-group"><label className="db-form-label">Description</label><textarea rows={3} className="db-form-textarea" value={editForm.description || ""} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} /></div>
            </div>
            <div className="db-modal-footer">
              <button type="button" className="db-btn db-btn-outline" onClick={() => setEditingProduct(null)} disabled={state.saving}>Cancel</button>
              <button type="submit" className="db-btn db-btn-primary" disabled={state.saving}>{state.saving ? "Saving…" : "Save and wait for approval"}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal matching Image 3 (media_1790321358880.jpg) ── */}
      {showModal && (
        <div className="db-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <form className="db-modal" onSubmit={submit} style={{ maxWidth: 540 }}>
            <div className="db-modal-header">
              <h3 className="db-modal-title">New Product</h3>
              <button type="button" className="db-modal-close" onClick={() => setShowModal(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="db-modal-body">
              {/* Drag Image Here (Image 3) */}
              <label className="db-dropzone">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  style={{ display: "none" }}
                  onChange={choose}
                />
                <div className="db-dropzone-icon">
                  <i className="bi bi-image" />
                </div>
                <div className="db-dropzone-text">
                  Drag image here<br />
                  or <span>Browse image</span>
                </div>
                {images.length > 0 && (
                  <div className="mt-2 text-primary" style={{ fontSize: "0.78rem" }}>
                    {images.length} file(s) selected
                  </div>
                )}
              </label>

              {/* Labeled form fields matching Image 3 */}
              <div className="db-form-group">
                <label className="db-form-label">Product Name</label>
                <input
                  required
                  className="db-form-input"
                  placeholder="Enter product name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="db-form-group">
                <label className="db-form-label">Product ID / Brand</label>
                <input
                  required
                  className="db-form-input"
                  placeholder="Enter product ID or brand"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>

              <div className="db-form-group">
                <label className="db-form-label">Category</label>
                <select
                  className="db-form-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="db-form-row db-form-row-2">
                <div>
                  <label className="db-form-label">Buying Price</label>
                  <input
                    type="number"
                    min="0"
                    className="db-form-input"
                    placeholder="Enter buying price"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="db-form-label">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    className="db-form-input"
                    placeholder="Enter product quantity"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="db-form-group">
                <label className="db-form-label">Description</label>
                <textarea
                  rows={2}
                  className="db-form-textarea"
                  placeholder="Enter product description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="db-modal-footer">
              <button
                type="button"
                className="db-btn db-btn-outline"
                onClick={() => setShowModal(false)}
              >
                Discard
              </button>
              <button
                type="submit"
                className="db-btn db-btn-primary"
                disabled={state.saving}
              >
                {state.saving ? "Adding..." : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}


export default ProductSubmission;
