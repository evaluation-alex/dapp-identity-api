'use strict';

const Cheerio = require('cheerio');
const Faker = require('faker');
const Fixtures = require('./fixtures');
const { Server, db } = Fixtures;
const lab = exports.lab = require('lab').script();
const { expect } = require('code');
const { describe, it, before, after } = lab;

describe('GET /signup', () => {

  let server;
  const signup = Fixtures.signup();

  before(async () => {

    server = await Server;
    await db.signups.insert(signup);
  });

  after(async () => {

    await db.signups.destroy({ id: signup.id });
  });

  it('no token', async () => {

    const res = await server.inject({ method: 'get', url: '/signup' });
    expect(res.statusCode).to.equal(200);
    const $ = Cheerio(res.result);
    expect($.find('input[name="email"]', 'Email input').length).equal(1);
  });

  it('valid token', async () => {

    const res = await server.inject({ method: 'get', url: `/signup?token=${signup.id}` });
    expect(res.statusCode).to.equal(200);
    const $ = Cheerio(res.result);
    expect($.find('input[name="name"]', 'Name input').length).equal(1);
    expect($.find('input[name="password"]', 'Password input').length).equal(1);
  });

  it('invalid token', async () => {

    const invalid = Fixtures.signup();
    const res = await server.inject({ method: 'get', url: `/signup?token=${invalid.id}` });
    expect(res.statusCode).to.equal(404);
  });
});

describe('POST /signup', () => {

  let server;
  const new_signup = Fixtures.signup();
  const stale_signup = Fixtures.signup({ created_at: Faker.date.past() });

  before(async () => {

    server = await Server;
    await Promise.all([
      db.signups.insert(new_signup),
      db.signups.insert(stale_signup)
    ]);
  });

  after(async () => {

    await Promise.all([
      db.signups.destroy({ id: new_signup.id }),
      db.signups.destroy({ id: stale_signup.id })
    ]);
  });
});
