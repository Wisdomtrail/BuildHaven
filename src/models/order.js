const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    {
      productId: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  pickupMethod: {
    type: String,
    enum: ['Pickup', 'Delivery'],
    required: true,
  },
  address: {
    type: String,
    required: function () {
      return this.pickupMethod === 'Delivery';
    },
  },
  active: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model('Order', OrderSchema);
