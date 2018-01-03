module.exports = function (sequelize, DataTypes) {
  const Company = sequelize.define(
    'Company',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(100),
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
      tableName: 'companies',
      underscored: true,
      timestamps: true,
      paranoid: false,
      charset: 'utf8mb4',
      indexes: [
        {
          name: 'company_name_idx',
          fields: ['name']
        }
      ]
    }
  );

  Company.associate = (models) => {
    Company.hasMany(models.Department, { onDelete: 'CASCADE', hooks: true });
  };

  return Company;
};
