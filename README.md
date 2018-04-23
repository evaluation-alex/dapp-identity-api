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
