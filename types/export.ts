/**
 * Export related type definitions
 * 导出相关类型定义
 */

export type ExportFormat = 'png' | 'svg' | 'markdown';

export type PDFOrientation = 'portrait' | 'landscape' | 'auto';

export interface ExportOptions {
  format?: ExportFormat; // Optional in specific export methods
  filename?: string;
  backgroundColor?: string;
  transparent?: boolean;
  scale?: number; // Scale factor for PNG export, default 2x for higher clarity
  quality?: number; // PNG quality (0-1), default 0.92
  includeMetadata?: boolean; // Whether SVG includes metadata comments
  autoDownload?: boolean; // Whether to auto download, default true
  mindMap?: any; // For SVG metadata (optional)
  pdfOrientation?: PDFOrientation; // PDF export orientation: portrait, landscape, or auto
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  error?: string;
  filename?: string;
}
