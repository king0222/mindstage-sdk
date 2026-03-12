/**
 * Color Utilities
 * 颜色工具函数
 */

/**
 * 将十六进制颜色转换为 RGB 值
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * 计算颜色的相对亮度（根据 WCAG 标准）
 * @param rgb RGB 颜色值
 * @returns 相对亮度值（0-1）
 */
export function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 根据背景色自动计算高对比度的文本颜色
 * 使用 WCAG 对比度标准，确保文本在背景上可读
 * @param backgroundColor 背景色（十六进制格式，如 #000000 或 #fff）
 * @returns 高对比度的文本颜色（白色 #ffffff 或黑色 #000000）
 */
export function getContrastTextColor(backgroundColor: string): string {
  // 规范化颜色格式
  let normalizedColor = backgroundColor.trim();
  if (!normalizedColor.startsWith('#')) {
    normalizedColor = '#' + normalizedColor;
  }

  // 如果是 3 位十六进制，转换为 6 位
  if (normalizedColor.length === 4) {
    normalizedColor =
      '#' +
      normalizedColor[1] +
      normalizedColor[1] +
      normalizedColor[2] +
      normalizedColor[2] +
      normalizedColor[3] +
      normalizedColor[3];
  }

  const rgb = hexToRgb(normalizedColor);
  if (!rgb) {
    // 如果颜色格式无效，默认返回白色
    return '#ffffff';
  }

  const luminance = getLuminance(rgb);

  // 如果背景较暗（亮度 < 0.5），返回白色文本；否则返回黑色文本
  // WCAG AA 标准要求对比度至少为 4.5:1（正常文本）或 3:1（大文本）
  // 使用 0.5 作为阈值是一个合理的近似值
  return luminance < 0.5 ? '#ffffff' : '#000000';
}

/**
 * 验证颜色字符串是否为有效的十六进制颜色
 */
export function isValidHexColor(color: string): boolean {
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexPattern.test(color);
}

/**
 * 根据兄弟节点索引从调色板中获取分支颜色
 * @param siblingIndex 节点在其兄弟节点中的索引（从0开始）
 * @param _totalSiblings 兄弟节点的总数（保留用于未来扩展）
 * @param palette 调色板颜色数组
 * @returns 颜色值（十六进制格式）
 */
export function getBranchColor(
  siblingIndex: number,
  _totalSiblings: number,
  palette: string[]
): string {
  if (!palette || palette.length === 0) {
    // 如果调色板为空，返回默认颜色
    return '#6366f1';
  }

  // 如果只有一个颜色，直接返回
  if (palette.length === 1) {
    return palette[0];
  }

  // 将索引映射到调色板颜色
  // 使用模运算确保索引在调色板范围内
  const colorIndex = siblingIndex % palette.length;
  return palette[colorIndex];
}

/**
 * 根据优先级获取颜色
 * 优先级范围：1-7
 * @param priority 优先级（1-7）
 * @returns 颜色值（十六进制格式）
 */
export function getPriorityColor(priority: number): string {
  // 优先级颜色映射（从低到高：蓝绿黄橙红紫）
  const priorityColors: Record<number, string> = {
    1: '#3b82f6', // 蓝色 - 低优先级
    2: '#06b6d4', // 青色
    3: '#10b981', // 绿色
    4: '#eab308', // 黄色 - 中等优先级
    5: '#f59e0b', // 橙色
    6: '#ef4444', // 红色 - 高优先级
    7: '#a855f7', // 紫色 - 最高优先级
  };

  // 确保优先级在有效范围内（1-7）
  const validPriority = Math.max(1, Math.min(7, Math.round(priority)));
  return priorityColors[validPriority] || priorityColors[4]; // 默认为黄色（中等优先级）
}
