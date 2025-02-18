const express = require('express');
const passport = require('passport');
const { register, login, uploadProfileImage, updateUserInfo, getUserProfile, deleteUser, addCartFieldToUser, addToCart, getCart, getCartQuantity, deleteCartItem, clearCart, getOrdersByUserId, deleteOrderByUserId, getAllUsers, getAllUserCount, deleteUserById, deleteAllUsers } = require('../controllers/userController');
const { uploadProfileImage: uploadProfile } = require('../config/multer');
const { deleteAllOrdersByUserId, deleteAllOrders } = require('../controllers/ordersController');
const { createAdmin, getAdmin, uploadAdminProfileImage, markAsreadNotification } = require('../controllers/adminController');
const authorizeAdmin = require('../config/authorizeAdmin');
const authenticateJWT = require('../config/authenticateJWT');
const router = express.Router();

router.post(
  '/upload-profile-image/:userId',
  passport.authenticate('jwt', { session: false }),
  uploadProfile,
  uploadProfileImage
);

router.post(
  '/uplaod-admin-profile-image/:adminId',
  passport.authenticate('jwt', { session: false }),
  uploadProfile,
  authenticateJWT,
  authorizeAdmin,
  uploadAdminProfileImage
)

router.patch(
  '/updateInfo/:userId',
  passport.authenticate('jwt', { session: false }),
  updateUserInfo
);

router.get(
  '/get/All',
  passport.authenticate('jwt', { session: false }),
  authenticateJWT,
  authorizeAdmin,
  getAllUsers 
);

router.put(
  "/:adminId/notifications/read",
  passport.authenticate('jwt', { session: false }),
  authenticateJWT,
  authorizeAdmin,
  markAsreadNotification
)


router.get(
  '/get/All-count',
  passport.authenticate('jwt', { session: false }),
  authenticateJWT, // Authenticate the token
  authorizeAdmin,   // Check admin privileg
  getAllUserCount
)

router.delete(
  '/delete-user/:userId',
  passport.authenticate('jwt', { session: false }),
  authenticateJWT, // Authenticate the token
  authorizeAdmin,   // Check admin privileg
  deleteUserById
)

router.post(
  '/create-admin',
  passport.authenticate('jwt', { session: false }),
  authenticateJWT, // Authenticate the token
  authorizeAdmin,   // Check admin privileg
  createAdmin
)

router.delete(
  '/deleteAllOrder/:userId',
  passport.authenticate('jwt', { session: false }),
  deleteAllOrdersByUserId,
)
router.get(
  '/getAdmin/:adminId',
  passport.authenticate('jwt', { session: false }),
  authenticateJWT,
  authorizeAdmin,
  getAdmin
)

router.delete(
  '/deleteAllUsers/',
  passport.authenticate('jwt', { session: false }),
  authenticateJWT,
  authorizeAdmin,
  deleteAllUsers
)

router.delete(
  '/deleteAllOrders/',
  passport.authenticate('jwt', { session: false }),
  authenticateJWT,
  authorizeAdmin,
  deleteAllOrders
)

router.delete("/deleteOrder/:userId",
  passport.authenticate('jwt', { session: false }),
  deleteOrderByUserId);

router.get(
  '/getOrder/:userId',
  passport.authenticate('jwt', { session: false }),
  getOrdersByUserId
)

router.get(
  '/profile/:userId',
  passport.authenticate('jwt', { session: false }),
  getUserProfile
);


router.delete(
  '/delete/:userId',
  passport.authenticate('jwt', { session: false }),
  deleteUser
)


router.post(
  '/addToCart/:userId',
  passport.authenticate('jwt', { session: false }),
  addToCart
);

router.delete('/deleteCartItem/:userId/:productId',
  passport.authenticate('jwt', { session: false }),
  deleteCartItem);

router.delete('/clearCart/:userId',
  passport.authenticate('jwt', { session: false }),
  clearCart,
)
router.get(
  '/getCartQuantity/:userId',
  passport.authenticate('jwt', { session: false }),
   getCartQuantity);

router.get(
  '/getCart/:userId',
  passport.authenticate('jwt', { session: false }),
  getCart);

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
