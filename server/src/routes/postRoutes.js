const express = require("express");
const router = express.Router();

const { authRequired } = require("../middleware/auth");
const uploadPostImage = require("../middleware/upload");

router.post(
  "/",
  authRequired,
  uploadPostImage.single("image"),
  async (req, res) => {
    try {
      console.log(req.file);
      console.log(req.body);

      res.json({
        message: "Post created",
        file: req.file,
        body: req.body,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
