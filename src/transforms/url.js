export function urlEncode(text) {
  return encodeURIComponent(text);
}

export function urlDecode(text) {
  try {
    return decodeURIComponent(text);
  } catch (e) {
    throw new Error("Invalid URL encoding: malformed percent-sequence.");
  }
}
