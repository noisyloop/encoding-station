/*
 * Encoding Station — client-side multi-transform encoder/decoder.
 *
 * Security notes:
 *  - All user input is treated as plain text. Output is rendered exclusively
 *    via React children (text nodes); there is no dangerouslySetInnerHTML,
 *    no innerHTML assignment, and no eval()/Function() anywhere.
 *  - The XOR key is length-bounded and validated before use.
 *  - Every transform runs inside try/catch so a single failure is surfaced
 *    as a per-card error rather than crashing the app.
 */

const { useState, useMemo, useCallback, useRef } = React;

/* ---------------------------------------------------------------------------
 * Byte helpers (UTF-8 safe)
 * ------------------------------------------------------------------------- */

const enc = new TextEncoder();
const dec = new TextDecoder("utf-8", { fatal: true });

function strToBytes(str) {
  return enc.encode(str);
}

function bytesToStr(bytes) {
  // fatal:true throws on invalid UTF-8 — caught by the transform wrapper.
  return dec.decode(bytes);
}

function bytesToBinaryString(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

function binaryStringToBytes(bin) {
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 0xff;
  return out;
}

/* ---------------------------------------------------------------------------
 * Base64
 * ------------------------------------------------------------------------- */

function base64Encode(text) {
  return btoa(bytesToBinaryString(strToBytes(text)));
}

function base64Decode(text) {
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

/* ---------------------------------------------------------------------------
 * Base32 (RFC 4648)
 * ------------------------------------------------------------------------- */

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(text) {
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

function base32Decode(text) {
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

/* ---------------------------------------------------------------------------
 * Hex
 * ------------------------------------------------------------------------- */

function hexEncode(text) {
  const bytes = strToBytes(text);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function hexDecode(text) {
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

/* ---------------------------------------------------------------------------
 * URL encoding
 * ------------------------------------------------------------------------- */

function urlEncode(text) {
  return encodeURIComponent(text);
}

function urlDecode(text) {
  try {
    return decodeURIComponent(text);
  } catch (e) {
    throw new Error("Invalid URL encoding: malformed percent-sequence.");
  }
}

/* ---------------------------------------------------------------------------
 * HTML entities
 * ------------------------------------------------------------------------- */

const HTML_NAMED = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function htmlEncode(text) {
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

function htmlDecode(text) {
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

/* ---------------------------------------------------------------------------
 * ROT13 / ROT47
 * ------------------------------------------------------------------------- */

function rot13(text) {
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function rot47(text) {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code >= 33 && code <= 126) {
      out += String.fromCharCode(33 + ((code - 33 + 47) % 94));
    } else {
      out += ch;
    }
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * Binary
 * ------------------------------------------------------------------------- */

function binaryEncode(text) {
  const bytes = strToBytes(text);
  const parts = [];
  for (let i = 0; i < bytes.length; i++) {
    parts.push(bytes[i].toString(2).padStart(8, "0"));
  }
  return parts.join(" ");
}

function binaryDecode(text) {
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

/* ---------------------------------------------------------------------------
 * XOR (symmetric — same op for encode/decode). Output is Base64 of the
 * XOR'd bytes so the result is always printable and round-trips cleanly.
 * ------------------------------------------------------------------------- */

const XOR_KEY_MAX = 256;

function validateXorKey(key) {
  if (key == null || key.length === 0) {
    throw new Error("XOR requires a key.");
  }
  if (key.length > XOR_KEY_MAX) {
    throw new Error("XOR key too long (max " + XOR_KEY_MAX + " chars).");
  }
}

function xorBytes(bytes, keyBytes) {
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return out;
}

function xorEncode(text, key) {
  validateXorKey(key);
  const keyBytes = strToBytes(key);
  const result = xorBytes(strToBytes(text), keyBytes);
  return btoa(bytesToBinaryString(result));
}

function xorDecode(text, key) {
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

/* ---------------------------------------------------------------------------
 * Transform registry
 * ------------------------------------------------------------------------- */

const TRANSFORMS = [
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

const TRANSFORM_MAP = TRANSFORMS.reduce((m, t) => {
  m[t.id] = t;
  return m;
}, {});

/*
 * Run one transform. Returns { value } on success or { error } on failure.
 * `input` is always a string; transforms never receive raw HTML/markup.
 */
function runTransform(transform, input, mode, xorKey) {
  try {
    const fn = mode === "decode" ? transform.decode : transform.encode;
    const value = transform.needsKey ? fn(input, xorKey) : fn(input);
    return { value };
  } catch (e) {
    return { error: e && e.message ? e.message : "Transform failed." };
  }
}

/* ---------------------------------------------------------------------------
 * Components
 * ------------------------------------------------------------------------- */

function CopyButton({ text, disabled }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  const onCopy = useCallback(() => {
    if (disabled) return;
    const done = () => {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1400);
    };
    const fallback = () => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        done();
      } catch (e) {
        /* clipboard unavailable — silently ignore */
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }, [text, disabled]);

  return (
    <button
      className={"btn" + (copied ? " copied" : "")}
      onClick={onCopy}
      disabled={disabled}
      type="button"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function OutputBox({ result }) {
  if (result.error) {
    return <div className="out error">⚠ {result.error}</div>;
  }
  if (result.value === "") {
    return <div className="out empty">(empty result)</div>;
  }
  // Rendered as a text child only — no HTML injection possible.
  return <div className="out">{result.value}</div>;
}

function ParallelView({ activeIds, input, mode, xorKey }) {
  if (activeIds.length === 0) {
    return (
      <div className="empty-state">
        No transforms selected. Toggle one of the pills above to begin
        <span className="blink"> ▌</span>
      </div>
    );
  }
  if (input === "") {
    return (
      <div className="empty-state">
        Awaiting input — type or paste text above to encode
        <span className="blink"> ▌</span>
      </div>
    );
  }
  return (
    <div className="cards">
      {activeIds.map((id) => {
        const t = TRANSFORM_MAP[id];
        const result = runTransform(t, input, mode, xorKey);
        return (
          <div className="card" key={id}>
            <div className="card-head">
              <div className="card-name">
                {t.name}
                {t.needsKey ? <span className="badge">key</span> : null}
              </div>
              <CopyButton text={result.value || ""} disabled={!!result.error} />
            </div>
            <OutputBox result={result} />
          </div>
        );
      })}
    </div>
  );
}

function PipelineView({ order, input, mode, xorKey, onReorder, onRemove }) {
  const dragId = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  if (order.length === 0) {
    return (
      <div className="empty-state">
        Pipeline is empty. Toggle transforms above to add steps
        <span className="blink"> ▌</span>
      </div>
    );
  }

  // Compute each step's output sequentially. In decode mode the chain is
  // applied in reverse so a pipeline round-trips against its encode order.
  const seq = mode === "decode" ? [...order].reverse() : order;
  let current = input;
  const steps = seq.map((id) => {
    const t = TRANSFORM_MAP[id];
    const result = runTransform(t, current, mode, xorKey);
    if (!result.error) current = result.value;
    return { id, t, result, failed: !!result.error };
  });
  // Map results back to display order (the on-screen chain order).
  const byId = {};
  steps.forEach((s) => (byId[s.id] = s));

  const handleDrop = (targetId) => {
    const from = dragId.current;
    setDragOver(null);
    dragId.current = null;
    if (from == null || from === targetId) return;
    onReorder(from, targetId);
  };

  return (
    <div className="cards">
      {order.map((id, displayIdx) => {
        const s = byId[id];
        const t = s.t;
        const isFinal = displayIdx === order.length - 1;
        return (
          <div
            key={id}
            className={
              "card draggable" +
              (isFinal ? " final" : "") +
              (dragOver === id ? " drag-over" : "")
            }
            draggable
            onDragStart={() => {
              dragId.current = id;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOver !== id) setDragOver(id);
            }}
            onDragLeave={() => {
              if (dragOver === id) setDragOver(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(id);
            }}
            onDragEnd={() => {
              dragId.current = null;
              setDragOver(null);
            }}
          >
            <div className="card-head">
              <div className="card-name">
                <span className="grip" title="Drag to reorder">
                  ⠿
                </span>
                <span className="step-index">{displayIdx + 1}.</span>
                {t.name}
                {t.needsKey ? <span className="badge">key</span> : null}
                {isFinal ? <span className="badge">final</span> : null}
              </div>
              <div className="step-controls">
                <button
                  className="icon-btn"
                  type="button"
                  title="Move up"
                  disabled={displayIdx === 0}
                  onClick={() => onReorder(id, order[displayIdx - 1])}
                >
                  ↑
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  title="Move down"
                  disabled={displayIdx === order.length - 1}
                  onClick={() => onReorder(id, order[displayIdx + 1])}
                >
                  ↓
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  title="Remove from pipeline"
                  onClick={() => onRemove(id)}
                >
                  ✕
                </button>
                <CopyButton
                  text={s.result.value || ""}
                  disabled={s.failed}
                />
              </div>
            </div>
            <OutputBox result={s.result} />
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const [appMode, setAppMode] = useState("parallel"); // parallel | pipeline
  const [direction, setDirection] = useState("encode"); // encode | decode
  const [input, setInput] = useState("");
  const [xorKey, setXorKey] = useState("");
  const [active, setActive] = useState({ base64: true, hex: true, rot13: true });
  const [pipeline, setPipeline] = useState(["base64"]);

  const xorActiveSomewhere =
    (appMode === "parallel" && active.xor) ||
    (appMode === "pipeline" && pipeline.includes("xor"));

  const keyError = useMemo(() => {
    if (!xorActiveSomewhere) return null;
    if (xorKey.length === 0) return "XOR is active — enter a key.";
    if (xorKey.length > XOR_KEY_MAX)
      return "Key too long (max " + XOR_KEY_MAX + ").";
    return null;
  }, [xorActiveSomewhere, xorKey]);

  const togglePill = useCallback(
    (id) => {
      if (appMode === "parallel") {
        setActive((prev) => ({ ...prev, [id]: !prev[id] }));
      } else {
        setPipeline((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
      }
    },
    [appMode]
  );

  const removeStep = useCallback((id) => {
    setPipeline((prev) => prev.filter((x) => x !== id));
  }, []);

  const activeIds = useMemo(
    () => TRANSFORMS.filter((t) => active[t.id]).map((t) => t.id),
    [active]
  );

  const isOn = (id) =>
    appMode === "parallel" ? !!active[id] : pipeline.includes(id);

  return (
    <React.Fragment>
      <header className="header">
        <span className="prompt">user@station:~$</span>
        <span className="title">Encoding Station</span>
        <span className="cursor" />
        <span className="subtitle">// client-side encode / decode toolkit</span>
      </header>

      <div className="controls">
        <div className="control-group">
          <span className="control-label">Mode</span>
          <div className="toggle">
            <button
              className={appMode === "parallel" ? "active" : ""}
              onClick={() => setAppMode("parallel")}
              type="button"
            >
              Parallel
            </button>
            <button
              className={appMode === "pipeline" ? "active" : ""}
              onClick={() => setAppMode("pipeline")}
              type="button"
            >
              Pipeline
            </button>
          </div>
        </div>

        <div className="control-group">
          <span className="control-label">Direction</span>
          <div className="toggle">
            <button
              className={direction === "encode" ? "active" : ""}
              onClick={() => setDirection("encode")}
              type="button"
            >
              Encode
            </button>
            <button
              className={direction === "decode" ? "active" : ""}
              onClick={() => setDirection("decode")}
              type="button"
            >
              Decode
            </button>
          </div>
        </div>
      </div>

      <textarea
        className="input"
        placeholder="Enter text to process…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        spellCheck={false}
        autoComplete="off"
      />

      {xorActiveSomewhere ? (
        <div className="xor-row">
          <label htmlFor="xorkey">XOR key:</label>
          <input
            id="xorkey"
            className="field"
            type="text"
            value={xorKey}
            maxLength={XOR_KEY_MAX}
            placeholder="secret"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setXorKey(e.target.value.slice(0, XOR_KEY_MAX))}
          />
          {keyError ? (
            <span className="field-error">{keyError}</span>
          ) : (
            <span className="hint">
              {xorKey.length}/{XOR_KEY_MAX} · XOR output is Base64
            </span>
          )}
        </div>
      ) : null}

      <div className="pills">
        {TRANSFORMS.map((t) => (
          <span
            key={t.id}
            className={"pill" + (isOn(t.id) ? " on" : "")}
            onClick={() => togglePill(t.id)}
            role="checkbox"
            aria-checked={isOn(t.id)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                togglePill(t.id);
              }
            }}
          >
            <span className="box">{isOn(t.id) ? "✓" : ""}</span>
            {t.name}
          </span>
        ))}
      </div>

      <div className="section-title">
        {appMode === "parallel" ? "parallel output" : "pipeline chain"}
      </div>

      {appMode === "parallel" ? (
        <ParallelView
          activeIds={activeIds}
          input={input}
          mode={direction}
          xorKey={xorKey}
        />
      ) : (
        <PipelineView
          order={pipeline}
          input={input}
          mode={direction}
          xorKey={xorKey}
          onReorder={(fromId, targetId) =>
            setPipeline((prev) => reinsert(prev, fromId, targetId))
          }
          onRemove={removeStep}
        />
      )}

      <footer className="footer">
        <span>All processing is local — nothing leaves your browser.</span>
        <span>{TRANSFORMS.length} transforms · no external libraries</span>
      </footer>
    </React.Fragment>
  );
}

/* Move `fromId` so it lands at the position of `targetId`. */
function reinsert(list, fromId, targetId) {
  if (fromId === targetId) return list;
  const next = list.filter((x) => x !== fromId);
  const targetIdx = next.indexOf(targetId);
  if (targetIdx === -1) return list;
  next.splice(targetIdx, 0, fromId);
  return next;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
