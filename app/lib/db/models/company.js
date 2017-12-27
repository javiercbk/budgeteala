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
      }
    },
    {
      tableName: 'companies',
      timestamps: true,
      paranoid: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
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
    Company.hasMany(models.Department);
  };

  return Company;
};
