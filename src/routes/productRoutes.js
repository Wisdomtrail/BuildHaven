const express = require('express');
const passport = require('passport');
const { createProduct, getAllProducts, getProductById, updateProduct, getProductsByCategory, deleteProduct, markAsSold,
  getProductCount, getRecentProducts } = require('../controllers/productsContoller');
const { uploadProductImage: uploadProduct } = require('../config/multer');

const router = express.Router();

router.post(
  '/create',
  passport.authenticate('jwt', { session: false }),
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
  passport.authenticate('jwt', { session: false }),
  getProductsByCategory
);

router.patch(
  '/:id/sold',
  passport.authenticate('jwt', { session: false }),
  markAsSold
);

router.get(
  '/count',
  passport.authenticate('jwt', { session: false }),
  getProductCount
);

router.get(
  '/recent',
  passport.authenticate('jwt', { session: false }),
  getRecentProducts
);

module.exports = router;
