/**
 * Mind Map Renderer Utility
 * 脑图渲染工具类
 *
 * Provides convenient methods to render mind maps from JSON
 * 提供便捷方法从 JSON 渲染脑图
 */

import { LayoutEngine, type LayoutOptions } from '../engine/LayoutEngine';
import { RenderEngine, type RenderOptions } from '../engine/RenderEngine';
import { validateMindMap } from './validator';
import { generateMindMapId } from './id';
import type { MindMap, Node, NodeWithPosition, NodeConnection } from '../types';

export interface RenderFromJSONOptions extends Partial<RenderOptions> {
  layoutOptions?: Partial<LayoutOptions>;
  validate?: boolean; // Whether to validate the JSON structure
  backgroundColor?: string;
  scale?: number;
  padding?: number;
  showConnections?: boolean;
  highlightNodeIds?: string[];
  selectedNodeIds?: string[];
}

export interface RenderFromJSONResult {
  success: boolean;
  svg?: string;
  error?: string;
  nodes?: NodeWithPosition[];
  connections?: NodeConnection[];
}

/**
 * Mind Map Renderer
 * Provides high-level API for rendering mind maps from JSON
 */
export class MindMapRenderer {
  private layoutEngine: LayoutEngine;
  private renderEngine: RenderEngine;

  constructor() {
    this.layoutEngine = new LayoutEngine();
    this.renderEngine = new RenderEngine();
  }

  /**
   * Render mind map from JSON string
   * 从 JSON 字符串渲染脑图
   *
   * @param data JSON string or object
   * @param options Render options
   * @returns Render result with SVG string
   */
  renderFromJSON(data: string | any, options: RenderFromJSONOptions = {}): RenderFromJSONResult {
    try {
      // Parse JSON
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

      // Convert to MindMap format
      const mindMap = this.normalizeToMindMap(parsedData, options.validate ?? true);

      if (!mindMap) {
        return {
          success: false,
          error: 'Invalid JSON structure. Expected MindMap or Node object.',
        };
      }

      // Render
      return this.renderFromMindMap(mindMap, options);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse JSON',
      };
    }
  }

  /**
   * Render mind map from MindMap object
   * 从 MindMap 对象渲染脑图
   *
   * @param mindMap MindMap object
   * @param options Render options
   * @returns Render result with SVG string
   */
  renderFromMindMap(mindMap: MindMap, options: RenderFromJSONOptions = {}): RenderFromJSONResult {
    try {
      // Validate if needed
      if (options.validate !== false) {
        const validation = validateMindMap(mindMap);
        if (!validation.success) {
          return {
            success: false,
            error: validation.error || 'Invalid mind map structure',
          };
        }
      }

      // Calculate layout
      const layoutOptions = options.layoutOptions || {
        layoutDirection: 'left-right',
        spacing: {
          horizontal: 60,
          vertical: 30,
        },
      };

      const nodesWithPosition = this.layoutEngine.layout(mindMap.root, layoutOptions);
      const connections = this.layoutEngine.calculateConnections(nodesWithPosition, {
        layoutDirection: layoutOptions.layoutDirection,
        spacing: layoutOptions.spacing,
        nodeSize: layoutOptions.nodeSize,
        nodeVisualStyle: layoutOptions.nodeVisualStyle,
      });

      // Render to SVG
      const svg = this.renderEngine.renderToSVG(nodesWithPosition, connections, {
        backgroundColor: options.backgroundColor || '#ffffff',
        scale: options.scale || 1,
        padding: options.padding || 20,
        showConnections: options.showConnections !== false,
        highlightNodeIds: options.highlightNodeIds,
        selectedNodeIds: options.selectedNodeIds,
      });

      return {
        success: true,
        svg,
        nodes: nodesWithPosition,
        connections,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to render mind map',
      };
    }
  }

  /**
   * Render mind map from Node object
   * 从 Node 对象渲染脑图
   *
   * @param rootNode Root node object
   * @param options Render options
   * @returns Render result with SVG string
   */
  renderFromNode(rootNode: Node, options: RenderFromJSONOptions = {}): RenderFromJSONResult {
    // Create a minimal MindMap from root node
    const mindMap: MindMap = {
      id: generateMindMapId(),
      root: rootNode,
      metadata: {
        title:
          typeof rootNode.content === 'string'
            ? rootNode.content
            : rootNode.content.map((span) => span.text).join(''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
      },
    };

    return this.renderFromMindMap(mindMap, options);
  }

  /**
   * Normalize data to MindMap format
   * 将数据标准化为 MindMap 格式
   */
  private normalizeToMindMap(data: any, validate: boolean = true): MindMap | null {
    // If it's already a MindMap format
    if (data.root && data.metadata) {
      const mindMap = data as MindMap;
      // Ensure parentId is set correctly for all nodes
      this.ensureParentIds(mindMap.root, null);
      if (validate) {
        const validation = validateMindMap(mindMap);
        if (!validation.success) {
          return null;
        }
      }
      return mindMap;
    }

    // If it's a Node object
    if (data.content !== undefined || data.children !== undefined || data.text !== undefined) {
      // Support both 'content' and 'text' fields
      const nodeData = {
        ...data,
        content: data.content || data.text || '',
      };
      const rootNode = this.normalizeNode(nodeData, null);
      const contentText =
        typeof rootNode.content === 'string'
          ? rootNode.content
          : rootNode.content.map((span) => span.text).join('');
      return {
        id: generateMindMapId(),
        root: rootNode,
        metadata: {
          title: contentText || 'Mind Map',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: '1.0.0',
        },
      };
    }

    // If it's a simplified format (just content and children)
    if (typeof data === 'string' || (data.text && !data.id)) {
      const rootNode: Node = {
        id: `node_${Date.now()}`,
        parentId: null,
        type: 'text',
        content: typeof data === 'string' ? data : data.text,
        meta: {},
        children: this.normalizeChildren(data.children || []),
      };
      return {
        id: generateMindMapId(),
        root: rootNode,
        metadata: {
          title: typeof data === 'string' ? data : data.text || 'Mind Map',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: '1.0.0',
        },
      };
    }

    return null;
  }

  /**
   * Normalize node data
   * 标准化节点数据
   */
  private normalizeNode(data: any, parentId: string | null = null): Node {
    // Generate node ID first
    const nodeId = data.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Ensure required fields
    const node: Node = {
      id: nodeId,
      parentId: data.parentId ?? parentId ?? null,
      type: data.type || 'text',
      content: data.content || '',
      meta: data.meta || {},
      children: this.normalizeChildren(data.children, nodeId),
    };

    return node;
  }

  /**
   * Normalize children array
   * 标准化子节点数组
   */
  private normalizeChildren(children: any[] | undefined, parentId: string | null = null): Node[] {
    if (!Array.isArray(children)) {
      return [];
    }

    return children.map((child, index) => {
      // If child is a string or simple object, convert to Node format
      if (typeof child === 'string') {
        const nodeId = `node_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
        return {
          id: nodeId,
          parentId: parentId,
          type: 'text' as const,
          content: child,
          meta: {},
          children: [],
        };
      }

      if (typeof child === 'object' && child !== null) {
        // If it's already a Node-like object
        if (child.content !== undefined || child.text !== undefined) {
          const normalized = this.normalizeNode(
            {
              ...child,
              content: child.content || child.text || '',
            },
            parentId
          );
          return normalized;
        }
      }

      // Default: create empty node
      const nodeId = `node_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: nodeId,
        parentId: parentId,
        type: 'text' as const,
        content: '',
        meta: {},
        children: [],
      };
    });
  }

  /**
   * Ensure parentId is set correctly for all nodes in the tree
   * 确保树中所有节点的 parentId 正确设置
   */
  private ensureParentIds(node: Node, parentId: string | null): void {
    node.parentId = parentId;
    if (node.children) {
      node.children.forEach((child) => {
        this.ensureParentIds(child, node.id);
      });
    }
  }
}

/**
 * Convenience function: Render mind map from JSON string
 * 便捷函数：从 JSON 字符串渲染脑图
 *
 * @param json JSON string
 * @param options Render options
 * @returns SVG string or error message
 */
export function renderMindMapFromJSON(
  data: string | any,
  options: RenderFromJSONOptions = {}
): string {
  const renderer = new MindMapRenderer();
  const result = renderer.renderFromJSON(data, options);

  if (!result.success) {
    throw new Error(result.error || 'Failed to render mind map');
  }

  return result.svg || '';
}
