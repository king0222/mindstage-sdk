# MindStage SDK Vue 3 Demo

This example shows how to use Vue 3 with ESM import to load the **mindstage-sdk** build output and mount a mind map in one call.

## 使用方式

```bash
# Build the SDK from the repo root
npm run build

# Enter the demo
cd examples/vue3-demo
npm install
npm run dev
```

Open: `http://localhost:5173`

## 关键点

- Use `import { renderMindMapFromJSON } from 'mindstage-sdk'`.
- `vite.config.js` aliases to `dist/index.js` to ensure the built output is used.
- Use the `collapsible` option to enable expand/collapse controls.
- Use the zoom buttons to scale the mind map.
