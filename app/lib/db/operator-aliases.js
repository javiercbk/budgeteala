const { Op } = require('sequelize');

module.exports = {
  $and: Op.and,
  $or: Op.or,
  $between: Op.between,
  $like: Op.like
};
