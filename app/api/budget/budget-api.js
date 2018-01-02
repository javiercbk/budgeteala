const _ = require('lodash');
const Promise = require('bluebird');
const apiOptions = require('../../lib/endpoint/api-options');
const RestError = require('../../lib/error');

class BudgetAPI {
  constructor(options) {
    apiOptions.apply(this, [options]);
  }

  async query(budgetQuery) {
    if (budgetQuery.id) {
      // prettier screws up here
      // eslint-disable-next-line max-len
      const budget = await this.db.Budget.findById(budgetQuery.id);
      if (!budget) {
        throw new RestError(404, {
          message: 'Budget transaction does not exist'
        });
      }
      return budget;
    }
    const query = {
      attributes: [
        'id',
        'ackAmount',
        'allocAmount',
        'start',
        'end',
        'createdAt',
        'updatedAt',
        'deletedAt'
      ],
      include: [
        {
          model: this.db.Department,
          required: true,
          where: {
            departmentId: budgetQuery.departmentId
          }
        }
      ],
      where: {}
    };
    if (budgetQuery.companyId) {
      query.include[0].where.companyId = budgetQuery.companyId;
    }
    this._assignDateQuery(query, budgetQuery);
    const budgets = await this.db.Budget.findAll(query);
    return budgets;
  }

  async create(prospect) {
    await this._validateDependencies(prospect);
    const newBudget = Object.assign({}, prospect, { ackAmount: 0, allocAmount: 0 });
    const dbBudget = await this.db.Budget.create(newBudget);
    return dbBudget;
  }

  async edit(prospect) {
    const { originalBudget } = await this._validateDependencies(prospect);
    Object.assign(originalBudget, _.pick(prospect, ['start', 'end']));
    await originalBudget.save();
    return originalBudget;
  }

  async remove(toDelete) {
    const { originalBudget } = await this._validateDependencies(toDelete);
    await originalBudget.destroy();
    return originalBudget;
  }

  _assignDateQuery(query, prospect) {
    this._assignDatePairQuery(query, prospect, 'start');
    this._assignDatePairQuery(query, prospect, 'end');
  }

  _assignDatePairQuery(query, prospect, prop) {
    // capitalize first letter of prop
    const cap = _.capitalize(prop);
    // build from and to property name
    const [from, to] = ['from', 'to'].map(p => `${p}${cap}`);
    if (prospect[from]) {
      query.where[prop] = {
        $and: [
          {
            $gte: prospect[from]
          }
        ]
      };
    }
    if (prospect[to]) {
      const condition = {
        $lte: prospect[from]
      };
      if (query.where[prop]) {
        query.where[prop].$and.push(condition);
      } else {
        query.where[prop].$and = [condition];
      }
    }
  }

  async _validateDependencies(prospect) {
    let company;
    if (prospect.companyId) {
      company = await this.db.Company.findById(prospect.companyId);
      if (!company) {
        throw new RestError(404, { message: `Company ${prospect.companyId} does not exist` });
      }
    }
    const department = await this.db.Department.findById(prospect.departmentId);
    if (!department) {
      throw new RestError(404, { message: `Department ${prospect.departmentId} does not exist` });
    }
    if (prospect.start && prospect.end) {
      const overlappingStartQuery = this.query({
        fromStart: prospect.start,
        toEnd: prospect.start
      });
      const overlappingEndQuery = this.query({ fromStart: prospect.end, toEnd: prospect.end });
      const overlappingBudgets = await Promise.all([overlappingStartQuery, overlappingEndQuery]);
      const overlapIndex = overlappingBudgets.findIndex(budgetArray => budgetArray.length);
      if (overlapIndex !== -1) {
        const { start, end } = overlappingBudgets[overlapIndex][0];
        throw new RestError(422, {
          message: `Budget overlaps with another existing budget with dates start ${start} and end ${end}`
        });
      }
    }
    const data = {
      company,
      department
    };
    if (prospect.id) {
      const query = {
        where: {
          id: prospect.id,
          departmentId: prospect.departmentId
        }
      };
      if (prospect.companyId) {
        query.where.companyId = prospect.companyId;
      }
      const originalBudget = await this.db.Budget.findOne(query);
      if (!originalBudget) {
        throw new RestError(404, { message: `Budget ${prospect.id} does not exist` });
      }
      data.originalBudget = originalBudget;
    }
    return data;
  }
}

module.exports = BudgetAPI;
