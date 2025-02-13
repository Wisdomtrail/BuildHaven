const express = require('express');
const { createOrder } = require('../controllers/ordersController');
const { adminLogin } = require('../controllers/adminController');
const router = express.Router();

router.post(
    '/create-order',
    createOrder
)

router.post("/admin/login", adminLogin);

module.exports = router;
