/**
 * 脑图数据结构定义
 */

import type { Node, Relation } from './node';

export interface MindMapMetadata {
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  version: string;
  author?: string;
  tags?: string[];
  theme?: string; // 主题 ID
  themeConfig?: unknown; // 自定义主题配置（可选）
  relations?: Relation[]; // 联系线数组
  colorPaletteId?: string; // 调色板 ID
  [key: string]: unknown;
}

export interface MindMap {
  id: string;
  root: Node;
  metadata: MindMapMetadata;
}

export interface MindMapState {
  mindMap: MindMap | null;
  selectedNodeIds: string[];
  highlightedNodeIds: string[];
  viewState: {
    scale: number;
    translateX: number;
    translateY: number;
  };
  isLoading: boolean;
  error: string | null;
}

export interface SearchResult {
  nodeId: string;
  matches: Array<{
    field: string;
    value: string;
    indices: [number, number][];
  }>;
  score: number;
}
