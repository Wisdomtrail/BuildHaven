const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/user'); // Import User model
const Admin = require('../models/Admin'); // Import Admin model
require('dotenv').config();

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(options, async (jwt_payload, done) => {
    try {
      // First, try to find the user in the User model
      let user = await User.findById(jwt_payload.id);
      if (!user) {
        // If not found, try to find the admin in the Admin model
        const admin = await Admin.findById(jwt_payload.id);
        if (!admin) {
          return done(null, false); // Neither user nor admin is found
        }
        return done(null, admin); // Admin is found
      }
      return done(null, user); // User is found
    } catch (err) {
      done(err, false); // Error handling
    }
  })
);

module.exports = passport; // Export passport instance
