const Community = require('../models/Community');

async function listPendingCommunities(req, res) {
  const communities = await Community.find({ status: 'pending' }).sort({ createdAt: -1 });
  return res.json({ communities });
}

async function approveCommunity(req, res) {
  const community = await Community.findByIdAndUpdate(
    req.params.id,
    { $set: { status: 'approved' } },
    { new: true }
  );
  if (!community) return res.status(404).json({ message: 'Community not found' });
  return res.json({ community });
}

async function rejectCommunity(req, res) {
  const community = await Community.findByIdAndUpdate(
    req.params.id,
    { $set: { status: 'rejected' } },
    { new: true }
  );
  if (!community) return res.status(404).json({ message: 'Community not found' });
  return res.json({ community });
}

module.exports = { listPendingCommunities, approveCommunity, rejectCommunity };
