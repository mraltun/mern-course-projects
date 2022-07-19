// Import crypto module from Node
const crypto = require('crypto');
const mongoose = require('mongoose');
// Validator library for custom validation
const validator = require('validator');
// BcryptJS for encrypting passwords
const bcrypt = require('bcryptjs');

// Create a schema for user model
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: true,
    // Transform the email lower case letters
    lowercase: true,
    // Check if it's a valid email
    validator: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlenght: 8,
    // Never show up in any output
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        // This only works on create and on save! (User.create() in authController)
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  // Active field for "deleting" user
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Pre save hooks runs between getting the data and saving it to the database. Hash returns promise because we use async version of it, so made function async.
userSchema.pre('save', async function (next) {
  // Only run this function if the password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password. Passed number is how CPU intensive it would be. Higher number takes more time.
  this.password = await bcrypt.hash(this.password, 12);
  // Real password is hashed so delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

//
userSchema.pre('save', function (next) {
  // If we didn't modify the password, don't manipulate the passwordChangedAt and just go to next middleware
  if (!this.isModified('password') || this.isNew) return next();

  // Sometimes saving to the Database is slower than issuing a JWT, give a second to make sure password changed before the token created.
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Another query middleware for not showing inactive users to client. Regex for the everything starts with "find"
userSchema.pre('/^find/', function (next) {
  // "this" points to the current query. Show any users Not Equal to false
  this.find({ active: { $ne: false } });
  next();
});

// Instanced method (available all the document). We can't manually compare them because userPassword is hashed other is not.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // Compare passwords and return true if correct
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Calculate if the user is changed password after we issued the token.
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // passwordChangedAt is full date, convert to to timestamp. It'll come back as milliseconds we need to divide it to get seconds.
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // If the password changed after token was issued, return true.
    return JWTTimestamp < changedTimestamp;
  }

  // False means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // This token is essentially a password for the user to change their actual password.
  const resetToken = crypto.randomBytes(32).toString('hex');

  // For security reasons, we encrypt it before saving in the Database.
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Add 10 minutes to field. We are not updating document, we are just modift it.
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // We send unencrypted, plain text token in the email
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
