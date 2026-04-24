const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const uploadPostImage = require('../middleware/upload');

const {
  listCommunityPosts,
  createPost,
  toggleLike,
} = require('../controllers/postController');

router.get('/', auth, listCommunityPosts);

router.post(
  '/',
  auth,
  uploadPostImage.single('image'),
  createPost
);

router.post('/:postId/like', auth, toggleLike);

module.exports = router;
