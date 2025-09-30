import * as os from 'node:os';


export function getLocalIP(): string | null {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        if (Object.hasOwnProperty.call(networkInterfaces, interfaceName)) {
            const interfaces = networkInterfaces[interfaceName];
            for (const iface of interfaces!) {
                // 只返回 IPv4 地址
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
    }
    return null;
}