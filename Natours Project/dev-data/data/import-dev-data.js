// This scripts reads the data from JSON file and imports into Database
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');

dotenv.config({
  path: './config.env',
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB Connection Successful!'));

// Read JSON file and turn into JS Object
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`));

// Import data to DB
const importData = async () => {
  try {
    // Pass array of objects
    await Tour.create(tours);
    console.log('Data loaded');
    // Exit the app
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// Delete All Data From Collection
const deleteData = async () => {
  try {
    // Delete all the documents in the collection.
    await Tour.deleteMany();
    console.log('Data deleted');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// argv returns an array with node location and path of the file. We add "--import & --export" as 3rd argument.
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
