import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fmt, getDisplayPrice } from "../../utils/helpers";

function CartDrawer() {
  const [open, setOpen] = useState(false), [items, setItems] = useState([]);
  const loadCart = () => setItems(JSON.parse(localStorage.getItem("cart") || "[]").map((item) => ({ ...item, price: getDisplayPrice(item) })));
  useEffect(() => {
    const handleCartChange = () => { loadCart(); setOpen(true); };
    window.addEventListener("cart-updated", handleCartChange);
    return () => window.removeEventListener("cart-updated", handleCartChange);
  }, []);
  if (!open) return null;
  const itemCount = items.reduce((total, item) => total + (item.quantity || 1), 0);
  const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  return <div className="cart-drawer-layer" role="presentation" onMouseDown={() => setOpen(false)}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping cart" onMouseDown={(event) => event.stopPropagation()}><div className="cart-drawer-header"><h2>Your Cart ({itemCount} {itemCount === 1 ? "item" : "items"})</h2><button className="cart-drawer-close" onClick={() => setOpen(false)} aria-label="Close cart"><i className="bi bi-x-lg" /></button></div><div className="cart-drawer-body">{items.map((item) => <article className="cart-drawer-item" key={item._id}><div className="cart-drawer-thumb">{(item.image || item.images?.[0]?.url || item.images?.[0]) ? <img src={item.image || item.images?.[0]?.url || item.images?.[0]} alt="" /> : <i className="bi bi-box-seam" />}</div><div><strong>{item.name}</strong><span>{item.quantity || 1} × {fmt(item.price)}</span></div><b>{fmt((item.price || 0) * (item.quantity || 1))}</b></article>)}</div><div className="cart-drawer-footer"><div><span>Estimated total</span><strong>{fmt(total)}</strong></div><Link to="/cart" className="btn btn-primary w-100" onClick={() => setOpen(false)}>View cart & checkout <i className="bi bi-arrow-right ms-2" /></Link></div></aside></div>;
}

export default CartDrawer;
