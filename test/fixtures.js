'use strict';

const Server = require('../server');
const Crypto = require('../lib/crypto');
const Config = require('getconfig');
const BCrypt = require('bcrypt');
const Faker = require('faker');

exports.Server = Server.server;
exports.db = Server.db;
exports.Crypto = Crypto;

exports.user = function (attrs, id, encryptPassword) {

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
  if (encryptPassword !== false) {
    user.hash = BCrypt.hashSync(user.password, 1);
    delete user.password;
  }
  return user;
};

exports.password = function () {

  return Faker.internet.password();
};

exports.getAuthCookie = function (cookies) {

  for (const cookie of cookies) {
    const nameValue = cookie.split(';')[0];
    if (nameValue.split('=')[0] === Config.auth.cookie) {
      return nameValue;
    }
  }
};
