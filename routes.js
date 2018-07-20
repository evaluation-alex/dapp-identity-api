'use strict';

const Controllers = require('keyfob').load({ path: './controllers', fn: require });

module.exports = [
  // healthcheck
  { method: 'GET', path: '/__healthcheck__', config: Controllers.healthcheck },

  { method: 'GET', path: '/', config: Controllers.pages.home },

  // signup
  { method: 'GET', path: '/signup', config: Controllers.pages.signup },
  { method: 'POST', path: '/signup', config: Controllers.actions.signup },
  { method: 'POST', path: '/create_account', config: Controllers.actions.create_account },

  // login
  { method: 'GET', path: '/login', config: Controllers.pages.login },
  { method: 'POST', path: '/login', config: Controllers.actions.login },

  // api
  { method: 'GET', path: '/key', config: Controllers.pages.key },
  { method: 'GET', path: '/jwk', config: Controllers.pages.jwk },
  { method: 'GET', path: '/user', config: Controllers.pages.user },
  { method: 'GET', path: '/proof/{user_id}/{session_id}', config: Controllers.pages.proof },
  { method: 'GET', path: '/proof2/{session_id}', config: Controllers.pages.proof2 },

  // authenticated routes
  { method: 'GET', path: '/sign', config: Controllers.pages.sign },
  { method: 'POST', path: '/sign', config: Controllers.actions.sign },
  { method: 'GET', path: '/sign2', config: Controllers.pages.sign2 },
  { method: 'POST', path: '/sign2', config: Controllers.actions.sign2 },

  // static assets
  { method: 'GET', path: '/{path*}', config: { handler: { directory: { path: './public', listing: false } }, auth: false } }
];
