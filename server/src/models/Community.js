const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    keywords: [{ type: String, trim: true }],
    description: { type: String, trim: true, maxlength: 2000 },
    rules: { type: String, trim: true, maxlength: 5000 },

    region: { type: String, trim: true },
    address: { type: String, trim: true },

    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    logoUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

communitySchema.index({ name: 'text', keywords: 'text', description: 'text' });

module.exports = mongoose.model('Community', communitySchema);
