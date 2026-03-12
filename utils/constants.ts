/**
 * Constants definitions
 * 常量定义
 */

// Node types
export const NODE_TYPES = {
  TEXT: 'text',
  LINK: 'link',
  TAG: 'tag',
  ATTACHMENT: 'attachment',
} as const;

// Default layout configuration - optimized for compact spacing, similar to markmap
export const DEFAULT_LAYOUT_OPTIONS = {
  direction: 'horizontal' as const,
  spacing: {
    horizontal: 60, // Reduced from 100 to 60, more compact
    vertical: 30, // Reduced from 50 to 30, more compact
  },
  nodeSize: {
    width: 100,
    height: 30, // Reduced from 60 to 30, half size
  },
};

// Default view state
export const DEFAULT_VIEW_STATE = {
  scale: 1,
  translateX: 0,
  translateY: 0,
};

// Export configuration
export const DEFAULT_EXPORT_OPTIONS = {
  backgroundColor: '#ffffff',
  transparent: false,
  scale: 1,
  quality: 0.92,
  includeMetadata: true,
};

// Common tags configuration
export const COMMON_TAGS = [
  { label: 'Important', color: '#ef4444' },
  { label: 'Urgent', color: '#f59e0b' },
  { label: 'To Do', color: '#3b82f6' },
  { label: 'Done', color: '#10b981' },
  { label: 'In Progress', color: '#8b5cf6' },
  { label: 'Review', color: '#ec4899' },
  { label: 'Idea', color: '#06b6d4' },
  { label: 'Issue', color: '#f97316' },
  { label: 'Plan', color: '#6366f1' },
  { label: 'Note', color: '#14b8a6' },
  { label: 'Reference', color: '#a855f7' },
  { label: 'Archive', color: '#64748b' },
] as const;
