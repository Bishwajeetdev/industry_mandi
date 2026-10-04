import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { fmt, getDisplayPrice } from "../../utils/helpers";
import { notifyCartChanged, notifyWishlistChanged } from "../../utils/events";
import { addToCompareQueue } from "../../utils/compareStorage";

function ProductCard({ product, selectable, onToggle, chosen, onRemove }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getStoredWishlist = () => {
    try {
      const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
      return list.some((item) => String(item._id) === String(product._id));
    } catch {
      return false;
    }
  };
  const getStoredCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      return cart.some((item) => String(item._id) === String(product._id));
    } catch {
      return false;
    }
  };
  const getStoredCompare = () => {
    try {
      const list = JSON.parse(localStorage.getItem("compareProducts") || "[]");
      return list.some((item) => String(item._id) === String(product._id));
    } catch {
      return false;
    }
  };

  const [isWishlisted, setIsWishlisted] = useState(getStoredWishlist);
  const [cartAdded, setCartAdded] = useState(getStoredCart);
  const [isComparing, setIsComparing] = useState(chosen !== undefined ? chosen : getStoredCompare);

  useEffect(() => {
    if (chosen !== undefined) {
      setIsComparing(chosen);
    }
  }, [chosen]);

  useEffect(() => {
    setIsWishlisted(getStoredWishlist());
    setCartAdded(getStoredCart());
    if (chosen === undefined) {
      setIsComparing(getStoredCompare());
    }

    const onWishlist = () => setIsWishlisted(getStoredWishlist());
    const onCart = () => setCartAdded(getStoredCart());
    const onCompare = () => {
      if (chosen === undefined) setIsComparing(getStoredCompare());
    };

    window.addEventListener("wishlist-updated", onWishlist);
    window.addEventListener("cart-updated", onCart);
    window.addEventListener("compare-updated", onCompare);

    return () => {
      window.removeEventListener("wishlist-updated", onWishlist);
      window.removeEventListener("cart-updated", onCart);
      window.removeEventListener("compare-updated", onCompare);
    };
  }, [product._id, chosen]);

  const saveWishlist = async (e) => {
    if (e) e.preventDefault();
    if (onRemove) {
      onRemove(product._id);
      return;
    }

    const currentWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    const isAlready = currentWishlist.some((item) => String(item._id) === String(product._id));

    if (user?.role === "buyer" && product._id && product._id.length === 24) {
      try {
        const response = await api.post(`/buyer/wishlist/${product._id}`);
        const updatedList = Array.isArray(response.data?.data) ? response.data.data : [];
        localStorage.setItem("wishlist", JSON.stringify(updatedList));
        notifyWishlistChanged(updatedList);
        setIsWishlisted(updatedList.some((item) => String(item._id) === String(product._id)));
        return;
      } catch (err) {
        console.error("Wishlist sync error:", err);
      }
    }

    const next = isAlready
      ? currentWishlist.filter((item) => String(item._id) !== String(product._id))
      : [...currentWishlist, product];
    localStorage.setItem("wishlist", JSON.stringify(next));
    notifyWishlistChanged(next);
    setIsWishlisted(!isAlready);
  };

  const addToCart = (e) => {
    if (e) e.preventDefault();
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => String(item._id) === String(product._id));
    localStorage.setItem(
      "cart",
      JSON.stringify(
        existing
          ? cart.map((item) =>
              String(item._id) === String(product._id)
                ? { ...item, quantity: (item.quantity || 1) + 1 }
                : item
            )
          : [...cart, { ...product, price: getDisplayPrice(product), quantity: 1 }]
      )
    );
    notifyCartChanged();
    setCartAdded(true);
  };

  const handleCompare = (e) => {
    if (e) e.preventDefault();
    if (onToggle) {
      onToggle(product);
    } else {
      const next = addToCompareQueue(product);
      if (next && next.some((p) => String(p._id) === String(product._id))) {
        setIsComparing(true);
      }
    }
  };

  const primary =
    (product.images || []).find((x) => x.isPrimary) ||
    (product.images || [])[0],
    image = typeof primary === "string" ? primary : primary?.url || product.image;
  const fallbackImage = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";

  return (
    <article
      className={`product-card${onRemove ? " wishlist-product-card" : ""}`}
      onClick={() => navigate(`/product/${product.slug || product._id}`)}
      style={{ cursor: "pointer" }}
    >
      <div className="product-art">
        <img
          src={image || fallbackImage}
          alt={product.name}
          className="w-100 h-100 object-fit-cover"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = fallbackImage; }}
        />
        {product.badge === "OEM VERIFIED" || product.isVerified ? (
          <span className="oem-verified-badge">
            <i className="bi bi-patch-check-fill" /> OEM Verified
          </span>
        ) : (
          <span className={`sale-pill ${product.badge === "IN STOCK" ? "new" : ""}`}>
            {product.badge || product.category || "Machinery"}
          </span>
        )}
        <button
          className={`icon-action ${isWishlisted ? "active" : ""}`}
          aria-label={`Save ${product.name}`}
          onClick={(e) => { e.stopPropagation(); saveWishlist(e); }}
          title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
        >
          <i className={`bi ${isWishlisted ? "bi-heart-fill" : "bi-heart"}`} />
        </button>
      </div>
      <div className="p-3">
        <div className="product-brand-tag">
          <span>{product.brand || "Industrial OEM"}</span>
          <span className="verified-dot">✓</span>
        </div>
        <Link to={`/product/${product.slug || product._id}`} className="text-decoration-none">
          <h3>{product.name}</h3>
        </Link>
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="product-spec-chips">
            {Object.entries(product.specifications).slice(0, 3).map(([k, v]) => (
              <span className="spec-chip" key={k}>{k}: {String(v)}</span>
            ))}
          </div>
        )}
        <div className="price-row">
          <strong>{fmt(getDisplayPrice(product))}</strong>
          {product.oldPrice && <del>{fmt(product.oldPrice)}</del>}
        </div>
        <div className="product-meta-row">
          <small className="text-secondary">SKU: {product.sku || (product._id ? `IM-${product._id.slice(-5).toUpperCase()}` : "IM-001")}</small>
          <span className="rating text-warning small">
            <i className="bi bi-star-fill" /> {product.rating || "4.8"}
          </span>
        </div>
        <div className="product-actions mt-2">
          <div className="product-btn-row">
            <button
              className={`btn btn-sm flex-fill ${isComparing ? "btn-primary" : "btn-outline-primary"}`}
              onClick={(e) => { e.stopPropagation(); handleCompare(e); }}
              title="Compare product specifications"
            >
              <i className="bi bi-arrow-left-right me-1" />
              <span className="product-action-label">
                <span className="product-action-label-full">{isComparing ? "Comparing" : "Compare"}</span>
                <span className="product-action-label-compact">{isComparing ? "Selected" : "Compare"}</span>
              </span>
            </button>
            <button
              className={`btn btn-sm btn-primary flex-fill ${cartAdded ? "btn-success" : ""}`}
              onClick={(e) => { e.stopPropagation(); addToCart(e); }}
              title="Add product to procurement cart"
            >
              <i className={`bi ${cartAdded ? "bi-check2" : "bi-cart-plus"} me-1`} />
              <span className="product-action-label">
                <span className="product-action-label-full">{cartAdded ? "Added" : "Add to cart"}</span>
                <span className="product-action-label-compact">{cartAdded ? "Added" : "Cart"}</span>
              </span>
            </button>
          </div>
          <div className="product-action-footer">
            {onRemove ? (
              <button
                type="button"
                className="btn-wishlist-inline text-danger"
                onClick={(e) => { e.stopPropagation(); onRemove(product._id); }}
                title="Remove from shortlist"
              >
                <i className="bi bi-heartbreak me-1" />
                <span>Remove</span>
              </button>
            ) : (
              <button
                type="button"
                className={`btn-wishlist-inline ${isWishlisted ? "active" : ""}`}
                onClick={(e) => { e.stopPropagation(); saveWishlist(e); }}
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <i className={`bi ${isWishlisted ? "bi-heart-fill text-danger" : "bi-heart"} me-1`} />
                <span className="product-action-label">
                  <span className="product-action-label-full">{isWishlisted ? "Wishlisted" : "Wishlist"}</span>
                  <span className="product-action-label-compact">{isWishlisted ? "Saved" : "Save"}</span>
                </span>
              </button>
            )}
            <Link
              className="product-details-link"
              to={`/product/${product.slug || product._id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="product-action-label">
                <span className="product-action-label-full">View Details</span>
                <span className="product-action-label-compact">Details</span>
              </span>
              <i className="bi bi-arrow-up-right ms-1" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
