/* eslint-disable no-unused-vars */

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface
      .createTable(
        'budgets',
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
          },
          ack_amount: {
            type: Sequelize.DOUBLE,
            allowNull: false
          },
          alloc_amount: {
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
        queryInterface.addIndex('budgets', {
          fields: ['start'],
          name: 'budget_start_idx'
        }))
      .then(() =>
        queryInterface.addIndex('budgets', {
          fields: ['end'],
          name: 'budget_end_idx'
        })),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('budgets')
};
