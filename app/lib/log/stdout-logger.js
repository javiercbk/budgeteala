/* eslint-disable space-unary-ops */
const moment = require('moment');
const winston = require('winston');

module.exports = new winston.Logger({
  level: 'silly',
  timestamp: () =>
    moment()
      .utc()
      .toDate(),
  transports: [
    new winston.transports.Console({
      colorize: true
    })
  ]
});
