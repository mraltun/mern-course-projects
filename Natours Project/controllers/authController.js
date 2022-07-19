const crypto = require('crypto');
//Import promisify function from util
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
// const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

// Create token, store the id that you get from Mongo (payload is the "id"). Get the secret from env file. Add the expire date from env file.
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// We have so many same code, turn into a function so we can use it
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    // Convert expire date to milliseconds
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // Make the cookie can't accessed or modified by the browser
    httpOnly: true,
  };

  // If we are in production mode use HTTPS
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // The Cookie
  res.cookie('jwt', token, cookieOptions);

  // Remove password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // Use create method on model name and pass the object with the data. We specify the fields so user can't add something other like "admin"
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exists, send an error with our middle if not.
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check if user exits && password is correct. We need to select password field because it's not in the output
  const user = await User.findOne({ email }).select('+password');

  // This is available all the documents and user is a document. Make it vague, not specify which one is wrong
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // Getting token and check if it's there
  let token;
  // Sending a JWT in a header need authorization in the header and value of the that should start with "Bearer" ("Authorization: Bearer ...")
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // 401 for not have access
    return next(
      new AppError('You are not logged in!, Please log in to get access', 401)
    );
  }

  // Verification token. Verify is async so it'll call the callback function after verified.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user still exists since we verified it's valid token.
  const currentUser = User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belong to this token is no longer exist', 401)
    );
  }

  // Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User changed password recently. Please log in again', 401)
    );
  }
  // We passed all the checks, grant access to protected route which we will be using in the next middleware
  req.user = currentUser;
  next();
});

// We are passing arguments to middleware function with wrapper function.
exports.restrictTo = (...roles) => {
  // This is the middleware function. We have access to roles array because of closure.
  return (req, res, next) => {
    // req.user object has role from .protect method above.
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    // If the role is correct, pass to next middleware (.deleteTour)
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on POST'ed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  // Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // We modified in the userModal but we update document here with save(). The reason we use validateBeforeSave is because we don't have all of the mandatory data we set required.
  await user.save({ validateBeforeSave: false });

  // Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email.`;

  // Try and catch instead of showing error message because we also want to reset tokens if there is something wrong
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    // If there is a problem with this service, reset the tokens
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending email, try again later', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token. We get the token we want to hash from url ("/:token") with params.
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // The only way to know the user is querying the database with this token which has user id
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    // Check if the token expire date is greater than now.
    passwordResetExpires: { $gt: Date.now() },
  });

  // If token has not expired and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // For everything related to user and passwords, we use save() to run all the validators and "save" middleware functions
  await user.save();

  // Update changedPasswordAt property for the user
  // Log the user in send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get user from collection. The user will already be authenticated, so we have user id in request object that comes from protect middleware. The password is not included by default so include it by "+"
  const user = await User.findById(req.user.id).select('+password');

  // Check if POSTed currect password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // Update password and save.
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // Log user in, send JWT
  createSendToken(user, 200, res);
});
