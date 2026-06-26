/*
 * Byte helpers (UTF-8 safe).
 *
 * btoa()/atob() operate on "binary strings" — JS strings whose code units are
 * each a single byte in the 0x00–0xFF (Latin-1) range. The two converter
 * helpers below bridge between real Uint8Array byte arrays and that string
 * representation so arbitrary bytes can round-trip through Base64.
 */

const enc = new TextEncoder();
const dec = new TextDecoder("utf-8", { fatal: true });

export function strToBytes(str) {
  return enc.encode(str);
}

export function bytesToStr(bytes) {
  // fatal:true throws on invalid UTF-8 — caught by the transform wrapper.
  return dec.decode(bytes);
}

export function bytesToBinaryString(bytes) {
  // Pack each byte into one UTF-16 code unit (0x00–0xFF) so the resulting
  // string is a valid argument for btoa().
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

export function binaryStringToBytes(bin) {
  // Inverse of bytesToBinaryString: read each code unit back out as a single
  // byte. The 0xff mask discards any stray high bits so the result is always a
  // clean byte array even if the input string contains out-of-range units.
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 0xff;
  return out;
}
