'use strict';

/*
 * Destinations for forms here, since naming is clunky if
 * they're in the same namespace as the pages themselves
 */
const BCrypt = require('bcrypt');
const Config = require('getconfig');
const Joi = require('joi');
const Url = require('url');

const Crypto = require('../lib/crypto');
const Email = require('../lib/email');
const PeerIdentity = require('peer-identity');
const Boom = require('boom');
const Bs58 = require('bs58');

module.exports = {
  login: {
    description: 'Log in',
    handler: async function (request, h) {

      const user = await this.db.users.login({ email: request.payload.email });
      if (!user) {
        return h.view('pages/login', { ...request.payload, errors: { page: 'Invalid Login' } }).code(400);
      }
      const valid = await BCrypt.compare(request.payload.password, user.hash);
      if (!valid) {
        return h.view('pages/login', { ...request.payload, errors: { page: 'Invalid Login' } }).code(400);
      }

      delete user.hash;
      request.cookieAuth.set(user);

      if (request.payload.next) {
        const next = Url.parse(request.payload.next);
        return h.redirect(next.path);
      }

      return h.redirect('/');
    },
    auth: false,
    validate: {
      failAction: function (request, h, error) {

        const errors = {};
        for (const detail of error.details) {
          errors[detail.context.key] = detail.message;
        }
        return h.view('pages/login', { ...request.payload, errors }).code(400).takeover();
      },
      payload: {
        email: Joi.string().required().label('Email'),
        password: Joi.string().required().label('Password'),
        next: Joi.any().optional()
      }
    }
  },

  sign: {
    description: 'Sign an identity proof',
    handler: async function (request, h) {

      const user = await this.db.users.login({ email: request.auth.credentials.email });
      const valid = await BCrypt.compare(request.payload.password, user.hash);
      if (!valid) {
        return h.view('pages/sign', { ...request.payload, errors: { password: 'Invalid Password' } }).code(400);
      }
      const proof = request.payload.proof;
      const { sessionId } =  await Crypto.validateProof(request, proof);
      const signature = await Crypto.sign(proof, this.keyPair);
      const record = {
        session_id: sessionId,
        user_id: user.id,
        proof,
        signature
      };
      await this.db.signatures.insert(record);
      return h.view('pages/signed').code(201);
    },
    validate: {
      failAction: function (request, h, error) {

        const errors = {};
        for (const detail of error.details) {
          errors[detail.context.key] = detail.message;
        }
        return h.view('pages/sign', { ...request.payload, errors }).code(400).takeover();
      },
      payload: {
        proof: Joi.string().required().label('Identity Proof'),
        password: Joi.string().required().label('Password')
      }
    }
  },

  signup: {
    description: 'Destination for signup form',
    handler: async function (request, h) {

      const email = request.payload.email;
      //See if it already exists.
      //Limit to more recently than 15 minutes so we don't spam emails
      const recent = await this.db.signups.for_email({ email, interval: '15 minutes' });
      if (!recent) {
        //Make a new one, resetting the 15 minute timer
        await this.db.signups.destroy({ email });
        const new_signup = await this.db.signups.insert({ email });
        await Email.send({
          template: 'signup.html',
          context: { token: new_signup.id, baseUrl: Config.baseUrl  },
          params: {
            subject: 'DAPP identity server signup - please verify your email',
            to: email
          }
        });
      }
      //We render this no matter what the outcome
      return h.view('pages/signup_wait');
    },
    auth: false,
    validate: {
      payload: {
        email: Joi.string().email().required()
      }
    },
    plugins: {
      'hapi-rate-limit': Config.signupRateLimit
    }
  },

  create_account: {
    description: 'Destination for create account form',
    handler: async function (request, h) {

      const token = await this.db.signups.by_token({ token: request.payload.token, interval: '3 hours' });
      if (!token) {
        const errors = {
          token: 'Invalid or missing token'
        };
        return h.view('pages/create_account', { ...request.payload, errors }).code(400);
      }
      const created_user = await this.db.tx(async (tx) => {

        const hash = await BCrypt.hash(request.payload.password, 10);
        const attrs = {
          name: request.payload.name,
          email: token.email,
          hash
        };
        await tx.signups.destroy({ id: token.id });
        const user = await tx.users.insert(attrs);
        return user;
      });
      const login = await this.db.users.login({ email: created_user.email });
      delete login.hash;
      request.cookieAuth.set(created_user);
      return h.redirect('/', { message: 'Account created' });
    },
    auth: false,
    validate: {
      failAction: function (request, h, error) {

        const errors = {};
        for (const detail of error.details) {
          errors[detail.context.key] = detail.message;
        }
        return h.view('pages/create_account', { ...request.payload, errors }).code(400).takeover();
      },
      payload: {
        name: Joi.string().required().label('Name'),
        password: Joi.string().required().label('Password'),
        token: Joi.string().guid().required().description('Token emailed to user as part of signup flow')
      }
    }
  },

  sign2: {
    description: 'Sign an identity proof',
    handler: async function (request, h) {

      const user = await this.db.users.login({ email: request.auth.credentials.email });
      const valid = await BCrypt.compare(request.payload.password, user.hash);
      if (!valid) {
        return h.view('pages/sign', { ...request.payload, errors: { password: 'Invalid Password' } }).code(400);
      }
      const proof = request.payload.proof;
      //const { sessionId } =  await Crypto.validateProof(request, proof);
      const identity = new PeerIdentity();
      identity.setSessionKeyPair(this.keyPair);
      //await Crypto.validateProof(request, proof);
      const validProof = await identity.importProof(proof);
      if (!validProof) {
        throw Boom.badRequest('Invalid signature');
      }
      const [base58DID] = proof.split('.');
      let stringDID;
      let did;
      try {
        stringDID = Bs58.decode(base58DID).toString('utf8');
        did = JSON.parse(stringDID);
      }
      catch (e) {
        Boom.badRequest('Invalid DID');
      }
      const sessionId = did.id;

      const signature = await Crypto.sign(proof, this.keyPair);
      const record = {
        session_id: sessionId,
        user_id: user.id,
        proof,
        signature
      };
      await this.db.signatures.insert(record);
      console.log('lkjasdflkjasdlkfjlasdkfj');
      console.log('request.payload.next', request.payload.next);
      if (request.payload.next) {
        console.log('I have a next!');
        return h.redirect(request.payload.next);
      }
      return h.view('pages/signed').code(201);
    },
    validate: {
      failAction: function (request, h, error) {

        const errors = {};
        for (const detail of error.details) {
          errors[detail.context.key] = detail.message;
        }
        return h.view('pages/sign', { ...request.payload, errors }).code(400).takeover();
      },
      payload: {
        proof: Joi.string().required().label('Identity Proof'),
        password: Joi.string().required().label('Password'),
        next: Joi.any().optional()
      }
    }
  }
};
