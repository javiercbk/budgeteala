/* eslint-disable no-unused-vars */
const moment = require('moment');

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface
      .createTable(
        'budgets_transactions',
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
          },
          amount: {
            type: Sequelize.DOUBLE,
            allowNull: false
          },
          status: {
            type: Sequelize.ENUM('acknowledged', 'allocated', 'cancelled'),
            allowNull: false
          },
          date: {
            type: Sequelize.DATE,
            allowNull: false
          },
          version: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false
          },
          user_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
              onDelete: 'SET NULL'
            }
          },
          department_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
              model: 'departments',
              key: 'id',
              onDelete: 'CASCADE'
            }
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
        queryInterface.addIndex('budgets_transactions', {
          fields: ['date'],
          name: 'budget_transaction_date_idx'
        })),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('budgets_transactions')
};
