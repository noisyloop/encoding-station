# Encoding Station

A client-side, multi-transform encoder/decoder with an Ubuntu terminal
aesthetic. No build step, no external libraries, no server — every byte is
processed locally in your browser.

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

- React 18 + ReactDOM (UMD, via CDN)
- `@babel/standalone` compiles the single `app.jsx` in the browser
- JetBrains Mono via Google Fonts

## Local preview

It's static — open `index.html` through any static server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

(Opening the file directly via `file://` also mostly works, but a server is
recommended so the browser fetches `app.jsx` without cross-origin file
restrictions.)

## Deploy to Vercel

This is a zero-config static deployment. From the project root:

```bash
vercel
```

Vercel serves `index.html` directly; `vercel.json` only adds a few hardening
response headers.
