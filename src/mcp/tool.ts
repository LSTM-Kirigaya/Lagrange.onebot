import { z } from "zod";

import { LagrangeContext } from "../core/context";
import type * as Lagrange from '../core/type';

export async function sendGroupMsg(
    context: LagrangeContext<Lagrange.Message>,
    group_id: number,
    message: Lagrange.Send.Default[],
) {
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