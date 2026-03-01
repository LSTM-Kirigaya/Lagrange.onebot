export interface CommonLaunchOption {
    accessToken?: string
}

export interface ForwardWebsocketLaunchOption extends CommonLaunchOption {
    type: "forward-websocket",
    host: string,
    port: number
}

export interface BackwardWebsocketLaunchOption extends CommonLaunchOption {
    type: "backward-websocket",
    host: string,
    port: number,
    path: string
}

export type LaunchOption = ForwardWebsocketLaunchOption | BackwardWebsocketLaunchOption;

export interface McpLanchOption {

    /**
     * @description MCP 服务器的主机名，默认为 localhost
     */
    host?: string;

    /**
     * @description MCP 监听的端口，默认 3010
     */
    port?: number;

    /**
     * @description 是否启动 memory
     */
    enableMemory?: boolean

    /**
     * @description 是否启动 websearch
     */
    enableWebsearch?: boolean

    /**
     * 代理地址（用于从 Hugging Face 下载 Memory 模型），如 "7897" 或 "http://127.0.0.1:7897"
     */
    proxy?: string
}

/**
 * @description 连接类型，与 LaunchOption 的 type 一致
 */
export type LaunchConnectionType = LaunchOption['type'];

export interface ILaunchConfig {

    /**
     * @description appsettings.json 的路径，默认通过环境变量 `$LAGRANGE_CORE_HOME` 获取
     * 若未提供或文件不存在，且提供了下方连接参数（type/host/port），则仅用连接参数启动
     */
    configPath?: string

    /**
     * @description 是否启动日志
     */
    logger?: boolean

    /**
     * @description 数据库文件夹，默认为 lagrange-0-db
     */
    db?: string

    /**
     * @description MCP 启动参数；传入即启用 MCP，不传则不启动
     */
    mcpOption?: McpLanchOption

    // ---------- 连接参数（可选，用于覆盖配置文件或仅用参数启动） ----------

    /**
     * @description 连接方式：forward-websocket | backward-websocket
     * 与配置文件同时存在时，以此为准
     */
    type?: LaunchConnectionType

    /**
     * @description WebSocket 主机地址。与配置文件同时存在时，以此为准
     */
    host?: string

    /**
     * @description WebSocket 端口。与配置文件同时存在时，以此为准
     */
    port?: number

    /**
     * @description 访问令牌（AccessToken）。与配置文件同时存在时，以此为准
     */
    accessToken?: string

    /**
     * @description 反向 WebSocket 路由路径，仅 type 为 backward-websocket 时有效。与配置文件同时存在时，以此为准
     */
    path?: string
}

export interface GetRawTextConfig {
    delimiter: string
}

export interface Controller {
    [key: string]: any;
}

/** 获取好友历史消息记录 */
export interface GetFriendMsgHistoryParams {
    /** 对方 QQ 号 */
    user_id: number
    /** 起始消息序号 */
    message_seq?: number
    /** 起始消息ID lgl */
    message_id?: number
    /** 消息数量 */
    count: number
}

/** 获取群组历史消息记录 */
export interface GetGroupMsgHistoryParams {
    /** 群号 */
    group_id: number
    /** 起始消息序号 */
    message_seq?: number
    /** 起始消息ID lgl */
    message_id?: number
    /** 消息数量 */
    count: number
}