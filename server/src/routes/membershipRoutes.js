const express = require('express');
const { authRequired } = require('../middleware/auth');
const {
  requestJoin,
  listMyMemberships,
  listPendingForCommunity,
  approveMembership,
  rejectMembership,
  listApprovedMembersForCommunity,
  updateCommunityMemberRole,
} = require('../controllers/membershipController');

const router = express.Router();

router.use(authRequired);

router.post('/request', requestJoin);
router.get('/mine', listMyMemberships);

router.get('/community/:communityId/pending', listPendingForCommunity);
router.get('/community/:communityId/members', listApprovedMembersForCommunity);
router.post('/community/:communityId/member/:memberId/approve', approveMembership);
router.post('/community/:communityId/member/:memberId/reject', rejectMembership);
router.put('/community/:communityId/member/:memberId/role', updateCommunityMemberRole);

module.exports = router;
