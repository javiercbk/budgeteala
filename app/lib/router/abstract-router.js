const express = require('express');
const { validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const config = require('../config');
const RestError = require('../error');
const db = require('../db');

/**
 * AbstractRouter implements common login for almost any route
 */
class AbstractRouter {
  /**
   * @param {Object} routerOptions - Express' router options
   */
  constructor(routerOptions) {
    this._expressRouter = express.Router(routerOptions);
  }

  get router() {
    return this._expressRouter;
  }

  /**
   * Executes a generic route logic by, validating the request, extracting all
   * the meaningful data into and object and calling a function with the
   * extracted data. Besides it handles validation errors and API calls errors.
   * @param {Object} route - A route definition, accepts the following
   *   properties:
   *     validator - a RequestValidator (optional)
   *     apiCall - a function that returns an observable;
   *     observable - a boolean that is true when the api call returns an observable
   *     responseHandler - a function that given an Express' Response object
   *   returns another function that handles the response.
   *   @return {Function} Express' middleware function
   */
  route(route) {
    if (!route.responseHandler) {
      route.responseHandler = this.jsonResponseHandler;
    }
    return (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new RestError(400, { message: JSON.stringify(errors.mapped()) });
      }
      const reqObj = matchedData(req);
      route
        .apiCall(reqObj, {
          user: req.user,
          logger: req.$logger,
          config: config,
          db: db
        })
        .then((apiResponse) => {
          route.responseHandler(res)(apiResponse);
        })
        .catch((err) => {
          next(err);
        });
    };
  }

  genericAPICall(APIClass, method) {
    return (reqObj, options) => {
      const apiInstance = new APIClass(options);
      return apiInstance[method](reqObj);
    };
  }

  /**
   * jsonResponseHandler sends a json response. This is the default behaviour
   * when no responseHandler is given.
   * @param {Object} res - Express' Response object.
   */
  jsonResponseHandler(res) {
    return (response) => {
      res.$sendResponse(200, response);
    };
  }

  _cleanObject(obj) {
    const keys = Object.keys(obj);
    keys.forEach((k) => {
      if (obj[k] === undefined) {
        delete obj[k];
      }
    });
  }
}

module.exports = AbstractRouter;
