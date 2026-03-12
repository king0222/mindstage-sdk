# Developer Guide - `mindstage-sdk`

This guide covers the internal architecture, local development setup, and debugging strategies for the core Mind Map SDK.

## 🏗 Architecture Overview

The SDK is split into several core components:

- **Models**: `models/NodeModel.ts` defines the logical structure of a mind map node.
- **Engine**:
  - `LayoutEngine.ts`: Logic for calculating node positions (X, Y) and dimensions based on content.
  - `RenderEngine.ts`: Converts the layout-calculated structure into SVG or Canvas paths.
  - `MindMapEngine.ts`: Orchestrates the layout and rendering process.
- **Utils**: Helper functions for IDs, colors, and text measurement.

## 🚀 Local Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development (Watch Mode)**:
   This runs the TypeScript compiler in watch mode.
   ```bash
   npm run dev
   ```

3. **Run Examples**:
   To see your changes in a browser:
   ```bash
   npm run build:bundle
   npm run serve:examples
   ```
   Then visit `http://localhost:8080/examples/index.html`.

## 🔍 Debugging

### Debugging in VS Code (Recommended)

We provide pre-configured launch tasks in `.vscode/launch.json`:

1. Open the "Run and Debug" view (`Ctrl+Shift+D`).
2. Select a configuration:
   - **Debug Example: Basic Usage**: Debugs the `examples/basic-usage.ts` script.
   - **Debug All Tests**: Runs all Vitest tests with the debugger attached.
3. Press `F5` to start debugging.

### Debugging with `tsx` (Command Line)

You can run and debug example scripts directly using `tsx`:

```bash
npx tsx examples/basic-usage.ts
```

### Source Maps
Source maps are enabled by default in `tsconfig.json`. This allows you to set breakpoints directly in the `.ts` files when debugging in VS Code or Chrome DevTools.

## 🛠 Adding New Features

1. **Define Types**: Update `types/` if adding new node properties.
2. **Update Model**: Reflect type changes in `models/NodeModel.ts`.
3. **Adjust Layout**: If the feature affects positioning, update `engine/LayoutEngine.ts`.
4. **Update Renderer**: Implement the visual change in `engine/RenderEngine.ts`.
5. **Vaildate**: Add a test or Update an example in the `examples/` directory.

## ✅ Code Quality

Before submitting a PR, please ensure:
- `npm run lint`: Passes without errors.
- `npm run format`: All files are formatted.
- `npm run type-check`: No TypeScript errors.
- `npm run build`: The project builds successfully.

---
Powered by [MindStage](https://mindstage.app)
