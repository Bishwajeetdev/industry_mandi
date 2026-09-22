import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, maxlength: 64 },
    message: { type: String, required: true, maxlength: 500 },
    read: { type: Boolean, default: false },
    entityId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

// Compound index for user unread notification polling and sorting
schema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', schema);
