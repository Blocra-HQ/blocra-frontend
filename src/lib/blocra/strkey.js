// copied from blocra-cli src/strkey.js v0.2.0 — keep identical.
// Do not edit here: change blocra-cli, then run `node scripts/sync-blocra.mjs --write`.
// `npm run check:blocra` fails when this copy and the CLI differ.

// Decoding of Stellar strkeys (G... account ids), enough to turn a signer's
// public key into its 32 raw Ed25519 bytes. RFC 4648 base32, one version
// byte, a 32-byte payload and a CRC16-XModem checksum (little-endian).

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const VERSION_ACCOUNT_ID = 6 << 3; // "G"

function base32Decode(text) {
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of text) {
    const i = ALPHABET.indexOf(ch);
    if (i < 0) throw new Error(`Invalid character "${ch}" in key`);
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Uint8Array.from(out);
}

export function crc16xmodem(bytes) {
  let crc = 0;
  for (const b of bytes) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}

/** Raw 32-byte Ed25519 public key of a G... account id; throws if invalid. */
export function decodeAccountId(strkey) {
  if (typeof strkey !== "string" || strkey.length !== 56 || strkey[0] !== "G") {
    throw new Error("Not a Stellar account id (expected 56 characters starting with G)");
  }
  const raw = base32Decode(strkey);
  if (raw.length !== 35 || raw[0] !== VERSION_ACCOUNT_ID) throw new Error("Not a Stellar account id");
  const body = raw.subarray(0, 33);
  const checksum = raw[33] | (raw[34] << 8);
  if (crc16xmodem(body) !== checksum) throw new Error("Key checksum does not match (typo?)");
  return raw.subarray(1, 33);
}
