<template>
  <div class="page">
    <header class="header">
      <div>
        <p class="eyebrow">MindStage SDK · Vue 3</p>
        <h1>脑图渲染验证 Demo</h1>
      </div>
      <p class="subtitle">
        通过 <code>import { renderMindMapFromJSON } from 'mindstage-sdk'</code>
        直接引用项目打包产物，一行生成 SVG 脑图。
      </p>
    </header>

    <section class="card">
      <div class="toolbar">
        <button class="btn" @click="regenerate">重新生成示例</button>
        <label class="toggle">
          <input v-model="collapsible" type="checkbox" />
          <span>支持展开/收起</span>
        </label>
        <span class="status" :class="status.type">{{ status.text }}</span>
      </div>
      <div ref="canvasRef" class="canvas"></div>
    </section>

    <footer class="footer">
      当前示例用于验证 SDK 打包产物是否可用，可直接复制这套引入方式给用户。
    </footer>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { renderMindMapFromJSON } from 'mindstage-sdk';

const status = ref({ type: 'idle', text: '等待渲染' });
const collapsible = ref(true);
const canvasRef = ref(null);
let mountHandle = null;

const createNode = (id, content, children = []) => ({
  id,
  content,
  meta: { collapsed: false },
  children,
});

const buildMindMap = () =>
  createNode('root', 'MindStage SDK', [
    createNode('usage', '快速接入', [
      createNode('usage-install', 'npm 安装'),
      createNode('usage-import', 'ESM import'),
      createNode('usage-vue', 'Vue 3 组件'),
    ]),
    createNode('render', '渲染引擎', [
      createNode('render-layout', '自动布局'),
      createNode('render-svg', 'SVG 输出'),
      createNode('render-style', '样式配置'),
    ]),
    createNode('export', '导出能力', [
      createNode('export-svg', 'SVG / PNG'),
      createNode('export-json', 'JSON 互转'),
    ]),
  ]);

const mindMapData = ref(buildMindMap());

const renderMindMap = () => {
  status.value = { type: 'loading', text: '正在生成脑图…' };

  try {
    if (!mountHandle && canvasRef.value) {
      mountHandle = renderMindMapFromJSON(canvasRef.value, mindMapData.value, {
        backgroundColor: '#f8f4ee',
        padding: 32,
        collapsible: collapsible.value,
        layoutOptions: {
          layoutDirection: 'left-right',
          spacing: { horizontal: 70, vertical: 28 },
        },
      });
    } else if (mountHandle) {
      mountHandle.update(mindMapData.value, {
        collapsible: collapsible.value,
      });
    }
    status.value = { type: 'success', text: '渲染完成' };
  } catch (error) {
    status.value = {
      type: 'error',
      text: error instanceof Error ? error.message : '渲染失败',
    };
  }
};

const regenerate = () => {
  mindMapData.value = buildMindMap();
  renderMindMap();
};

onMounted(renderMindMap);
watch(collapsible, renderMindMap);
onBeforeUnmount(() => {
  if (mountHandle) {
    mountHandle.unmount();
    mountHandle = null;
  }
});
</script>
