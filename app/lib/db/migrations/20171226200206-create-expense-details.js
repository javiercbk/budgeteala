/* eslint-disable no-unused-vars */
const moment = require('moment');

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface
      .createTable(
        'expenses',
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
          concept: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          version: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false
          },
          date: {
            type: Sequelize.DATE,
            allowNull: false
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
        queryInterface.addIndex('expenses', {
          fields: ['date'],
          name: 'expense_date_idx'
        })),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('expenses')
};
