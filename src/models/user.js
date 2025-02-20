const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImageUrl: {  
    type: String,
    default: '', 
  },
  coupons: [
    {
      code: {
        type: String,
        required: true,
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
    },
  ],
  cart: [
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
  notifications: [
    {
      message: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['success', 'info', 'warning', 'error'],
        default: 'info',
      },
      isRead: {
        type: Boolean,
        default: false,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

UserSchema.methods.markNotificationsAsRead = async function () {
  this.notifications = this.notifications.map((notification) => ({
    ...notification,
    isRead: true,
  }));
  await this.save();
};

module.exports = mongoose.model('User', UserSchema);
