'use strict';

const Cheerio = require('cheerio');

const Fixtures = require('./fixtures');
const { Server, db } = Fixtures;
const lab = exports.lab = require('lab').script();
const { expect } = require('code');
const { describe, it, before, after } = lab;

describe('Auth', () => {

  let server;
  before(async () => {

    server = await Server;
  });

  it('page requiring auth redirects to login form', async () => {

    const url = '/sign?proof=dummytext';
    const res = await server.inject({ method: 'get', url });
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal(`/login?next=${encodeURIComponent(url)}`);
  });
});

describe('GET /login', () => {

  let server;
  before(async () => {

    server = await Server;
  });

  it('returns the login form', async () => {

    const res = await server.inject({ method: 'get', url: '/login' });
    expect(res.statusCode).to.equal(200);
    const $ = Cheerio(res.result);
    expect($.find('input[name="email"]', 'Email input').length).equal(1);
    expect($.find('input[name="password"]', 'Password input').length).equal(1);
  });

  it('passes next parameter to form', async () => {

    const next = '/sign?proof=dummytext';
    const res = await server.inject({ method: 'get', url: `/login?next=${encodeURIComponent(next)}` });
    expect(res.statusCode).to.equal(200);
    const $ = Cheerio(res.result);
    expect($.find('input[name="next"]', 'Next parameter').val()).equal(next);
  });
});

describe('POST /login', () => {

  let server;
  const existingPassword = Fixtures.password();
  const existingUser = Fixtures.user({ password: existingPassword });

  before(async () => {

    server = await Server;
    await db.users.insert(existingUser);
  });

  after(async () => {

    await db.users.destroy({ id: existingUser.id });
  });

  it('email is required', async () => {

    const res = await server.inject({
      method: 'post',
      url: '/login',
      headers: { Cookie: 'crumb=test' },
      payload: { crumb: 'test' }
    });
    expect(res.statusCode).to.equal(400);
    const $ = Cheerio(res.result);
    expect($.find('input[name="email"] + .message.message-error').text()).to.equal('"Email" is required');
  });

  it('password is required', async () => {

    const login = Fixtures.user();
    const res = await server.inject({ method: 'post', url: '/login', headers: { Cookie: 'crumb=test' }, payload: { crumb: 'test', email: login.email } });
    expect(res.statusCode).to.equal(400);
    const $ = Cheerio(res.result);
    expect($.find('input[name="email"]').attr('value')).to.equal(login.email);
    expect($.find('input[name="password"] + .message.message-error').text()).to.equal('"Password" is required');
  });

  it('invalid login', async () => {

    const password = Fixtures.password();
    const res = await server.inject({
      method: 'post',
      url: '/login',
      headers: { Cookie: 'crumb=test' },
      payload: { crumb: 'test', email: existingUser.email, password }
    });
    expect(res.statusCode).to.equal(400);
    const $ = Cheerio(res.result);
    expect($.find('.message.message-error').text()).to.equal('Invalid Login');
  });

  it('user does not exist', async () => {

    const email = Fixtures.user().email;
    const password = Fixtures.password();
    const res = await server.inject({
      method: 'post',
      url: '/login',
      headers: { Cookie: 'crumb=test' },
      payload: { crumb: 'test', email, password }
    });
    expect(res.statusCode).to.equal(400);
  });

  it('valid login which then works', async () => {

    let res = await server.inject({
      method: 'post',
      url: '/login',
      headers: { Cookie: 'crumb=test' },
      payload: { crumb: 'test', email: existingUser.email, password: existingPassword }
    });
    expect(res.statusCode).to.equal(302);
    const authCookie = Fixtures.getAuthCookie(res.headers['set-cookie']);
    res = await server.inject({ method: 'get', url: res.headers.location, headers: { 'Cookie': authCookie } });
    expect(res.statusCode).to.equal(200);
  });

  it('redirects back to next parameter', async () => {

    const url = '/sign?proof=dummytext';
    const res = await server.inject({
      method: 'post',
      url: '/login',
      headers: { Cookie: 'crumb=test' },
      payload: { crumb: 'test', email: existingUser.email, password: existingPassword, next: url }
    });
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal(url);
  });

  it('next parameter is sanitized to path only', async () => {

    const url = '/sign?proof=dummytext';
    const res = await server.inject({
      method: 'post',
      url: '/login',
      headers: { Cookie: 'crumb=test' },
      payload: { crumb: 'test', email: existingUser.email, password: existingPassword, next: `http://hackersite.bad${url}` }
    });
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal(url);
  });
});
