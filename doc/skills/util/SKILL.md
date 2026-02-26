---
name: util
description: 外部扩展能力，包括网络搜索。
---

## 网络搜索 (Websearch)

**触发逻辑**: 内部记忆无法覆盖的事实性提问。

**数据处理**: 提炼 `snippet` 中的关键点，严禁直接复制大段网页原文。

**返回格式**: `{ url, title, snippet }[]`

## 代码案例

```typescript
// 执行网络搜索
const searchKey = "2024 年大语言模型进展";
const results = await util.websearch(searchKey);

if (results && results.length > 0) {
    // 仅提取前 3 条结果的标题和简介
    const summary = results.slice(0, 3)
        .map(r => `${r.title}: ${r.snippet}`)
        .join(' ');
    
    // 转化为白面鸮语气的简短结论
    await context.sendGroupMsg(groupId, `根据检索，核心进展为：${summary.substring(0, 100)}...`);
}
```

## 约束

- 严禁将搜索到的原始 JSON 数组发给用户。
- 若搜索结果包含图片链接，应交由 `execute-task` 的图片规范处理。
