'use strict';

const Cheerio = require('cheerio');
const Faker = require('faker');
const Fixtures = require('./fixtures');
const { Server, db } = Fixtures;
const lab = exports.lab = require('lab').script();
const { expect } = require('code');
const { describe, it, before, after } = lab;

describe('POST /create_account', () => {

  let server;
  const new_signup = Fixtures.signup(); //Consumed by happy path test
  const existing_signup = Fixtures.signup(); //Left in db and used by tests requiring a valid signup to exist
  const stale_signup = Fixtures.signup({ created_at: Faker.date.past() });

  before(async () => {

    server = await Server;
    await Promise.all([
      db.signups.insert(new_signup),
      db.signups.insert(existing_signup),
      db.signups.insert(stale_signup)
    ]);
  });

  after(async () => {

    await Promise.all([
      db.signups.destroy({ id: new_signup.id }),
      db.signups.destroy({ id: existing_signup.id }),
      db.signups.destroy({ id: stale_signup.id })
    ]);
  });

  it('valid token', async () => {

    const user = Fixtures.user({ email: new_signup.email }, true, false);
    const payload = {
      crumb: 'test',
      name: user.name,
      password: user.password,
      token: new_signup.id
    };
    const res = await server.inject({
      method: 'post',
      url: '/create_account',
      headers: { Cookie: 'crumb=test' },
      payload
    });
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal('/');
    const authCookie = Fixtures.getAuthCookie(res.headers['set-cookie']);
    expect(authCookie).to.exist();
    const created_user = await db.users.findOne({ email: user.email });
    expect(created_user).to.exist();
    const deleted_signup = await db.signups.findOne({ email: new_signup.email });
    expect(deleted_signup).to.not.exist();
  });

  it('stale token', async () => {

    const user = Fixtures.user({ email: stale_signup.email }, true, false);
    const payload = {
      crumb: 'test',
      name: user.name,
      password: user.password,
      token: stale_signup.id
    };
    const res = await server.inject({
      method: 'post',
      url: '/create_account',
      headers: { Cookie: 'crumb=test' },
      payload
    });
    expect(res.statusCode).to.equal(400);
    const $ = Cheerio(res.result);
    expect($.find('.message.message-error').text()).to.include('token');
    const created_user = await db.users.findOne({ email: user.email });
    expect(created_user).to.not.exist();
  });

  it('form error message', async () => {

    const user = Fixtures.user({ email: existing_signup.email }, true, false);

    const payload = {
      crumb: 'test',
      password: user.password,
      token: stale_signup.id
    };
    const res = await server.inject({
      method: 'post',
      url: '/create_account',
      headers: { Cookie: 'crumb=test' },
      payload
    });
    expect(res.statusCode).to.equal(400);
    const $ = Cheerio(res.result);
    expect($.find('input[name="name"] + .message.message-error').text()).to.include('"Name" is required');
    const created_user = await db.users.findOne({ email: user.email });
    expect(created_user).to.not.exist();
  });
});
