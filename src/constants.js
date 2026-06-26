import { base64Encode, base64Decode } from "./transforms/base64.js";
import { base32Encode, base32Decode } from "./transforms/base32.js";
import { hexEncode, hexDecode } from "./transforms/hex.js";
import { urlEncode, urlDecode } from "./transforms/url.js";
import { htmlEncode, htmlDecode } from "./transforms/html.js";
import { rot13, rot47 } from "./transforms/rot.js";
import { binaryEncode, binaryDecode } from "./transforms/binary.js";
import { xorEncode, xorDecode } from "./transforms/xor.js";

// Maximum allowed XOR key length. Lives here as the single source of truth and
// is imported by xor.js (validation) and XorKeyInput.jsx (UI bounds).
export const XOR_KEY_MAX = 256;

// The transform registry — the single source of truth for which transforms
// exist and how they encode/decode. Nothing else assembles this list.
export const TRANSFORMS = [
  { id: "base64", name: "Base64", encode: base64Encode, decode: base64Decode },
  { id: "base32", name: "Base32", encode: base32Encode, decode: base32Decode },
  { id: "hex", name: "Hex", encode: hexEncode, decode: hexDecode },
  { id: "url", name: "URL", encode: urlEncode, decode: urlDecode },
  { id: "html", name: "HTML Entities", encode: htmlEncode, decode: htmlDecode },
  { id: "rot13", name: "ROT13", encode: rot13, decode: rot13 },
  { id: "rot47", name: "ROT47", encode: rot47, decode: rot47 },
  { id: "binary", name: "Binary", encode: binaryEncode, decode: binaryDecode },
  { id: "xor", name: "XOR", encode: xorEncode, decode: xorDecode, needsKey: true },
];

export const TRANSFORM_MAP = TRANSFORMS.reduce((m, t) => {
  m[t.id] = t;
  return m;
}, {});
