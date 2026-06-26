import {
  strToBytes,
  bytesToStr,
  bytesToBinaryString,
  binaryStringToBytes,
} from "../utils/bytes.js";

export function base64Encode(text) {
  return btoa(bytesToBinaryString(strToBytes(text)));
}

export function base64Decode(text) {
  const cleaned = text.trim();
  if (cleaned === "") return "";
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    throw new Error("Invalid Base64: unexpected characters.");
  }
  let bin;
  try {
    bin = atob(cleaned);
  } catch (e) {
    throw new Error("Invalid Base64: malformed input.");
  }
  return bytesToStr(binaryStringToBytes(bin));
}
