const { z } = require('zod');
const Community = require('../models/Community');
const Membership = require('../models/Membership');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

async function requireApprovedMember(userId, communityId) {
  const community = await Community.findById(communityId);
  if (!community) return { ok: false, status: 404, message: 'Community not found' };
  if (community.status !== 'approved') return { ok: false, status: 403, message: 'Community not approved' };
  const membership = await Membership.findOne({ user: userId, community: communityId, status: 'approved' });
  if (!membership) return { ok: false, status: 403, message: 'Membership required' };
  return { ok: true };
}

async function listComments(req, res) {
  const { communityId, postId } = req.params;
  const auth = await requireApprovedMember(req.auth.sub, communityId);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const post = await Post.findOne({ _id: postId, community: communityId });
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const comments = await Comment.find({ post: postId })
    .populate('author', 'name email avatarUrl')
    .sort({ createdAt: 1 })
    .limit(500);

  return res.json({ comments });
}

const createSchema = z.object({ text: z.string().min(1).max(2000) });

async function createComment(req, res) {
  const { communityId, postId } = req.params;
  const auth = await requireApprovedMember(req.auth.sub, communityId);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const post = await Post.findOne({ _id: postId, community: communityId });
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  const comment = await Comment.create({ post: postId, author: req.auth.sub, text: parsed.data.text });
  const populated = await Comment.findById(comment._id).populate('author', 'name email avatarUrl');
  return res.status(201).json({ comment: populated });
}

module.exports = { listComments, createComment };
