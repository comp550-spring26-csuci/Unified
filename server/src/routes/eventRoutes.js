const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { authRequired } = require('../middleware/auth');
const { listCommunityEvents, createEvent, rsvp, volunteer, getEventOwnerDetails } = require('../controllers/eventController');

const router = express.Router({ mergeParams: true });
const uploadDir = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists before multer writes files.
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({ storage });

router.use(authRequired);

router.get('/', listCommunityEvents);
router.post('/', upload.single('image'), createEvent);
router.get('/:eventId/owner', getEventOwnerDetails);
router.post('/:eventId/rsvp', rsvp);
router.post('/:eventId/volunteer', volunteer);

module.exports = router;
