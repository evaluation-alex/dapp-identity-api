'use strict';

const Boom = require('boom');

module.exports = {
  description: 'Healthcheck',
  handler: async function (request, h) {

    const count = await this.db.users.count();

    //$lab:coverage:off$
    if (count.count > -1) {

      return h.response('ok').type('text/plain');
    }

    throw Boom.internal('Healthcheck error');
    //$lab:coverage:on$
  },
  auth: false
};
