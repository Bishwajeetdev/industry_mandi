import { haveSameProductCategory } from "./helpers";

export const clearCompareQueue = () => {
  localStorage.setItem("compareProducts", JSON.stringify([]));
  window.dispatchEvent(new CustomEvent("compare-updated", { detail: { products: [] } }));
};

export const addToCompareQueue = (product) => {
  if (!product) return [];
  const compared = JSON.parse(localStorage.getItem("compareProducts") || "[]");
  if (compared.length > 0 && !haveSameProductCategory([...compared, product])) {
    const category = compared[0]?.category || "the selected product category";
    alert(`Cannot compare products from different or unspecified categories. All compared products must belong to "${category}".`);
    return compared;
  }
  const next = compared.some((item) => String(item._id) === String(product._id))
    ? compared
    : [...compared, product].slice(0, 4);
  localStorage.setItem("compareProducts", JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("compare-updated", { detail: { products: next } }));
  return next;
};

export const removeFromCompareQueue = (productId) => {
  try {
    const compared = JSON.parse(localStorage.getItem("compareProducts") || "[]");
    const next = compared.filter((item) => String(item._id) !== String(productId));
    localStorage.setItem("compareProducts", JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("compare-updated", { detail: { products: next } }));
    return next;
  } catch {
    return [];
  }
};
