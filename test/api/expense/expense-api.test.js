const moment = require('moment');
const { expect } = require('chai');

const db = require('../../../app/lib/db');
const ExpenseTransactionAPI = require('../../../app/api/expense/expense-api');
const nullLogger = require('../../../app/lib/log/null-logger');
const config = require('../../../app/lib/config');

const user = {
  id: 1,
  firstName: 'Unit',
  lastName: 'Test',
  email: 'unit@email.com'
};

const createExpenseAPI = () =>
  new ExpenseTransactionAPI({
    user,
    logger: nullLogger,
    config,
    db
  });

const assertExpense = (c, other) => {
  expect(c.id).to.eql(other.id);
  expect(c.amount).to.eql(other.amount);
  if (c.concept) {
    expect(c.concept).to.eql(other.concept);
  } else {
    expect(other.concept).to.not.exist;
  }
  expect(c.date).to.eql(other.date);
  expect(c.department).to.eql(other.department);
  expect(c.user).to.eql(other.user);
};

describe('ExpenseTransactionAPI', () => {
  let company;
  let department;
  let budget;
  beforeEach(async () => {
    await db.sequelize.sync();
    await db.User.create(user);
    company = await db.Company.create({
      name: 'C1'
    });
    department = await db.Department.create({
      id: 1,
      name: 'D1',
      company: company.id
    });
    budget = await db.Budget.create({
      department: department.id,
      ackAmount: 0,
      allocatedAmount: 0,
      expenses: 0,
      start: moment.utc().add(-1, 'days'),
      end: moment.utc().add(1, 'days')
    });
  });

  afterEach(async () => {
    await db.sequelize.drop();
  });

  it('should throw a 404 if no expense matches', async () => {
    let errThrown;
    const expenseAPI = createExpenseAPI();
    try {
      await expenseAPI.query({ id: -1 });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql('Expense does not exist');
  });

  it('should throw a 404 if department does not exist', async () => {
    let errThrown;
    const expenseAPI = createExpenseAPI();
    const badId = -1;
    try {
      await expenseAPI.query({ department: badId });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Department ${badId} does not exist`);
  });

  it('should throw a 404 if company does not exist', async () => {
    let errThrown;
    const expenseAPI = createExpenseAPI();
    const badId = -1;
    try {
      await expenseAPI.query({ department: department.id, company: badId });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Company ${badId} does not exist`);
  });

  it('should throw a 404 if department does not belong to the company', async () => {
    let errThrown;
    const expenseAPI = createExpenseAPI();
    const newCompany = await db.Company.create({
      name: 'C2'
    });
    try {
      await expenseAPI.query({ department: department.id, company: newCompany.id });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Department ${department.id} does not exist`);
  });

  it('should return a expense by id', async () => {
    const expenseAPI = createExpenseAPI();
    const newExpense = await db.Expense.create({
      department: department.id,
      user: user.id,
      amount: 10,
      date: moment.utc()
    });
    const dbExpense = await expenseAPI.query({
      id: newExpense.id
    });
    assertExpense(dbExpense, newExpense);
  });

  it('should return all expenses by department', async () => {
    const expenseAPI = createExpenseAPI();
    const newExpenses = await db.Expense.bulkCreate([
      {
        department: department.id,
        user: user.id,
        amount: 10,
        date: moment.utc()
      },
      {
        department: department.id,
        user: user.id,
        amount: 5,
        date: moment.utc().add(5, 'minutes')
      },
      {
        department: department.id,
        user: user.id,
        amount: 20,
        date: moment.utc().add(10, 'minutes')
      }
    ]);
    const dbExpenses = await expenseAPI.query({
      department: department.id
    });
    expect(dbExpenses).to.exist;
    expect(dbExpenses.length).to.eql(3);
    dbExpenses.forEach((dbExpense) => {
      const expense = newExpenses.find(e => e.id === dbExpense.id);
      expect(expense).to.exist;
      assertExpense(dbExpense, expense);
    });
  });

  it('should return all expenses by department and company', async () => {
    const expenseAPI = createExpenseAPI();
    const newExpenses = await db.Expense.bulkCreate([
      {
        department: department.id,
        user: user.id,
        amount: 10,
        date: moment.utc()
      },
      {
        department: department.id,
        user: user.id,
        amount: 5,
        date: moment.utc().add(5, 'minutes')
      },
      {
        department: department.id,
        user: user.id,
        amount: 20,
        date: moment.utc().add(10, 'minutes')
      }
    ]);
    const dbExpenses = await expenseAPI.query({
      department: department.id,
      company: company.id
    });
    expect(dbExpenses).to.exist;
    expect(dbExpenses.length).to.eql(3);
    dbExpenses.forEach((dbExpense) => {
      const expense = newExpenses.find(e => e.id === dbExpense.id);
      expect(expense).to.exist;
      assertExpense(dbExpense, expense);
    });
  });

  it('should return all expenses by department and date range', async () => {
    const expenseAPI = createExpenseAPI();
    const now = moment.utc();
    const newExpenses = await db.Expense.bulkCreate([
      {
        department: department.id,
        user: user.id,
        amount: 10,
        date: now
      },
      {
        department: department.id,
        user: user.id,
        amount: 5,
        date: now.clone().add(5, 'minutes')
      },
      {
        department: department.id,
        user: user.id,
        amount: 20,
        date: now.clone().add(10, 'minutes')
      }
    ]);
    const dbExpenses = await expenseAPI.query({
      department: department.id,
      from: now.clone().add(-1, 'minutes'),
      to: now.clone().add(8, 'minutes')
    });
    expect(dbExpenses).to.exist;
    expect(dbExpenses.length).to.eql(2);
    dbExpenses.forEach((dbExpense) => {
      const expense = newExpenses.find(e => e.id === dbExpense.id);
      expect(expense).to.exist;
      assertExpense(dbExpense, expense);
    });
  });

  it('should throw 404 when creating expense with an inexisting department', async () => {
    let errThrown;
    const date = moment.utc();
    const expenseAPI = createExpenseAPI();
    const badId = -1;
    try {
      await expenseAPI.create({
        amount: 10,
        date,
        concept: 'test',
        department: badId
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Department ${badId} does not exist`);
  });

  it('should throw 404 when creating expense with an inexisting company', async () => {
    let errThrown;
    const date = moment.utc();
    const expenseAPI = createExpenseAPI();
    const badId = -1;
    try {
      await expenseAPI.create({
        amount: 10,
        date,
        concept: 'test',
        department: department.id,
        company: badId
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Company ${badId} does not exist`);
  });

  it('should throw 404 when creating expense with a departmend that does not belong to the company', async () => {
    let errThrown;
    const date = moment.utc();
    const expenseAPI = createExpenseAPI();
    const newCompany = await db.Company.create({
      name: 'C2'
    });
    try {
      await expenseAPI.create({
        amount: 10,
        date,
        concept: 'test',
        department: department.id,
        company: newCompany.id
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Department ${department.id} does not exist`);
  });

  it('should throw 422 when creating expense with no defined expense', async () => {
    let errThrown;
    const date = moment.utc().add(10, 'days');
    const expenseAPI = createExpenseAPI();
    try {
      await expenseAPI.create({
        amount: 10,
        date,
        concept: 'test',
        department: department.id
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(422);
    expect(errThrown.message).to.eql(`Department ${department.id} has no budget for date ${date}`);
  });

  it('should create a expense and update the current expense', async () => {
    const expenseAPI = createExpenseAPI();
    const date = moment.utc();
    const amount = 10.5;
    const newExpense = await expenseAPI.create({
      amount,
      date,
      concept: 'test',
      department: department.id
    });
    const dbExpense = await expenseAPI.query({ id: newExpense.id });
    expect(dbExpense).to.exist;
    assertExpense(newExpense, dbExpense);
    const dbBudget = await db.Budget.findById(budget.id);
    expect(dbBudget).to.exist;
    expect(dbBudget.expenses).to.eql(amount);
  });

  it('should throw 404 when editing an inexisting expense', async () => {
    let errThrown;
    const badId = -1;
    const date = moment.utc();
    const expenseAPI = createExpenseAPI();
    await db.Expense.create({
      user: user.id,
      department: department.id,
      amount: 20.7,
      date
    });
    try {
      await expenseAPI.edit({
        id: badId,
        department: department.id,
        date
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Expense ${badId} does not exist`);
  });

  it('should throw 404 when editing expense with an inexisting department', async () => {
    let errThrown;
    const badId = -1;
    const date = moment.utc();
    const expenseAPI = createExpenseAPI();
    const existingExpense = await db.Expense.create({
      user: user.id,
      department: department.id,
      amount: 20.7,
      date
    });
    try {
      await expenseAPI.edit({
        id: existingExpense.id,
        department: badId
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Department ${badId} does not exist`);
  });

  it('should throw 404 when editing expense with an inexisting company', async () => {
    let errThrown;
    const badId = -1;
    const date = moment.utc();
    const expenseAPI = createExpenseAPI();
    const existingExpense = await db.Expense.create({
      user: user.id,
      department: department.id,
      amount: 20.7,
      date
    });
    try {
      await expenseAPI.edit({
        id: existingExpense.id,
        department: department.id,
        company: badId
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Company ${badId} does not exist`);
  });

  it('should throw 404 when editing expense with a department that does not belong to the company', async () => {
    let errThrown;
    const date = moment.utc();
    const expenseAPI = createExpenseAPI();
    const newCompany = await db.Company.create({
      name: 'C2'
    });
    const existingExpense = await db.Expense.create({
      user: user.id,
      department: department.id,
      amount: 20.7,
      date
    });
    try {
      await expenseAPI.edit({
        id: existingExpense.id,
        department: department.id,
        company: newCompany.id
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Department ${department.id} does not exist`);
  });

  it('should throw 422 when editing expense with no defined expense', async () => {
    let errThrown;
    const now = moment.utc();
    const date = now.clone().add(10, 'days');
    const expenseAPI = createExpenseAPI();
    const existingExpense = await db.Expense.create({
      user: user.id,
      department: department.id,
      amount: 20.7,
      date: now
    });
    try {
      await expenseAPI.edit({
        id: existingExpense.id,
        department: department.id,
        amount: 17.4,
        concept: 'new concept',
        date
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(422);
    expect(errThrown.message).to.eql(`Department ${department.id} has no budget for date ${date}`);
  });

  it('should edit a expense and update the current expense', async () => {
    const now = moment.utc();
    const expenseAPI = createExpenseAPI();
    const amount = 18.3;
    const newExpenseAmount = 17.4;
    const existingExpense = await expenseAPI.create({
      department: department.id,
      amount,
      date: now
    });
    let dbBudget = await db.Budget.findById(budget.id);
    expect(dbBudget).to.exist;
    expect(dbBudget.expenses).to.eql(amount);
    const editedExpense = await expenseAPI.edit({
      id: existingExpense.id,
      department: department.id,
      amount: newExpenseAmount,
      concept: 'new concept',
      date: now.clone().add(5, 'minutes')
    });
    const dbExpense = await expenseAPI.query({ id: editedExpense.id });
    expect(dbExpense).to.exist;
    assertExpense(editedExpense, dbExpense);
    dbBudget = await db.Budget.findById(budget.id);
    expect(dbBudget).to.exist;
    expect(dbBudget.expenses).to.eql(newExpenseAmount);
  });

  it('should throw 404 when removing expense with an inexisting expense', async () => {
    let errThrown;
    const expenseAPI = createExpenseAPI();
    try {
      await expenseAPI.remove({ id: -1 });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql('Expense does not exist');
  });

  it('should throw 404 when removing expense with an inexisting department', async () => {
    let errThrown;
    const expenseAPI = createExpenseAPI();
    const now = moment.utc();
    const amount = 18.3;
    const existingExpense = await expenseAPI.create({
      department: department.id,
      amount,
      date: now
    });
    const badId = -1;
    try {
      await expenseAPI.remove({ id: existingExpense.id, department: badId });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Department ${badId} does not exist`);
  });

  it('should throw 404 when removing expense with an inexisting company', async () => {
    let errThrown;
    const expenseAPI = createExpenseAPI();
    const now = moment.utc();
    const amount = 18.3;
    const existingExpense = await expenseAPI.create({
      department: department.id,
      amount,
      date: now
    });
    const badId = -1;
    try {
      await expenseAPI.remove({
        id: existingExpense.id,
        department: department.id,
        company: badId
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Company ${badId} does not exist`);
  });

  it('should throw 404 when removing expense if department does not belong to company', async () => {
    let errThrown;
    const expenseAPI = createExpenseAPI();
    const now = moment.utc();
    const amount = 18.3;
    const existingExpense = await expenseAPI.create({
      department: department.id,
      amount,
      date: now
    });
    const newCompany = await db.Company.create({
      name: 'C2'
    });
    try {
      await expenseAPI.remove({
        id: existingExpense.id,
        department: department.id,
        company: newCompany.id
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Department ${department.id} does not exist`);
  });

  it('should remove a expense and update the current budget', async () => {
    let errThrown;
    const expenseAPI = createExpenseAPI();
    const now = moment.utc();
    const amount = 18.3;
    const existingExpense = await expenseAPI.create({
      department: department.id,
      amount,
      date: now
    });
    const deletedExpense = await expenseAPI.remove({
      id: existingExpense.id,
      department: department.id
    });
    try {
      await expenseAPI.query({ id: deletedExpense.id });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql('Expense does not exist');
    const dbBudget = await db.Budget.findById(budget.id);
    expect(dbBudget).to.exist;
    expect(dbBudget.expenses).to.eql(0);
  });
});
