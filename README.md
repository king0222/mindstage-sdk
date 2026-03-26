# 🧠 MindStage SDK

<p align="center">
  <img src="https://www.mindstage.app/favicon.ico" width="80" height="80" alt="MindStage Logo">
</p>

<p align="center">
  <strong>The professional, lightweight core mind map engine that powers <a href="https://www.mindstage.app">MindStage.app</a>.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/mindstage-sdk"><img src="https://img.shields.io/npm/v/mindstage-sdk.svg?style=for-the-badge&color=6366f1" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License: MIT"></a>
  <a href="http://makeapullrequest.com"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome"></a>
</p>

<a href="https://www.mindstage.app" target="_blank">
  <img src="https://www.mindstage.app/_next/image?url=%2Fimages%2Flanding%2Feditor_preview.webp&w=3840&q=75" alt="MindStage SDK" style="width: 100%; height: auto;">
</a>

---

## 🌟 Overview

**MindStage SDK** is a headless, high-performance mind map rendering engine. Built with TypeScript, it decouples layout calculations from visual rendering, giving you absolute control over how your mind maps look and behave.

Whether you're building a web-based editor, a preview tool, or a complex visualization, MindStage SDK provides the battle-tested foundation you need.


---

## ✨ Key Features

- 🚀 **Lightning Fast**: Optimized layout algorithms adapted from Walker's Algorithm for real-time responsiveness.
- 🎨 **Headless First**: Calculate layouts independently and render to **SVG strings** or **HTML5 Canvas**.
- 🧩 **Native Interactivity**: Built-in support for **node collapse/expand**, custom branch coloring, and directional layouts.
- 🌈 **Modern Aesthetics**: Professional default styles with support for custom palettes and hierarchy themes.
- 🛡️ **Type-Safe**: Written in TypeScript with full type definitions for a seamless developer experience.
- 📦 **Zero Bloat**: Lightweight core with minimal dependencies (`nanoid`, `zod`).

---

## 🚀 Quick Start

### Installation

```bash
npm install mindstage-sdk
```

### Basic Usage: Render to SVG

Get a beautiful mind map on your page in seconds.

```typescript
import { renderMindMapFromJSON } from 'mindstage-sdk';

const data = {
  content: 'Startup Journey',
  children: [
    { content: 'Product', children: [{ content: 'MVP' }, { content: 'Beta' }] },
    { content: 'Marketing', children: [{ content: 'SEO' }, { content: 'Social' }] },
  ],
};

const handle = renderMindMapFromJSON('#map-container', data, {
  backgroundColor: '#ffffff',
  padding: 60,
  collapsible: true
});

// Zero interaction code: click nodes to collapse/expand automatically.
// Optional: handle.update(nextData, nextOptions); handle.unmount();
```

---

## 🧾 Mind Map Options (Quick Reference)

Use these options with `renderMindMapFromJSON` for fast integration:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `backgroundColor` | `string` | `#ffffff` | SVG background color. |
| `padding` | `number` | `20` | Inner padding around the map. |
| `scale` | `number` | `1` | Render scale for zooming. |
| `collapsible` | `boolean` | `true` | Render expand/collapse controls and enable click-to-toggle. |
| `showConnections` | `boolean` | `true` | Show or hide connecting lines. |
| `branchPalette` | `string[]` | built-in palette | Custom branch colors for level-1 nodes. |
| `highlightNodeIds` | `string[]` | `[]` | Highlight specific node IDs. |
| `selectedNodeIds` | `string[]` | `[]` | Mark specific node IDs as selected. |
| `layoutOptions.layoutDirection` | `'left' \| 'right' \| 'mixed' \| 'left-right'` | `'left-right'` | Layout direction. |
| `layoutOptions.spacing` | `{ horizontal: number; vertical: number }` | `{60, 30}` | Horizontal/vertical spacing. |
| `layoutOptions.nodeSize` | `{ width: number; height: number }` | `{100, 30}` | Base node size. |
| `layoutOptions.nodeVisualStyle` | `'rectangle' \| 'underline' \| 'circle' \| 'card'` | `'rectangle'` | Node visual style. |

**Return value**
- `renderMindMapFromJSON(data, options)` returns an SVG string.
- `renderMindMapFromJSON(container, data, options)` returns a handle with `update(nextData, nextOptions)` and `unmount()`.

---

## 🎨 Advanced Configuration

The SDK offers granular control via the `MindMapRenderer` class.

```typescript
import { MindMapRenderer } from 'mindstage-sdk';

const renderer = new MindMapRenderer();
const result = renderer.renderFromJSON(data, {
  branchPalette: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'], // Custom colors
  layoutOptions: {
    layoutDirection: 'left-right', // 'right', 'left', 'left-right'
    spacing: { horizontal: 80, vertical: 30 }
  }
});

if (result.success) {
  // Use results: result.svg, result.nodes, result.connections
}
```

---

## 🏛 Architecture

MindStage SDK consists of three decoupled layers:

1.  **Layout Engine**: The brain. Calculates node positions, collision detection, and connection paths.
2.  **Render Engine**: The eye. Translates layout data into SVG elements or Canvas drawing commands.
3.  **MindMap Engine**: The heart. Manages the hierarchical data structure and state updates.

---

## 💎 Powered by [MindStage.app](https://www.mindstage.app)

Integrating the SDK is just the beginning. The full **MindStage** platform offers:

- 🤖 **AI Mind Maps**: Generate complex structures from simple prompts.
- 📑 **Formula Support**: Full LaTeX rendering for technical documentation.
- 📤 **Premium Exports**: High-resolution PDF, SVG, and Image exports.
- ☁️ **Cloud Storage**: Seamless sync across all your devices.

**👉 [Try MindStage.app for Free](https://www.mindstage.app)**

---

## 🛠 Development Workflow

### Setup

```bash
# Install dependencies
npm install

# build
npm run build

# Run local preview server
npm run serve:examples
```

### Quality & Testing

```bash
npm run lint    # Code quality check
npm run format  # Auto-format code
npm run test    # Run unit tests
```

---

## 🤝 Contributing

We love contributions! Whether it's fixing bugs, adding features, or improving documentation, please read our [Contributing Guide](./CONTRIBUTING.md) to get started.

---

## 📄 License

MIT © [MindStage](https://www.mindstage.app)
