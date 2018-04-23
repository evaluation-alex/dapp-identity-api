'use strict';

const Boom = require('boom');
const Bs58 = require('bs58');
const WebCrypto = require('node-webcrypto-ossl');

const crypto = new WebCrypto();

const ALGO = { name: 'RSASSA-PKCS1-v1_5' };
const HASH = { name: 'SHA-512' };

const generateKeyPair = async () => {

  const keyPair = await crypto.subtle.generateKey({
    name: ALGO.name,
    modulusLength: 2048,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: HASH
  }, true, ['sign', 'verify']);

  return keyPair;
};

const exportKeyPair = async (keyPair) => {

  const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return JSON.stringify({
    privateKey,
    publicKey
  }, null, ' ');
};

const importKeyPair = async (jwks) => {

  const parsed = JSON.parse(jwks);
  const privateKey = await crypto.subtle.importKey('jwk', parsed.privateKey, { name: ALGO.name, hash: HASH }, true, ['sign', 'verify']);
  const publicKey = await crypto.subtle.importKey('jwk', parsed.publicKey, { name: ALGO.name, hash: HASH }, true, ['verify']);
  return {
    privateKey,
    publicKey
  };
};

const exportPublicKey = async (keyPair) => {

  const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return Bs58.encode(Buffer.from(JSON.stringify(publicKey)));
};

const importPublicKey =  async (jwk) => {

  jwk = JSON.parse(Bs58.decode(jwk).toString('utf8'));
  const publicKey = await crypto.subtle.importKey('jwk', jwk, { name: ALGO.name, hash: HASH }, true, ['verify']);
  return publicKey;
};


const sign = async (phrase, keyPair) => {

  const text2sign = Uint8Array.from(phrase);
  const sigArr = await crypto.subtle.sign(ALGO, keyPair.privateKey, text2sign, 'utf8');
  const sigString = Buffer.from((new Uint8Array(sigArr)).buffer);
  return Bs58.encode(sigString).toString('utf8');
};

// Validates a proof string
// proof is a dot separated group of for base58 encoded strings.
//  - {user id}.{session id}.{signature of "userid.sessionid"}.{public key used to make signature}
// A valid proof has a user id that matches the currently logged in user
// A valid proof also has a valid signature that can be verified with the given public key
//
// Returns the encoded session id for later indexing
const validateProof = async (request, proof) => {

  const user = request.auth.credentials;
  try {

    var [userId, sessionId, userSessionSig, publicKey] = proof.split('.').map(Bs58.decode);
  }
  catch (err) {

    throw Boom.badRequest('Invalid proof');
  }

  userId = userId.toString('utf8');

  if (userId !== user.id) {
    throw Boom.badRequest('User ID in proof much match currently logged in user');
  }

  try {
    publicKey = JSON.parse(publicKey);
  }
  catch (err) {

    throw Boom.badRequest('Invalid Public Key. Must be Base58 encoded JWK');
  }

  try {
    publicKey = await crypto.subtle.importKey('jwk', publicKey, { name: ALGO.name, hash: HASH }, true, ['verify']);
  }
  catch (err) {

    request.log(['error'], err);
    throw Boom.badRequest('Invalid public key');
  }
  let text2verify = proof.split('.').slice(0, 2).join('.');
  text2verify = Uint8Array.from(text2verify);

  const verified = crypto.subtle.verify(ALGO, publicKey, userSessionSig, text2verify, 'utf8');
  if (!verified) {

    throw Boom.badRequest('Invalid signature');
  }

  return { sessionId };
};

module.exports = {
  generateKeyPair,
  exportKeyPair,
  exportPublicKey,
  importKeyPair,
  importPublicKey,
  sign,
  validateProof
};
