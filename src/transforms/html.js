const HTML_NAMED = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

export function htmlEncode(text) {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (ch === "&") out += "&amp;";
    else if (ch === "<") out += "&lt;";
    else if (ch === ">") out += "&gt;";
    else if (ch === '"') out += "&quot;";
    else if (ch === "'") out += "&#39;";
    else if (code > 126) out += "&#" + code + ";";
    else out += ch;
  }
  return out;
}

export function htmlDecode(text) {
  // Manual entity resolution — deliberately avoids any DOM/innerHTML parsing.
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body) => {
    if (body[0] === "#") {
      let code;
      if (body[1] === "x" || body[1] === "X") {
        code = parseInt(body.slice(2), 16);
      } else {
        code = parseInt(body.slice(1), 10);
      }
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch (e) {
        return match;
      }
    }
    return HTML_NAMED[match] !== undefined ? HTML_NAMED[match] : match;
  });
}
