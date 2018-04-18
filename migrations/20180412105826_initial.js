'use strict';

exports.up = async (knex, Promise) => {

  await knex.schema.raw(`CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    name TEXT,
    email CITEXT UNIQUE NOT NULL,
    hash TEXT NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    scope TEXT[] NOT NULL DEFAULT '{user}',
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
  )`);
};

exports.down = async (knex, Promise) => {

  await knex.schema.raw('DROP TABLE users');
};
