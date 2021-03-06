const RestError = require('../error');

const validateCompanyDepartment = async function (db, prospect) {
  let company;
  let department;
  if (prospect.company) {
    company = await db.Company.findById(prospect.company);
    if (!company) {
      throw new RestError(404, { message: `Company ${prospect.company} does not exist` });
    }
  }
  if (prospect.department) {
    department = await db.Department.findById(prospect.department);
    if (!department || (company && department.company !== company.id)) {
      throw new RestError(404, { message: `Department ${prospect.department} does not exist` });
    }
  }
  return { company, department };
};

const validateBudgetDependencies = async function (db, prospect) {
  const { company, department } = await validateCompanyDepartment(db, prospect);
  const departmentBudget = await db.Budget.findOne({
    where: {
      department: prospect.department,
      start: {
        $lte: prospect.date
      },
      end: {
        $gte: prospect.date
      }
    }
  });
  if (!departmentBudget) {
    throw new RestError(422, {
      message: `Department ${prospect.department} has no budget for date ${prospect.date}`
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
  validateBudgetDependencies,
  validateCompanyDepartment
};
