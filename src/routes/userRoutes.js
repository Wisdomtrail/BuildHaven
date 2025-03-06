const express = require('express');
const passport = require('passport');
const { register, login, uploadProfileImage, updateUserInfo, getUserProfile, deleteUser, addToCart, getCart, getCartQuantity, deleteCartItem, clearCart, getOrdersByUserId, deleteOrderByUserId, getAllUsers, getAllUserCount, deleteUserById, deleteAllUsers, markAsReadNotificationUser } = require('../controllers/userController');
const { uploadProfileImage: uploadProfile, uploadNewArrivalVideo } = require('../config/multer');
const { deleteAllOrdersByUserId, deleteAllOrders } = require('../controllers/ordersController');
const { createAdmin, getAdmin, uploadAdminProfileImage, markAsreadNotification, uploadNewArrivalVideoController, getNewArrivalVideoController } = require('../controllers/adminController');
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
  '/upload-admin-profile-image/:adminId',
  passport.authenticate('jwt', { session: false }),
  uploadProfile,
  authenticateJWT,
  authorizeAdmin,
  uploadAdminProfileImage
)

router.post(
  "/upload-new-arrival-video",
  passport.authenticate("jwt", { session: false }),
  uploadNewArrivalVideo,
  authenticateJWT,
  authorizeAdmin,
  uploadNewArrivalVideoController
);

// **Route to Get New Arrival Video**
router.get(
  "/get-new-arrival-video",
  getNewArrivalVideoController
);

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

router.put(
  "/:userId/user-notifications/read",
  passport.authenticate('jwt', { session: false }),
  markAsReadNotificationUser
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
