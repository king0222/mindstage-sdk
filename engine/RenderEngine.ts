/**
 * 渲染引擎
 * 负责 SVG/Canvas 渲染
 */

import type { NodeWithPosition, NodeConnection, ExportFormat, ExportOptions } from '../types';
import { textSpansToString } from '../utils/textSpanUtils';
import { getBranchColor } from '../utils/colorUtils';

export interface RenderOptions {
  scale?: number;
  showConnections?: boolean;
  highlightNodeIds?: string[];
  selectedNodeIds?: string[];
  backgroundColor?: string;
  padding?: number;
  branchPalette?: string[]; // 自定义分支颜色调色板
}

export interface IRenderEngine {
  renderToSVG(
    nodes: NodeWithPosition[],
    connections: NodeConnection[],
    options?: RenderOptions
  ): string;
  renderToCanvas(
    nodes: NodeWithPosition[],
    connections: NodeConnection[],
    canvas: HTMLCanvasElement,
    options?: RenderOptions
  ): void;
  export(format: ExportFormat, options?: ExportOptions): Promise<Blob | string>;
}

export class RenderEngine implements IRenderEngine {
  // 默认分支颜色调色板（多彩色系）
  private readonly DEFAULT_BRANCH_PALETTE = [
    '#6366f1', // 靛蓝
    '#8b5cf6', // 紫色
    '#ec4899', // 粉色
    '#f43f5e', // 玫瑰红
    '#ef4444', // 红色
    '#f59e0b', // 橙色
    '#eab308', // 黄色
    '#84cc16', // 黄绿色
    '#22c55e', // 绿色
    '#10b981', // 翠绿
    '#14b8a6', // 青色
    '#06b6d4', // 天蓝
    '#3b82f6', // 蓝色
    '#6366f1', // 靛蓝（循环）
  ];

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Calculate branch color for a node based on its parent's branch and sibling index
   * 根据节点的父分支和兄弟索引计算分支颜色
   */
  private calculateBranchColor(
    node: NodeWithPosition,
    nodes: NodeWithPosition[],
    nodeColorMap: Map<string, string>,
    options: RenderOptions = {}
  ): string {
    // 如果节点已指定颜色，优先使用
    if (node.meta.style?.backgroundColor) {
      return node.meta.style.backgroundColor;
    }

    // 根节点使用特殊颜色
    if (node.level === 0) {
      return '#ffffff'; // 根节点保持白色背景
    }

    // 获取父节点
    if (!node.parentId) {
      return '#ffffff';
    }

    const parent = nodes.find((n) => n.id === node.parentId);
    if (!parent) {
      return '#ffffff';
    }

    // 获取同级兄弟节点
    const siblings = nodes.filter((n) => n.parentId === node.parentId && n.level === node.level);

    // 计算当前节点在兄弟节点中的索引
    const siblingIndex = siblings
      .sort((a, b) => a.position.y - b.position.y) // 按 Y 坐标排序
      .findIndex((n) => n.id === node.id);

    // 获取父节点的分支颜色（如果没有，使用根节点颜色）
    const parentBranchColor = nodeColorMap.get(node.parentId) || '#6366f1';

    // 对于第一层子节点（level === 1），使用调色板分配颜色
    if (node.level === 1) {
      const palette = options.branchPalette || this.DEFAULT_BRANCH_PALETTE;
      return getBranchColor(siblingIndex, siblings.length, palette);
    }

    // 对于更深层的节点，使用父节点颜色的淡色版本
    // 稍微调整色调以区分不同分支
    return this.adjustColorBrightness(parentBranchColor, 0.15, siblingIndex * 0.05);
  }

  /**
   * Adjust color brightness and slightly shift hue
   * 调整颜色亮度并略微调整色调
   */
  private adjustColorBrightness(
    hex: string,
    brightnessDelta: number,
    hueShift: number = 0
  ): string {
    // 解析颜色
    const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!hexMatch) return '#f0f0f0';

    const r = parseInt(hexMatch[1], 16);
    const g = parseInt(hexMatch[2], 16);
    const b = parseInt(hexMatch[3], 16);

    // 转换为 HSL 进行更自然的颜色调整
    const rgbToHsl = (r: number, g: number, b: number) => {
      r /= 255;
      g /= 255;
      b /= 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let hue = 0,
        s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
          case g:
            hue = ((b - r) / d + 2) / 6;
            break;
          case b:
            hue = ((r - g) / d + 4) / 6;
            break;
        }
      }

      return [hue, s, l];
    };

    const [currentHue, s, l] = rgbToHsl(r, g, b);

    // 调整亮度和色调
    const newL = Math.max(0.9, Math.min(1, l + brightnessDelta));
    const newH = (currentHue + hueShift) % 1;

    // HSL 转回 RGB
    const hslToRgb = (hue: number, s: number, l: number) => {
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, hue + 1 / 3);
        g = hue2rgb(p, q, hue);
        b = hue2rgb(p, q, hue - 1 / 3);
      }
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };

    const [newR, newG, newB] = hslToRgb(newH, s, newL);
    return `#${[newR, newG, newB]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')}`;
  }

  private getNodeStyle(node: NodeWithPosition, options: RenderOptions, bgColor?: string): string {
    const styles: string[] = [];
    const isRoot = node.level === 0;
    // 默认样式：根节点默认使用主题色背景，非根节点默认白色
    const defaultBg = isRoot ? '#6366f1' : '#ffffff';
    const backgroundColor = bgColor || node.meta.style?.backgroundColor || defaultBg;
    const borderColor =
      node.meta.style?.borderColor || this.getBorderColorFromBackground(backgroundColor);
    const borderWidth = node.meta.style?.borderWidth || 2; // 加粗默认边框

    styles.push(`fill: ${backgroundColor}`);
    styles.push(`stroke: ${borderColor}`);
    styles.push(`stroke-width: ${borderWidth}`);

    if (options.highlightNodeIds?.includes(node.id)) {
      styles.push(
        'stroke: #096DD9; stroke-width: 3; filter: drop-shadow(0 0 4px rgba(9, 109, 217, 0.5));'
      );
    }

    if (options.selectedNodeIds?.includes(node.id)) {
      styles.push('stroke: #1890FF; stroke-width: 3;');
    }

    return styles.join('; ');
  }

  /**
   * Get border color from background color
   * 根据背景色计算边框颜色
   */
  private getBorderColorFromBackground(bgColor: string): string {
    // 如果是白色或浅色背景，使用灰色边框
    if (bgColor === '#ffffff' || bgColor === '#fff') {
      return '#e0e0e0';
    }
    // 否则使用背景色的深色版本
    return this.adjustColorBrightness(bgColor, -0.3);
  }

  private renderNode(node: NodeWithPosition, options: RenderOptions, bgColor?: string): string {
    const { x, y, width, height } = node.position;
    const style = this.getNodeStyle(node, options, bgColor);
    const contentText =
      typeof node.content === 'string'
        ? node.content
        : node.content.map((span) => span.text).join('');
    const content = this.escapeXml(contentText);

    // 渲染折叠/展开按钮
    const collapseButton = this.renderCollapseButton(node);
    // 增大圆角，使其看起来更现代
    const rx = node.level === 0 ? 12 : 8;

    const rect = `<rect
      x="${x}"
      y="${y}"
      width="${width}"
      height="${height}"
      rx="${rx}"
      style="${style}"
    />`;

    const textX = x + width / 2;
    const textY = y + height / 2;
    // 根据节点层级设置字体大小：根节点最大，一级节点次之，其他节点默认
    const isRoot = node.level === 0;
    const defaultFontSize = isRoot ? 30 : node.level === 1 ? 20 : 14;
    const fontSize = node.meta.style?.fontSize || defaultFontSize;
    const fontWeight = node.level === 0 ? 'bold' : node.meta.style?.fontWeight || 'normal';
    const fillColor = node.meta.style?.color || '#333333';

    // SVG 文本垂直居中 dominant-baseline 兼容性处理
    const text = `<text
      x="${textX}"
      y="${textY}"
      text-anchor="middle"
      dominant-baseline="central"
      dy=".1em" 
      font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      font-size="${fontSize}"
      font-weight="${fontWeight}"
      fill="${fillColor}"
      style="pointer-events: none;"
    >${content}</text>`;

    return `<g class="node-group" data-id="${node.id}">${rect}${text}${collapseButton}</g>`;
  }

  /**
   * 渲染折叠/展开按钮
   */
  private renderCollapseButton(node: NodeWithPosition): string {
    // 只有有子节点的节点才显示折叠按钮
    if (!node.children || node.children.length === 0) {
      return '';
    }

    const { x, y, width, height } = node.position;
    const isCollapsed = node.meta.collapsed === true;
    const direction = node.direction || 'right';

    // 按钮半径
    const r = 8;
    // 按钮位置：位于节点边缘
    const btnX = direction === 'right' ? x + width : x;
    const btnY = y + height / 2;

    // 绘制圆圈背景
    const circle = `<circle
      cx="${btnX}"
      cy="${btnY}"
      r="${r}"
      fill="white"
      stroke="#6366f1"
      stroke-width="1"
      class="collapse-btn"
      data-id="${node.id}"
      style="cursor: pointer;"
    />`;

    // 绘制符号 (+ 或 -)
    const signSize = 4;
    const horizontalLine = `<line
      x1="${btnX - signSize}" y1="${btnY}"
      x2="${btnX + signSize}" y2="${btnY}"
      stroke="#6366f1"
      stroke-width="1.5"
      style="pointer-events: none;"
    />`;

    const verticalLine = isCollapsed ? `<line
      x1="${btnX}" y1="${btnY - signSize}"
      x2="${btnX}" y2="${btnY + signSize}"
      stroke="#6366f1"
      stroke-width="1.5"
      style="pointer-events: none;"
    />` : '';

    return `<g class="collapse-group">${circle}${horizontalLine}${verticalLine}</g>`;
  }

  renderToSVG(
    nodes: NodeWithPosition[],
    connections: NodeConnection[],
    options: RenderOptions = {}
  ): string {
    const scale = options.scale || 1;
    const padding = options.padding || 40; // 增加默认内边距
    const backgroundColor = options.backgroundColor || '#f5f7fa'; // 柔和的背景色
    const showConnections = options.showConnections !== false;

    const bounds = this.calculateBounds(nodes);
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    const width = (contentWidth + padding * 2) * scale;
    const height = (contentHeight + padding * 2) * scale;

    // 计算每个节点的颜色（按层级顺序）
    const nodeColorMap = new Map<string, string>();
    nodes.forEach((node) => {
      const color = this.calculateBranchColor(node, nodes, nodeColorMap, options);
      nodeColorMap.set(node.id, color);
    });

    const svgContent: string[] = [];

    // 背景
    svgContent.push(
      `<rect x="0" y="0" width="${width}" height="${height}" fill="${backgroundColor}" />`
    );

    // 变换组：平移到中心 + 缩放
    const translateX = (-bounds.minX + padding) * scale;
    const translateY = (-bounds.minY + padding) * scale;

    // 注意：这里的 scale 应用在 g 上，所以内部坐标不需要乘 scale
    svgContent.push(`<g transform="translate(${translateX}, ${translateY}) scale(${scale})">`);

    if (showConnections) {
      connections.forEach((conn) => {
        // 连接线颜色使用目标节点的分支颜色，或使用连接线指定的颜色
        let strokeColor = conn.color;

        if (!strokeColor) {
          // 获取目标节点的颜色
          const targetNodeColor = nodeColorMap.get(conn.to);
          if (targetNodeColor && targetNodeColor !== '#ffffff') {
            // 使用节点颜色的深色版本作为连接线颜色
            strokeColor = this.adjustColorBrightness(targetNodeColor, -0.4);
          } else {
            // 如果节点是白色或没有颜色，使用默认灰色
            const level = conn.level ?? 0;
            strokeColor = level === 0 ? '#A0A0A0' : '#C0C0C0';
          }
        }

        const strokeWidth = Math.max(1, 3 - (conn.level ?? 0) * 0.5); // 根节点连线粗，越往外越细

        if (conn.path) {
          svgContent.push(`<path
            d="${conn.path}"
            fill="none"
            stroke="${strokeColor}"
            stroke-width="${strokeWidth}"
            stroke-linecap="round"
          />`);
        }
      });
    }

    nodes.forEach((node) => {
      const bgColor = nodeColorMap.get(node.id);
      svgContent.push(this.renderNode(node, options, bgColor));
    });

    svgContent.push('</g>');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  style="font-family: sans-serif;"
>
  ${svgContent.join('\n  ')}
</svg>`;
  }

  renderToCanvas(
    nodes: NodeWithPosition[],
    connections: NodeConnection[],
    canvas: HTMLCanvasElement,
    options: RenderOptions = {}
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2d context');

    // 处理高清屏模糊问题 (DPR)
    const dpr = window.devicePixelRatio || 1;
    const scale = options.scale || 1;
    const padding = options.padding || 40;

    const bounds = this.calculateBounds(nodes);
    const logicWidth = bounds.maxX - bounds.minX + padding * 2;
    const logicHeight = bounds.maxY - bounds.minY + padding * 2;

    // Canvas 实际像素尺寸
    canvas.width = logicWidth * scale * dpr;
    canvas.height = logicHeight * scale * dpr;

    // CSS 显示尺寸
    canvas.style.width = `${logicWidth * scale}px`;
    canvas.style.height = `${logicHeight * scale}px`;

    // 坐标系缩放
    ctx.scale(dpr * scale, dpr * scale);

    // 填充背景
    ctx.fillStyle = options.backgroundColor || '#f5f7fa';
    ctx.fillRect(0, 0, logicWidth, logicHeight);

    // 移动原点
    ctx.translate(-bounds.minX + padding, -bounds.minY + padding);

    // 绘制连接线
    if (options.showConnections !== false) {
      connections.forEach((conn) => {
        if (!conn.path) return;

        // 检查必要的连接点是否存在
        if (!conn.fromPoint || !conn.toPoint) return;

        const level = conn.level ?? 0;
        const strokeColor = level === 0 ? '#A0A0A0' : '#C0C0C0';
        const strokeWidth = Math.max(1, 3 - level * 0.5);

        ctx.beginPath();
        // SVG Path to Canvas Path (简化版，只处理 M 和 C)
        // 实际生产建议使用 Path2D (如果浏览器支持) 或解析器
        // 这里直接复用 LayoutEngine 算出的 Path string 是无法直接给 Canvas 的
        // 所以我们用原始点重绘：
        const { fromPoint, toPoint } = conn;
        // 重新计算控制点（保持与 LayoutEngine 一致逻辑）
        const isLeft = toPoint.x < fromPoint.x;
        const distX = Math.abs(toPoint.x - fromPoint.x);
        const controlOffset = Math.max(distX * 0.4, 20);

        ctx.moveTo(fromPoint.x, fromPoint.y);
        ctx.bezierCurveTo(
          isLeft ? fromPoint.x - controlOffset : fromPoint.x + controlOffset,
          fromPoint.y,
          isLeft ? toPoint.x + controlOffset : toPoint.x - controlOffset,
          toPoint.y,
          toPoint.x,
          toPoint.y
        );

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
      });
    }

    // 绘制节点
    nodes.forEach((node) => {
      const { x, y, width, height } = node.position;
      const rx = node.level === 0 ? 6 : 4;

      // 阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = node.meta.style?.backgroundColor || '#ffffff';
      ctx.strokeStyle = node.meta.style?.borderColor || '#e0e0e0';
      ctx.lineWidth = node.meta.style?.borderWidth || 2;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, width, height, rx);
      } else {
        ctx.rect(x, y, width, height); // Fallback
      }
      ctx.fill();

      // 边框不需要阴影
      ctx.shadowColor = 'transparent';
      ctx.stroke();

      // 文本
      ctx.fillStyle = node.meta.style?.color || '#333333';
      // 根据节点层级设置字体大小：根节点最大，一级节点次之，其他节点默认
      const isRoot = node.level === 0;
      const defaultFontSize = isRoot ? 30 : node.level === 1 ? 20 : 14;
      const fontSize = node.meta.style?.fontSize || defaultFontSize;
      const fontWeight = node.level === 0 ? 'bold' : node.meta.style?.fontWeight || 'normal';

      const contentText =
        typeof node.content === 'string' ? node.content : textSpansToString(node.content);
      ctx.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(contentText, x + width / 2, y + height / 2);
    });
  }

  private calculateBounds(nodes: NodeWithPosition[]) {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    nodes.forEach((n) => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + n.position.width);
      maxY = Math.max(maxY, n.position.y + n.position.height);
    });
    return { minX, minY, maxX, maxY };
  }

  async export(_format: ExportFormat, _options?: ExportOptions): Promise<Blob | string> {
    throw new Error('Method not implemented.');
  }
}
