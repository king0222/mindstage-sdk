/**
 * 节点类型定义
 */

export type NodeType = 'text' | 'link' | 'tag' | 'attachment';

export interface NodeStyle {
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'lighter';
  fontFamily?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  [key: string]: unknown;
}

export interface NodeMeta {
  tags?: string[];
  link?: string;
  image?: string; // 图片 URL
  imageAlt?: string; // 图片 alt 文本
  note?: string; // 节点笔记内容
  style?: NodeStyle;
  collapsed?: boolean;
  expanded?: boolean;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: unknown;
}

import type { TextSpan } from './textSpan';

export interface Node {
  id: string;
  parentId: string | null;
  type: NodeType;
  /**
   * 节点内容
   * - 字符串格式（向后兼容）：简单文本内容
   * - TextSpan[] 格式（新格式）：带样式的文本片段数组
   */
  content: string | TextSpan[];
  meta: NodeMeta;
  children?: Node[];
}

export interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NodeWithPosition extends Node {
  position: NodePosition;
  level?: number; // 节点层级（0为根节点）
  direction?: 'left' | 'right'; // 节点相对于根节点的方向
}

export interface NodeConnection {
  from: string; // node id
  to: string; // node id
  path?: string; // SVG path for connection line
  level?: number; // 连接层级（用于颜色计算）
  color?: string; // 连接线颜色
  fromPoint?: { x: number; y: number }; // 起点坐标
  toPoint?: { x: number; y: number }; // 终点坐标
  connectionType?: 'direct' | 'circle'; // 连接类型：直接连接或通过小圆圈连接（用于线型主题）
}

/**
 * 联系线（Relation）- 用户手动创建的节点间联系
 * 支持多对多关系，不同于父子关系的连接线
 */
export interface Relation {
  id: string; // 联系线唯一标识
  from: string; // 起始节点 ID
  to: string; // 目标节点 ID
  label?: string; // 联系线标签（可选）
  color?: string; // 联系线颜色，默认 '#6366f1'
  strokeWidth?: number; // 线条宽度，默认 2
  // 贝塞尔曲线控制点（用于调整曲线曲率）
  controlPoints?: {
    // 起点控制点（相对于起点）
    startControl?: { x: number; y: number };
    // 终点控制点（相对于终点）
    endControl?: { x: number; y: number };
  };
  // 连接点位置（相对于节点的位置，0-1 表示百分比）
  fromAnchor?: { x: number; y: number }; // 起点锚点位置（0-1）
  toAnchor?: { x: number; y: number }; // 终点锚点位置（0-1）
  createdAt?: number;
  updatedAt?: number;
}
