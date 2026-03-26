<template>
  <div class="page">
    <header class="header">
      <div>
        <p class="eyebrow">MindStage SDK · Vue 3</p>
        <h1>Mind Map Rendering Demo</h1>
      </div>
      <p class="subtitle">
        Use <code>import { renderMindMapFromJSON } from 'mindstage-sdk'</code>
        to mount the built SDK output and render an SVG mind map in one call.
      </p>
    </header>

    <section class="card">
      <div class="toolbar">
        <button class="btn" @click="regenerate">Regenerate Demo</button>
        <div class="zoom">
          <button class="icon-btn" @click="zoomOut" aria-label="Zoom out">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 12h10" />
            </svg>
          </button>
          <span class="zoom-label">{{ Math.round(scale * 100) }}%</span>
          <button class="icon-btn" @click="zoomIn" aria-label="Zoom in">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 7v10M7 12h10" />
            </svg>
          </button>
        </div>
        <label class="toggle">
          <input v-model="collapsible" type="checkbox" />
          <span>Enable Collapse</span>
        </label>
        <span class="status" :class="status.type">{{ status.text }}</span>
      </div>
      <div ref="canvasRef" class="canvas"></div>
    </section>

    <footer class="footer">
      This demo validates the packaged SDK output and can be shared directly as user-facing guidance.
    </footer>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { renderMindMapFromJSON } from 'mindstage-sdk';

const status = ref({ type: 'idle', text: 'Idle' });
const collapsible = ref(true);
const canvasRef = ref(null);
let mountHandle = null;
const scale = ref(1);

const createNode = (id, content, children = []) => ({
  id,
  content,
  meta: { collapsed: false },
  children,
});

const buildMindMap = () =>
  createNode('root', 'MindStage SDK', [
    createNode('usage', 'Quick Start', [
      createNode('usage-install', 'npm install'),
      createNode('usage-import', 'ESM import'),
      createNode('usage-vue', 'Vue 3 demo'),
    ]),
    createNode('render', 'Rendering', [
      createNode('render-layout', 'Auto layout'),
      createNode('render-svg', 'SVG output'),
      createNode('render-style', 'Style options'),
    ]),
    createNode('export', 'Export', [
      createNode('export-svg', 'SVG / PNG'),
      createNode('export-json', 'JSON sync'),
    ]),
  ]);

const mindMapData = ref(buildMindMap());

const renderMindMap = () => {
  status.value = { type: 'loading', text: 'Rendering…' };

  try {
    if (!mountHandle && canvasRef.value) {
      mountHandle = renderMindMapFromJSON(canvasRef.value, mindMapData.value, {
        backgroundColor: '#f8f4ee',
        padding: 32,
        collapsible: collapsible.value,
        scale: scale.value,
        layoutOptions: {
          layoutDirection: 'left-right',
          spacing: { horizontal: 70, vertical: 28 },
        },
      });
    } else if (mountHandle) {
      mountHandle.update(mindMapData.value, {
        collapsible: collapsible.value,
        scale: scale.value,
      });
    }
    status.value = { type: 'success', text: 'Rendered' };
  } catch (error) {
    status.value = {
      type: 'error',
      text: error instanceof Error ? error.message : 'Render failed',
    };
  }
};

const regenerate = () => {
  mindMapData.value = buildMindMap();
  renderMindMap();
};

const zoomIn = () => {
  scale.value = Math.min(2.5, Math.round((scale.value + 0.1) * 10) / 10);
  renderMindMap();
};

const zoomOut = () => {
  scale.value = Math.max(0.4, Math.round((scale.value - 0.1) * 10) / 10);
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
