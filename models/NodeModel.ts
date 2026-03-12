/**
 * Node Model Class
 * 节点模型类
 */

import type { Node, NodeType, NodeMeta } from '../types';
import { generateNodeId } from '../utils/id';
import { validateNodeContent } from '../utils/validator';

export class NodeModel {
  /**
   * Create a new node
   * 创建新节点
   */
  static create(
    type: NodeType,
    content: string,
    parentId: string | null = null,
    meta: Partial<NodeMeta> = {}
  ): Node {
    const validation = validateNodeContent(content);
    if (!validation.success) {
      throw new Error(validation.error);
    }

    const now = Date.now();
    return {
      id: generateNodeId(),
      parentId,
      type,
      content,
      meta: {
        ...meta,
        createdAt: meta.createdAt || now,
        updatedAt: now,
        collapsed: meta.collapsed ?? false,
      },
      children: [],
    };
  }

  /**
   * Update node
   * 更新节点
   */
  static update(node: Node, updates: Partial<Node>): Node {
    const updated = { ...node };
    const hasChanges =
      updates.content !== undefined ||
      updates.type !== undefined ||
      updates.meta !== undefined ||
      updates.parentId !== undefined;

    if (updates.content !== undefined) {
      // If it's TextSpan[], convert to string first for validation
      const contentText =
        typeof updates.content === 'string'
          ? updates.content
          : updates.content.map((span) => span.text).join('');
      const validation = validateNodeContent(contentText);
      if (!validation.success) {
        throw new Error(validation.error);
      }
      updated.content = updates.content;
    }

    if (updates.type !== undefined) {
      updated.type = updates.type;
    }

    if (updates.meta !== undefined) {
      updated.meta = {
        ...updated.meta,
        ...updates.meta,
      };
    }

    if (updates.parentId !== undefined) {
      updated.parentId = updates.parentId;
    }

    // Update updatedAt if there are any changes
    if (hasChanges) {
      updated.meta = {
        ...updated.meta,
        updatedAt: Date.now(),
      };
    }

    return updated;
  }

  /**
   * Clone node (deep copy)
   * 克隆节点（深拷贝）
   */
  static clone(node: Node, newId: boolean = false): Node {
    const cloned: Node = {
      ...node,
      id: newId ? generateNodeId() : node.id,
      meta: { ...node.meta },
      children: node.children ? node.children.map((child) => this.clone(child, true)) : [],
    };

    // Update children's parentId
    if (cloned.children) {
      cloned.children.forEach((child) => {
        child.parentId = cloned.id;
      });
    }

    return cloned;
  }

  /**
   * Check if node has children
   * 检查节点是否有子节点
   */
  static hasChildren(node: Node): boolean {
    return !!(node.children && node.children.length > 0);
  }

  /**
   * Check if node is collapsed
   * 检查节点是否折叠
   */
  static isCollapsed(node: Node): boolean {
    return node.meta.collapsed === true;
  }

  /**
   * Toggle node collapse state
   * 切换节点折叠状态
   */
  static toggleCollapse(node: Node): Node {
    return this.update(node, {
      meta: {
        ...node.meta,
        collapsed: !node.meta.collapsed,
      },
    });
  }
}
