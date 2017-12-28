const Promise = require('bluebird');
const bcrypt = require('bcrypt');

const SALT_ITERATIONS = 12;

const comparePassword = function (givenPassword, userPassword) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(givenPassword, userPassword, (err, result) => {
      if (err) {
        return reject(err);
      }
      if (!result) {
        return reject(new Error('Password does not match'));
      }
      resolve();
    });
  });
};

const encodePassword = password =>
  new Promise((resolve, reject) => {
    bcrypt.genSalt(SALT_ITERATIONS, (err, salt) => {
      if (err) {
        reject(err);
      } else {
        resolve(salt);
      }
    });
  }).then(salt =>
    new Promise((resolve, reject) => {
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    }));

module.exports = {
  comparePassword,
  encodePassword
};
