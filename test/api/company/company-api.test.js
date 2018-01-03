const { expect } = require('chai');

const db = require('../../../app/lib/db');
const CompanyAPI = require('../../../app/api/company/company-api');
const DepartmentAPI = require('../../../app/api/department/department-api');
const nullLogger = require('../../../app/lib/log/null-logger');
const config = require('../../../app/lib/config');

const user = {
  id: 1,
  firstName: 'Unit',
  lastName: 'Test',
  email: 'unit@email.com'
};

const createCompanyAPI = () =>
  new CompanyAPI({
    user,
    logger: nullLogger,
    config,
    db
  });

const createDepartmentAPI = () =>
  new DepartmentAPI({
    user,
    logger: nullLogger,
    config,
    db
  });

const assertCompany = (c, other) => {
  expect(c.id).to.eql(other.id);
  expect(c.name).to.eql(other.name);
};

describe('CompanyAPI', () => {
  let allCompanies;
  beforeEach(async () => {
    await db.sequelize.sync();
    await db.sequelize.query('PRAGMA foreign_keys = ON');
    allCompanies = await db.Company.bulkCreate([
      {
        name: 'C1'
      },
      {
        name: 'C2'
      },
      {
        name: 'C3'
      }
    ]);
  });

  afterEach(async () => {
    await db.sequelize.drop();
  });

  it('should throw a 404 if no company matches', async () => {
    const companyAPI = createCompanyAPI();
    let errorThrown = null;
    try {
      await companyAPI.query({ id: -1 });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql('Company does not exist');
  });

  it('should return a company by id', async () => {
    const companyAPI = createCompanyAPI();
    const dbCompany = await companyAPI.query({ id: allCompanies[0].id });
    expect(dbCompany).to.exist;
    expect(dbCompany.id).to.eql(allCompanies[0].id);
    expect(dbCompany.name).to.eql(allCompanies[0].name);
  });

  it('should escape "%" character when querying', async () => {
    const companyAPI = createCompanyAPI();
    const dbCompanies = await companyAPI.query({ name: 'C%' });
    expect(dbCompanies).to.exist;
    expect(dbCompanies.length).to.eql(0);
  });

  it('should match name by wild card', async () => {
    const companyAPI = createCompanyAPI();
    const dbCompanies = await companyAPI.query({ name: 'C' });
    expect(dbCompanies).to.exist;
    expect(dbCompanies.length).to.eql(3);
    dbCompanies.forEach((c) => {
      const other = allCompanies.find(o => o.id === c.id);
      expect(other).to.exist;
      assertCompany(c, other);
    });
  });

  it('should create a company', async () => {
    const companyAPI = createCompanyAPI();
    const name = 'C4';
    const newCompany = await companyAPI.create({ name });
    expect(newCompany).to.exist;
    expect(newCompany.id).to.exist;
    expect(newCompany.name).to.eql(name);
    const dbCompany = await companyAPI.query({ id: newCompany.id });
    assertCompany(dbCompany, newCompany);
  });

  it('should fail to create a company with a repeated name', async () => {
    const companyAPI = createCompanyAPI();
    const name = 'C3';
    let errorThrown;
    try {
      await companyAPI.create({ name });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(409);
    expect(errorThrown.message).to.eql(`A company already exist with name ${name}`);
  });

  it('should fail to edit non existing company', async () => {
    const companyAPI = createCompanyAPI();
    let errorThrown;
    const id = -1;
    try {
      await companyAPI.edit({ id });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`Company ${id} does not exist`);
  });

  it('should fail to change a company name if it is repeated', async () => {
    const companyAPI = createCompanyAPI();
    let errorThrown;
    const editingCompany = {
      id: allCompanies[0].id,
      name: allCompanies[1].name
    };
    try {
      await companyAPI.edit(editingCompany);
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(409);
    expect(errorThrown.message).to.eql(`A company already exist with name ${editingCompany.name}`);
  });

  it('should edit a company', async () => {
    const companyAPI = createCompanyAPI();
    const editingCompany = {
      id: allCompanies[0].id,
      name: 'new name'
    };
    const editedCompany = await companyAPI.edit(editingCompany);
    expect(editedCompany).to.exist;
    expect(editedCompany.id).to.eql(editingCompany.id);
    expect(editedCompany.name).to.eql(editingCompany.name);
    const dbCompany = await companyAPI.query({ id: editedCompany.id });
    assertCompany(dbCompany, editedCompany);
  });

  it('should fail to remove non existing company', async () => {
    const companyAPI = createCompanyAPI();
    let errorThrown;
    const id = -1;
    try {
      await companyAPI.remove({ id });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`Company ${id} does not exist`);
  });

  it('should remove a company', async () => {
    const companyAPI = createCompanyAPI();
    const removedCompany = await companyAPI.remove({ id: allCompanies[0].id });
    expect(removedCompany).to.exist;
    expect(removedCompany.id).to.eql(allCompanies[0].id);
    expect(removedCompany.name).to.eql(allCompanies[0].name);
    let errorThrown = null;
    try {
      await companyAPI.query({ id: allCompanies[0].id });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql('Company does not exist');
  });

  it('should remove a company and cascade delete departments', async () => {
    let errorThrown;
    const companyAPI = createCompanyAPI();
    const departmentAPI = createDepartmentAPI();
    const [{ id }] = allCompanies;
    const newDepartment = await departmentAPI.create({
      name: 'D1',
      company: id
    });
    await companyAPI.remove({ id });
    try {
      await departmentAPI.query({ id: newDepartment.id });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql('Department does not exist');
  });
});
