const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    acceptedBid: { type: mongoose.Schema.Types.ObjectId, index: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessageText: { type: String, trim: true, maxlength: 4000, default: '' },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

conversationSchema.index({ event: 1 }, { unique: true });
conversationSchema.index({ participants: 1, lastMessageAt: -1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
