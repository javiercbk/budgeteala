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

const cleanUser = (user) => {
  if (user.toJSON) {
    return _.pick(user.toJSON(), ALLOWED_ATTRS);
  }
  return _.pick(user, ALLOWED_ATTRS);
};

const assertUser = (user, endpointUser) => {
  const dbUser = cleanUser(user);
  const otherUser = cleanUser(endpointUser);
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

  it('should escape "%" character when querying', async () => {
    const userAPI = createUserAPI(user);
    const allEndpointUsers = await userAPI.query({ name: '%' });
    expect(allEndpointUsers).to.exist;
    expect(allEndpointUsers.length).to.eql(0);
  });

  it('should create a user', async () => {
    const userAPI = createUserAPI(user);
    const newProspectUser = {
      email: '4@email.com',
      firstName: '4',
      lastName: 'Test',
      password: 'test'
    };
    const newUser = await userAPI.create(newProspectUser);
    expect(newUser).to.exist;
    expect(newUser.id).to.exist;
    expect(newUser.password).to.not.exist;
    expect(newUser.firstName).to.eql(newProspectUser.firstName);
    expect(newUser.lastName).to.eql(newProspectUser.lastName);
    expect(newUser.email).to.eql(newProspectUser.email);
    const newUserEndpoint = await userAPI.query({ id: newUser.id });
    expect(newUserEndpoint).to.exist;
    assertUser(newUser, newUserEndpoint);
  });

  it('should throw 409 when trying to create a user with an repeated email', async () => {
    const userAPI = createUserAPI(user);
    const newProspectUser = {
      email: 'unit@email.com',
      firstName: '4',
      lastName: 'Test',
      password: 'test'
    };
    let errorThrown;
    try {
      await userAPI.create(newProspectUser);
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(409);
    expect(errorThrown.message).to.eql(`A user already exist with email ${newProspectUser.email}`);
  });

  it('should throw 404 when editing a user with unexisting id', async () => {
    const userAPI = createUserAPI(user);
    const newProspectUser = {
      id: -1,
      email: 'unit@email.com',
      firstName: '4',
      lastName: 'Test'
    };
    let errorThrown;
    try {
      await userAPI.edit(newProspectUser);
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`User ${newProspectUser.id} does not exist`);
  });

  it("should throw 409 when updating a user's email by an existing email", async () => {
    const userAPI = createUserAPI(user);
    const newProspectUser = {
      id: user.id,
      email: '2@email.com',
      firstName: '4',
      lastName: 'Test'
    };
    let errorThrown;
    try {
      await userAPI.edit(newProspectUser);
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(409);
    expect(errorThrown.message).to.eql(`A user already exist with email ${newProspectUser.email}`);
  });

  it('should update a user', async () => {
    const userAPI = createUserAPI(user);
    const newProspectUser = {
      id: user.id,
      email: '5@email.com',
      firstName: '5',
      lastName: 'Test'
    };
    const updatedUser = await userAPI.edit(newProspectUser);
    expect(updatedUser).to.exist;
    expect(updatedUser.id).to.eql(user.id);
    expect(updatedUser.password).to.not.exist;
    expect(updatedUser.firstName).to.eql(newProspectUser.firstName);
    expect(updatedUser.lastName).to.eql(newProspectUser.lastName);
    expect(updatedUser.email).to.eql(newProspectUser.email);
    const userInDB = await userAPI.query({ id: user.id });
    expect(userInDB).to.exist;
    expect(userInDB.id).to.eql(updatedUser.id);
    expect(userInDB.password).to.not.exist;
    expect(userInDB.firstName).to.eql(updatedUser.firstName);
    expect(userInDB.lastName).to.eql(updatedUser.lastName);
    expect(userInDB.email).to.eql(updatedUser.email);
  });

  it('should throw 404 when trying to remove an unexisting user', async () => {
    const userAPI = createUserAPI(user);
    const query = { id: -1 };
    let errorThrown;
    try {
      await userAPI.edit(query);
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`User ${query.id} does not exist`);
  });

  it('should remove a user', async () => {
    const userAPI = createUserAPI(user);
    const query = {
      id: user.id
    };
    const deletedUser = await userAPI.remove(query);
    expect(deletedUser).to.exist;
    expect(deletedUser.id).to.eql(user.id);
    expect(deletedUser.password).to.not.exist;
    let errorThrown = null;
    try {
      await userAPI.query({ id: user.id });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql('User does not exist');
  });
});
