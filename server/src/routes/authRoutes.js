const express = require('express');
const {
  register,
  login,
  me,
  updateProfile,
  forgotPassword,
  resetPasswordWithOtp,
} = require('../controllers/authController');

const { authRequired } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password-otp', resetPasswordWithOtp);

router.get('/me', authRequired, me);

router.put(
  '/me',
  authRequired,
  uploadAvatar.single('avatar'),
  updateProfile
);

module.exports = router;
