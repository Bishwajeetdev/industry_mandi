import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/api";
import { fmt } from "../../utils/helpers";
import DashboardShell from "../../components/dashboard/DashboardShell";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";

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
          items: Array.isArray(r.data?.data) ? r.data.data : [],
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
  useEffect(() => {
    load();
  }, [endpoint]);
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
    <DashboardShell role="vendor" activeNav={mode === "offers" ? "/vendor/offers" : "/vendor/products"} title={title}>
      <main className="container py-0">
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
            <div className="dashboard-panel vendor-submitted-records">
              <h3>Submitted records</h3>
              {state.items.map((x) => (
                <div className="offer-row" key={x._id}>
                  <span>
                    <b>{x.product?.name || x.name}</b>
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
    </DashboardShell>
  );
}


export default VendorTools;
