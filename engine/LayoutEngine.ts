/**
 * 布局引擎
 * 负责节点位置计算、连接线路径计算
 * 采用 XMind 风格的确定性布局算法（Walker's Algorithm 变体）
 */

import type { Node, NodeWithPosition, NodeConnection } from '../types';
import { DEFAULT_LAYOUT_OPTIONS } from '../utils/constants';
import { textSpansToString } from '../utils/textSpanUtils';

export interface LayoutOptions {
  direction?: 'horizontal' | 'vertical'; // 目前主要优化 horizontal (脑图模式)
  layoutDirection?: 'left' | 'right' | 'mixed' | 'left-right'; // mixed 支持左右分布, left-right 支持左右分布型
  spacing?: {
    horizontal: number;
    vertical: number;
  };
  nodeSize?: {
    width: number;
    height: number;
  };
  nodeVisualStyle?: 'rectangle' | 'underline' | 'circle' | 'card';
}

export interface ConnectionOptions {
  connectionType?: 'direct' | 'circle';
  nodeVisualStyle?: 'rectangle' | 'underline' | 'circle' | 'card';
  layoutDirection?: 'left' | 'right' | 'mixed' | 'left-right';
  spacing?: {
    horizontal: number;
    vertical: number;
  };
  nodeSize?: {
    width: number;
    height: number;
  };
}

export interface ILayoutEngine {
  layout(root: Node, options?: LayoutOptions): NodeWithPosition[];
  calculateConnections(nodes: NodeWithPosition[], options?: ConnectionOptions): NodeConnection[];
}

// 内部使用的布局节点结构
interface LayoutNode {
  node: Node;
  x: number;
  y: number;
  width: number; // 内容宽度
  height: number; // 内容高度
  outerHeight: number; // 包含子孙节点的总高度（包围盒高度）
  children: LayoutNode[];
  level: number;
  direction: 'left' | 'right'; // 节点自身的布局方向
}

export class LayoutEngine implements ILayoutEngine {
  // 节点最大宽度限制（超过此宽度将自动换行）
  private static readonly MAX_NODE_WIDTH = 500; // 从300增加到500，提供更大的显示空间

  private defaultOptions: Required<Omit<LayoutOptions, 'nodeVisualStyle'>> & {
    nodeVisualStyle?: 'rectangle' | 'underline' | 'circle' | 'card';
  };

  constructor() {
    this.defaultOptions = {
      direction: DEFAULT_LAYOUT_OPTIONS.direction || 'horizontal',
      layoutDirection: 'right',
      spacing: DEFAULT_LAYOUT_OPTIONS.spacing || { horizontal: 60, vertical: 10 },
      nodeSize: DEFAULT_LAYOUT_OPTIONS.nodeSize || { width: 30, height: 30 },
      nodeVisualStyle: 'rectangle',
    };
  }

  /**
   * 测量文本宽度 (Canvas)
   */
  private measureTextWidth(
    text: string,
    fontSize: number = 14,
    fontWeight: string = 'normal'
  ): number {
    if (typeof document === 'undefined') return text.length * fontSize * 0.6;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return text.length * fontSize * 0.6;

    context.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
    return context.measureText(text).width;
  }

  /**
   * 估算节点尺寸
   */
  private estimateNodeSize(
    node: Node,
    defaultSize: { width: number; height: number },
    level?: number
  ): { width: number; height: number } {
    // 根据节点层级设置默认字体大小：根节点最大，一级节点次之，其他节点默认
    const isRoot = node.parentId === null;
    const nodeLevel = level ?? (isRoot ? 0 : undefined);
    const defaultFontSize = isRoot ? 30 : nodeLevel === 1 ? 20 : 14;
    const fontSize = node.meta.style?.fontSize || defaultFontSize;
    const fontWeight = node.meta.style?.fontWeight || 'normal';
    // 根节点（level 0）增加左右边距，使其看起来更平衡
    const paddingX = nodeLevel === 0 ? 48 : 24;
    const paddingY = 12;
    const lineHeight = fontSize * 1.5; // 行高

    // 1. 标签/图标宽度 (简化计算)
    const tagsWidth = (node.meta?.tags?.length || 0) * 20;

    // 2. 计算可用文本宽度（考虑最大宽度限制）
    const imageWidth = node.meta?.image ? 100 : 0;
    const maxContentWidth = LayoutEngine.MAX_NODE_WIDTH - paddingX - tagsWidth;
    const availableTextWidth = Math.max(maxContentWidth, imageWidth);

    // 3. 解析节点内容，分离文本和公式
    const contentText =
      typeof node.content === 'string' ? node.content : textSpansToString(node.content);

    // 4. 收集纯文本内容
    const textWithoutFormulaMarkers = contentText;
    const textOnlyWidth = textWithoutFormulaMarkers
      ? this.measureTextWidth(textWithoutFormulaMarkers, fontSize, fontWeight)
      : 0;

    // 5. 计算最终宽度（限制最大宽度，考虑文本和图片）
    const finalContentWidth = Math.max(textOnlyWidth, imageWidth);
    const finalWidth = Math.min(
      LayoutEngine.MAX_NODE_WIDTH,
      Math.max(defaultSize.width, finalContentWidth + tagsWidth + paddingX)
    );

    // 6. 计算高度（考虑换行、图片）
    const numLines = Math.ceil(textOnlyWidth / availableTextWidth) || 1;
    const imageHeight = node.meta?.image ? 100 : 0;
    const textHeight = numLines * lineHeight;
    const imageTextSpacing = imageHeight > 0 && contentText ? 8 : 0;
    const finalHeight = Math.max(
      defaultSize.height,
      imageHeight + imageTextSpacing + textHeight + paddingY * 2
    );

    return { width: finalWidth, height: finalHeight };
  }

  /**
   * 核心布局入口
   */
  layout(root: Node, options?: LayoutOptions): NodeWithPosition[] {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const rootSize = this.estimateNodeSize(root, mergedOptions.nodeSize, 0);

    // 处理特殊布局类型
    if (mergedOptions.layoutDirection === 'left-right') {
      return this.layoutLeftRight(root, mergedOptions);
    }

    // 1. 初始化根节点
    const rootLayoutNode: LayoutNode = {
      node: root,
      x: 0,
      y: 0,
      width: rootSize.width,
      height: rootSize.height,
      outerHeight: 0,
      children: [],
      level: 0,
      direction: 'right', // 根节点本身不重要，子节点决定方向
    };

    // 2. 处理子节点分组 (支持左右布局)
    const children = root.children || [];
    const leftNodes: Node[] = [];
    const rightNodes: Node[] = [];

    // 如果是折叠状态，则没有子节点需要布局
    if (!root.meta.collapsed) {
      if (mergedOptions.layoutDirection === 'mixed' && children.length > 0) {
        // 简单的一半左一半右
        const half = Math.ceil(children.length / 2);
        rightNodes.push(...children.slice(0, half));
        leftNodes.push(...children.slice(half));
      } else if (mergedOptions.layoutDirection === 'left') {
        leftNodes.push(...children);
      } else {
        rightNodes.push(...children);
      }
    }

    // 3. 构建布局树 (First Walk: 计算尺寸)
    // 右侧子树
    const rightTree = rightNodes.map((node) =>
      this.buildLayoutTree(node, 1, 'right', mergedOptions)
    );
    // 左侧子树
    const leftTree = leftNodes.map((node) => this.buildLayoutTree(node, 1, 'left', mergedOptions));

    rootLayoutNode.children = [...rightTree, ...leftTree];

    // 4. 计算包围盒高度 (Post-order Traversal)
    this.calculateTreeBounds(rootLayoutNode, mergedOptions.spacing.vertical);

    // 5. 计算绝对位置 (Second Walk: Pre-order Traversal)
    // 根节点定位在 (0,0)

    // 布局右侧
    if (rightTree.length > 0) {
      const rightBlockHeight =
        rightTree.reduce((sum, n) => sum + n.outerHeight, 0) +
        (rightTree.length - 1) * mergedOptions.spacing.vertical;
      // 右侧块的起始 Y 坐标 (相对于根节点中心)
      // 算法：根节点中心 Y = 0 + root.height/2
      // 右侧块中心应该对齐根节点中心
      // 右侧块 Top Y = (root.y + root.height/2) - (rightBlockHeight / 2)
      const startY = rootLayoutNode.y + rootLayoutNode.height / 2 - rightBlockHeight / 2;
      this.layoutTreePositions(
        rightTree,
        rootLayoutNode.x + rootLayoutNode.width + mergedOptions.spacing.horizontal,
        startY,
        'right',
        mergedOptions
      );
    }

    // 布局左侧
    if (leftTree.length > 0) {
      const leftBlockHeight =
        leftTree.reduce((sum, n) => sum + n.outerHeight, 0) +
        (leftTree.length - 1) * mergedOptions.spacing.vertical;
      const startY = rootLayoutNode.y + rootLayoutNode.height / 2 - leftBlockHeight / 2;
      // 左侧 X 起点：根节点 X - 间距 - 子节点宽度 (这在递归中处理)
      this.layoutTreePositions(
        leftTree,
        rootLayoutNode.x - mergedOptions.spacing.horizontal,
        startY,
        'left',
        mergedOptions
      );
    }

    // 6. 展平结果
    const result: NodeWithPosition[] = [];
    this.flattenLayoutTree(rootLayoutNode, result);
    return result;
  }

  /**
   * 左右分布型布局（Left-Right Layout）
   * 根节点在中心，子节点平均分布在左右两侧，围绕根节点中心垂直分布
   */
  private layoutLeftRight(
    root: Node,
    options: Required<Omit<LayoutOptions, 'nodeVisualStyle'>> & {
      nodeVisualStyle?: 'rectangle' | 'underline' | 'circle' | 'card';
    }
  ): NodeWithPosition[] {
    const rootSize = this.estimateNodeSize(root, options.nodeSize, 0);
    const result: NodeWithPosition[] = [];

    // 根节点在中心 (0, 0)
    result.push({
      ...root,
      level: 0,
      direction: 'right', // 根节点默认方向
      position: {
        x: 0 - rootSize.width / 2,
        y: 0 - rootSize.height / 2,
        width: rootSize.width,
        height: rootSize.height,
      },
    });

    if (root.meta.collapsed || !root.children || root.children.length === 0) {
      return result;
    }

    const children = root.children;
    const half = Math.ceil(children.length / 2);
    const leftChildren = children.slice(half);
    const rightChildren = children.slice(0, half);

    // 计算右侧节点的总高度（用于垂直居中）
    let rightTotalHeight = 0;
    rightChildren.forEach((child) => {
      const childHeight = this.calculateSubtreeHeight(child, options, 1);
      rightTotalHeight += childHeight;
      if (rightChildren.length > 1) {
        rightTotalHeight += options.spacing.vertical;
      }
    });
    if (rightTotalHeight > 0 && rightChildren.length > 1) {
      rightTotalHeight -= options.spacing.vertical; // 最后一个节点不需要间距
    }

    // 计算左侧节点的总高度（用于垂直居中）
    let leftTotalHeight = 0;
    leftChildren.forEach((child) => {
      const childHeight = this.calculateSubtreeHeight(child, options, 1);
      leftTotalHeight += childHeight;
      if (leftChildren.length > 1) {
        leftTotalHeight += options.spacing.vertical;
      }
    });
    if (leftTotalHeight > 0 && leftChildren.length > 1) {
      leftTotalHeight -= options.spacing.vertical; // 最后一个节点不需要间距
    }

    // 布局右侧节点（从根节点中心上方开始，垂直居中）
    // 根节点中心 Y = 0，所以从 -rightTotalHeight/2 开始
    let rightY = -rightTotalHeight / 2;
    rightChildren.forEach((child, index) => {
      const childHeight = this.calculateSubtreeHeight(child, options, 1);
      const childCenterY = rightY + childHeight / 2;

      // 右侧节点的 X 位置：根节点右侧 + 间距
      // 根节点中心 X = 0，右边缘 = rootSize.width / 2
      const childResult = this.layoutLeftRightRecursive(
        child,
        1,
        { x: rootSize.width / 2 + options.spacing.horizontal, y: childCenterY },
        'right',
        options
      );

      result.push(...childResult);

      // 计算下一个节点的起始Y位置
      rightY += childHeight;
      if (index < rightChildren.length - 1) {
        rightY += options.spacing.vertical;
      }
    });

    // 布局左侧节点（从根节点中心上方开始，垂直居中）
    // 根节点中心 Y = 0，所以从 -leftTotalHeight/2 开始
    let leftY = -leftTotalHeight / 2;
    leftChildren.forEach((child, index) => {
      const childHeight = this.calculateSubtreeHeight(child, options, 1);
      const childCenterY = leftY + childHeight / 2;

      // 左侧节点的 X 位置：根节点左侧 - 间距
      // 根节点中心 X = 0，左边缘 = -rootSize.width / 2
      // 子节点右边缘应该对齐到 -rootSize.width / 2 - spacing
      const childResult = this.layoutLeftRightRecursive(
        child,
        1,
        { x: -rootSize.width / 2 - options.spacing.horizontal, y: childCenterY },
        'left',
        options
      );

      result.push(...childResult);

      // 计算下一个节点的起始Y位置
      leftY += childHeight;
      if (index < leftChildren.length - 1) {
        leftY += options.spacing.vertical;
      }
    });

    return result;
  }

  /**
   * 计算子树的总高度（包括所有子节点）
   */
  private calculateSubtreeHeight(
    node: Node,
    options: Required<Omit<LayoutOptions, 'nodeVisualStyle'>> & {
      nodeVisualStyle?: 'rectangle' | 'underline' | 'circle' | 'card';
    },
    level?: number
  ): number {
    // 如果没有传入 level，根据 parentId 判断：根节点为 0，其他节点需要递归计算
    const nodeLevel = level ?? (node.parentId === null ? 0 : undefined);
    const nodeSize = this.estimateNodeSize(node, options.nodeSize, nodeLevel);

    if (node.meta.collapsed || !node.children || node.children.length === 0) {
      return nodeSize.height;
    }

    const children = node.children;
    let childrenHeight = 0;
    const childLevel = (nodeLevel ?? 0) + 1;
    children.forEach((child, index) => {
      childrenHeight += this.calculateSubtreeHeight(child, options, childLevel);
      if (index < children.length - 1) {
        childrenHeight += options.spacing.vertical;
      }
    });

    // 返回节点自身高度和子节点总高度的较大值
    return Math.max(nodeSize.height, childrenHeight);
  }

  /**
   * 左右分布型布局递归函数
   */
  private layoutLeftRightRecursive(
    node: Node,
    level: number,
    parentPos: { x: number; y: number },
    direction: 'left' | 'right',
    options: Required<Omit<LayoutOptions, 'nodeVisualStyle'>> & {
      nodeVisualStyle?: 'rectangle' | 'underline' | 'circle' | 'card';
    }
  ): NodeWithPosition[] {
    const result: NodeWithPosition[] = [];
    const nodeSize = this.estimateNodeSize(node, options.nodeSize, level);

    // 确定节点X坐标
    // parentPos.x 是父节点连接点的 X 坐标
    // 对于右侧：父节点右边缘，子节点左边缘对齐
    // 对于左侧：父节点左边缘，子节点右边缘对齐
    const nodeX =
      direction === 'right'
        ? parentPos.x // 右侧：子节点左边缘对齐父节点右边缘
        : parentPos.x - nodeSize.width; // 左侧：子节点右边缘对齐父节点左边缘

    // 节点Y坐标：以 parentPos.y（父节点中心Y）为基准，节点中心对齐
    result.push({
      ...node,
      level,
      direction,
      position: {
        x: nodeX,
        y: parentPos.y - nodeSize.height / 2,
        width: nodeSize.width,
        height: nodeSize.height,
      },
    });

    if (node.meta.collapsed || !node.children || node.children.length === 0) {
      return result;
    }

    const children = node.children;

    // 计算子节点的 X 位置
    // 对于右侧：子节点在父节点右侧
    // 对于左侧：子节点在父节点左侧
    const nextX =
      direction === 'right'
        ? nodeX + nodeSize.width + options.spacing.horizontal // 右侧：子节点在父节点右侧
        : nodeX - options.spacing.horizontal; // 左侧：子节点在父节点左侧（注意：nodeX 已经是子节点右边缘）

    // 计算子节点块的起始Y（相对于当前节点中心）
    // 先计算所有子节点的总高度
    let childrenTotalHeight = 0;
    children.forEach((child, index) => {
      const childHeight = this.calculateSubtreeHeight(child, options, level + 1);
      childrenTotalHeight += childHeight;
      if (index < children.length - 1) {
        childrenTotalHeight += options.spacing.vertical;
      }
    });

    // 从节点中心上方开始布局子节点
    let childY = parentPos.y - childrenTotalHeight / 2;

    children.forEach((child, index) => {
      const childHeight = this.calculateSubtreeHeight(child, options, level + 1);
      const childCenterY = childY + childHeight / 2;

      const childResult = this.layoutLeftRightRecursive(
        child,
        level + 1,
        { x: nextX, y: childCenterY },
        direction,
        options
      );

      result.push(...childResult);

      // 计算下一个子节点的Y位置
      childY += childHeight;
      if (index < children.length - 1) {
        childY += options.spacing.vertical;
      }
    });

    return result;
  }

  /**
   * 递归构建布局树结构 & 计算自身尺寸
   */
  private buildLayoutTree(
    node: Node,
    level: number,
    direction: 'left' | 'right',
    options: Required<Omit<LayoutOptions, 'nodeVisualStyle'>> & {
      nodeVisualStyle?: 'rectangle' | 'underline' | 'circle' | 'card';
    }
  ): LayoutNode {
    const size = this.estimateNodeSize(node, options.nodeSize, level);

    const layoutNode: LayoutNode = {
      node,
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
      outerHeight: 0,
      children: [],
      level,
      direction,
    };

    if (!node.meta.collapsed && node.children && node.children.length > 0) {
      layoutNode.children = node.children.map((child) =>
        this.buildLayoutTree(child, level + 1, direction, options)
      );
    }

    return layoutNode;
  }

  /**
   * 计算树的包围盒高度 (后序遍历)
   * 核心逻辑：outerHeight = max(node.height, children_total_height)
   */
  private calculateTreeBounds(node: LayoutNode, baseSpacing: number): void {
    if (node.children.length === 0) {
      node.outerHeight = node.height;
      return;
    }

    // 递归计算子节点
    node.children.forEach((child) => this.calculateTreeBounds(child, baseSpacing));

    // 计算子节点总高度
    // 间距随着层级变深稍微减小，更紧凑
    const levelFactor = Math.max(0.5, 1 - node.level * 0.1);
    const spacing = baseSpacing * levelFactor;

    const childrenHeight =
      node.children.reduce((sum, child) => sum + child.outerHeight, 0) +
      (node.children.length - 1) * spacing;

    // 节点的包围盒高度必须能容纳自己，也能容纳所有子节点
    node.outerHeight = Math.max(node.height, childrenHeight);
  }

  /**
   * 计算节点位置 (前序遍历)
   */
  private layoutTreePositions(
    nodes: LayoutNode[],
    xBase: number,
    yStart: number,
    direction: 'left' | 'right',
    options: Required<Omit<LayoutOptions, 'nodeVisualStyle'>> & {
      nodeVisualStyle?: 'rectangle' | 'underline' | 'circle' | 'card';
    }
  ): void {
    let currentY = yStart;
    const baseSpacing = options.spacing.vertical;

    nodes.forEach((node) => {
      // 1. 确定当前节点的 X 坐标
      // 如果是向左布局，xBase 是右边界，需要减去自身宽度
      const x = direction === 'right' ? xBase : xBase - node.width;

      // 2. 确定当前节点的 Y 坐标
      // 它的分配空间是 node.outerHeight
      // 它应该居中于这个分配空间
      // 分配空间的 Top = currentY
      // 节点 Top = currentY + (node.outerHeight - node.height) / 2
      const y = currentY + (node.outerHeight - node.height) / 2;

      node.x = x;
      node.y = y;

      // 3. 布局子节点
      if (node.children.length > 0) {
        // 子节点块的高度
        const levelFactor = Math.max(0.5, 1 - node.level * 0.1);
        const spacing = baseSpacing * levelFactor;

        const childrenBlockHeight =
          node.children.reduce((sum, c) => sum + c.outerHeight, 0) +
          (node.children.length - 1) * spacing;

        // 子节点块的起始 Y
        // 相对于当前节点的中心对齐
        // CenterY = node.y + node.height / 2
        // ChildrenTopY = CenterY - childrenBlockHeight / 2
        const childrenStartY = node.y + node.height / 2 - childrenBlockHeight / 2;

        // 子节点 X 基准
        const nextXBase =
          direction === 'right'
            ? node.x + node.width + options.spacing.horizontal
            : node.x - options.spacing.horizontal;

        this.layoutTreePositions(node.children, nextXBase, childrenStartY, direction, options);
      }

      // 4. 累加 Y，为下一个兄弟节点做准备
      const levelFactor = Math.max(0.5, 1 - node.level * 0.1);
      currentY += node.outerHeight + baseSpacing * levelFactor;
    });
  }

  /**
   * 展平树结构输出
   */
  private flattenLayoutTree(layoutNode: LayoutNode, result: NodeWithPosition[]): void {
    result.push({
      ...layoutNode.node,
      level: layoutNode.level,
      direction: layoutNode.direction,
      position: {
        x: layoutNode.x,
        y: layoutNode.y,
        width: layoutNode.width,
        height: layoutNode.height,
      },
    });

    layoutNode.children.forEach((child) => this.flattenLayoutTree(child, result));
  }

  /**
   * 计算连接线
   */
  calculateConnections(nodes: NodeWithPosition[], options?: ConnectionOptions): NodeConnection[] {
    const layoutDirection = options?.layoutDirection || 'right';

    // 根据布局类型使用不同的连接线算法
    if (layoutDirection === 'left-right') {
      return this.calculateLeftRightConnections(nodes, options);
    } else {
      // 单侧树形布局（left, right, mixed）
      return this.calculateTreeConnections(nodes, options);
    }
  }

  /**
   * 计算单侧树形布局的连接线
   */
  private calculateTreeConnections(
    nodes: NodeWithPosition[],
    options?: ConnectionOptions
  ): NodeConnection[] {
    const connections: NodeConnection[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    nodes.forEach((node) => {
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          const isLeft = node.position.x < parent.position.x;

          // 计算连接点
          const startPoint = {
            x: isLeft ? parent.position.x : parent.position.x + parent.position.width,
            y: parent.position.y + parent.position.height / 2,
          };

          const endPoint = {
            x: isLeft ? node.position.x + node.position.width : node.position.x,
            y: node.position.y + node.position.height / 2,
          };

          // 下划线风格特殊处理 (从底部连出)
          if (options?.nodeVisualStyle === 'underline') {
            startPoint.y = parent.position.y + parent.position.height;
            endPoint.y = node.position.y + node.position.height;
          }

          // 计算路径
          const path = this.calculateBezierPath(startPoint, endPoint, isLeft);

          connections.push({
            from: parent.id,
            to: node.id,
            level: node.level || 0,
            fromPoint: startPoint,
            toPoint: endPoint,
            path,
            connectionType: options?.connectionType || 'direct',
          });
        }
      }
    });

    return connections;
  }

  /**
   * 计算左右分布型布局的连接线
   * 根节点从左侧和右侧分别连接子节点
   */
  private calculateLeftRightConnections(
    nodes: NodeWithPosition[],
    options?: ConnectionOptions
  ): NodeConnection[] {
    const connections: NodeConnection[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    nodes.forEach((node) => {
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          // 判断节点在父节点的左侧还是右侧
          const parentCenterX = parent.position.x + parent.position.width / 2;
          const nodeCenterX = node.position.x + node.position.width / 2;
          const isLeft = nodeCenterX < parentCenterX;

          // 计算父节点的连接起点
          const parentCenterY = parent.position.y + parent.position.height / 2;

          let startPoint: { x: number; y: number };

          // 如果是根节点（level === 0），根据子节点位置决定连接起点
          if (parent.level === 0) {
            if (isLeft) {
              // 左侧子节点：从根节点左侧边缘连接
              startPoint = {
                x: parent.position.x,
                y: parentCenterY,
              };
            } else {
              // 右侧子节点：从根节点右侧边缘连接
              startPoint = {
                x: parent.position.x + parent.position.width,
                y: parentCenterY,
              };
            }
          } else {
            // 非根节点：根据方向从对应侧连接
            // 判断父节点在其父节点的左侧还是右侧
            const grandParent = parent.parentId ? nodeMap.get(parent.parentId) : null;
            if (grandParent) {
              const grandParentCenterX = grandParent.position.x + grandParent.position.width / 2;
              const parentIsLeft = parentCenterX < grandParentCenterX;

              // 父节点在左侧，子节点也从左侧连接；父节点在右侧，子节点也从右侧连接
              startPoint = {
                x: parentIsLeft ? parent.position.x : parent.position.x + parent.position.width,
                y: parentCenterY,
              };
            } else {
              // 如果没有祖父节点，使用默认逻辑
              startPoint = {
                x: isLeft ? parent.position.x : parent.position.x + parent.position.width,
                y: parentCenterY,
              };
            }
          }

          // 计算子节点的连接终点
          // 子节点应该从与父节点连接起点相对的一侧连接
          const endPoint = {
            x: isLeft ? node.position.x + node.position.width : node.position.x,
            y: node.position.y + node.position.height / 2,
          };

          // 下划线风格特殊处理
          if (options?.nodeVisualStyle === 'underline') {
            startPoint.y = parent.position.y + parent.position.height;
            endPoint.y = node.position.y + node.position.height;
          }

          // 计算路径（使用贝塞尔曲线）
          const path = this.calculateBezierPath(startPoint, endPoint, isLeft);

          connections.push({
            from: parent.id,
            to: node.id,
            level: node.level || 0,
            fromPoint: startPoint,
            toPoint: endPoint,
            path,
            connectionType: options?.connectionType || 'direct',
          });
        }
      }
    });

    return connections;
  }

  /**
   * 计算平滑的三次贝塞尔曲线 (XMind 风格)
   */
  private calculateBezierPath(
    start: { x: number; y: number },
    end: { x: number; y: number },
    isLeft: boolean
  ): string {
    // 控制点计算：
    // XMind 风格保持起点和终点附近是水平的
    // 控制点 X 坐标取两点中点，但带有方向性偏移
    const distX = Math.abs(end.x - start.x);

    // 如果水平距离很近但垂直距离很远，曲线需要调整
    const controlOffset = Math.max(distX * 0.4, 20); // 至少20px的缓冲

    const cp1 = {
      x: isLeft ? start.x - controlOffset : start.x + controlOffset,
      y: start.y,
    };

    const cp2 = {
      x: isLeft ? end.x + controlOffset : end.x - controlOffset,
      y: end.y,
    };

    return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
  }

  detectCollisions(): Array<{ node1: string; node2: string }> {
    return []; // 新算法保证无碰撞，保留接口兼容
  }

  optimizeLayout(nodes: NodeWithPosition[]): NodeWithPosition[] {
    return nodes; // 不再需要后处理
  }
}
