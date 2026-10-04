import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { fmt } from "../../utils/helpers";
import { CATEGORIES } from "../../utils/catalogData";
import DashboardShell from "../../components/dashboard/DashboardShell";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";

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

  useEffect(() => {
    loadRecent();
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
    <DashboardShell role="admin" activeNav="/admin/products/add" title="Create product">
      <div className="db-create-product-layout">
      <div className="d-flex justify-content-between align-items-center gap-2 mb-3 flex-wrap">
        <span className="eyebrow dark">ADMIN CATALOG</span>
      </div>
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
          <div className="dashboard-panel admin-recent-products-panel">
            <h3 className="mb-3">Recently created</h3>
            {recentProducts.length === 0 ? (
              <p className="text-secondary mb-0">No products created yet.</p>
            ) : (
              recentProducts.map((p) => (
                <div className="offer-row" key={p._id}>
                  <span>
                    <b>{p.name}</b>
                    <small>{p.brand ? `${p.brand} · ` : ""}SKU: {p.sku || "—"}</small>
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
          <div className="dashboard-panel admin-quick-actions-panel mt-3">
            <h3 className="mb-2">Quick actions</h3>
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
      </div>
    </DashboardShell>
  );
}


export default AdminProductCreate;
