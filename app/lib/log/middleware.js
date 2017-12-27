const _ = require('lodash');
const moment = require('moment');

const ApplicationLogger = require('./application-logger');

/**
 * Appends a logger to the request that contains the request context.
 * @param {object} options optional middleware options
 * @param {object} options.logLevel optional functional that returns the log level string.
 *  application configuration module interface.
 */
module.exports = options => (req, res, next) => {
  const timestamp = moment()
    .utc()
    .toDate();
  const requestData = {
    timestamp,
    req: {
      id: req.id
    },
    user: {
      _id: _.get(req, 'user._id')
    }
  };
  // default log level is debug
  const logLevel = _.get(options, 'logLevel', 'debug');
  req.$logger = new ApplicationLogger(requestData, logLevel);
  next();
};
