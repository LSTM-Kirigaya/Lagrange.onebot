---
name: util
description: 外部扩展能力，包括网络搜索、网页内容转换。
---

## 网络搜索 (Websearch)

**触发逻辑**: 内部记忆无法覆盖的事实性提问，使用搜索引擎搜索网页。

**数据处理**: 提炼 `snippet` 中的关键点，严禁直接复制大段网页原文。

**返回格式**: `{ url, title, snippet }[]`

## 代码案例

```typescript
const searchKey = "大语言模型进展";
const results = await util.websearch(searchKey);

if (results && results.length > 0) {
    // 仅提取前 3 条结果的标题和简介
    const summary = results.slice(0, 3)
        .map(r => `${r.title}: ${r.snippet}`)
        .join(' ');

    await context.sendGroupMsg(groupId, `根据检索，核心进展为：${summary.substring(0, 100)}...`);
}
```

## 获取网页内容 (getWebPageMarkdown)

**触发逻辑**: 上下文出现网页链接，而是你需要从网页链接中获取用户想要的有效信息时。

```typescript
// 将指定网页转换为 Markdown
const url = "https://example.com/article/123";
const page = await util.getWebPageMarkdown(url);

// page.title: 网页标题
// page.markdown: Markdown 格式的内容
// page.url: 原始 URL
await context.sendGroupMsg(groupId, `文章标题：${page.title}\n\n核心内容：${page.markdown.substring(0, 500)}...`);
```

## 约束

- 严禁将搜索到的原始 JSON 数组发给用户。
- 若搜索结果包含图片链接，应交由 `execute-task` 的图片规范处理。
- `getWebPageMarkdown` 返回的 markdown 内容可能较长，应根据需要截取后发送。
