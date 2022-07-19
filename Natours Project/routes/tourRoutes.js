const express = require('express');
// Import controllers
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');

// Create new route. It's a real middleware
const router = express.Router();

// Middleware that runs when "id" in the url. We access to "value" in the parameter.
// router.param('id', tourController.checkID);

// Alias route for "top 5 cheap" Add middleware so we can use getAllTours.
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

// Aggregation Pipeline
router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);
// Add middleware to post handler stack.
// .post(tourController.checkBody, tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    // Check if the user is logged in with protect method, then restrict it to only certain user role.
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
