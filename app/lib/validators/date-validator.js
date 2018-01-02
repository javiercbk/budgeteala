const moment = require('moment');

const toMoment = (value, { req, location, path }) => {
  const parsedDate = moment.utc(value, moment.ISO_8601, true);
  req[location][path] = parsedDate;
};

module.exports = {
  toMoment
};
