# HTML Example - Mind Map SDK

This directory contains examples of how to integrate the **mindstage-sdk** into a web application.

---

## 🚀 Powered by [MindStage](https://mindstage.app)

**mindstage-sdk** is the open-source engine behind [MindStage](https://mindstage.app), the most powerful AI-driven mind mapping platform.

Check out the full [MindStage](https://mindstage.app) for:

- 🤖 **AI Mind Map Generation**
- 📄 **Advanced Exports (PDF, SVG, High-Res PNG)**
- 🧪 **LaTeX Formula Support**
- 🤝 **Real-time Collaboration**

---

## 🛠 Usage Options

### 1. Simple Script Tag (Bundled)

Ideal for quick prototypes or non-modular environments.

- **File**: [index-bundle.html](./index-bundle.html)
- **Usage**: Uses the pre-compiled `dist/mindstage-sdk.js`.

### 2. ES Modules (Modern)

Ideal for modern web development workflows.

- **File**: [index.html](./index.html)
- **Usage**: Imports directly from `dist/index.js`.

---

## 🏃 How to Run

### Setup

Ensure the SDK is built:

```bash
npm run build:bundle
```

### Start Server

Run from the project root directory:

```bash
./examples/start-server.sh
```

Or use any static file server:

```bash
python3 -m http.server 8080
```

Open in your browser: `http://localhost:8080/examples/index.html`

---

## 📄 License

MIT © [MindStage](https://mindstage.app)
