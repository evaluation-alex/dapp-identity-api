'use strict';

const Hoek = require('hoek');

const register = function (plugin, options) {

  plugin.ext('onPreResponse', (request, h) => {

    if (!request.response.isBoom) {
      return h.continue;
    }

    //TODO exception for json endpoints

    const statusCode = Hoek.reach(request, 'response.output.statusCode');

    if (statusCode >= 500) {
      console.log(request.response);
      plugin.log(['error'], request.response);
    }
    //TODO
    //if (statusCode === 401) {
    //let nextUrl = Url.parse(request.info.referrer, true).query.next || request.path;
    //nextUrl = nextUrl.startsWith('/login') ? '' : `?next=${nextUrl}`;
    //return reply.redirect(`/login${nextUrl}`);
    //}
    return h.view('error', {
      errors: { page: Hoek.reachTemplate(request, '{response.output.statusCode}: {response.output.payload.error}') }
    }).takeover().code(statusCode);
  });
};

module.exports = {
  register,
  name: 'pretty_errors'
};
