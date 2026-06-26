import { useState, useRef } from "react";
import { TRANSFORM_MAP } from "../constants.js";
import { runTransform } from "../utils/transforms.js";
import CopyButton from "./CopyButton.jsx";
import OutputBox from "./OutputBox.jsx";

export default function PipelineView({
  order,
  input,
  mode,
  xorKey,
  onReorder,
  onRemove,
}) {
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

  // The final output is whichever step runs *last*. In encode mode that is the
  // last card in the chain; in decode mode the chain runs in reverse, so the
  // final result lands on the first card. Highlight by execution order, not by
  // on-screen position.
  const finalId = seq[seq.length - 1];

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
        const isFinal = id === finalId;
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
                {t.id === "xor" ? (
                  <span className="card-note">(Base64-wrapped)</span>
                ) : null}
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
                <CopyButton text={s.result.value || ""} disabled={s.failed} />
              </div>
            </div>
            <OutputBox result={s.result} />
          </div>
        );
      })}
    </div>
  );
}
