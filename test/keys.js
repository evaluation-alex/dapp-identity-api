'use strict';

const Fixtures = require('./fixtures');

const { Server, Crypto } = Fixtures;
const lab = exports.lab = require('lab').script();
const { expect } = require('code');
const { describe, it, before } = lab;

describe('GET /key', () => {

  let server;
  before(async () => {

    server = await Server;
  });

  it('works', async () => {

    const res = await server.inject({ method: 'get', url: '/key' });
    expect(res.statusCode).to.equal(200);
    const key = await Crypto.importPublicKey(res.result);
    expect(key).to.exist();
  });
});
