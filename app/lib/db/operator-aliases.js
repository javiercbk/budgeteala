const { Op } = require('sequelize');

module.exports = {
  $and: Op.and,
  $or: Op.or,
  $ne: Op.ne,
  $between: Op.between,
  $like: Op.like,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt
};
