import { strToBytes, bytesToStr } from "../utils/bytes.js";

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(text) {
  const bytes = strToBytes(text);
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += B32_ALPHABET[(value << (5 - bits)) & 31];
  }
  while (out.length % 8 !== 0) out += "=";
  return out;
}

export function base32Decode(text) {
  const cleaned = text.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  if (cleaned === "") return "";
  if (!/^[A-Z2-7]*$/.test(cleaned)) {
    throw new Error("Invalid Base32: unexpected characters.");
  }
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = B32_ALPHABET.indexOf(cleaned[i]);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return bytesToStr(new Uint8Array(bytes));
}
