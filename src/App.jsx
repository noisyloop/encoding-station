/*
 * Encoding Station — client-side multi-transform encoder/decoder.
 *
 * Security notes:
 *  - All user input is treated as plain text. Output is rendered exclusively
 *    via React children (text nodes); there is no dangerouslySetInnerHTML,
 *    no innerHTML assignment, and no eval()/Function() anywhere.
 *  - The XOR key is length-bounded and validated before use.
 *  - Every transform runs inside a try/catch (see runTransform) so a single
 *    failure is surfaced as a per-card error rather than crashing the app.
 */

import { useState, useMemo, useCallback } from "react";
import { TRANSFORMS, XOR_KEY_MAX } from "./constants.js";
import { reinsert } from "./utils/transforms.js";
import Header from "./components/Header.jsx";
import Controls from "./components/Controls.jsx";
import PillBar from "./components/PillBar.jsx";
import XorKeyInput from "./components/XorKeyInput.jsx";
import ParallelView from "./components/ParallelView.jsx";
import PipelineView from "./components/PipelineView.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
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

  const isOn = useCallback(
    (id) => (appMode === "parallel" ? !!active[id] : pipeline.includes(id)),
    [appMode, active, pipeline]
  );

  return (
    <>
      <Header />

      <Controls
        appMode={appMode}
        setAppMode={setAppMode}
        direction={direction}
        setDirection={setDirection}
      />

      <textarea
        className="input"
        placeholder="Enter text to process…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        spellCheck={false}
        autoComplete="off"
      />

      {xorActiveSomewhere ? (
        <XorKeyInput xorKey={xorKey} setXorKey={setXorKey} keyError={keyError} />
      ) : null}

      <PillBar isOn={isOn} onToggle={togglePill} />

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

      <Footer />
    </>
  );
}
