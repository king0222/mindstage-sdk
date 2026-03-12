/**
 * 文本片段类型定义
 * 用于实现轻量级富文本样式（Inline Marks）
 */

/**
 * 文本片段 - 支持粗体、斜体、下划线、删除线、颜色、高亮等样式
 */
export interface TextSpan {
  /** 文本内容 */
  text: string;
  /** 粗体 */
  bold?: boolean;
  /** 斜体 */
  italic?: boolean;
  /** 下划线 */
  underline?: boolean;
  /** 删除线 */
  strikethrough?: boolean;
  /** 字体颜色 */
  color?: string;
  /** 背景高亮颜色 */
  highlight?: string;
}

/**
 * 文本选择范围
 */
export interface TextSelection {
  /** 节点 ID */
  nodeId: string;
  /** 起始字符位置（在 TextSpan[] 展开为字符串后的位置） */
  startOffset: number;
  /** 结束字符位置（在 TextSpan[] 展开为字符串后的位置） */
  endOffset: number;
  /** 选中文本内容 */
  text: string;
  /** 选择框的位置（用于浮动工具栏定位） */
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
