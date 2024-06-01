/**
 * @author 锦恢
 * @email 1193466151@qq.com
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
            // 在简略窗口可以看到的信息，对于图片来说，这就是 [图片]
            summary: string
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
    notice_type?: 'offline_file',
    time: number,
    self_id: number
}

// 加群或者加好友
export interface AddMessage {
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

export type Message = MetaMessage | PrivateMessage | GroupMessage | FileMessage | AddMessage | ApproveMessage;
export type MessagePostType = PrivateMessage | GroupMessage;
export type NoticePostType = FileMessage | ApproveMessage;
export type RequestPostType = AddMessage;


export type Thenable<T> = T | Promise<T>;


export interface ApiJSON {
    action: string,
    params: {
        [msg: string]: number | string | Send.Default[] | boolean | object
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
