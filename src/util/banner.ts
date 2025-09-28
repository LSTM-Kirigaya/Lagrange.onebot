import figlet from "figlet";
import gradient from "gradient-string";
import chalk from "chalk";

/**
 * 打印启动 Banner
 */
export function showBanner(text = "LAGRANGE.ONEBOT") {
    // 生成字符画
    const banner = figlet.textSync(text, {
        horizontalLayout: "full",
        verticalLayout: "default",
        width: 150,
    });

    // 渐变
    const grad = gradient(["#5fa4fa", "#8b5cf6", "#ff7ac6"]);

    // 渐变大字
    const colored = banner
        .split("\n")
        .map((line) => grad(line))
        .join("\n");

    // 信息区（不要再套 gradient）
    const infoLines = [
        grad("📦 GitHub: https://github.com/LSTM-Kirigaya/Lagrange.onebot   ⭐ 请帮我们点个 Star!"),
        grad("📖 Docs:   https://document.kirigaya.cn/blogs/lagrange.onebot/main.html"),
    ];

    console.log("\n" + colored + "\n" + infoLines.join("\n") + "\n");
}
