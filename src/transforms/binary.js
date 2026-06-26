import { strToBytes, bytesToStr } from "../utils/bytes.js";

export function binaryEncode(text) {
  const bytes = strToBytes(text);
  const parts = [];
  for (let i = 0; i < bytes.length; i++) {
    parts.push(bytes[i].toString(2).padStart(8, "0"));
  }
  return parts.join(" ");
}

export function binaryDecode(text) {
  const cleaned = text.replace(/\s+/g, "");
  if (cleaned === "") return "";
  if (!/^[01]+$/.test(cleaned)) {
    throw new Error("Invalid Binary: only 0 and 1 allowed.");
  }
  if (cleaned.length % 8 !== 0) {
    throw new Error("Invalid Binary: length must be a multiple of 8 bits.");
  }
  const bytes = new Uint8Array(cleaned.length / 8);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substr(i * 8, 8), 2);
  }
  return bytesToStr(bytes);
}
