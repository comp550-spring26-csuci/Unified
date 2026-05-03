const express = require('express');
const { authRequired } = require('../middleware/auth');
const { uploadEventImage } = require('../middleware/upload');

const {
  listCommunityEvents,
  createEvent,
  updateEvent,
  rsvp,
  volunteer,
  getEventOwnerDetails,
} = require('../controllers/eventController');

const router = express.Router({ mergeParams: true });

router.use(authRequired);

router.get('/', listCommunityEvents);

router.post(
  '/',
  uploadEventImage.single('image'),
  createEvent
);

router.patch(
  '/:eventId',
  uploadEventImage.single('image'),
  updateEvent
);

router.get('/:eventId/owner', getEventOwnerDetails);
router.post('/:eventId/rsvp', rsvp);
router.post('/:eventId/volunteer', volunteer);

module.exports = router;