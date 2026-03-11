const express = require('express');
const { authRequired } = require('../middleware/auth');
const { listCommunityPosts, createPost, toggleLike } = require('../controllers/postController');
const { listComments, createComment } = require('../controllers/commentController');

const router = express.Router({ mergeParams: true });

router.use(authRequired);

router.get('/', listCommunityPosts);
router.post('/', createPost);
router.post('/:postId/like', toggleLike);

router.get('/:postId/comments', listComments);
router.post('/:postId/comments', createComment);

module.exports = router;
