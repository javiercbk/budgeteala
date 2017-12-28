const _ = require('lodash');
const { expect } = require('chai');

const db = require('../../../app/lib/db');
const UserAPI = require('../../../app/api/user/user-api');
const nullLogger = require('../../../app/lib/log/null-logger');
const config = require('../../../app/lib/config');
const { encodePassword } = require('../../../app/lib/password');

const createUserAPI = user =>
  new UserAPI({
    user,
    logger: nullLogger,
    config,
    db
  });

const PASS = 'test';

describe('UserAPI', () => {
  let user;
  beforeEach(async () => {
    await db.sequelize.sync();
    const hash = await encodePassword(PASS);
    user = await db.User.create({
      firstName: 'Unit',
      lastName: 'Test',
      email: 'unit@email.com',
      password: hash
    });
  });

  afterEach(async () => {
    await db.sequelize.drop();
  });

  it('should throw a 404 if no user matches', async () => {
    const userAPI = createUserAPI({ id: -1 });
    let errorThrown = null;
    try {
      await userAPI.currentUser();
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql('User does not exist');
  });

  it('should return the current user', async () => {
    const userAPI = createUserAPI(user);
    const currentUser = await userAPI.currentUser();
    const dbUser = _.pick(user.toJSON(), ['email', 'firstName', 'lastName', 'id']);
    expect(currentUser).to.deep.eql(dbUser);
  });
});
