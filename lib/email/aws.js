'use strict';

/* Isolated aws send function in an attempt to separate things for easier testing */

// $lab:coverage:off$
const AWS = require('aws-sdk');
const Config = require('getconfig');
const { isDev } = Config.getconfig;
const SES = new AWS.SES({ region: 'us-east-1' });

module.exports = {
  sendEmail:  function (params) {

    if (isDev) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {

      SES.sendEmail(params, (err, data) => {

        if (err) {

          return reject(err);
        };

        return resolve(data);
      });

    });
  }
};
// $lab:coverage:on$
