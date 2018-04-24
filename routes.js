'use strict';

const Controllers = require('keyfob').load({ path: './controllers', fn: require });

module.exports = [
  // healthcheck
  { method: 'GET', path: '/__healthcheck__', config: Controllers.healthcheck },

  { method: 'GET', path: '/', config: Controllers.pages.home },
  { method: 'GET', path: '/login', config: Controllers.pages.login },
  { method: 'POST', path: '/login', config: Controllers.actions.login },

  { method: 'GET', path: '/key', config: Controllers.pages.key },
  //Look up user by id or email
  //{ method: 'GET', path: '/user', config: Controllers.pages.user },
  //Look up signatures by session or user_id
  //{ method: 'GET', path: '/signatures', Controllers.pages.signatures },

  // Authenticated routes
  { method: 'GET', path: '/sign', config: Controllers.pages.sign },
  { method: 'POST', path: '/sign', config: Controllers.actions.sign },
  //{ method: 'GET', path: '/signatures', config: Controllers.pages.signatures },

  //Static assets
  { method: 'GET', path: '/{path*}', config: { handler: { directory: { path: './public', listing: false } }, auth: false } }
];
