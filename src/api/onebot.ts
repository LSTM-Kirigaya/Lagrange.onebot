/**
 * @author 锦恢
 * @email 1193466151@qq.com
 * @description Lagrange.Core 前端接口
 * @comment 接口调用详细参考文档
 * - https://github.com/botuniverse/onebot-11/blob/master/communication/ws.md
 */

import * as Lagrange from '../type';

/**
 * @description 发送私聊消息
 * @param user_id 对方 QQ 号
 * @param message 要发送的内容
 * @param auto_escape 消息内容是否作为纯文本发送（即不解析 CQ 码），只在 message 字段是字符串时有效
 */
export function sendPrivateMsg(user_id: number, message: string | Lagrange.Send.Default[], auto_escape: boolean = false) {
    return {
        action: 'send_private_msg',
        params: { user_id, message, auto_escape }
    };
}

/**
 * @description 发送群消息
 * @param group_id 群号
 * @param message 要发送的内容
 * @param auto_escape 消息内容是否作为纯文本发送（即不解析 CQ 码），只在 message 字段是字符串时有效
 */
export function sendGroupMsg(group_id: number, message: string | Lagrange.Send.Default[], auto_escape: boolean = false) {
    return {
        action: 'send_group_msg',
        params: { group_id, message, auto_escape }
    };
}

/**
 * @description 发送消息
 * @param message_type 消息类型，支持 private、group，分别对应私聊、群组，如不传入，则根据传入的 *_id 参数判断
 * @param user_id 对方 QQ 号（消息类型为 private 时需要）
 * @param group_id 群号（消息类型为 group 时需要）
 * @param message 要发送的内容
 * @param auto_escape 消息内容是否作为纯文本发送（即不解析 CQ 码），只在 message 字段是字符串时有效
 */
export function sendMsg(message_type: string, user_id: number, group_id: number, message: string | Lagrange.Send.Default[], auto_escape: boolean = false) {
    return {
        action: 'send_msg',
        params: { message_type, user_id, group_id, message, auto_escape }
    };
}

/**
 * @description 撤回消息
 * @param message_id 消息 ID
 */
export function deleteMsg(message_id: number) {
    return {
        action: 'delete_msg',
        params: { message_id }
    };
}

/**
 * @description 获取消息
 * @param message_id 消息 ID
 */
export function getMsg(message_id: number) {
    return {
        action: 'get_msg',
        params: { message_id }
    };
}

/**
 * @description 获取合并转发消息
 * @param id 合并转发 ID
 */
export function getForwardMsg(id: string) {
    return {
        action: 'get_forward_msg',
        params: { id }
    };
}

/**
 * @description 发送好友赞
 * @param user_id 对方 QQ 号
 * @param times 赞的次数，每个好友每天最多 10 次
 */
export function sendLike(user_id: number, times: number = 1) {
    return {
        action: 'send_like',
        params: { user_id, times }
    };
}

/**
 * @description 群组踢人
 * @param group_id 群号
 * @param user_id 要踢的 QQ 号
 * @param reject_add_request 拒绝此人的加群请求
 */
export function setGroupKick(group_id: number, user_id: number, reject_add_request: boolean = false) {
    return {
        action: 'set_group_kick',
        params: { group_id, user_id, reject_add_request }
    };
}

/**
 * @description 群组单人禁言
 * @param group_id 群号
 * @param user_id 要禁言的 QQ 号
 * @param duration 禁言时长，单位秒，0 表示取消禁言
 */
export function setGroupBan(group_id: number, user_id: number, duration: number = 30 * 60) {
    return {
        action: 'set_group_ban',
        params: { group_id, user_id, duration }
    };
}

/**
 * @description 群组匿名用户禁言
 * @param group_id 群号
 * @param anonymous 可选，要禁言的匿名用户对象（群消息上报的 anonymous 字段）
 * @param anonymous_flag 可选，要禁言的匿名用户的 flag（需从群消息上报的数据中获得）
 * @param duration 禁言时长，单位秒，无法取消匿名用户禁言
 */
export function setGroupAnonymousBan(group_id: number, anonymous: object, anonymous_flag: string, duration: number = 30 * 60) {
    return {
        action: 'set_group_anonymous_ban',
        params: { group_id, anonymous, anonymous_flag, duration }
    };
}

/**
 * @description 群组全员禁言
 * @param group_id 群号
 * @param enable 是否禁言
 */
export function setGroupWholeBan(group_id: number, enable: boolean = true) {
    return {
        action: 'set_group_whole_ban',
        params: { group_id, enable }
    };
}

/**
 * @description 群组设置管理员
 * @param group_id 群号
 * @param user_id 要设置管理员的 QQ 号
 * @param enable true 为设置，false 为取消
 */
export function setGroupAdmin(group_id: number, user_id: number, enable: boolean = true) {
    return {
        action: 'set_group_admin',
        params: { group_id, user_id, enable }
    };
}

/**
 * @description 群组匿名
 * @param group_id 群号
 * @param enable 是否允许匿名聊天
 */
export function setGroupAnonymous(group_id: number, enable: boolean = true) {
    return {
        action: 'set_group_anonymous',
        params: { group_id, enable }
    };
}

/**
 * @description 设置群名片（群备注）
 * @param group_id 群号
 * @param user_id 要设置的 QQ 号
 * @param card 群名片内容，不填或空字符串表示删除群名片
 */
export function setGroupCard(group_id: number, user_id: number, card: string = "") {
    return {
        action: 'set_group_card',
        params: { group_id, user_id, card }
    };
}

/**
 * @description 设置群名
 * @param group_id 群号
 * @param group_name 新群名
 */
export function setGroupName(group_id: number, group_name: string) {
    return {
        action: 'set_group_name',
        params: { group_id, group_name }
    };
}

/**
 * @description 退出群组
 * @param group_id 群号
 * @param is_dismiss 是否解散，如果登录号是群主，则仅在此项为 true 时能够解散
 */
export function setGroupLeave(group_id: number, is_dismiss: boolean = false) {
    return {
        action: 'set_group_leave',
        params: { group_id, is_dismiss }
    };
}

/**
 * @description 设置群组专属头衔
 * @param group_id 群号
 * @param user_id 要设置的 QQ 号
 * @param special_title 专属头衔，不填或空字符串表示删除专属头衔
 * @param duration 专属头衔有效期，单位秒，-1 表示永久，不过此项似乎没有效果，可能是只有某些特殊的时间长度有效，有待测试
 */
export function setGroupSpecialTitle(group_id: number, user_id: number, special_title: string = "", duration: number = -1) {
    return {
        action: 'set_group_special_title',
        params: { group_id, user_id, special_title, duration }
    };
}

/**
 * @description 处理加好友请求
 * @param flag 加好友请求的 flag（需从上报的数据中获得）
 * @param approve 是否同意请求
 * @param remark 添加后的好友备注（仅在同意时有效）
 */
export function setFriendAddRequest(flag: string, approve: boolean = true, remark: string = "") {
    return {
        action: 'set_friend_add_request',
        params: { flag, approve, remark }
    };
}

/**
 * @description 处理加群请求／邀请
 * @param flag 加群请求的 flag（需从上报的数据中获得）
 * @param sub_type add 或 invite，请求类型（需要和上报消息中的 sub_type 字段相符）
 * @param approve 是否同意请求／邀请
 * @param reason 拒绝理由（仅在拒绝时有效）
 */
export function setGroupAddRequest(flag: string, sub_type: string, approve: boolean = true, reason: string = "") {
    return {
        action: 'set_group_add_request',
        params: { flag, sub_type, approve, reason }
    };
}

/**
 * @description 获取登录号信息
 */
export function getLoginInfo() {
    return {
        action: 'get_login_info',
        params: {  }
    };
}

/**
 * @description 获取陌生人信息
 * @param user_id QQ 号
 * @param no_cache 是否不使用缓存（使用缓存可能更新不及时，但响应更快）
 */
export function getStrangerInfo(user_id: number, no_cache: boolean = false) {
    return {
        action: 'get_stranger_info',
        params: { user_id, no_cache }
    };
}

/**
 * @description 获取好友列表
 */
export function getFriendList() {
    return {
        action: 'get_friend_list',
        params: {  }
    };
}

/**
 * @description 获取群信息
 * @param group_id 群号
 * @param no_cache 是否不使用缓存（使用缓存可能更新不及时，但响应更快）
 */
export function getGroupInfo(group_id: number, no_cache: boolean = false) {
    return {
        action: 'get_group_info',
        params: { group_id, no_cache }
    };
}

/**
 * @description 获取群列表
 */
export function getGroupList() {
    return {
        action: 'get_group_list',
        params: {  }
    };
}

/**
 * @description 获取群成员信息
 * @param group_id 群号
 * @param user_id QQ 号
 * @param no_cache 是否不使用缓存（使用缓存可能更新不及时，但响应更快）
 */
export function getGroupMemberInfo(group_id: number, user_id: number, no_cache: boolean = false) {
    return {
        action: 'get_group_member_info',
        params: { group_id, user_id, no_cache }
    };
}

/**
 * @description 获取群成员列表
 * @param group_id 群号
 */
export function getGroupMemberList(group_id: number) {
    return {
        action: 'get_group_member_list',
        params: { group_id }
    };
}

/**
 * @description 获取群荣誉信息
 * @param group_id 群号
 * @param type 要获取的群荣誉类型，可传入 talkative performer legend strong_newbie emotion 以分别获取单个类型的群荣誉数据，或传入 all 获取所有数据
 */
export function getGroupHonorInfo(group_id: number, type: string) {
    return {
        action: 'get_group_honor_info',
        params: { group_id, type }
    };
}

/**
 * @description 获取 Cookies
 * @param domain 需要获取 cookies 的域名
 */
export function getCookies(domain: string = "") {
    return {
        action: 'get_cookies',
        params: { domain }
    };
}

/**
 * @description 获取 CSRF Token
 */
export function getCsrfToken() {
    return {
        action: 'get_csrf_token',
        params: {  }
    };
}

/**
 * @description 获取 QQ 相关接口凭证
 */
export function getCredentials() {
    return {
        action: 'get_credentials',
        params: {  }
    };
}

/**
 * @description 获取语音
 */
export function getRecord() {
    return {
        action: 'get_record',
        params: {  }
    };
}

/**
 * @description 获取图片
 * @param file 收到的图片文件名（消息段的 file 参数），如 6B4DE3DFD1BD271E3297859D41C530F5.jpg
 */
export function getImage(file: string) {
    return {
        action: 'get_image',
        params: { file }
    };
}

/**
 * @description 检查是否可以发送图片
 */
export function canSendImage() {
    return {
        action: 'can_send_image',
        params: {  }
    };
}

/**
 * @description 检查是否可以发送语音
 */
export function canSendRecord() {
    return {
        action: 'can_send_record',
        params: {  }
    };
}

/**
 * @description 获取运行状态
 */
export function getStatus() {
    return {
        action: 'get_status',
        params: {  }
    };
}

/**
 * @description 获取版本信息
 */
export function getVersionInfo() {
    return {
        action: 'get_version_info',
        params: {  }
    };
}

/**
 * @description 重启 OneBot 实现
 */
export function setRestart() {
    return {
        action: 'set_restart',
        params: {  }
    };
}

/**
 * @description 清理缓存
 */
export function cleanCache() {
    return {
        action: 'clean_cache',
        params: {  }
    };
}

