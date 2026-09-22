import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Comparison from '../models/Comparison.js';

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
