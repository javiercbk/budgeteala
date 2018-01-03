const _ = require('lodash');

const apiOptions = require('../../lib/endpoint/api-options');
const RestError = require('../../lib/error');

class DepartmentAPI {
  constructor(options) {
    apiOptions.apply(this, [options]);
  }

  async query(departmentQuery) {
    const query = {
      where: {}
    };
    if (departmentQuery) {
      if (departmentQuery.id) {
        query.where.id = departmentQuery.id;
        if (departmentQuery.company) {
          query.where.company = departmentQuery.company;
        }
        query.include = [
          {
            model: this.db.Budget,
            required: false
          },
          {
            model: this.db.Expense,
            required: false
          }
        ];
        const department = await this.db.Department.findOne(query);
        if (!department) {
          throw new RestError(404, { message: 'Department does not exist' });
        }
        return department;
      }
      const { sequelize: { escape } } = this.db;
      if (departmentQuery.name) {
        query.where.name = {
          $like: `${escape(departmentQuery.name)}%`
        };
      }
      if (departmentQuery.parent) {
        query.where.parent = departmentQuery.parent;
      }
      if (departmentQuery.company) {
        query.where.company = departmentQuery.company;
      }
    }
    const companies = await this.db.Department.findAll(query);
    return companies;
  }

  async create(prospect) {
    await this._validateProspect(prospect);
    const newDepartment = await this.db.Department.create(prospect);
    return newDepartment;
  }

  async edit(prospect) {
    const departmentToEdit = await this.db.Department.findById(prospect.id);
    if (!departmentToEdit) {
      throw new RestError(404, { message: `Department ${prospect.id} does not exist` });
    }
    await this._validateProspect(prospect);
    Object.assign(departmentToEdit, prospect);
    await departmentToEdit.save();
    return departmentToEdit;
  }

  async remove(toDelete) {
    const departmentToDelete = await this.db.Department.findById(toDelete.id);
    if (!departmentToDelete) {
      throw new RestError(404, { message: `Department ${toDelete.id} does not exist` });
    }
    await departmentToDelete.destroy();
    return departmentToDelete;
  }

  async _validateProspect(prospect) {
    const existingCompany = await this.db.Company.findOne({
      where: {
        id: prospect.company
      }
    });
    if (!existingCompany) {
      throw new RestError(422, { message: `Company ${prospect.company} does not exist` });
    }
    if (prospect.parent) {
      const existingDepartment = await this.db.Department.findOne({
        where: {
          id: prospect.parent,
          company: prospect.company
        }
      });
      if (!existingDepartment) {
        throw new RestError(422, {
          message: `Department ${prospect.parent} does not exist in company ${prospect.company}`
        });
      }
    }
  }
}

module.exports = DepartmentAPI;
