const _ = require('lodash');

const apiOptions = require('../../lib/endpoint/api-options');
const RestError = require('../../lib/error');

class UserAPI {
  constructor(options) {
    apiOptions.apply(this, [options]);
  }

  async currentUser() {
    const query = {
      where: { id: this.user.id }
    };
    const user = await this.db.User.findOne(query);
    if (!user) {
      // the current user has been deleted
      // TODO: invalidate the token
      throw new RestError(404, { message: 'User does not exist' });
    }
    // do not pick the password
    const serializableUser = this._serializeUser(user);
    return serializableUser;
  }

  async retrieveUserDetails(userDetailQuery) {
    const query = {
      where: {}
    };
    if (userDetailQuery) {
      if (userDetailQuery.id) {
        const user = await this.db.User._findById(userDetailQuery.id);
        if (!user) {
          throw new RestError(404, { message: 'User does not exist' });
        }
        return user;
      }
      const { sequelize: { escape } } = this.db;
      if (userDetailQuery.name) {
        query.where.$or = [
          {
            firstName: {
              $like: `${escape(userDetailQuery.name)}%`
            }
          },
          {
            lastName: {
              $like: `${escape(userDetailQuery.name)}%`
            }
          }
        ];
      }
      if (userDetailQuery.email) {
        query.where.email = { $like: `${escape(userDetailQuery.email)}%` };
      }
    }
    const users = await this.db.User.findAll(query);
    return users;
  }

  _serializeUser(user) {
    return _.pick(user, ['id', 'firstName', 'lastName', 'email', 'createdAt', 'updatedAt']);
  }
}

module.exports = UserAPI;
