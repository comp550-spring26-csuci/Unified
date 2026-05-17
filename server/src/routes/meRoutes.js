const express = require('express');
const { authRequired } = require('../middleware/auth');
const {
  listMyEvents,
  listVolunteerOpportunities,
  listBusinessOpportunities,
} = require('../controllers/eventController');
const { listMyRecentActivity } = require('../controllers/activityController');
const {
  listMyConversations,
  getConversationMessages,
  sendConversationMessage,
} = require('../controllers/conversationController');

const router = express.Router();
router.use(authRequired);
router.get('/events', listMyEvents);
router.get('/volunteer-opportunities', listVolunteerOpportunities);
router.get('/business-opportunities', listBusinessOpportunities);
router.get('/activity', listMyRecentActivity);
router.get('/conversations', listMyConversations);
router.get('/conversations/:conversationId/messages', getConversationMessages);
router.post('/conversations/:conversationId/messages', sendConversationMessage);

module.exports = router;
