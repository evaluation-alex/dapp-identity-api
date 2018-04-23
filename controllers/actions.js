'use strict';

/*
 * Destinations for forms here, since naming is clunky if
 * they're in the same namespace as the pages themselves
 */
const BCrypt = require('bcrypt');
const Joi = require('joi');
const Url = require('url');

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

      if (user.scope.indexOf('admin') > -1) {
        return h.redirect('/admin');
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
        next: Joi.string()
      }
    }
  }
};
