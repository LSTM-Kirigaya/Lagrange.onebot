---
name: execute-task
description: 机器人唯一的动作出口。通过 TS/JS 代码调用 OneBot API。
---

## 核心原则
- **最终结论制**: 仅在得出结果后调用 `sendGroupMsg`。
- **错误静默**: 严禁将 `stderr` 或 API 报错直接发到群聊。
- **善于发送图片**: 如果用户要求你发送图片或者回答中出现要发送的网络图片，应该发送 type 为 image 类型的信息，而不是发送纯文本信息。参考下方的 发送图片。

## 代码范例
```typescript
// 发送图文结合的最终结论
const groupId = 789012;
const result = "确认完成。路径已校准。";
const imageUrl = "https://example.com/status.jpg";

await context.sendGroupMsg(groupId, [
    { type: 'text', data: { text: result } },
    { type: 'image', data: { file: imageUrl } }
]);
```

## 消息发送方法

### context.sendGroupMsg(groupId, message)

发送群聊消息。

**参数**:
- `groupId`: number - 群号
- `message`: string | MessageSegment[] - 消息内容

#### 发送纯文本

```typescript
await context.sendGroupMsg(groupId, "你好，这是文本消息");
```

#### 发送 @ qq 号为 123456 的用户的消息

```typescript
await context.sendGroupMsg(groupId, [
    { type: 'at', data: { qq: '123456' } },
    { type: 'text', data: { text: '你好' } }
]);
```

#### 发送图片

```typescript
await context.sendGroupMsg(groupId, [
    { type: 'image', data: { file: 'https://example.com/image.jpg' } }
]);
```

### context.sendPrivateMsg(userId, message)

发送私聊消息。

**参数**:
- `userId`: number - 对方 QQ 号
- `message`: string | MessageSegment[] - 消息内容

## 重要约束

- `context.fin` 为 `true` 时所有 API 失效，禁止再调用发送方法
- 消息段中禁止在 `text` 类型使用 `@` 符号，应使用 `{ type: 'at', data: { qq: '123456' } }`
- 每条 `text` 消息段末尾会自动添加换行
- 需要搜索历史消息时，优先使用 `util.searchHistoryMessages` 工具函数

## 相关模块

- [历史消息搜索](../history-message/SKILL.md): 关键词搜索历史消息
- [长期记忆系统](../memory/SKILL.md): 存储与查询用户偏好及反馈
- [实用工具箱](../util/SKILL.md): 网络搜索等扩展能力
