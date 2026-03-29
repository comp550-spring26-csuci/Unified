const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const {
  register,
  login,
  me,
  updateProfile,
  forgotPassword,
  resetPasswordWithOtp,
} = require('../controllers/authController');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads');
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

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password-otp', resetPasswordWithOtp);
router.get('/me', authRequired, me);
router.put('/me', authRequired, upload.single('avatar'), updateProfile);

module.exports = router;
