const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 5000 },
    whoFor: { type: String, trim: true, maxlength: 2000, default: '' },
    whatToBring: { type: String, trim: true, maxlength: 2000, default: '' },
    volunteerRequirements: { type: String, trim: true, maxlength: 2000, default: '' },
    date: { type: Date, required: true, index: true },
    endDate: { type: Date },
    venue: { type: String, required: true, trim: true, maxlength: 300 },
    capacity: { type: Number, default: 0, min: 0 },
    location: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },
    imageUrl: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    agenda: {
      startOffsetMinutes: { type: Number, default: 0 },
      items: [
        {
          title: { type: String, trim: true, maxlength: 200, default: '' },
          durationMinutes: { type: Number, min: 1, max: 24 * 60, default: 30 },
          gapBeforeMinutes: { type: Number, min: 0, default: 0 },
        },
      ],
    },
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
