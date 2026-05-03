const { z } = require('zod');
const Community = require('../models/Community');
const Membership = require('../models/Membership');
const Post = require('../models/Post');

async function requireApprovedMember(userId, communityId) {
  const community = await Community.findById(communityId);
  if (!community) return { ok: false, status: 404, message: 'Community not found' };
  if (community.status !== 'approved') {
    return { ok: false, status: 403, message: 'Community not approved' };
  }

  const membership = await Membership.findOne({
    user: userId,
    community: communityId,
    status: 'approved',
  });

  if (!membership) {
    return { ok: false, status: 403, message: 'Membership required' };
  }

  return { ok: true, community };
}

async function listCommunityPosts(req, res) {
  const { communityId } = req.params;

  const auth = await requireApprovedMember(req.auth.sub, communityId);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const posts = await Post.find({ community: communityId })
    .populate('author', 'name email avatarUrl')
    .populate({
      path: 'event',
      populate: [
        { path: 'createdBy', select: 'name' },
        { path: 'attendees', select: 'name' },
        { path: 'volunteers', select: 'name' },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(200);

  return res.json({ posts });
}

const createSchema = z.object({
  text: z.string().trim().max(5000).optional().default(''),
});

async function createPost(req, res) {
  try {
    const { communityId } = req.params;

    const auth = await requireApprovedMember(req.auth.sub, communityId);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const parsed = createSchema.safeParse({
      text: typeof req.body?.text === 'string' ? req.body.text : '',
    });

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid input',
        errors: parsed.error.issues,
      });
    }

    const text = parsed.data.text.trim();

    const images = req.file
      ? [`/uploads/posts/${req.file.filename}`]
      : [];

    if (!text && images.length === 0) {
      return res.status(400).json({
        message: 'Post text or image is required',
      });
    }

    const post = await Post.create({
      community: communityId,
      author: req.auth.sub,
      text,
      images,
      likes: [],
    });

    const populated = await Post.findById(post._id)
      .populate('author', 'name email avatarUrl')
      .populate({
        path: 'event',
        populate: [
          { path: 'createdBy', select: 'name' },
          { path: 'attendees', select: 'name' },
          { path: 'volunteers', select: 'name' },
        ],
      });

    return res.status(201).json({ post: populated });
  } catch (err) {
    console.error('createPost error:', err);
    return res.status(500).json({ message: 'Failed to create post' });
  }
}

async function toggleLike(req, res) {
  const { communityId, postId } = req.params;

  const auth = await requireApprovedMember(req.auth.sub, communityId);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const post = await Post.findOne({ _id: postId, community: communityId });
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const uid = String(req.auth.sub);
  const has = post.likes.map(String).includes(uid);

  if (has) {
    post.likes = post.likes.filter((x) => String(x) !== uid);
  } else {
    post.likes.push(req.auth.sub);
  }

  await post.save();

  return res.json({ likes: post.likes.length, liked: !has });
}

module.exports = { listCommunityPosts, createPost, toggleLike };