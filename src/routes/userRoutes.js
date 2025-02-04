const express = require('express');
const passport = require('passport');
const { register, login, uploadProfileImage, updateUserInfo, getUserProfile, deleteUser } = require('../controllers/userController');
const { uploadProfileImage: uploadProfile } = require('../config/multer');
const { editProductById } = require('../controllers/productsContoller');

const router = express.Router();

router.post(
  '/upload-profile-image/:userId',
  passport.authenticate('jwt', { session: false }),
  uploadProfile,
  uploadProfileImage
);

router.post(
  '/updateInfo/:userId',
  passport.authenticate('jwt', { session: false }),
  updateUserInfo
);

router.get(
  '/profile/:userId',
  passport.authenticate('jwt', { session: false }),
  getUserProfile
);

router.put(
  '/edit-product/:id',
  passport.authenticate('jwt', { session: false }),
  editProductById,
)

router.delete(
    '/delete/:userId',
    passport.authenticate('jwt', { session: false }),
    deleteUser
)

router.post('/register', register);

router.post('/login', login);


router.get(
  '/protected',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.status(200).json({ message: 'You have accessed a protected route', user: req.user });
  }
);

module.exports = router;
