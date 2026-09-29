/**
 * Wraps an async controller function so that any rejected promise
 * is forwarded to Express's error-handling middleware, removing the
 * need for repetitive try/catch blocks in every controller.
 */
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
