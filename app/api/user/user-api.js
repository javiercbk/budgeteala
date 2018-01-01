const _ = require('lodash');

const { encodePassword } = require('../../lib/password');

const apiOptions = require('../../lib/endpoint/api-options');
const { escapePercent } = require('../../lib/query/');
const RestError = require('../../lib/error');

const ALLOWED_ATTRS = [
  'id',
  'firstName',
  'lastName',
  'email',
  'createdAt',
  'updatedAt',
  'deletedAt'
];

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

  async query(userDetailQuery) {
    const attributes = ALLOWED_ATTRS;
    const query = {
      attributes,
      where: {}
    };
    if (userDetailQuery) {
      if (userDetailQuery.id) {
        const user = await this.db.User.findById(userDetailQuery.id);
        if (!user) {
          throw new RestError(404, { message: 'User does not exist' });
        }
        return _.pick(user, attributes);
      }
      if (userDetailQuery.name) {
        const escapedName = escapePercent(userDetailQuery.name);
        query.where.$or = [
          {
            firstName: {
              $like: `${escapedName}%`
            }
          },
          {
            lastName: {
              $like: `${escapedName}%`
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

  async create(prospect) {
    const existingUser = await this.db.User.findOne({
      where: {
        email: prospect.email
      }
    });
    if (existingUser) {
      throw new RestError(409, { message: `A user already exist with email ${prospect.email}` });
    }
    const hash = await encodePassword(prospect.password);
    prospect.password = hash;
    const newUser = await this.db.User.create(prospect);
    const serializableUser = this._serializeUser(newUser);
    return serializableUser;
  }

  async edit(prospect) {
    const userToEdit = await this.db.User.findById(prospect.id);
    if (!userToEdit) {
      throw new RestError(404, { message: `User ${prospect.id} does not exist` });
    }
    const existingUser = await this.db.User.findOne({
      where: {
        id: {
          $ne: prospect.id
        },
        email: prospect.email
      }
    });
    if (existingUser) {
      throw new RestError(409, { message: `A user already exist with email ${prospect.email}` });
    }
    Object.assign(userToEdit, _.pick(prospect, ['firstName', 'lastName', 'email']));
    if (prospect.password) {
      const hash = await encodePassword(prospect.password);
      userToEdit.password = hash;
    }
    await userToEdit.save();
    const serializableUser = this._serializeUser(userToEdit);
    return serializableUser;
  }

  async remove(toDelete) {
    const userToDelete = await this.db.User.findById(toDelete.id);
    if (!userToDelete) {
      throw new RestError(404, { message: `User ${toDelete.id} does not exist` });
    }
    await userToDelete.destroy();
    return this._serializeUser(userToDelete);
  }

  _serializeUser(user) {
    return _.pick(user, ALLOWED_ATTRS);
  }
}

module.exports = UserAPI;
