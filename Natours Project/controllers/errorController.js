const AppError = require('./../utils/appError');

// Turn Mongoose's error to readable error.
const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = (error) => {
  // Get the error message (name field) from Mongoose error. That message is only one in between "" so we use regex for "this"
  const value = error.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 404);
};

const handleValidationErrorDB = (error) => {
  // Loop over "errors" object to get multiple error strings from "message" property
  const errors = Object.values(error.errors).map((el) => el.message);

  const message = `Invalid input data ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// When JWT fails to verify signature
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again', 401);

// When JWT token expires
const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again', 401);

// Error handler for Development
const sendErrorDev = (error, res) => {
  res.status(
    error.statusCode.json({
      status: error.status,
      error: error,
      message: error.message,
      stack: error.stack,
    })
  );
};

// Error handler for Production
const sendErrorProd = (error, res) => {
  // Operational, trusted error. Send message to the client
  if (error.isOperational) {
    res.status(
      error.statusCode.json({
        status: error.status,
        message: error.message,
      })
    );
    // Programming, or other unknown error. Don't leak error details
  } else {
    console.error('ERROR!!', error);

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

// When we specify these four arguments, Express automatically knows that this is an Error Handling Middleware
module.exports = (error, req, res, next) => {
  //  Get the status code from Error object or make default 500
  error.statusCode = error.statusCode || 500;
  // When it's 5** it's an error, 4** means fail.
  error.status = error.status || 'error';

  if (process.env.NOD_ENV === 'development') {
    sendErrorDev(error, res);
  } else if (process.env.NOD_ENV === 'production') {
    let newError = { ...error };

    // Operational errors
    if (newError.name === 'CastError') newError = handleCastErrorDB(newError);
    if (newError.code === 11000) newError = handleDuplicateFieldDB(newError);
    if (newError.name === 'ValidationError')
      newError = handleValidationErrorDB(newError);
    if (newError.name === 'JsonWebTokenError') newError = handleJWTError();
    if (newError.name === 'TokenExpiredError')
      newError = handleJWTExpiredError();
    //
    sendErrorProd(newError, res);
  }
};
