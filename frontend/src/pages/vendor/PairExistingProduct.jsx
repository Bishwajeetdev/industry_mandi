import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api/api";
import { fmt, getDisplayPrice } from "../../utils/helpers";
import DashboardShell from "../../components/dashboard/DashboardShell";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";

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
  useEffect(() => {
    loadRequests();
  }, []);
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
    <DashboardShell role="vendor" activeNav="/vendor/pairing" title="Product pairing">
      <main className="container py-0">
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
          <div className="dashboard-panel vendor-pairing-requests">
            <h3>Your pairing requests</h3>
            {!requests.length ? (
              <p className="vendor-pairing-empty">No pairing requests yet.</p>
            ) : (
              requests.map((x) => (
                <div className="offer-row" key={x._id}>
                  <span>
                    <b>{x.product?.name || x.submittedName}</b>
                    <small><span className={`db-badge ${x.status === "approved" ? "success" : x.status === "rejected" ? "danger" : "warning"}`}>{(x.status || "pending").replaceAll("_", " ")}</span></small>
                    {x.reviewReason && (
                      <small className="pairing-review-note">
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
    </DashboardShell>
  );
}

export default PairExistingProduct;
