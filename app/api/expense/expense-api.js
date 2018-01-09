const apiOptions = require('../../lib/endpoint/api-options');
const RestError = require('../../lib/error');
const {
  handleTransactionError,
  validateBudgetDependencies,
  validateCompanyDepartment
} = require('../../lib/budget');

class ExpenseAPI {
  constructor(options) {
    apiOptions.apply(this, [options]);
  }

  async query(expenseQuery) {
    await validateCompanyDepartment(this.db, expenseQuery);
    if (expenseQuery.id) {
      // prettier screws up here
      // eslint-disable-next-line max-len
      const expense = await this.db.Expense.findOne({
        where: {
          id: expenseQuery.id
        }
      });
      if (!expense) {
        throw new RestError(404, {
          message: 'Expense does not exist'
        });
      }
      return expense;
    }
    const query = {
      attributes: [
        'id',
        'amount',
        'concept',
        'date',
        'department',
        'user',
        'createdAt',
        'updatedAt'
      ],
      include: [
        {
          model: this.db.Department,
          required: true,
          where: {
            id: expenseQuery.department
          }
        }
      ],
      where: {}
    };
    if (expenseQuery.company) {
      query.include[0].where.company = expenseQuery.company;
    }
    if (expenseQuery.from) {
      query.where.$and = [
        {
          date: {
            $gte: expenseQuery.from
          }
        }
      ];
    }
    if (expenseQuery.to) {
      const condition = [
        {
          date: {
            $lte: expenseQuery.to
          }
        }
      ];
      if (query.where.$and) {
        query.where.$and = query.where.$and.concat(condition);
      } else {
        query.where.$and = condition;
      }
    }
    const expenses = await this.db.Expense.findAll(query);
    return expenses;
  }

  async create(prospect) {
    let transaction;
    let expense;
    const { departmentBudget } = await this._validateDependencies(prospect);
    try {
      transaction = await this.db.sequelize.transaction({ autocommit: false });
      const expenseTemplate = Object.assign({}, prospect, { user: this.user.id });
      expense = await this.db.Expense.create(expenseTemplate, { transaction });
      this._applyExpense(departmentBudget, expense);
      await departmentBudget.save({ transaction });
      await transaction.commit();
    } catch (err) {
      await handleTransactionError(err, transaction, 'Error creation expense', this.logger);
    }
    return expense;
  }

  async edit(prospect) {
    let transaction;
    let expense;
    const { originalExpense, departmentBudget } = await this._validateDependencies(prospect);
    try {
      transaction = await this.db.sequelize.transaction({ autocommit: false });
      this._rollbackExpense(departmentBudget, originalExpense);
      Object.assign(originalExpense, prospect);
      expense = originalExpense;
      await originalExpense.save({ transaction });
      this._applyExpense(departmentBudget, originalExpense);
      await departmentBudget.save({ transaction });
      await transaction.commit();
    } catch (err) {
      await handleTransactionError(err, transaction, 'Error editing expense', this.logger);
    }
    return expense;
  }

  async remove(toDelete) {
    let transaction;
    const expense = await this.query({ id: toDelete.id });
    toDelete.date = expense.date;
    const { originalExpense, departmentBudget } = await this._validateDependencies(toDelete);
    try {
      transaction = await this.db.sequelize.transaction({ autocommit: false });
      this._rollbackExpense(departmentBudget, originalExpense);
      await originalExpense.destroy({ transaction });
      await departmentBudget.save({ transaction });
      await transaction.commit();
    } catch (err) {
      await handleTransactionError(err, transaction, 'Error removing expense', this.logger);
    }
    return expense;
  }

  _applyExpense(budget, expense) {
    budget.expenses += expense.amount;
  }

  _rollbackExpense(budget, expense) {
    budget.expenses -= expense.amount;
  }

  async _validateDependencies(prospect) {
    const data = await validateBudgetDependencies(this.db, prospect);
    if (prospect.id) {
      const originalExpense = await this.db.Expense.findOne({
        where: {
          id: prospect.id
        }
      });
      if (!originalExpense) {
        throw new RestError(404, { message: `Expense ${prospect.id} does not exist` });
      }
      data.originalExpense = originalExpense;
    }
    return data;
  }
}

module.exports = ExpenseAPI;
