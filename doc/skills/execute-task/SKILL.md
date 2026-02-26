---
name: execute-task
description: 机器人唯一的动作出口。通过 TS/JS 代码调用 OneBot API。
---

## 核心原则
- **最终结论制**: 仅在得出结果后调用 `sendGroupMsg`。
- **错误静默**: 严禁将 `stderr` 或 API 报错直接发到群聊。

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

## 消息解析规范

获取历史消息时，必须对 `message` 字段进行类型检查：

```typescript
const res = await context.getGroupMsgHistory({ group_id: groupId, count: 20 });
const messages = res?.data?.messages ?? [];

// 正确解析消息段数组
for (const msg of messages) {
    let content = '';
    if (typeof msg.message === 'string') {
        content = msg.message;
    } else if (Array.isArray(msg.message)) {
        content = msg.message
            .filter(s => s.type === 'text')
            .map(s => s.data?.text || '')
            .join('');
    }
}
```

## 消息发送方法

### context.sendGroupMsg(groupId, message)

发送群聊消息。

**参数**:
- `groupId`: number - 群号
- `message`: string | MessageSegment[] - 消息内容

```typescript
// 发送纯文本
await context.sendGroupMsg(groupId, "你好，这是文本消息");

// 发送消息段数组
await context.sendGroupMsg(groupId, [
    { type: 'text', data: { text: '你好' } },
    { type: 'at', data: { qq: '123456' } }
]);

// 发送图片
await context.sendGroupMsg(groupId, [
    { type: 'image', data: { file: 'https://example.com/image.jpg' } }
]);
```

### context.sendPrivateMsg(userId, message)

发送私聊消息。

**参数**:
- `userId`: number - 对方 QQ 号
- `message`: string | MessageSegment[] - 消息内容

### context.sendMessage(message)

根据当前消息类型自动选择发送群聊或私聊（回复消息）。

**参数**:
- `message`: string | MessageSegment[] - 消息内容

## 消息获取方法

### context.getGroupMsgHistory(params)

获取群消息历史记录。

**参数**:
- `group_id`: number - 群号
- `count`: number - 消息数量
- `message_seq`: number - 起始消息序号（可选）
- `message_id`: number - 起始消息 ID（可选）

**返回**: `{ data: { messages: GetMsgResponse[] } }`

```typescript
const res = await context.getGroupMsgHistory({ 
    group_id: groupId, 
    count: 20 
});
const messages = res?.data?.messages ?? [];
```

### context.getFriendMsgHistory(params)

获取好友消息历史记录。

**参数**:
- `user_id`: number - 对方 QQ 号
- `count`: number - 消息数量
- `message_seq`: number - 起始消息序号（可选）
- `message_id`: number - 起始消息 ID（可选）

**返回**: `{ data: { messages: GetMsgResponse[] } }`

### context.getMsg(message_id)

获取单条消息。

**参数**:
- `message_id`: number - 消息 ID

## 重要约束

- `context.fin` 为 `true` 时所有 API 失效，禁止再调用发送方法
- 消息段中禁止在 `text` 类型使用 `@` 符号，应使用 `{ type: 'at', data: { qq: '123456' } }`
- 每条 `text` 消息段末尾会自动添加换行
- 需要搜索历史消息时，优先使用 `util.searchHistoryMessages` 工具函数

## 相关模块

- [历史消息搜索](../history-message/SKILL.md): 关键词搜索历史消息
- [长期记忆系统](../memory/SKILL.md): 存储与查询用户偏好及反馈
- [实用工具箱](../util/SKILL.md): 网络搜索等扩展能力
