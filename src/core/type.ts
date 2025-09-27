/**
 * @author 锦恢
 * @email zhelonghuang@qq.com
 * @description Lagrange.Core 前端接口
 * @comment 详细的接口信息来源
 * - https://github.com/botuniverse/onebot-11/blob/master/api/public.md
 * - https://docs.go-cqhttp.org/reference/data_struct.html
 */

export interface HeartBeatStatus {
    app_initialized: boolean,
    app_enabled: boolean,
    app_good: boolean,
    online: boolean,
    good: boolean
}

export type MetaEventType = 'heartbeat' | 'lifecycle';

export interface HeartBeatMessage {
    interval: number,
    status: HeartBeatStatus,
    meta_event_type: 'heartbeat',
    time: number,
    self_id: number,
    post_type: 'meta_event'
}

export interface Sender {
    user_id: number,
    nickname: string,
    sex: 'unknown' | 'male' | 'female',
    card?: string,
    age?: number,
    area?: string,
    level?: string,     // 群聊等级，但是是 string
    role?: string,
    title?: string
}

// 参考文档： https://github.com/botuniverse/onebot-11/blob/master/message/segment.md
export namespace Receive {
    export interface Text {
        type: 'text',
        data: {
            text: string
        }
    }
    
    export interface Face {
        type: 'face',
        data: {
            id: string
        }
    }

    export interface Image {
        type: 'image',
        data: {
            file: string,
            url: string,
            filename: string,
            // 在简略窗口可以看到的信息，对于图片来说，这就是 [图片]
            summary: string,
            // 0 代表 图片，1 代表表情包
            subType: number
        }
    }

    export interface Audio {
        type: 'record',
        data: {
            file: string,
            magic: 0 | 1,
            url: string
        }
    }

    export interface Video {
        type: 'video',
        data: {
            file: string,
            url: string
        }
    }
    
    export interface At {
        type: 'at',
        data: {
            qq: string
        }
    }
    
    // 猜拳魔法表情
    export interface FingerGuess {
        type: 'rps',
        data: {}
    }

    // 掷骰子魔法表情
    export interface Dice {
        type: 'dice',
        data: {}
    }

    // 窗口抖动（戳一戳）
    export interface WindowJitter {
        type: 'shake',
        data: {}
    }

    // 戳一戳
    export interface Poke {
        type: 'poke',
        data: {
            type: string,
            id: string,
            name: string
        }
    }

    export interface Link {
        type: 'share',
        data: {
            // URL
            url: string,
            // 标题
            title: string,
            // 发送时可选，内容描述
            content?: string,
            // 发送时可选，图片 URL
            image?: string
        }
    }

    export interface RecommendFriend {
        type: 'contact',
        data: {
            type: 'qq',
            // 被推荐人的 QQ 号
            id: string
        }
    }

    export interface RecommendGroup {
        type: 'contact',
        data: {
            type: 'group',
            // 被推荐群的群号
            id: string
        }
    }

    export interface Location {
        type: 'location',
        data: {
            // 纬度
            lat: string,
            // 经度
            lon: string,
            // 发送时可选，标题
            title?: string,
            // 发送时可选，内容描述
            content?: string
        }
    }

    export interface Reply {
        type: 'reply',
        data: {
            id: string
        }
    }

    export interface Forward {
        type: 'forward',
        data: {
            id: string
        }
    }

    export interface XML {
        type: 'xml',
        data: {
            // XML 内容
            data: string
        }
    }

    export interface JSON {
        type: 'json',
        data: {
            data: string
        }
    }

    export type Default = Text | Face | Image | Audio | Video | At | FingerGuess | Dice | WindowJitter | Poke | Link | RecommendFriend | RecommendGroup | Location | Reply | Forward | XML | JSON;
}

export namespace Send {
    export interface Text {
        type: 'text',
        data: {
            text: string
        }
    }

    export interface Face {
        type: 'face',
        data: {
            id: string
        }
    }

    export interface Image {
        type: 'image',
        data: {
            /**
             * 发送时 file 可行的三种取值
             * 1. 绝对路径，例如 file:///C:\\Users\Richard\Pictures\1.png
             *                  file:///ubuntu/project/rag-llm/images/bird.png
             * 2. 网络 URL，例如 http://i1.piimg.com/567571/fdd6e7b6d93f1ef0.jpg
             * Base64 编码，例如 base64://iVBORw0KGgoAAAANSUhEUgAAABQAAAAVCAIAAADJt1n/AAAAKElEQVQ4EWPk5+RmIBcwkasRpG9UM4mhNxpgowFGMARGEwnBIEJVAAAdBgBNAZf+QAAAAABJRU5ErkJggg==
            */
            file: string,
            
            // 只在通过网络 URL 发送时有效，表示是否使用已缓存的文件，默认 1
            cache?: 0 | 1,

            // 只在通过网络 URL 发送时有效，表示是否通过代理下载文件（需通过环境变量或配置文件配置代理），默认 1
            proxy?: 0 | 1,

            // 只在通过网络 URL 发送时有效，单位秒，表示下载网络文件的超时时间，默认不超时
            timeout?: number
        }
    }

    export interface Audio {
        type: 'record',
        data: {
            file: string,
            magic?: 0 | 1,
            cache?: 0 | 1,
            proxy?: 0 | 1,
            timeout?: number
        }
    }

    export interface Video {
        type: 'video',
        data: {
            file: string,
            cache?: 0 | 1,
            proxy?: 0 | 1,
            timeout?: number
        }
    }

    export interface At {
        type: 'at',
        data: {
            qq: string
        }
    }
    
    export interface FingerGuess {
        type: 'rps',
        data: {}
    }

    export interface Dice {
        type: 'dice',
        data: {}
    }

    export interface WindowJitter {
        type: 'shake',
        data: {}
    }

    // 戳一戳
    export interface Poke {
        type: 'poke',
        data: {
            type: string,
            id: string,
        }
    }

    export interface Anonymous {
        type: 'anonymous',
        data: {}
    }

    export interface Link {
        type: 'share',
        data: {
            // URL
            url: string,
            // 标题
            title: string,
            // 发送时可选，内容描述
            content?: string,
            // 发送时可选，图片 URL
            image?: string
        }
    }

    export interface RecommendFriend {
        type: 'contact',
        data: {
            type: 'qq',
            // 被推荐人的 QQ 号
            id: string
        }
    }

    export interface RecommendGroup {
        type: 'contact',
        data: {
            type: 'group',
            // 被推荐群的群号
            id: string
        }
    }

    export interface Location {
        type: 'location',
        data: {
            // 纬度
            lat: string,
            // 经度
            lon: string,
            // 发送时可选，标题
            title?: string,
            // 发送时可选，内容描述
            content?: string
        }
    }

    export interface MusicShare {
        type: 'music',
        data: {
            // 分别表示使用 QQ 音乐、网易云音乐、虾米音乐
            type: 'qq' | '163' | 'xm',
            // 歌曲 ID
            id: string
        }
    }

    export interface CustomMusicShare {
        type: 'music',
        data: {
            type: 'custom',
            url: string,
            audio: string,
            title: string,
            content: string,
            image: string
        }
    }

    export interface Reply {
        type: 'reply',
        data: {
            id: string
        }
    }

    export interface ForwardNode {
        type: 'node',
        data: {
            id: string
        }
    }

    export interface XML {
        type: 'xml',
        data: {
            // XML 内容
            data: string
        }
    }

    export interface JSON {
        type: 'json',
        data: {
            data: string
        }
    }

    export type Default = Text | Face | Image | Audio | Video | At | FingerGuess | Dice | WindowJitter | Poke | Anonymous | Link | RecommendFriend | RecommendGroup | Location | MusicShare | CustomMusicShare | Reply | ForwardNode | XML | JSON;
}



export interface MsgFile {
    // 一般是 ''
    id: string,
    // 文件名
    name: string,
    // 文件大小，单位：字节
    size: number,
    // id
    busid: number,
    // 链接 IPv4
    url: string
}

export interface MetaMessage {
    post_type: 'meta_event',
    [msg: string]: any
}

export interface CommonMessage {
    // 事件类型
    post_type: 'message',
    // 信息来自私聊还是群聊
    message_type?: 'private' | 'group',
    // 发送信息的是朋友还是群友/陌生人
    sub_type?: 'friend' | 'normal',
    // 消息的编号
    message_id?: number,
    // 群号
    group_id?: number,
    // 发消息的人的 QQ 号
    user_id: number,
    // 是否为匿名发言，一般都是 null
    anonymous?: null | boolean,
    // 消息内容（结构化）
    message?: Receive.Default,
    // 消息内容（纯文本）
    raw_message?: string,
    // 发送的时间戳
    time: number,
    // 自己的 id
    self_id: number,
    // 发送的文件
    // 默认字体大小，一般都是 0
    font?: number
}

export interface PrivateMessage {
    // 事件类型
    post_type: 'message',
    // 信息来自私聊还是群聊
    message_type: 'private',
    // 消息的编号
    message_id: number,
    // 发消息的人的 QQ 号
    user_id: number,
    // 消息内容（结构化）
    message: Receive.Default[],
    // 消息内容（纯文本）
    raw_message: string,
    // 发送的时间戳
    time: number,
    // 自己的 id
    self_id: number,
    // 默认字体大小，一般都是 0
    font?: number
}


export interface GroupMessage {
    // 事件类型
    post_type: 'message',
    // 信息来自私聊还是群聊
    message_type: 'group',
    // 发送信息的是朋友还是群友/陌生人
    sub_type: 'friend' | 'normal',
    // 消息的编号
    message_id: number,
    // 群号
    group_id: number,
    // 发消息的人的 QQ 号
    user_id: number,
    // 是否为匿名发言，一般都是 null
    anonymous: null | boolean,
    // 消息内容（结构化）
    message: Receive.Default[],
    // 消息内容（纯文本）
    raw_message: string,
    // 发送的时间戳
    time: number,
    // 自己的 id
    self_id: number,
    // 发送的文件
    // 默认字体大小，一般都是 0
    font?: number
}

export interface FileMessage {
    post_type: 'notice',
    user_id: number,
    file: MsgFile,
    group_id?: number,
    notice_type?: 'offline_file',
    time: number,
    self_id: number
}

// 加群或者加好友
export interface AddFriendOrGroupMessage {
    post_type: 'request',
    sub_type: 'add',
    user_id: number,
    group_id: number,
    // 默认为 0 代表没有邀请者
    invitor_id: number,
    request_type: 'private' | 'group',
    // 群问题和申请者的回答
    comment: string,
    flag: string,
    time: number,
    self_id: number,
}

// 同意
export interface ApproveMessage {
    post_type: 'notice',
    sub_type: 'approve',
    group_id: number,
    operator_id: number,
    user_id: number,
    notice_type: 'group_increase',
    time: number,
    self_id: number,
}

export type Message = MetaMessage | PrivateMessage | GroupMessage | FileMessage | AddFriendOrGroupMessage | ApproveMessage;
export type MessagePostType = PrivateMessage | GroupMessage;
export type NoticePostType = FileMessage | ApproveMessage;
export type RequestPostType = AddFriendOrGroupMessage;


export type Thenable<T> = T | Promise<T>;


export interface ApiJSON {
    action: string,
    params: {
        [msg: string]: number | string | Send.Default[] | boolean | object | undefined
    },
    echo?: string
}

export type SendApi = (apiJSON: ApiJSON) => Thenable<void | Error>;

export interface InvokerContext<M = Message> {
    message: M,
    // 发送的基础接口，不应该被用户直接使用
    send: SendApi,
    // 结束当前会话，该方法使用后， send 在当前会话中将无效
    finishSession: () => void,
    // 其他的方法，详见 onebot v11 协议内容
    [msg: string]: any
}

export type PrivateUserInvokeContext = InvokerContext<PrivateMessage>;
export type GroupUserInvokeContext = InvokerContext<GroupMessage>;

export interface CommonResponse<T> {
    status: string,
    retcode: number,
    data: T,
    message?: string,
    echo?: any
}

// response type for send_private_msg
export interface SendPrivateMsgResponse {
    // 消息 ID
    message_id: number;
}

// response type for send_group_msg
export interface SendGroupMsgResponse {
    // 消息 ID
    message_id: number;
}

// response type for send_msg
export interface SendMsgResponse {
    // 消息 ID
    message_id: number;
}

// response type for delete_msg
export interface DeleteMsgResponse {
}

// response type for get_msg
export interface GetMsgResponse {
    // 发送时间
    time: number;
    // 消息类型，同 [消息事件](../event/message.md)
    message_type: string;
    // 消息 ID
    message_id: number;
    // 消息真实 ID
    real_id: number;
    // 发送人信息，同 [消息事件](../event/message.md)
    sender: Sender;
    // 消息内容
    message: string | Send.Default[];
}

// response type for get_forward_msg
export interface GetForwardMsgResponse {
    // 消息内容，使用 [消息的数组格式](../message/any[].md) 表示，数组中的消息段全部为 [`node` 消息段](../message/segment.md#合并转发自定义节点)
    message: string | Send.Default[];
}

// response type for send_like
export interface SendLikeResponse {
}

// response type for set_group_kick
export interface SetGroupKickResponse {
}

// response type for set_group_ban
export interface SetGroupBanResponse {
}

// response type for set_group_anonymous_ban
export interface SetGroupAnonymousBanResponse {
}

// response type for set_group_whole_ban
export interface SetGroupWholeBanResponse {
}

// response type for set_group_admin
export interface SetGroupAdminResponse {
}

// response type for set_group_anonymous
export interface SetGroupAnonymousResponse {
}

// response type for set_group_card
export interface SetGroupCardResponse {
}

// response type for set_group_name
export interface SetGroupNameResponse {
}

// response type for set_group_leave
export interface SetGroupLeaveResponse {
}

// response type for set_group_special_title
export interface SetGroupSpecialTitleResponse {
}

// response type for set_friend_add_request
export interface SetFriendAddRequestResponse {
}

// response type for set_group_add_request
export interface SetGroupAddRequestResponse {
}

// response type for get_login_info
export interface GetLoginInfoResponse {
    // QQ 号
    user_id: number;
    // QQ 昵称
    nickname: string;
}

// response type for get_stranger_info
export interface GetStrangerInfoResponse {
    // QQ 号
    user_id: number;
    // 昵称
    nickname: string;
    // 性别，`male` 或 `female` 或 `unknown`
    sex: string;
    // 年龄
    age: number;
}

// response type for get_friend_list
export interface GetFriendListResponse {
    // QQ 号
    user_id: number;
    // 昵称
    nickname: string;
    // 备注名
    remark: string;
}

// response type for get_group_info
export interface GetGroupInfoResponse {
    // 群号
    group_id: number;
    // 群名称
    group_name: string;
    // 成员数
    member_count: number;
    // 最大成员数（群容量）
    max_member_count: number;
}

// response type for get_group_list
export type GetGroupListResponse = GetGroupInfoResponse[];

// response type for get_group_member_info
export interface GetGroupMemberInfoResponse {
    // 群号
    group_id: number;
    // QQ 号
    user_id: number;
    // 昵称
    nickname: string;
    // 群名片／备注
    card: string;
    // 性别，`male` 或 `female` 或 `unknown`
    sex: string;
    // 年龄
    age: number;
    // 地区
    area: string;
    // 加群时间戳
    join_time: number;
    // 最后发言时间戳
    last_sent_time: number;
    // 成员等级
    level: string;
    // 角色，`owner` 或 `admin` 或 `member`
    role: string;
    // 是否不良记录成员
    unfriendly: boolean;
    // 专属头衔
    title: string;
    // 专属头衔过期时间戳
    title_expire_time: number;
    // 是否允许修改群名片
    card_changeable: boolean;
}

// response type for get_group_member_list
export type GetGroupMemberListResponse = GetGroupMemberInfoResponse[];

// response type for get_group_honor_info
export interface GetGroupHonorInfoResponse {
    // 群号
    group_id: number;
    // 当前龙王，仅 `type` 为 `talkative` 或 `all` 时有数据
    current_talkative: ICurrentTalkative;
    // 历史龙王，仅 `type` 为 `talkative` 或 `all` 时有数据
    talkative_list: IHonorObject[];
    // 群聊之火，仅 `type` 为 `performer` 或 `all` 时有数据
    performer_list: IHonorObject[];
    // 群聊炽焰，仅 `type` 为 `legend` 或 `all` 时有数据
    legend_list: IHonorObject[];
    // 冒尖小春笋，仅 `type` 为 `strong_newbie` 或 `all` 时有数据
    strong_newbie_list: IHonorObject[];
    // 快乐之源，仅 `type` 为 `emotion` 或 `all` 时有数据
    emotion_list: IHonorObject[];
}

interface ICurrentTalkative {
    // QQ 号
    user_id: number;
    // 昵称
    nickname: string;
    // 头像 URL
    avatar: string;
    // 持续天数
    day_count: number;
}

interface IHonorObject {
    // QQ 号
    user_id: number;
    // 昵称
    nickname: string;
    // 头像 URL
    avatar: string;
    // 荣誉描述
    description: string;
}

// response type for get_cookies
export interface GetCookiesResponse {
    // Cookies
    cookies: string;
}

// response type for get_csrf_token
export interface GetCsrfTokenResponse {
    // CSRF Token
    token: number;
}

// response type for get_credentials
export interface GetCredentialsResponse {
    // Cookies
    cookies: string;
    // CSRF Token
    csrf_token: number;
}

// response type for get_record
export interface GetRecordResponse {
    // 转换后的语音文件路径，如 `/home/somebody/cqhttp/data/record/0B38145AA44505000B38145AA4450500.mp3`
    file: string;
}

// response type for get_image
export interface GetImageResponse {
    // 下载后的图片文件路径，如 `/home/somebody/cqhttp/data/image/6B4DE3DFD1BD271E3297859D41C530F5.jpg`
    file: string;
}

// response type for can_send_image
export interface CanSendImageResponse {
    // 是或否
    yes: boolean;
}

// response type for can_send_record
export interface CanSendRecordResponse {
    // 是或否
    yes: boolean;
}

// response type for get_status
export interface GetStatusResponse {
    // 当前 QQ 在线，`null` 表示无法查询到在线状态
    online: boolean;
    // 状态符合预期，意味着各模块正常运行、功能正常，且 QQ 在线
    good: boolean;
    // OneBot 实现自行添加的其它内容
    [name: string]: any;
}

// response type for get_version_info
export interface GetVersionInfoResponse {
    // 应用标识，如 `mirai-native`
    app_name: string;
    // 应用版本，如 `1.2.3`
    app_version: string;
    // OneBot 标准版本，如 `v11`
    protocol_version: string;
    // OneBot 实现自行添加的其它内容
    [name: string]: any;
}

// response type for set_restart
export interface SetRestartResponse {
}

// response type for clean_cache
export interface CleanCacheResponse {
}

export interface NoticeMessage {
    notice_id: string,
    sender_id: number,
    publish_time: number,
    message: any
}