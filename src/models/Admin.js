const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
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
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin'
  },
  profileImageUrl: {  
    type: String,
    default: '', 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  notifications: [
    {
      message: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['info', 'warning', 'error', 'success'], // Define notification types
        default: 'info'
      },
      isRead: {
        type: Boolean,
        default: false
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare passwords
adminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Mark notifications as read
adminSchema.methods.markNotificationsAsRead = async function () {
  this.notifications = this.notifications.map((notification) => ({
    ...notification,
    isRead: true,
  }));
  await this.save();
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
