import {
  strToBytes,
  bytesToStr,
  bytesToBinaryString,
  binaryStringToBytes,
} from "../utils/bytes.js";
import { XOR_KEY_MAX } from "../constants.js";

/*
 * XOR is symmetric — the same operation encodes and decodes. The output is
 * Base64 of the XOR'd bytes so the result is always printable and round-trips
 * cleanly. XOR_KEY_MAX is read at call time (not module-eval time), so the
 * circular import with constants.js is safe.
 */

export function validateXorKey(key) {
  if (key == null || key.length === 0) {
    throw new Error("XOR requires a key.");
  }
  if (key.length > XOR_KEY_MAX) {
    throw new Error("XOR key too long (max " + XOR_KEY_MAX + " chars).");
  }
}

export function xorBytes(bytes, keyBytes) {
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return out;
}

export function xorEncode(text, key) {
  validateXorKey(key);
  const keyBytes = strToBytes(key);
  const result = xorBytes(strToBytes(text), keyBytes);
  return btoa(bytesToBinaryString(result));
}

export function xorDecode(text, key) {
  validateXorKey(key);
  const cleaned = text.trim();
  if (cleaned === "") return "";
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    throw new Error("XOR decode expects Base64 input.");
  }
  let bin;
  try {
    bin = atob(cleaned);
  } catch (e) {
    throw new Error("XOR decode: malformed Base64 input.");
  }
  const keyBytes = strToBytes(key);
  const result = xorBytes(binaryStringToBytes(bin), keyBytes);
  return bytesToStr(result);
}
