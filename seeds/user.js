'use strict';
const BCrypt = require('bcrypt');

exports.seed = async (knex) => {

  const email = 'pltest@test.com';
  const name = 'Test User';
  const password = await BCrypt.hash('testpassword', 10);
  try {
    await knex('users').insert({
      name,
      email,
      hash: password
    });
  }
  catch (err) {

    if (err.message.indexOf('users_email_key') > -1) {
      console.log('Seed user already exists. Nothing to do.');
      return;
    }
    throw err;
  }
};
