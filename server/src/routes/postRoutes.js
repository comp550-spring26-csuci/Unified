const express = require("express");
const router = express.Router();

const { authRequired } = require("../middleware/auth");
const uploadPostImage = require("../middleware/upload");

const {
  listCommunityPosts,
  createPost,
  toggleLike,
} = require("../controllers/postController");

router.get("/", authRequired, listCommunityPosts);

router.post(
  "/",
  authRequired,
  uploadPostImage.single("image"),
  createPost
);

router.post("/:postId/like", authRequired, toggleLike);

module.exports = router;
