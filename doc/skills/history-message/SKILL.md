---
name: history-message
description: 历史消息搜索功能。支持关键词搜索群聊和好友的历史消息记录。
---

## 功能概述

提供类似于搜索引擎的历史消息搜索功能，可根据关键词查找包含该关键词的历史消息及发送者信息。

## API

### searchHistoryMessages(groupId, keywords, limit)

搜索群聊历史消息（推荐 AI 使用此方法）。

**参数**:
- `groupId`: number - 群组 ID
- `keywords`: string - 搜索关键词（支持多个，空格分隔）
- `limit`: number - 返回结果数量，默认 20

**返回**: JSON 字符串，需 `JSON.parse` 解析
- 成功：`{ success: true, message: string, results: [{ sender, time, content }] }`
- 失败：`{ success: false, error: string }`

### searchGroupMsgHistory(context, options)

底层函数，搜索群聊历史消息。

**参数**:
- `context`: LagrangeContext - 上下文对象
- `options`: 
  - `keywords`: string - 搜索关键词
  - `groupId`: number - 群组 ID
  - `maxMessages`: number - 最大搜索消息数，默认 500
  - `limit`: number - 返回结果数量，默认 20
  - `caseSensitive`: boolean - 是否区分大小写，默认 false
  - `matchWholeWord`: boolean - 是否匹配完整单词，默认 false

**返回**: `HistoryMessageResult[]` 数组

### searchFriendMsgHistory(context, options)

底层函数，搜索好友历史消息。

**参数**:
- `context`: LagrangeContext - 上下文对象
- `options`: 
  - `keywords`: string - 搜索关键词
  - `userId`: number - 好友 QQ 号
  - `maxMessages`: number - 最大搜索消息数，默认 500
  - `limit`: number - 返回结果数量，默认 20

**返回**: `HistoryMessageResult[]` 数组

## 代码案例

### 基础搜索

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

### 多关键词搜索

```typescript
// 搜索同时包含"明天"和"会议"的消息（所有关键词必须同时匹配）
const result = await util.searchHistoryMessages(groupId, "明天 会议", 20);
```

### 使用底层 API

```typescript
import { searchGroupMsgHistory } from './util/message-search';

const results = await searchGroupMsgHistory(context, {
    keywords: "活动",
    groupId: groupId,
    maxMessages: 300,
    limit: 10,
    caseSensitive: false,
});

// results 是 HistoryMessageResult[] 数组
// 每项包含：senderId, senderName, time, content, messageId
```

## 约束与说明

- **搜索范围**: 最多检索最近 500 条历史消息
- **排序**: 搜索结果按时间倒序排列（最新的消息在前）
- **多关键词**: 多个关键词用空格分隔，所有关键词必须同时匹配才算命中
- **内容提取**: 仅搜索文本内容，图片、表情等非文本消息段会被忽略
- **性能**: 采用批量获取策略，每次获取 100 条消息，避免单次请求过多数据
