import { TRANSFORMS } from "../constants.js";

export default function Footer() {
  return (
    <footer className="footer">
      <span>All processing is local — nothing leaves your browser.</span>
      <span>{TRANSFORMS.length} transforms · no external libraries</span>
    </footer>
  );
}
