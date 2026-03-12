/**
 * Validation Example
 * 验证示例
 *
 * This example demonstrates how to:
 * - Validate node data
 * - Validate mind map data
 * - Handle validation errors
 */

import {
  validateNode,
  validateMindMap,
  validateNodeContent,
  NodeModel,
  type Node,
  type MindMap,
} from '../index';

// Example 1: Validate node content
console.log('=== Node Content Validation ===');
const validContent = 'This is a valid node content';
const invalidContent = 'a'.repeat(2000); // Too long

const result1 = validateNodeContent(validContent);
console.log('Valid content:', result1.success); // true

const result2 = validateNodeContent(invalidContent);
console.log('Invalid content:', result2.success); // false
console.log('Error:', result2.error);

// Example 2: Validate node structure
console.log('\n=== Node Structure Validation ===');
const validNode: Node = NodeModel.create('text', 'Test Node', null);
const result3 = validateNode(validNode);
console.log('Valid node:', result3.success); // true

const invalidNode = {
  id: '', // Invalid: empty ID
  type: 'text',
  content: 'Test',
  meta: {},
};
const result4 = validateNode(invalidNode);
console.log('Invalid node:', result4.success); // false
console.log('Error:', result4.error);

// Example 3: Validate mind map
console.log('\n=== Mind Map Validation ===');
const validMindMap: MindMap = {
  id: 'mindmap_123',
  root: NodeModel.create('text', 'Root', null),
  metadata: {
    title: 'My Mind Map',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: '1.0.0',
  },
};

const result5 = validateMindMap(validMindMap);
console.log('Valid mind map:', result5.success); // true

const invalidMindMap = {
  id: '',
  root: null, // Invalid: root is required
  metadata: {},
};
const result6 = validateMindMap(invalidMindMap);
console.log('Invalid mind map:', result6.success); // false
console.log('Error:', result6.error);
