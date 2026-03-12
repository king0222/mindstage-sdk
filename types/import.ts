/**
 * Import related type definitions
 * 导入相关类型定义
 */

import type { MindMap } from './mindmap';

export type ImportFormat = 'markdown' | 'json' | 'text';

export interface ImportOptions {
  format: ImportFormat;
  title?: string; // Use this title if Markdown has no title
  autoDetectFormat?: boolean; // Auto detect format
}

export interface ImportResult {
  success: boolean;
  mindMap?: MindMap;
  error?: string;
  warnings?: string[]; // Warnings during import
}
