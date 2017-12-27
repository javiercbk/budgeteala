const getenv = require('getenv');

const configuration = {
  NODE_ENV: getenv('NODE_ENV'),
  BUDGETEALA_PORT: getenv.int('BUDGETEALA_PORT'),
  BUDGETEALA_SECRET: getenv('BUDGETEALA_SECRET'),
  BUDGETEALA_VERSION: getenv('BUDGETEALA_VERSION', 'unknown'),
  BUDGETEALA_AUTH_COOKIE: getenv('BUDGETEALA_AUTH_COOKIE', 'bauth'),
  DB_USERNAME: getenv('DB_USERNAME'),
  DB_PASSWORD: getenv('DB_PASSWORD', null),
  DB_NAME: getenv('DB_NAME'),
  DB_HOST: getenv('DB_HOST'),
  DB_LOGGING: getenv.bool('DB_LOGGING'),
  DB_DIALECT: getenv('DB_DIALECT')
};

module.exports = configuration;
