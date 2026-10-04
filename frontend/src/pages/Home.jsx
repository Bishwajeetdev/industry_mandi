import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { fmt, getDisplayPrice } from "../utils/helpers";
import { notifyCartChanged, notifyWishlistChanged } from "../utils/events";
import { addToCompareQueue } from "../utils/compareStorage";
import { INDUSTRIAL_CATALOG } from "../utils/catalogData";
import useProducts from "../hooks/useProducts";
import industrialPlantHero from "../assets/industrial-plant-hero.jpg";

function Home() {
  const state = useProducts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Trending");
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");

  const getStoredWishlistIds = () => {
    try {
      const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
      return list.map((item) => String(item._id));
    } catch {
      return [];
    }
  };
  const getStoredCompareIds = () => {
    try {
      const list = JSON.parse(localStorage.getItem("compareProducts") || "[]");
      return list.map((item) => String(item._id));
    } catch {
      return [];
    }
  };
  const getStoredCartIds = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      return cart.map((item) => String(item._id));
    } catch {
      return [];
    }
  };

  const [wishlistIds, setWishlistIds] = useState(getStoredWishlistIds);
  const [compareIds, setCompareIds] = useState(getStoredCompareIds);
  const [addedCartIds, setAddedCartIds] = useState(getStoredCartIds);

  useEffect(() => {
    const onWishlist = () => setWishlistIds(getStoredWishlistIds());
    const onCompare = () => setCompareIds(getStoredCompareIds());
    const onCart = () => setAddedCartIds(getStoredCartIds());

    window.addEventListener("wishlist-updated", onWishlist);
    window.addEventListener("compare-updated", onCompare);
    window.addEventListener("cart-updated", onCart);

    return () => {
      window.removeEventListener("wishlist-updated", onWishlist);
      window.removeEventListener("compare-updated", onCompare);
      window.removeEventListener("cart-updated", onCart);
    };
  }, []);

  const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  ];

  const fallbackProducts = INDUSTRIAL_CATALOG;
  const products = state.items.length
    ? state.items.map((product, index) => {
        const rawImg = product.images?.[0]?.url || product.images?.[0] || product.image;
        const validImg = rawImg && !rawImg.includes("photo-1581092335397-9583fe92d232")
          ? rawImg
          : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
        return {
          ...product,
          image: validImg,
          price: product.price || fallbackProducts[index % fallbackProducts.length].price,
          oldPrice: product.oldPrice || fallbackProducts[index % fallbackProducts.length].oldPrice,
          badge: index % 3 === 0 ? "OEM VERIFIED" : "IN STOCK",
        };
      })
    : fallbackProducts;

  const categoryIcons = {
    motors: "bi-gear-wide-connected", drives: "bi-speedometer2", cnc: "bi-cpu", pumps: "bi-droplet-half",
    hydraulic: "bi-droplet-half", automation: "bi-diagram-3", switchgear: "bi-lightning-charge",
    testing: "bi-speedometer2", starter: "bi-power", sensor: "bi-broadcast-pin", telemetry: "bi-broadcast-pin",
    cable: "bi-bezier2", wiring: "bi-bezier2", safety: "bi-shield-check", lighting: "bi-lightbulb",
  };
  const categories = useMemo(() => [...new Set(products.map((product) => String(product.category || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 10)
    .map((name) => [Object.entries(categoryIcons).find(([term]) => name.toLowerCase().includes(term))?.[1] || "bi-box-seam", name]), [products]);
  const brands = ["SIEMENS", "ABB", "SCHNEIDER ELECTRIC", "L&T HEAVY ENG", "KIRLOSKAR", "DANFOSS", "CROMPTON", "HAVELLS INDUSTRIAL", "HONEYWELL"];
  const benefits = [["bi-truck", "Pan-India Freight Logistics", "Heavy equipment transport with real-time transit telemetry"], ["bi-patch-check", "Verified Manufacturer Specs", "Zero counterfeit risk with direct OEM test reports"], ["bi-shield-lock", "Escrow Milestone Payments", "Funds released strictly upon physical gate inspection"], ["bi-calculator", "Direct OEM Bulk Pricing", "Volume-tier matrix pricing without middleman markups"], ["bi-cpu", "AI-Powered Spec Matching", "Automated pairing of exact equipment equivalents"]];
  const promos = [{ title: "Precision CNC Centers.", copy: "Sub-micron accuracy and automated tool changers.", className: "promo-cobalt", icon: "bi-cpu" }, { title: "Severe-Duty Motors.", copy: "IE3/IE4 efficiency ratings with IP55 protection.", className: "promo-blue", icon: "bi-gear-wide-connected" }, { title: "Process Automation.", copy: "Field-programmable controllers and telemetry nodes.", className: "promo-ink", icon: "bi-diagram-3" }];
  
  const displayProducts = useMemo(() => {
    if (activeTab === "Trending") return products.slice(0, 8);
    const filtered = products.filter((p) => {
      const cat = (p.category || "").toLowerCase();
      const tab = activeTab.toLowerCase();
      if (tab.includes("motors") && (cat.includes("motor") || cat.includes("drive"))) return true;
      if (tab.includes("cnc") && cat.includes("cnc")) return true;
      if (tab.includes("pump") && cat.includes("pump")) return true;
      if (tab.includes("automation") && (cat.includes("process") || cat.includes("automation") || cat.includes("sensor"))) return true;
      return cat.includes(tab);
    });
    return filtered.length ? filtered.slice(0, 8) : products.slice(0, 8);
  }, [products, activeTab]);

  const addNotice = (message) => { setNotice(message); window.setTimeout(() => setNotice(""), 2400); };
  const productImage = (product, index = 0) => {
    if (product?.image && !product.image.includes("photo-1581092335397-9583fe92d232")) {
      return product.image;
    }
    return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  };
  const formatPrice = (price) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price || 0);
  const saveWishlist = async (product) => {
    const currentWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    const isAlready = currentWishlist.some((item) => String(item._id) === String(product._id));

    if (user?.role === "buyer" && product._id && product._id.length === 24) {
      try {
        const response = await api.post(`/buyer/wishlist/${product._id}`);
        const updatedList = Array.isArray(response.data?.data) ? response.data.data : [];
        localStorage.setItem("wishlist", JSON.stringify(updatedList));
        notifyWishlistChanged(updatedList);
        setWishlistIds(updatedList.map((x) => String(x._id)));
        addNotice(isAlready ? "Removed from wishlist" : "Added to your wishlist");
        return;
      } catch {
        addNotice("Could not update wishlist");
        return;
      }
    }

    const next = isAlready
      ? currentWishlist.filter((item) => String(item._id) !== String(product._id))
      : [...currentWishlist, product];
    localStorage.setItem("wishlist", JSON.stringify(next));
    notifyWishlistChanged(next);
    setWishlistIds(next.map((x) => String(x._id)));
    addNotice(isAlready ? "Removed from wishlist" : "Added to your wishlist");
  };
  const compareProduct = (product) => {
    addToCompareQueue(product);
  };
  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => String(item._id) === String(product._id));
    localStorage.setItem("cart", JSON.stringify(existing ? cart.map((item) => String(item._id) === String(product._id) ? { ...item, quantity: (item.quantity || 1) + 1 } : item) : [...cart, { ...product, price: getDisplayPrice(product), quantity: 1 }]));
    notifyCartChanged();
    setAddedCartIds((ids) => ids.includes(String(product._id)) ? ids : [...ids, String(product._id)]);
    addNotice("Added to cart");
  };
  const detailPath = (product) => `/product/${product.slug || product._id}`;
  const rememberProduct = (product) => localStorage.setItem(`catalogProduct:${product.slug || product._id}`, JSON.stringify(product));
  const MarketplaceCard = ({ product, index = 0, compact = false }) => {
    const isWish = wishlistIds.includes(String(product._id));
    const isCart = addedCartIds.includes(String(product._id));
    const isComparing = compareIds.includes(String(product._id));
    const defaultFallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

    return (
      <article
        className={`market-product-card ${compact ? "compact" : ""}`}
        onClick={() => { rememberProduct(product); navigate(detailPath(product)); }}
        style={{ cursor: "pointer" }}
      >
        <div className="market-product-image">
          <img
            src={productImage(product, index)}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.src !== defaultFallback) {
                e.currentTarget.src = defaultFallback;
              }
            }}
          />
          {product.badge === "OEM VERIFIED" || product.isVerified ? (
            <span className="oem-verified-badge">
              <i className="bi bi-patch-check-fill" /> OEM Verified
            </span>
          ) : (
            <span className={`sale-pill ${product.badge === "IN STOCK" ? "new" : ""}`}>{product.badge || "IN STOCK"}</span>
          )}
          <button
            className={`icon-action ${isWish ? "active" : ""}`}
            aria-label={`Save ${product.name}`}
            onClick={(e) => { e.stopPropagation(); saveWishlist(product); }}
            title={isWish ? "Remove from wishlist" : "Save to wishlist"}
          >
            <i className={`bi ${isWish ? "bi-heart-fill" : "bi-heart"}`} />
          </button>
        </div>
        <div className="market-product-body">
          <div className="product-brand-tag">
            <span>{product.brand}</span>
            <span className="verified-dot">✓</span>
          </div>
          <Link to={detailPath(product)} onClick={(e) => { e.stopPropagation(); rememberProduct(product); }} className="product-title-link">
            <h3>{product.name}</h3>
          </Link>
          <div className="d-flex align-items-center gap-2 small text-warning">
            <i className="bi bi-star-fill" /> <span>{product.rating || "4.8"}</span>
            <span className="text-secondary">(ISO 9001)</span>
          </div>
          <div className="price-row">
            <strong>{formatPrice(product.price)}</strong>
            {product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}
          </div>
          <div className="product-actions mt-2">
            <div className="product-btn-row">
              <button
                type="button"
                className={`btn btn-sm btn-compare-action ${isComparing ? "active" : ""}`}
                onClick={(e) => { e.stopPropagation(); compareProduct(product); }}
                title="Compare product specifications"
              >
                <i className="bi bi-arrow-left-right" />
                <span>{isComparing ? "Comparing" : "Compare"}</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm btn-cart-action ${isCart ? "active" : ""}`}
                onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                title="Add product to procurement cart"
              >
                <i className={`bi ${isCart ? "bi-check2" : "bi-cart-plus"}`} />
                <span>{isCart ? "Added" : "Add to cart"}</span>
              </button>
            </div>
            <div className="product-action-footer">
              <button
                type="button"
                className={`btn-wishlist-inline ${isWish ? "active" : ""}`}
                onClick={(e) => { e.stopPropagation(); saveWishlist(product); }}
                title={isWish ? "Remove from wishlist" : "Add to wishlist"}
              >
                <i className={`bi ${isWish ? "bi-heart-fill" : "bi-heart"}`} />
                <span>{isWish ? "Wishlisted" : "Wishlist"}</span>
              </button>
              <Link to={detailPath(product)} onClick={(e) => { e.stopPropagation(); rememberProduct(product); }} className="product-details-link">
                <span>View Details</span>
                <i className="bi bi-arrow-up-right" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="market-home">
      {notice && <div className="market-toast"><i className="bi bi-check-circle-fill text-success" /> {notice}</div>}

      {/* EXTENDED HERO SECTION (Stitch Screen 1) */}
      <section className="market-hero">
        <div className="container">
          <div className="hero-copy">
            <div className="hero-status-pill">
              <span />
              <span className="pill-title">Factory-Direct Precision Infrastructure</span>
              <span className="pill-divider" />
              <span className="pill-tag">ISO 9001:2015 Tier-1 Grid</span>
            </div>
            <h1>
              Heavy Machinery &amp; Industrial Equipment,<br />
              <em>Sourced at Source.</em>
            </h1>
            <p>
              Direct OEM procurement, verified manufacturer pricing, and benchmark telemetry across motors, CNCs, pumps, and process automation.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">
                Explore Machinery <i className="bi bi-arrow-up-right ms-2" />
              </Link>
              <Link to="/compare" className="hero-text-link">
                Launch Comparison Engine <i className="bi bi-arrow-right" />
              </Link>
            </div>
            <div className="hero-proof">
              <span><i className="bi bi-patch-check-fill" /> 30k+ verified OEM listings</span>
              <span><i className="bi bi-lightning-charge-fill" /> Live price &amp; spec telemetry</span>
              <span><i className="bi bi-shield-check" /> Escrow milestone protection</span>
            </div>
          </div>
          <div className="hero-device">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="device-glow" />
            <img
              src={industrialPlantHero}
              alt="Industrial plant machinery floor"
            />
            <div className="hero-offer">
              <b>SPOTLIGHT OEM DEAL</b>
              <strong>25% <small>DIRECT REBATE</small></strong>
              <span>Siemens IE3 Three-Phase Severe Duty Motor</span>
            </div>
          </div>
        </div>
      </section>

      {/* TELEMETRY STATS RIBBON */}
      <section className="telemetry-ribbon">
        <div className="container">
          <div className="telemetry-grid">
            <div className="telemetry-card">
              <span>Month to Date GTV</span>
              <strong>₹48.2L+</strong>
              <small><i className="bi bi-arrow-up-right" /> +24.6% qualified buyer rate</small>
            </div>
            <div className="telemetry-card">
              <span>Verified OEM Partners</span>
              <strong>348 Active</strong>
              <small><i className="bi bi-check-circle" /> 326 Tier-1 OEMs on-grid</small>
            </div>
            <div className="telemetry-card">
              <span>Validated Spec SKUs</span>
              <strong>4,892 Units</strong>
              <small><i className="bi bi-shield-check" /> 98.4% factory spec audited</small>
            </div>
            <div className="telemetry-card">
              <span>Production Gateway</span>
              <strong>99.98%</strong>
              <small><i className="bi bi-broadcast-pin" /> Node IN-MUM-01 live</small>
            </div>
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="container category-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow dark">MACHINERY BY INDUSTRIAL CATEGORY</span>
            <h2>Start with a Category</h2>
            <p>High-density engineering components and capital machinery directly from vetted plants.</p>
          </div>
          <Link to="/products" className="view-link">View full catalog <i className="bi bi-arrow-right" /></Link>
        </div>
        <div className="category-rail">
          {categories.map(([icon, name]) => (
            <Link to={`/products?category=${encodeURIComponent(name)}`} className="category-tile" key={name} aria-label={`Browse ${name} products`}>
              <div className="category-icon">
                <i className={`bi ${icon}`} />
              </div>
              <span>{name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* TRENDING / LIVE MACHINERY */}
      <section className="trending-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow dark">LIVE MARKETPLACE TELEMETRY</span>
              <h2>Featured Industrial Machinery</h2>
              <p>Active RFQ shortlists, moving manufacturer price tiers, and high-demand plant equipment.</p>
            </div>
            <div className="d-flex gap-2">
              <Link to="/products" className="btn btn-outline-primary btn-sm">Explore all 4,892 SKUs</Link>
            </div>
          </div>
          <div className="market-tabs">
            {["Trending", "Motors & Drives", "CNC Machining", "Pumps", "Process Automation"].map(tab => (
              <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </div>
          <div className="product-rail">
            {displayProducts.map((product, index) => (
              <MarketplaceCard key={product._id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS GRID */}
      <section className="container benefits-section">
        <div className="benefits-grid">
          {benefits.map(([icon, title, copy]) => (
            <div className="benefit-item" key={title}>
              <i className={`bi ${icon}`} />
              <div>
                <strong>{title}</strong>
                <span>{copy}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* OEM BRAND STRIP */}
      <section className="brand-strip">
        <div className="container">
          <span className="eyebrow dark">TRUSTED BY TIER-1 INDUSTRIAL OEM NETWORKS</span>
          <div className="brand-row">
            {brands.map(brand => <span key={brand}>{brand}</span>)}
          </div>
        </div>
      </section>

      {/* PROMO EDIT */}
      <section className="container promo-grid">
        {promos.map(promo => (
          <Link to="/products" className={`promo-banner ${promo.className}`} key={promo.title}>
            <div>
              <span className="eyebrow">SPEC MATRIX FOCUS</span>
              <h3>{promo.title}</h3>
              <p>{promo.copy}</p>
              <span className="btn btn-sm btn-outline-light mt-2">Explore specs <i className="bi bi-arrow-up-right ms-1" /></span>
            </div>
            <i className={`bi ${promo.icon} promo-icon`} />
          </Link>
        ))}
      </section>

      {/* SPECIAL MACHINERY SPOTLIGHT */}
      <section className="container special-offer">
        <div className="offer-content">
          <span className="eyebrow">FACTORY INVENTORY LIQUIDATION / LIMITED LOTS</span>
          <h2>Heavy Machining Centers.<br /><em>Direct OEM Pricing.</em></h2>
          <p>Factory allocation slots open for Siemens IE3 severe-duty motors, Haas CNC verticals, and industrial centrifugal pumps with full inspection warranties.</p>
          <div className="countdown">
            <div><strong>02</strong><span>Days</span></div>
            <span className="fw-bold fs-4 text-secondary">:</span>
            <div><strong>18</strong><span>Hours</span></div>
            <span className="fw-bold fs-4 text-secondary">:</span>
            <div><strong>46</strong><span>Minutes</span></div>
          </div>
          <Link to="/products" className="btn btn-primary">
            Review Allocation Lots <i className="bi bi-arrow-right ms-2" />
          </Link>
        </div>
        <div className="offer-art">
          <img src={productImage(displayProducts[0])} alt="Featured industrial machine" loading="lazy" />
        </div>
      </section>

      {/* INDUSTRIAL TESTIMONIALS */}
      <section className="testimonial-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow dark">VERIFIED PROCUREMENT AUDITORS</span>
              <h2>What Plant Directors &amp; Buyers Say</h2>
            </div>
          </div>
          <div className="testimonial-grid">
            <article>
              <div className="quote-stars">★★★★★</div>
              <p>“The SpecMatrix side-by-side spec comparison resolved a ₹14L motor procurement decision in 20 minutes. Test reports were already verified.”</p>
              <strong>Rajesh Kulkarni</strong>
              <span>Chief Engineer · Automotive OEM / Pune</span>
            </article>
            <article>
              <div className="quote-stars">★★★★★</div>
              <p>“Direct manufacturer warranties with transparent milestone escrow. Finally a platform engineered for heavy machinery without retail fluff.”</p>
              <strong>Arunachalam S.</strong>
              <span>Head of Procurement · Heavy Engineering / Chennai</span>
            </article>
            <article>
              <div className="quote-stars">★★★★★</div>
              <p>“We onboarded 40+ motor listings onto Industry Mandi and connected with verified Tier-1 contractors within days.”</p>
              <strong>Vikas Singhania</strong>
              <span>Authorized OEM Distributor / Ahmedabad</span>
            </article>
          </div>
        </div>
      </section>

      {/* INDUSTRIAL JOURNAL & GUIDES */}
      <section className="container blog-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow dark">INDUSTRY MANDI TECHNICAL JOURNAL</span>
            <h2>Field Notes &amp; Procurement Guides</h2>
          </div>
          <Link to="/faq" className="view-link">Read engineering briefs <i className="bi bi-arrow-right" /></Link>
        </div>
        <div className="blog-grid">
          <article className="blog-card">
            <div className="blog-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80"
                alt="Specifying IE3 vs IE4 Motors"
                loading="lazy"
              />
              <span className="blog-category-badge">
                <i className="bi bi-gear-wide-connected me-1" /> MOTORS &amp; DRIVES
              </span>
              <span className="blog-read-badge">
                <i className="bi bi-clock me-1" /> 6 MIN READ
              </span>
            </div>
            <div className="blog-body">
              <span className="blog-eyebrow">TECHNICAL STANDARD · IE3 VS IE4</span>
              <h3>Specifying IE3 vs IE4 Motors in High Ambient Temperatures</h3>
              <p className="blog-excerpt">
                Thermal derating curves, winding insulation limits, and life-cycle efficiency economics for severe ambient factory floors.
              </p>
              <div className="blog-footer">
                <span className="blog-spec-tag"><i className="bi bi-file-earmark-pdf me-1" />OEM Whitepaper</span>
                <Link to="/products?category=Motors%20%26%20Drives" className="blog-link">
                  <span>Read whitepaper</span>
                  <i className="bi bi-arrow-right" />
                </Link>
              </div>
            </div>
          </article>
          <article className="blog-card">
            <div className="blog-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=900&q=80"
                alt="Sub-Micron CNC Center Tolerances"
                loading="lazy"
              />
              <span className="blog-category-badge">
                <i className="bi bi-cpu me-1" /> CNC MACHINING
              </span>
              <span className="blog-read-badge">
                <i className="bi bi-clock me-1" /> 4 MIN READ
              </span>
            </div>
            <div className="blog-body">
              <span className="blog-eyebrow">CNC BENCHMARKS · TOLERANCE MATRIX</span>
              <h3>Sub-Micron CNC Center Tolerances in Precision Machining</h3>
              <p className="blog-excerpt">
                Thermal expansion compensation, spindle runout criteria, and 5-axis ball-screw positioning for aerospace-grade tolerances.
              </p>
              <div className="blog-footer">
                <span className="blog-spec-tag"><i className="bi bi-file-earmark-pdf me-1" />Benchmark Report</span>
                <Link to="/products?category=CNC%20Machining" className="blog-link">
                  <span>Read whitepaper</span>
                  <i className="bi bi-arrow-right" />
                </Link>
              </div>
            </div>
          </article>
          <article className="blog-card">
            <div className="blog-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80"
                alt="Mitigating Harmonics with VFDs"
                loading="lazy"
              />
              <span className="blog-category-badge">
                <i className="bi bi-diagram-3 me-1" /> PROCESS AUTOMATION
              </span>
              <span className="blog-read-badge">
                <i className="bi bi-clock me-1" /> 8 MIN READ
              </span>
            </div>
            <div className="blog-body">
              <span className="blog-eyebrow">AUTOMATION · HARMONIC DISTORTION</span>
              <h3>Mitigating Harmonics with Variable Frequency Drives (VFDs)</h3>
              <p className="blog-excerpt">
                Total Harmonic Distortion (THD) suppression, passive harmonic filters, and IEEE 519 compliance for heavy drive loads.
              </p>
              <div className="blog-footer">
                <span className="blog-spec-tag"><i className="bi bi-file-earmark-pdf me-1" />IEEE 519 Guide</span>
                <Link to="/products?category=Process%20Automation" className="blog-link">
                  <span>Read whitepaper</span>
                  <i className="bi bi-arrow-right" />
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter-section">
        <div className="container newsletter-inner">
          <div className="newsletter-copy">
            <div className="newsletter-signal"><i className="bi bi-broadcast-pin" /> WEEKLY PROCUREMENT SIGNAL</div>
            <span className="eyebrow dark">PROCUREMENT TELEMETRY FEED</span>
            <h2>Weekly Industrial Price &amp; Allocation Bulletins</h2>
            <p>Direct manufacturer price changes, equipment auction drops, and OEM allocations. No spam.</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); setEmail(""); addNotice("Subscribed to telemetry feed"); }}>
            <div className="newsletter-form-row">
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter enterprise email address" aria-label="Enterprise email" />
              <button className="btn btn-primary">Subscribe <i className="bi bi-arrow-right" /></button>
            </div>
            <small><i className="bi bi-shield-check" /> One concise update each week. Unsubscribe anytime.</small>
          </form>
        </div>
      </section>

      <FrequentlyAskedQuestions />

      {/* FOOTER */}
      <footer className="market-footer">
        <div className="container">
          <div className="footer-top">
            <div>
              <Link className="navbar-brand" to="/">
                <span className="brand-dot" />
                <div className="d-flex flex-column text-start">
                  <span className="brand-name">INDUSTRY MANDI</span>
                  <span className="brand-subtext">Industrial Exchange</span>
                </div>
              </Link>
              <p>Direct OEM procurement, verified manufacturer pricing, and benchmark telemetry across industrial equipment.</p>
            </div>
            <div className="footer-links">
              <div>
                <strong>Catalog</strong>
                <Link to="/products">All Machinery</Link>
                <Link to="/compare">SpecMatrix Compare</Link>
                <Link to="/products?category=Motors%20%26%20Drives">Motors &amp; Drives</Link>
                <Link to="/products?category=CNC%20Machining">CNC Centers</Link>
              </div>
              <div>
                <strong>Enterprise</strong>
                <Link to="/about">About Us</Link>
                <Link to="/contact">Contact Support</Link>
                <Link to="/register?role=vendor">OEM &amp; Vendor Onboarding</Link>
                <Link to="/account">Buyer Console</Link>
              </div>
              <div>
                <strong>Compliance</strong>
                <a href="#iso">ISO 9001:2015 Tier-1</a>
                <a href="#escrow">Escrow &amp; Gate Verification</a>
                <a href="#privacy">Privacy &amp; Telemetry</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Industry Mandi. Built for precision industrial procurement.</span>
            <span>
              <i className="bi bi-linkedin" /> <i className="bi bi-twitter-x" /> <i className="bi bi-shield-check" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FrequentlyAskedQuestions() {
  const questions = [["How do I compare products?", "Use the Compare button on product listings to build a shortlist. Once you have selected products in the same category, you can review their details side by side."], ["Are sellers verified?", "We review vendor details and product listings to help buyers identify reliable marketplace sellers."], ["Can I save products for later?", "Yes. Signed-in buyers can add products to their wishlist and return to them anytime from the heart icon in the navigation."], ["How do I become a seller?", "Choose Become a seller in the navigation, register as a vendor, and provide your company details for review."]];
  return <section className="container py-5"><div className="page-heading"><span className="eyebrow dark">HELP CENTER</span><h2>Frequently Asked Questions</h2></div><div className="mt-4">{questions.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}<i className="bi bi-plus-lg" /></summary><p>{answer}</p></details>)}</div></section>;
}


export { FrequentlyAskedQuestions };
export default Home;
