'use strict';

/*
 * Static rendering of unauthenticated pages here
 */
const Joi = require('joi');
const Config = require('getconfig');
const Boom = require('boom');
const PeerIdentity = require('peer-identity');

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

      return h.view('pages/login', { ...request.query });
    },
    auth: {
      mode: 'try'
    },
    validate: {
      query: {
        next: Joi.string()
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

  jwk: {
    description: 'Get the public key for this server',
    notes: 'This is the public portion of they key it will use to sign sessions',
    handler: async function (request, h) {

      const publicKey = await Crypto.exportPublicJWK(this.keyPair);
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
      await Crypto.validateProof(request, proof);
      return h.view('pages/sign', { proof, user });
    },
    validate: {
      query: {
        proof: Joi.string().description('Session proof to sign').required()
      }
    }
  },

  sign2: {
    description: 'Begin the proof signing process',
    notes: 'Returns a form prompting the user for their password',
    handler: async function (request, h) {

      const user = request.auth.credentials;
      const { proof, next } = request.query;
      const identity = new PeerIdentity();
      identity.setSessionKeyPair(this.keyPair);
      //await Crypto.validateProof(request, proof);
      const valid = await identity.importProof(proof);
      if (!valid) {
        throw Boom.badRequest('Invalid signature');
      }
      return h.view('pages/sign', { proof, user, next });
    },
    validate: {
      query: {
        proof: Joi.string().description('Session proof to sign').required(),
        next: Joi.any().optional()
      }
    }
  },

  user: {
    description: 'Look up user by id or email',
    tags: ['api'],
    handler: async function (request, h) {

      const exists = await this.db.users.findOne(request.query, ['id', 'name']);
      if (!exists) {
        throw Boom.notFound();
      }

      return exists;
    },
    validate: {
      query: {
        email: Joi.string().label('Email'),
        id: Joi.string().guid().label('User ID')
      }
    },
    auth: false,
    plugins: {
      'hapi-rate-limit': Config.getUserRateLimit
    }
  },

  proof: {
    description: 'Look up proof signature by user session',
    tags: ['api'],
    handler: async function (request, h) {

      const proof = await this.db.signatures.findOne(request.params);
      if (!proof) {
        throw Boom.notFound();
      }
      return proof;
    },
    validate: {
      params: {
        user_id: Joi.string().guid().description('User id'),
        session_id: Joi.string().required().description('Session id')
      }
    },
    auth: false
  },

  signup: {
    description: 'Create an account',
    handler: async function (request, h) {

      if (request.auth.isAuthenticated) {
        return h.redirect('/');
      }

      if (request.query.token) {
        const exists = await this.db.signups.by_token({ token: request.query.token, interval: '3 hours' });
        if (!exists) {
          throw Boom.notFound('Invalid token');
        }
        return h.view('pages/create_account');
      }
      return h.view('pages/signup');
    },
    auth: {
      mode: 'try'
    },
    validate: {
      query: {
        token: Joi.string().guid().description('Token emailed to user as part of signup flow')
      }
    }
  },

  proof2: {
    description: 'Look up proof signature by user session',
    tags: ['api'],
    handler: async function (request, h) {

      const proof = await this.db.signatures.findOne(request.params);
      if (!proof) {
        throw Boom.notFound();
      }
      return proof;
    },
    validate: {
      params: {
        session_id: Joi.string().required().description('Session id')
      }
    },
    auth: false
  }
};
