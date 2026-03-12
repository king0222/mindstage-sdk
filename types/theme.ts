/**
 * 主题系统类型定义
 */

import type { NodeStyle } from './node';

/**
 * 主题颜色配置
 */
export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  primaryHover: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning?: string;
  info?: string;
  [key: string]: string | undefined;
}

/**
 * 节点样式配置
 */
export interface ThemeNodeStyles {
  default: NodeStyle;
  primary?: NodeStyle;
  secondary?: NodeStyle;
  success?: NodeStyle;
  warning?: NodeStyle;
  error?: NodeStyle;
  [key: string]: NodeStyle | undefined;
}

/**
 * 节点视觉样式类型
 */
export type NodeVisualStyle = 'rectangle' | 'underline' | 'circle' | 'card' | 'null';

/**
 * 脑图布局方向
 */
export type MindMapLayoutDirection = 'left' | 'right' | 'left-right';

/**
 * 脑图样式配置（针对脑图本身的样式，不影响页面UI）
 */
export interface MindMapStyle {
  nodeVisualStyle: NodeVisualStyle; // 节点视觉样式
  layoutDirection: MindMapLayoutDirection; // 布局方向（子节点在左侧还是右侧）
  connectionColors?: {
    // 连线颜色配置（根据层级）
    baseColor: string; // 基础颜色
    colorSteps?: number; // 颜色渐变步数
    lightness?: number; // 每层亮度变化（0-1）
  };
  nodeSpacing?: {
    horizontal: number; // 水平间距
    vertical: number; // 垂直间距
  };
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  colors: ThemeColors;
  nodeStyles: ThemeNodeStyles;
  mindMapStyle?: MindMapStyle; // 脑图样式配置
  spacing?: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  borderRadius?: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows?: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  [key: string]: unknown;
}

/**
 * 主题定义
 */
export interface Theme {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  config: ThemeConfig;
  isDefault?: boolean;
  isCustom?: boolean; // 用户自定义主题
}

/**
 * 主题预设 ID
 */
export type ThemePresetId = 'apple-light' | 'apple-dark';
