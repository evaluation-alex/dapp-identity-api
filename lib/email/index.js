'use strict';

const Config = require('getconfig');
const Fs = require('fs');
const Mustache = require('mustache');
const Path = require('path');
const Util = require('util');

const AWS = require('./aws');

const readFile = Util.promisify(Fs.readFile);

// WARNING: don't let template value come from a user (dir traversal)
module.exports.send = async function (attrs) {

  const template = await readFile(Path.resolve(__dirname, 'templates', 'dist', attrs.template), 'utf8');
  const content = Mustache.render(template, attrs.context);

  const email = {
    Destination: {
      ToAddresses: [
        attrs.params.to
      ]
    },
    Message: {
      Body: {
        Html: {
          Data: content
        }
      },
      Subject: {
        Data: attrs.params.subject
      }
    },
    Source: Config.email.from,
    ReplyToAddresses: [
      Config.email.from
    ]
  };

  await AWS.sendEmail(email);
};
