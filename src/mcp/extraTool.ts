import { exec } from "child_process";
import { promisify } from "util";
import { InMemoryStore } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";

const execAsync = promisify(exec);
const store = new InMemoryStore();

export async function websearch(url: string): Promise<string> {
    try {
        // 1. 检查 crwl 是否存在
        await execAsync("which crwl");

        // 2. 调用 crwl 命令
        const { stdout, stderr } = await execAsync(`crwl ${url} -o markdown`);

        if (stderr) {
            throw new Error(`crwl 执行出错: ${stderr}`);
        }

        return stdout.trim();
    } catch (err) {
        throw new Error(
            `无法执行 crwl，请确认已安装 crawl4ai 并在 PATH 中: \n${(err as Error).message}`
        );
    }
}



/**
 * 添加记忆
 * @param content 需要记忆的内容
 * @param namespaces 命名空间，例如不同的用户id，这样可以区分不同用户的记忆（可选）
 * @param key 记忆的唯一标识（可选）
 */
export async function addMemory(content: string[], namespaces?: string[], key?: string): Promise<string> {
    try {
        const finalNamespaces = (namespaces && namespaces.length) ? namespaces : ['default'];
        const finalKey = key ?? uuidv4();
        await store.put(finalNamespaces, finalKey, content);
        return `记忆添加成功`;
    } catch (err) {
        throw new Error(
            `无法执行 addMemory: \n${(err as Error).message}`
        );
    }
}


/**
 * 更新记忆
 * @param namespace 命名空间
 * @param key 记忆的唯一标识
 * @param content 需要更新的内容
 */
export async function updateMemory(namespace: string, key: string, content: string[]): Promise<string> {
    try {

        await store.put([namespace], key, content);
        return `记忆更新成功`;
    } catch (err) {
        throw new Error(
            `无法执行 updateMemory: \n${(err as Error).message}`
        );
    }
}
/**
 * 查询记忆
 * @param query 查询内容
 * @param namespaces 命名空间，例如不同的用户id，这样可以区分不同用户的记忆（可选）
 */
export async function queryMemory( query: string,namespaces?: string[]): Promise<string> {
    try {
         const finalNamespaces = (namespaces && namespaces.length) ? namespaces : ['default'];
        const result = await store.search(finalNamespaces, { query: query, limit: 5 });
        return result.map(item => item.value).flat().join("\n");
    } catch (err) {
        throw new Error(
            `无法执行 queryMemory: \n${(err as Error).message}`
        );
    }
}