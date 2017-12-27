const { BUDGETEALA_VERSION } = require('../config');

const sendResponseFactory = id =>
  function (code, data) {
    const result = {
      status: {
        id,
        message: 'success',
        code,
        error: false,
        version: BUDGETEALA_VERSION
      }
    };
    if (data) {
      result.data = data;
    }
    this.status(code).send(result);
  };

/**
 * Middleware that appends a $sendResponse function to the request object that
 * sends standarized responses
 * @param {object} req the request object
 * @param {object} res the response object
 * @param {function} next next function
 */
module.exports = (req, res, next) => {
  const sendResponse = sendResponseFactory(req.id);
  res.$sendResponse = sendResponse.bind(res);
  next();
};
