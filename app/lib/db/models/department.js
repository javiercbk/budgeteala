module.exports = function (sequelize, DataTypes) {
  const Department = sequelize.define(
    'Department',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      parentId: {
        type: DataTypes.BIGINT.UNSIGNED,
        field: 'parent_id'
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      }
    },
    {
      tableName: 'departments',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      charset: 'utf8mb4',
      indexes: [
        {
          name: 'department_name_idx',
          fields: ['name']
        },
        {
          name: 'department_parent_idx',
          fields: ['parent_id']
        }
      ]
    }
  );

  Department.associate = (models) => {
    Department.belongsTo(models.Company);
    Department.hasOne(Department, { as: 'parent', foreignKey: 'parentId' });
    Department.hasMany(models.Budget);
    Department.hasMany(models.AggregatedExpenses);
    Department.hasMany(models.Expense);
  };

  Department.prototype.getChildDepartments = function () {
    return Department.findAll({
      where: {
        parentId: this.id,
        companyId: this.companyId
      }
    });
  };

  return Department;
};
