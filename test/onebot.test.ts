import { LagrangeFactory } from '../dist';
import { TestChannel } from './test-channel.test';

const server = LagrangeFactory.create([
    TestChannel
]);

server.onMounted(c => {
    c.sendPrivateMsg(1193466151, '成功上线');
});

server.launch({
    configPath: '/home/kirigaya/project/Lagrange.RagBot/node/Lagrange.Core',
    mcp: true,
    mcpOption: {
        enableMemory: true,
        enableWebsearch: true,
        port: 3010
    }
});