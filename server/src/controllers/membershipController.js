const Community = require('../models/Community');
const Membership = require('../models/Membership');

function hasUserInList(list, userId) {
  return Array.isArray(list) && list.map(String).includes(String(userId));
}

function getCommunityActorFlags(community, auth = {}) {
  const userId = String(auth.sub || '');
  return {
    isSuper: auth.role === 'super_admin',
    isCreator: String(community?.createdBy || '') === userId,
    isAdmin: hasUserInList(community?.admins, userId),
    isModerator: hasUserInList(community?.moderators, userId),
  };
}

function resolveCommunityRole(community, userId) {
  const uid = String(userId || '');
  if (!uid) return 'member';
  if (String(community?.createdBy || '') === uid) return 'owner';
  if (hasUserInList(community?.admins, uid)) return 'admin';
  if (hasUserInList(community?.moderators, uid)) return 'moderator';
  return 'member';
}

function parseOptionalReason(reason) {
  if (typeof reason !== 'string') return '';
  return reason.trim().slice(0, 500);
}

function parseJoinProfile(body = {}) {
  const joinReason = typeof body.joinReason === 'string' ? body.joinReason.trim() : '';
  const aboutMe = typeof body.aboutMe === 'string' ? body.aboutMe.trim() : '';
  const contribution = typeof body.contribution === 'string' ? body.contribution.trim() : '';

  if (joinReason.length < 20) {
    return { ok: false, message: 'joinReason must include at least 20 characters' };
  }
  if (joinReason.length > 300) {
    return { ok: false, message: 'joinReason cannot exceed 300 characters' };
  }
  if (aboutMe.length < 20) {
    return { ok: false, message: 'aboutMe must include at least 20 characters' };
  }
  if (aboutMe.length > 300) {
    return { ok: false, message: 'aboutMe cannot exceed 300 characters' };
  }
  if (contribution.length > 200) {
    return { ok: false, message: 'contribution cannot exceed 200 characters' };
  }

  return { ok: true, data: { joinReason, aboutMe, contribution } };
}

async function requestJoin(req, res) {
  const { communityId } = req.body;
  if (!communityId) return res.status(400).json({ message: 'communityId required' });

  const community = await Community.findById(communityId);
  if (!community) return res.status(404).json({ message: 'Community not found' });
  if (community.status !== 'approved') return res.status(403).json({ message: 'Community not approved' });

  const profile = parseJoinProfile(req.body);
  if (!profile.ok) return res.status(400).json({ message: profile.message });

  const existing = await Membership.findOne({ user: req.auth.sub, community: communityId });
  if (existing?.status === 'approved') return res.json({ membership: existing });
  if (existing?.status === 'pending') return res.json({ membership: existing });
  if (existing?.status === 'rejected') {
    existing.status = 'pending';
    existing.joinedAt = undefined;
    existing.rejectionReason = '';
    existing.joinReason = profile.data.joinReason;
    existing.aboutMe = profile.data.aboutMe;
    existing.contribution = profile.data.contribution;
    await existing.save();
    return res.json({ membership: existing });
  }

  const membership = await Membership.create({
    user: req.auth.sub,
    community: communityId,
    status: 'pending',
    joinReason: profile.data.joinReason,
    aboutMe: profile.data.aboutMe,
    contribution: profile.data.contribution,
  });
  return res.status(201).json({ membership });
}

async function listMyMemberships(req, res) {
  const memberships = await Membership.find({ user: req.auth.sub }).populate('community');
  return res.json({ memberships });
}

async function listPendingForCommunity(req, res) {
  const community = await Community.findById(req.params.communityId);
  if (!community) return res.status(404).json({ message: 'Community not found' });

  const { isSuper, isAdmin, isModerator } = getCommunityActorFlags(community, req.auth);
  if (!isSuper && !isAdmin && !isModerator) return res.status(403).json({ message: 'Forbidden' });

  const memberships = await Membership.find({ community: community._id, status: 'pending' }).populate('user');
  return res.json({ memberships });
}

async function approveMembership(req, res) {
  const { communityId, memberId } = req.params;
  const community = await Community.findById(communityId);
  if (!community) return res.status(404).json({ message: 'Community not found' });

  const { isSuper, isAdmin, isModerator } = getCommunityActorFlags(community, req.auth);
  if (!isSuper && !isAdmin && !isModerator) return res.status(403).json({ message: 'Forbidden' });

  const membership = await Membership.findOneAndUpdate(
    { user: memberId, community: communityId },
    { $set: { status: 'approved', joinedAt: new Date(), rejectionReason: '' } },
    { new: true }
  );
  if (!membership) return res.status(404).json({ message: 'Membership not found' });
  return res.json({ membership });
}

async function rejectMembership(req, res) {
  const { communityId, memberId } = req.params;
  const community = await Community.findById(communityId);
  if (!community) return res.status(404).json({ message: 'Community not found' });

  const { isSuper, isAdmin, isModerator } = getCommunityActorFlags(community, req.auth);
  if (!isSuper && !isAdmin && !isModerator) return res.status(403).json({ message: 'Forbidden' });

  const reason = parseOptionalReason(req.body?.reason);
  const membership = await Membership.findOneAndUpdate(
    { user: memberId, community: communityId },
    { $set: { status: 'rejected', rejectionReason: reason, joinedAt: undefined } },
    { new: true }
  );
  if (!membership) return res.status(404).json({ message: 'Membership not found' });
  return res.json({ membership });
}

async function listApprovedMembersForCommunity(req, res) {
  const { communityId } = req.params;
  const community = await Community.findById(communityId);
  if (!community) return res.status(404).json({ message: 'Community not found' });

  const { isSuper, isCreator, isAdmin, isModerator } = getCommunityActorFlags(community, req.auth);
  if (!isSuper && !isCreator && !isAdmin && !isModerator) return res.status(403).json({ message: 'Forbidden' });

  const memberships = await Membership.find({ community: community._id, status: 'approved' }).populate(
    'user',
    'name email avatarUrl role status'
  );

  const members = memberships
    .filter((m) => m.user)
    .map((m) => ({
      membershipId: m._id,
      user: m.user,
      joinedAt: m.joinedAt,
      communityRole: resolveCommunityRole(community, m.user?._id),
    }));

  return res.json({ members });
}

async function updateCommunityMemberRole(req, res) {
  const { communityId, memberId } = req.params;
  const requestedRole = typeof req.body?.role === 'string' ? req.body.role.trim().toLowerCase() : '';
  if (!['member', 'moderator', 'admin'].includes(requestedRole)) {
    return res.status(400).json({ message: 'role must be one of: member, moderator, admin' });
  }

  const community = await Community.findById(communityId);
  if (!community) return res.status(404).json({ message: 'Community not found' });

  const { isSuper, isCreator, isAdmin } = getCommunityActorFlags(community, req.auth);
  if (!isSuper && !isCreator && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

  const membership = await Membership.findOne({
    user: memberId,
    community: communityId,
    status: 'approved',
  }).populate('user', 'name email avatarUrl role status');
  if (!membership) return res.status(404).json({ message: 'Approved membership not found' });

  const creatorId = String(community.createdBy || '');
  const targetId = String(memberId || '');
  if (targetId === creatorId && requestedRole !== 'admin') {
    return res.status(400).json({ message: 'Owner role cannot be changed' });
  }

  const admins = new Set((Array.isArray(community.admins) ? community.admins : []).map(String));
  const moderators = new Set((Array.isArray(community.moderators) ? community.moderators : []).map(String));

  admins.delete(targetId);
  moderators.delete(targetId);

  if (requestedRole === 'admin') admins.add(targetId);
  if (requestedRole === 'moderator') moderators.add(targetId);

  // Keep creator as admin for consistency.
  if (creatorId) admins.add(creatorId);

  community.admins = Array.from(admins);
  community.moderators = Array.from(moderators);
  await community.save();

  return res.json({
    member: {
      membershipId: membership._id,
      user: membership.user,
      joinedAt: membership.joinedAt,
      communityRole: resolveCommunityRole(community, targetId),
    },
  });
}

module.exports = {
  requestJoin,
  listMyMemberships,
  listPendingForCommunity,
  approveMembership,
  rejectMembership,
  listApprovedMembersForCommunity,
  updateCommunityMemberRole,
};
