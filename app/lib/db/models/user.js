module.exports = function (sequelize, DataTypes) {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'first_name'
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'last_name'
      },
      email: {
        type: DataTypes.STRING(256),
        allowNull: true,
        unique: true
      },
      password: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'users',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      charset: 'utf8mb4',
      indexes: [
        {
          name: 'user_email_idx',
          fields: ['email']
        },
        {
          name: 'user_name_idx',
          fields: ['first_name', 'last_name']
        }
      ]
    }
  );

  User.associate = (models) => {
    User.hasMany(models.BudgetTransaction);
  };

  return User;
};
