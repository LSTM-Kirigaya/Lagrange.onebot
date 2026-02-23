/**
 * websearch (DuckDuckGo + Playwright) 测试
 *
 * 运行: npx tsx src/test/test-websearch.ts
 *
 * 依赖: 使用 Playwright 的 Chromium，并优先使用系统已安装的 Chrome (channel: 'chrome')。
 * 需已安装 Chrome 或执行: npx playwright install chromium
 */

import { websearch, type WebSearchResult } from "../mcp/extraTool";

const TEST_QUERY = "终末地 余烬";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

function isValidResult(r: WebSearchResult): boolean {
    return (
        typeof r === "object" &&
        r !== null &&
        typeof r.url === "string" &&
        typeof r.title === "string" &&
        typeof r.snippet === "string"
    );
}

async function main(): Promise<void> {
    console.log("=== websearch 测试 ===\n");
    console.log("查询:", TEST_QUERY);
    console.log("请求 DuckDuckGo 并解析结果...\n");

    const results = await websearch(TEST_QUERY);

    assert(Array.isArray(results), "返回值应为数组");
    console.log(`✓ 返回条数: ${results.length}`);

    results.forEach((r, i) => {
        assert(isValidResult(r), `第 ${i + 1} 条结构应为 { url, title, snippet }`);
    });
    console.log("✓ 每条结果均包含 url / title / snippet\n");

    if (results.length > 0) {
        console.log("--- 前 3 条结果 ---");
        results.slice(0, 3).forEach((r, i) => {
            console.log(`\n[${i + 1}] ${r.title}`);
            console.log(`    URL: ${r.url}`);
            console.log(`    简述: ${r.snippet.slice(0, 80)}${r.snippet.length > 80 ? "..." : ""}`);
        });
        console.log("\n--- 测试通过 ---");
    } else {
        console.log("(未获取到结果，可能网络或页面结构变化，但接口未抛错)");
    }
}

main().catch((err) => {
    console.error("测试失败:", err);
    process.exit(1);
});
