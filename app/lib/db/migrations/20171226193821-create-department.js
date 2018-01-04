/* eslint-disable no-unused-vars */

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface
      .createTable(
        'departments',
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
          },
          parent_id: {
            type: Sequelize.BIGINT,
            allowNull: true
          },
          name: {
            type: Sequelize.STRING(100),
            allowNull: false
          },
          company_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
              model: 'companies',
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
        queryInterface.addIndex('departments', {
          fields: ['name'],
          name: 'department_name_idx'
        }))
      .then(() =>
        queryInterface.addIndex('departments', {
          fields: ['parent_id'],
          name: 'department_parent_idx'
        })),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('departments')
};
