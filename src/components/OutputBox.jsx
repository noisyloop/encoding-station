export default function OutputBox({ result }) {
  if (result.error) {
    return <div className="out error">⚠ {result.error}</div>;
  }
  if (result.value === "") {
    return <div className="out empty">(empty result)</div>;
  }
  // Rendered as a text child only — no HTML injection possible.
  return <div className="out">{result.value}</div>;
}
