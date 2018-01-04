const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
  const Expense = sequelize.define(
    'Expense',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false
      },
      concept: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'updated_at'
      }
    },
    {
      tableName: 'expense',
      underscored: true,
      timestamps: true,
      paranoid: false,
      charset: 'utf8mb4',
      indexes: [
        {
          name: 'expense_date_idx',
          fields: ['date']
        }
      ]
    }
  );

  Expense.associate = (models) => {
    Expense.belongsTo(models.Department, {
      foreignKey: {
        allowNull: false,
        name: 'department',
        field: 'department_id'
      }
    });
  };

  return Expense;
};
