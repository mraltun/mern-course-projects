// MongoDB driver for Node, to access and interact with MongoDB database.
const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Config file path for Dotenv, it loads environment variables from a .env file into process.env which we can access from everywhere now.
dotenv.config({
  path: './config.env',
});
const app = require('./app');

// Replace the placeholder password with real password from env file
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// Connect to Database. It will return Promise, we handle with .then()
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB Connection Successful!'));

// // Create new document from our Tour model.
// const testTour = new Tour({
//   name: 'The Forest Hiker',
//   rating: 4.7,
//   price: 497,
// });

// // Save testTour to the "tours" collection in the database. The result value that save() returns is the document as it is in the database.
// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((error) => console.log(error));

// Start the server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}..`);
});

// Listen for the event
process.on('unhandledRejection', (error) => {
  console.log(error.name, error.message);
  // Close server more "peacefully"
  server.close(() => {
    // "0" means success, "1" means uncaught exception
    process.exit(1);
  });
});

process.on('uncaughtException', (error) => {
  console.log(error.name, error.message);
  server.close(() => {
    process.exit(1);
  });
});
