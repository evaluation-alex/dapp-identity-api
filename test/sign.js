'use strict';

const Bs58 = require('bs58');
const Cheerio = require('cheerio');

const Fixtures = require('./fixtures');
const { Server, Crypto, db } = Fixtures;
const lab = exports.lab = require('lab').script();
const { expect } = require('code');
const { describe, it, before, after } = lab;

describe('GET /sign', () => {

  let keyPair;
  let server;
  const password = Fixtures.password();
  const user = Fixtures.user({ password });

  before(async () => {

    server = await Server;
    keyPair = await Crypto.generateKeyPair();
    await db.users.insert(user);
  });

  after(async () => {

    await db.users.destroy({ id: user.id });
  });

  it('returns form', async () => {

    const userId = Buffer.from(user.id);
    const sessionId = Buffer.from(Fixtures.sessionId());
    const userSession = `${Bs58.encode(userId)}.${Bs58.encode(sessionId)}`;
    const signature = await Crypto.sign(userSession, keyPair);
    const publicKey = await Crypto.exportPublicKey(keyPair);
    const proof = [
      Bs58.encode(userId),
      Bs58.encode(sessionId),
      signature,
      publicKey
    ].join('.');
    const res = await server.inject({ url: `/sign?proof=${proof}`, credentials: user });
    expect(res.statusCode).to.equal(200);
    const $ = Cheerio(res.result);
    expect($.find('input[name="password"]', 'Password input').length).equal(1);
    expect($.find('input[name="proof"]', 'Proof input').val()).to.equal(proof);
  });
});
