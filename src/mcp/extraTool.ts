import { chromium } from "playwright";
import TurndownService from "turndown";
import { searchGroupMsgHistory, type HistoryMessageResult } from "../util/message-search";
import type { LagrangeContext } from "../core/context";
import type * as Lagrange from "../core/type";
import path from "path";

/**
 * 获取当前模块的 __dirname（兼容 ESM 和 CJS）
 * 在 CJS 中直接使用 __dirname，在 ESM 中通过堆栈追踪获取路径
 */
function getDirname(): string {
    // CJS 环境：直接使用 __dirname
    // @ts-ignore
    if (typeof __dirname !== "undefined" && __dirname) {
        // @ts-ignore
        return __dirname;
    }
    // ESM 环境：通过错误堆栈获取当前文件路径
    const stack = new Error().stack;
    if (stack) {
        const match = stack.match(/at (?:.+ )?\((.+):\d+:\d+\)/);
        if (match && match[1]) {
            const { fileURLToPath } = require("url");
            const filePath = match[1].replace(/^file:\/\//, "");
            return path.dirname(fileURLToPath(filePath));
        }
    }
    // 回退到当前工作目录
    return process.cwd();
}

/** 单条搜索结果 */
export interface WebSearchResult {
    /** 链接 */
    url: string;
    /** 网站标题 */
    title: string;
    /** 网站简述 */
    snippet: string;
}

/** 在 DuckDuckGo 搜索结果页的浏览器上下文中执行，提取结构化结果 */
function extractDuckDuckGoResults(): WebSearchResult[] {
    const articles = document.querySelectorAll('article[data-testid="result"]');
    const results: WebSearchResult[] = [];
    const max = Math.min(articles.length, 10);
    for (let i = 0; i < max; i++) {
        const article = articles[i];
        const titleLink = article.querySelector('a[data-testid="result-title-a"]') as HTMLAnchorElement | null;
        const snippetDiv = article.querySelector('div[data-result="snippet"]');
        const href = titleLink?.href?.trim() ?? "";
        const title = (titleLink?.textContent ?? "").trim();
        const snippet = (snippetDiv?.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 300);
        if (href && !href.includes("duckduckgo.com")) {
            results.push({ url: href, title, snippet });
        }
    }
    return results;
}

/** 网页内容转换结果 */
export interface WebPageMarkdownResult {
    /** 网页 URL */
    url: string;
    /** 网页标题 */
    title: string;
    /** Markdown 格式的内容 */
    markdown: string;
}

/**
 * 将指定 URL 的网页内容转换为 Markdown 格式
 * 
 * @param url 网页 URL
 * @returns 包含 url、title 和 markdown 的对象
 */
export async function getWebPageMarkdown(url: string): Promise<WebPageMarkdownResult> {
    const browser = await chromium.launch({
        headless: true,
        channel: "chrome",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    try {
        const page = await browser.newPage();
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.setExtraHTTPHeaders({
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        });

        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

        // 提取网页标题和主体内容
        const result = await page.evaluate(() => {
            // 获取网页标题
            const title = document.title?.trim() || "";

            // 尝试提取主体内容，移除导航、广告等无关元素
            let mainContent = "";
            
            // 优先使用语义化标签
            const mainElement = document.querySelector("main") ||
                document.querySelector("article") ||
                document.querySelector('[role="main"]') ||
                document.querySelector(".content") ||
                document.querySelector("#content") ||
                document.querySelector(".main") ||
                document.querySelector("#main");

            if (mainElement) {
                mainContent = mainElement.innerHTML;
            } else {
                // 如果没有找到主体元素，使用 body
                mainContent = document.body.innerHTML;
            }

            return { title, mainContent };
        });

        // 使用 Turndown 将 HTML 转换为 Markdown
        const turndownService = new TurndownService({
            headingStyle: "atx",
            codeBlockStyle: "fenced",
        });

        // 移除脚本和样式
        turndownService.remove(["script", "style", "noscript", "iframe"]);

        const markdown = turndownService.turndown(result.mainContent);

        return {
            url,
            title: result.title,
            markdown: markdown.trim(),
        };
    } finally {
        await browser.close();
    }
}

/**
 * 使用 DuckDuckGo 搜索引擎根据关键词搜索，返回结构化结果数组。
 * 通过 Playwright 无头浏览器打开搜索结果页，从 DOM 中解析 title / url / snippet。
 *
 * @param query 搜索关键词（与搜索框一致）
 * @returns 结果数组，每项包含 url、title、snippet
 */
export async function websearch(query: string): Promise<WebSearchResult[]> {
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&ia=web`;

    const browser = await chromium.launch({
        headless: true,
        channel: "chrome",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    try {
        const page = await browser.newPage();
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.setExtraHTTPHeaders({
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        });

        await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 15000 });

        await page.waitForSelector('article[data-testid="result"]', { timeout: 10000 }).catch(() => {});

        const results = (await page.evaluate(extractDuckDuckGoResults)) as WebSearchResult[];
        return results;
    } finally {
        await browser.close();
    }
}

/**
 * 搜索群聊历史消息的工具函数
 * 
 * @param context Lagrange 上下文
 * @param groupId 群组 ID
 * @param keywords 搜索关键词（支持多个，空格分隔）
 * @param limit 返回结果数量，默认 20
 * @returns JSON 字符串格式的搜索结果
 */
export async function searchHistoryMessages(
    context: LagrangeContext<Lagrange.Message>,
    groupId: number,
    keywords: string,
    limit: number = 20
): Promise<string> {
    try {
        const results = await searchGroupMsgHistory(context, {
            keywords,
            groupId,
            maxMessages: 500,
            limit,
        });

        // 格式化结果为可读的文本
        if (results.length === 0) {
            return JSON.stringify({
                success: true,
                message: `未找到包含关键词"${keywords}"的历史消息`,
                results: [],
            });
        }

        const formattedResults = results.map(r => ({
            sender: `${r.senderName || r.senderId}(${r.senderId})`,
            time: new Date(r.time * 1000).toLocaleString('zh-CN'),
            content: r.content,
        }));

        return JSON.stringify({
            success: true,
            message: `找到 ${results.length} 条包含关键词"${keywords}"的历史消息`,
            results: formattedResults,
        });
    } catch (error) {
        console.error('[searchHistoryMessages] 搜索失败:', error);
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : '搜索失败',
        });
    }
}

/**
 * 获取 SKILL.md 文件的绝对路径
 *
 * @returns SKILL.md 文件的绝对路径
 */
export function getSkillMdPath(): string {
    const dir = getDirname();
    return path.join(dir, '..', '..', 'src', 'qqbot-skills', 'SKILL.md');
}
