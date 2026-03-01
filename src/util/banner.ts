import figlet from "figlet";
import gradient from "gradient-string";
import chalk from "chalk";

export function getGrad() {
    // 经典的冷暖色调渐变
    return gradient(["#5fa4fa", "#8b5cf6", "#ff7ac6"]);
}

/**
 * 打印启动 Banner
 */
export function showBanner(text = "L.BOT") {
    const grad = getGrad();
    
    // 1. 生成字符画 (使用更加紧凑的 fitted 布局)
    const banner = figlet.textSync(text, {
        font: "Standard",
        horizontalLayout: "fitted",
    });

    // 2. 获取版本号 (增加容错读取)
    let version = "unknown";
    try {
        const pkg = require('../../package.json');
        version = pkg.version;
    } catch {
        try { version = require('../package.json').version; } catch {}
    }

    // 3. 定义装饰元素
    const border = grad("━".repeat(64));
    const coloredBanner = banner.split("\n").map(line => grad(line)).join("\n");

    // 4. 构建信息区 (使用对齐排版)
    const infoLines = [
        `  ${chalk.bold("Version ")} ${chalk.cyan(version)}`,
        `  ${chalk.bold("Author  ")} ${chalk.yellow("锦恢")} ${chalk.gray("(kirigaya.cn)")}`,
        `  ${chalk.bold("GitHub  ")} ${chalk.blue.underline("https://github.com/LSTM-Kirigaya/Lagrange.onebot")}`,
        `  ${chalk.bold("Docs    ")} ${chalk.magenta.underline("https://document.kirigaya.cn/blogs/lagrange.onebot")}`,
    ];

    // 5. 组合并打印
    console.log(`
${border}
${coloredBanner}
${border}
${infoLines.join("\n")}

  ${chalk.italic.gray("✨ Star 滞销，帮帮我们！")}
${border}
    `);
}