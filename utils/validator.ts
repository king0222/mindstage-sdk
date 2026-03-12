/**
 * Data validation utilities
 * 数据验证工具
 */

import { z } from 'zod';
import type { Node, NodeType } from '../types';

// Node type validation
const NodeTypeSchema = z.enum(['text', 'link', 'tag', 'attachment']);

// Node style validation
const NodeStyleSchema = z.object({
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontWeight: z.enum(['normal', 'bold', 'lighter']).optional(),
  fontFamily: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().nonnegative().optional(),
  borderRadius: z.number().nonnegative().optional(),
  padding: z.number().nonnegative().optional(),
});

// Node metadata validation
const NodeMetaSchema = z.object({
  tags: z.array(z.string()).optional(),
  link: z.string().url().optional(),
  style: NodeStyleSchema.optional(),
  collapsed: z.boolean().optional(),
  expanded: z.boolean().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

// Node validation Schema (recursive)
const NodeSchema: z.ZodType<Node> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    parentId: z.string().nullable(),
    type: NodeTypeSchema,
    content: z.union([z.string(), z.array(z.any())]), // Support both string and TextSpan[]
    meta: NodeMetaSchema,
    children: z.array(NodeSchema).optional(),
  })
);

// Mind map validation Schema
const MindMapSchema = z.object({
  id: z.string().min(1),
  root: NodeSchema,
  metadata: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    createdAt: z.number(),
    updatedAt: z.number(),
    version: z.string(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

/**
 * Validate node data
 * 验证节点数据
 */
export function validateNode(node: unknown): { success: boolean; error?: string } {
  try {
    NodeSchema.parse(node);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

/**
 * Validate mind map data
 * 验证脑图数据
 */
export function validateMindMap(mindMap: unknown): { success: boolean; error?: string } {
  try {
    MindMapSchema.parse(mindMap);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

/**
 * Validate node type
 * 验证节点类型
 */
export function validateNodeType(type: string): type is NodeType {
  return NodeTypeSchema.safeParse(type).success;
}

/**
 * Validate node content
 * Limit: Max 500 Chinese characters or 1000 English characters (by display width, 1 Chinese char ≈ 2 English chars)
 * 验证节点内容
 * 限制：中文字符最多500个，英文字符最多1000个（按显示宽度，1个中文字符≈2个英文字符）
 */
export const MAX_NODE_CONTENT_LENGTH = 1000; // Max 500 Chinese characters or 1000 English characters

/**
 * Calculate string display width (Chinese characters count as 2 width)
 * 计算字符串的显示宽度（中文字符按2个宽度计算）
 */
export function getDisplayWidth(str: string): number {
  let width = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    // Check if it's a Chinese character (including Chinese punctuation)
    if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(char)) {
      width += 2; // Chinese character counts as 2 width
    } else {
      width += 1; // English character counts as 1 width
    }
  }
  return width;
}

/**
 * Get maximum display width (corresponds to 500 Chinese characters)
 * 获取最大显示宽度（对应500个中文字符）
 */
export const MAX_DISPLAY_WIDTH = 1000; // 500 Chinese characters × 2 = 1000

export function validateNodeContent(content: string): { success: boolean; error?: string } {
  if (typeof content !== 'string') {
    return { success: false, error: 'Content must be a string' };
  }
  if (content.length === 0) {
    return { success: false, error: 'Content cannot be empty' };
  }

  const displayWidth = getDisplayWidth(content);
  if (displayWidth > MAX_DISPLAY_WIDTH) {
    return { success: false, error: 'Content is too long' };
  }
  return { success: true };
}
