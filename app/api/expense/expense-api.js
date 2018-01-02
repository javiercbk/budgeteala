const apiOptions = require('../../lib/endpoint/api-options');
const RestError = require('../../lib/error');
const { handleTransactionError, validateBudgetDependencies } = require('../../lib/budget');

class ExpenseAPI {
  constructor(options) {
    apiOptions.apply(this, [options]);
  }

  async query(expenseQuery) {
    if (expenseQuery.id) {
      // prettier screws up here
      // eslint-disable-next-line max-len
      const expense = await this.db.Expense.findById(expenseQuery.id);
      if (!expense) {
        throw new RestError(404, {
          message: 'Expense detail does not exist'
        });
      }
      return expense;
    }
    const query = {
      attributes: ['id', 'amount', 'concept', 'date', 'createdAt', 'updatedAt', 'deletedAt'],
      include: [
        {
          model: this.db.Department,
          required: true,
          where: {
            departmentId: expenseQuery.departmentId
          }
        }
      ],
      where: {}
    };
    if (expenseQuery.companyId) {
      query.include[0].where.companyId = expenseQuery.companyId;
    }
    if (expenseQuery.from) {
      query.where.$or = [
        {
          date: {
            $gte: expenseQuery.from.toDate()
          }
        }
      ];
    }
    if (expenseQuery.to) {
      const condition = [
        {
          date: {
            $lte: expenseQuery.to.toDate()
          }
        }
      ];
      if (query.where.$or) {
        query.where.$or = query.where.$or.concat(condition);
      } else {
        query.where.$or = condition;
      }
    }
    const expenses = await this.db.Expense.findAll(query);
    return expenses;
  }

  async create(prospect) {
    let transaction;
    let expense;
    // prospect.date is a moment instance
    prospect.date = prospect.date.toDate();
    try {
      transaction = await this.db.sequelize.transaction({ autocommit: false });
      // _validateDependencies locks the budget row using mysql pesimistic lock on the row.
      const { departmentBudget } = await this._validateDependencies(prospect, transaction);
      prospect.date = prospect.date.toDate();
      expense = await this.db.Expense.create(prospect, { transaction });
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
    // prospect.date is a moment instance
    prospect.date = prospect.date.toDate();

    try {
      transaction = await this.db.sequelize.transaction({ autocommit: false });
      // _validateDependencies locks the expense and the expense detail row
      // using mysql pesimistic lock on the row.
      const { originalExpense, departmentBudget } = await this._validateDependencies(
        prospect,
        transaction
      );
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
    let expense;
    try {
      transaction = await this.db.sequelize.transaction({ autocommit: false });
      // _validateDependencies locks the budget and the expense detail row
      // using mysql pesimistic lock on the row.
      const { originalExpense, departmentBudget } = await this._validateDependencies(
        toDelete,
        transaction
      );
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

  async _validateDependencies(prospect, transaction) {
    const data = await validateBudgetDependencies(this.db, prospect, transaction);
    if (prospect.id) {
      const originalExpense = await this.db.Expense.findOne({
        where: {
          id: prospect.id
        },
        lock: transaction.LOCK.UPDATE,
        transaction
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
