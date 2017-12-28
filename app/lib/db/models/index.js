const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const operatorsAliases = require('../operator-aliases');
const config = require('../../config/config');
const { NODE_ENV } = require('../../config');

const dbConfig = Object.assign({}, config[NODE_ENV], { operatorsAliases });

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

const db = {};

fs
  .readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== 'index.js')
  .forEach((file) => {
    const model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
