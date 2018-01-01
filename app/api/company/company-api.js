const _ = require('lodash');

const apiOptions = require('../../lib/endpoint/api-options');
const RestError = require('../../lib/error');

class CompanyAPI {
  constructor(options) {
    apiOptions.apply(this, [options]);
  }

  async query(companyQuery) {
    const query = {
      where: {}
    };
    if (companyQuery) {
      if (companyQuery.id) {
        const company = await this.db.Company.findById(companyQuery.id);
        if (!company) {
          throw new RestError(404, { message: 'Company does not exist' });
        }
        return company;
      }
      const { sequelize: { escape } } = this.db;
      if (companyQuery.name) {
        query.where.name = {
          $like: `${escape(companyQuery.name)}%`
        };
      }
    }
    const companies = await this.db.Company.findAll(query);
    return companies;
  }

  async create(prospect) {
    const existingCompany = await this.db.Company.findOne({
      where: {
        name: prospect.name
      }
    });
    if (existingCompany) {
      throw new RestError(409, { message: `A company already exist with name ${prospect.name}` });
    }
    const newCompany = await this.db.Company.create(prospect);
    return newCompany;
  }

  async edit(prospect) {
    const existingCompany = await this.db.Company.findOne({
      where: {
        id: {
          $ne: prospect.id
        },
        name: prospect.name
      }
    });
    if (existingCompany) {
      throw new RestError(409, { message: `A company already exist with name ${prospect.name}` });
    }
    const companyToEdit = await this.db.Company.findById(prospect.id);
    if (!companyToEdit) {
      throw new RestError(404, { message: `Company ${prospect.id} does not exist` });
    }
    companyToEdit.name = prospect.name;
    await companyToEdit.save();
    return companyToEdit;
  }

  async remove(toDelete) {
    const companyToDelete = await this.db.Company.findById(toDelete.id);
    if (!companyToDelete) {
      throw new RestError(404, { message: `Company ${toDelete.id} does not exist` });
    }
    await companyToDelete.destroy();
    return companyToDelete;
  }
}

module.exports = CompanyAPI;
