const Tour = require('./../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

// // Receive the tours data from DB (temporary file) and turn into array of JS objects
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// Middleware for checking "id". If the current id not in the DB, show error page.
// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);
//   if (req.params.id * 1 > tours.length) {
//     // Remember to return otherwise it will keep running even after the error
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// };

// Check if the body contains name and price properties
// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };

// Middleware for "top 5 cheap" alias route. Filling query object before sending it to getAllTours in below (/tours?limit=5&sort=-ratingsAverage,price)
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// Handle the GET request. The function is called "Route Handler"
exports.getAllTours = catchAsync(async (req, res, next) => {
  // FILTERING
  // // Destruct the object so we don't mutate the original
  // const queryObj = [...req.query];
  // const excludedFields = ['page', 'sort', 'limit', 'field'];
  // // Delete the excluded fields on the queryObj
  // excludedFields.forEach((el) => delete queryObj[el]);

  // // Advanced Filtering
  // // Convert object to string
  // let queryString = JSON.stringify(queryObj);
  // // Convert operators to MongoDB operators by adding "$" (Greater Than or Equal, Greater Than, Less Than or Equal, Less Then)
  // queryString = queryString.replace(
  //   /\b(gte|gt|lte|lt)\b/g,
  //   (match) => `$${match}`
  // );

  // // Returns (query.prototype) object from the collection. If you don't have any query operator this will still work fine.
  // let query = Tour.find(JSON.parse(queryString));

  // // Sorting
  // // When there is sort in the query, sort it based the value. Default is ascending order, add "-" to make it descended (/tours?-price)
  // if (req.query.sort) {
  //   // If the sorting value is same for multiple data, then add "," to sort with additional values (e.g /tours?price,ratingsAverage)
  //   const sortBy = req.query.sort.split(',').join(' ');
  //   query = query.sort(sortBy);
  // } else {
  //   // Default sort is by created date
  //   query = query.sort('-createdAt');
  // }

  // // Field Limiting
  // // Show only the selected fields (/tours?fields=name,duration)
  // if (req.query.fields) {
  //   const fields = req.query.fields.split(',').join(' ');
  //   // Selecting only certain field names is Projecting
  //   query = query.select(fields);
  // } else {
  //   // "-" is for excluding (/tours?fields=-name,-duration)
  //   query = query.select('-__v');
  // }

  // // Pagination
  // // Turn page from String to Number. Default page is 1
  // const page = req.query.page * 1 || 1;
  // const limit = req.query.limit * 1 || 100;
  // // Skip previous documents<
  // const skip = (page - 1) * limit;

  // query = query.skip(skip).limit(limit);

  // if (req.query.page) {
  //   // Return the number of the documents
  //   const numTours = await Tour.countDocuments();
  //   if (skip >= numTours) throw new Error('This page does not exist');
  // }

  // Execute Query
  // We are passing query object and query string that's coming from express. We manipulate query by adding methods.
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limit()
    .paginate();
  // We await for all results.
  const tours = await features.query;

  // Send data to consumer in JSend (status, data) format by Enveloping
  res.status(200).json({
    status: 'success',
    // This is not part of JSend. It's number of the results we are sending.
    results: tours.length,
    data: { tours },
  });
});

// Create variable called "id"
exports.getTour = catchAsync(async (req, res, next) => {
  // Find the document by it's "_id" field. We get the value "id" from url parameter object
  const tour = await Tour.findById(req.params.id);
  // Tour.findOne({ _id: req.params.id });

  // If there is no tour return 404 error
  if (!tour) {
    return next(new AppError('No tours found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });

  // The id we get from parameters is string "{id: '5'}"", we convert to number here.
  // const id = req.params.id * 1;
  // Look for the id numbers in the db and match it with the one from url
  // const tour = tours.find((el) => el.id === id);
});

// Handle POST request. We need to send back something to finish request/response cycle. We made it async to use await for Promise from create.
exports.createTour = catchAsync(async (req, res, next) => {
  // // Get the ID of the last object and add 1 make new ID number
  // const newId = tours[tours.length - 1].id + 1;
  // // Create new object by merging two objects without mutating original body object
  // const newTour = Object.assign({ id: newId }, req.body);
  // // Add the new object into the array
  // tours.push(newTour);
  // // Write to file,
  // fs.writeFile(
  //   `${__dirname}/dev-data/data/tours-simple.json`,
  //   JSON.stringify(tours),
  //   (error) => {

  // Get the data from inside of req.body. Use that data to create document with Tour model.
  const newTour = await Tour.create(req.body);
  // Created with 201, turn JS object into JSON with stringify.
  res.status(201).json({
    status: 'success',
    data: { tour: newTour },
  });
});

// Use PATCH to update properties on the object
exports.updateTour = catchAsync(async (req, res, next) => {
  // With new option, the updated document will be returned.
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    // Run the built-in validators from schema
    runValidators: true,
  });

  if (!tour) {
    return next(new AppError('No tours found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: 'Updated Tour Here',
    },
  });
});

// Use DELETE to delete the object
exports.deleteTour = catchAsync(async (req, res, next) => {
  // No need to save in variable since we don't return anything when it's delete operation
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tours found with that ID', 404));
  }

  // 204 means no content
  res.status(204).json({
    status: 'success',
    // We send back null to show the data we deleted no longer exists
    data: null,
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  // Aggregation Pipeline is MongoDB feature but we have access with mongoose. It's like a regular query but we can manipulate the data in couple ways. Each element in the array is stages
  const stats = await Tour.aggregate([
    // Filter the documents by "Greater Than or Equal 4.5"
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        // "$fieldsName"
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    // Sort by ascending
    { $sort: { avgPrice: 1 } },
    // { $match: { _id: { $ne: 'EASY' } } },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      // Add a field with value
      $addFields: { month: '$_id' },
    },
    // Make the field not show up since we copied above (1 is show)
    { $project: { _id: 0 } },
    // Sort by descending
    { $sort: { numTourStarts: -1 } },
    {
      // Limit to 12 documents
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
