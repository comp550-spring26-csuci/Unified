const fs = require("fs");
const path = require("path");
const multer = require("multer");

const postsDir = path.join(__dirname, "..", "..", "uploads", "posts");
const avatarsDir = path.join(__dirname, "..", "..", "uploads", "avatars");
const eventsDir = path.join(__dirname, "..", "..", "uploads", "events");

fs.mkdirSync(postsDir, { recursive: true });
fs.mkdirSync(avatarsDir, { recursive: true });
fs.mkdirSync(eventsDir, { recursive: true });

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

function makeStorage(uploadDir) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}_${safe}`);
    },
  });
}

const uploadPostImage = multer({
  storage: makeStorage(postsDir),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadAvatar = multer({
  storage: makeStorage(avatarsDir),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadEventImage = multer({
  storage: makeStorage(eventsDir),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = {
  uploadPostImage,
  uploadAvatar,
  uploadEventImage,
};