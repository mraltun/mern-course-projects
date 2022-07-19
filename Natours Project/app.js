// Import Express
const express = require('express');
// Inherit  methods from Express
const app = express();
// Morgan - logger middleware
const morgan = require('morgan');
// Security imports
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const MongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
// Error Handling
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
// Import Routes
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

///////////////// GLOBAL MIDDLEWARES

// Set security HTTP headers
app.use(helmet());

// Middleware to modify incoming request data. We need this to get request body on request object
app.use(
  express.json({
    limit: '10kb',
  })
);

// Data sanitization against NoSQL query injection. This is going to look at request body, request query string and request params to filter out "$" and "." so no more Mongo commands in those for attackers to use.
app.use(MongoSanitize());

// Data sanitization against XSS. Clear up any user input with HTML codes
app.use(xss());

// Prevent parameter pollution. Clear up the query string
app.use(
  hpp({
    // Which ones can have duplicates
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Load the morgan only if we are in development environment
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Middleware function for rate limiting
const limiter = rateLimit({
  // How many requests (100)
  max: 100,
  // Time window (1 hour)
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try it again in an hour',
});
app.use('/api', limiter);

// Serving a static file from folder
app.use(express.static(`${__dirname}/public`));

// // Our custom middleware with next function.
// app.use((req, res, next) => {
//   console.log('Hello from the middleware');
//   // We need to invoke next to continue in middleware stack
//   next();
// });

////////////// ROUTES
// Mounting the routers
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// All (.all) http methods and all ("*") the url's. This needs to be the route to match all other unhandled routes.
app.all('*', (req, res, next) => {
  // When every "next()" in the app has anything in the argument, Express will know that it's going to be an error and it will skip all the stack and go to error middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware
app.use(globalErrorHandler);

module.exports = app;
