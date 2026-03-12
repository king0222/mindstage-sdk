/**
 * Basic Usage Example
 * 基本使用示例
 *
 * This example demonstrates how to:
 * - Create a mind map
 * - Add nodes
 * - Calculate layout
 * - Render to SVG
 */

import { LayoutEngine, RenderEngine, MindMapEngine, NodeModel } from '../index';

// Step 1: Create mind map engine
const engine = new MindMapEngine();

// Step 2: Create root node
const rootNode = NodeModel.create('text', 'My Mind Map', null);
engine.setRoot(rootNode);

// Step 3: Add child nodes
const child1 = engine.addNode(rootNode.id, 'text', 'First Topic');
const child2 = engine.addNode(rootNode.id, 'text', 'Second Topic');
engine.addNode(rootNode.id, 'text', 'Third Topic');

// Step 4: Add sub-nodes
engine.addNode(child1.id, 'text', 'Sub-topic 1.1');
engine.addNode(child1.id, 'text', 'Sub-topic 1.2');
engine.addNode(child2.id, 'text', 'Sub-topic 2.1');

// Step 5: Calculate layout
const layoutEngine = new LayoutEngine();
const root = engine.getRoot();

if (!root) {
  throw new Error('Root node not found');
}

const nodesWithPosition = layoutEngine.layout(root, {
  layoutDirection: 'left-right',
  spacing: {
    horizontal: 60,
    vertical: 30,
  },
});

const connections = layoutEngine.calculateConnections(nodesWithPosition, {
  layoutDirection: 'left-right',
});

// Step 6: Render to SVG
const renderEngine = new RenderEngine();
const svgString = renderEngine.renderToSVG(nodesWithPosition, connections, {
  backgroundColor: '#ffffff',
  scale: 1,
  padding: 20,
});

console.log('Generated SVG:');
console.log(svgString);

// Step 7: Export to file (in Node.js environment)
if (typeof require !== 'undefined') {
  const fs = require('fs');
  const path = require('path');

  const outputPath = path.join(__dirname, 'output.svg');
  fs.writeFileSync(outputPath, svgString, 'utf-8');
  console.log(`SVG saved to: ${outputPath}`);
}
