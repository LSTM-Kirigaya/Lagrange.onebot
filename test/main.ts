import { server } from '../dist';
import './impl';

server.onMounted(c => {
    // c.sendPrivateMsg(1193466151, '成功上线');
});

server.onUnmounted(c => {
    // c.sendPrivateMsg(1193466151, '成功下线');
})

server.run({
    host: '127.0.0.1',
    port: 8080,
    path: '/onebot/v11/ws',
    qq: 1542544558
});