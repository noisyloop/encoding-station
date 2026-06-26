import { TRANSFORMS } from "../constants.js";

export default function PillBar({ isOn, onToggle }) {
  return (
    <div className="pills">
      {TRANSFORMS.map((t) => (
        <span
          key={t.id}
          className={"pill" + (isOn(t.id) ? " on" : "")}
          onClick={() => onToggle(t.id)}
          role="checkbox"
          aria-checked={isOn(t.id)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle(t.id);
            }
          }}
        >
          <span className="box">{isOn(t.id) ? "✓" : ""}</span>
          {t.name}
        </span>
      ))}
    </div>
  );
}
