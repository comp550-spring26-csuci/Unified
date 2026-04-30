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

const ROLE_USER = 'user';
const ROLE_BUSINESS_OWNER = 'business_owner';

const businessProfileSchema = z.object({
  businessName: z.string().min(2).max(120),
  businessLocation: z.string().min(2).max(200),
  businessCategory: z.string().min(2).max(120),
  businessDescription: z.string().max(2000).optional().default(''),
  businessServices: z.string().max(2000).optional().default(''),
});

const registerSchema = z
  .object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(6).max(200),
    role: z.enum([ROLE_USER, ROLE_BUSINESS_OWNER]).optional().default(ROLE_USER),
    businessName: z.string().max(120).optional(),
    businessLocation: z.string().max(200).optional(),
    businessCategory: z.string().max(120).optional(),
    businessDescription: z.string().max(2000).optional().default(''),
    businessServices: z.string().max(2000).optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.role !== ROLE_BUSINESS_OWNER) return;
    const parsed = businessProfileSchema.safeParse(data);
    if (parsed.success) return;
    for (const issue of parsed.error.issues) {
      ctx.addIssue(issue);
    }
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
    businessProfile: {
      businessName: user.businessProfile?.businessName || '',
      businessLocation: user.businessProfile?.businessLocation || '',
      businessCategory: user.businessProfile?.businessCategory || '',
      description: user.businessProfile?.description || '',
      services: user.businessProfile?.services || '',
    },
  };
}

async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  const {
    name,
    email,
    password,
    role,
    businessName,
    businessLocation,
    businessCategory,
    businessDescription,
    businessServices,
  } = parsed.data;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const user = new User({
    name,
    email,
    passwordHash: 'tmp',
    role,
    ...(role === ROLE_BUSINESS_OWNER
      ? {
          businessProfile: {
            businessName,
            businessLocation,
            businessCategory,
            description: businessDescription || '',
            services: businessServices || '',
          },
        }
      : {}),
  });
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
  upgradeToBusinessOwner: z.boolean().optional(),
  businessName: z.string().max(120).optional(),
  businessLocation: z.string().max(200).optional(),
  businessCategory: z.string().max(120).optional(),
  businessDescription: z.string().max(2000).optional(),
  businessServices: z.string().max(2000).optional(),
});

function parseInterests(raw) {
  if (Array.isArray(raw)) return raw.map((x) => String(x || '').trim()).filter(Boolean);
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim();
  if (!value) return [];
  return value.split(',').map((x) => x.trim()).filter(Boolean);
}

function parseBooleanish(raw) {
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') {
    const value = raw.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(value)) return true;
    if (['false', '0', 'no', 'off', ''].includes(value)) return false;
  }
  return undefined;
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
    upgradeToBusinessOwner: parseBooleanish(req.body?.upgradeToBusinessOwner),
    businessName: req.body?.businessName,
    businessLocation: req.body?.businessLocation,
    businessCategory: req.body?.businessCategory,
    businessDescription: req.body?.businessDescription,
    businessServices: req.body?.businessServices,
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
  const shouldUpgradeToBusinessOwner =
    user.role === ROLE_USER && data.upgradeToBusinessOwner === true;
  if (shouldUpgradeToBusinessOwner) {
    user.role = ROLE_BUSINESS_OWNER;
  }
  if (user.role === ROLE_BUSINESS_OWNER) {
    const nextBusinessProfile = {
      businessName:
        data.businessName !== undefined
          ? data.businessName
          : user.businessProfile?.businessName || '',
      businessLocation:
        data.businessLocation !== undefined
          ? data.businessLocation
          : user.businessProfile?.businessLocation || '',
      businessCategory:
        data.businessCategory !== undefined
          ? data.businessCategory
          : user.businessProfile?.businessCategory || '',
      businessDescription:
        data.businessDescription !== undefined
          ? data.businessDescription
          : user.businessProfile?.description || '',
      businessServices:
        data.businessServices !== undefined
          ? data.businessServices
          : user.businessProfile?.services || '',
    };

    const businessParsed = businessProfileSchema.safeParse(nextBusinessProfile);
    if (!businessParsed.success) {
      return res.status(400).json({ message: 'Invalid business profile', errors: businessParsed.error.issues });
    }

    user.businessProfile = {
      businessName: businessParsed.data.businessName,
      businessLocation: businessParsed.data.businessLocation,
      businessCategory: businessParsed.data.businessCategory,
      description: businessParsed.data.businessDescription || '',
      services: businessParsed.data.businessServices || '',
    };
  }

  await user.save();
  const nextToken = shouldUpgradeToBusinessOwner ? signAccessToken(user) : undefined;
  return res.json({ user: toSafeUser(user), ...(nextToken ? { token: nextToken } : {}) });
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
