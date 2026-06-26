export default function Controls({ appMode, setAppMode, direction, setDirection }) {
  return (
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
  );
}
