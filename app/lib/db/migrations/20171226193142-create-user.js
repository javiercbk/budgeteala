/* eslint-disable no-unused-vars */

const Promise = require('bluebird');
const bcrypt = require('bcrypt');

const { encodePassword } = require('../../password');

const ADMIN_PASSWORD = 'budgeteala';

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface
      .createTable(
        'users',
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
          },
          firstName: {
            type: Sequelize.STRING(100),
            allowNull: false,
            field: 'first_name'
          },
          lastName: {
            type: Sequelize.STRING(100),
            allowNull: true,
            field: 'last_name'
          },
          email: {
            type: Sequelize.STRING(256),
            allowNull: false,
            unique: true
          },
          password: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE
          }
        },
        {
          charset: 'utf8mb4'
        }
      )
      .then(() =>
        queryInterface.addIndex('users', {
          fields: ['email'],
          name: 'user_email_idx',
          unique: true
        }))
      .then(() =>
        queryInterface.addIndex('users', {
          fields: ['first_name', 'last_name'],
          name: 'user_name_idx'
        }))
      .then(() =>
        encodePassword(ADMIN_PASSWORD).then(hash =>
          queryInterface.bulkInsert(
            'users',
            [
              {
                first_name: 'Admin',
                last_name: 'User',
                email: 'admin@budgeteala.com',
                password: hash,
                created_at: new Date(),
                updated_at: new Date()
              }
            ],
            {}
          ))),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('users')
};
