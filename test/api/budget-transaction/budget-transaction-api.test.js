const moment = require('moment');
const { expect } = require('chai');

const db = require('../../../app/lib/db');
const BudgetTransactionAPI = require('../../../app/api/budget-transaction/budget-transaction-api');
const nullLogger = require('../../../app/lib/log/null-logger');
const config = require('../../../app/lib/config');

const user = {
  id: 1,
  firstName: 'Unit',
  lastName: 'Test',
  email: 'unit@email.com'
};

const createBudgetTransactionAPI = () =>
  new BudgetTransactionAPI({
    user,
    logger: nullLogger,
    config,
    db
  });

const assertBudgetTransaction = (c, other) => {
  expect(c.id).to.eql(other.id);
  expect(c.user).to.eql(other.user);
  expect(c.department).to.eql(other.department);
  expect(c.amount).to.eql(other.amount);
  expect(c.status).to.eql(other.status);
  expect(c.date).to.eql(other.date);
};

describe('BudgetTransactionAPI', () => {
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

  it('should throw a 404 if no budget transaction matches', async () => {
    const btAPI = createBudgetTransactionAPI();
    let errThrown;
    try {
      await btAPI.query({ id: -1 });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql('Budget transaction does not exist');
  });

  it('should return a budget transaction by id', async () => {
    const btAPI = createBudgetTransactionAPI();
    const newBt = await db.BudgetTransaction.create({
      amount: 1,
      department: department.id,
      user: user.id,
      status: 'allocated',
      date: moment.utc()
    });
    const dbBt = await btAPI.query({ id: newBt.id });
    assertBudgetTransaction(newBt, dbBt);
  });

  it('should return all budget transaction by department', async () => {
    const btAPI = createBudgetTransactionAPI();
    const allBt = await db.BudgetTransaction.bulkCreate([
      {
        amount: 1,
        department: department.id,
        user: user.id,
        status: 'allocated',
        date: moment.utc()
      },
      {
        amount: 2,
        department: department.id,
        user: user.id,
        status: 'allocated',
        date: moment.utc()
      },
      {
        amount: 3,
        department: department.id,
        user: user.id,
        status: 'allocated',
        date: moment.utc()
      }
    ]);
    const dbBt = await btAPI.query({ department: department.id });
    expect(dbBt).to.exist;
    expect(dbBt.length).to.eql(3);
    dbBt.forEach((bt) => {
      const obt = allBt.find(b => b.id === bt.id);
      expect(obt).to.exist;
      assertBudgetTransaction(bt, obt);
    });
  });

  it('should return all budget transaction by department and company', async () => {
    const btAPI = createBudgetTransactionAPI();
    const allBt = await db.BudgetTransaction.bulkCreate([
      {
        amount: 1,
        department: department.id,
        user: user.id,
        status: 'allocated',
        date: moment.utc()
      },
      {
        amount: 2,
        department: department.id,
        user: user.id,
        status: 'allocated',
        date: moment.utc()
      },
      {
        amount: 3,
        department: department.id,
        user: user.id,
        status: 'allocated',
        date: moment.utc()
      }
    ]);
    const dbBt = await btAPI.query({ department: department.id, company: department.company });
    expect(dbBt).to.exist;
    expect(dbBt.length).to.eql(3);
    dbBt.forEach((bt) => {
      const obt = allBt.find(b => b.id === bt.id);
      expect(obt).to.exist;
      assertBudgetTransaction(bt, obt);
    });
  });

  it('should return all budget transaction by department and date range', async () => {
    const btAPI = createBudgetTransactionAPI();
    const now = moment.utc();
    const allBt = await db.BudgetTransaction.bulkCreate([
      {
        amount: 1,
        department: department.id,
        user: user.id,
        status: 'allocated',
        date: now.clone().add(-10, 'minutes')
      },
      {
        amount: 2,
        department: department.id,
        user: user.id,
        status: 'allocated',
        date: now.clone()
      },
      {
        amount: 3,
        department: department.id,
        user: user.id,
        status: 'allocated',
        date: now.clone().add(10, 'minutes')
      }
    ]);
    const dbBt = await btAPI.query({
      department: department.id,
      company: department.company,
      from: now.clone().add(-15, 'minutes'),
      to: now.clone().add(1, 'minutes')
    });
    expect(dbBt).to.exist;
    expect(dbBt.length).to.eql(2);
    dbBt.forEach((bt) => {
      const obt = allBt.find(b => b.id === bt.id);
      expect(obt).to.exist;
      assertBudgetTransaction(bt, obt);
    });
  });

  it('should throw 404 when creating budget transaction with an unexisting department', async () => {
    const btAPI = createBudgetTransactionAPI();
    let errThrown;
    const badId = -1;
    try {
      await btAPI.create({
        department: badId,
        amount: 12,
        status: 'acknowledged',
        date: moment.utc()
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Department ${badId} does not exist`);
  });

  it('should throw 404 when creating budget transaction with an unexisting company', async () => {
    const btAPI = createBudgetTransactionAPI();
    let errThrown;
    const badId = -1;
    try {
      await btAPI.create({
        company: badId,
        department: department.id,
        amount: 12,
        status: 'acknowledged',
        date: moment.utc()
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Company ${badId} does not exist`);
  });

  it('should throw 404 when creating budget transaction when department does not match company', async () => {
    const btAPI = createBudgetTransactionAPI();
    let errThrown;
    const newCompany = await db.Company.create({
      name: 'C2'
    });
    try {
      await btAPI.create({
        company: newCompany.id,
        department: department.id,
        amount: 12,
        status: 'acknowledged',
        date: moment.utc()
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Department ${department.id} does not exist`);
  });

  it('should throw 422 when creating budget transaction with no defined budget', async () => {
    const btAPI = createBudgetTransactionAPI();
    let errThrown;
    const date = moment.utc().add(10, 'days');
    try {
      await btAPI.create({
        company: company.id,
        department: department.id,
        amount: 12,
        status: 'acknowledged',
        date
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(422);
    expect(errThrown.message).to.eql(`Department ${department.id} has no budget for date ${date}`);
  });

  it('should create a budget transaction and update the current (ack) budget', async () => {
    const btAPI = createBudgetTransactionAPI();
    const amount = 0;
    await btAPI.create({
      company: company.id,
      department: department.id,
      amount,
      status: 'acknowledged',
      date: moment.utc()
    });
    const dbBudget = await db.Budget.findById(budget.id);
    expect(dbBudget).to.exist;
    expect(dbBudget.ackAmount).to.eql(amount);
    expect(dbBudget.allocatedAmount).to.eql(0);
    expect(dbBudget.expenses).to.eql(0);
  });

  it('should create a budget transaction and update the current (alloc) budget', async () => {
    const btAPI = createBudgetTransactionAPI();
    const amount = 0;
    await btAPI.create({
      company: company.id,
      department: department.id,
      amount,
      status: 'allocated',
      date: moment.utc()
    });
    const dbBudget = await db.Budget.findById(budget.id);
    expect(dbBudget).to.exist;
    expect(dbBudget.ackAmount).to.eql(0);
    expect(dbBudget.allocatedAmount).to.eql(amount);
    expect(dbBudget.expenses).to.eql(0);
  });

  it('should throw 404 when editing budget transaction with an unexisting department', async () => {
    const btAPI = createBudgetTransactionAPI();
    let errThrown;
    const badId = -1;
    const newBt = await db.BudgetTransaction.create({
      amount: 1,
      department: department.id,
      user: user.id,
      status: 'allocated',
      date: moment.utc()
    });
    try {
      await btAPI.edit({
        id: newBt.id,
        department: badId,
        amount: 12,
        status: 'acknowledged',
        date: moment.utc()
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Department ${badId} does not exist`);
  });

  it('should throw 404 when editing budget transaction with an unexisting company', async () => {
    const btAPI = createBudgetTransactionAPI();
    let errThrown;
    const badId = -1;
    const newBt = await db.BudgetTransaction.create({
      amount: 1,
      department: department.id,
      user: user.id,
      status: 'allocated',
      date: moment.utc()
    });
    try {
      await btAPI.edit({
        id: newBt.id,
        company: badId,
        department: department.id,
        amount: 12,
        status: 'acknowledged',
        date: moment.utc()
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Company ${badId} does not exist`);
  });

  it('should throw 404 when editing budget transaction with an unexisting company', async () => {
    const btAPI = createBudgetTransactionAPI();
    let errThrown;
    const newCompany = await db.Company.create({
      name: 'C2'
    });
    const newBt = await db.BudgetTransaction.create({
      amount: 1,
      department: department.id,
      user: user.id,
      status: 'allocated',
      date: moment.utc()
    });
    try {
      await btAPI.edit({
        id: newBt.id,
        company: newCompany.id,
        department: department.id,
        amount: 12,
        status: 'acknowledged',
        date: moment.utc()
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Department ${department.id} does not exist`);
  });

  it('should throw 404 when editing budget transaction with an unexisting budget transaction', async () => {
    const btAPI = createBudgetTransactionAPI();
    let errThrown;
    const badId = -1;
    try {
      await btAPI.edit({
        id: badId,
        department: department.id,
        amount: 12,
        status: 'acknowledged',
        date: moment.utc()
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Budget transaction ${badId} does not exist`);
  });

  it('should throw 422 when editing budget transaction with no defined budget', async () => {
    const btAPI = createBudgetTransactionAPI();
    let errThrown;
    const futureDate = moment.utc().add(5, 'days');
    const newBt = await db.BudgetTransaction.create({
      amount: 1,
      department: department.id,
      user: user.id,
      status: 'allocated',
      date: moment.utc()
    });
    try {
      await btAPI.edit({
        id: newBt.id,
        department: department.id,
        amount: 12,
        status: 'acknowledged',
        date: futureDate
      });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(422);
    expect(errThrown.message).to.eql(`Department ${department.id} has no budget for date ${futureDate}`);
  });

  it('should edit a budget transaction and update the current budget', async () => {
    const btAPI = createBudgetTransactionAPI();
    const futureDate = moment.utc().add(5, 'minutes');
    const newBt = await btAPI.create({
      department: department.id,
      amount: 1,
      status: 'allocated',
      date: moment.utc()
    });
    let b = await db.Budget.findById(budget.id);
    expect(b.department).to.eql(department.id);
    expect(b.ackAmount).to.eql(0);
    expect(b.expenses).to.eql(0);
    expect(b.allocatedAmount).to.eql(1);
    const editedBT = await btAPI.edit({
      id: newBt.id,
      department: department.id,
      amount: 12,
      status: 'acknowledged',
      date: futureDate
    });
    expect(editedBT).to.exist;
    expect(editedBT.id).to.eql(newBt.id);
    expect(editedBT.amount).to.eql(12);
    expect(editedBT.status).to.eql('acknowledged');
    expect(editedBT.date).to.eql(futureDate.toDate());
    const dbBt = await btAPI.query({ id: newBt.id });
    assertBudgetTransaction(editedBT, dbBt);
    b = await db.Budget.findById(budget.id);
    expect(b.department).to.eql(department.id);
    expect(b.ackAmount).to.eql(12);
    expect(b.expenses).to.eql(0);
    expect(b.allocatedAmount).to.eql(0);
  });

  it('should throw 404 when removing budget transaction with an unexisting department', async () => {
    let errThrown;
    const btAPI = createBudgetTransactionAPI();
    const badId = -1;
    const newBt = await btAPI.create({
      department: department.id,
      amount: 1,
      status: 'allocated',
      date: moment.utc()
    });
    try {
      await btAPI.remove({ id: newBt.id, department: badId });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Department ${badId} does not exist`);
  });

  it('should throw 404 when removing budget transaction with an unexisting company', async () => {
    let errThrown;
    const btAPI = createBudgetTransactionAPI();
    const badId = -1;
    const newBt = await btAPI.create({
      department: department.id,
      amount: 1,
      status: 'allocated',
      date: moment.utc()
    });
    try {
      await btAPI.remove({ id: newBt.id, department: department.id, company: badId });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Company ${badId} does not exist`);
  });

  it('should throw 404 when removing budget transaction with not matching department and company', async () => {
    let errThrown;
    const btAPI = createBudgetTransactionAPI();
    const newCompany = await db.Company.create({
      name: 'C2'
    });
    const newBt = await btAPI.create({
      department: department.id,
      amount: 1,
      status: 'allocated',
      date: moment.utc()
    });
    try {
      await btAPI.remove({ id: newBt.id, department: department.id, company: newCompany.id });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql(`Department ${department.id} does not exist`);
  });

  it('should throw 404 when removing budget transaction with an unexisting budget transaction', async () => {
    let errThrown;
    const btAPI = createBudgetTransactionAPI();
    const badId = -1;
    try {
      await btAPI.remove({ id: badId, department: department.id });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql('Budget transaction does not exist');
  });

  it('should remove a budget transaction and update the current budget', async () => {
    let errThrown;
    const btAPI = createBudgetTransactionAPI();
    const newBt = await btAPI.create({
      department: department.id,
      amount: 1,
      status: 'allocated',
      date: moment.utc()
    });
    let dbBudget = await db.Budget.findById(budget.id);
    expect(dbBudget).to.exist;
    expect(dbBudget.ackAmount).to.eql(0);
    expect(dbBudget.allocatedAmount).to.eql(1);
    expect(dbBudget.expenses).to.eql(0);
    await btAPI.remove({ id: newBt.id, department: department.id });
    dbBudget = await db.Budget.findById(budget.id);
    expect(dbBudget).to.exist;
    expect(dbBudget.ackAmount).to.eql(0);
    expect(dbBudget.allocatedAmount).to.eql(0);
    expect(dbBudget.expenses).to.eql(0);
    try {
      await btAPI.query({ id: newBt.id });
    } catch (err) {
      errThrown = err;
    }
    expect(errThrown).to.exist;
    expect(errThrown.code).to.eql(404);
    expect(errThrown.message).to.eql('Budget transaction does not exist');
  });
});
