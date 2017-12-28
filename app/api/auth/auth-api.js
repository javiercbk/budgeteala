const _ = require('lodash');
const Promise = require('bluebird');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const apiOptions = require('../../lib/endpoint/api-options');
const RestError = require('../../lib/error');

const INVALID_LOGIN = new RestError(401, { message: 'Invalid username or password' });

class AuthAPI {
  constructor(options) {
    apiOptions.apply(this, [options]);
  }

  async createToken(tokenRequest) {
    const query = {
      where: { email: tokenRequest.email }
    };
    const user = await this.db.User.findOne(query);
    if (!user) {
      throw INVALID_LOGIN;
    }
    await this._comparePassword(tokenRequest.password, user.password);
    const token = await this._generateToken(user);
    this.logger.debug(`Auth token generated for user ${user.id}`);
    return token;
  }

  _comparePassword(givenPassword, userPassword) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(givenPassword, userPassword, (err, result) => {
        if (err || !result) {
          return reject(INVALID_LOGIN);
        }
        resolve();
      });
    });
  }

  _generateToken(user) {
    // select the user's property that are going to be encoded in the token
    const tokenData = _.pick(user, ['id']);
    return new Promise((resolve, reject) => {
      jwt.sign(tokenData, this.config.BUDGETEALA_SECRET, {}, (err, token) => {
        if (err) {
          return reject(new RestError(500, { message: 'Error creating token' }));
        }
        resolve(token);
      });
    });
  }
}

module.exports = AuthAPI;
