import { useState, useRef, useCallback } from "react";

export default function CopyButton({ text, disabled }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  const onCopy = useCallback(() => {
    if (disabled) return;
    const done = () => {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1400);
    };
    // Fallback for browsers without the async Clipboard API (or when it is
    // unavailable in an insecure context): create an off-screen <textarea>,
    // select it, and trigger the legacy, synchronous document.execCommand
    // ("copy"). It is deprecated but remains the only option in those
    // environments. Any failure here is non-fatal and silently ignored.
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
