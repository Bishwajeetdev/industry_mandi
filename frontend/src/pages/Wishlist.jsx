import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { fmt, getDisplayPrice } from "../utils/helpers";
import { notifyCartChanged, notifyWishlistChanged } from "../utils/events";
import { addToCompareQueue } from "../utils/compareStorage";
import ProductCard from "../components/cards/ProductCard";
import Loading from "../components/common/Loading";
import ErrorState from "../components/common/ErrorState";

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
  useEffect(() => {
    load();
  }, []);
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
            <div className="col-6 col-md-4 col-xl-3" key={p._id}>
              <ProductCard product={p} onRemove={remove} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default Wishlist;
