const RestError = require('../error');

const validateBudgetDependencies = async function (db, prospect, transaction) {
  let company;
  if (prospect.companyId) {
    company = await db.Company.findById(prospect.companyId);
    if (!company) {
      throw new RestError(404, { message: `Company ${prospect.companyId} does not exist` });
    }
  }
  const department = await db.Department.findById(prospect.departmentId);
  if (!department) {
    throw new RestError(404, { message: `Department ${prospect.departmentId} does not exist` });
  }
  const departmentBudget = await db.Expense.findOne({
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
  return {
    company,
    department,
    departmentBudget
  };
};

const handleTransactionError = async function (err, transaction, errMessage, logger) {
  if (transaction) {
    try {
      await transaction.rollback();
    } catch (e) {
      const message = e.message || e;
      logger.error(`Could not rollback transaction. Error: ${message}`);
    }
  }
  if (err instanceof RestError) {
    throw err;
  } else {
    const message = err.message || err;
    logger.error(`Could not create budget entity. Error: ${message}`);
    throw new RestError(500, { message: errMessage });
  }
};

module.exports = {
  handleTransactionError,
  validateBudgetDependencies
};
