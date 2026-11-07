// Types for the vendored blocra-cli strkey decoder (strkey.js).
export function crc16xmodem(bytes: Uint8Array): number;
/** Raw 32-byte Ed25519 public key of a G... account id; throws if invalid. */
export function decodeAccountId(strkey: string): Uint8Array;
