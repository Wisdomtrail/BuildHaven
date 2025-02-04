const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the Coupon Schema
const CouponSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// Export the Coupon model
module.exports = mongoose.model('Coupon', CouponSchema);
