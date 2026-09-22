export function canManageProduct(product, user) {
  if (!product || !user) return false;
  if (user.role === "admin") return true;
  return String(product.submittedBy || product.vendor || "") === String(user._id || user.id || "");
}

export function canManageUser(targetUser, actor) {
  if (!targetUser || !actor) return false;
  if (actor.role === "admin") return true;
  return String(targetUser._id || targetUser.id) === String(actor._id || actor.id);
}
