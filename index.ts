/**
 * mindstage-sdk
 * Core mind map rendering engine
 *
 * Main entry point for the SDK
 */

// Engine exports
export { LayoutEngine } from './engine/LayoutEngine';
export type { ILayoutEngine, LayoutOptions, ConnectionOptions } from './engine/LayoutEngine';

export { RenderEngine } from './engine/RenderEngine';
export type { IRenderEngine, RenderOptions } from './engine/RenderEngine';

export { MindMapEngine } from './engine/MindMapEngine';
export type { IMindMapEngine } from './engine/MindMapEngine';

// Model exports
export { NodeModel } from './models/NodeModel';

// Type exports
export type {
  Node,
  NodeWithPosition,
  NodeConnection,
  NodeType,
  NodeStyle,
  NodeMeta,
  NodePosition,
  Relation,
} from './types/node';

export type { MindMap, MindMapMetadata } from './types/mindmap';

export type {
  ThemeConfig,
  ThemeColors,
  ThemeNodeStyles,
  NodeVisualStyle,
  MindMapLayoutDirection,
  MindMapStyle,
} from './types/theme';

export type { TextSpan, TextSelection } from './types/textSpan';

export type { ExportFormat, ExportOptions, ExportResult } from './types/export';

export type { ImportFormat, ImportOptions, ImportResult } from './types/import';

// Utility exports
export {
  getContrastTextColor,
  getBranchColor,
  getPriorityColor,
  hexToRgb,
  getLuminance,
} from './utils/colorUtils';

export {
  textSpansToString,
  stringToTextSpans,
  getAllStyles,
  applyStyleToAll,
  toggleStyleInAll,
  setColorInAll,
  expandTextSpans,
} from './utils/textSpanUtils';

export { generateNodeId, generateMindMapId, isValidId } from './utils/id';

export {
  validateNode,
  validateMindMap,
  validateNodeType,
  validateNodeContent,
  getDisplayWidth,
  MAX_NODE_CONTENT_LENGTH,
  MAX_DISPLAY_WIDTH,
} from './utils/validator';

export {
  DEFAULT_LAYOUT_OPTIONS,
  DEFAULT_VIEW_STATE,
  DEFAULT_EXPORT_OPTIONS,
  COMMON_TAGS,
  NODE_TYPES,
} from './utils/constants';

// Render utilities
export { MindMapRenderer, renderMindMapFromJSON } from './utils/mindMapRenderer';
export type {
  RenderFromJSONOptions,
  RenderFromJSONResult,
  MountFromJSONResult,
} from './utils/mindMapRenderer';
