/* eslint-disable no-unused-vars */
const moment = require('moment');

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface
      .createTable(
        'aggregated_expenses',
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
          start: {
            type: Sequelize.DATE,
            allowNull: false
          },
          end: {
            type: Sequelize.DATE,
            allowNull: false
          },
          department_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            references: {
              model: 'departments',
              key: 'id'
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
        queryInterface.addIndex('aggregated_expenses', {
          fields: ['start'],
          name: 'aggregated_expenses_start_idx'
        }))
      .then(() =>
        queryInterface.addIndex('aggregated_expenses', {
          fields: ['end'],
          name: 'aggregated_expenses_end_idx'
        })),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('aggregated_expenses')
};
