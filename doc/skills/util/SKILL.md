---
name: util
description: 外部扩展能力，包括网络搜索和历史消息搜索。
---

## 网络搜索 (Websearch)

**触发逻辑**: 内部记忆无法覆盖的事实性提问。

**数据处理**: 提炼 `snippet` 中的关键点，严禁直接复制大段网页原文。

**返回格式**: `{ url, title, snippet }[]`

## 历史消息搜索 (searchHistoryMessages)

**触发逻辑**: 用户需要查找群聊中包含特定关键词的历史消息。

**功能**: 搜索指定群组的歷史消息，支持多关键词匹配（空格分隔），返回包含关键词的消息列表及发送者信息。

**参数**:
- `groupId`: number - 群组 ID
- `keywords`: string - 搜索关键词（支持多个，空格分隔，所有关键词必须同时匹配）
- `limit`: number - 返回结果数量，默认 20

**返回格式**: JSON 字符串，需 `JSON.parse` 解析
- 成功：`{ success: true, message: string, results: [{ sender, time, content }] }`
- 失败：`{ success: false, error: string }`

## 代码案例

**网络搜索**
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

**搜索历史消息**
```typescript
// 搜索群聊中包含"放假"关键词的历史消息
const searchResult = await util.searchHistoryMessages(groupId, "放假", 10);
const result = JSON.parse(searchResult);

if (result.success && result.results.length > 0) {
    // 格式化输出搜索结果
    const summary = result.results
        .slice(0, 5)
        .map(r => `${r.sender} 在 ${r.time}: ${r.content}`)
        .join('\n');
    
    await context.sendGroupMsg(groupId, `找到 ${result.results.length} 条相关消息：\n${summary}`);
} else {
    await context.sendGroupMsg(groupId, result.message || "未找到相关消息");
}
```

**多关键词搜索**
```typescript
// 搜索同时包含"明天"和"会议"的消息
const result = await util.searchHistoryMessages(groupId, "明天 会议", 20);
```

## 约束

- 严禁将搜索到的原始 JSON 数组发给用户。
- 若搜索结果包含图片链接，应交由 `execute-task` 的图片规范处理。
- 历史消息搜索最多检索 500 条历史消息，超出范围的消息无法搜索到。
- 搜索结果按时间倒序排列（最新的消息在前）。
