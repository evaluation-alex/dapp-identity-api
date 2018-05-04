'use strict';
exports.up = async (knex, Promise) => {

  await knex.schema.raw(`CREATE TABLE signups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
  )`);
};

exports.down = async (knex, Promise) => {

  await knex.schema.raw('DROP TABLE signups');
};
