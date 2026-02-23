/**
 * Task 执行器：在受控环境中执行 AI 生成的 TypeScript/JavaScript 代码，
 * 代码可访问当前对话的 context（以及可选的 memory、util），用于发消息、查群信息等。
 * 仅暴露一个 execute_task 工具，大幅减少 MCP 的 context token 消耗。
 */

import vm from "vm";
import { format } from "util";
import * as ts from "typescript";
import type { LagrangeContext } from "../core/context";
import type { Memory } from "./memory";
import * as ExtraTool from "./extraTool";

const DEFAULT_TIMEOUT_MS = 30_000;

export interface TaskSandbox {
    /** 当前对话的 QQ 上下文，可调用 sendGroupMsg、getGroupInfo、getRawText 等 */
    context: LagrangeContext<any>;
    /** 长期记忆（若 MCP 启用 memory），可调用 addMemory、queryMemory、updateMemory、deleteMemory */
    memory?: Memory | null;
    /** 是否启用 websearch */
    websearch?: boolean;
}

/**
 * 将 TypeScript 源码转成 JavaScript（若已是合法 JS 则原样通过）
 */
function transpileToJS(code: string): string {
    try {
        const out = ts.transpileModule(code, {
            compilerOptions: {
                module: ts.ModuleKind.None,
                target: ts.ScriptTarget.ES2020,
                strict: false,
                esModuleInterop: true,
            },
        });
        return out.outputText;
    } catch (e) {
        throw new Error(`TypeScript 编译失败: ${(e as Error).message}`);
    }
}

/**
 * 构建 vm 沙箱：仅暴露必要内置对象（context/memory/util 通过函数参数传入，不放入全局）
 * 使用自定义 console 捕获 log/info/warn/debug/error 输出，供 AI 查看
 */
function createSandbox(stdoutLines: string[]): vm.Context {
    const pushOut = (...args: unknown[]) => stdoutLines.push(format(...args));
    const noop = () => {};
    const customConsole = {
        log: pushOut,
        info: pushOut,
        warn: pushOut,
        debug: pushOut,
        error: pushOut,
        trace: noop,
        dir: (...args: unknown[]) => stdoutLines.push(format("%O", args[0])),
        table: noop,
        count: noop,
        countReset: noop,
        group: noop,
        groupCollapsed: noop,
        groupEnd: noop,
        time: noop,
        timeEnd: noop,
        timeLog: noop,
        assert: (v?: unknown, ...rest: unknown[]) => { if (!v) pushOut("Assertion failed:", ...rest); },
        clear: noop,
        profile: noop,
        profileEnd: noop,
        timeStamp: noop,
        context: noop,
    };
    return vm.createContext({
        // 常用内置，便于代码中做 JSON/数组等操作
        JSON,
        console: customConsole,
        Promise,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Date,
        Error,
        RegExp,
        Map,
        Set,
        Symbol,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        decodeURI,
        decodeURIComponent,
        encodeURI,
        encodeURIComponent,
        Math,
        Reflect,
        Proxy,
        WeakMap,
        WeakSet,
        Intl,
        ArrayBuffer,
        DataView,
        Float32Array,
        Float64Array,
        Int8Array,
        Int16Array,
        Int32Array,
        Uint8Array,
        Uint16Array,
        Uint32Array,
        Uint8ClampedArray,
        BigInt,
        setTimeout,
        setImmediate,
        clearTimeout,
        clearImmediate,
        TextEncoder: globalThis.TextEncoder,
        TextDecoder: globalThis.TextDecoder,
        URL: globalThis.URL,
        URLSearchParams: globalThis.URLSearchParams,
        AbortController: globalThis.AbortController,
        AbortSignal: globalThis.AbortSignal,
    });
}

/**
 * 执行一段 task 代码（TypeScript 或 JavaScript）。
 * 代码在沙箱中运行，可访问 context、memory、util，返回序列化后的结果或错误信息。
 *
 * @param code 要执行的 TS/JS 代码，应为 async 函数体或同步代码；可 return 任意可序列化值
 * @param sandbox 注入的 context / memory / websearch
 * @param timeoutMs 超时毫秒数
 * @returns 执行结果的 JSON 字符串，或错误描述
 */
export async function runTaskCode(
    code: string,
    sandbox: TaskSandbox,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<string> {
    const js = transpileToJS(code.trim());
    const wrapped = `
(async function(context, memory, util) {
  "use strict";
  ${js}
})`;
    const stdoutLines: string[] = [];
    const ctx = createSandbox(stdoutLines);
    let fn: (context: any, memory: any, util: any) => Promise<any>;
    try {
        fn = vm.runInNewContext(wrapped, ctx, {
            timeout: timeoutMs,
            displayErrors: true,
        });
    } catch (e) {
        return JSON.stringify({
            ok: false,
            error: "脚本解析/编译错误",
            detail: (e as Error).message,
        });
    }

    const utilObj = {
        websearch: sandbox.websearch ? ExtraTool.websearch : undefined,
    };
    const run = () => fn(sandbox.context, sandbox.memory ?? null, utilObj);
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`执行超时（${timeoutMs}ms）`)), timeoutMs)
    );
    try {
        const result = await Promise.race([run(), timeoutPromise]);
        const stdout = stdoutLines.join("\n");
        return JSON.stringify({
            ok: true,
            result: result === undefined ? null : result,
            stdout,
        });
    } catch (e) {
        const stdout = stdoutLines.join("\n");
        return JSON.stringify({
            ok: false,
            error: "执行错误",
            detail: (e as Error).message,
            stdout,
        });
    }
}
