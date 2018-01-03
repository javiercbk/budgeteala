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
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      }
    },
    {
      tableName: 'departments',
      underscored: false,
      timestamps: true,
      paranoid: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
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
    Department.belongsTo(models.Company, {
      foreignKey: {
        name: 'company',
        field: 'company_id'
      }
    });
    Department.hasOne(Department, {
      foreignKey: {
        name: 'parent',
        field: 'parent_id'
      }
    });
    Department.hasMany(models.Budget);
    Department.hasMany(models.Expense);
  };

  Department.prototype.getChildDepartments = function () {
    return Department.findAll({
      where: {
        parent: this.id,
        company: this.company
      }
    });
  };

  return Department;
};
