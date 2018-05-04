'use strict';

const BCrypt = require('bcrypt');
const Bs58 = require('bs58');
const Config = require('getconfig');
const Faker = require('faker');

const Server = require('../server');
const Crypto = require('../lib/crypto');

exports.Server = Server.server;
exports.db = Server.db;
exports.Crypto = Crypto;
exports.keyPair = Server.keyPair; //Await this before using it

exports.user = function (attrs, id, encrypt_password) {

  const defaults = {
    name: Faker.name.findName(),
    email: Faker.internet.email(),
    password: Faker.internet.password(),
    scope: ['user']
  };

  if (id !== false) {
    defaults.id = Faker.random.uuid();
  }

  const user = { ...defaults, ...attrs };
  if (encrypt_password !== false) {
    user.hash = BCrypt.hashSync(user.password, 1);
    delete user.password;
  }
  return user;
};

exports.password = function () {

  return Faker.internet.password();
};

exports.sessionId = function () {

  return Faker.random.uuid();
};

exports.proof = async function (attrs) {

  const defaults = {
    sessionId: Faker.random.uuid(),
    userId: Faker.random.uuid()
  };

  const parts = { ...defaults, ...attrs };
  if (!parts.keyPair) {
    parts.keyPair = await Crypto.generateKeyPair();
  }
  const userId = Buffer.from(parts.userId);
  const sessionId = Buffer.from(parts.sessionId);
  const userSession = `${Bs58.encode(parts.userId)}.${Bs58.encode(parts.sessionId)}`;
  const signature = await Crypto.sign(userSession, parts.keyPair);
  const publicKey = await Crypto.exportPublicKey(parts.keyPair);
  const proof = [
    Bs58.encode(userId),
    Bs58.encode(sessionId),
    signature,
    publicKey
  ].join('.');

  return proof;
};

exports.signup = function (attrs, id) {
  const defaults = {
    email: Faker.internet.email()
  }
  if (id !== false) {
    defaults.id = Faker.random.uuid();
  }
  const signup = { ...defaults, ...attrs };
  return signup;
};

exports.getAuthCookie = function (cookies) {

  for (const cookie of cookies) {
    const name_value = cookie.split(';')[0];
    if (name_value.split('=')[0] === Config.auth.cookie) {
      return name_value;
    }
  }
};
