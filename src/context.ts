import WebSocket from 'ws';

import { pipe, onMessage, onClose } from './event';
import { logger } from './utils';
import lagrangeMapper from './lagrange-mapping';
import { scheduleJob } from 'node-schedule';

import type * as Lagrange from './type';

interface CommonLaunchOption {
    qq: number,
    access_token?: string
}

interface ForwardWebsocketLaunchOption extends CommonLaunchOption {
    type: "forward-websocket",
    host: string,
    port: number
}

interface BackwardWebsocketLaunchOption extends CommonLaunchOption {
    type: "backward-websocket",
    host: string,
    port: number,
    path: string
}

type LaunchOption = ForwardWebsocketLaunchOption | BackwardWebsocketLaunchOption;

interface GetRawTextConfig {
    delimiter: string
}

export class LagrangeContext<T extends Lagrange.Message> {
    public ws: WebSocket | undefined;
    public fin: boolean;
    public message: T | undefined;
    public qq: number;

    constructor(message: T) {
        this.ws = lagrangeServer.ws;
        this.message = message;
        this.fin = false;
        this.qq = lagrangeServer.qq;
    }

    public send<T>(apiJSON: Lagrange.ApiJSON): Promise<Lagrange.CommonResponse<T> | Error> {
        const ws = this.ws;
        const fin = this.fin;        
        return new Promise<Lagrange.CommonResponse<T> | Error>(resolve => {
            ws.onmessage = (event) => {
                const payload = JSON.parse(event.data.toString());                
                if (payload && payload.meta_event_type !== 'heartbeat') {
                    resolve(payload as Lagrange.CommonResponse<T>);
                }
            }

            if (!fin) {                
                ws.send(JSON.stringify(apiJSON), (err: Error) => {
                    console.log(err)
                    if (err) {
                        logger.warning('ws 发送消息错误, 是否在LaunchOption中缺少了AccessToken参数?');
                        resolve(err);
                    }
                });
            } else {
                logger.warning('会话已经结束，send 已经停用，检查你的代码！');
                resolve(undefined);
            }
        });
    }

    public finishSession() {
        this.fin = true;
    }

    public update<K extends T>(message: K) {
        this.fin = false;
        this.message = message;
    }

    /**
     * @description 发送私聊消息
     * @param user_id 对方 QQ 号
     * @param message 要发送的内容
     * @param auto_escape 消息内容是否作为纯文本发送（即不解析 CQ 码），只在 message 字段是字符串时有效
     */
    public sendPrivateMsg(user_id: number, message: string | Lagrange.Send.Default[], auto_escape: boolean = false) {
        return this.send<Lagrange.SendPrivateMsgResponse>({
            action: 'send_private_msg',
            params: { user_id, message, auto_escape }
        });
    }

    /**
     * @description 发送群消息
     * @param group_id 群号
     * @param message 要发送的内容
     * @param auto_escape 消息内容是否作为纯文本发送（即不解析 CQ 码），只在 message 字段是字符串时有效
     */
    public sendGroupMsg(group_id: number, message: string | Lagrange.Send.Default[], auto_escape: boolean = false) {
        return this.send<Lagrange.SendGroupMsgResponse>({
            action: 'send_group_msg',
            params: { group_id, message, auto_escape }
        });
    }

    /**
     * @description 发送消息
     * @param message_type 消息类型，支持 private、group，分别对应私聊、群组，如不传入，则根据传入的 *_id 参数判断
     * @param user_id 对方 QQ 号（消息类型为 private 时需要）
     * @param group_id 群号（消息类型为 group 时需要）
     * @param message 要发送的内容
     * @param auto_escape 消息内容是否作为纯文本发送（即不解析 CQ 码），只在 message 字段是字符串时有效
     */
    public sendMsg(message_type?: 'private' | 'group', user_id?: number, group_id?: number, message?: string | Lagrange.Send.Default[], auto_escape: boolean = false) {
        return this.send<Lagrange.SendMsgResponse>({
            action: 'send_msg',
            params: { message_type, user_id, group_id, message, auto_escape }
        });
    }

    /**
     * @description 获取消息的纯文本信息，如果有多段消息，默认按照回车进行分割
     * @param config
     * @returns 
     */
    public getRawText(config?: GetRawTextConfig): string {
        const msg = this.message;
        config = config || { delimiter: '\n' };
        if (msg['message'] instanceof Array) {
            const text: string[] = [];
            for (const message of msg['message']) {
                if (message['type'] === 'text' && message['data']) {
                    const messageString = message['data']['text'] as string;
                    text.push(messageString);
                }
            }
            return text.join(config.delimiter);
        } else {
            return '';
        }
    }


    /**
     * @description 根据回复者回消息，如果是群聊，则在群聊中回复；如果是私聊，直接回复
     * @param message 
     * @returns 
     */
    public sendMessage(message: string | Lagrange.Send.Default[]) {
        const msg = this.message;
        if (msg.post_type === 'message') {
            if (msg.message_type === 'group') {
                return this.sendGroupMsg(msg.group_id, message);
            } else if (msg.message_type === 'private') {
                return this.sendPrivateMsg(msg.user_id, message);
            }
        } else if (msg.post_type === 'notice') {
            if (msg['group_id']) {
                return this.sendGroupMsg(msg['group_id'], message);
            } else if (msg['user_id']) {
                return this.sendPrivateMsg(msg['user_id'], message);
            }
        } else if (msg.post_type === 'request') {
            logger.warning('当前消息类型为 [request], 我们强烈推荐你不要调用 sendMessage 方法，而使用 sendGroupMsg 或者 sendPrivateMsg. 此处的 sendMessage 将不会执行');
        }
    }

    /**
     * @description 撤回消息
     * @param message_id 消息 ID
     */
    public deleteMsg(message_id: number) {
        return this.send<Lagrange.DeleteMsgResponse>({
            action: 'delete_msg',
            params: { message_id }
        });
    }

    /**
     * @description 获取消息
     * @param message_id 消息 ID
     */
    public getMsg(message_id: number) {
        return this.send<Lagrange.GetMsgResponse>({
            action: 'get_msg',
            params: { message_id }
        });
    }

    /**
     * @description 获取合并转发消息
     * @param id 合并转发 ID
     */
    public getForwardMsg(id: string) {
        return this.send<Lagrange.GetForwardMsgResponse>({
            action: 'get_forward_msg',
            params: { id }
        });
    }

    /**
     * @description 发送好友赞
     * @param user_id 对方 QQ 号
     * @param times 赞的次数，每个好友每天最多 10 次
     */
    public sendLike(user_id: number, times: number = 1) {
        return this.send<Lagrange.SendLikeResponse>({
            action: 'send_like',
            params: { user_id, times }
        });
    }

    /**
     * @description 群组踢人
     * @param group_id 群号
     * @param user_id 要踢的 QQ 号
     * @param reject_add_request 拒绝此人的加群请求
     */
    public setGroupKick(group_id: number, user_id: number, reject_add_request: boolean = false) {
        return this.send<Lagrange.SetGroupKickResponse>({
            action: 'set_group_kick',
            params: { group_id, user_id, reject_add_request }
        });
    }

    /**
     * @description 群组单人禁言
     * @param group_id 群号
     * @param user_id 要禁言的 QQ 号
     * @param duration 禁言时长，单位秒，0 表示取消禁言
     */
    public setGroupBan(group_id: number, user_id: number, duration: number = 30 * 60) {
        return this.send<Lagrange.SetGroupBanResponse>({
            action: 'set_group_ban',
            params: { group_id, user_id, duration }
        });
    }

    /**
     * @description 群组匿名用户禁言
     * @param group_id 群号
     * @param anonymous 可选，要禁言的匿名用户对象（群消息上报的 anonymous 字段）
     * @param anonymous_flag 可选，要禁言的匿名用户的 flag（需从群消息上报的数据中获得）
     * @param duration 禁言时长，单位秒，无法取消匿名用户禁言
     */
    public setGroupAnonymousBan(group_id: number, anonymous: object, anonymous_flag: string, duration: number = 30 * 60) {
        return this.send<Lagrange.SetGroupAnonymousBanResponse>({
            action: 'set_group_anonymous_ban',
            params: { group_id, anonymous, anonymous_flag, duration }
        });
    }

    /**
     * @description 群组全员禁言
     * @param group_id 群号
     * @param enable 是否禁言
     */
    public setGroupWholeBan(group_id: number, enable: boolean = true) {
        return this.send<Lagrange.SetGroupWholeBanResponse>({
            action: 'set_group_whole_ban',
            params: { group_id, enable }
        });
    }

    /**
     * @description 群组设置管理员
     * @param group_id 群号
     * @param user_id 要设置管理员的 QQ 号
     * @param enable true 为设置，false 为取消
     */
    public setGroupAdmin(group_id: number, user_id: number, enable: boolean = true) {
        return this.send<Lagrange.SetGroupAdminResponse>({
            action: 'set_group_admin',
            params: { group_id, user_id, enable }
        });
    }

    /**
     * @description 群组匿名
     * @param group_id 群号
     * @param enable 是否允许匿名聊天
     */
    public setGroupAnonymous(group_id: number, enable: boolean = true) {
        return this.send<Lagrange.SetGroupAnonymousResponse>({
            action: 'set_group_anonymous',
            params: { group_id, enable }
        });
    }

    /**
     * @description 设置群名片（群备注）
     * @param group_id 群号
     * @param user_id 要设置的 QQ 号
     * @param card 群名片内容，不填或空字符串表示删除群名片
     */
    public setGroupCard(group_id: number, user_id: number, card: string = "") {
        return this.send<Lagrange.SetGroupCardResponse>({
            action: 'set_group_card',
            params: { group_id, user_id, card }
        });
    }

    /**
     * @description 设置群名
     * @param group_id 群号
     * @param group_name 新群名
     */
    public setGroupName(group_id: number, group_name: string) {
        return this.send<Lagrange.SetGroupNameResponse>({
            action: 'set_group_name',
            params: { group_id, group_name }
        });
    }

    /**
     * @description 退出群组
     * @param group_id 群号
     * @param is_dismiss 是否解散，如果登录号是群主，则仅在此项为 true 时能够解散
     */
    public setGroupLeave(group_id: number, is_dismiss: boolean = false) {
        return this.send<Lagrange.SetGroupLeaveResponse>({
            action: 'set_group_leave',
            params: { group_id, is_dismiss }
        });
    }

    /**
     * @description 设置群组专属头衔
     * @param group_id 群号
     * @param user_id 要设置的 QQ 号
     * @param special_title 专属头衔，不填或空字符串表示删除专属头衔
     * @param duration 专属头衔有效期，单位秒，-1 表示永久，不过此项似乎没有效果，可能是只有某些特殊的时间长度有效，有待测试
     */
    public setGroupSpecialTitle(group_id: number, user_id: number, special_title: string = "", duration: number = -1) {
        return this.send<Lagrange.SetGroupSpecialTitleResponse>({
            action: 'set_group_special_title',
            params: { group_id, user_id, special_title, duration }
        });
    }

    /**
     * @description 处理加好友请求
     * @param flag 加好友请求的 flag（需从上报的数据中获得）
     * @param approve 是否同意请求
     * @param remark 添加后的好友备注（仅在同意时有效）
     */
    public setFriendAddRequest(flag: string, approve: boolean = true, remark: string = "") {
        return this.send<Lagrange.SetFriendAddRequestResponse>({
            action: 'set_friend_add_request',
            params: { flag, approve, remark }
        });
    }

    /**
     * @description 处理加群请求／邀请
     * @param flag 加群请求的 flag（需从上报的数据中获得）
     * @param sub_type add 或 invite，请求类型（需要和上报消息中的 sub_type 字段相符）
     * @param approve 是否同意请求／邀请
     * @param reason 拒绝理由（仅在拒绝时有效）
     */
    public setGroupAddRequest(flag: string, sub_type: string, approve: boolean = true, reason: string = "") {
        return this.send<Lagrange.SetGroupAddRequestResponse>({
            action: 'set_group_add_request',
            params: { flag, sub_type, approve, reason }
        });
    }

    /**
     * @description 获取登录号信息
     */
    public getLoginInfo() {
        return this.send<Lagrange.GetLoginInfoResponse>({
            action: 'get_login_info',
            params: {  }
        });
    }

    /**
     * @description 获取陌生人信息
     * @param user_id QQ 号
     * @param no_cache 是否不使用缓存（使用缓存可能更新不及时，但响应更快）
     */
    public getStrangerInfo(user_id: number, no_cache: boolean = false) {
        return this.send<Lagrange.GetStrangerInfoResponse>({
            action: 'get_stranger_info',
            params: { user_id, no_cache }
        });
    }

    /**
     * @description 获取好友列表
     */
    public getFriendList() {
        return this.send<Lagrange.GetFriendListResponse>({
            action: 'get_friend_list',
            params: {  }
        });
    }

    /**
     * @description 获取群信息
     * @param group_id 群号
     * @param no_cache 是否不使用缓存（使用缓存可能更新不及时，但响应更快）
     */
    public getGroupInfo(group_id: number, no_cache: boolean = false) {
        return this.send<Lagrange.GetGroupInfoResponse>({
            action: 'get_group_info',
            params: { group_id, no_cache }
        });
    }

    /**
     * @description 获取群列表
     */
    public getGroupList() {
        return this.send<Lagrange.GetGroupListResponse>({
            action: 'get_group_list',
            params: {  }
        });
    }

    /**
     * @description 获取群成员信息
     * @param group_id 群号
     * @param user_id QQ 号
     * @param no_cache 是否不使用缓存（使用缓存可能更新不及时，但响应更快）
     */
    public getGroupMemberInfo(group_id: number, user_id: number, no_cache: boolean = false) {
        return this.send<Lagrange.GetGroupMemberInfoResponse>({
            action: 'get_group_member_info',
            params: { group_id, user_id, no_cache }
        });
    }

    /**
     * @description 获取群成员列表
     * @param group_id 群号
     */
    public getGroupMemberList(group_id: number) {
        return this.send<Lagrange.GetGroupMemberListResponse>({
            action: 'get_group_member_list',
            params: { group_id }
        });
    }

    /**
     * @description 获取群荣誉信息
     * @param group_id 群号
     * @param type 要获取的群荣誉类型，可传入 talkative performer legend strong_newbie emotion 以分别获取单个类型的群荣誉数据，或传入 all 获取所有数据
     */
    public getGroupHonorInfo(group_id: number, type: string) {
        return this.send<Lagrange.GetGroupHonorInfoResponse>({
            action: 'get_group_honor_info',
            params: { group_id, type }
        });
    }

    /**
     * @description 获取 Cookies
     * @param domain 需要获取 cookies 的域名
     */
    public getCookies(domain: string = "") {
        return this.send<Lagrange.GetCookiesResponse>({
            action: 'get_cookies',
            params: { domain }
        });
    }

    /**
     * @description 获取 CSRF Token
     */
    public getCsrfToken() {
        return this.send<Lagrange.GetCsrfTokenResponse>({
            action: 'get_csrf_token',
            params: {  }
        });
    }

    /**
     * @description 获取 QQ 相关接口凭证
     */
    public getCredentials() {
        return this.send<Lagrange.GetCredentialsResponse>({
            action: 'get_credentials',
            params: {  }
        });
    }

    /**
     * @description 获取语音
     */
    public getRecord() {
        return this.send<Lagrange.GetRecordResponse>({
            action: 'get_record',
            params: {  }
        });
    }

    /**
     * @description 获取图片
     * @param file 收到的图片文件名（消息段的 file 参数），如 6B4DE3DFD1BD271E3297859D41C530F5.jpg
     */
    public getImage(file: string) {
        return this.send<Lagrange.GetImageResponse>({
            action: 'get_image',
            params: { file }
        });
    }

    /**
     * @description 检查是否可以发送图片
     */
    public canSendImage() {
        return this.send<Lagrange.CanSendImageResponse>({
            action: 'can_send_image',
            params: {  }
        });
    }

    /**
     * @description 检查是否可以发送语音
     */
    public canSendRecord() {
        return this.send<Lagrange.CanSendRecordResponse>({
            action: 'can_send_record',
            params: {  }
        });
    }

    /**
     * @description 获取运行状态
     */
    public getStatus() {
        return this.send<Lagrange.GetStatusResponse>({
            action: 'get_status',
            params: {  }
        });
    }

    /**
     * @description 获取版本信息
     */
    public getVersionInfo() {
        return this.send<Lagrange.GetVersionInfoResponse>({
            action: 'get_version_info',
            params: {  }
        });
    }

    /**
     * @description 重启 OneBot 实现
     */
    public setRestart() {
        return this.send<Lagrange.SetRestartResponse>({
            action: 'set_restart',
            params: {  }
        });
    }

    /**
     * @description 清理缓存
     */
    public cleanCache() {
        return this.send<Lagrange.CleanCacheResponse>({
            action: 'clean_cache',
            params: {  }
        });
    }

    /**
     * @description 上传文件给个人
     * @param user_id 
     * @param file 
     * @param name 
     * @returns 
     */
    public updatePrivateFile(user_id: number, file: string, name: string) {
        return this.send<Lagrange.CommonResponse<null>>({
            action: 'upload_private_file',
            params: { user_id, file, name }
        });
    }

    /**
     * @description 上传群文件
     * @param group_id 群号
     * @param file 文件绝对路径
     * @param name 文件名称
     */
    public uploadGroupFile(group_id: number, file: string, name: string) {
        return this.send<Lagrange.CommonResponse<null>>({
            action: 'upload_group_file',
            params: { group_id, file, name }
        });
    }

    /**
     * @description 发送群公告
     * @param group_id 
     * @param notice_type 
     * @param sub_type 
     * @param file 
     * @param user_id 
     */
    public sendGroupNotice(group_id: number, content: string) {
        return this.send<Lagrange.CommonResponse<null>>({
            action: '_send_group_notice',
            params: { group_id, content }
        });
    }

    /**
     * @description 获取群公告
     * @param group_id 
     * @returns 
     */
    public getGroupNotice(group_id: number) {
        return this.send<Lagrange.CommonResponse<Lagrange.NoticeMessage>>({
            action: '_get_group_notice',
            params: { group_id }
        });
    }
}

type CycleCb = (c: LagrangeContext<Lagrange.Message>) => void;
export type CycleEvent = 'mounted' | 'unmounted';

interface timeScheduleCb {
    cb: CycleCb;
    spec: string;
}

export class LagrangeServer {
    public wsServer: WebSocket.Server | undefined;
    public ws: WebSocket | undefined;
    public config: LaunchOption | undefined;
    public qq: number | undefined;

    private cycleCbMap: Map<CycleEvent, CycleCb[]>;
    private timeScheduleCbMap: timeScheduleCb[];

    constructor() {
        this.wsServer = undefined;
        this.ws = undefined;
        this.qq = undefined;
        this.config = undefined;
        this.cycleCbMap = new Map<CycleEvent, CycleCb[]>();

        this.cycleCbMap.set('mounted', []);
        this.cycleCbMap.set('unmounted', []);
        this.timeScheduleCbMap = [];
    }

    private serverConnect(wsServer: WebSocket.Server): Promise<WebSocket> {
        return new Promise<WebSocket>(resolve => {
            if (!wsServer) {
                throw new Error("不会触发的 Error.");
            }

            wsServer.on('connection', (ws: WebSocket) => {
                resolve(ws);
            });
        });
    }

    private clientConnect(ws: WebSocket): Promise<void> {
        return new Promise(resolve => {
            if (!ws) {
                throw new Error("不会触发的 Error.");
            }

            ws.on('open', (ws: WebSocket) => {
                resolve();
            });
        });
    }

    public async run(config: LaunchOption): Promise<void> {
        this.config = config;

        switch (config.type) {
            case "forward-websocket":
                this.ws = new WebSocket(`ws://${config.host}:${config.port}`,{headers:{
                    Authorization: `Bearer ${config.access_token}`
                }});
                await this.clientConnect(this.ws);
                logger.info('websocket 服务器成功链连接');
                break;
            case 'backward-websocket':
                const wsServer = new WebSocket.Server(config);
                const ws = await this.serverConnect(wsServer);

                this.wsServer = wsServer;
                this.ws = ws;    
                logger.info('websocket 服务器创建完成');
                break;
            default:
                throw new Error("Unknown connection type! ");
        }

        this.qq = config.qq;

        logger.info('完成 websocket 连接，启动参数如下');
        console.table(config);
        pipe.registerServer(this);

        this.ws.on('message', onMessage);
        this.ws.on('close', onClose);
        logger.info('消息处理管线注册完成');

        const cycleCbMap = this.cycleCbMap;

        // mounted 周期
        cycleCbMap.get('mounted').forEach(cb => cb.call(this, new LagrangeContext({ post_type:'meta_event' })));

        // 执行注册的定时器
        this.timeScheduleCbMap.forEach(({ cb, spec }) => {
            scheduleJob(spec, () => {
                cb.call(this, new LagrangeContext({ post_type:'meta_event' }));
            });
        });

        // 执行 mapper 中注册的定时器
        lagrangeMapper.getCreateTimeSchedule.forEach(({ invoker, config }) => {
            scheduleJob(config.spec, () => {
                invoker.call(this, new LagrangeContext({ post_type:'meta_event' }));
            });
        });

        process.on('SIGINT', () => {
            // unmounted 周期
            cycleCbMap.get('unmounted').forEach(cb => cb.call(this, new LagrangeContext({ post_type:'meta_event' })));

            this.ws.close();
            this.wsServer?.close();
        });
    }

    /**
     * @description 添加定时器
     * @param spec 描述定时器的字符串，比如 '0 31 16 * * *' 表示每天下午 16:31 执行
     * @param cb 注入 onebot 上下文 的回调函数
     */
    public addTimeSchedule(spec: string, cb: CycleCb) {
        this.timeScheduleCbMap.push({
            cb,
            spec
        });
    }

    /**
     * @description 注册客户端初始化完成后的行为
     */
    public onMounted(cb: CycleCb) {
        this.cycleCbMap.get('mounted').push(cb);
    }

    /**
     * @description 注册客户端退出时的行为
     */
    public onUnmounted(cb: CycleCb) {
        this.cycleCbMap.get('unmounted').push(cb);
    }
}

const lagrangeServer = new LagrangeServer();

export default lagrangeServer;