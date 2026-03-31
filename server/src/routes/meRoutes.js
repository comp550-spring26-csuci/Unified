const express = require('express');
const { authRequired } = require('../middleware/auth');
const { listMyEvents } = require('../controllers/eventController');

const router = express.Router();
router.use(authRequired);
router.get('/events', listMyEvents);

module.exports = router;
