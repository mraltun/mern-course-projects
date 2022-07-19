class AppError extends Error {
  constructor(message, statusCode) {
    // "message" property will be the incoming message
    super(message);

    this.statusCode = statusCode;
    // If the status code 4** it's fail, else (5**) it's an error
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // Our errors will have this property but other programming errors will not.
    this.isOperational = true;

    // Don't add this function to Error stack trace and pollute it.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
