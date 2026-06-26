import { TRANSFORM_MAP } from "../constants.js";
import { runTransform } from "../utils/transforms.js";
import CopyButton from "./CopyButton.jsx";
import OutputBox from "./OutputBox.jsx";

export default function ParallelView({ activeIds, input, mode, xorKey }) {
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
                {t.id === "xor" ? (
                  <span className="card-note">(Base64-wrapped)</span>
                ) : null}
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
