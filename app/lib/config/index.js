const getenv = require('getenv');

let configuration;

const NODE_ENV = getenv('NODE_ENV');

if (NODE_ENV === 'test') {
  configuration = {
    NODE_ENV,
    BUDGETEALA_PORT: 0,
    BUDGETEALA_SECRET: 'budgeteala_test_secret',
    BUDGETEALA_VERSION: 'unit-test',
    BUDGETEALA_AUTH_COOKIE: 'bauth',
    DB_USERNAME: '',
    DB_PASSWORD: '',
    DB_NAME: '',
    DB_HOST: '',
    DB_LOGGING: false,
    DB_DIALECT: 'sqlite'
  };
} else {
  configuration = {
    NODE_ENV,
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
}

module.exports = configuration;
