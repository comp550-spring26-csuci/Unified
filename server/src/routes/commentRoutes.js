const express = require('express');
const {
  listComments,
  createComment,
} = require('../controllers/commentController');
const { authRequired } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// GET all comments for a post
router.get('/', authRequired, listComments);

// POST new comment
router.post('/', authRequired, createComment);

module.exports = router;