'use strict';

/*
 * Static rendering of unauthenticated pages here
 */
const Joi = require('joi');
const Crypto = require('../lib/crypto');

module.exports = {

  home: {
    description: 'Main page',
    handler: function (request, h) {
      //if (request.auth.isAuthenticated) {
      //return h.redirect('/signatures');
      //}
      return h.view('pages/home');
    },
    auth: {
      mode: 'try'
    }
  },

  login: {
    description: 'Login page',
    handler: function (request, h) {

      if (request.auth.isAuthenticated) {
        return h.redirect('/');
      }

      return h.view('pages/login');
    },
    auth: {
      mode: 'try'
    },
    validate: {
      query: {
        email: Joi.string().default('')
      }
    }
  },

  key: {
    description: 'Get the public key for this server',
    notes: 'This is the public portion of they key it will use to sign sessions',
    handler: async function (request, h) {

      const publicKey = await Crypto.exportPublicKey(this.keyPair);
      return publicKey;
    },
    auth: false
  },

  sign: {
    description: 'Begin the proof signing process',
    notes: 'Returns a form prompting the user for their password',
    handler: async function (request, h) {

      const proof_parts = proof.split('.');
      const context = { ...request.query, session_id: proof_parts[1]
      return h.view('pages/sign', request.query)
    },
    validate: {
      query: {
        proof: Joi.string().description('Session proof to sign').regex(/\w\.\w\.\w\.\w/).required()
      }
    }
  }

};
