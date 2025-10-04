export interface CommonLaunchOption {
    access_token?: string
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
}

export interface ILaunchConfig {
    
    /**
     * @description appsettings.json 的路径，默认通过环境变量 `$LAGRANGE_CORE_HOME` 获取
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
     * @description 是否启动 MCP
     */
    mcp?: boolean

    /**
     * @description MCP 启动参数
     */
    mcpOption?: McpLanchOption
}

export interface GetRawTextConfig {
    delimiter: string
}

export interface Controller {
    [key: string]: any;
}