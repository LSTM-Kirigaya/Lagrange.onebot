export interface CommonLaunchOption {
    qq: number,
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

export interface ILaunchConfig {
    
    /**
     * @description appsettings.json 的路径，默认通过环境变量 `$LAGRANGE_CORE_HOME` 获取
     */
    configPath?: string

}

export interface GetRawTextConfig {
    delimiter: string
}

export interface Controller {
    [key: string]: any;
}