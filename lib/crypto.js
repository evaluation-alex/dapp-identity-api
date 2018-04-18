'use strict';

const WebCrypto = require('node-webcrypto-ossl');
const crypto = new WebCrypto();

const ALGO = { name: 'RSASSA-PKCS1-v1_5' };
const HASH = { name: 'SHA-512' };

module.exports = {
  generateKeyPair: async () => {

    const keyPair = await crypto.subtle.generateKey({
      name: ALGO.name,
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: HASH
    }, true, ['sign', 'verify']);

    return keyPair;
  },
  exportKeyPair: async (keyPair) => {

    const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    return JSON.stringify({
      privateKey,
      publicKey
    }, null, ' ');
  },
  exportPublicKey: async (keyPair) => {

    const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    return publicKey;
  },
  importKeyPair: async (jwks) => {

    const parsed = JSON.parse(jwks);
    const privateKey = await crypto.subtle.importKey('jwk', parsed.privateKey, { name: ALGO.name, hash: HASH }, true, ['sign', 'verify']);
    const publicKey = await crypto.subtle.importKey('jwk', parsed.publicKey, { name: ALGO.name, hash: HASH }, true, ['verify']);
    return {
      privateKey,
      publicKey
    };
  },
  importPublicKey: async (jwk) => {

    const publicKey = await crypto.subtle.importKey('jwk', jwk, { name: ALGO.name, hash: HASH }, true, ['verify']);
    return publicKey;
  }
};
