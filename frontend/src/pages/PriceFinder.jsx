import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { fmt, getDisplayPrice } from "../utils/helpers";
import { notifyCartChanged } from "../utils/events";
import { addToCompareQueue } from "../utils/compareStorage";
import { SUPPORTED_PLATFORMS, detectPlatformClient } from "../utils/catalogData";
import Loading from "../components/common/Loading";
import ErrorState from "../components/common/ErrorState";

function PfAvailBadge({ av }) {
  if (!av || av === "check_live") return <span className="pf-avail-badge check"><i className="bi bi-question-circle" /> Check live</span>;
  if (av === "In Stock")  return <span className="pf-avail-badge in-stock"><i className="bi bi-circle-fill" style={{fontSize:"0.45rem"}} /> In Stock</span>;
  if (av === "Limited")   return <span className="pf-avail-badge limited"><i className="bi bi-circle-fill" style={{fontSize:"0.45rem"}} /> Limited</span>;
  return <span className="pf-avail-badge out"><i className="bi bi-x-circle" /> Out of Stock</span>;
}

function PfMatchedCard({ product, pastedPrice }) {
  const primary = (product.images || []).find((x) => x.isPrimary) || (product.images || [])[0];
  const image = typeof primary === "string" ? primary : primary?.url;
  const fallback = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80";
  const specs = { ...(product.specifications || {}), ...(product.technicalSpecifications || {}) };
  const specEntries = Object.entries(specs).slice(0, 6);
  return (
    <div className="pf-matched-card">
      <img src={image || fallback} alt={product.name} className="pf-matched-img"
        onError={(e) => { e.currentTarget.src = fallback; }} />
      <div className="pf-matched-body">
        <span className="pf-match-badge"><i className="bi bi-patch-check-fill" /> Catalog match found</span>
        <h2>{product.name}</h2>
        <div className="pf-meta">
          {product.brand && <span><strong>{product.brand}</strong> · Brand</span>}
          {product.model && <span><strong>{product.model}</strong> · Model</span>}
          {product.sku && <span><strong>{product.sku}</strong> · SKU</span>}
          {product.category && <span><strong>{product.category}</strong> · Category</span>}
          {product.rating > 0 && <span><i className="bi bi-star-fill text-warning" /> <strong>{product.rating.toFixed(1)}</strong></span>}
        </div>
        <div className="pf-match-prices" aria-label="Price comparison">
          <div className="pf-match-price our-price">
            <span><i className="bi bi-shop-window" /> Industry Mandi price</span>
            <strong>{product.price != null ? `₹${Number(product.price).toLocaleString("en-IN")}` : "Not available"}</strong>
          </div>
          <div className="pf-match-price pasted-price">
            <span><i className="bi bi-link-45deg" /> Pasted website price</span>
            <strong>{pastedPrice != null && pastedPrice > 0 ? `₹${Number(pastedPrice).toLocaleString("en-IN")}` : "Not available"}</strong>
          </div>
        </div>
        {specEntries.length > 0 && (
          <div className="product-spec-chips mb-2">
            {specEntries.map(([k, v]) => (
              <span className="spec-chip" key={k}>{k}: {String(v)}</span>
            ))}
          </div>
        )}
        <div className="d-flex gap-2 flex-wrap">
          <Link to={`/product/${product.slug || product._id}`} className="pf-action-btn primary">
            <i className="bi bi-eye" /> View on Industry Mandi
          </Link>
          <button
            className="pf-action-btn"
            onClick={() => {
              const cart = JSON.parse(localStorage.getItem("cart") || "[]");
              if (!cart.find((x) => String(x._id) === String(product._id))) {
                localStorage.setItem("cart", JSON.stringify([...cart, { ...product, quantity: 1 }]));
                window.dispatchEvent(new Event("cart-updated"));
              }
            }}
          >
            <i className="bi bi-cart-plus" /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function PfSubmittedProductDetails({ data, url }) {
  const extracted = data?.extracted || {};
  const specs = Object.entries(extracted.specifications || {}).slice(0, 8);
  const submittedUrl = data?.submittedUrl || url;
  return (
    <div className="dashboard-panel mb-4">
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div>
          <span className="eyebrow dark">SUBMITTED PRODUCT LINK</span>
          <h3 className="mb-1">{extracted.name || "Product details from submitted URL"}</h3>
          <p className="small text-secondary mb-2">{extracted.brand || extracted.model || extracted.category || "Details inferred from the submitted link"}</p>
        </div>
        <a className="btn btn-outline-primary btn-sm" href={submittedUrl} target="_blank" rel="noreferrer">
          <i className="bi bi-box-arrow-up-right me-1" /> Open pasted link
        </a>
      </div>
      <div className="small text-break text-secondary mb-3">{submittedUrl}</div>
      <div className="row g-2 small">
        {[
          ["Domain", (() => { try { return new URL(submittedUrl).hostname; } catch { return "—"; } })()],
          ["Brand", extracted.brand],
          ["Model", extracted.model],
          ["SKU", extracted.sku],
          ["GTIN", extracted.gtin],
          ["Category", extracted.category],
          ["Variant", extracted.variant],
          ["Capacity", extracted.capacity],
        ].filter(([, value]) => value).map(([label, value]) => (
          <div className="col-sm-6 col-lg-3" key={label}>
            <div className="border rounded p-2 h-100"><strong>{label}</strong><div className="text-secondary text-break">{value}</div></div>
          </div>
        ))}
      </div>
      {extracted.keywords?.length > 0 && (
        <div className="mt-3">
          <strong className="small">Detected keywords</strong>
          <div className="product-spec-chips mt-1">
            {extracted.keywords.slice(0, 20).map((keyword) => <span className="spec-chip" key={keyword}>{keyword}</span>)}
          </div>
        </div>
      )}
      {specs.length > 0 && (
        <div className="mt-3">
          <strong className="small">Extracted specifications</strong>
          <div className="product-spec-chips mt-1">
            {specs.map(([key, value]) => <span className="spec-chip" key={key}>{key}: {String(value)}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

function PriceFinder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState(searchParams.get("url") || "");
  const [detectedPlatform, setDetectedPlatform] = useState(null);
  const [state, setState] = useState({ loading: false, error: "", data: null });
  const [requestState, setRequestState] = useState({ saving: false, message: "", error: "" });

  // Detect platform as user types
  useEffect(() => {
    setDetectedPlatform(url.trim() ? detectPlatformClient(url) : null);
  }, [url]);

  const search = async (e) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;
    setState({ loading: true, error: "", data: null });
    try {
      const r = await api.post("/price-finder", { url: url.trim() });
      setState({ loading: false, error: "", data: r.data.data });
    } catch (err) {
      setState({ loading: false, error: err.response?.data?.message || err.message || "Failed to look up product.", data: null });
    }
  };

  const requestProduct = async () => {
    if (!state.data?.extracted) return;
    setRequestState({ saving: true, message: "", error: "" });
    try {
      const response = await api.post("/price-finder/requests", { url: url.trim(), extracted: state.data.extracted });
      setRequestState({ saving: false, message: response.data.message || "Product request submitted.", error: "" });
    } catch (err) {
      setRequestState({ saving: false, message: "", error: err.response?.data?.message || "Could not submit the request." });
    }
  };

  const hasExternal = state.data?.offers?.some((o) => o.fetch_required);
  const internalOffers = state.data?.offers?.filter((o) => !o.fetch_required) || [];
  const externalOffers = state.data?.offers?.filter((o) => o.fetch_required) || [];
  const bestPrice = internalOffers.find((o) => o.price)?.price;

  const fmtPrice = (p) => p != null ? `₹${Number(p).toLocaleString("en-IN")}` : "—";
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <main className="pf-page">
      <div className="container">
        {/* Hero / Input */}
        <section className="pf-hero">
          <span className="eyebrow dark">PRICE INTELLIGENCE</span>
          <h1>Paste a Product Link · Find Best Price</h1>
          <p>
            Paste any industrial product URL from Amazon, Flipkart, IndiaMART, Moglix, and more.
            We extract product details, check for an exact catalog product, then suggest relevant alternatives.
          </p>

          <form onSubmit={search}>
            <div className="pf-input-wrap">
              {detectedPlatform && (
                <div className="pf-detect-pill" style={{ color: detectedPlatform.color }}>
                  <span className="pip" style={{ background: detectedPlatform.color }} />
                  <img src={detectedPlatform.logo} alt={detectedPlatform.name} className="pf-detect-logo" />
                </div>
              )}
              <input
                type="url"
                placeholder="Paste product URL here — e.g. https://www.amazon.in/dp/B09XYZ..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <button type="submit" disabled={state.loading}>
                {state.loading ? <><i className="bi bi-arrow-repeat spin me-1" />Matching…</> : <><i className="bi bi-search me-1" />Find Best Price</>}
              </button>
            </div>
          </form>

          <div className="pf-supported">
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>Supported:</span>
            {SUPPORTED_PLATFORMS.map((p) => (
              <span
                key={p.id}
                className={`pf-platform-chip ${detectedPlatform?.id === p.id ? "active" : ""}`}
                style={detectedPlatform?.id === p.id ? { color: p.color } : {}}
                title={p.name}
              >
                <img src={p.logo} alt={p.name} className={`pf-platform-logo ${p.id}`} />
              </span>
            ))}
          </div>
        </section>

        {/* Error */}
        {state.error && (
          <div className="alert alert-danger d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-circle" />
            {state.error}
          </div>
        )}

        {/* Loading skeleton */}
        {state.loading && (
          <div className="pf-skeleton">
            {[1, 2, 3, 4].map((i) => <div className="pf-skeleton-row" key={i} />)}
          </div>
        )}

        {/* Results */}
        {state.data && !state.loading && (
          <div className="pf-results">

            <PfSubmittedProductDetails data={state.data} url={url} />
            {state.data.extractionStatus === "failed" ? (
              <div className="pf-no-match">
                <i className="bi bi-cloud-slash" />
                <h3>Unable to retrieve product information</h3>
                <p>{state.data.extractionError?.message || "Unable to retrieve product information from this URL."}</p>
              </div>
            ) : state.data.matched ? (
              <PfMatchedCard product={state.data.matched} pastedPrice={state.data.extracted?.price} />
            ) : state.data.similar?.length > 0 ? (
              <div className="dashboard-panel mb-4 p-3 border rounded" style={{ background: "rgba(37, 99, 235, 0.08)", borderColor: "rgba(37, 99, 235, 0.25)" }}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className="bi bi-search text-primary" style={{ fontSize: "1.2rem" }} />
                  <h3 className="mb-0 fs-5">Matching Catalog Products Found ({state.data.similar.length})</h3>
                </div>
                <p className="small text-secondary mb-0">
                  We found products in our catalog related to keywords from your submitted link. Click any product below to compare prices and view full details.
                </p>
                {state.data.extractionWarning && <p className="small text-warning mt-2 mb-0">{state.data.extractionWarning}</p>}
              </div>
            ) : (
              <div className="pf-no-match">
                <i className="bi bi-search" />
                <h3>No matching products found in our catalog</h3>
                <p>The product details were extracted, but no matching catalog items or related keywords were found.</p>
                {state.data.extractionWarning && <p className="small text-warning mb-3">{state.data.extractionWarning}</p>}
                {requestState.message ? <div className="alert alert-success mb-0">{requestState.message}</div> : <>
                  {requestState.error && <div className="alert alert-danger">{requestState.error}</div>}
                  <button type="button" className="btn btn-primary mt-2" disabled={requestState.saving} onClick={requestProduct}>
                    {requestState.saving ? "Submitting…" : <><i className="bi bi-plus-circle me-2" />Request This Product</>}
                  </button>
                </>}
              </div>
            )}

            {/* External disclaimer */}
            {hasExternal && (
              <div className="pf-disclaimer">
                <i className="bi bi-info-circle-fill" />
                <div>
                  <strong>External platform prices</strong> — Live pricing from third-party platforms requires official API credentials (Amazon PA-API, Flipkart Affiliate API, etc.).
                  External rows link directly to the product page so you can verify the current price. Industry Mandi does not scrape or violate any platform's Terms of Service.
                </div>
              </div>
            )}

            {/* Price table */}
            {state.data.offers?.length > 0 && (
              <div className="pf-table-wrap">
                <div className="pf-table-header">
                  <h3><i className="bi bi-table me-2" />Price Comparison Table</h3>
                  {bestPrice && (
                    <span className="pf-best-badge">
                      <i className="bi bi-lightning-fill" /> Best price: {fmtPrice(bestPrice)}
                    </span>
                  )}
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="pf-table">
                    <thead>
                      <tr>
                        <th>Platform</th>
                        <th>Seller</th>
                        <th>Price</th>
                        <th>MRP</th>
                        <th>Discount</th>
                        <th>Availability</th>
                        <th>Shipping</th>
                        <th>Last Updated</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.data.offers.map((offer, idx) => (
                        <tr key={idx} className={idx === 0 && !offer.fetch_required ? "pf-best-row" : ""}>
                          <td>
                            <div className="pf-platform-cell">
                              <span className="pf-platform-dot" style={{ background: offer.platform_color }} />
                              <span>{offer.platform}</span>
                              {idx === 0 && !offer.fetch_required && (
                                <span className="pf-best-badge" style={{ marginLeft: 4 }}><i className="bi bi-lightning-fill" /> Best</span>
                              )}
                            </div>
                          </td>
                          <td>{offer.seller}</td>
                          <td>
                            {offer.fetch_required ? (
                              <span className="pf-fetch-required">Visit site →</span>
                            ) : (
                              <span className="pf-price-cell">{fmtPrice(offer.price)}</span>
                            )}
                          </td>
                          <td><span className="pf-mrp-cell">{fmtPrice(offer.mrp)}</span></td>
                          <td>
                            {offer.discount > 0 && (
                              <span className="pf-discount-cell">−{offer.discount}%</span>
                            )}
                          </td>
                          <td><PfAvailBadge av={offer.availability} /></td>
                          <td style={{ fontSize: "0.82rem" }}>
                            {offer.fetch_required ? "—" : offer.shipping === 0 ? <span style={{ color: "#22c55e" }}>Free</span> : fmtPrice(offer.shipping)}
                          </td>
                          <td><span className="pf-timestamp">{fmtDate(offer.last_updated)}</span></td>
                          <td>
                            <a
                              href={offer.url.startsWith("http") ? offer.url : `${window.location.origin}${offer.url}`}
                              target={offer.source === "external" ? "_blank" : "_self"}
                              rel="noopener noreferrer"
                              className={`pf-action-btn ${!offer.fetch_required && idx === 0 ? "primary" : ""}`}
                            >
                              {offer.source === "internal" ? <><i className="bi bi-bag-check" /> Buy</> : <><i className="bi bi-box-arrow-up-right" /> View</>}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Similar products */}
            {state.data.similar?.length > 0 && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <span className="eyebrow dark d-block">{state.data.matched ? "RELATED PRODUCTS" : "MATCHING PRODUCTS"}</span>
                    <h3 className="mt-1 mb-0">
                      {state.data.matched
                        ? (state.data.extracted?.category ? `More ${state.data.extracted.category} products` : "More matching products")
                        : "Products matching your link keywords"}
                    </h3>
                  </div>
                </div>
                <div className="pf-similar-grid">
                  {state.data.similar.map((p) => {
                    const img = (p.images || [])[0];
                    const imgUrl = typeof img === "string" ? img : img?.url;
                    const fallback = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80";
                    return (
                      <Link
                        key={p._id}
                        to={`/product/${p.slug || p._id}`}
                        className="text-decoration-none"
                        onClick={() => setUrl("")}>
                        <div style={{
                          background: "var(--glass-bg)",
                          border: "1px solid var(--glass-border)",
                          borderRadius: 12,
                          overflow: "hidden",
                          transition: "border-color 0.2s, transform 0.15s",
                          cursor: "pointer",
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.transform = "none"; }}
                        >
                          <div style={{ height: 140, overflow: "hidden", background: "#111" }}>
                            <img
                              src={imgUrl || fallback}
                              alt={p.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => { e.currentTarget.src = fallback; }}
                            />
                          </div>
                          <div style={{ padding: "12px" }}>
                            <div className="product-brand-tag mb-1"><span>{p.brand}</span><span className="verified-dot">✓</span></div>
                            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)", marginBottom: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.category}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--primary)", marginTop: 4, fontWeight: 600 }}>{p.confidence}% relevance</div>
                            {p.price > 0 && <div style={{ fontWeight: 800, color: "#22c55e", marginTop: 6 }}>{fmtPrice(p.price)}</div>}
                            <button
                              type="button"
                              className="btn btn-sm btn-primary mt-2 w-100"
                              style={{ fontSize: "0.76rem", padding: "4px 8px" }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setState((prev) => ({
                                  ...prev,
                                  data: {
                                    ...prev.data,
                                    matched: p,
                                    matchType: "similar",
                                    offers: prev.data.offers?.length ? prev.data.offers : [
                                      {
                                        platform: "Industry Mandi",
                                        platform_color: "#3b82f6",
                                        seller: "Direct OEM Partner",
                                        price: p.price,
                                        mrp: p.price ? Math.round(p.price * 1.15) : null,
                                        discount: 13,
                                        availability: "in_stock",
                                        shipping: 0,
                                        last_updated: new Date(),
                                        url: `/product/${p.slug || p._id}`,
                                        source: "internal",
                                        fetch_required: false,
                                      }
                                    ]
                                  }
                                }));
                              }}
                            >
                              <i className="bi bi-check2-circle me-1" /> View Best Price Table
                            </button>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No offers */}
            {state.data.matched && state.data.offers?.length === 0 && (
              <div className="pf-no-match">
                <i className="bi bi-tag" />
                <h3>No active offers yet</h3>
                <p>This product is in our catalog but has no approved vendor offers at the moment. Check back soon or browse similar products.</p>
              </div>
            )}
          </div>
        )}

        {/* Intro info — before any search */}
        {!state.data && !state.loading && !state.error && (
          <div className="row g-4 mt-2">
            {[
              { icon: "bi-link-45deg", title: "Paste any product link", body: "Works with Amazon India, Flipkart, IndiaMART, TradeIndia, IndustryBuying, Moglix and more." },
              { icon: "bi-search", title: "We match it instantly", body: "Our engine identifies the product by model number, SKU, brand and specifications against our catalog." },
              { icon: "bi-table", title: "Unified price table", body: "See prices from all our approved vendors and external sources sorted from lowest to highest." },
              { icon: "bi-shield-check", title: "No scraping · Always compliant", body: "We use official affiliate APIs and product feeds only. External links open in the source platform." },
            ].map((card) => (
              <div className="col-md-3 col-sm-6" key={card.title}>
                <div style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: 14,
                  padding: "24px",
                  height: "100%",
                }}>
                  <i className={`bi ${card.icon} fs-2 text-primary d-block mb-3`} />
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{card.title}</h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>{card.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default PriceFinder;
