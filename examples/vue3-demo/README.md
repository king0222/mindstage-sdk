# MindStage SDK Vue 3 Demo

这个示例展示了如何用 Vue 3 通过 ESM import 方式引入 **mindstage-sdk** 的打包产物，并用升级后的接口一行挂载脑图。

## 使用方式

```bash
# 在项目根目录先确保 SDK 已构建
npm run build

# 进入 demo
cd examples/vue3-demo
npm install
npm run dev
```

打开浏览器访问：`http://localhost:5173`

## 关键点

- 代码中使用 `import { renderMindMapFromJSON } from 'mindstage-sdk'`。
- `vite.config.js` 通过别名指向 `dist/index.js`，确保使用的是项目打包后的产物。
- 通过 `collapsible` 配置项控制是否渲染展开/收起按钮。
- 点击节点旁的圆点按钮可展开/收起子节点。
