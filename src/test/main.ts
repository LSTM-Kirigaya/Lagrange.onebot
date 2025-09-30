import { LagrangeFactory } from '..';
import { qq_users } from './global';
import { TestChannel } from './test-channel';

const server = LagrangeFactory.create([
    TestChannel
]);

server.onMounted(c => {
    c.sendPrivateMsg(qq_users.JIN_HUI, 'Successfully Login, TIP online');
});

server.launch({
    configPath: '/home/kirigaya/project/Lagrange.RagBot/node/Lagrange.Core/appsettings.json',
    mcp: true,
    mcpOption: {
        enableMemory: true,
        enableWebsearch: true,
        host: '0.0.0.0',
        port: 3010
    }
});