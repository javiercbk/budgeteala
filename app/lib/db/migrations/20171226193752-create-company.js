/* eslint-disable no-unused-vars */

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface
      .createTable(
        'companies',
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
          },
          name: {
            type: Sequelize.STRING(100),
            allowNull: false
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE
          },
          deleted_at: {
            allowNull: false,
            type: Sequelize.DATE
          }
        },
        {
          charset: 'utf8mb4'
        }
      )
      .then(() =>
        queryInterface.addIndex('companies', {
          fields: ['name'],
          name: 'company_name_idx',
          unique: true
        }))
      .then(() =>
        queryInterface.addIndex('companies', {
          fields: ['deletedAt'],
          name: 'company_deleted_at_idx'
        })),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('companies')
};
