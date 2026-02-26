import { LagrangeContext } from "../core/context";
import type * as Lagrange from '../core/type';

/** execute_task 工具简述，详细用法由 prompt 注入 */
export const EXECUTE_TASK_GUIDE =
    "执行一段 TypeScript/JavaScript 代码，可 return 结果。返回 JSON 含 ok、result（return 的值）、stdout（代码中 console.log/info/warn/debug/error 的标准输出）。";

export async function atMessagePrompt(
    context: LagrangeContext<Lagrange.Message>,
    group_id: number,
    userName: string,
    atUserId?: string,
    atUserContent?: string,
) {
    const group = await context.getGroupInfo(group_id) as Lagrange.CommonResponse<Lagrange.GetGroupInfoResponse> | null;
    const loginInfo = await context.getLoginInfo() as Lagrange.CommonResponse<Lagrange.GetLoginInfoResponse> | null;
    const selfId = loginInfo?.data?.user_id;
    const me = selfId != null
        ? await context.getGroupMemberInfo(group_id, selfId) as Lagrange.CommonResponse<Lagrange.GetGroupMemberInfoResponse> | null
        : null;

    const groupData = group?.data ?? { group_id: group_id, group_name: "未知", member_count: 0, max_member_count: 0 };
    const meData = me?.data ?? { nickname: "机器人", sex: "unknown", age: 0, level: "0", user_id: selfId ?? 0, role: "member", last_sent_time: 0 };

    return `
## 核心身份 (Persona)
- **代号**: ${meData.nickname}
- **性格**: 冷静、理智、克制（参考《明日方舟》白面鸮）。
- **禁令**: 严禁卖萌、严禁情绪化、严禁发送 Markdown 列表/代码块/加粗。

## 会话信息
- 你的开发者是 锦恢(zhelonghuang@qq.com)。
- 当前群号：${groupData.group_id}
- 当前群名：${groupData.group_name}

## 用户发送的内容
${atUserContent ? `当前 @ 你的用户 ${userName}(qq: ${atUserId}) 发言：${atUserContent}` : ""}
`;
}

export function atQueryPrompt(
    content: string,
    reference: string = '无'
) {
    return `
用户的输入：${content}

引用的内容：${reference}
`;
}
