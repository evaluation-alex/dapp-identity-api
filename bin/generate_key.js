'use strict';

const Crypto = require('../lib/crypto');
const Fs = require('fs');
const { promisify } = require('util');

const fsWriteFile = promisify(Fs.writeFile);

const main = async () => {

  const keyPair = await Crypto.generateKeyPair();
  const exported = await Crypto.exportKeyPair(keyPair);
  await fsWriteFile('key_pair.json', exported, {
    mode:  0o600,
    flag: 'wx'
  });
  process.exit(0);
};

main().catch((err) => {

  console.error(err.stack || err);
  process.exit(1);
});
