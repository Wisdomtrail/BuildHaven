const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

// Define the User Schema
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
  orders: [
    {
      orderId: {
        type: String,
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
    },
  ],
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
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Export the User model
module.exports = mongoose.model('User', UserSchema);
