import { LagrangeContext } from "../core/context";
import type * as Lagrange from '../core/type';

export async function sendGroupMsg(
    context: LagrangeContext<Lagrange.Message>,
    group_id: number,
    message: Lagrange.Send.Default[],
) {
    // 对于文本类型的内容，如果存在，扫描其中，把部分段落剥离出来并
    for (const msg of message) {
        if (msg.type === 'text' && msg.data.text.includes('@')) {
            return '错误 ❌， text 类型中不允许出现字符 @ ，你应该通过 at 类型的消息来完成一次 @，at 类型的消息数据是目标的 QQ 号';
        }
    }

    message = message.map(msg => {
        if (msg.type === 'at') {
            if (typeof msg.data.qq === 'number') {
                msg.data.qq = String(msg.data.qq);
            }
        } else if (msg.type === 'text') {
            if (!msg.data.text.endsWith('\n')) {
                msg.data.text += '\n';
            }
        }
        return msg;
    });

    const res = await context.sendGroupMsg(group_id, message);
    const text = (res instanceof Error) ? res.message : JSON.stringify(res.data, null, 2);
    return text;
}

export async function getGroupInfo(
    context: LagrangeContext<Lagrange.Message>,
    group_id: number,
) {
    const res = await context.getGroupInfo(group_id);
    const text = (res instanceof Error) ? res.message : JSON.stringify(res.data, null, 2);
    return text;
}


export async function getGroupMemberList(
    context: LagrangeContext<Lagrange.Message>,
    group_id: number,
) {
    const res = await context.getGroupMemberList(group_id);
    const text = (res instanceof Error) ? res.message : JSON.stringify(res.data, null, 2);
    return text;
}


export async function getGroupMemberInfo(
    context: LagrangeContext<Lagrange.Message>,
    group_id: number,
    user_id: number,
) {
    const res = await context.getGroupMemberInfo(group_id, user_id);
    const text = (res instanceof Error) ? res.message : JSON.stringify(res.data, null, 2);
    return text;
}


export async function uploadGroupFile(
    context: LagrangeContext<Lagrange.Message>,
    group_id: number,
    file: string,
    name: string,
) {
    const res = await context.uploadGroupFile(group_id, file, name);
    const text = (res instanceof Error) ? res.message : 'upload successfully';
    return text;
}


export async function sendGroupNotice(
    context: LagrangeContext<Lagrange.Message>,
    group_id: number,
    content: string,
) {
    const res = await context.sendGroupNotice(group_id, content)
    const text = (res instanceof Error) ? res.message : JSON.stringify(res.data, null, 2);
    return text;
}

export async function getLatestMessages(
    context: LagrangeContext<Lagrange.Message>,
    group_id: number,
    limit: number,
) {
    const realmService = context.realmService;
    if (!realmService) {
        return 'realm 数据库未初始化，无法获取最新的信息';
    }

    const filterContext = context as LagrangeContext<Lagrange.GroupMessage | Lagrange.PrivateMessage>;
    const queryData = await realmService.getLatestGroupMessages(filterContext, group_id, limit);

    if (!queryData) {
        return '未找到数据';
    }

    return JSON.stringify(queryData, null, 2);
}