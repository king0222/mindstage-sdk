/**
 * Node Operations Example
 * 节点操作示例
 *
 * This example demonstrates how to:
 * - Create and update nodes
 * - Move nodes
 * - Clone nodes
 * - Manage node hierarchy
 */

import { MindMapEngine, NodeModel } from '../index';

// Step 1: Create engine and root
const engine = new MindMapEngine();
const root = NodeModel.create('text', 'Root Node', null);
engine.setRoot(root);

// Step 2: Add nodes
const topic1 = engine.addNode(root.id, 'text', 'Topic 1');
const topic2 = engine.addNode(root.id, 'text', 'Topic 2');
const topic3 = engine.addNode(root.id, 'text', 'Topic 3');

const subtopic1 = engine.addNode(topic1.id, 'text', 'Subtopic 1.1');
const subtopic2 = engine.addNode(topic1.id, 'text', 'Subtopic 1.2');

console.log('Initial structure:');
console.log(`Root: ${root.id}`);
console.log(`  - Topic 1: ${topic1.id}`);
console.log(`    - Subtopic 1.1: ${subtopic1.id}`);
console.log(`    - Subtopic 1.2: ${subtopic2.id}`);
console.log(`  - Topic 2: ${topic2.id}`);
console.log(`  - Topic 3: ${topic3.id}`);

// Step 3: Update node content
engine.updateNode(topic1.id, {
  content: 'Updated Topic 1',
});

const updatedTopic1 = engine.getNode(topic1.id);
console.log('\nUpdated Topic 1:', updatedTopic1?.content);

// Step 4: Update node metadata
engine.updateNode(topic2.id, {
  meta: {
    tags: ['important', 'urgent'],
    style: {
      backgroundColor: '#ffebee',
      color: '#c62828',
    },
  },
});

const updatedTopic2 = engine.getNode(topic2.id);
console.log('\nUpdated Topic 2 metadata:');
console.log('Tags:', updatedTopic2?.meta.tags);
console.log('Style:', updatedTopic2?.meta.style);

// Step 5: Move node (move subtopic1 from topic1 to topic2)
console.log('\nMoving Subtopic 1.1 from Topic 1 to Topic 2...');
const moved = engine.moveNode(subtopic1.id, topic2.id);
console.log('Move successful:', moved);

const movedNode = engine.getNode(subtopic1.id);
console.log('Moved node parent:', movedNode?.parentId);

// Step 6: Clone node
console.log('\nCloning Topic 3...');
const clonedTopic3 = NodeModel.clone(topic3, true);
console.log('Original ID:', topic3.id);
console.log('Cloned ID:', clonedTopic3.id);
console.log('Are they equal?', topic3.id === clonedTopic3.id); // false

// Step 7: Remove node
console.log('\nRemoving Topic 3...');
const removed = engine.removeNode(topic3.id);
console.log('Remove successful:', removed);

const removedNode = engine.getNode(topic3.id);
console.log('Node still exists?', removedNode !== null); // false

// Step 8: Get final structure
console.log('\nFinal structure:');
const finalRoot = engine.getRoot();
if (finalRoot) {
  console.log(`Root: ${finalRoot.id}`);
  finalRoot.children?.forEach((child) => {
    console.log(`  - ${child.content}: ${child.id}`);
    child.children?.forEach((grandchild) => {
      console.log(`    - ${grandchild.content}: ${grandchild.id}`);
    });
  });
}
