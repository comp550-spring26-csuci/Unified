const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const User = require('../models/User');
const PasswordResetOtp = require('../models/PasswordResetOtp');
const { signAccessToken } = require('../utils/tokens');
const { sendPasswordResetOtp } = require('../utils/mail');
const {
  findInvalidCommunityTags,
  normalizeCommunityTagList,
} = require('../constants/communityTags');

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

function toSafeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    country: user.country || '',
    city: user.city || '',
    mailingAddress: user.mailingAddress || '',
    interests: user.interests || [],
    avatarUrl: user.avatarUrl || '',
  };
}

async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  const { name, email, password } = parsed.data;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const user = new User({ name, email, passwordHash: 'tmp' });
  await user.setPassword(password);
  await user.save();

  const token = signAccessToken(user);
  return res.status(201).json({ token, user: toSafeUser(user) });
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  const { email, password } = parsed.data;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  if (user.status === 'banned') return res.status(403).json({ message: 'Account is banned' });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signAccessToken(user);
  return res.json({ token, user: toSafeUser(user) });
}

async function me(req, res) {
  const user = await User.findById(req.auth.sub);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(toSafeUser(user));
}

const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  country: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
  mailingAddress: z.string().max(300).optional(),
  interests: z.array(z.string().max(60)).optional(),
});

function parseInterests(raw) {
  if (Array.isArray(raw)) return raw.map((x) => String(x || '').trim()).filter(Boolean);
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim();
  if (!value) return [];
  return value.split(',').map((x) => x.trim()).filter(Boolean);
}

async function updateProfile(req, res) {
  const user = await User.findById(req.auth.sub);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const parsedInterests = parseInterests(req.body?.interests);
  const invalidInterests = findInvalidCommunityTags(parsedInterests || []);
  if (invalidInterests.length) {
    return res.status(400).json({
      message: 'Invalid interests selected',
      invalidInterests,
    });
  }

  const parsed = updateProfileSchema.safeParse({
    name: req.body?.name,
    country: req.body?.country,
    city: req.body?.city,
    mailingAddress: req.body?.mailingAddress,
    interests:
      parsedInterests === undefined
        ? undefined
        : normalizeCommunityTagList(parsedInterests, { max: 20 }),
  });
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  const data = parsed.data;
  if (data.name !== undefined) user.name = data.name;
  if (data.country !== undefined) user.country = data.country;
  if (data.city !== undefined) user.city = data.city;
  if (data.mailingAddress !== undefined) user.mailingAddress = data.mailingAddress;
  if (data.interests !== undefined) user.interests = data.interests.slice(0, 20);
  if (req.file) user.avatarUrl = `/uploads/${req.file.filename}`;

  await user.save();
  return res.json({ user: toSafeUser(user) });
}

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordWithOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  password: z.string().min(6).max(200),
});

const FORGOT_PASSWORD_OK =
  'If an account exists for this email, you will receive a code shortly.';

async function forgotPassword(req, res) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  const email = parsed.data.email.toLowerCase().trim();
  const user = await User.findOne({ email });
  if (!user || user.status === 'banned') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[auth] forgot-password: no active account for this email; no email will be sent (response is still generic).'
      );
    }
    return res.json({ message: FORGOT_PASSWORD_OK });
  }

  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await PasswordResetOtp.deleteMany({ email });
  await PasswordResetOtp.create({ email, otpHash, expiresAt });

  const sent = await sendPasswordResetOtp(email, otp);
  if (!sent.ok) {
    await PasswordResetOtp.deleteMany({ email });
    const detail =
      process.env.NODE_ENV !== 'production' && sent.error ? sent.error : undefined;
    return res.status(503).json({
      message: 'Email could not be sent. Check server logs and SMTP settings, then try again.',
      ...(detail ? { detail } : {}),
    });
  }

  return res.json({
    message: FORGOT_PASSWORD_OK,
    devMode: Boolean(sent.devLogged),
  });
}

async function resetPasswordWithOtp(req, res) {
  const parsed = resetPasswordWithOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  const { email, otp, password } = parsed.data;
  const normalized = email.toLowerCase().trim();

  const record = await PasswordResetOtp.findOne({ email: normalized });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired code. Request a new one.' });
  }
  if (record.attempts >= 5) {
    await PasswordResetOtp.deleteMany({ email: normalized });
    return res.status(400).json({ message: 'Too many attempts. Request a new code.' });
  }

  const match = await bcrypt.compare(otp, record.otpHash);
  if (!match) {
    record.attempts += 1;
    await record.save();
    return res.status(400).json({ message: 'Invalid code.' });
  }

  const user = await User.findOne({ email: normalized }).select('+passwordHash');
  if (!user) {
    await PasswordResetOtp.deleteMany({ email: normalized });
    return res.status(400).json({ message: 'Invalid or expired code. Request a new one.' });
  }
  if (user.status === 'banned') {
    await PasswordResetOtp.deleteMany({ email: normalized });
    return res.status(403).json({ message: 'Account is banned' });
  }

  await user.setPassword(password);
  await user.save();
  await PasswordResetOtp.deleteMany({ email: normalized });

  return res.json({ message: 'Password updated. You can sign in with your new password.' });
}

module.exports = { register, login, me, updateProfile, forgotPassword, resetPasswordWithOtp };
