---
name: memory
description: 基于向量的长期记忆系统。用于存储用户偏好、历史纠正。
---

## 权限控制（黄金变量）

**敏感操作**：`addMemory`、`updateMemory`、`deleteMemory`

- 通过环境变量 `AUTHORIZED_USERS` 配置授权用户列表，只有这些用户可以执行敏感操作
- 格式：逗号分隔的 QQ 号列表，如 `"123456,789012"`
- 如果环境变量未设置或为空，则允许所有用户执行敏感操作
- 如果设置了列表，则只有列表中的 QQ 号可以执行，其他用户会收到 `{ error: "无权限" }` 响应

## 使用场景
1. **反馈闭环**: 只要用户表达不满（如"错了"、"别刷屏"），**必须**立即记录。
2. **背景查询**: 在回答任何涉及"谁"、"什么"、"之前"的问题前必查。

## API

**addMemory(content, userId, groupId, key)**
- `content`: string[] - 文本内容数组
- `userId`: number - 提问的用户的 qq 号，比如 1193466151（用于权限检查）
- `groupId`: string - 群组 ID（如 'group789012'）
- `key`: string - 唯一标识（可选）
- 返回：JSON 字符串 
  - 成功：`{ inserted: number, items: [...] }`
  - 无权限：`{ error: "无权限", message: "当前用户没有执行 addMemory 操作的权限" }`

**queryMemory(query, groupIds, k)**
- `query`: string - 查询文本
- `groupIds`: string[] - 群组 ID 列表（如 `['group789012']`）
- `k`: number - 返回条数
- 返回：JSON 字符串，需 `JSON.parse` 解析

**updateMemory(userId, groupId, key, content)**
- `userId`: number - 用户 QQ 号（用于权限检查）
- `groupId`: string - 群组 ID
- `key`: string - 唯一标识
- `content`: string - 新内容
- 返回：JSON 字符串 
  - 成功：`{ deleted: number, inserted: number }`
  - 无权限：`{ error: "无权限", message: "..." }`

**deleteMemory(userId, key)**
- `userId`: number - 用户 QQ 号（用于权限检查）
- `key`: string - 唯一标识
- 返回：JSON 字符串 
  - 成功：`{ deleted: number }`
  - 无权限：`{ error: "无权限", message: "..." }`

## 代码案例

**查询记忆**
```typescript
const query = "用户对我的评价";
const memStr = await memory.queryMemory(query, ['group' + groupId], 3);
const memRes = JSON.parse(memStr);

// 结果结构：{ query, results: [{ key, groupId, content, score }] }
if (memRes.results?.length > 0) {
    const contextInfo = memRes.results[0].content;
    // 基于 contextInfo 调整回答逻辑
}
```

**记录负面反馈**
```typescript
const result = await memory.addMemory(
    ["用户纠正了我的搜索逻辑，要求更简洁"],
    userId,  // 提供用户 QQ 号用于权限检查
    'group' + groupId,
    "user_feedback_001"
);
const res = JSON.parse(result);
if (res.error === "无权限") {
    // 处理无权限情况
}
```
