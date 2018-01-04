const moment = require('moment');
const { expect } = require('chai');

const db = require('../../../app/lib/db');
const DepartmentAPI = require('../../../app/api/department/department-api');
const BudgetAPI = require('../../../app/api/budget/budget-api');
const BudgetTransactionAPI = require('../../../app/api/budget-transaction/budget-transaction-api');
const ExpenseAPI = require('../../../app/api/expense/expense-api');
const nullLogger = require('../../../app/lib/log/null-logger');
const config = require('../../../app/lib/config');

const user = {
  id: 1,
  firstName: 'Unit',
  lastName: 'Test',
  email: 'unit@email.com'
};

const createDepartmentAPI = () =>
  new DepartmentAPI({
    user,
    logger: nullLogger,
    config,
    db
  });

const createBudgetAPI = () =>
  new BudgetAPI({
    user,
    logger: nullLogger,
    config,
    db
  });

const createBudgetTransactionAPI = () =>
  new BudgetTransactionAPI({
    user,
    logger: nullLogger,
    config,
    db
  });

const createExpenseAPI = () =>
  new ExpenseAPI({
    user,
    logger: nullLogger,
    config,
    db
  });

const assertDepartment = (c, other) => {
  expect(c.id).to.eql(other.id);
  expect(c.name).to.eql(other.name);
  expect(c.company).to.eql(other.company);
  if (c.parent) {
    expect(c.parent).to.eql(other.parent);
  } else {
    expect(other.parent).to.not.exist;
  }
};

const assertCascade = async (api, query, modelName) => {
  let errorThrown = null;
  try {
    await api.query(query);
  } catch (err) {
    errorThrown = err;
  }
  expect(errorThrown).to.exist;
  expect(errorThrown.code).to.eql(404);
  expect(errorThrown.message).to.eql(`${modelName} does not exist`);
};

describe('DepartmentAPI', () => {
  let allDepartments;
  let allCompanies;
  beforeEach(async () => {
    await db.sequelize.sync();
    await db.User.create(user);
    allCompanies = await db.Company.bulkCreate([
      {
        id: 1,
        name: 'C1'
      },
      {
        id: 2,
        name: 'C2'
      },
      {
        id: 3,
        name: 'C3'
      }
    ]);
    allDepartments = await db.Department.bulkCreate([
      {
        id: 1,
        name: 'D1',
        company: 1
      },
      {
        id: 2,
        name: 'D2',
        company: 1
      },
      {
        id: 3,
        name: 'D3',
        parent: 1,
        company: 1
      },
      {
        id: 4,
        name: 'D4',
        parent: 1,
        company: 1
      },
      {
        id: 5,
        name: 'D100',
        company: 3
      }
    ]);
  });

  afterEach(async () => {
    await db.sequelize.drop();
  });

  it('should throw a 404 if no deparment matches', async () => {
    const departmentAPI = createDepartmentAPI();
    let errorThrown = null;
    try {
      await departmentAPI.query({ id: -1 });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql('Department does not exist');
  });

  it('should return a deparment by id', async () => {
    const departmentAPI = createDepartmentAPI();
    const dbDepartment = await departmentAPI.query({ id: allDepartments[3].id });
    expect(dbDepartment).to.exist;
    assertDepartment(dbDepartment, allDepartments[3]);
  });

  it('should escape "%" character when querying', async () => {
    const departmentAPI = createDepartmentAPI();
    const dbDepartments = await departmentAPI.query({ name: 'D%' });
    expect(dbDepartments).to.exist;
    expect(dbDepartments.length).to.eql(0);
  });

  it('should match name by wild card', async () => {
    const departmentAPI = createDepartmentAPI();
    const dbDepartments = await departmentAPI.query({ name: 'D' });
    expect(dbDepartments).to.exist;
    expect(dbDepartments.length).to.eql(5);
    dbDepartments.forEach((d) => {
      const other = allDepartments.find(o => o.id === d.id);
      expect(other).to.exist;
      assertDepartment(d, other);
    });
  });

  it('should create a department', async () => {
    const departmentAPI = createDepartmentAPI();
    const prospect = {
      name: 'D5',
      company: allCompanies[1].id
    };
    const newDepartment = await departmentAPI.create(prospect);
    expect(newDepartment).to.exist;
    expect(newDepartment.id).to.exist;
    expect(newDepartment.name).to.eql(prospect.name);
    expect(newDepartment.company).to.eql(prospect.company);
    const dbDepartment = await departmentAPI.query({ id: newDepartment.id });
    assertDepartment(dbDepartment, newDepartment);
  });

  it('should fail to edit non existing department', async () => {
    const departmentAPI = createDepartmentAPI();
    let errorThrown;
    const id = -1;
    try {
      await departmentAPI.edit({ id });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`Department ${id} does not exist`);
  });

  it('should edit a department', async () => {
    const departmentAPI = createDepartmentAPI();
    const prospect = {
      id: allDepartments[3].id,
      name: 'D5',
      company: allCompanies[0].id
    };
    const editedDepartment = await departmentAPI.edit(prospect);
    expect(editedDepartment).to.exist;
    expect(editedDepartment.id).to.eql(prospect.id);
    expect(editedDepartment.name).to.eql(prospect.name);
    expect(editedDepartment.company).to.eql(prospect.company);
    const dbDepartment = await departmentAPI.query({ id: editedDepartment.id });
    assertDepartment(dbDepartment, editedDepartment);
  });

  it('should fail to remove non existing department', async () => {
    const departmentAPI = createDepartmentAPI();
    let errorThrown;
    const id = -1;
    try {
      await departmentAPI.remove({ id });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`Department ${id} does not exist`);
  });

  it('should remove a department', async () => {
    const departmentAPI = createDepartmentAPI();
    const removedDepartment = await departmentAPI.remove({ id: allDepartments[0].id });
    expect(removedDepartment).to.exist;
    expect(removedDepartment.id).to.eql(allDepartments[0].id);
    expect(removedDepartment.name).to.eql(allDepartments[0].name);
    let errorThrown = null;
    try {
      await departmentAPI.query({ id: allDepartments[0].id });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql('Department does not exist');
  });

  it('should remove a department and cascade delete on budget, expenses and bugetTransaction', async () => {
    const departmentAPI = createDepartmentAPI();
    const budgetAPI = createBudgetAPI();
    const budgetTransactionAPI = createBudgetTransactionAPI();
    const expenseAPI = createExpenseAPI();
    const department = allDepartments[0].id;
    const newBudget = await budgetAPI.create({
      department,
      start: moment
        .utc()
        .startOf('day')
        .add(-15, 'days'),
      end: moment
        .utc()
        .startOf('day')
        .add(15, 'days')
    });
    expect(newBudget).to.exist;
    expect(newBudget.department).to.exist;
    const budgetTransaction = await budgetTransactionAPI.create({
      department,
      amount: 100,
      status: 'allocated',
      date: moment.utc().startOf('day')
    });
    const expense = await expenseAPI.create({
      department,
      amount: 50,
      concept: 'test concept',
      date: moment.utc().startOf('day')
    });
    const removedDepartment = await departmentAPI.remove({ id: department });
    expect(removedDepartment).to.exist;
    expect(removedDepartment.id).to.eql(allDepartments[0].id);
    expect(removedDepartment.name).to.eql(allDepartments[0].name);
    await assertCascade(expenseAPI, { id: expense.id }, 'Expense');
    await assertCascade(budgetTransactionAPI, { id: budgetTransaction.id }, 'Budget transaction');
    await assertCascade(budgetAPI, { id: newBudget.id }, 'Budget');
  });
});
