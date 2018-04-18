'use strict';
exports.up = async (knex, Promise) => {

  await knex.schema.raw(`CREATE TABLE signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    session_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    proof TEXT NOT NULL,
    signature TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
  )`);
  await knex.schema.raw('CREATE INDEX signatures_session_id ON signatures(session_id)');
  await knex.schema.raw('CREATE INDEX signatures_user_id ON signatures(user_id)');
};

exports.down = async (knex, Promise) => {

  await knex.schema.raw('DROP TABLE signatures');
};
