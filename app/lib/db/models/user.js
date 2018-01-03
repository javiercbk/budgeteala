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
      tableName: 'users',
      underscored: true,
      timestamps: true,
      paranoid: false,
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
