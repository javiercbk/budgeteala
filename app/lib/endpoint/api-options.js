const _ = require('lodash');

const nullLogger = require('../log/null-logger');

const apiOptions = function (options) {
  this.logger = _.get(options, 'logger', nullLogger);
  this.user = _.get(options, 'user');
  this.config = _.get(options, 'config');
  this.db = _.get(options, 'db');
};

module.exports = apiOptions;
