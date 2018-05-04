# DAPP Identity server

## Devs

Server requires postgresql.  Once that's running you can set things up
with

```sh

$ npm install
$ npm run createdb
$ npm run sqlextensions
$ npm run migrate
$ node bin/generate_key.js
```

If you want to seed the db w/ a test user run

```sh
$ npx knex seed:run
```

Test user will be: `pltest@test.com`
Test password will be `testpassword`

To run the server

```sh
$ npm start
```

To compile the css

```sh
$ npm run stylus
# Or if you want to watch the stylus files and recompile on changes
$ npm run stylus:watch
```

By default this server will intercept 4xx and 5xx replies and convert
them to html.  Routes tagged with `api` will not have this behavior
applied to them.
