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

## 重要约束

- `context.fin` 为 `true` 时所有 API 失效，禁止再调用发送方法
- 消息段中禁止在 `text` 类型使用 `@` 符号，应使用 `{ type: 'at', data: { qq: '123456' } }`
- 每条 `text` 消息段末尾会自动添加换行
