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

      const user = request.auth.credentials;
      const { proof } = request.query;
      await Crypto.validateProof(request, proof); //Just validate it here, nothing more
      return h.view('pages/sign', { proof, user });
    },
    validate: {
      query: {
        proof: Joi.string().description('Session proof to sign').required()
      }
    }
  }

};
