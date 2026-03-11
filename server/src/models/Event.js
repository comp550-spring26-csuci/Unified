const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 5000 },
    date: { type: Date, required: true, index: true },
    venue: { type: String, required: true, trim: true, maxlength: 300 },
    capacity: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

eventSchema.virtual('attendeeCount').get(function () {
  return this.attendees.length;
});

eventSchema.set('toJSON', { virtuals: true });

eventSchema.index({ community: 1, date: 1 });

module.exports = mongoose.model('Event', eventSchema);
