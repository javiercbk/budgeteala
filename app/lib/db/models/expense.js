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
        allowNull: false,
        defaultValue: function () {
          return moment.utc().toDate();
        }
      }
    },
    {
      tableName: 'expense',
      timestamps: true,
      paranoid: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
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
    Expense.belongsTo(models.Department);
  };

  return Expense;
};
