'use strict';

const Hoek = require('hoek');

const register = function (plugin, options) {

  plugin.ext('onPreResponse', (request, h) => {

    if (!request.response.isBoom) {
      return h.continue;
    }

    const tags = Hoek.reach(request, 'route.settings.tags');

    if (tags && tags.indexOf('api') > -1) {
      return h.continue;
    }

    const statusCode = Hoek.reach(request, 'response.output.statusCode');

    //$lab:coverage:off$
    if (statusCode >= 500) {
      plugin.log(['error'], request.response);
    }
    //$lab:coverage:on$

    return h.view('error', {
      errors: { page: Hoek.reachTemplate(request, '{response.output.statusCode}: {response.output.payload.error}') }
    }).takeover().code(statusCode);
  });
};

module.exports = {
  register,
  name: 'pretty_errors'
};
