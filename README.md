# Motion DevTools

TypeScript + Vite conversion of the Motion DevTools Chrome extension (originally store build `2.0.0`). Use this project to debug page-component detection and keep working on the extension.

## Commands

```bash
pnpm install
pnpm dev      # Vite + CRXJS, source maps on
pnpm build    # typecheck and write an unpacked extension to dist/
```

Load `dist/` as an unpacked extension at `chrome://extensions` (Developer mode → Load unpacked).

## Layout

```
src/
  service-worker/   Background service worker (ports, recording flags, reload clear)
  context/          Page scripts
    bridge.ts       Isolated content script: injects the client and relays messages
    client.ts       Page-world detector (CSS + Motion One hook)
    store.ts        Recording / inspect state
    plugins/        css-animation, css-transition, motion-one
    runtime/        Motion One playback used when scrubbing
  editor/           DevTools panel shell (fonts, CSS, loads the original UI)
  devtools/         Registers the Motion panel
  shared/           Message and animation types
public/
  vendor/           Original editor UI bundle
  icons/
```

Detection, recording, and messaging are TypeScript. The timeline UI is still the original prebuilt bundle in `public/vendor/editor.bundle.js` — rewrite that incrementally from `src/editor` when you are ready.
