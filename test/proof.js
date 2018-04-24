'use strict';

const Fixtures = require('./fixtures');
const { Server, Crypto, db, keyPair } = Fixtures;
const lab = exports.lab = require('lab').script();
const { expect } = require('code');
const { describe, it, before, after } = lab;

describe('GET /proof/{user_id}/{session_id}', () => {

  let proof;
  let server;
  let signature;
  const password = Fixtures.password();
  const sessionId = Fixtures.sessionId();
  const user = Fixtures.user({ password });

  before(async () => {

    server = await Server;
    proof = await Fixtures.proof({ userId: user.id, sessionId });
    const kp = await keyPair;
    signature = await Crypto.sign(proof, kp);
    await db.users.insert(user);
    const record = {
      session_id: sessionId,
      user_id: user.id,
      proof,
      signature
    };
    await db.signatures.insert(record);
  });

  after(async () => {

    await db.users.destroy({ id: user.id });
  });

  it('returns signed proof', async () => {

    const res = await server.inject({ method: 'get', url: `/proof/${user.id}/${sessionId}` });
    expect(res.statusCode).to.equal(200);
    expect(res.result).to.include({ proof, signature, user_id: user.id });
  });

  it('unsigned proof', async () => {

    const unsigned = Fixtures.sessionId();
    const res = await server.inject({ method: 'get', url: `/proof/${user.id}/${unsigned}` });
    expect(res.statusCode).to.equal(404);
  });
});
