import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/api";
import ProductCard from "../components/cards/ProductCard";
import Loading from "../components/common/Loading";
import ErrorState from "../components/common/ErrorState";
import { INDUSTRIAL_CATALOG } from "../utils/catalogData";
import { addToCompareQueue } from "../utils/compareStorage";

function Products() {
  const fallbackProducts = INDUSTRIAL_CATALOG;

  const [state, setState] = useState({ loading: true, items: [], facets: { categories: [], brands: [] }, error: "" }),
    [searchParams, setSearchParams] = useSearchParams(),
    [query, setQuery] = useState(searchParams.get("q") || ""),
    [chosen, setChosen] = useState([]),
    [compareMessage, setCompareMessage] = useState(""),
    [priceError, setPriceError] = useState("");
  const selectedCategory = searchParams.get("category") || "";
  const selectedBrand = searchParams.get("brand") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const load = (nextQuery = query, nextCategory = selectedCategory, nextBrand = selectedBrand, nextMinPrice = minPrice, nextMaxPrice = maxPrice) => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    api
      .get("/products", { params: { ...(nextQuery.trim() ? { q: nextQuery.trim() } : {}), ...(nextCategory ? { category: nextCategory } : {}), ...(nextBrand ? { brand: nextBrand } : {}), ...(nextMinPrice ? { minPrice: nextMinPrice } : {}), ...(nextMaxPrice ? { maxPrice: nextMaxPrice } : {}) } })
      .then((r) =>
        setState({ loading: false, items: Array.isArray(r.data?.data?.items) ? r.data.data.items : [], facets: r.data?.data?.filters || { categories: [], brands: [] }, error: "" }),
      )
      .catch((error) =>
        setState({
          loading: false,
          items: [],
          facets: { categories: [], brands: [] }, error: error.response?.data?.message || error.message,
        }),
      );
  };
  useEffect(() => {
    const nextQuery = searchParams.get("q") || "";
    const nextCategory = searchParams.get("category") || "";
    const nextBrand = searchParams.get("brand") || "";
    const nextMinPrice = searchParams.get("minPrice") || "";
    const nextMaxPrice = searchParams.get("maxPrice") || "";
    setQuery(nextQuery);
    load(nextQuery, nextCategory, nextBrand, nextMinPrice, nextMaxPrice);
  }, [searchParams]);
  const updateFilters = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    setSearchParams(next);
  };
  const clearFilters = () => setSearchParams({});
  const toggle = (p) => {
    if (chosen.length > 0 && chosen[0].category !== p.category) {
      setCompareMessage(`Choose another ${chosen[0].category} product to compare.`);
      return;
    }
    setCompareMessage("");
    setChosen((a) => {
      if (a.some((x) => x._id === p._id)) return a.filter((x) => x._id !== p._id);
      if (a.length >= 4) return a;
      addToCompareQueue(p);
      return [...a, p];
    });
  };
  // Use fallback products when backend returns nothing
  const hasFilters = Boolean(query.trim() || selectedCategory || selectedBrand || minPrice || maxPrice);
  const safeFallback = Array.isArray(fallbackProducts) ? fallbackProducts : [];
  const displayItems = (state.items && state.items.length > 0) || hasFilters ? (state.items || []) : safeFallback;
  const categories = state.facets?.categories?.length ? state.facets.categories : [...new Set(safeFallback.map((product) => product?.category).filter(Boolean))].sort();
  const brands = state.facets?.brands?.length ? state.facets.brands : [...new Set(safeFallback.map((product) => product?.brand).filter(Boolean))].sort();
  const groupedProducts = (displayItems || []).reduce((groups, product) => {
    if (!product) return groups;
    const category = product.category || "Other machinery";
    (groups[category] ||= []).push(product);
    return groups;
  }, {});
  return (
    <main className="container py-5">
      <div className="page-heading">
        <span className="eyebrow dark">PRECISION SPEC MATRIX CATALOG</span>
        <h1>Explore Industrial Machinery &amp; Equipment</h1>
        <p className="lead text-secondary">Direct OEM procurement, verified manufacturer pricing, and benchmark telemetry across motors, CNCs, pumps, and process automation.</p>
      </div>
      {selectedCategory && <div className="catalog-category-filter" role="status"><span><i className="bi bi-funnel-fill" /> Showing products in <strong>{selectedCategory}</strong></span><button type="button" onClick={() => updateFilters({ category: "" })}>Clear category <i className="bi bi-x-lg" /></button></div>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const nextQuery = query.trim();
          updateFilters({ q: nextQuery });
        }}
        className="searchbox mt-4"
      >
        <i className="bi bi-search" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ‘Siemens 15 kW IE3 Motor, Haas CNC, ABB VFD, or Centrifugal Pump’"
        />
        <kbd className="search-shortcut-badge">⌘K</kbd>
        <button className="btn btn-primary">Search Catalog</button>
      </form>
      <div className="catalog-layout mt-4">
        <aside className="catalog-filter-panel" aria-label="Filter products">
          <div className="catalog-filter-heading"><div><span>REFINE RESULTS</span><h2>Filters</h2></div>{hasFilters && <button type="button" onClick={clearFilters}>Clear all</button>}</div>
          <div className="catalog-filter-group"><label htmlFor="catalog-category">Category</label><select id="catalog-category" value={selectedCategory} onChange={(event) => updateFilters({ category: event.target.value })}><option value="">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></div>
          <div className="catalog-filter-group"><label htmlFor="catalog-brand">Brand</label><select id="catalog-brand" value={selectedBrand} onChange={(event) => updateFilters({ brand: event.target.value })}><option value="">All brands</option>{brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></div>
          <form key={`${minPrice}-${maxPrice}`} className="catalog-price-filter" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const nextMin = data.get("minPrice")?.trim() || ""; const nextMax = data.get("maxPrice")?.trim() || ""; if (nextMin && nextMax && Number(nextMin) > Number(nextMax)) { setPriceError("Minimum price cannot exceed maximum price."); return; } setPriceError(""); updateFilters({ minPrice: nextMin, maxPrice: nextMax }); }}><label>Price range</label><div><input name="minPrice" type="number" min="0" inputMode="numeric" defaultValue={minPrice} placeholder="Min price" /><span>to</span><input name="maxPrice" type="number" min="0" inputMode="numeric" defaultValue={maxPrice} placeholder="Max price" /></div>{priceError && <small className="catalog-price-error">{priceError}</small>}<button type="submit"><i className="bi bi-check2" /> Apply price</button></form>
        </aside>
        <section className="catalog-results">
      <div className="d-flex justify-content-between align-items-center catalog-results-summary">
        <span className="font-monospace small text-secondary">
          <i className="bi bi-shield-check text-success me-1" />
          {displayItems.length} verified industrial SKUs on-grid
        </span>
        {chosen.length >= 2 && (
          <Link
            className="btn btn-primary btn-sm shadow"
            to={`/compare?ids=${chosen.map((p) => p._id).join(",")}`}
          >
            Compare {chosen.length} products in SpecMatrix <i className="bi bi-arrow-right ms-1" />
          </Link>
        )}
      </div>
      {compareMessage && <div className="alert alert-warning mt-3">{compareMessage}</div>}
      {state.loading ? (
        <Loading label="Searching the industrial catalog…" />
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={load} />
      ) : (
        <div className="mt-4">
          {!displayItems.length && (
            <div className="empty-state">
              <i className="bi bi-search" />
              <h2>No matching products</h2>
              <p>Try a different name, brand, model, SKU, or category.</p>
            </div>
          )}
          {Object.entries(groupedProducts).map(([category, products]) => (
            <section className="mb-5" key={category}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow dark">MACHINERY CATEGORY</span>
                  <h2>{category}</h2>
                </div>
                <span className="badge bg-secondary">{products.length} SKUs</span>
              </div>
              <div className="row g-4">
                {products.map((p) => (
                  <div className="col-6 col-md-4 col-xl-3" key={p._id}>
                    <ProductCard
                      product={p}
                      selectable
                      chosen={chosen.some((x) => x._id === p._id)}
                      onToggle={toggle}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
        </section>
      </div>
    </main>
  );
}

export default Products;
