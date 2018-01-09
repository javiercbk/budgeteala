const _ = require('lodash');
const apiOptions = require('../../lib/endpoint/api-options');
const RestError = require('../../lib/error');
const {
  handleTransactionError,
  validateBudgetDependencies,
  validateCompanyDepartment
} = require('../../lib/budget');

class BudgetTransactionAPI {
  constructor(options) {
    apiOptions.apply(this, [options]);
  }

  async query(budgetTransactionQuery) {
    await validateCompanyDepartment(this.db, budgetTransactionQuery);
    if (budgetTransactionQuery.id) {
      // prettier screws up here
      // eslint-disable-next-line max-len
      const budgetTransaction = await this.db.BudgetTransaction.findById(budgetTransactionQuery.id);
      if (!budgetTransaction) {
        throw new RestError(404, {
          message: 'Budget transaction does not exist'
        });
      }
      return budgetTransaction;
    }
    const query = {
      attributes: [
        'id',
        'amount',
        'status',
        'date',
        'user',
        'department',
        'createdAt',
        'updatedAt'
      ],
      include: [
        {
          model: this.db.Department,
          required: true
        }
      ],
      where: {}
    };
    if (budgetTransactionQuery.company) {
      _.set(query.include[0], 'where.company', budgetTransactionQuery.company);
    }
    if (budgetTransactionQuery.from) {
      query.where.$and = [
        {
          date: {
            $gte: budgetTransactionQuery.from
          }
        }
      ];
    }
    if (budgetTransactionQuery.to) {
      const condition = [
        {
          date: {
            $lte: budgetTransactionQuery.to
          }
        }
      ];
      if (query.where.$and) {
        query.where.$and = query.where.$and.concat(condition);
      } else {
        query.where.$and = condition;
      }
    }
    const budgetTransactions = await this.db.BudgetTransaction.findAll(query);
    return budgetTransactions;
  }

  async create(prospect) {
    let transaction;
    let budgetTransaction;
    const { departmentBudget } = await this._validateDependencies(prospect, transaction);
    try {
      transaction = await this.db.sequelize.transaction({ autocommit: false });
      const btTemplate = Object.assign({}, prospect, { user: this.user.id });
      budgetTransaction = await this.db.BudgetTransaction.create(btTemplate, { transaction });
      this._applyBudgetTransaction(departmentBudget, budgetTransaction);
      await departmentBudget.save({ transaction });
      await transaction.commit();
    } catch (err) {
      await handleTransactionError(
        err,
        transaction,
        'Error creating budget transaction',
        this.logger
      );
    }
    return budgetTransaction;
  }

  async edit(prospect) {
    let transaction;
    let budgetTransaction;
    // prettier screws up here
    // eslint-disable-next-line max-len
    const { originalBudgetTransaction, departmentBudget } = await this._validateDependencies(prospect);
    try {
      transaction = await this.db.sequelize.transaction({ autocommit: false });
      this._rollbackBudgetTransaction(departmentBudget, originalBudgetTransaction);
      Object.assign(originalBudgetTransaction, prospect);
      budgetTransaction = originalBudgetTransaction;
      await originalBudgetTransaction.save({ transaction });
      this._applyBudgetTransaction(departmentBudget, originalBudgetTransaction);
      await departmentBudget.save({ transaction });
      await transaction.commit();
    } catch (err) {
      await handleTransactionError(
        err,
        transaction,
        'Error editing budget transaction',
        this.logger
      );
    }
    return budgetTransaction;
  }

  async remove(toDelete) {
    let transaction;
    const budgetTransaction = await this.query({ id: toDelete.id });
    toDelete.date = budgetTransaction.date;
    // prettier screws up here
    // eslint-disable-next-line max-len
    const { originalBudgetTransaction, departmentBudget } = await this._validateDependencies(toDelete);
    try {
      transaction = await this.db.sequelize.transaction({ autocommit: false });
      this._rollbackBudgetTransaction(departmentBudget, originalBudgetTransaction);
      await originalBudgetTransaction.destroy({ transaction });
      await departmentBudget.save({ transaction });
      await transaction.commit();
    } catch (err) {
      await handleTransactionError(
        err,
        transaction,
        'Error removing budget transaction',
        this.logger
      );
    }
    return budgetTransaction;
  }

  _applyBudgetTransaction(budget, budgetTransaction) {
    if (budgetTransaction.status === 'acknowledged') {
      budget.ackAmount += budgetTransaction.amount;
    } else {
      budget.allocatedAmount += budgetTransaction.amount;
    }
  }

  _rollbackBudgetTransaction(budget, budgetTransaction) {
    if (budgetTransaction.status === 'acknowledged') {
      budget.ackAmount -= budgetTransaction.amount;
    } else {
      budget.allocatedAmount -= budgetTransaction.amount;
    }
  }

  async _validateDependencies(prospect) {
    const data = await validateBudgetDependencies(this.db, prospect);
    if (prospect.id) {
      const originalBudgetTransaction = await this.db.BudgetTransaction.findOne({
        where: {
          id: prospect.id
        }
      });
      if (!originalBudgetTransaction) {
        throw new RestError(404, { message: `Budget transaction ${prospect.id} does not exist` });
      }
      data.originalBudgetTransaction = originalBudgetTransaction;
    }
    return data;
  }
}

module.exports = BudgetTransactionAPI;
