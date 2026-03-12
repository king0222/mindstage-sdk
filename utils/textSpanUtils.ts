/**
 * TextSpan 工具函数
 * 用于处理 TextSpan[] 与字符串之间的转换、样式应用等
 */

import type { TextSpan } from '../types/textSpan';

/**
 * 将 TextSpan[] 转换为纯文本字符串
 */
export function textSpansToString(spans: TextSpan[] | string): string {
  if (typeof spans === 'string') {
    return spans;
  }
  return spans.map((span) => span.text).join('');
}

/**
 * 将字符串转换为 TextSpan[]（默认无样式）
 */
export function stringToTextSpans(text: string | TextSpan[]): TextSpan[] {
  if (Array.isArray(text)) {
    return text;
  }
  if (!text || text.trim().length === 0) {
    return [];
  }
  return [{ text }];
}

/**
 * 合并相邻的相同样式的 TextSpan
 */
export function mergeTextSpans(spans: TextSpan[]): TextSpan[] {
  if (spans.length === 0) {
    return [];
  }

  const result: TextSpan[] = [];
  let current = { ...spans[0] };

  for (let i = 1; i < spans.length; i++) {
    const next = spans[i];

    // 检查样式是否相同
    const stylesMatch =
      current.bold === next.bold &&
      current.italic === next.italic &&
      current.underline === next.underline &&
      current.strikethrough === next.strikethrough &&
      current.color === next.color &&
      current.highlight === next.highlight;

    if (stylesMatch) {
      // 合并文本
      current.text += next.text;
    } else {
      // 保存当前片段，开始新片段
      if (current.text.length > 0) {
        result.push(current);
      }
      current = { ...next };
    }
  }

  // 添加最后一个片段
  if (current.text.length > 0) {
    result.push(current);
  }

  return result;
}

/**
 * 展开 TextSpan[] 为字符数组，保留每个字符的样式信息
 */
interface CharacterWithStyle {
  char: string;
  spanIndex: number; // 所属 TextSpan 的索引
  charIndex: number; // 在 TextSpan 中的字符索引
  span: TextSpan;
}

export function expandTextSpans(spans: TextSpan[] | string): CharacterWithStyle[] {
  const textSpans = typeof spans === 'string' ? stringToTextSpans(spans) : spans;
  const result: CharacterWithStyle[] = [];

  textSpans.forEach((span, spanIndex) => {
    for (let i = 0; i < span.text.length; i++) {
      result.push({
        char: span.text[i],
        spanIndex,
        charIndex: i,
        span,
      });
    }
  });

  return result;
}

/**
 * 根据字符索引范围，将 TextSpan[] 划分为：before + selected + after
 */
export function splitTextSpansByRange(
  spans: TextSpan[] | string,
  startOffset: number,
  endOffset: number
): {
  before: TextSpan[];
  selected: TextSpan[];
  after: TextSpan[];
} {
  const textSpans = typeof spans === 'string' ? stringToTextSpans(spans) : spans;
  const expanded = expandTextSpans(textSpans);

  if (startOffset < 0 || endOffset > expanded.length || startOffset > endOffset) {
    return {
      before: textSpans,
      selected: [],
      after: [],
    };
  }

  const before: CharacterWithStyle[] = [];
  const selected: CharacterWithStyle[] = [];
  const after: CharacterWithStyle[] = [];

  expanded.forEach((char, index) => {
    if (index < startOffset) {
      before.push(char);
    } else if (index < endOffset) {
      selected.push(char);
    } else {
      after.push(char);
    }
  });

  // 将字符数组转换回 TextSpan[]
  const beforeSpans = groupCharactersToSpans(before);
  const selectedSpans = groupCharactersToSpans(selected);
  const afterSpans = groupCharactersToSpans(after);

  return {
    before: mergeTextSpans(beforeSpans),
    selected: mergeTextSpans(selectedSpans),
    after: mergeTextSpans(afterSpans),
  };
}

/**
 * 将字符数组按样式分组为 TextSpan[]
 */
function groupCharactersToSpans(chars: CharacterWithStyle[]): TextSpan[] {
  if (chars.length === 0) {
    return [];
  }

  const result: TextSpan[] = [];
  let currentGroup: CharacterWithStyle[] = [chars[0]];

  for (let i = 1; i < chars.length; i++) {
    const char = chars[i];
    const prevChar = currentGroup[currentGroup.length - 1];

    // 检查样式是否相同
    const stylesMatch =
      prevChar.span.bold === char.span.bold &&
      prevChar.span.italic === char.span.italic &&
      prevChar.span.underline === char.span.underline &&
      prevChar.span.strikethrough === char.span.strikethrough &&
      prevChar.span.color === char.span.color &&
      prevChar.span.highlight === char.span.highlight;

    if (stylesMatch) {
      currentGroup.push(char);
    } else {
      // 保存当前组，开始新组
      result.push({
        text: currentGroup.map((c) => c.char).join(''),
        ...extractStyles(currentGroup[0].span),
      });
      currentGroup = [char];
    }
  }

  // 添加最后一组
  if (currentGroup.length > 0) {
    result.push({
      text: currentGroup.map((c) => c.char).join(''),
      ...extractStyles(currentGroup[0].span),
    });
  }

  return result;
}

/**
 * 提取样式属性
 */
function extractStyles(span: TextSpan): Partial<TextSpan> {
  return {
    bold: span.bold,
    italic: span.italic,
    underline: span.underline,
    strikethrough: span.strikethrough,
    color: span.color,
    highlight: span.highlight,
  };
}

/**
 * 应用样式到选中的文本范围
 */
export function applyStyleToSelection(
  spans: TextSpan[] | string,
  startOffset: number,
  endOffset: number,
  style: Partial<
    Pick<TextSpan, 'bold' | 'italic' | 'underline' | 'strikethrough' | 'color' | 'highlight'>
  >
): TextSpan[] {
  const { before, selected, after } = splitTextSpansByRange(spans, startOffset, endOffset);

  // 应用样式到选中的片段
  const styledSelected: TextSpan[] = selected.map((span) => ({
    ...span,
    ...style,
  }));

  // 合并结果
  const result = [...before, ...styledSelected, ...after];
  return mergeTextSpans(result);
}

/**
 * 切换样式（如果已存在则移除，如果不存在则添加）
 */
export function toggleStyleInSelection(
  spans: TextSpan[] | string,
  startOffset: number,
  endOffset: number,
  styleKey: 'bold' | 'italic' | 'underline' | 'strikethrough',
  styleValue?: boolean
): TextSpan[] {
  const { before, selected, after } = splitTextSpansByRange(spans, startOffset, endOffset);

  // 检查选中文本是否全部已有该样式
  let allHaveStyle = selected.length > 0;

  selected.forEach((span) => {
    if (span[styleKey]) {
      // 已经有该样式，继续检查
    } else {
      allHaveStyle = false;
    }
  });

  // 决定是添加还是移除样式
  const shouldApply = styleValue !== undefined ? styleValue : !allHaveStyle;

  // 应用或移除样式
  const styledSelected: TextSpan[] = selected.map((span) => {
    if (shouldApply) {
      return { ...span, [styleKey]: true };
    } else {
      const { [styleKey]: removed, ...rest } = span;
      // removed 变量用于解构，但不需要使用
      void removed;
      return rest;
    }
  });

  // 合并结果
  const result = [...before, ...styledSelected, ...after];
  return mergeTextSpans(result);
}

/**
 * 设置颜色或高亮
 */
export function setColorInSelection(
  spans: TextSpan[] | string,
  startOffset: number,
  endOffset: number,
  color?: string,
  highlight?: string
): TextSpan[] {
  const { before, selected, after } = splitTextSpansByRange(spans, startOffset, endOffset);

  // 应用颜色/高亮到选中的片段
  const styledSelected: TextSpan[] = selected.map((span) => {
    const updated = { ...span };
    if (color !== undefined) {
      updated.color = color;
    }
    if (highlight !== undefined) {
      updated.highlight = highlight;
    }
    return updated;
  });

  // 合并结果
  const result = [...before, ...styledSelected, ...after];
  return mergeTextSpans(result);
}

/**
 * 获取选中文本的当前样式（如果有多个样式，返回混合样式）
 */
export function getSelectionStyles(
  spans: TextSpan[] | string,
  startOffset: number,
  endOffset: number
): Partial<TextSpan> {
  const { selected } = splitTextSpansByRange(spans, startOffset, endOffset);

  if (selected.length === 0) {
    return {};
  }

  // 收集所有样式
  const styles: Partial<TextSpan> = {
    bold: undefined,
    italic: undefined,
    underline: undefined,
    strikethrough: undefined,
    color: undefined,
    highlight: undefined,
  };

  selected.forEach((span) => {
    if (span.bold) styles.bold = true;
    if (span.italic) styles.italic = true;
    if (span.underline) styles.underline = true;
    if (span.strikethrough) styles.strikethrough = true;
    if (span.color) styles.color = span.color;
    if (span.highlight) styles.highlight = span.highlight;
  });

  // 检查布尔样式是否全部相同
  const expanded = expandTextSpans(selected);
  if (expanded.length > 0) {
    // 如果所有片段都有相同的布尔样式，则设置；否则不设置（表示混合状态）
    const allBold = expanded.every((char) => char.span.bold === true);
    const allNotBold = expanded.every((char) => !char.span.bold);
    styles.bold = allBold ? true : allNotBold ? false : undefined;

    const allItalic = expanded.every((char) => char.span.italic === true);
    const allNotItalic = expanded.every((char) => !char.span.italic);
    styles.italic = allItalic ? true : allNotItalic ? false : undefined;

    const allUnderline = expanded.every((char) => char.span.underline === true);
    const allNotUnderline = expanded.every((char) => !char.span.underline);
    styles.underline = allUnderline ? true : allNotUnderline ? false : undefined;

    const allStrikethrough = expanded.every((char) => char.span.strikethrough === true);
    const allNotStrikethrough = expanded.every((char) => !char.span.strikethrough);
    styles.strikethrough = allStrikethrough ? true : allNotStrikethrough ? false : undefined;

    // 颜色：如果所有片段颜色相同，则使用该颜色；否则不设置（表示混合状态）
    const allSameColor = expanded.every((char) => char.span.color === expanded[0].span.color);
    styles.color = allSameColor ? expanded[0].span.color : undefined;

    const allSameHighlight = expanded.every(
      (char) => char.span.highlight === expanded[0].span.highlight
    );
    styles.highlight = allSameHighlight ? expanded[0].span.highlight : undefined;
  }

  // 清理未定义的属性
  Object.keys(styles).forEach((key) => {
    if (styles[key as keyof TextSpan] === undefined) {
      delete styles[key as keyof TextSpan];
    }
  });

  return styles;
}

/**
 * 应用样式到整个文本内容（不是选中范围，而是全部内容）
 */
export function applyStyleToAll(
  spans: TextSpan[] | string,
  style: Partial<
    Pick<TextSpan, 'bold' | 'italic' | 'underline' | 'strikethrough' | 'color' | 'highlight'>
  >
): TextSpan[] {
  const textSpans = typeof spans === 'string' ? stringToTextSpans(spans) : spans;

  // 应用样式到所有片段
  const styledSpans: TextSpan[] = textSpans.map((span) => ({
    ...span,
    ...style,
  }));

  return mergeTextSpans(styledSpans);
}

/**
 * 切换样式到整个文本内容（如果已存在则移除，如果不存在则添加）
 */
export function toggleStyleInAll(
  spans: TextSpan[] | string,
  styleKey: 'bold' | 'italic' | 'underline' | 'strikethrough',
  styleValue?: boolean
): TextSpan[] {
  const textSpans = typeof spans === 'string' ? stringToTextSpans(spans) : spans;

  // 检查是否所有片段都有该样式
  let allHaveStyle = textSpans.length > 0;
  textSpans.forEach((span) => {
    if (!span[styleKey]) {
      allHaveStyle = false;
    }
  });

  // 决定是添加还是移除样式
  const shouldApply = styleValue !== undefined ? styleValue : !allHaveStyle;

  // 应用或移除样式
  const styledSpans: TextSpan[] = textSpans.map((span) => {
    if (shouldApply) {
      return { ...span, [styleKey]: true };
    } else {
      const { [styleKey]: removed, ...rest } = span;
      // removed 变量用于解构，但不需要使用
      void removed;
      return rest;
    }
  });

  return mergeTextSpans(styledSpans);
}

/**
 * 设置颜色或高亮到整个文本内容
 * @param color - 如果为 undefined，则清除颜色；如果为字符串，则设置颜色
 * @param highlight - 如果为 undefined，则清除高亮；如果为字符串，则设置高亮
 */
export function setColorInAll(
  spans: TextSpan[] | string,
  color?: string | undefined,
  highlight?: string | undefined
): TextSpan[] {
  const textSpans = typeof spans === 'string' ? stringToTextSpans(spans) : spans;

  // 应用颜色/高亮到所有片段
  const styledSpans: TextSpan[] = textSpans.map((span) => {
    const updated = { ...span };

    // 处理颜色：如果传入 undefined，清除颜色；否则设置颜色
    if (color === undefined && 'color' in updated) {
      // 清除颜色
      const { color: removedColor, ...rest } = updated;
      void removedColor; // 标记为已使用
      return rest as TextSpan;
    } else if (color !== undefined) {
      updated.color = color;
    }

    // 处理高亮：如果传入 undefined，清除高亮；否则设置高亮
    if (highlight === undefined && 'highlight' in updated) {
      // 清除高亮
      const { highlight: removedHighlight, ...rest } = updated;
      void removedHighlight; // 标记为已使用
      return rest as TextSpan;
    } else if (highlight !== undefined) {
      updated.highlight = highlight;
    }

    return updated;
  });

  return mergeTextSpans(styledSpans);
}

/**
 * 获取整个文本内容的当前样式（如果有多个样式，返回混合样式）
 */
export function getAllStyles(spans: TextSpan[] | string): Partial<TextSpan> {
  const textSpans = typeof spans === 'string' ? stringToTextSpans(spans) : spans;

  if (textSpans.length === 0) {
    return {};
  }

  // 检查布尔样式是否全部相同
  const expanded = expandTextSpans(textSpans);
  if (expanded.length === 0) {
    return {};
  }

  const styles: Partial<TextSpan> = {};

  const allBold = expanded.every((char) => char.span.bold === true);
  const allNotBold = expanded.every((char) => !char.span.bold);
  styles.bold = allBold ? true : allNotBold ? false : undefined;

  const allItalic = expanded.every((char) => char.span.italic === true);
  const allNotItalic = expanded.every((char) => !char.span.italic);
  styles.italic = allItalic ? true : allNotItalic ? false : undefined;

  const allUnderline = expanded.every((char) => char.span.underline === true);
  const allNotUnderline = expanded.every((char) => !char.span.underline);
  styles.underline = allUnderline ? true : allNotUnderline ? false : undefined;

  const allStrikethrough = expanded.every((char) => char.span.strikethrough === true);
  const allNotStrikethrough = expanded.every((char) => !char.span.strikethrough);
  styles.strikethrough = allStrikethrough ? true : allNotStrikethrough ? false : undefined;

  // 颜色：如果所有片段颜色相同，则使用该颜色；否则不设置（表示混合状态）
  const allSameColor = expanded.every((char) => char.span.color === expanded[0].span.color);
  styles.color = allSameColor ? expanded[0].span.color : undefined;

  const allSameHighlight = expanded.every(
    (char) => char.span.highlight === expanded[0].span.highlight
  );
  styles.highlight = allSameHighlight ? expanded[0].span.highlight : undefined;

  // 清理未定义的属性
  Object.keys(styles).forEach((key) => {
    if (styles[key as keyof TextSpan] === undefined) {
      delete styles[key as keyof TextSpan];
    }
  });

  return styles;
}
