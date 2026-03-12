/**
 * ID generation utilities
 * ID 生成工具
 */

import { nanoid } from 'nanoid';

/**
 * Generate unique node ID
 * 生成唯一节点 ID
 */
export function generateNodeId(): string {
  return `node_${nanoid()}`;
}

/**
 * Generate unique mind map ID
 * 生成唯一脑图 ID
 */
export function generateMindMapId(): string {
  return `mindmap_${nanoid()}`;
}

/**
 * Validate ID format
 * 验证 ID 格式
 */
export function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length > 0;
}
