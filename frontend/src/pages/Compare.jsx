import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { fmt, getDisplayPrice, haveSameProductCategory } from "../utils/helpers";
import { notifyCartChanged, notifyWishlistChanged } from "../utils/events";
import { clearCompareQueue, removeFromCompareQueue, addToCompareQueue } from "../utils/compareStorage";
import { BENCHMARK_PRESETS, TELEMETRY_METRICS, buildFallbackCompareData, INDUSTRIAL_CATALOG } from "../utils/catalogData";
import Loading from "../components/common/Loading";
import ErrorState from "../components/common/ErrorState";

function Compare() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const ids = params.get("ids") || "";
  const [state, setState] = useState({ loading: !!ids, data: null, error: "" });

  // Interactive controls
  const [highlightDiffs, setHighlightDiffs] = useState(false);
  const [diffsOnly, setDiffsOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerApiProducts, setPickerApiProducts] = useState([]);
  const [loadingPicker, setLoadingPicker] = useState(false);

  useEffect(() => {
    if (!showAddModal) return;
    setLoadingPicker(true);
    const cat = state.data?.results?.[0]?.product?.category;
    const p = { limit: 50 };
    if (cat) p.category = cat;
    api
      .get("/products", { params: p })
      .then((r) => {
        setPickerApiProducts(Array.isArray(r.data?.data?.items) ? r.data.data.items : []);
      })
      .catch(() => {
        setPickerApiProducts([]);
      })
      .finally(() => {
        setLoadingPicker(false);
      });
  }, [showAddModal, state.data]);

  const [copied, setCopied] = useState(false);
  const [cartAdded, setCartAdded] = useState({});
  const [savedWishlist, setSavedWishlist] = useState({});
  const [emptySearch, setEmptySearch] = useState("");
  const [emptySelected, setEmptySelected] = useState([]);

  // Live persistent cart tracking so Add to Cart immediately changes to Added to Cart and stays
  const [cartMap, setCartMap] = useState(() => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const m = {};
      cart.forEach((c) => {
        if (c._id) m[c._id] = true;
        if (c.slug) m[c.slug] = true;
        if (c.name) m[c.name] = true;
      });
      return m;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const syncCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const m = {};
        cart.forEach((c) => {
          if (c._id) m[c._id] = true;
          if (c.slug) m[c.slug] = true;
          if (c.name) m[c.name] = true;
        });
        setCartMap(m);
      } catch { }
    };
    window.addEventListener("cart-updated", syncCart);
    return () => window.removeEventListener("cart-updated", syncCart);
  }, []);

  const isProductInCart = (prod) => {
    if (!prod) return false;
    return !!(
      cartMap[prod._id] ||
      cartAdded[prod._id] ||
      (prod.slug && (cartMap[prod.slug] || cartAdded[prod.slug])) ||
      (prod.name && (cartMap[prod.name] || cartAdded[prod.name]))
    );
  };

  const load = () => {
    if (!ids) {
      setState({ loading: false, data: null, error: "" });
      return;
    }
    setState({ loading: true, data: null, error: "" });
    api
      .get("/products/compare", { params: { ids } })
      .then((r) => {
        // If API returns results, make sure each product has enriched specifications and valid non-zero prices
        const data = r.data.data;
        if (data?.results) {
          data.results.forEach((res) => {
            const raw = Number(res.price || res.product?.price || 0);
            res.price = raw > 0 ? raw : getDisplayPrice(res.product);
            if (!res.product.price || res.product.price <= 0) {
              res.product.price = res.price;
            }
            const match = INDUSTRIAL_CATALOG.find((cat) => cat._id === res.product?._id || cat.slug === res.product?.slug);
            if (match) {
              res.product = {
                ...match,
                ...res.product,
                price: res.price,
                specifications: {
                  ...(match.specifications || {}),
                  ...(typeof res.product.specifications === "object" ? res.product.specifications : {}),
                },
                technicalSpecifications: {
                  ...(match.technicalSpecifications || {}),
                  ...(typeof res.product.technicalSpecifications === "object" ? res.product.technicalSpecifications : {}),
                },
              };
            }
          });
        }
        setState({ loading: false, data, error: "" });
      })
      .catch((err) => {
        if (err.response?.status === 422) {
          setState({ loading: false, data: null, error: err.response?.data?.message || "Compare products from the same category only" });
          return;
        }
        const savedProducts = JSON.parse(localStorage.getItem("compareProducts") || "[]");
        const fallbackData = buildFallbackCompareData(ids, savedProducts);
        if (fallbackData?.results?.length > 1 && !haveSameProductCategory(fallbackData.results.map((result) => result.product))) {
          setState({ loading: false, data: null, error: "Compare products from the same specified category only" });
          return;
        }
        setState({ loading: false, data: fallbackData, error: "" });
      });
  };

  useEffect(() => {
    load();
  }, [ids]);

  useEffect(() => {
    const handleLogout = () => {
      clearCompareQueue();
      setParams({});
      setState({ loading: false, data: null, error: "" });
      setEmptySelected([]);
    };
    window.addEventListener("account-logged-out", handleLogout);
    return () => window.removeEventListener("account-logged-out", handleLogout);
  }, [setParams]);

  // Keep savedWishlist in sync with actual localStorage on load
  useEffect(() => {
    try {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const map = {};
      wishlist.forEach((item) => {
        if (item?._id) map[item._id] = true;
      });
      setSavedWishlist(map);
    } catch { }
  }, [state.data]);

  const removeMachine = (productId) => {
    const idList = ids.split(",").filter(Boolean);
    const updated = idList.filter((id) => id !== productId);

    // Keep global compareProducts in sync
    try {
      const saved = JSON.parse(localStorage.getItem("compareProducts") || "[]");
      const nextSaved = saved.filter((p) => p._id !== productId);
      localStorage.setItem("compareProducts", JSON.stringify(nextSaved));
      window.dispatchEvent(new CustomEvent("compare-updated", { detail: { products: nextSaved } }));
    } catch { }

    if (updated.length > 0) {
      setParams({ ids: updated.join(",") });
    } else {
      setParams({});
    }
  };

  const addMachine = (product) => {
    const idList = ids.split(",").filter(Boolean);
    if (idList.length >= 4) return;
    const comparedProducts = state.data?.results?.map((result) => result.product) || [];
    if (comparedProducts.length && !haveSameProductCategory([...comparedProducts, product])) {
      const currentCat = comparedProducts[0]?.category || "the selected product category";
      alert(`Cannot compare products from different categories. All compared products must belong to "${currentCat}".`);
      return;
    }
    if (!idList.includes(product._id)) {
      const nextIds = [...idList, product._id];
      setParams({ ids: nextIds.join(",") });

      // Keep global compareProducts in sync
      try {
        const saved = JSON.parse(localStorage.getItem("compareProducts") || "[]");
        if (!saved.some((p) => p._id === product._id)) {
          const nextSaved = [...saved, product].slice(0, 4);
          localStorage.setItem("compareProducts", JSON.stringify(nextSaved));
          window.dispatchEvent(new CustomEvent("compare-updated", { detail: { products: nextSaved } }));
        }
      } catch { }
    }
    setShowAddModal(false);
  };

  const handleAddToCart = (product, price) => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const pid = String(product?._id || product?.slug || product?.name);
      const existing = cart.find(
        (item) =>
          String(item._id) === pid ||
          (product.slug && item.slug === product.slug) ||
          (product.name && item.name === product.name)
      );
      const finalPrice = Number(price || product?.price || getDisplayPrice(product));
      const updatedCart = existing
        ? cart.map((item) =>
          String(item._id) === pid ||
            (product.slug && item.slug === product.slug) ||
            (product.name && item.name === product.name)
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        )
        : [...cart, { ...product, _id: pid, price: finalPrice, quantity: 1 }];
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      notifyCartChanged();
      setCartAdded((prev) => ({
        ...prev,
        [pid]: true,
        [product._id]: true,
        ...(product.slug ? { [product.slug]: true } : {}),
        ...(product.name ? { [product.name]: true } : {}),
      }));
      setCartMap((prev) => ({
        ...prev,
        [pid]: true,
        [product._id]: true,
        ...(product.slug ? { [product.slug]: true } : {}),
        ...(product.name ? { [product.name]: true } : {}),
      }));
    } catch (e) {
      console.error("Failed to add to cart", e);
    }
  };

  const handleSaveWishlist = (product) => {
    try {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const exists = wishlist.some((item) => item._id === product._id);
      let nextWishlist;
      if (exists) {
        nextWishlist = wishlist.filter((item) => item._id !== product._id);
        setSavedWishlist((prev) => ({ ...prev, [product._id]: false }));
      } else {
        nextWishlist = [...wishlist, product];
        setSavedWishlist((prev) => ({ ...prev, [product._id]: true }));
      }
      localStorage.setItem("wishlist", JSON.stringify(nextWishlist));
      notifyWishlistChanged(nextWishlist);
    } catch (e) {
      console.error("Failed to update wishlist", e);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      }).catch(() => {
        // Fallback
        fallbackCopy(url);
      });
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = (text) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearAll = () => {
    clearCompareQueue();
    setParams({});
  };

  // Helper to extract a spec value from product
  const getProductSpec = (product, key) => {
    const specs = product.specifications instanceof Map
      ? Object.fromEntries(product.specifications)
      : (typeof product.specifications === "object" && product.specifications !== null ? product.specifications : {});
    if (specs[key] !== undefined && specs[key] !== null) return String(specs[key]);

    const techSpecs = product.technicalSpecifications instanceof Map
      ? Object.fromEntries(product.technicalSpecifications)
      : (typeof product.technicalSpecifications === "object" && product.technicalSpecifications !== null ? product.technicalSpecifications : {});
    if (techSpecs[key] !== undefined && techSpecs[key] !== null) return String(techSpecs[key]);

    return "—";
  };

  // Aggregated dynamic specification keys
  const dynamicSpecKeys = useMemo(() => {
    if (!state.data?.results) return [];
    const keys = new Set();
    state.data.results.forEach((r) => {
      const p = r.product;
      const specs = p.specifications instanceof Map
        ? Object.fromEntries(p.specifications)
        : (typeof p.specifications === "object" && p.specifications !== null ? p.specifications : {});
      Object.keys(specs).forEach((k) => {
        if (!["Price", "Brand", "Category", "Warranty", "Pan-India Freight"].includes(k)) {
          keys.add(k);
        }
      });
      const techSpecs = p.technicalSpecifications instanceof Map
        ? Object.fromEntries(p.technicalSpecifications)
        : (typeof p.technicalSpecifications === "object" && p.technicalSpecifications !== null ? p.technicalSpecifications : {});
      Object.keys(techSpecs).forEach((k) => keys.add(k));
    });
    return Array.from(keys);
  }, [state.data]);

  // Check if all items differ for a spec
  const checkIsDifferent = (values) => {
    if (values.length <= 1) return false;
    const first = String(values[0] || "").trim().toLowerCase();
    return values.some((v) => String(v || "").trim().toLowerCase() !== first);
  };

  // Available items for the quick picker modal
  const availablePickerProducts = useMemo(() => {
    const currentIds = ids.split(",").filter(Boolean);
    const cat = state.data?.results?.[0]?.product?.category;
    const combined = [...pickerApiProducts];
    if (typeof INDUSTRIAL_CATALOG !== "undefined" && Array.isArray(INDUSTRIAL_CATALOG)) {
      INDUSTRIAL_CATALOG.forEach((item) => {
        if (!combined.some((p) => String(p._id) === String(item._id) || p.name === item.name)) {
          if (!cat || (item.category && item.category.trim().toLowerCase() === cat.trim().toLowerCase())) {
            combined.push(item);
          }
        }
      });
    }
    return combined.filter((p) => {
      if (currentIds.includes(String(p._id))) return false;
      if (cat && p.category && p.category.trim().toLowerCase() !== cat.trim().toLowerCase()) return false;
      if (!pickerSearch.trim()) return true;
      const term = pickerSearch.toLowerCase();
      return (
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.brand && p.brand.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term)) ||
        (p.model && p.model.toLowerCase().includes(term))
      );
    });
  }, [ids, pickerSearch, pickerApiProducts, state.data]);

  // Empty state catalog list
  const emptyCatalogItems = useMemo(() => {
    if (!emptySearch.trim()) return INDUSTRIAL_CATALOG;
    const term = emptySearch.toLowerCase();
    return INDUSTRIAL_CATALOG.filter((p) =>
      p.name.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  }, [emptySearch]);

  const toggleEmptySelection = (productId) => {
    setEmptySelected((prev) => {
      if (prev.includes(productId)) return prev.filter((id) => id !== productId);
      if (prev.length >= 4) return prev;
      if (prev.length > 0) {
        const firstItem = INDUSTRIAL_CATALOG.find((p) => String(p._id) === String(prev[0]));
        const currentItem = INDUSTRIAL_CATALOG.find((p) => String(p._id) === String(productId));
        if (!haveSameProductCategory([firstItem, currentItem])) {
          alert(`Cannot compare products from different or unspecified categories. First selected category is "${firstItem?.category || "unspecified"}".`);
          return prev;
        }
      }
      return [...prev, productId];
    });
  };

  const launchEmptySelection = () => {
    if (emptySelected.length >= 2) {
      setParams({ ids: emptySelected.join(",") });
    }
  };

  // -------------------------------------------------------------
  // EMPTY STATE: When no products are in the comparison URL
  // -------------------------------------------------------------
  if (!ids) {
    return (
      <main className="container py-5 compare-page">
        {/* Breadcrumb Navigation */}
        <nav className="specmatrix-breadcrumbs mb-4" aria-label="breadcrumb">
          <Link to="/" className="breadcrumb-item-link">Marketplace</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">SpecMatrix™ Telemetry Engine</span>
        </nav>

        {/* Hero Section */}
        <section className="specmatrix-hero-banner">
          <div className="specmatrix-hero-content">
            <span className="eyebrow dark d-inline-flex align-items-center gap-2">
              <span className="telemetry-live-dot" />
              PRECISION SPECMATRIX™ EVALUATION ENGINE
            </span>
            <h1 className="specmatrix-hero-title">
              Industrial Machinery Telemetry &amp; Spec Validation
            </h1>
            <p className="specmatrix-hero-desc">
              Benchmark verified OEM machinery side-by-side with telemetry scores, engineering tolerances, electrical ratings, and direct commercial procurement terms.
            </p>
          </div>
          <div className="specmatrix-hero-stats">
            <div className="specmatrix-stat-card">
              <span className="stat-num">98.4%</span>
              <span className="stat-label">Telemetry Accuracy</span>
            </div>
            <div className="specmatrix-stat-card">
              <span className="stat-num">12,000+</span>
              <span className="stat-label">Verified SKUs</span>
            </div>
            <div className="specmatrix-stat-card">
              <span className="stat-num">Zero</span>
              <span className="stat-label">Middleman Markup</span>
            </div>
          </div>
        </section>

        {/* Benchmark Presets Section */}
        <section className="my-5">
          <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-2">
            <div>
              <span className="eyebrow dark">ONE-CLICK BENCHMARKS</span>
              <h2 className="h3 mb-0">Popular Industrial Comparison Suites</h2>
            </div>
            <span className="text-secondary small">Pre-configured with OEM certified telemetry</span>
          </div>

          <div className="row g-4">
            {BENCHMARK_PRESETS.map((preset) => (
              <div className="col-md-6 col-lg-3" key={preset.id}>
                <div className="benchmark-preset-card">
                  <div className="preset-card-header">
                    <span className="preset-icon">
                      <i className={`bi ${preset.icon}`} />
                    </span>
                    <span className="preset-badge">{preset.badge}</span>
                  </div>
                  <h3 className="preset-title">{preset.title}</h3>
                  <p className="preset-desc">{preset.description}</p>
                  <div className="preset-stat-highlight">
                    <i className="bi bi-patch-check-fill text-primary me-1" />
                    <span>{preset.stat}</span>
                  </div>
                  <Link
                    to={`/compare?ids=${preset.ids.join(",")}`}
                    className="btn btn-outline-primary btn-sm w-100 mt-3 preset-launch-btn"
                  >
                    Launch Matrix ({preset.ids.length} Machines) <i className="bi bi-arrow-right ms-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Machinery Selector on Empty Page */}
        <section className="specmatrix-picker-section mt-5">
          <div className="picker-section-header">
            <div>
              <span className="eyebrow dark">CATALOG SELECTOR</span>
              <h2 className="h3 mb-1">Build Custom Machinery Comparison</h2>
              <p className="text-secondary mb-0">Select 2 to 4 equipment units from the catalog to launch deep technical evaluation.</p>
            </div>
            <div className="picker-search-wrap">
              <i className="bi bi-search" />
              <input
                type="text"
                className="form-control"
                placeholder="Search motors, CNC, pumps, VFDs..."
                value={emptySearch}
                onChange={(e) => setEmptySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="row g-3 mt-3">
            {emptyCatalogItems.map((prod) => {
              const isSelected = emptySelected.includes(prod._id);
              return (
                <div className="col-md-6 col-lg-3" key={prod._id}>
                  <div className={`selector-product-card ${isSelected ? "selected" : ""}`}>
                    <div className="selector-card-thumb">
                      <img src={prod.image} alt={prod.name} loading="lazy" />
                      <span className="badge bg-dark border border-secondary selector-brand-badge">{prod.brand}</span>
                    </div>
                    <div className="selector-card-body">
                      <span className="selector-cat">{prod.category}</span>
                      <h4 className="selector-name">{prod.name}</h4>
                      <p className="selector-price">{fmt(getDisplayPrice(prod))}</p>
                      <button
                        className={`btn btn-sm w-100 ${isSelected ? "btn-primary" : "btn-outline-light"}`}
                        onClick={() => toggleEmptySelection(prod._id)}
                      >
                        {isSelected ? (
                          <>
                            <i className="bi bi-check-lg me-1" /> Selected ({emptySelected.indexOf(prod._id) + 1}/4)
                          </>
                        ) : (
                          <>
                            <i className="bi bi-plus-lg me-1" /> Add to Compare
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {emptySelected.length > 0 && (
            <div className="specmatrix-sticky-selector-bar">
              <div className="d-flex align-items-center gap-3">
                <span className="fw-bold">{emptySelected.length} machine{emptySelected.length === 1 ? "" : "s"} chosen</span>
                <small className="text-secondary">({emptySelected.length < 2 ? "Select at least 1 more" : "Ready to evaluate"})</small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-outline-light btn-sm" onClick={() => setEmptySelected([])}>
                  Reset
                </button>
                <button
                  className="btn btn-primary"
                  disabled={emptySelected.length < 2}
                  onClick={launchEmptySelection}
                >
                  Launch SpecMatrix Comparison ({emptySelected.length}) <i className="bi bi-arrow-right ms-2" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    );
  }

  // -------------------------------------------------------------
  // LOADING / ERROR STATES
  // -------------------------------------------------------------
  if (state.loading) return <Loading label="Calculating verified SpecMatrix telemetry…" />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;
  if (!state.data?.results?.length) {
    return (
      <main className="container py-5 text-center">
        <h2>No products found for comparison</h2>
        <p className="text-secondary">The requested equipment IDs could not be resolved in the catalog.</p>
        <Link to="/compare" className="btn btn-primary mt-3">Reset SpecMatrix</Link>
      </main>
    );
  }

  const { results, summary } = state.data;
  const bestProduct = results[0];

  return (
    <main className="container py-4 compare-page">
      {/* Toast Notification */}
      {copied && (
        <div className="specmatrix-toast" role="alert">
          <i className="bi bi-check-circle-fill text-success me-2" />
          Comparison link copied to clipboard!
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="specmatrix-breadcrumbs mb-3" aria-label="breadcrumb">
        <Link to="/" className="breadcrumb-item-link">Marketplace</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/products" className="breadcrumb-item-link">Industrial Catalog</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">SpecMatrix™ Telemetry</span>
      </nav>

      {/* Header & Executive Telemetry Strip */}
      <div className="specmatrix-top-header mb-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <span className="eyebrow dark d-inline-flex align-items-center gap-2">
              <span className="telemetry-live-dot" />
              PRECISION SPECMATRIX™ ENGINE
            </span>
            <h1 className="h2 mb-1">Machinery Telemetry &amp; Multi-Vendor Validation</h1>
            <p className="text-secondary mb-0">
              Side-by-side engineering evaluation, verified OEM telemetry tolerances, and direct commercial terms.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="specmatrix-toolbar">
            <button
              className={`toolbar-btn ${highlightDiffs ? "active" : ""}`}
              onClick={() => setHighlightDiffs((v) => !v)}
              title="Highlight specifications that differ across models"
            >
              <i className="bi bi-highlighter" />
              <span>Highlight Differences</span>
            </button>
            <button
              className={`toolbar-btn ${diffsOnly ? "active" : ""}`}
              onClick={() => setDiffsOnly((v) => !v)}
              title="Filter to only show rows with differing specs"
            >
              <i className="bi bi-funnel" />
              <span>Differences Only</span>
            </button>
            <button className="toolbar-btn" onClick={handleCopyLink} title="Share comparison matrix">
              <i className="bi bi-share" />
              <span>Share</span>
            </button>
            <button className="toolbar-btn" onClick={handlePrint} title="Print or export spec sheet">
              <i className="bi bi-printer" />
              <span>Print Sheet</span>
            </button>
            <button className="toolbar-btn btn-danger-subtle" onClick={handleClearAll} title="Clear comparison">
              <i className="bi bi-trash3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Executive AI Telemetry Summary Banner */}
        <div className="specmatrix-summary-card mt-3">
          <div className="summary-icon">
            <i className="bi bi-cpu-fill" />
          </div>
          <div className="summary-body">
            <div className="d-flex align-items-center gap-2 mb-1">
              <strong>OEM Telemetry Intelligence Verdict</strong>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
                VERIFIED ALGORITHM
              </span>
            </div>
            <p className="mb-0 text-secondary">{summary}</p>
          </div>
          {bestProduct && (
            <div className="summary-leader-callout">
              <span className="eyebrow dark mb-0">TOP BENCHMARK</span>
              <strong className="summary-leader-name text-truncate d-block">{bestProduct.product.name}</strong>
              <span className="text-primary font-monospace small">Score: {bestProduct.score}/100</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Hero Cards Grid */}
      <section className="compare-hero-grid-section mb-5">
        <div className="row g-3">
          {results.map((x) => {
            const isRankOne = x.rank === 1;
            const primaryImg = x.product.image || x.product.images?.[0]?.url || x.product.images?.[0] || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
            const isAdded = cartAdded[x.product._id];
            const isSaved = savedWishlist[x.product._id];

            return (
              <div className="col-md" key={x.product._id}>
                <div className={`compare-machine-card ${isRankOne ? "rank-1-card" : ""}`}>
                  {/* Top Bar: Clean Rank Ribbon + Remove Button (NO OVERLAP) */}
                  <div className="card-top-bar">
                    <span className={`rank-ribbon ${isRankOne ? "ribbon-winner" : "ribbon-standard"}`}>
                      <i className={`bi ${isRankOne ? "bi-trophy-fill" : "bi-check-circle-fill"} me-1`} />
                      #{x.rank} RANK {isRankOne ? "· TOP VALUE" : ""}
                    </span>
                    <button
                      className="btn-remove-machine"
                      onClick={() => removeMachine(x.product._id)}
                      title="Remove from comparison"
                      aria-label="Remove equipment"
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  </div>

                  {/* Machinery Image Preview */}
                  <div className="card-image-box">
                    <img
                      src={primaryImg}
                      alt={x.product.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <span className="oem-badge">
                      <i className="bi bi-patch-check-fill text-primary me-1" />
                      {x.product.brand || "OEM"}
                    </span>
                  </div>

                  {/* Card Header & Title */}
                  <div className="card-info-header">
                    <span className="font-monospace small text-secondary d-block">
                      SKU: {x.product.sku || (x.product._id ? `IM-${x.product._id.slice(-6).toUpperCase()}` : "IM-001")}
                    </span>
                    <Link to={`/product/${x.product.slug || x.product._id}`} className="machine-title-link">
                      <h3 className="machine-title">{x.product.name}</h3>
                    </Link>
                  </div>

                  {/* SpecMatrix Telemetry Gauge */}
                  <div className="telemetry-score-box">
                    <div className="score-meter-wrap">
                      <span className="score-number">{x.score}</span>
                      <span className="score-denom">/100</span>
                    </div>
                    <div className="score-meta">
                      <span className="score-label">SpecMatrix™ Index</span>
                      <div className="score-progress-track">
                        <div
                          className={`score-progress-fill ${isRankOne ? "fill-orange" : "fill-cyan"}`}
                          style={{ width: `${x.score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Price & Commercial Terms */}
                  <div className="card-price-section">
                    <span className="price-val">{fmt(x.price > 0 ? x.price : getDisplayPrice(x.product))}</span>
                    <small className="price-sub">Excl. GST · Pan-India Freight Covered</small>
                    <div className="stock-pill mt-2">
                      <span className="stock-dot" />
                      <span>{x.product.stock > 0 ? "In Stock · Dispatches in 24h" : "Standard OEM Lead Time (2-3 Weeks)"}</span>
                    </div>
                  </div>

                  {/* Buyer CTAs */}
                  <div className="card-actions-row mt-3">
                    {(() => {
                      const isAdded = isProductInCart(x.product);
                      return (
                        <button
                          className={`btn btn-sm ${isAdded ? "btn-success" : "btn-primary"} flex-grow-1`}
                          onClick={() => handleAddToCart(x.product, x.price > 0 ? x.price : getDisplayPrice(x.product))}
                        >
                          {isAdded ? (
                            <>
                              <i className="bi bi-check2-circle me-1" /> Added to Cart
                            </>
                          ) : (
                            <>
                              <i className="bi bi-bag-plus me-1" /> Add to Cart
                            </>
                          )}
                        </button>
                      );
                    })()}
                    <button
                      className={`btn btn-sm ${isSaved ? "btn-light text-primary" : "btn-outline-light"}`}
                      onClick={() => handleSaveWishlist(x.product)}
                      title="Save to Procurement RFQ / Wishlist"
                    >
                      <i className={`bi ${isSaved ? "bi-heart-fill" : "bi-heart"}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* "+ Add Machine" Slot (if < 4 items) */}
          {results.length < 4 && (
            <div className="col-md">
              <div className="add-compare-slot" onClick={() => setShowAddModal(true)}>
                <div className="add-slot-content">
                  <span className="add-slot-icon">
                    <i className="bi bi-plus-circle" />
                  </span>
                  <strong>Add Equipment</strong>
                  <p>Evaluate up to 4 machines simultaneously in SpecMatrix.</p>
                  <button className="btn btn-sm btn-outline-primary mt-2">
                    Select Machine <i className="bi bi-arrow-right ms-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Visual Telemetry Radar & Comparative Score Breakdown */}
      <section className="specmatrix-telemetry-panel mb-5">
        <div className="panel-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <span className="eyebrow dark mb-0">TELEMETRY SCORECARD</span>
            <h2 className="h4 mb-0">Engineering Performance Telemetry</h2>
          </div>
          <span className="font-monospace small text-secondary">
            Weighted Multi-Factor OEM Validation
          </span>
        </div>

        <div className="telemetry-metrics-list p-3">
          {TELEMETRY_METRICS.map((metric) => {
            // Find winner for this metric
            const maxScore = Math.max(...results.map((r) => r.breakdown?.[metric.key] || 0));

            return (
              <div className="telemetry-metric-row" key={metric.key}>
                <div className="metric-info-col">
                  <span className="metric-title-group">
                    <i className={`bi ${metric.icon} text-primary me-2`} />
                    <strong>{metric.label}</strong>
                  </span>
                  <p className="metric-desc">{metric.desc}</p>
                </div>

                <div className="metric-bars-col">
                  <div className="row g-2">
                    {results.map((r) => {
                      const val = r.breakdown?.[metric.key] || 0;
                      const isTop = val === maxScore && val > 0;

                      return (
                        <div className="col" key={r.product._id}>
                          <div className={`metric-bar-cell ${isTop ? "metric-leader" : ""}`}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="bar-product-name text-truncate">{r.product.name}</span>
                              <span className="bar-val font-monospace fw-bold">
                                {val}/100
                                {isTop && <i className="bi bi-award-fill text-warning ms-1" title="Category Winner" />}
                              </span>
                            </div>
                            <div className="bar-track">
                              <div
                                className={`bar-fill ${isTop ? "fill-orange" : "fill-blue"}`}
                                style={{ width: `${val}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comprehensive Tabular Specification Matrix */}
      <section className="specmatrix-matrix-table-panel mb-5">
        <div className="panel-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <span className="eyebrow dark mb-0">PARAMETER SPEC MATRIX</span>
            <h2 className="h4 mb-0">Full Technical &amp; Operational Attributes</h2>
          </div>
          <div className="d-flex align-items-center gap-3">
            {highlightDiffs && (
              <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                <i className="bi bi-eye-fill me-1" /> Differences Highlighted
              </span>
            )}
            <span className="font-monospace small text-secondary">
              Normalized Engineering Data
            </span>
          </div>
        </div>

        <div
          className={`table-responsive compare-matrix-scroll comparison-count-${results.length}`}
          role="region"
          aria-label="Product comparison matrix. Swipe horizontally to view each product."
          tabIndex="0"
        >
          <table className="table compare-matrix-table mb-0">
            {/* Sticky Table Header */}
            <thead>
              <tr>
                <th className="spec-attr-col sticky-col">Engineering Attribute</th>
                {results.map((x) => (
                  <th key={x.product._id} className="spec-product-col">
                    <div className="th-product-head">
                      <span className="th-brand">{x.product.brand || "OEM"}</span>
                      <strong className="th-title">{x.product.name}</strong>
                      <span className="th-price">{fmt(x.price > 0 ? x.price : getDisplayPrice(x.product))}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* SECTION: Commercial & Procurement */}
              <tr className="spec-section-divider">
                <td colSpan={results.length + 1}>
                  <i className="bi bi-briefcase-fill me-2 text-primary" />
                  <strong>COMMERCIAL &amp; PROCUREMENT TERMS</strong>
                </td>
              </tr>
              {(() => {
                const rows = [
                  { label: "Listed Price (excl. GST)", getVal: (p) => fmt(getDisplayPrice(p)) },
                  { label: "Manufacturer / Brand", getVal: (p) => p.brand || "OEM Verified" },
                  { label: "Catalog Model / SKU", getVal: (p) => p.sku || `IM-${p._id?.slice(-6).toUpperCase()}` },
                  { label: "Machinery Category", getVal: (p) => p.category || "Machinery" },
                  { label: "Pan-India Freight", getVal: () => "Covered / Direct Heavy Transit Telemetry" },
                  { label: "OEM Factory Warranty", getVal: (p) => getProductSpec(p, "Warranty") !== "—" ? getProductSpec(p, "Warranty") : "24 Months Comprehensive OEM" },
                  { label: "Stock & Dispatch Status", getVal: (p) => p.stock > 0 ? "Immediate Dispatch (24-48h)" : "Made to Order (2-3 Weeks)" },
                ];

                return rows.map((row) => {
                  const values = results.map((r) => row.getVal(r.product));
                  const isDiff = checkIsDifferent(values);
                  if (diffsOnly && !isDiff) return null;

                  return (
                    <tr key={row.label} className={highlightDiffs && isDiff ? "row-diff-highlight" : ""}>
                      <td className="spec-attr-col sticky-col">
                        <span>{row.label}</span>
                        {highlightDiffs && isDiff && <span className="diff-pill">DIFF</span>}
                      </td>
                      {results.map((r, i) => (
                        <td key={r.product._id} className="spec-val-col" data-product={r.product.brand || r.product.model || "Product"}>
                          {values[i]}
                        </td>
                      ))}
                    </tr>
                  );
                });
              })()}

              {/* SECTION: Core Engineering Specifications */}
              <tr className="spec-section-divider">
                <td colSpan={results.length + 1}>
                  <i className="bi bi-gear-wide-connected me-2 text-primary" />
                  <strong>CORE ENGINEERING SPECIFICATIONS</strong>
                </td>
              </tr>
              {dynamicSpecKeys.map((key) => {
                const values = results.map((r) => getProductSpec(r.product, key));
                const isDiff = checkIsDifferent(values);
                if (diffsOnly && !isDiff) return null;

                return (
                  <tr key={key} className={highlightDiffs && isDiff ? "row-diff-highlight" : ""}>
                    <td className="spec-attr-col sticky-col">
                      <span>{key}</span>
                      {highlightDiffs && isDiff && <span className="diff-pill">DIFF</span>}
                    </td>
                    {results.map((r, i) => (
                      <td key={r.product._id} className="spec-val-col fw-semibold" data-product={r.product.brand || r.product.model || "Product"}>
                        {values[i]}
                      </td>
                    ))}
                  </tr>
                );
              })}

              {/* SECTION: Protection, Standards & Environment */}
              <tr className="spec-section-divider">
                <td colSpan={results.length + 1}>
                  <i className="bi bi-shield-check me-2 text-primary" />
                  <strong>PROTECTION, ENVIRONMENTAL &amp; COMPLIANCE</strong>
                </td>
              </tr>
              {(() => {
                const envRows = [
                  { label: "Ingress Protection Rating", key: "Protection" },
                  { label: "Efficiency Classification", key: "Efficiency Class" },
                  { label: "Manufacturing Standards", key: "Standards" },
                  { label: "Operating Ambient Range", key: "Ambient Temperature" },
                  { label: "Duty Cycle Classification", key: "Duty Cycle" },
                ];

                return envRows.map((item) => {
                  const values = results.map((r) => getProductSpec(r.product, item.key));
                  const isDiff = checkIsDifferent(values);
                  if (diffsOnly && !isDiff) return null;

                  return (
                    <tr key={item.label} className={highlightDiffs && isDiff ? "row-diff-highlight" : ""}>
                      <td className="spec-attr-col sticky-col">
                        <span>{item.label}</span>
                        {highlightDiffs && isDiff && <span className="diff-pill">DIFF</span>}
                      </td>
                      {results.map((r, i) => (
                        <td key={r.product._id} className="spec-val-col" data-product={r.product.brand || r.product.model || "Product"}>
                          {values[i]}
                        </td>
                      ))}
                    </tr>
                  );
                });
              })()}

              {/* SECTION: Action Row in Table Footer */}
              <tr className="spec-action-row">
                <td className="spec-attr-col sticky-col">
                  <strong>Procurement Action</strong>
                </td>
                {results.map((r) => {
                  const inCart = isProductInCart(r.product);
                  return (
                    <td key={r.product._id} className="spec-val-col" data-product={r.product.brand || r.product.model || "Product"}>
                      <button
                        className={`btn btn-sm ${inCart ? "btn-success" : "btn-primary"} w-100`}
                        onClick={() => handleAddToCart(r.product, r.price > 0 ? r.price : getDisplayPrice(r.product))}
                      >
                        {inCart ? (
                          <>
                            <i className="bi bi-check2-circle me-1" /> Added to Cart
                          </>
                        ) : (
                          <>
                            <i className="bi bi-bag-plus me-1" /> Add to Cart
                          </>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Add Modal */}
      {showAddModal && (
        <div className="compare-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="compare-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="compare-modal-header">
              <div>
                <span className="eyebrow dark">EXPAND MATRIX</span>
                <h3 className="h5 mb-0">Add Industrial Machine</h3>
              </div>
              <button
                className="btn-modal-close"
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="compare-modal-search">
              <i className="bi bi-search" />
              <input
                type="text"
                placeholder="Search catalog by model, brand, or category..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="compare-modal-list">
              {loadingPicker ? (
                <div className="text-center py-4 text-secondary">
                  <div className="spinner-border spinner-border-sm me-2" />
                  Loading available equipment...
                </div>
              ) : availablePickerProducts.length > 0 ? (
                availablePickerProducts.map((p) => (
                  <div className="picker-product-item" key={p._id}>
                    <img
                      src={p.image || p.images?.[0]?.url || p.images?.[0] || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"}
                      alt=""
                    />
                    <div className="picker-product-info">
                      <strong className="picker-title">{p.name}</strong>
                      <span className="picker-meta">{p.brand} · {p.category}</span>
                      <span className="picker-price">{fmt(getDisplayPrice(p))}</span>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => addMachine(p)}>
                      <i className="bi bi-plus-lg me-1" /> Add
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-secondary">
                  No additional matching equipment found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Compare;
