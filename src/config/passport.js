// src/config/passport.js

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/user'); // Import User model
require('dotenv').config();

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(options, async (jwt_payload, done) => {
    try {
      const user = await User.findById(jwt_payload.id); // Use the user ID from the payload
      if (!user) {
        return done(null, false); // If user is not found
      }
      return done(null, user); // If user is found, pass user object to the request
    } catch (err) {
      done(err, false); // Error handling
    }
  })
);

module.exports = passport; // Export passport instance
