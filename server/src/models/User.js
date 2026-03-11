const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ['user', 'community_admin', 'super_admin'],
      default: 'user',
      index: true,
    },

    status: { type: String, enum: ['active', 'banned'], default: 'active', index: true },

    country: { type: String, trim: true },
    city: { type: String, trim: true },
    mailingAddress: { type: String, trim: true },
    interests: [{ type: String, trim: true }],

    avatarUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(password) {
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(password, salt);
};

userSchema.methods.comparePassword = async function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
