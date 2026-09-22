import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, index: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, index: true },
    ip: { type: String, maxlength: 45 },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

schema.index({ user: 1, createdAt: -1 });

export default mongoose.model('AuditLog', schema);
