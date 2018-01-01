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

const ALLOWED_ATTRS = [
  'id',
  'firstName',
  'lastName',
  'email',
  'createdAt',
  'updatedAt',
  'deletedAt'
];

const assertUser = (user, endpointUser) => {
  const dbUser = _.pick(user.toJSON(), ALLOWED_ATTRS);
  const otherUser = _.pick(endpointUser, ALLOWED_ATTRS);
  if (!otherUser.deletedAt) {
    delete otherUser.deletedAt;
  }
  if (!dbUser.deletedAt) {
    delete dbUser.deletedAt;
  }
  expect(otherUser).to.deep.eql(dbUser);
};

describe('UserAPI', () => {
  let user;
  let allUsers;
  beforeEach(async () => {
    await db.sequelize.sync();
    const hash = await encodePassword(PASS);
    const newUsers = [
      {
        firstName: 'Unit',
        lastName: 'Test',
        email: 'unit@email.com',
        password: hash
      },
      {
        firstName: '1',
        lastName: 'Test',
        email: 'u1@email.com',
        password: 'pass',
        deletedAt: null
      },
      {
        firstName: '2',
        lastName: 'Test',
        email: '2@email.com',
        password: 'pass',
        deletedAt: null
      },
      {
        firstName: '3',
        lastName: 'Test',
        email: '3@email.com',
        password: 'pass',
        deletedAt: null
      }
    ];
    allUsers = await db.User.bulkCreate(newUsers);
    [user] = allUsers;
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

  it('should throw a 404 if query matches no user by id', async () => {
    const userAPI = createUserAPI(user);
    let errorThrown = null;
    try {
      await userAPI.query({ id: -1 });
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
    assertUser(user, currentUser);
  });

  it('should return a user by id', async () => {
    const userAPI = createUserAPI(user);
    const currentUser = await userAPI.query({ id: user.id });
    assertUser(user, currentUser);
  });

  it('should return all users when no query is provided', async () => {
    const userAPI = createUserAPI(user);
    const allEndpointUsers = await userAPI.query();
    expect(allEndpointUsers).to.exist;
    allEndpointUsers.forEach((u) => {
      const u1 = allUsers.find(dbU => dbU.id === u.id);
      assertUser(u1, u);
    });
  });

  it('should return all users matching first name', async () => {
    const userAPI = createUserAPI(user);
    const allEndpointUsers = await userAPI.query({ name: '1' });
    expect(allEndpointUsers).to.exist;
    expect(allEndpointUsers.length).to.eql(1);
    allEndpointUsers.forEach((u) => {
      const u1 = allUsers.find(dbU => dbU.id === u.id);
      assertUser(u1, u);
    });
  });

  it('should return all users matching last name', async () => {
    const userAPI = createUserAPI(user);
    const allEndpointUsers = await userAPI.query({ name: 'Test' });
    expect(allEndpointUsers).to.exist;
    expect(allEndpointUsers.length).to.eql(4);
    allEndpointUsers.forEach((u) => {
      const u1 = allUsers.find(dbU => dbU.id === u.id);
      assertUser(u1, u);
    });
  });

  it('should return all users matching email', async () => {
    const userAPI = createUserAPI(user);
    const allEndpointUsers = await userAPI.query({ email: 'u' });
    expect(allEndpointUsers).to.exist;
    expect(allEndpointUsers.length).to.eql(2);
    allEndpointUsers.forEach((u) => {
      const u1 = allUsers.find(dbU => dbU.id === u.id);
      assertUser(u1, u);
    });
  });

  it('should return all users matching email and name', async () => {
    const userAPI = createUserAPI(user);
    const allEndpointUsers = await userAPI.query({ email: 'u', name: 'U' });
    expect(allEndpointUsers).to.exist;
    expect(allEndpointUsers.length).to.eql(1);
    allEndpointUsers.forEach((u) => {
      const u1 = allUsers.find(dbU => dbU.id === u.id);
      assertUser(u1, u);
    });
  });

  it('should escape "%" character', async () => {
    const userAPI = createUserAPI(user);
    const allEndpointUsers = await userAPI.query({ name: '%' });
    expect(allEndpointUsers).to.exist;
    expect(allEndpointUsers.length).to.eql(0);
  });
});
