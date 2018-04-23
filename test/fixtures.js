'use strict';

const Server = require('../server');
const Crypto = require('../lib/crypto');
const Config = require('getconfig');
const BCrypt = require('bcrypt');
const Faker = require('faker');

exports.Server = Server.server;
exports.db = Server.db;
exports.Crypto = Crypto;

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

exports.getAuthCookie = function (cookies) {

  for (const cookie of cookies) {
    const name_value = cookie.split(';')[0];
    if (name_value.split('=')[0] === Config.auth.cookie) {
      return name_value;
    }
  }
};
