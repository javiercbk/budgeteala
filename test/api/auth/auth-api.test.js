const { expect } = require('chai');

const db = require('../../../app/lib/db');
const AuthAPI = require('../../../app/api/auth/auth-api');
const nullLogger = require('../../../app/lib/log/null-logger');
const config = require('../../../app/lib/config');
const { encodePassword } = require('../../../app/lib/password');

const createAuthAPI = user =>
  new AuthAPI({
    user,
    logger: nullLogger,
    config,
    db
  });

const mockUser = { id: 1 };
const PASS = 'test';

describe('AuthAPI', () => {
  beforeEach(async () => {
    await db.sequelize.sync();
    const hash = await encodePassword(PASS);
    await db.User.create({
      firstName: 'Unit',
      lastName: 'Test',
      email: 'unit@email.com',
      password: hash
    });
  });

  it('should throw a 401 if no user matches', async () => {
    const authAPI = createAuthAPI(mockUser);
    const credentials = {
      email: 'unexisting@email.com',
      password: 'wrongPassword'
    };
    let errorThrown = null;
    try {
      await authAPI.createToken(credentials);
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(401);
    expect(errorThrown.message).to.eql('Invalid username or password');
  });
});
