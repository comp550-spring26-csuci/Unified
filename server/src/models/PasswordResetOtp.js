const mongoose = require('mongoose');

const passwordResetOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PasswordResetOtp', passwordResetOtpSchema);
