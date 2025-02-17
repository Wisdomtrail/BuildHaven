const express = require('express');
const passport = require('passport');
const { createProduct, getAllProducts, getProductById, updateProduct, getProductsByCategory, deleteProduct, markAsSold,
  getProductCount, getRecentProducts, 
  editProductById,
  } = require('../controllers/productsContoller');
const { uploadProductImage: uploadProduct } = require('../config/multer');
const { getOrdersThisWeek, getOrderCountThisWeek } = require('../controllers/ordersController');
const authorizeAdmin = require('../config/authorizeAdmin');
const authenticateJWT = require('../config/authenticateJWT');

const router = express.Router();

router.get(
  '/count-product',
  passport.authenticate('jwt', { session: false }),
  authenticateJWT, // Authenticate the token
  authorizeAdmin,   // Check admin privileg
  getProductCount
);

router.post(
  '/create',
  passport.authenticate('jwt', { session: false }),
  authenticateJWT, // Authenticate the token
  authorizeAdmin,
  uploadProduct,
  createProduct
);

router.get(
  '/getAll',
  passport.authenticate('jwt', { session: false }),
  getAllProducts
);

router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  getProductById
);

router.put(
  '/update/:id',
  passport.authenticate('jwt', { session: false }),
  updateProduct
);

router.delete(
  '/delete/:id',
  passport.authenticate('jwt', { session: false }),
  deleteProduct
);

router.get(
  '/category/:category',
  getProductsByCategory
);

router.get(
  '/getOrder/thisWeek',
  passport.authenticate('jwt', { session: false }),
  getOrdersThisWeek,
)
router.get(
  '/getOrder-count/thisWeek',
  passport.authenticate('jwt', { session: false }),
  getOrderCountThisWeek,
)
router.get(
  '/get-product/count',
  passport.authenticate('jwt', { session: false }),

)

router.patch(
  '/:id/sold',
  passport.authenticate('jwt', { session: false }),
  markAsSold
);


router.put(
  '/edit-product/:id',
  passport.authenticate('jwt', { session: false }),
  editProductById,
)

router.get(
  '/recent',
  passport.authenticate('jwt', { session: false }),
  getRecentProducts
);

module.exports = router;
