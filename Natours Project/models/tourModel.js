// MongoDB driver for Node, to access and interact with MongoDB database.
const mongoose = require('mongoose');
// Slugify to create string in the url
const slugify = require('slugify');
// Validator library for custom validation
const validator = require('validator');

// Create a schema for our model
const tourSchema = new mongoose.Schema(
  {
    name: {
      // Schema type options that can be different for each type.
      type: String,
      // Basic validation. Error string to show when required field is missing.
      required: [true, 'A tour must have a name'],
      // Name should be unique for each tour document
      unique: true,
      // Remove all the whitespace from beginning and end of the string
      trim: true,
      // Built-in validators
      maxlength: [40, 'A tour name must have less or equal 40 characters'],
      minlength: [10, 'A tour name must have more or equal 10 characters'],
      // Use validator library to check if it's letters (A-Z)
      validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    // Add slug to schema
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      // String validator. If the value is not in the field, it will throw ValidationError error on save().
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      // Default value if we don't specify a value.
      default: 4.5,
      // Works for numbers and dates
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      // Default value if we don't specify a value.
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // Custom validator. False will trigger validation error
      validate: {
        validator: function (value) {
          // This only points to current doc on NEW document creation
          return value < this.price;
        },
        // Showing actual value is from mongoose
        message: 'Discount price ({VALUE}) should be below the price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    // An array of strings
    images: [String],
    createdAt: {
      // JS data type
      type: Date,
      // Mongo will convert this to actual date instead of miliseconds.
      default: Date.now(),
      // This will hide this field from the client.
      select: false,
    },
    // Mongo will automatically parse string date to actual JS date
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Each time data is outputted as JSON and Object, make virtuals true to part the output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual properties. This property will be created when we get some data out the database, so it's a getter. This is not going persist on the Database, only when we get the data. It's business logic so keep it in Model
tourSchema.virtual('durationWeeks').get(function () {
  // Divide days by 7 to get weeks
  return this.duration / 7;
});

// Document middleware, Pre middleware runs before .save() and .create(). Save is also a hook.
tourSchema.pre('save', function (next) {
  // Create slug in the url based on the name field, then turn it to lower case. "this" going to be currently saved document
  this.slug = slugify(this.name, { lower: true });
  next();
});

// // We can have multiple pre or post middlewares
// tourSchema.pre('save', function (next) {
//   console.log('Will save document..');
//   next();
// });

// // Post middleware will be executed after pre middleware completed. "doc" is the document just saved.
// tourSchema.post('save', function (doc, next) {
//   next();
// });

// Query middleware (pre). "find" hook makes it query middleware. "this" going to current query. Use regex to include all the strings starts with "find" (findOne, findOneAndDelete etc..)
tourSchema.pre(/^find/, function (next) {
  // Find the secretTour's are Not Equal to true
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});
// Query middleware (post). "docs" is the all the documents returned from the query.
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// Aggregation Middleware. "this" going to be current aggregation
tourSchema.pre('aggregate', function (next) {
  // Add match stage to beginning of the "pipeline" array
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

// Create the model with our schema.
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
