import { command, logger } from './utils';

import type * as Lagrange from './type';
import type { LagrangeContext } from './context';
import type { MapperDescriptor, MessageInvoker } from './mapper';

type PluginFunction = (c: LagrangeContext<Lagrange.Message>) => Lagrange.Thenable<void>;

interface PluginsDescriptor {
    value?: PluginFunction;
    configurable?: boolean;
    enumerable?: boolean;
    writable?: boolean;
    get?(): any;
    set?(v: any): void;
}

class Plugins {
    registeredPlugins: Map<string, PluginFunction>;
    constructor() {
        this.registeredPlugins = new Map<string, PluginFunction>();
    }
    
    public register(name?: string) {
        const registeredPlugins = this.registeredPlugins;
        return function(target: any, propertyKey: string, descriptor: PluginsDescriptor) {
            const pluginName = name ? name: propertyKey;
            if (registeredPlugins.has(pluginName)) {
                logger.warning(`名为 ${pluginName} 插件已经被注册，本次操作将会覆盖原本的插件`);
            }
            registeredPlugins.set(pluginName, descriptor.value);
        }
    }

    public use(name: string) {
        const registeredPlugins = this.registeredPlugins;
        if (!registeredPlugins.has(name)) {
            logger.warning(`不存在名为 ${name} 的插件，本次操作无效`);
            return () => {};
        }
        const pluginFn = registeredPlugins.get(name);
        return function(target: any, propertyKey: string, descriptor: MapperDescriptor<MessageInvoker<Lagrange.Message>>) {
            const fn = descriptor.value;
            descriptor.value = async function(c: LagrangeContext<Lagrange.Message>) {
                await pluginFn(c);
                if (c.fin) {
                    return;
                }
                fn(c);
            }
        }
    }
}

const plugins = new Plugins();
export default plugins;


export class BuildInPlugins {

    @plugins.register('echo')
    echo(c: LagrangeContext<Lagrange.Message>) {
        const msg = c.message;
        if (msg.post_type === 'message') {
            const text = msg.raw_message.trim();
            if (text.startsWith('\\echo')) {
                c.sendMessage(text.substring(5));
                c.finishSession();
            }
        }
    }


    @plugins.register('pm')
    async showLog(c: LagrangeContext<Lagrange.Message>) {        
        const msg = c.message;
        if (msg.post_type === 'message') {            
            const text = msg.raw_message;
            if (text.startsWith('\\pm') || text.startsWith('\\pm2')) {
                logger.debug('pm2 is activated');
                const log = await command('pm2 ls -m');
                c.sendMessage(log.trim());
                c.finishSession();
            }
        }
    }
}
