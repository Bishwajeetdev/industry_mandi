import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Comparison from '../models/Comparison.js';
import ProductRequest from '../models/ProductRequest.js';

// ── M6: Validate productId is a real ObjectId before touching DB ──────────────
export async function wishlist(req, res) {
  const id = req.params.productId;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(422).json({ success: false, message: 'Invalid product ID' });

  const u = req.user;
  if (u.wishlist.some((x) => String(x) === id))
    u.wishlist = u.wishlist.filter((x) => String(x) !== id);
  else
    u.wishlist.push(id);

  await u.save();
  res.json({ success: true, message: 'Wishlist updated', data: u.wishlist });
}

export async function myWishlist(req, res) {
  const u = await User.findById(req.user._id).populate('wishlist');
  res.json({ success: true, message: 'Wishlist retrieved', data: u.wishlist });
}

// ── C3: Whitelist only safe fields for review creation ────────────────────────
// Never accept status, buyer, product approval state from client
export async function review(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.body.product))
    return res.status(422).json({ success: false, message: 'Invalid product ID' });

  const exists = await Product.exists({ _id: req.body.product, status: { $in: ['approved', 'published'] } });
  if (!exists)
    return res.status(404).json({ success: false, message: 'Product not found' });

  // Validate rating
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return res.status(422).json({ success: false, message: 'Rating must be an integer between 1 and 5' });

  // Whitelist only safe user-supplied fields — buyer and status set by server
  const x = await Review.create({
    product: req.body.product,
    buyer: req.user._id,           // always from authenticated session
    rating,
    title: req.body.title ? String(req.body.title).trim().slice(0, 200) : undefined,
    review: req.body.review ? String(req.body.review).trim().slice(0, 5000) : undefined,
    pros: Array.isArray(req.body.pros) ? req.body.pros.map((s) => String(s).trim()).filter(Boolean).slice(0, 10) : [],
    cons: Array.isArray(req.body.cons) ? req.body.cons.map((s) => String(s).trim()).filter(Boolean).slice(0, 10) : [],
    status: 'pending',             // always start as pending — never from body
  });
  res.status(201).json({ success: true, message: 'Review submitted for moderation', data: x });
}

export async function reviews(req, res) {
  const filter = { status: 'approved' };
  if (req.query.product) {
    if (!mongoose.Types.ObjectId.isValid(req.query.product))
      return res.status(422).json({ success: false, message: 'Invalid product ID' });
    filter.product = req.query.product;
  }
  const data = await Review.find(filter).populate('buyer', 'name').sort('-createdAt').limit(100);
  res.json({ success: true, message: 'Reviews retrieved', data });
}

export async function dashboard(req, res) {
  const [wishlist, comparisons, reviews] = await Promise.all([
    User.countDocuments({ _id: req.user._id, wishlist: { $exists: true, $ne: [] } }),
    Comparison.countDocuments({ buyer: req.user._id }),
    Review.countDocuments({ buyer: req.user._id }),
  ]);
  res.json({ success: true, message: 'Buyer dashboard retrieved', data: { wishlist, comparisons, reviews } });
}

export async function notifications(req, res) {
  const Notification = (await import('../models/Notification.js')).default;
  const data = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(50);
  res.json({ success: true, message: 'Notifications retrieved', data });
}

const addressFields = ['label', 'line1', 'line2', 'city', 'state', 'postalCode', 'country'];
function cleanAddress(value) {
  if (!value || typeof value !== 'object') return null;
  const address = Object.fromEntries(addressFields
    .filter((field) => value[field] !== undefined)
    .map((field) => [field, String(value[field]).trim().slice(0, 200)]));
  if (!address.line1 || !address.city || !address.state || !address.postalCode) return null;
  return address;
}

export async function profile(req, res) {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: {
    name: user.name, email: user.email, phone: user.profile?.phone || '',
    dateOfBirth: user.profile?.dateOfBirth || null, gender: user.profile?.gender || '',
  }});
}

export async function updateProfile(req, res) {
  const profile = { ...(req.user.profile?.toObject?.() || {}) };
  if (req.body.name !== undefined) req.user.name = String(req.body.name).trim().slice(0, 200);
  if (req.body.phone !== undefined) profile.phone = String(req.body.phone).trim().slice(0, 40);
  if (req.body.dateOfBirth !== undefined) {
    const date = new Date(req.body.dateOfBirth);
    if (Number.isNaN(date.getTime()) || date > new Date()) return res.status(422).json({ success: false, message: 'Invalid date of birth' });
    profile.dateOfBirth = date;
  }
  if (req.body.gender !== undefined && !['male', 'female', 'non-binary', 'prefer-not-to-say', ''].includes(req.body.gender))
    return res.status(422).json({ success: false, message: 'Invalid gender' });
  if (req.body.gender !== undefined) profile.gender = req.body.gender;
  req.user.profile = profile;
  await req.user.save();
  res.json({ success: true, message: 'Buyer profile updated', data: { name: req.user.name, email: req.user.email, phone: profile.phone || '', dateOfBirth: profile.dateOfBirth || null, gender: profile.gender || '' } });
}

export async function addresses(req, res) {
  res.json({ success: true, data: req.user.profile?.addresses || [] });
}

export async function addAddress(req, res) {
  const address = cleanAddress(req.body);
  if (!address) return res.status(422).json({ success: false, message: 'line1, city, state and postalCode are required' });
  const profile = { ...(req.user.profile?.toObject?.() || {}) };
  const list = [...(profile.addresses || [])];
  const makeDefault = req.body.isDefault === true || !list.length;
  if (makeDefault) list.forEach((item) => { item.isDefault = false; });
  list.push({ ...address, isDefault: makeDefault });
  if (list.length > 10) return res.status(422).json({ success: false, message: 'Maximum 10 addresses allowed' });
  profile.addresses = list;
  req.user.profile = profile; await req.user.save();
  res.status(201).json({ success: true, data: profile.addresses });
}

export async function updateAddress(req, res) {
  const profile = { ...(req.user.profile?.toObject?.() || {}) };
  const list = [...(profile.addresses || [])];
  const index = list.findIndex((item) => String(item._id) === req.params.id);
  if (index < 0) return res.status(404).json({ success: false, message: 'Address not found' });
  const address = cleanAddress({ ...list[index], ...req.body });
  if (!address) return res.status(422).json({ success: false, message: 'line1, city, state and postalCode are required' });
  if (req.body.isDefault === true) list.forEach((item) => { item.isDefault = false; });
  list[index] = { ...list[index], ...address, isDefault: req.body.isDefault === undefined ? Boolean(list[index].isDefault) : req.body.isDefault === true };
  profile.addresses = list; req.user.profile = profile; await req.user.save();
  res.json({ success: true, data: profile.addresses });
}

export async function deleteAddress(req, res) {
  const profile = { ...(req.user.profile?.toObject?.() || {}) };
  const list = (profile.addresses || []).filter((item) => String(item._id) !== req.params.id);
  if (list.length === (profile.addresses || []).length) return res.status(404).json({ success: false, message: 'Address not found' });
  if (list.length && !list.some((item) => item.isDefault)) list[0].isDefault = true;
  profile.addresses = list; req.user.profile = profile; await req.user.save();
  res.json({ success: true, data: list });
}

export async function requestHistory(req, res) {
  const data = await ProductRequest.find({ user: req.user._id }).sort('-requestedAt').limit(100);
  res.json({ success: true, data });
}

export async function cancelRequest(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(422).json({ success: false, message: 'Invalid product request ID' });
  const request = await ProductRequest.findOne({ _id: req.params.id, user: req.user._id });
  if (!request) return res.status(404).json({ success: false, message: 'Product request not found' });
  if (request.status !== 'pending') return res.status(409).json({ success: false, message: 'Only pending requests can be cancelled' });
  request.status = 'cancelled'; request.cancelledAt = new Date(); await request.save();
  res.json({ success: true, data: request });
}

export async function notificationPreferences(req, res) {
  res.json({ success: true, data: req.user.profile?.notificationPreferences || {} });
}

export async function updateNotificationPreferences(req, res) {
  const allowed = ['priceFinder', 'orderUpdates', 'promotions', 'account'];
  const profile = { ...(req.user.profile?.toObject?.() || {}) };
  const current = { ...(profile.notificationPreferences || {}) };
  for (const key of allowed) if (req.body[key] !== undefined) current[key] = Boolean(req.body[key]);
  profile.notificationPreferences = current; req.user.profile = profile; await req.user.save();
  res.json({ success: true, data: current });
}
