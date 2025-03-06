const multer = require("multer");

const storage = multer.memoryStorage();

// Profile Image Upload (Single Image)
const uploadProfileImage = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed for profile images"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).single("profileImage");

// Product Image Upload (Multiple Images)
const uploadProductImage = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed for product images"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per image
}).array("productImage", 5); // Allows multiple images (max 5)

const uploadNewArrivalVideo = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
      return cb(new Error("Only video files are allowed for new arrival videos"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit per video
}).single("video"); // <-- Change this to match your Postman key


module.exports = { uploadProfileImage, uploadProductImage, uploadNewArrivalVideo };
