module.exports = function (sequelize, DataTypes) {
  const AggregatedExpenses = sequelize.define(
    'AggregatedExpenses',
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
      tableName: 'aggregated_expenses',
      timestamps: true,
      paranoid: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      charset: 'utf8mb4',
      indexes: [
        {
          name: 'aggregated_expenses_start_idx',
          fields: ['start']
        },
        {
          name: 'aggregated_expenses_end_idx',
          fields: ['end']
        }
      ]
    }
  );

  AggregatedExpenses.associate = (models) => {
    AggregatedExpenses.belongsTo(models.Department);
  };

  return AggregatedExpenses;
};
