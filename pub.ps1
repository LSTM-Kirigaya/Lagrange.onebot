# pub.ps1 - 发布到 npmjs 的 PowerShell 脚本
# 使用方法：.\pub.ps1

# 编译 TypeScript
npm run build

# 删除旧的发布目录
if (Test-Path "publish") {
    Remove-Item -Recurse -Force "publish"
}

# 创建新的发布目录
New-Item -ItemType Directory -Path "publish" | Out-Null

# 复制 dist 目录内容
Copy-Item -Path "dist\*" -Destination "publish\" -Recurse

# 复制 README.md
Copy-Item -Path "README.md" -Destination "publish\"

# 复制 package.json
Copy-Item -Path "package.json" -Destination "publish\"

# 复制 .env.example (如果需要)
if (Test-Path ".env.example") {
    Copy-Item -Path ".env.example" -Destination "publish\"
}

Write-Host "发布目录准备完成：publish/"
Write-Host "接下来请执行：cd publish && npm publish"
