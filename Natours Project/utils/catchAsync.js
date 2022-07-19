// Catch asynchorous errors. We return it because we want to wait Express to call those async functions when the routes are hit. The alternative would be writing try&catch in all the functions
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
