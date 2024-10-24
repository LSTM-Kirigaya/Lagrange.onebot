import axios from 'axios';
import * as fs from 'fs';

async function getUserAvatar(qq: number) {
    const res = await axios.get(`https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=640`, {
        responseType: 'arraybuffer'
    });    
    if (res.status == 200) {
        fs.writeFileSync('hello.jpg', res.data);
    }
}

getUserAvatar(1193466151);