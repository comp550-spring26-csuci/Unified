const { z } = require('zod');
const Community = require('../models/Community');
const Membership = require('../models/Membership');

const createSchema = z.object({
  name: z.string().min(2).max(120),
  keywords: z.array(z.string().min(1).max(50)).optional().default([]),
  description: z.string().max(2000).optional().default(''),
  rules: z.string().min(10).max(5000),
  region: z.string().max(120).optional().default(''),
  address: z.string().max(300).optional().default(''),
  logoUrl: z.string().url().optional(),
});
const updateRulesSchema = z.object({
  rules: z.string().min(10).max(5000),
});

async function listApproved(req, res) {
  const q = (req.query.q || '').toString().trim();
  const filter = { status: 'approved' };
  let query = Community.find(filter).sort({ createdAt: -1 });
  if (q) query = Community.find({ ...filter, $text: { $search: q } });
  const communities = await query.limit(200);
  return res.json({ communities });
}

async function createCommunity(req, res) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  const community = await Community.create({
    ...parsed.data,
    createdBy: req.auth.sub,
    admins: [req.auth.sub],
  });

  // Creator gets approved membership automatically (even while community pending)
  await Membership.updateOne(
    { user: req.auth.sub, community: community._id },
    { $setOnInsert: { user: req.auth.sub, community: community._id, status: 'approved', joinedAt: new Date() } },
    { upsert: true }
  );

  return res.status(201).json({ community });
}

async function getCommunity(req, res) {
  const community = await Community.findById(req.params.id);
  if (!community) return res.status(404).json({ message: 'Community not found' });
  if (community.status !== 'approved') {
    // Only super_admin or community admin can view pending/rejected
    const isSuper = req.auth?.role === 'super_admin';
    const admins = Array.isArray(community.admins) ? community.admins : [];
    const isAdmin = admins.map(String).includes(String(req.auth?.sub));
    const isCreator = String(community.createdBy) === String(req.auth?.sub);
    if (!isSuper && !isAdmin && !isCreator) return res.status(403).json({ message: 'Community not approved' });
  }
  return res.json({ community });
}

async function myCommunities(req, res) {
  const memberships = await Membership.find({ user: req.auth.sub, status: 'approved' }).populate('community');
  const communities = memberships.map((m) => m.community).filter(Boolean);
  return res.json({ communities });
}

async function updateCommunityRules(req, res) {
  const community = await Community.findById(req.params.id);
  if (!community) return res.status(404).json({ message: 'Community not found' });

  const isSuper = req.auth?.role === 'super_admin';
  const admins = Array.isArray(community.admins) ? community.admins : [];
  const isAdmin = admins.map(String).includes(String(req.auth?.sub));
  const isCreator = String(community.createdBy) === String(req.auth?.sub);
  if (!isSuper && !isAdmin && !isCreator) return res.status(403).json({ message: 'Forbidden' });

  const parsed = updateRulesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  community.rules = parsed.data.rules;
  await community.save();
  return res.json({ community });
}

module.exports = { listApproved, createCommunity, getCommunity, myCommunities, updateCommunityRules };
