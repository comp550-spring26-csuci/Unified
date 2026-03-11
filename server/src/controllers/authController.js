const { z } = require('zod');
const User = require('../models/User');
const { signAccessToken } = require('../utils/tokens');

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
    country: user.country || "",
    city: user.city || "",
    mailingAddress: user.mailingAddress || "",
    interests: user.interests || [],
    avatarUrl: user.avatarUrl || "",
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
  const v = raw.trim();
  if (!v) return [];
  // Supports comma-separated strings from form input.
  return v.split(',').map((x) => x.trim()).filter(Boolean);
}

async function updateProfile(req, res) {
  const user = await User.findById(req.auth.sub);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const parsed = updateProfileSchema.safeParse({
    name: req.body?.name,
    country: req.body?.country,
    city: req.body?.city,
    mailingAddress: req.body?.mailingAddress,
    interests: parseInterests(req.body?.interests),
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

module.exports = { register, login, me, updateProfile };
