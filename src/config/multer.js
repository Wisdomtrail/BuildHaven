const multer = require('multer');

// Configure multer to store files in memory (as buffer)
const storage = multer.memoryStorage();

const uploadProfileImage = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for profile image'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for profile image
}).single('profileImage');

const uploadProductImage = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for product images'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per image
}).array('productImage', 5); // Allows multiple images (max 5)

module.exports = { uploadProfileImage, uploadProductImage };
