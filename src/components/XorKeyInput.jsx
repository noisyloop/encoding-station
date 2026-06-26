import { XOR_KEY_MAX } from "../constants.js";

export default function XorKeyInput({ xorKey, setXorKey, keyError }) {
  return (
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
  );
}
