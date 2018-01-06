const { expect } = require('chai');
const moment = require('moment');

const db = require('../../../app/lib/db');
const BudgetAPI = require('../../../app/api/budget/budget-api');
const nullLogger = require('../../../app/lib/log/null-logger');
const config = require('../../../app/lib/config');

const user = {
  id: 1,
  firstName: 'Unit',
  lastName: 'Test',
  email: 'unit@email.com'
};

const createBudgetAPI = () =>
  new BudgetAPI({
    user,
    logger: nullLogger,
    config,
    db
  });

const assertBudget = (c, other) => {
  expect(c.id).to.eql(other.id);
  expect(c.ackAmount).to.eql(other.ackAmount);
  expect(c.allocatedAmount).to.eql(other.allocatedAmount);
  expect(c.expenses).to.eql(other.expenses);
  expect(c.start).to.eql(other.start);
  expect(c.end).to.eql(other.end);
};

describe('BudgetAPI', () => {
  let allDepartments;
  let allBudgets;
  let allCompanies;
  beforeEach(async () => {
    await db.sequelize.sync();
    allCompanies = await db.Company.bulkCreate([
      {
        name: 'C1'
      },
      {
        name: 'C2'
      }
    ]);
    allDepartments = await db.Department.bulkCreate([
      {
        id: 1,
        name: 'D1',
        company: allCompanies[0].id
      },
      {
        id: 2,
        name: 'D2',
        company: allCompanies[0].id
      }
    ]);
    allBudgets = await db.Budget.bulkCreate([
      {
        id: 1,
        department: allDepartments[0].id,
        ackAmount: 0,
        allocatedAmount: 0,
        expenses: 0,
        start: moment.utc().add(-1, 'days'),
        end: moment.utc().add(1, 'days')
      }
    ]);
  });

  afterEach(async () => {
    await db.sequelize.drop();
  });

  it('should throw a 404 if no budget matches', async () => {
    const budgetAPI = createBudgetAPI();
    let errorThrown = null;
    try {
      await budgetAPI.query({ id: -1 });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql('Budget does not exist');
  });

  it('should return a budget by id', async () => {
    const budgetAPI = createBudgetAPI();
    const dbBudget = await budgetAPI.query({ id: allBudgets[0].id });
    expect(dbBudget).to.exist;
    assertBudget(dbBudget, allBudgets[0]);
  });

  it('should match budget by department and company', async () => {
    const budgetAPI = createBudgetAPI();
    const dbBudget = await budgetAPI.query({
      department: allDepartments[0].id,
      company: allDepartments[0].company
    });
    expect(dbBudget).to.exist;
    expect(dbBudget.length).to.eql(1);
    dbBudget.forEach((c) => {
      const other = allBudgets.find(o => o.id === c.id);
      expect(other).to.exist;
      assertBudget(c, other);
    });
  });

  it('should match budget by department', async () => {
    const budgetAPI = createBudgetAPI();
    const dbBudget = await budgetAPI.query({
      department: allDepartments[0].id
    });
    expect(dbBudget).to.exist;
    expect(dbBudget.length).to.eql(1);
    dbBudget.forEach((c) => {
      const other = allBudgets.find(o => o.id === c.id);
      expect(other).to.exist;
      assertBudget(c, other);
    });
  });

  it('should match budget by date', async () => {
    const budgetAPI = createBudgetAPI();
    const dbBudget = await budgetAPI.query({
      department: allDepartments[0].id,
      fromStart: moment.utc().add(-2, 'days'),
      toStart: moment.utc(),
      fromEnd: moment.utc(),
      toEnd: moment.utc().add(2, 'days')
    });
    expect(dbBudget).to.exist;
    expect(dbBudget.length).to.eql(1);
    dbBudget.forEach((c) => {
      const other = allBudgets.find(o => o.id === c.id);
      expect(other).to.exist;
      assertBudget(c, other);
    });
  });

  it('should create a budget', async () => {
    const budgetAPI = createBudgetAPI();
    const start = moment.utc().add(2, 'days');
    const end = moment.utc().add(4, 'days');
    const dep = allDepartments[1];
    const newBudget = await budgetAPI.create({
      company: dep.company,
      department: dep.id,
      start,
      end
    });
    expect(newBudget).to.exist;
    expect(newBudget.id).to.exist;
    expect(newBudget.department).to.eql(dep.id);
    const dbBudget = await budgetAPI.query({ id: newBudget.id });
    assertBudget(dbBudget, newBudget);
  });

  it('should fail to create a budget with that overlaps (start) with an existing budget', async () => {
    const budgetAPI = createBudgetAPI();
    const start = moment.utc().add(-2, 'days');
    const end = moment.utc().add(1, 'days');
    const dep = allDepartments.find(d => d.id === allBudgets[0].department);
    let errorThrown;
    try {
      await budgetAPI.create({
        company: dep.company,
        department: dep.id,
        start,
        end
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(422);
    expect(errorThrown.message).to.eql(`Budget overlaps with another existing budget ${allBudgets[0].id}`);
  });

  it('should fail to create a budget with that overlaps (end) with an existing budget', async () => {
    const budgetAPI = createBudgetAPI();
    const start = moment.utc().add(-4, 'days');
    const end = moment.utc();
    const dep = allDepartments.find(d => d.id === allBudgets[0].department);
    let errorThrown;
    try {
      await budgetAPI.create({
        company: dep.company,
        department: dep.id,
        start,
        end
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(422);
    expect(errorThrown.message).to.eql(`Budget overlaps with another existing budget ${allBudgets[0].id}`);
  });

  it('should fail to create a budget with that overlaps (whole) with an existing budget', async () => {
    const budgetAPI = createBudgetAPI();
    const start = moment.utc().add(-4, 'days');
    const end = moment.utc().add(5, 'days');
    const dep = allDepartments.find(d => d.id === allBudgets[0].department);
    let errorThrown;
    try {
      await budgetAPI.create({
        company: dep.company,
        department: dep.id,
        start,
        end
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(422);
    expect(errorThrown.message).to.eql(`Budget overlaps with another existing budget ${allBudgets[0].id}`);
  });

  it('should fail to create a budget if company does not exist', async () => {
    const budgetAPI = createBudgetAPI();
    const start = moment.utc().add(4, 'days');
    const end = moment.utc().add(5, 'days');
    const dep = allDepartments[0];
    const companyId = -1;
    let errorThrown;
    try {
      await budgetAPI.create({
        company: companyId,
        department: dep.id,
        start,
        end
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`Company ${companyId} does not exist`);
  });

  it('should fail to create a budget if department does not exist', async () => {
    const budgetAPI = createBudgetAPI();
    const start = moment.utc().add(4, 'days');
    const end = moment.utc().add(5, 'days');
    const dep = allDepartments[0];
    const departmentId = -1;
    let errorThrown;
    try {
      await budgetAPI.create({
        company: dep.company,
        department: departmentId,
        start,
        end
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`Department ${departmentId} does not exist`);
  });

  it('should fail to create a budget if given department does not belong to the given company', async () => {
    const budgetAPI = createBudgetAPI();
    const start = moment.utc().add(10, 'days');
    const end = moment.utc().add(20, 'days');
    const dep = allDepartments[0];
    let errorThrown;
    try {
      await budgetAPI.create({
        company: allCompanies[1].id,
        department: dep.id,
        start,
        end
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`Department ${dep.id} does not exist`);
  });

  it('should fail to edit non existing budget', async () => {
    const budgetAPI = createBudgetAPI();
    const start = moment.utc().add(10, 'days');
    const end = moment.utc().add(20, 'days');
    const dep = allDepartments[0];
    const budgetId = -1;
    let errorThrown;
    try {
      await budgetAPI.edit({
        id: budgetId,
        company: dep.company,
        department: dep.id,
        start,
        end
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`Budget ${budgetId} does not exist`);
  });

  it('should fail to edit a budget if the company does not exist', async () => {
    const budgetAPI = createBudgetAPI();
    const start = moment.utc().add(10, 'days');
    const end = moment.utc().add(20, 'days');
    const dep = allDepartments[0];
    const budget = allBudgets[0];
    const badId = -1;
    let errorThrown;
    try {
      await budgetAPI.edit({
        id: budget.id,
        company: badId,
        department: dep.id,
        start,
        end
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`Company ${badId} does not exist`);
  });

  it('should fail to edit a budget if the department does not exist', async () => {
    const budgetAPI = createBudgetAPI();
    const start = moment.utc().add(10, 'days');
    const end = moment.utc().add(20, 'days');
    const budget = allBudgets[0];
    const dep = allDepartments[0];
    const badId = -1;
    let errorThrown;
    try {
      await budgetAPI.edit({
        id: budget.id,
        company: dep.company,
        department: badId,
        start,
        end
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`Department ${badId} does not exist`);
  });

  it('should fail to edit a budget if the department does not belong to the given company', async () => {
    const budgetAPI = createBudgetAPI();
    const start = moment.utc().add(10, 'days');
    const end = moment.utc().add(20, 'days');
    const dep = allDepartments[0];
    const budget = allBudgets[0];
    let errorThrown;
    try {
      await budgetAPI.edit({
        id: budget.id,
        company: allCompanies[1].id,
        department: dep.id,
        start,
        end
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`Department ${dep.id} does not exist`);
  });

  it('should fail to edit a budget if it overlaps (start) with another budget date', async () => {
    const budgetAPI = createBudgetAPI();
    const start = moment.utc().add(10, 'days');
    const end = moment.utc().add(20, 'days');
    const dep = allDepartments[0];
    const newBudget = await budgetAPI.create({
      company: dep.company,
      department: dep.id,
      start,
      end
    });
    const budget = allBudgets[0];
    const otherStart = moment.utc().add(5, 'days');
    const otherEnd = moment.utc().add(15, 'days');
    let errorThrown;
    try {
      await budgetAPI.edit({
        id: budget.id,
        company: dep.company,
        department: newBudget.department,
        start: otherStart,
        end: otherEnd
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(422);
    expect(errorThrown.message).to.eql(`Budget overlaps with another existing budget ${newBudget.id}`);
  });

  it('should fail to edit a budget if it overlaps (end) with another budget date', async () => {
    const budgetAPI = createBudgetAPI();
    const start = moment.utc().add(10, 'days');
    const end = moment.utc().add(20, 'days');
    const dep = allDepartments[0];
    const newBudget = await budgetAPI.create({
      company: dep.company,
      department: dep.id,
      start,
      end
    });
    const budget = allBudgets[0];
    const otherStart = moment.utc().add(10, 'days');
    const otherEnd = moment.utc().add(30, 'days');
    let errorThrown;
    try {
      await budgetAPI.edit({
        id: budget.id,
        company: dep.company,
        department: newBudget.department,
        start: otherStart,
        end: otherEnd
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(422);
    expect(errorThrown.message).to.eql(`Budget overlaps with another existing budget ${newBudget.id}`);
  });

  it('should fail to edit a budget if it overlaps (whole) with another budget date', async () => {
    const budgetAPI = createBudgetAPI();
    const start = moment.utc().add(10, 'days');
    const end = moment.utc().add(20, 'days');
    const dep = allDepartments[0];
    const newBudget = await budgetAPI.create({
      company: dep.company,
      department: dep.id,
      start,
      end
    });
    const budget = allBudgets[0];
    const otherStart = moment.utc().add(15, 'days');
    const otherEnd = moment.utc().add(17, 'days');
    let errorThrown;
    try {
      await budgetAPI.edit({
        id: budget.id,
        company: dep.company,
        department: newBudget.department,
        start: otherStart,
        end: otherEnd
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(422);
    expect(errorThrown.message).to.eql(`Budget overlaps with another existing budget ${newBudget.id}`);
  });

  it('should edit a budget', async () => {
    const budgetAPI = createBudgetAPI();
    const start = moment.utc().add(10, 'days');
    const end = moment.utc().add(20, 'days');
    const dep = allDepartments[0];
    const budget = allBudgets[0];
    const editedBudget = await budgetAPI.edit({
      id: budget.id,
      company: dep.company,
      department: budget.department,
      start,
      end
    });
    expect(editedBudget).to.exist;
    expect(editedBudget.id).to.eql(budget.id);
    expect(editedBudget.department).to.eql(budget.department);
    expect(editedBudget.start).to.eql(start.toDate());
    expect(editedBudget.end).to.eql(end.toDate());
    const dbBudget = await budgetAPI.query({
      id: budget.id
    });
    assertBudget(dbBudget, editedBudget);
  });

  it('should fail to remove non existing budget (wrong department)', async () => {
    const budgetAPI = createBudgetAPI();
    let errorThrown;
    const badId = -1;
    try {
      await budgetAPI.remove({
        id: allBudgets[0].id,
        department: badId
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`Department ${badId} does not exist`);
  });

  it('should fail to remove non existing budget (wrong id)', async () => {
    const budgetAPI = createBudgetAPI();
    let errorThrown;
    const badId = -1;
    try {
      await budgetAPI.remove({
        id: badId,
        department: allBudgets[0].department
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`Budget ${badId} does not exist`);
  });

  it('should remove a budget', async () => {
    const budgetAPI = createBudgetAPI();
    const removedBudget = await budgetAPI.remove({
      id: allBudgets[0].id,
      department: allBudgets[0].department
    });
    expect(removedBudget).to.exist;
    expect(removedBudget.id).to.eql(allBudgets[0].id);
    let errorThrown = null;
    try {
      await budgetAPI.query({
        id: allBudgets[0].id,
        department: allBudgets[0].department
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql('Budget does not exist');
  });
});
