const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Event = require('../models/Event');
const Community = require('../models/Community');
const Membership = require('../models/Membership');

/**
 * Recent actions by the user (posts, comments, events, communities, memberships).
 */
async function listMyRecentActivity(req, res) {
  const userId = req.auth.sub;

  const [posts, comments, events, createdCommunities, memberships] = await Promise.all([
    Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate('community', 'name')
      .select('createdAt text community')
      .lean(),
    Comment.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate({
        path: 'post',
        select: 'community',
        populate: { path: 'community', select: 'name' },
      })
      .select('createdAt text post')
      .lean(),
    Event.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate('community', 'name')
      .select('createdAt title community')
      .lean(),
    Community.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(12)
      .select('createdAt name')
      .lean(),
    Membership.find({ user: userId, status: 'approved' })
      .sort({ joinedAt: -1, updatedAt: -1 })
      .limit(12)
      .populate('community', 'name')
      .select('joinedAt updatedAt createdAt community')
      .lean(),
  ]);

  const items = [];

  posts.forEach((p) => {
    const cname = p.community?.name || 'a community';
    const snippet = (p.text || '').replace(/\s+/g, ' ').trim();
    const short = snippet.length > 100 ? `${snippet.slice(0, 100)}…` : snippet;
    items.push({
      at: p.createdAt,
      action: 'Posted',
      detail: short ? `in ${cname}: "${short}"` : `in ${cname}`,
    });
  });

  comments.forEach((c) => {
    if (!c.post) return;
    const cname = c.post.community?.name || 'a community';
    const snippet = (c.text || '').replace(/\s+/g, ' ').trim();
    const short = snippet.length > 80 ? `${snippet.slice(0, 80)}…` : snippet;
    items.push({
      at: c.createdAt,
      action: 'Commented',
      detail: short ? `in ${cname}: "${short}"` : `on a post in ${cname}`,
    });
  });

  events.forEach((e) => {
    const cname = e.community?.name || 'a community';
    items.push({
      at: e.createdAt,
      action: 'Created event',
      detail: `"${e.title || 'Untitled'}" in ${cname}`,
    });
  });

  createdCommunities.forEach((c) => {
    items.push({
      at: c.createdAt,
      action: 'Created community',
      detail: c.name || 'Untitled community',
    });
  });

  memberships.forEach((m) => {
    const cname = m.community?.name || 'a community';
    const at = m.joinedAt || m.updatedAt || m.createdAt;
    items.push({
      at,
      action: 'Joined community',
      detail: cname,
    });
  });

  items.sort((a, b) => new Date(b.at) - new Date(a.at));
  const activities = items.slice(0, 10).map((row) => ({
    ...row,
    at: row.at ? new Date(row.at).toISOString() : null,
  }));

  return res.json({ activities });
}

module.exports = { listMyRecentActivity };
