import { handleAutoDownloadImage, logger, SizedQueue } from '../util';
import type * as Lagrange from './type';
import type { LagrangeContext } from './context';

export type MessageInvoker<T extends Lagrange.Message> = (context: LagrangeContext<T>) => Lagrange.Thenable<undefined | void | string | Lagrange.Send.Default>;
export type PrivateUserInvoker = MessageInvoker<Lagrange.PrivateMessage>;
export type GroupUserInvoker = MessageInvoker<Lagrange.GroupMessage>;
export type FileReceiveInvoker = MessageInvoker<Lagrange.FileMessage>;
export type GroupIncreaseInvoker = MessageInvoker<Lagrange.ApproveMessage>;
export type AddFriendOrGroupInvoker = MessageInvoker<Lagrange.AddFriendOrGroupMessage>;
export type TimeScheduleInvoker = MessageInvoker<Lagrange.Message>;

export type MessagePostInvoker = PrivateUserInvoker |
    GroupUserInvoker |
    FileReceiveInvoker |
    GroupIncreaseInvoker |
    AddFriendOrGroupInvoker |
    TimeScheduleInvoker;


export interface MapperDescriptor<T extends MessagePostInvoker> {
    value?: T;
    configurable?: boolean;
    enumerable?: boolean;
    writable?: boolean;
    get?(): any;
    set?(v: any): void;
}

interface MessageInvokerStorage<T extends MessagePostInvoker> {
    invoker: T;
    config?: Record<string, any>
}

interface OnGroupConfig {
    at?: boolean
    onlyAdmin?: boolean
    memorySize?: number
    autoDownloadImage?: boolean
}

interface onPrivateUserConfig {
    memorySize?: number
    autoDownloadImage?: boolean
}

interface OnFileReceiveConfig {
    ignoreWarning: boolean
}

interface OnAddFriendOrGroupConfig {
    ignoreWarning: boolean
}


class LagrangeMapper {

    constructor(
        private readonly _privateUserStorage = new Map<number, MessageInvokerStorage<PrivateUserInvoker>>(),
        private readonly _groupStorage= new Map<number, MessageInvokerStorage<GroupUserInvoker>>(),
        private readonly _fileReceiveStorage = new Set<MessageInvokerStorage<FileReceiveInvoker>>(),
        private readonly _groupIncreaseStorage = new Map<number, MessageInvokerStorage<GroupIncreaseInvoker>>(),
        private readonly _addFriendOrGroupStorage = new Set<MessageInvokerStorage<AddFriendOrGroupInvoker>>(),
        private readonly _createTimeSchedule = new Set<MessageInvokerStorage<TimeScheduleInvoker>>(),
        private readonly _memoryStorage = new Map<number, SizedQueue<Lagrange.Message>>()
    ) { }

    get privateUserStorage() {
        return this._privateUserStorage;
    }

    get groupStorage() {
        return this._groupStorage;
    }

    get fileReceiveStorage() {
        return this._fileReceiveStorage;
    }

    get groupIncreaseStorage() {
        return this._groupIncreaseStorage;
    }

    get addFriendOrGroupStorage() {
        return this._addFriendOrGroupStorage;
    }

    get getCreateTimeSchedule() {
        return this._createTimeSchedule;
    }

    get memoryStorage() {
        return this._memoryStorage;
    }

    public async resolvePrivateUser(c: LagrangeContext<Lagrange.PrivateMessage>) {
        
        const user_id = c.message.user_id;
        const userStorage = this._privateUserStorage.get(user_id);
        if (userStorage) {

            const {
                memorySize = 0,
                autoDownloadImage = false,
            } = userStorage.config || {};

            await userStorage.invoker(c);

            // 如果需要下载图片，则下载
            if (autoDownloadImage) {
                handleAutoDownloadImage(c);
            }

            // 添加记忆功能
            if (memorySize > 0) {
                if (!this.memoryStorage.has(user_id)) {
                    this.memoryStorage.set(user_id, new SizedQueue<Lagrange.Message>(memorySize));
                }

                const queue = this.memoryStorage.get(user_id);
                queue?.enqueue(c.message);
            }
        }
    }

    public async resolveGroup(c: LagrangeContext<Lagrange.GroupMessage>) {
        const group_id = c.message.group_id;
        const groupStorage = this._groupStorage.get(group_id);
        if (groupStorage) {

            const {
                at = false,
                onlyAdmin = false,
                memorySize = 0,
                autoDownloadImage = false
            } = groupStorage.config || {};

            const msg = c.message;
            const firstSegment = msg.message[0];
            const robotQQ = c.qq + '';

            // 如果需要下载图片，则下载
            if (autoDownloadImage) {
                handleAutoDownloadImage(c);
            }

            // 添加守卫：如果不是 admin，则退出
            if (onlyAdmin) {
                const info = await c.getGroupMemberInfo(group_id, c.message.user_id, true);
                if (info instanceof Error) {
                    return;
                }

                const role = info['data'].role;
                if (role !== 'owner' && role !== 'admin') {
                    return;
                }
            }

            // 添加守卫：如果不是 at 机器人，则退出
            const validAt = Boolean(firstSegment.type === 'at' && firstSegment.data.qq === robotQQ);
            if (at) {
                if (validAt) {
                    msg.message = msg.message.slice(1);
                    msg.raw_message = msg.raw_message.substring(11 + robotQQ.length);
                } else {
                    return;
                }
            }

            await groupStorage.invoker(c);

            // 添加记忆功能
            if (memorySize > 0) {
                if (!this.memoryStorage.has(group_id)) {
                    this.memoryStorage.set(group_id, new SizedQueue<Lagrange.Message>(memorySize));
                }

                const queue = this.memoryStorage.get(group_id);
                queue?.enqueue(c.message);
            }
        }
    }

    /**
     * @description
     * @param c 
     */
    public getMemoryStorage<T extends Lagrange.Message>(c: LagrangeContext<T>): SizedQueue<T> | undefined {

        if (c.message.post_type === 'message') {
            if (c.message.message_type === 'group') {
                const storage = this.memoryStorage.get(c.message.group_id);
                return storage as SizedQueue<T>;
            }

            if (c.message.message_type === 'private') {
                const storage = this.memoryStorage.get(c.message.user_id);
                return storage as SizedQueue<T>;
            }

            return undefined;
        }

    }

    // 有新人入群
    public async resolveGroupIncrease(c: LagrangeContext<Lagrange.ApproveMessage>) {
        const group_id = c.message.group_id;
        const storage = this.groupIncreaseStorage.get(group_id);
        if (storage) {
            storage.invoker(c);
        }
    }

    // 有人发送离线文件
    public async resolveOfflineFile(c: LagrangeContext<Lagrange.FileMessage>) {
        for (const storage of this.fileReceiveStorage) {
            storage.invoker(c);
        }
    }

    // 加群或者好友的信号
    public async resolveRequest(c: LagrangeContext<Lagrange.RequestPostType>) {
        for (const storage of this.addFriendOrGroupStorage) {
            storage.invoker(c);
        }
    }

    /**
     * @description 私聊用户响应函数的注册函数
     * @param user_id 私聊用户的 QQ 号码
     * @returns 
     */
    public onPrivateUser(user_id: number, config: onPrivateUserConfig = {}) {
        const _this = this;
        return function (target: any, propertyKey: string, descriptor: MapperDescriptor<PrivateUserInvoker>) {
            if (_this._privateUserStorage.has(user_id)) {
                logger.warning(`${propertyKey} -> 用户 ${user_id} 已经被注册过了，该操作将覆盖原本的！`);
            }
            const invoker = descriptor.value;
            if (invoker) {
                _this._privateUserStorage.set(user_id, { invoker, config });
            }
        }
    }

    /**
     * @description 群聊用户响应函数的注册函数
     * @param group_id 群聊的群号
     * @param config 响应配置
     * @returns 
     */
    public onGroup(group_id: number, config: OnGroupConfig = {}) {
        const _this = this;
        return function (target: any, propertyKey: string, descriptor: MapperDescriptor<GroupUserInvoker>) {
            if (_this.groupStorage.has(group_id)) {
                logger.warning(`${propertyKey} -> 群 ${group_id} 已经被注册过了，该操作将覆盖原本的！`);
            }
            const invoker = descriptor.value;
            if (invoker) {
                _this.groupStorage.set(group_id, { invoker, config });
            }
        }
    }

    /**
     * @description 接收文件的响应函数的注册，注册一次，全局响应
     * @returns 
     */
    public onFileReceive(config?: OnFileReceiveConfig) {
        const _this = this;
        config = config || { ignoreWarning: false };
        return function (target: any, propertyKey: string, descriptor: MapperDescriptor<FileReceiveInvoker>) {
            if (_this.fileReceiveStorage.size > 0 && !config.ignoreWarning) {
                logger.warning(`${propertyKey} -> 文件接受管线已经注册，如果你真的希望同时调用多个 onFileReceive，考虑使用 @onFileReceive({ ignoreWarning: true })`);
            }
            const invoker = descriptor.value;
            if (invoker) {
                _this.fileReceiveStorage.add({ invoker });
            }
        }
    }


    /**
     * @description 新人入群的响应函数的注册
     * @param group_id 发生新人入群事件的群号
     */
    public onGroupIncrease(group_id: number) {
        const _this = this;
        return function (target: any, propertyKey: string, descriptor: MapperDescriptor<GroupIncreaseInvoker>) {
            if (_this.groupIncreaseStorage.has(group_id)) {
                logger.warning(`${propertyKey} -> 群 ${group_id} 已经被注册过了，该操作将覆盖原本的！`);
            }
            const invoker = descriptor.value;
            if (invoker) {
                _this.groupIncreaseStorage.set(group_id, { invoker });
            }
        }
    }

    /**
     * @description 有人想要入群或者加机器人好友的申请事件响应函数，注册一次，全局响应
     */
    public onAddFriendOrGroup(config?: OnAddFriendOrGroupConfig) {
        const _this = this;
        config = config || { ignoreWarning: false };
        return function (target: any, propertyKey: string, descriptor: MapperDescriptor<AddFriendOrGroupInvoker>) {
            if (_this.addFriendOrGroupStorage.size > 0 && !config.ignoreWarning) {
                logger.warning(`${propertyKey} -> 加好友/加群接受管线已经注册，如果你真的希望同时调用多个 onAddFriendOrGroup，考虑使用 @onAddFriendOrGroup({ ignoreWarning: true })`);
            }
            const invoker = descriptor.value;
            if (invoker) {
                _this.addFriendOrGroupStorage.add({ invoker });
            }
        }
    }

    public createTimeSchedule(spec: string) {
        const _this = this;
        return function (target: any, propertyKey: string, descriptor: MapperDescriptor<TimeScheduleInvoker>) {
            const invoker = descriptor.value;
            if (invoker) {
                _this.getCreateTimeSchedule.add({ invoker, config: { spec } });
            }
        }
    }
}

const lagMapper = new LagrangeMapper();
export default lagMapper;