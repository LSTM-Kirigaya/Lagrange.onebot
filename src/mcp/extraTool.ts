import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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
