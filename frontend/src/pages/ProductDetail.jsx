import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { fmt, getDisplayPrice } from "../utils/helpers";
import { notifyCartChanged, notifyWishlistChanged } from "../utils/events";
import { addToCompareQueue, removeFromCompareQueue } from "../utils/compareStorage";
import { INDUSTRIAL_CATALOG } from "../utils/catalogData";
import RecommendationCard from "../components/cards/RecommendationCard";
import Loading from "../components/common/Loading";
import ErrorState from "../components/common/ErrorState";
import ConfirmationModal from "../components/common/ConfirmationModal";

function Product() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [recommendations, setRecommendations] = useState({ loading: true, data: null });
  const [wishMessage, setWishMessage] = useState("");
  const [cartAdded, setCartAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const product = state.data?.product;
  const productId = product?._id;

  const load = () => {
    setState({ loading: true, data: null, error: "" });
    api
      .get(`/products/${slug}`)
      .then((r) => setState({ loading: false, data: r.data.data, error: "" }))
      .catch((e) => {
        const saved = localStorage.getItem(`catalogProduct:${slug}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setState({ loading: false, data: { product: parsed, offers: [], bestOffer: null, reviews: [] }, error: "" });
            return;
          } catch {}
        }
        const fallback = INDUSTRIAL_CATALOG.find((p) => p.slug === slug || p._id === slug);
        if (fallback) {
          setState({ loading: false, data: { product: fallback, offers: [], bestOffer: null, reviews: [] }, error: "" });
          return;
        }
        setState({ loading: false, data: null, error: e.response?.data?.message || e.message });
      });
  };

  useEffect(() => {
    load();
  }, [slug]);

  useEffect(() => {
    let active = true;
    setRecommendations({ loading: true, data: null });

    const applyFallback = () => {
      if (!active) return;
      const currentProd = product || INDUSTRIAL_CATALOG.find((p) => p.slug === slug || p._id === slug);
      const currentCat = currentProd?.category;
      const others = INDUSTRIAL_CATALOG.filter((p) => p.slug !== slug && p._id !== slug);
      const catMatches = others.filter((p) => !currentCat || p.category === currentCat);
      const similarPool = catMatches.length >= 2 ? catMatches : others;
      const similar = similarPool.slice(0, 4).map((p) => ({
        product: p,
        reason: `Matched by category (${p.category}) & technical tier`
      }));
      const diffCatMatches = others.filter((p) => p.category !== currentCat);
      const boughtTogether = (diffCatMatches.length ? diffCatMatches : others).slice(0, 3).map((p) => ({
        product: p,
        reason: "Suggested companion machinery for plant setup",
        fallback: true
      }));
      setRecommendations({
        loading: false,
        data: {
          similar,
          boughtTogether,
          boughtTogetherBasedOnOrders: false
        }
      });
    };

    api.get(`/products/${slug}/recommendations`)
      .then((response) => {
        if (!active) return;
        const resData = response.data?.data;
        if (resData && (resData.similar?.length || resData.boughtTogether?.length)) {
          setRecommendations({ loading: false, data: resData });
        } else {
          applyFallback();
        }
      })
      .catch(() => {
        applyFallback();
      });

    return () => { active = false; };
  }, [slug, product]);

  const getStoredCompareIds = () => {
    try {
      const list = JSON.parse(localStorage.getItem("compareProducts") || "[]");
      return list.map((item) => String(item._id));
    } catch {
      return [];
    }
  };
  const [compareIds, setCompareIds] = useState(getStoredCompareIds);

  useEffect(() => {
    const onCompare = () => setCompareIds(getStoredCompareIds());
    window.addEventListener("compare-updated", onCompare);
    return () => window.removeEventListener("compare-updated", onCompare);
  }, []);

  const isCompared = compareIds.includes(String(productId));

  const handleCompareToggle = () => {
    if (!product) return;
    if (isCompared) {
      removeFromCompareQueue(product._id);
      setWishMessage("Removed from comparison queue.");
    } else {
      const next = addToCompareQueue(product);
      if (next && next.some((p) => String(p._id) === String(product._id))) {
        setWishMessage("Added to comparison queue.");
      }
    }
  };

  useEffect(() => {
    if (!productId) {
      setIsWishlisted(false);
      return;
    }
    const checkWish = () => {
      try {
        const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
        setIsWishlisted(list.some((item) => String(item._id) === String(productId)));
      } catch {
        setIsWishlisted(false);
      }
    };
    checkWish();
    window.addEventListener("wishlist-updated", checkWish);
    return () => window.removeEventListener("wishlist-updated", checkWish);
  }, [productId]);

  if (state.loading) return <Loading label="Loading machinery intelligence…" />;
  if (state.error || !state.data?.product) return <ErrorState message={state.error || "Product not found"} onRetry={load} />;

  const { offers = [], bestOffer = null, reviews = [] } = state.data;

  const handleWishlistToggle = async () => {
    if (!product) return;
    const currentWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    const isAlready = currentWishlist.some((item) => String(item._id) === String(product._id));

    if (user?.role === "buyer" && product._id && product._id.length === 24) {
      try {
        const response = await api.post(`/buyer/wishlist/${product._id}`);
        const updatedList = Array.isArray(response.data?.data) ? response.data.data : [];
        localStorage.setItem("wishlist", JSON.stringify(updatedList));
        notifyWishlistChanged(updatedList);
        setIsWishlisted(updatedList.some((item) => String(item._id) === String(product._id)));
        setWishMessage(isAlready ? "Removed from wishlist." : "Saved to wishlist.");
        return;
      } catch (e) {
        setWishMessage(e.response?.data?.message || e.message);
        return;
      }
    }

    const next = isAlready
      ? currentWishlist.filter((item) => String(item._id) !== String(product._id))
      : [...currentWishlist, product];
    localStorage.setItem("wishlist", JSON.stringify(next));
    notifyWishlistChanged(next);
    setIsWishlisted(!isAlready);
    setWishMessage(isAlready ? "Removed from wishlist." : "Saved to wishlist.");
  };

  const addToCart = () => {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => String(item._id) === String(product._id));
    localStorage.setItem("cart", JSON.stringify(existing ? cart.map((item) => String(item._id) === String(product._id) ? { ...item, quantity: (item.quantity || 1) + 1 } : item) : [...cart, { ...product, price: getDisplayPrice(product), quantity: 1 }]));
    notifyCartChanged();
    setCartAdded(true);
  };
  const primary = (product.images || []).find((x) => x.isPrimary) || (product.images || [])[0];
  const heroImage = typeof primary === "string" ? primary : primary?.url || product.image || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80";
  const displayPrice = bestOffer?.price || product.price || getDisplayPrice(product) || 45000;
  const oldPrice = product.oldPrice || Math.round(displayPrice * 1.15);
  const discountPercent = oldPrice > displayPrice ? Math.round(((oldPrice - displayPrice) / oldPrice) * 100) : null;

  return (
    <main className="container py-4 product-detail-page">
      {/* Breadcrumbs */}
      <nav className="product-breadcrumbs mb-3" aria-label="breadcrumb">
        <Link to="/">Home</Link>
        <i className="bi bi-chevron-right" />
        <Link to="/products">Machinery Catalog</Link>
        <i className="bi bi-chevron-right" />
        <Link to={`/products?category=${encodeURIComponent(product.category || "")}`}>{product.category || "Industrial Equipment"}</Link>
        <i className="bi bi-chevron-right" />
        <span>{product.name}</span>
      </nav>

      {/* Hero Section: Fitted 2-Column Grid */}
      <div className="row g-4 align-items-stretch mb-4">
        {/* Left Column: Product Gallery & Trust Strip */}
        <div className="col-lg-6 d-flex flex-column">
          <div className="product-gallery-card h-100 d-flex flex-column justify-content-between">
            <div className="product-hero-art">
              <img src={heroImage} alt={product.name} />
              <span className="oem-verified-badge" style={{ top: 14, left: 14, right: "auto", position: "absolute" }}>
                <i className="bi bi-patch-check-fill" /> OEM Verified Listing
              </span>
              {product.badge && product.badge !== "OEM VERIFIED" && (
                <span className="sale-pill new" style={{ top: 14, right: 14, left: "auto", position: "absolute" }}>
                  {product.badge}
                </span>
              )}
            </div>

            <div className="product-trust-strip mt-3">
              <div className="trust-pill">
                <i className="bi bi-shield-check" />
                <div>
                  <strong>Escrow Gate Inspection</strong>
                  <span>Funds released upon physical verification</span>
                </div>
              </div>
              <div className="trust-pill">
                <i className="bi bi-truck" />
                <div>
                  <strong>Pan-India Freight</strong>
                  <span>Insured transit with live GPS tracking</span>
                </div>
              </div>
              <div className="trust-pill">
                <i className="bi bi-file-earmark-check" />
                <div>
                  <strong>OEM Test Certificate</strong>
                  <span>Factory serial test report included</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Telemetry, Pricing & Actions */}
        <div className="col-lg-6 d-flex flex-column">
          <div className="product-info-card h-100 justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between gap-2 mb-2 flex-wrap">
                <span className="product-brand-badge">
                  <i className="bi bi-building me-1" /> {product.brand || "OEM Manufacturer"}
                </span>
                <span className="product-sku-tag font-monospace">
                  SKU: {product.sku || `IM-${product._id ? String(product._id).slice(-6).toUpperCase() : "10492"}`}
                </span>
              </div>

              <h1 className="product-detail-title">{product.name}</h1>

              <div className="d-flex align-items-center gap-3 my-2 flex-wrap">
                <div className="d-flex align-items-center gap-1 text-warning small">
                  <i className="bi bi-star-fill" />
                  <strong>{product.rating || "4.8"}</strong>
                  <span className="text-secondary ms-1">({product.reviewCount || 24} verified buyer reviews)</span>
                </div>
                <span className="text-secondary">·</span>
                <span className="badge bg-dark-subtle text-info-emphasis border border-info-subtle">
                  <i className="bi bi-patch-check me-1" /> ISO 9001:2015 Tier-1
                </span>
              </div>

              {/* Pricing Box */}
              <div className="product-pricing-box my-3">
                <span className="pricing-eyebrow">VERIFIED OEM DIRECT PRICE</span>
                <div className="d-flex align-items-baseline gap-3 my-1 flex-wrap">
                  <span className="display-price">{fmt(displayPrice)}</span>
                  {oldPrice && (
                    <>
                      <del className="old-price">{fmt(oldPrice)}</del>
                      {discountPercent && <span className="discount-badge">Save {discountPercent}%</span>}
                    </>
                  )}
                </div>
                <div className="pricing-meta">
                  <span><i className="bi bi-check-circle-fill text-success me-1" /> Excl. 18% GST (Tax Invoice Provided)</span>
                  <span><i className="bi bi-box-seam text-primary me-1" /> In Stock · Ready for dispatch within 24 hours</span>
                </div>
              </div>

              {/* Action Cluster with prominent Compare Button */}
              <div className="product-action-cluster my-3">
                <div className="d-flex gap-2 flex-wrap">
                  {/* 1. Add to Cart */}
                  <button
                    className={`btn btn-lg ${cartAdded ? "btn-success" : "btn-primary"} flex-grow-1`}
                    onClick={addToCart}
                  >
                    <i className={`bi ${cartAdded ? "bi-check2-circle" : "bi-cart-plus"} me-2`} />
                    {cartAdded ? "Added to Cart" : "Add to Cart"}
                  </button>

                  {/* 2. Compare Products Button (Requested!) */}
                  <button
                    className={`btn btn-lg ${isCompared ? "btn-info text-white" : "btn-outline-primary"} flex-grow-1`}
                    onClick={handleCompareToggle}
                    title="Add to SpecMatrix Compare"
                  >
                    <i className={`bi ${isCompared ? "bi-check2-circle" : "bi-arrow-left-right"} me-2`} />
                    {isCompared ? "In Comparison" : "Compare Product"}
                  </button>

                  {/* 3. Wishlist Button */}
                  <button
                    className={`btn btn-lg ${isWishlisted ? "btn-danger" : "btn-outline-secondary"}`}
                    onClick={handleWishlistToggle}
                    title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                  >
                    <i className={`bi ${isWishlisted ? "bi-heart-fill" : "bi-heart"}`} />
                  </button>
                </div>

                {/* Secondary Compare Row: Direct Matrix Launch */}
                <div className="compare-quick-row">
                  <span className="small text-secondary">
                    <i className="bi bi-cpu me-1" /> Side-by-side spec comparison
                  </span>
                  <Link
                    to={`/compare?ids=${[product._id, ...compareIds.filter(id => id !== String(product._id))].slice(0, 4).join(",")}`}
                    className="btn btn-sm btn-outline-info text-decoration-none"
                  >
                    <i className="bi bi-table me-1" />
                    Launch SpecMatrix Compare ({compareIds.includes(String(product._id)) ? compareIds.length : compareIds.length + 1}) <i className="bi bi-arrow-right ms-1" />
                  </Link>
                </div>

                {wishMessage && (
                  <div className="alert alert-success py-2 px-3 mt-2 mb-0 small d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill" /> {wishMessage}
                  </div>
                )}
              </div>

              {/* Roles links */}
              {user?.role === "vendor" && (
                <Link className="btn btn-primary btn-sm mb-2" to={`/vendor/pairing?product=${product._id}`}>
                  <i className="bi bi-link-45deg me-1" /> Pair this product
                </Link>
              )}
              {user?.role === "admin" && (
                <Link className="btn btn-outline-primary btn-sm mb-2" to="/admin/pairings?status=pending">
                  <i className="bi bi-link-45deg me-1" /> Review pairings for this product
                </Link>
              )}
            </div>

            {/* Product Summary / Description */}
            <div className="product-summary-block pt-2">
              <h3 className="h6 text-uppercase fw-bold text-secondary mb-1">Equipment Overview</h3>
              <p className="text-secondary mb-0 small leading-relaxed">{product.description || "High-performance precision industrial equipment built for continuous continuous production and demanding industrial environments."}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Technical Specifications Grid & OEM Details (if present) */}
      {(Object.keys(product.specifications || {}).length > 0 ||
        Object.keys(product.technicalSpecifications || {}).length > 0 ||
        product.oemManual?.url) && (
        <div className="row g-4 mb-4">
          {Object.keys(product.specifications || {}).length > 0 && (
            <div className={Object.keys(product.technicalSpecifications || {}).length > 0 ? "col-lg-6" : "col-12"}>
              <div className="spec-matrix-card h-100">
                <h2><i className="bi bi-sliders text-primary" /> Technical Specifications</h2>
                <div className="spec-grid">
                  {Object.entries(product.specifications || {}).map(([k, v]) => (
                    <div key={k}>
                      <span>{k}</span>
                      <b>{String(v)}</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {Object.keys(product.technicalSpecifications || {}).length > 0 && (
            <div className={Object.keys(product.specifications || {}).length > 0 ? "col-lg-6" : "col-12"}>
              <div className="spec-matrix-card h-100">
                <h2><i className="bi bi-award text-primary" /> OEM Technical Details &amp; Standards</h2>
                <div className="spec-grid">
                  {Object.entries(product.technicalSpecifications || {}).map(([k, v]) => (
                    <div key={k}>
                      <span>{k}</span>
                      <b>{String(v)}</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {product.oemManual?.url && (
            <div className="col-12">
              <a className="btn btn-outline-primary" href={product.oemManual.url} target="_blank" rel="noreferrer">
                <i className="bi bi-file-earmark-pdf me-2" />
                {product.oemManual.title || "Download Factory Manual & Wiring Diagram"}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Verified Vendor Offers & Verified Buyer Reviews — in ONE line (side by side in 2 equal columns) */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="vendor-offers-card h-100">
            <h3 className="h5 mb-3 text-white"><i className="bi bi-shop text-primary me-2" /> Verified Vendor Offers</h3>
            {offers.length ? (
              offers.map((o) => (
                <div className="offer-row align-items-center mb-2 p-2 rounded bg-dark-subtle" key={o._id}>
                  <span>
                    <strong>{o.vendor?.profile?.company || o.vendor?.name}</strong>
                    <br />
                    <small className="text-secondary">{o.stock?.replace("_", " ") || "In Stock"}</small>
                  </span>
                  <div className="d-flex align-items-center gap-2">
                    <b className="text-white">{fmt(o.price)}</b>
                    {o.sellerUrl ? (
                      <a className="btn btn-sm btn-outline-primary" href={o.sellerUrl} target="_blank" rel="noreferrer">
                        Buy
                      </a>
                    ) : (
                      <span className="badge bg-success">Direct</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-secondary small bg-dark-subtle rounded">
                <i className="bi bi-shield-check text-success me-1" /> Direct OEM Factory Allocation. Certified by Industry Mandi Exchange.
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="reviews-card h-100">
            <h3 className="h5 mb-3 text-white"><i className="bi bi-chat-square-quote text-primary me-2" /> Verified Buyer Reviews</h3>
            {reviews.length ? (
              reviews.map((r) => (
                <div className="review mb-3 pb-2 border-bottom border-secondary-subtle" key={r._id}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong className="text-white small">{r.title}</strong>
                    <span className="text-warning small">★ {r.rating}</span>
                  </div>
                  <p className="text-secondary small mb-0">{r.review}</p>
                </div>
              ))
            ) : (
              <p className="text-secondary small mb-0">No buyer reviews yet. Verified procurement reviews are published after physical delivery confirmation.</p>
            )}
          </div>
        </div>
      </div>
      {!recommendations.loading && recommendations.data && (
        <section className="recommendations-section" aria-label="Product recommendations">
          {recommendations.data.similar?.length > 0 && (
            <>
              <div className="recommendation-heading">
                <div>
                  <span className="eyebrow dark">PRECISION SPEC MATCHING</span>
                  <h2>Similar products &amp; alternatives</h2>
                  <p>Compare verified industrial alternatives with comparable technical specifications.</p>
                </div>
                <Link to={`/products?category=${encodeURIComponent(product.category || "")}`} className="view-link">
                  View all in {product.category || "category"} <i className="bi bi-arrow-right" />
                </Link>
              </div>
              <div className="recommendation-grid">
                {recommendations.data.similar.map(({ product: item, reason }) => (
                  <RecommendationCard key={item._id} product={item} reason={reason} />
                ))}
              </div>
            </>
          )}

          {recommendations.data.boughtTogether?.length > 0 && (
            <>
              <div className="recommendation-heading bought-together-heading">
                <div>
                  <span className="eyebrow dark">COMPLETE YOUR INSTALLATION</span>
                  <h2>Frequently bought together</h2>
                  <p>{recommendations.data.boughtTogetherBasedOnOrders ? "Based on verified plant procurement and marketplace order patterns." : "Suggested companion machinery and accessories for complete commissioning."}</p>
                </div>
              </div>
              <div className="recommendation-grid">
                {recommendations.data.boughtTogether.map(({ product: item, reason, fallback }) => (
                  <RecommendationCard key={item._id} product={item} reason={reason} fallback={fallback} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}


export default Product;
