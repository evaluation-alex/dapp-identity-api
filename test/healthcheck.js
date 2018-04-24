'use strict';

const Fixtures = require('./fixtures');

const { Server } = Fixtures;
const lab = exports.lab = require('lab').script();
const { expect } = require('code');
const { describe, it, before } = lab;

describe('Healthcheck', () => {

  let server;
  before(async () => {

    server = await Server;
  });

  it('works', async () => {

    const res = await server.inject({ method: 'get', url: '/__healthcheck__' });
    expect(res.statusCode).to.equal(200);
  });
});
