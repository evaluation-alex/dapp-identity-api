'use strict';

const Config = require('getconfig');
const Fs = require('fs');
const Hapi = require('hapi');
const Muckraker = require('muckraker');
const PinoNoir = require('pino-noir');

const Crypto = require('./lib/crypto');

const { promisify } = require('util');

const fsReadFile = promisify(Fs.readFile);

Config.pino.serializers = PinoNoir(['req.headers.cookie', 'res.header']);
Config.hapi.cache.engine = require(Config.hapi.cache.engine);

const { isDev } = Config.getconfig;

const db = new Muckraker(Config.db);

//Some CI environments don't have $PORT set during postinstall
if (process.env.NODE_ENV === 'production') {
  Config.hapi.port = process.env.PORT;
}

const server = new Hapi.Server(Config.hapi);

//$lab:coverage:off$
process.on('SIGTERM', async () => {

  server.log(['info', 'shutdown'], 'Graceful shutdown');
  await server.stop({ timeout: 15000 });
  process.exit(0);
});

server.events.on({ name: 'request', channels: ['error'] }, (request, event) => {

  console.log(event.stack || event);
});
//$lab:coverage:on$

module.exports.db = db;
module.exports.server = (async () => {

  await server.register([
    require('hapi-auth-cookie'),
    require('vision'),
    require('inert'),
    require('./hapi_plugins/pretty_errors')
  ]);

  await server.register([{
    plugin: require('crumb'),
    options: Config.crumb
  }, {
    plugin: require('hapi-pino'),
    options: Config.pino
  }, {
    plugin: require('hapi-rate-limit'),
    options: Config.rateLimit
  }]);

  server.views({
    isCached: !isDev,
    engines: {
      pug: require('pug')
    },
    compileOptions: { pretty: isDev },
    relativeTo: __dirname,
    path: 'views'
  });

  server.auth.strategy('session', 'cookie', {
    ...Config.auth,
    validateFunc: async (request, session) => {

      const user = await db.users.validate(session);
      return { valid: !!user };
    }
  });
  server.auth.default('session');

  const jwts = await fsReadFile('key_pair.json');
  const keyPair = await Crypto.importKeyPair(jwts);

  server.bind({ db, keyPair });
  server.route(require('./routes'));


  // coverage disabled because module.parent is always defined in tests
  // and we don't throw any major errors to catch
  // $lab:coverage:off$
  if (module.parent) {
    await server.initialize();
    return server;
  }

  await server.start();
  return server;
})()
  .catch((err) => {

    console.error(err.stack);
    process.exit(1);
  });
// $lab:coverage:on$
