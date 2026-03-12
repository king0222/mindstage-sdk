# Supported JSON Formats

# 支持的 JSON 格式

SDK 支持多种 JSON 格式，可以灵活地从不同来源的数据渲染脑图。

## 1. Complete MindMap Format (完整脑图格式)

最完整的格式，包含所有元数据：

```json
{
  "id": "mindmap_1",
  "root": {
    "id": "node_1",
    "parentId": null,
    "type": "text",
    "content": "Root Node",
    "meta": {
      "tags": ["important"],
      "style": {
        "backgroundColor": "#f0f0f0",
        "color": "#333"
      }
    },
    "children": [
      {
        "id": "node_2",
        "parentId": "node_1",
        "type": "text",
        "content": "Child 1",
        "meta": {},
        "children": []
      }
    ]
  },
  "metadata": {
    "title": "My Mind Map",
    "description": "A sample mind map",
    "createdAt": 1234567890,
    "updatedAt": 1234567890,
    "version": "1.0.0",
    "author": "John Doe"
  }
}
```

## 2. Node Format (节点格式)

只包含节点树结构，SDK 会自动创建 MindMap 包装：

```json
{
  "id": "node_1",
  "content": "Root",
  "children": [
    {
      "content": "Child 1",
      "children": [{ "content": "Grandchild 1.1" }, { "content": "Grandchild 1.2" }]
    },
    {
      "content": "Child 2"
    }
  ]
}
```

## 3. Simplified Format (简化格式)

最简单的格式，只包含文本和子节点：

```json
{
  "text": "Root",
  "children": [{ "text": "Branch 1", "children": [{ "text": "Leaf 1.1" }] }, { "text": "Branch 2" }]
}
```

## 4. String Format (字符串格式)

最简单的格式，根节点是字符串：

```json
{
  "text": "My Mind Map",
  "children": [
    "Child 1",
    "Child 2",
    {
      "text": "Child 3",
      "children": ["Grandchild 3.1"]
    }
  ]
}
```

## Usage Examples

### Example 1: Complete Format

```typescript
import { renderMindMapFromJSON } from 'mindstage-sdk';

const json = JSON.stringify({
  id: 'mindmap_1',
  root: {
    id: 'node_1',
    content: 'Root',
    children: [{ content: 'Child 1' }],
  },
  metadata: {
    title: 'My Map',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: '1.0.0',
  },
});

const svg = renderMindMapFromJSON(json);
```

### Example 2: Simplified Format

```typescript
const simpleJson = JSON.stringify({
  text: 'Root',
  children: [{ text: 'Child 1' }, { text: 'Child 2' }],
});

const svg = renderMindMapFromJSON(simpleJson);
```

### Example 3: With Custom Options

```typescript
import { MindMapRenderer } from 'mindstage-sdk';

const renderer = new MindMapRenderer();
const result = renderer.renderFromJSON(json, {
  backgroundColor: '#f5f5f5',
  scale: 1.5,
  layoutOptions: {
    layoutDirection: 'left-right',
    spacing: {
      horizontal: 80,
      vertical: 40,
    },
  },
});

if (result.success) {
  console.log(result.svg);
}
```

## Notes

- SDK 会自动处理缺失的字段，使用默认值
- ID 会自动生成（如果缺失）
- 支持嵌套的 children 数组
- 支持 TextSpan[] 格式的内容（富文本）
- 验证是可选的（默认开启）
