import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: { type: String, trim: true, maxlength: 200 },
    review: { type: String, trim: true, maxlength: 5000 },
    pros: [{ type: String, trim: true, maxlength: 200 }],
    cons: [{ type: String, trim: true, maxlength: 200 }],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true },
);

// L3: Prevent duplicate reviews — one review per buyer per product
schema.index({ product: 1, buyer: 1 }, { unique: true });

export default mongoose.model('Review', schema);
