'use strict';

const Cheerio = require('cheerio');

const Fixtures = require('./fixtures');
const { Server, db } = Fixtures;
const lab = exports.lab = require('lab').script();
const { expect } = require('code');
const { describe, it, before, after } = lab;

describe('GET /sign', () => {

  let server;
  const user = Fixtures.user();

  before(async () => {

    server = await Server;
    await db.users.insert(user);
  });

  after(async () => {

    await db.users.destroy({ id: user.id });
  });

  it('returns form', async () => {

    const proof = await Fixtures.proof({ userId: user.id });
    const res = await server.inject({ method: 'get', url: `/sign?proof=${proof}`, credentials: user });
    expect(res.statusCode).to.equal(200);
    const $ = Cheerio(res.result);
    expect($.find('input[name="password"]', 'Password input').length).equal(1);
    expect($.find('input[name="proof"]', 'Proof input').val()).to.equal(proof);
  });
});

describe('POST /sign', () => {

  let server;
  let proof;
  const password = Fixtures.password();
  const user = Fixtures.user({ password });

  before(async () => {

    server = await Server;
    proof = await Fixtures.proof({ userId: user.id });
    await db.users.insert(user);
  });

  after(async () => {

    await db.users.destroy({ id: user.id });
  });

  it('signs valid proof', async () => {

    const payload = {
      crumb: 'test',
      proof,
      password
    };
    const res = await server.inject({
      method: 'post',
      url: `/sign`,
      credentials: user,
      headers: { Cookie: 'crumb=test' },
      payload
    });
    expect(res.statusCode).to.equal(201);
  });

  it('invalid proof', async () => {

    const payload = {
      crumb: 'test',
      proof: 'invalidproof',
      password
    };
    const res = await server.inject({
      method: 'post',
      url: `/sign`,
      credentials: user,
      headers: { Cookie: 'crumb=test' },
      payload
    });
    expect(res.statusCode).to.equal(400);
  });

  it('invalid password', async () => {

    const payload = {
      crumb: 'test',
      proof,
      password: 'invalidpassword'
    };
    const res = await server.inject({
      method: 'post',
      url: `/sign`,
      credentials: user,
      headers: { Cookie: 'crumb=test' },
      payload
    });
    expect(res.statusCode).to.equal(400);
    const $ = Cheerio(res.result);
    expect($.find('input[name="password"] + .message.message-error').text()).to.equal('Invalid Password');
  });

  it('no password', async () => {

    const payload = {
      crumb: 'test',
      proof
    };
    const res = await server.inject({
      method: 'post',
      url: `/sign`,
      credentials: user,
      headers: { Cookie: 'crumb=test' },
      payload
    });
    expect(res.statusCode).to.equal(400);
    const $ = Cheerio(res.result);
    expect($.find('input[name="password"] + .message.message-error').text()).to.equal('"Password" is required');
  });
});
