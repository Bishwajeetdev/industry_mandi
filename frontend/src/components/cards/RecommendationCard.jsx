import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { fmt, getDisplayPrice } from "../../utils/helpers";
import { notifyCartChanged } from "../../utils/events";

function RecommendationCard({ product, reason, fallback }) {
  const { user } = useAuth();
  const [added, setAdded] = useState(() => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      return cart.some((item) => String(item._id) === String(product._id));
    } catch {
      return false;
    }
  });

  const getWishlistState = () => {
    try {
      const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
      return list.some((item) => String(item._id) === String(product._id));
    } catch {
      return false;
    }
  };
  const [isWishlisted, setIsWishlisted] = useState(getWishlistState);

  const getCompareState = () => {
    try {
      const list = JSON.parse(localStorage.getItem("compareProducts") || "[]");
      return list.some((item) => String(item._id) === String(product._id));
    } catch {
      return false;
    }
  };
  const [isCompared, setIsCompared] = useState(getCompareState);

  useEffect(() => {
    const onWishlist = () => setIsWishlisted(getWishlistState());
    const onCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setAdded(cart.some((item) => String(item._id) === String(product._id)));
      } catch {}
    };
    const onCompare = () => setIsCompared(getCompareState());

    window.addEventListener("wishlist-updated", onWishlist);
    window.addEventListener("cart-updated", onCart);
    window.addEventListener("compare-updated", onCompare);
    return () => {
      window.removeEventListener("wishlist-updated", onWishlist);
      window.removeEventListener("cart-updated", onCart);
      window.removeEventListener("compare-updated", onCompare);
    };
  }, [product._id]);

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
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
      } catch {}
    }

    const next = isAlready
      ? currentWishlist.filter((item) => String(item._id) !== String(product._id))
      : [...currentWishlist, product];
    localStorage.setItem("wishlist", JSON.stringify(next));
    notifyWishlistChanged(next);
    setIsWishlisted(!isAlready);
  };

  const handleToggleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompared) {
      removeFromCompareQueue(product._id);
      setIsCompared(false);
    } else {
      const next = addToCompareQueue(product);
      if (next && next.some((p) => String(p._id) === String(product._id))) {
        setIsCompared(true);
      }
    }
  };

  const addToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => String(item._id) === String(product._id));
    localStorage.setItem(
      "cart",
      JSON.stringify(
        existing
          ? cart.map((item) => (String(item._id) === String(product._id) ? { ...item, quantity: (item.quantity || 1) + 1 } : item))
          : [...cart, { ...product, price: getDisplayPrice(product), quantity: 1 }]
      )
    );
    notifyCartChanged();
    setAdded(true);
  };

  const primary = (product.images || []).find((item) => item.isPrimary) || product.images?.[0];
  const imageUrl = typeof primary === "string" ? primary : primary?.url || product.image || "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80";

  return (
    <article className="recommendation-card">
      <div className="recommendation-image-wrap">
        <Link to={`/product/${product.slug || product._id}`} aria-label={`View ${product.name}`}>
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
            }}
          />
        </Link>
        <span className={`recommendation-card-badge ${fallback ? "companion" : "match"}`}>
          <i className={`bi ${fallback ? "bi-puzzle" : "bi-cpu"}`} />
          {fallback ? "Companion" : "Spec Match"}
        </span>
        <button
          type="button"
          className={`recommendation-wishlist-btn ${isWishlisted ? "active" : ""}`}
          onClick={toggleWishlist}
          title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          aria-label="Wishlist toggle"
        >
          <i className={`bi ${isWishlisted ? "bi-heart-fill" : "bi-heart"}`} />
        </button>
      </div>

      <div className="recommendation-content">
        <div className="recommendation-brand-row">
          <span className="recommendation-brand">{product.brand || product.category || "OEM Verified"}</span>
          <span className="recommendation-rating">
            <i className="bi bi-star-fill" /> {product.rating || "4.8"}
          </span>
        </div>

        <Link to={`/product/${product.slug || product._id}`} className="recommendation-name" title={product.name}>
          {product.name}
        </Link>

        {reason && (
          <div className="recommendation-reason-tag">
            <i className="bi bi-stars" />
            <span>{reason}</span>
          </div>
        )}

        <div className="recommendation-footer-wrap">
          <div className="recommendation-price-box">
            <span className="recommendation-price">{fmt(getDisplayPrice(product))}</span>
            <span className="recommendation-sku">{product.sku || (product._id ? `SKU: IM-${String(product._id).slice(-4).toUpperCase()}` : "")}</span>
          </div>

          <div className="recommendation-action-row">
            <button
              type="button"
              className={`btn btn-sm ${added ? "btn-success" : "btn-primary"} btn-rec-cart`}
              onClick={addToCart}
              title="Add to procurement cart"
            >
              <i className={`bi ${added ? "bi-check2" : "bi-cart-plus"}`} />
              <span>{added ? "Added" : "Cart"}</span>
            </button>

            <button
              type="button"
              className={`btn-rec-compare ${isCompared ? "active" : ""}`}
              onClick={handleToggleCompare}
              title={isCompared ? "Remove from compare" : "Add to compare"}
            >
              <i className="bi bi-arrow-left-right" />
              <span>{isCompared ? "Comparing" : "Compare"}</span>
            </button>

            <Link
              to={`/product/${product.slug || product._id}`}
              className="btn-rec-view"
              title="View full specifications"
              aria-label="View specifications"
            >
              <i className="bi bi-arrow-up-right" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default RecommendationCard;
