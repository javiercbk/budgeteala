const config = require('./index');

const prospect = {
  username: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  host: config.DB_HOST,
  logging: config.DB_LOGGING,
  dialect: config.DB_DIALECT,
  timezone: 'UTC'
};

const dbConfig = {};

['development', 'production'].forEach((prop) => {
  dbConfig[prop] = prospect;
});

// add test database as sqlite
dbConfig.test = {
  dialect: 'sqlite',
  // storage: ':inmemory:',
  logging: false
};

module.exports = dbConfig;
