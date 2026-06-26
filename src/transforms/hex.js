import { strToBytes, bytesToStr } from "../utils/bytes.js";

export function hexEncode(text) {
  const bytes = strToBytes(text);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

export function hexDecode(text) {
  const cleaned = text.replace(/\s+/g, "").replace(/^0x/i, "");
  if (cleaned === "") return "";
  if (cleaned.length % 2 !== 0) {
    throw new Error("Invalid Hex: odd number of digits.");
  }
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
    throw new Error("Invalid Hex: non-hex characters.");
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  }
  return bytesToStr(bytes);
}
