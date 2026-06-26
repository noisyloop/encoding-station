/*
 * Run one transform. Returns { value } on success or { error } on failure.
 * `input` is always a string; transforms never receive raw HTML/markup.
 * Every transform runs inside this try/catch so a single failure surfaces as a
 * per-card error rather than crashing the app.
 */
export function runTransform(transform, input, mode, xorKey) {
  try {
    const fn = mode === "decode" ? transform.decode : transform.encode;
    const value = transform.needsKey ? fn(input, xorKey) : fn(input);
    return { value };
  } catch (e) {
    return { error: e && e.message ? e.message : "Transform failed." };
  }
}

/* Move `fromId` so it lands at the position of `targetId`. */
export function reinsert(list, fromId, targetId) {
  if (fromId === targetId) return list;
  const next = list.filter((x) => x !== fromId);
  const targetIdx = next.indexOf(targetId);
  if (targetIdx === -1) return list;
  next.splice(targetIdx, 0, fromId);
  return next;
}
