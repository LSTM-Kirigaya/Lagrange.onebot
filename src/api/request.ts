
import * as fs from 'fs';

import * as yaml from 'yaml';
import axios from 'axios';

// 得到配置文件，组装基础路由
const vecdbBuffer = fs.readFileSync('./config/vecdb.yml', 'utf-8');
const vecdbConfig = yaml.parse(vecdbBuffer);
const vecdbBaseURL = `http://${vecdbConfig['addr']}:${vecdbConfig['port']}`;

const vecdbRequests = axios.create({
    baseURL: vecdbBaseURL,
    timeout: 5000    
});

console.log('vecdbRequests 根路由设置为 ' + vecdbBaseURL);


// 拦截器
vecdbRequests.interceptors.request.use(
    config => {
        const authorization = '';
        if (authorization) {
            config.headers['Authorization'] = authorization;
        }
        return config;
    }
);

vecdbRequests.interceptors.response.use(
    res => {
        return res;
    },
    () => {
        return new Error('fail to get response');
    }
);

export {
    vecdbRequests,

};