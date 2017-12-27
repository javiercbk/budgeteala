const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('express-jwt');
const addRequestId = require('express-request-id');

const { BUDGETEALA_SECRET } = require('./lib/config');
const logMiddleware = require('./lib/log/middleware');
const sendResponseMiddleware = require('./lib/response/middleware');
const errorMiddleware = require('./lib/error/middleware');
const jwtOptions = require('./lib/jwt');

const authRouter = require('./api/auth/auth-router');
const indexRouter = require('./api/home/home-router');

// Creates and configures an ExpressJS web server.
class App {
  // Run configuration methods on the Express instance.
  constructor() {
    this.express = express();
    this.middleware();
    this.routes();
  }

  // Configure Express middleware.
  middleware() {
    this.express.use(addRequestId());
    this.express.use(logMiddleware());
    this.express.use(sendResponseMiddleware);
    this.express.use(bodyParser.json());
    this.express.use(cookieParser());
    this.express.use(jwt(jwtOptions({ secret: BUDGETEALA_SECRET })).unless({ path: ['/api/v1/', '/api/v1/auth'] }));
    this.express.use(bodyParser.urlencoded({
      extended: true
    }));
  }

  // Configure API endpoints.
  routes() {
    // global endpoints go here
    this.express.use('/api/v1/auth', authRouter);
    this.express.use('/api/v1/', indexRouter);

    this.express.use((req, res, next) => {
      const err = new Error('Not Found');
      err.status = 404;
      next(err);
    });

    this.express.use(errorMiddleware);
  }
}

module.exports = App;
