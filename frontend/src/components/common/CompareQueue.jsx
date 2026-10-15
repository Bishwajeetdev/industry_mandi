import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { fmt, getDisplayPrice, haveSameProductCategory } from "../../utils/helpers";
import { removeFromCompareQueue, addToCompareQueue } from "../../utils/compareStorage";
import { INDUSTRIAL_CATALOG } from "../../utils/catalogData";
import Loading from "./Loading";

function CompareQueue() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("compareProducts") || "[]");
    } catch {
      return [];
    }
  });
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const currentCategory = products[0]?.category;

  const compareNow = () => {
    if (products.length >= 2) {
      if (!haveSameProductCategory(products)) {
        alert("Cannot compare products from different or unspecified categories. Remove products until all selected items share one category.");
        return;
      }
      const selectedIds = products.map((product) => product._id).join(",");
      setOpen(false);
      setShowPicker(false);
      navigate(`/compare?ids=${selectedIds}`);
    }
  };

  useEffect(() => {
    const handleCompareChange = (event) => {
      const next = event.detail?.products || [];
      setProducts(next);
      setOpen(next.length > 0);
      if (!next.length) setShowPicker(false);
    };
    window.addEventListener("compare-updated", handleCompareChange);
    return () => window.removeEventListener("compare-updated", handleCompareChange);
  }, [navigate]);

  useEffect(() => {
    if (!showPicker) return;
    setLoadingCatalog(true);
    const params = { limit: 50 };
    if (currentCategory) params.category = currentCategory;
    api
      .get("/products", { params })
      .then((r) => {
        setCatalogProducts(Array.isArray(r.data?.data?.items) ? r.data.data.items : []);
      })
      .catch(() => {
        setCatalogProducts([]);
      })
      .finally(() => {
        setLoadingCatalog(false);
      });
  }, [showPicker, currentCategory]);

  const availablePickerProducts = useMemo(() => {
    const currentIds = products.map((p) => String(p._id));
    const combined = [...catalogProducts];
    if (typeof INDUSTRIAL_CATALOG !== "undefined" && Array.isArray(INDUSTRIAL_CATALOG)) {
      INDUSTRIAL_CATALOG.forEach((item) => {
        if (!combined.some((p) => String(p._id) === String(item._id) || p.name === item.name)) {
          if (!currentCategory || item.category?.toLowerCase() === currentCategory.toLowerCase()) {
            combined.push(item);
          }
        }
      });
    }
    return combined.filter((p) => {
      if (currentIds.includes(String(p._id))) return false;
      if (currentCategory && p.category && p.category.trim().toLowerCase() !== currentCategory.trim().toLowerCase()) return false;
      if (!pickerSearch.trim()) return true;
      const term = pickerSearch.toLowerCase();
      return (
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.brand && p.brand.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term)) ||
        (p.model && p.model.toLowerCase().includes(term))
      );
    });
  }, [catalogProducts, products, currentCategory, pickerSearch]);

  const handleAddProduct = (item) => {
    const next = addToCompareQueue(item);
    if (next) {
      setProducts(next);
      if (next.length >= 4) {
        setShowPicker(false);
      }
    }
  };

  const handleRemoveProduct = (productId) => {
    const next = removeFromCompareQueue(productId);
    setProducts(next);
    if (next.length === 0) {
      setOpen(false);
      setShowPicker(false);
    }
  };

  const openPicker = () => {
    if (products.length >= 4) return;
    setPickerSearch("");
    setShowPicker(true);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="compare-queue-layer"
        role="presentation"
        onMouseDown={() => {
          setOpen(false);
          setShowPicker(false);
        }}
      >
        <section
          className="compare-queue"
          role="dialog"
          aria-modal="true"
          aria-label="Compare products"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="compare-queue-header">
            <div className="d-flex align-items-center gap-2">
              <span>
                {products.length} product{products.length === 1 ? "" : "s"} in your <b>compare queue</b>
              </span>
              {currentCategory && (
                <span className="badge bg-secondary text-light">
                  {currentCategory}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                setShowPicker(false);
              }}
              aria-label="Close comparison queue"
              className="btn-modal-close"
            >
              <i className="bi bi-x-circle-fill fs-5" />
            </button>
          </div>

          <div className="compare-queue-slots">
            {Array.from({ length: 4 }, (_, index) => {
              const product = products[index];
              return product ? (
                <div className="compare-queue-slot compare-queue-slot-filled" key={product._id || index}>
                  <button
                    type="button"
                    className="compare-queue-slot-remove"
                    title={`Remove ${product.name} from queue`}
                    aria-label={`Remove ${product.name} from queue`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveProduct(product._id);
                    }}
                  >
                    <i className="bi bi-x" />
                  </button>
                  <div className="compare-queue-image">
                    {(product.image || product.images?.[0]?.url || product.images?.[0]) ? (
                      <img src={product.image || product.images?.[0]?.url || product.images?.[0]} alt={product.name || ""} />
                    ) : (
                      <i className="bi bi-box-seam" />
                    )}
                  </div>
                  <strong>{product.name}</strong>
                  <b>{fmt(getDisplayPrice(product))}</b>
                </div>
              ) : (
                <div
                  className="compare-queue-slot compare-queue-slot-empty"
                  key={index}
                  onClick={openPicker}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openPicker();
                    }
                  }}
                  title="Click to add another product to compare"
                >
                  <i className="bi bi-plus-circle-fill text-primary" style={{ fontSize: "1.5rem" }} />
                  <span className="fw-semibold">Add product</span>
                </div>
              );
            })}
          </div>

          <div className="compare-queue-footer">
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-primary"
                disabled={products.length >= 4}
                onClick={openPicker}
              >
                <i className="bi bi-plus-lg me-1" />
                {products.length >= 4 ? "Max 4 products added" : "Add more products"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setOpen(false);
                  setShowPicker(false);
                  navigate(currentCategory ? `/products?category=${encodeURIComponent(currentCategory)}` : "/products");
                }}
              >
                Browse catalog
              </button>
            </div>
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-primary"
                disabled={products.length < 2}
                onClick={compareNow}
              >
                Compare now
              </button>
              <span className="text-secondary small">
                {products.length < 2
                  ? "Select 1 more product to compare"
                  : `Compare ${products.length} products`}
              </span>
            </div>
          </div>
        </section>
      </div>

      {showPicker && (
        <div
          className="compare-modal-backdrop"
          style={{ zIndex: 2100 }}
          onClick={() => setShowPicker(false)}
        >
          <div className="compare-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="compare-modal-header">
              <div>
                <span className="eyebrow dark">EXPAND COMPARISON</span>
                <h3 className="h5 mb-0">Add Product to Compare</h3>
                {currentCategory && (
                  <small className="text-secondary">
                    Category: <strong>{currentCategory}</strong>
                  </small>
                )}
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowPicker(false)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="compare-modal-search">
              <i className="bi bi-search" />
              <input
                type="text"
                placeholder="Search products by model, brand, or name..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="compare-modal-list">
              {loadingCatalog ? (
                <div className="text-center py-4 text-secondary">
                  <div className="spinner-border spinner-border-sm me-2" />
                  Loading available products...
                </div>
              ) : availablePickerProducts.length > 0 ? (
                availablePickerProducts.map((p) => {
                  const pImg = p.image || p.images?.[0]?.url || p.images?.[0] || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
                  return (
                    <div className="picker-product-item" key={p._id}>
                      <img src={pImg} alt={p.name || ""} />
                      <div className="picker-product-info">
                        <strong className="picker-title">{p.name}</strong>
                        <span className="picker-meta">{p.brand} · {p.category}</span>
                        <span className="picker-price">{fmt(getDisplayPrice(p))}</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleAddProduct(p)}
                      >
                        <i className="bi bi-plus-lg me-1" /> Add
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-secondary">
                  <p className="mb-2">No other equipment found in this category.</p>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => {
                      setOpen(false);
                      setShowPicker(false);
                      navigate("/products");
                    }}
                  >
                    Browse full marketplace catalog
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CompareQueue;
