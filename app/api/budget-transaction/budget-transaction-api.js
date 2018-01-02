const apiOptions = require('../../lib/endpoint/api-options');
const RestError = require('../../lib/error');

class BudgetTransactionAPI {
  constructor(options) {
    apiOptions.apply(this, [options]);
  }

  async query(budgetTransactionQuery) {
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
      attributes: ['id', 'amount', 'status', 'date', 'createdAt', 'updatedAt', 'deletedAt'],
      include: [
        {
          model: this.db.Department,
          required: true,
          where: {
            departmentId: budgetTransactionQuery.departmentId
          }
        }
      ],
      where: {}
    };
    if (budgetTransactionQuery.companyId) {
      query.include[0].where.companyId = budgetTransactionQuery.companyId;
    }
    if (budgetTransactionQuery.from) {
      query.where.$or = [
        {
          date: {
            $gte: budgetTransactionQuery.from.toDate()
          }
        }
      ];
    }
    if (budgetTransactionQuery.to) {
      const condition = [
        {
          date: {
            $lte: budgetTransactionQuery.to.toDate()
          }
        }
      ];
      if (query.where.$or) {
        query.where.$or = query.where.$or.concat(condition);
      } else {
        query.where.$or = condition;
      }
    }
    const budgetTransactions = await this.db.BudgetTransaction.findAll(query);
    return budgetTransactions;
  }

  async create(prospect) {
    let transaction;
    let budgetTransaction;
    // prospect.date is a moment instance
    prospect.date = prospect.date.toDate();
    try {
      transaction = await this.db.sequelize.transaction({ autocommit: false });
      // _validateDependencies locks the budget row using mysql pesimistic lock on the row.
      const { departmentBudget } = await this._validateDependencies(prospect, transaction);
      prospect.date = prospect.date.toDate();
      budgetTransaction = await this.db.BudgetTransaction.create(prospect, { transaction });
      this._applyBudgetTransaction(departmentBudget, budgetTransaction);
      await departmentBudget.save({ transaction });
      await transaction.commit();
    } catch (err) {
      await this._handleWriteError(err, transaction, 'Error creating budget transaction');
    }
    return budgetTransaction;
  }

  async edit(prospect) {
    let transaction;
    let budgetTransaction;
    // prospect.date is a moment instance
    prospect.date = prospect.date.toDate();

    try {
      transaction = await this.db.sequelize.transaction({ autocommit: false });
      // _validateDependencies locks the budget and the budget transaction row
      // using mysql pesimistic lock on the row.
      const { originalBudgetTransaction, departmentBudget } = await this._validateDependencies(
        prospect,
        transaction
      );
      this._rollbackBudgetTransaction(departmentBudget, originalBudgetTransaction);
      Object.assign(originalBudgetTransaction, prospect);
      budgetTransaction = originalBudgetTransaction;
      await originalBudgetTransaction.save({ transaction });
      this._applyBudgetTransaction(departmentBudget, originalBudgetTransaction);
      await departmentBudget.save({ transaction });
      await transaction.commit();
    } catch (err) {
      await this._handleWriteError(err, transaction, 'Error editing budget transaction');
    }
    return budgetTransaction;
  }

  async remove(toDelete) {
    let transaction;
    let budgetTransaction;
    try {
      transaction = await this.db.sequelize.transaction({ autocommit: false });
      // _validateDependencies locks the budget and the budget transaction row
      // using mysql pesimistic lock on the row.
      const { originalBudgetTransaction, departmentBudget } = await this._validateDependencies(
        toDelete,
        transaction
      );
      this._rollbackBudgetTransaction(departmentBudget, originalBudgetTransaction);
      await originalBudgetTransaction.destroy({ transaction });
      await departmentBudget.save({ transaction });
      await transaction.commit();
    } catch (err) {
      await this._handleWriteError(err, transaction, 'Error removing budget transaction');
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

  async _validateDependencies(prospect, transaction) {
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
    const departmentBudget = await this.db.Budget.findOne({
      where: {
        departmentId: prospect.departmentId,
        start: {
          $gte: prospect.date
        },
        end: {
          $lte: prospect.date
        },
        lock: transaction.LOCK.UPDATE,
        transaction
      }
    });
    if (!departmentBudget) {
      throw new RestError(422, {
        message: `Department ${
          prospect.departmentId
        } has no budget for date ${prospect.date.format()}`
      });
    }
    const data = { company, department, departmentBudget };
    if (prospect.id) {
      const originalBudgetTransaction = await this.db.BudgetTransaction.findOne({
        where: {
          id: prospect.id
        },
        lock: transaction.LOCK.UPDATE,
        transaction
      });
      if (!originalBudgetTransaction) {
        throw new RestError(404, { message: `Budget transaction ${prospect.id} does not exist` });
      }
      data.originalBudgetTransaction = originalBudgetTransaction;
    }
    return data;
  }

  async _handleWriteError(err, transaction, errMessage) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (e) {
        const message = e.message || e;
        this.logger.error(`Could not rollback transaction. Error: ${message}`);
      }
    }
    if (err instanceof RestError) {
      throw err;
    } else {
      const message = err.message || err;
      this.logger.error(`Could not create budget transaction. Error: ${message}`);
      throw new RestError(500, { message: errMessage });
    }
  }
}

module.exports = BudgetTransactionAPI;
