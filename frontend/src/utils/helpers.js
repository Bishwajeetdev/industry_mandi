export const getDashboardPath = (role) =>
  role === "admin" ? "/admin" : role === "vendor" ? "/vendor" : "/dashboard/buyer";

export const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export const getDisplayPrice = (product) => {
  const listedPrice = Number(product?.price || product?.offerPrice || product?.salePrice);
  if (listedPrice > 0) return listedPrice;
  const str = String(product?.name || product?._id || product?.slug || "industrial-equipment");
  const seed = [...str].reduce((total, character, i) => total + character.charCodeAt(0) * (i + 1), 0);
  const cat = String(product?.category || "").toLowerCase();
  if (cat.includes("cnc") || cat.includes("machin")) {
    return 1450000 + (seed % 15) * 85000;
  } else if (cat.includes("switchgear") || cat.includes("power") || cat.includes("starter")) {
    return 135000 + (seed % 10) * 15000;
  } else if (cat.includes("vfd") || cat.includes("automation") || cat.includes("drive")) {
    return 62000 + (seed % 12) * 4500;
  } else if (cat.includes("pump")) {
    return 42500 + (seed % 8) * 3500;
  }
  return 48500 + (seed % 14) * 4200;
};

export const normalizeProductCategory = (product) => String(product?.category || "").trim().toLowerCase();

export const haveSameProductCategory = (products) => {
  const categories = products.map(normalizeProductCategory);
  return categories.length > 0 && categories.every((category) => category && category === categories[0]);
};
