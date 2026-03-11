const express = require('express');
const { authRequired } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { listPendingCommunities, approveCommunity, rejectCommunity } = require('../controllers/adminController');

const router = express.Router();

router.use(authRequired, requireRole('super_admin'));

router.get('/communities/pending', listPendingCommunities);
router.post('/communities/:id/approve', approveCommunity);
router.post('/communities/:id/reject', rejectCommunity);

module.exports = router;
