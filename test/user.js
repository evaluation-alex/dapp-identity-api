'use strict';

const Fixtures = require('./fixtures');

const { Server, db } = Fixtures;
const lab = exports.lab = require('lab').script();
const { expect } = require('code');
const { describe, it, before, after } = lab;

describe('GET /key', () => {

  let server;
  const user = Fixtures.user();
  before(async () => {

    server = await Server;
    await db.users.insert(user);
  });

  after(async () => {

    await db.users.destroy({ id: user.id });
  });

  it('gets user by id', async () => {

    const res = await server.inject({ method: 'get', url: `/user?id=${user.id}` });
    expect(res.statusCode).to.equal(200);
    expect(user).to.include(res.result);
  });

  it('gets user by email', async () => {

    const res = await server.inject({ method: 'get', url: `/user?email=${user.email}` });
    expect(res.statusCode).to.equal(200);
    expect(user).to.include(res.result);
  });

  it('invalid user', async () => {

    const nonexistant = Fixtures.user();
    const res = await server.inject({ method: 'get', url: `/user?id=${nonexistant.id}` });
    expect(res.statusCode).to.equal(404);
  });
});
