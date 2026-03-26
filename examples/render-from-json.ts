/**
 * Render from JSON Example
 *
 * This example demonstrates how to:
 * - Render mind map from JSON string
 * - Support different JSON formats
 * - Customize layout and render options
 */

import { MindMapRenderer, renderMindMapFromJSON } from '../utils/mindMapRenderer';

// Example 1: Render from complete MindMap JSON
console.log('=== Example 1: Complete MindMap JSON ===');

const completeMindMapJSON = JSON.stringify({
  id: 'mindmap_1',
  root: {
    id: 'node_1',
    parentId: null,
    type: 'text',
    content: 'Root Node',
    meta: {},
    children: [
      {
        id: 'node_2',
        parentId: 'node_1',
        type: 'text',
        content: 'Child 1',
        meta: {},
        children: [
          {
            id: 'node_3',
            parentId: 'node_2',
            type: 'text',
            content: 'Grandchild 1.1',
            meta: {},
            children: [],
          },
        ],
      },
      {
        id: 'node_4',
        parentId: 'node_1',
        type: 'text',
        content: 'Child 2',
        meta: {},
        children: [],
      },
    ],
  },
  metadata: {
    title: 'My Mind Map',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: '1.0.0',
  },
});

const renderer1 = new MindMapRenderer();
const result1 = renderer1.renderFromJSON(completeMindMapJSON, {
  backgroundColor: '#ffffff',
  scale: 1,
  layoutOptions: {
    layoutDirection: 'left-right',
    spacing: {
      horizontal: 60,
      vertical: 30,
    },
  },
});

if (result1.success) {
  console.log('✅ Successfully rendered from complete MindMap JSON');
  console.log(`SVG length: ${result1.svg?.length} characters`);
  console.log(`Nodes: ${result1.nodes?.length}`);
  console.log(`Connections: ${result1.connections?.length}`);
} else {
  console.error('❌ Error:', result1.error);
}

// Example 2: Render from simplified Node JSON
console.log('\n=== Example 2: Simplified Node JSON ===');

const simplifiedNodeJSON = JSON.stringify({
  id: 'node_1',
  content: 'Root',
  children: [
    {
      content: 'Topic 1',
      children: [{ content: 'Subtopic 1.1' }, { content: 'Subtopic 1.2' }],
    },
    {
      content: 'Topic 2',
      children: [{ content: 'Subtopic 2.1' }],
    },
    {
      content: 'Topic 3',
    },
  ],
});

const result2 = renderer1.renderFromJSON(simplifiedNodeJSON, {
  backgroundColor: '#f5f5f5',
  scale: 1.5,
});

if (result2.success) {
  console.log('✅ Successfully rendered from simplified Node JSON');
  console.log(`SVG length: ${result2.svg?.length} characters`);
} else {
  console.error('❌ Error:', result2.error);
}

// Example 3: Render from string (simple format)
console.log('\n=== Example 3: Simple String Format ===');

const simpleFormatJSON = JSON.stringify({
  text: 'My Mind Map',
  children: [
    { text: 'Branch 1', children: [{ text: 'Leaf 1.1' }] },
    { text: 'Branch 2', children: [{ text: 'Leaf 2.1' }, { text: 'Leaf 2.2' }] },
  ],
});

const result3 = renderer1.renderFromJSON(simpleFormatJSON);

if (result3.success) {
  console.log('✅ Successfully rendered from simple format');
  console.log(`SVG length: ${result3.svg?.length} characters`);
} else {
  console.error('❌ Error:', result3.error);
}

// Example 4: Using convenience function (mount in browser)
console.log('\n=== Example 4: Using Convenience Function ===');

try {
  if (typeof document !== 'undefined') {
    renderMindMapFromJSON('#map-container', simplifiedNodeJSON, {
      backgroundColor: '#ffffff',
      padding: 40,
      collapsible: true,
    });
    console.log('✅ Successfully mounted using convenience function');
  } else {
    console.log('ℹ️  Convenience mount is for browser usage. Use MindMapRenderer in Node.js.');
  }
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
}

// Example 5: Error handling
console.log('\n=== Example 5: Error Handling ===');

const invalidJSON = '{"invalid": "structure"}';
const result5 = renderer1.renderFromJSON(invalidJSON);

if (!result5.success) {
  console.log('✅ Correctly handled invalid JSON');
  console.log(`Error message: ${result5.error}`);
} else {
  console.log('⚠️  Unexpected success with invalid JSON');
}
