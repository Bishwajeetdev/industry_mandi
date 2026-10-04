export const notifyWishlistChanged = (items) =>
  window.dispatchEvent(
    new CustomEvent("wishlist-updated", {
      detail: { count: Array.isArray(items) ? items.length : undefined },
    })
  );

export const notifyCartChanged = () => window.dispatchEvent(new Event("cart-updated"));
