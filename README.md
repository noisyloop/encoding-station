# Encoding Station

A client-side, multi-transform encoder/decoder with an Ubuntu terminal
aesthetic. No transform libraries, no server — every byte is processed locally
in your browser.

## Features

- **Parallel mode** — run all selected transforms simultaneously on the input,
  one result card each, with copy-to-clipboard.
- **Pipeline mode** — chain transforms in an ordered, drag-reorderable list
  where each step feeds the next; the final output is highlighted.
- **Encode / Decode** toggle for every transform.
- **Transforms:** Base64, Base32, Hex, URL, HTML entities, ROT13, ROT47,
  Binary, and XOR (with a length-bounded key).
- Per-card error states (e.g. invalid Base64 on decode).
- Pill checkboxes to toggle which transforms are active.
- Responsive, mobile-friendly layout.

## Security

- All input is treated as plain text and rendered exclusively as React text
  nodes. There is **no** `dangerouslySetInnerHTML`, no `innerHTML` assignment,
  and no `eval()` / `Function()` anywhere.
- HTML-entity decoding is done with a manual table + numeric parser — it never
  touches the DOM parser.
- The XOR key is validated and capped at 256 characters.

## Stack

- [Vite](https://vitejs.dev/) + `@vitejs/plugin-react`
- React 18 + ReactDOM, imported as ES modules
- JetBrains Mono via Google Fonts

The only runtime dependencies are `react` and `react-dom`; all encoding logic
is hand-written, dependency-free JavaScript.

## Project structure

```
src/
├── main.jsx          # ReactDOM.createRoot entry point
├── App.jsx           # App component + top-level state
├── index.css         # all styles
├── constants.js      # TRANSFORMS registry, TRANSFORM_MAP, XOR_KEY_MAX
├── transforms/       # one file per codec, each a pair of named exports
├── utils/            # byte helpers + runTransform / reinsert
└── components/       # Header, Controls, PillBar, views, cards, …
```

`constants.js` is the single source of truth: it imports every transform and
assembles the `TRANSFORMS` array and `TRANSFORM_MAP`.

## Local preview

```bash
npm install
npm run dev
```

Then open the printed local URL (default http://localhost:5173).

## Build & deploy to Vercel

```bash
npm run build     # outputs static assets to dist/
npm run preview   # preview the production build locally
```

Vercel auto-detects Vite: it runs `npm run build` and serves `dist/`.
`vercel.json` adds a few hardening response headers.
