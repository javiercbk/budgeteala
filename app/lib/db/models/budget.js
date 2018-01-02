module.exports = function (sequelize, DataTypes) {
  const Budget = sequelize.define(
    'Budget',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      ackAmount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        field: 'ack_amount'
      },
      allocatedAmount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        field: 'alloc_amount'
      },
      expenses: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        field: 'expenses'
      },
      start: {
        type: DataTypes.DATE,
        allowNull: false
      },
      end: {
        type: DataTypes.DATE,
        allowNull: false
      }
    },
    {
      tableName: 'budgets',
      timestamps: true,
      paranoid: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      charset: 'utf8mb4',
      indexes: [
        {
          name: 'budget_start_idx',
          fields: ['start']
        },
        {
          name: 'budget_end_idx',
          fields: ['end']
        }
      ]
    }
  );

  Budget.associate = (models) => {
    Budget.belongsTo(models.Department);
  };

  return Budget;
};
