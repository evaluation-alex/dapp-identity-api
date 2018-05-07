'use strict';

const Cheerio = require('cheerio');
const Faker = require('faker');
const AWS = require('../lib/email/aws');
const StandIn = require('stand-in');
const Fixtures = require('./fixtures');
const { Server, db } = Fixtures;
const lab = exports.lab = require('lab').script();
const { expect } = require('code');
const { fail, describe, it, before, after, afterEach } = lab;

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
  const new_user = Fixtures.user();

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

  afterEach(() => {

    StandIn.restoreAll();
  });

  it('new user', async () => {

    let standin;
    const wait = new Promise((resolve) => {

      standin = StandIn.replace(AWS, 'sendEmail', (stand, params) => {

        expect(params.Destination.ToAddresses).to.include(new_user.email);
        stand.restore();
        resolve();
      });
    });

    const payload = {
      crumb: 'test',
      email: new_user.email
    };

    const res = await server.inject({
      method: 'post',
      url: '/signup',
      headers: { Cookie: 'crumb=test' },
      payload
    });
    expect(res.statusCode).to.equal(200);
    await wait;
    const created_signup = await db.signups.findOne({ email: new_user.email });
    expect(created_signup).to.exist();
    expect(standin.invocations).to.equal(1);
  });

  it('duplicate attempt', async () => {

    const standin = StandIn.replace(AWS, 'sendEmail', (stand, params) => {

      fail('Should not call AWS');
    });

    const payload = {
      crumb: 'test',
      email: new_signup.email
    };
    const res = await server.inject({
      method: 'post',
      url: '/signup',
      headers: { Cookie: 'crumb=test' },
      payload
    });
    expect(res.statusCode).to.equal(200);
    expect(standin.invocations).to.equal(0);
    standin.restore();
  });

  it('stale token', async () => {

    let standin;
    const wait = new Promise((resolve) => {

      standin = StandIn.replace(AWS, 'sendEmail', (stand, params) => {

        expect(params.Destination.ToAddresses).to.include(stale_signup.email);
        stand.restore();
        resolve();
      });
    });

    const payload = {
      crumb: 'test',
      email: stale_signup.email
    };
    const res = await server.inject({
      method: 'post',
      url: '/signup',
      headers: { Cookie: 'crumb=test' },
      payload
    });
    expect(res.statusCode).to.equal(200);
    await wait;
    const updated_signup = await db.signups.findOne({ email: stale_signup.email });
    expect(updated_signup.created_at).to.not.equal(stale_signup.created_at);
    expect(standin.invocations).to.equal(1);
    standin.restore();
  });
});
