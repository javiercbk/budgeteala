const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
  const BudgetTransaction = sequelize.define(
    'BudgetTransaction',
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
      status: {
        type: DataTypes.ENUM('acknowledged', 'allocated', 'cancelled'),
        allowNull: false
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
      tableName: 'budget_transactions',
      underscored: true,
      timestamps: true,
      paranoid: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      charset: 'utf8mb4',
      indexes: [
        {
          name: 'budget_transaction_date_idx',
          fields: ['date']
        }
      ]
    }
  );

  BudgetTransaction.associate = (models) => {
    BudgetTransaction.belongsTo(models.User, {
      foreignKey: {
        name: 'user',
        field: 'user_id'
      }
    });
    BudgetTransaction.belongsTo(models.Department, {
      foreignKey: {
        name: 'department',
        field: 'department_id'
      }
    });
  };

  return BudgetTransaction;
};
