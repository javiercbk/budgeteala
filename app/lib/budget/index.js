const RestError = require('../error');

const validateBudgetDependencies = async function (db, prospect) {
  let company;
  if (prospect.company) {
    company = await db.Company.findById(prospect.company);
    if (!company) {
      throw new RestError(404, { message: `Company ${prospect.company} does not exist` });
    }
  }
  const department = await db.Department.findById(prospect.department);
  if (!department) {
    throw new RestError(404, { message: `Department ${prospect.department} does not exist` });
  }
  const departmentBudget = await db.Budget.findOne({
    where: {
      department: prospect.department,
      start: {
        $gte: prospect.date
      },
      end: {
        $lte: prospect.date
      }
    }
  });
  if (!departmentBudget) {
    throw new RestError(422, {
      message: `Department ${prospect.department} has no budget for date ${prospect.date.format()}`
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
