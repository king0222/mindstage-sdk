/**
 * 脑图引擎核心类
 * 负责节点增删改、树结构维护
 */

import type { Node, NodeType } from '../types';
import { NodeModel } from '../models/NodeModel';

export interface IMindMapEngine {
  addNode(parentId: string | null, type: NodeType, content: string): Node;
  removeNode(nodeId: string): boolean;
  updateNode(nodeId: string, updates: Partial<Node>): boolean;
  getNode(nodeId: string): Node | null;
  moveNode(nodeId: string, newParentId: string | null, index?: number): boolean;
  setRoot(root: Node): void;
  getRoot(): Node | null;
  toJSON(): string;
}

export class MindMapEngine implements IMindMapEngine {
  private root: Node | null = null;
  private nodeMap: Map<string, Node> = new Map();

  constructor(root?: Node) {
    if (root) {
      this.setRoot(root);
    }
  }

  private rebuildNodeMap(): void {
    this.nodeMap.clear();
    if (this.root) {
      this.traverseAndMap(this.root);
    }
  }

  private traverseAndMap(node: Node): void {
    this.nodeMap.set(node.id, node);
    if (node.children) {
      node.children.forEach((child) => {
        // 确保 parentId 数据一致性
        if (child.parentId !== node.id) {
          child.parentId = node.id;
        }
        this.traverseAndMap(child);
      });
    }
  }

  addNode(parentId: string | null, type: NodeType, content: string): Node {
    if (!this.root && parentId !== null) {
      throw new Error('Root not initialized');
    }

    const newNode = NodeModel.create(type, content, parentId || ''); // NodeModel 需确保生成 ID

    if (parentId === null) {
      if (!this.root) {
        this.root = newNode;
      } else {
        // 如果已有根，添加为根的子节点（这里行为取决于业务需求，通常脑图只有一个根）
        newNode.parentId = this.root.id;
        this.root.children = this.root.children || [];
        this.root.children.push(newNode);
      }
    } else {
      const parent = this.nodeMap.get(parentId);
      if (!parent) throw new Error(`Parent ${parentId} not found`);

      parent.children = parent.children || [];
      parent.children.push(newNode);

      // 自动展开父节点
      if (parent.meta.collapsed) {
        parent.meta.collapsed = false;
      }
    }

    this.nodeMap.set(newNode.id, newNode);
    return newNode;
  }

  removeNode(nodeId: string): boolean {
    if (!this.root || nodeId === this.root.id) return false;

    const node = this.nodeMap.get(nodeId);
    if (!node || !node.parentId) return false;

    const parent = this.nodeMap.get(node.parentId);
    if (!parent || !parent.children) return false;

    // 移除节点
    parent.children = parent.children.filter((c) => c.id !== nodeId);

    // 清理 Map
    const cleanMap = (n: Node) => {
      this.nodeMap.delete(n.id);
      n.children?.forEach(cleanMap);
    };
    cleanMap(node);

    return true;
  }

  updateNode(nodeId: string, updates: Partial<Node>): boolean {
    const node = this.nodeMap.get(nodeId);
    if (!node) return false;

    // 深度合并 meta
    if (updates.meta) {
      node.meta = { ...node.meta, ...updates.meta };
    }
    // 更新内容
    if (updates.content !== undefined) node.content = updates.content;
    // 更新类型
    if (updates.type !== undefined) node.type = updates.type;

    // 不允许通过 updateNode 修改结构关系 (parentId/children)

    return true;
  }

  moveNode(nodeId: string, newParentId: string | null, index?: number): boolean {
    const node = this.nodeMap.get(nodeId);
    const newParent = newParentId ? this.nodeMap.get(newParentId) : null;

    // 校验：节点存在，目标存在，不能移动根节点，不能移动到自己内部
    if (!node || !this.root || node.id === this.root.id) return false;
    if (newParentId && !newParent) return false;

    // 检查循环引用 (newParent 不能是 node 的后代)
    let temp = newParent;
    while (temp) {
      if (temp.id === node.id) return false;
      temp = temp.parentId ? this.nodeMap.get(temp.parentId) || null : null;
    }

    // 1. 从旧父节点移除
    const oldParent = node.parentId ? this.nodeMap.get(node.parentId) : null;
    if (oldParent && oldParent.children) {
      oldParent.children = oldParent.children.filter((c) => c.id !== nodeId);
    }

    // 2. 添加到新父节点
    const targetParent = newParent || this.root;
    node.parentId = targetParent.id;
    targetParent.children = targetParent.children || [];

    if (typeof index === 'number' && index >= 0 && index <= targetParent.children.length) {
      targetParent.children.splice(index, 0, node);
    } else {
      targetParent.children.push(node);
    }

    return true;
  }

  getNode(nodeId: string): Node | null {
    return this.nodeMap.get(nodeId) || null;
  }

  setRoot(root: Node): void {
    this.root = root;
    this.rebuildNodeMap();
  }

  getRoot(): Node | null {
    return this.root;
  }

  // 辅助方法：展开/折叠
  toggleCollapse(nodeId: string): boolean {
    const node = this.getNode(nodeId);
    if (!node) return false;
    node.meta.collapsed = !node.meta.collapsed;
    return true;
  }

  toJSON(): string {
    return JSON.stringify(this.root, null, 2);
  }

  fromJSON(json: string): boolean {
    try {
      const root = JSON.parse(json);
      this.setRoot(root);
      return true;
    } catch (e) {
      console.error('Invalid JSON', e);
      return false;
    }
  }

  // 缺失的接口实现
  findNodes(predicate: (node: Node) => boolean): Node[] {
    const res: Node[] = [];
    this.nodeMap.forEach((node) => {
      if (predicate(node)) res.push(node);
    });
    return res;
  }

  getChildren(nodeId: string): Node[] {
    return this.getNode(nodeId)?.children || [];
  }

  getDescendants(nodeId: string): Node[] {
    const node = this.getNode(nodeId);
    if (!node) return [];
    const res: Node[] = [];
    const traverse = (n: Node) => {
      n.children?.forEach((c) => {
        res.push(c);
        traverse(c);
      });
    };
    traverse(node);
    return res;
  }

  getAncestors(nodeId: string): Node[] {
    const res: Node[] = [];
    let curr = this.getNode(nodeId);
    while (curr && curr.parentId) {
      const parent = this.getNode(curr.parentId);
      if (parent) {
        res.push(parent);
        curr = parent;
      } else {
        break;
      }
    }
    return res.reverse(); // 从根往下
  }

  expandAll(): void {
    this.nodeMap.forEach((n) => {
      if (n.meta.collapsed) n.meta.collapsed = false;
    });
  }

  collapseAll(): void {
    if (!this.root) return;
    // 根节点通常不折叠，只折叠子节点
    this.nodeMap.forEach((n) => {
      if (n.id !== this.root?.id && n.children && n.children.length > 0) {
        n.meta.collapsed = true;
      }
    });
  }
}
