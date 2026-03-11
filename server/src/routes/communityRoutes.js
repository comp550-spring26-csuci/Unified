const express = require('express');
const { authRequired } = require('../middleware/auth');
const {
  listApproved,
  createCommunity,
  getCommunity,
  myCommunities,
  updateCommunityRules,
} = require('../controllers/communityController');

const router = express.Router();

router.get('/', listApproved);
router.get('/mine', authRequired, myCommunities);
router.post('/', authRequired, createCommunity);
router.get('/:id', authRequired, getCommunity);
router.put('/:id/rules', authRequired, updateCommunityRules);

module.exports = router;
