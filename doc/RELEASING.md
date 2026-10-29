# 维护与发布

## 一次改进的闭环

1. 定义要修复的行为，复现问题；修改实现及必要的风险测试。
2. 更新对应教程/架构说明及 CHANGELOG。基准 SVG 有意改变时先浏览器预览，再执行 `node scripts/acceptance.mjs --update`。
3. 运行 `npm run check`；通过后用 Chunyu Yang 的 Git 身份提交，推送 main。
4. 版本写入 package.json 和 package-lock.json（`npm version <版本> --no-git-tag-version`）；配套更新文档并提交。
5. 在干净的工作区运行 `npm run release`。打包器重新检查测试与案例，下载并验证官方 Node 归档，输出 ZIP 与 SHA256SUMS。
6. 解压到中文/空格路径，用包内 `.cmd` 重放全部示例，确认不依赖本机 Node/PATH；再创建注释版本 tag 并推送。
7. 运行 `node scripts/Publish-Release.mjs v版本`。脚本使用 Git Credential Manager 的既有 GitHub 登录，不把令牌写进仓库；先建立 draft，上传 ZIP/校验文件，最后公开。0.x 版本标记为预发布，1.x 为正式发布。

构建要求 Windows x64、Git、Node.js 24 和 Windows PowerShell 5.1+。SHA256 通过 .NET 计算，不依赖 Get-FileHash cmdlet。构建脚本有意要求干净工作区，manifest 中的 commit 才能对应完整已提交源码；ZIP 的二进制时间戳会导致重建哈希变化，所以以每次实际发布的 SHA256SUMS 为准。

运行用户只需 Windows 10/11 x64。包内 Node 运行时来源与许可证见 THIRD-PARTY-NOTICES。发布内容不包含开发依赖、测试、凭据或 `.git`。

## tag 约定

`v0.1.0` 等版本 tag 保持不变。课程验收 tag `final` 指向完成本次要求的正式版本；以后继续改进发布新语义版本，无需把整个项目永久冻结在 final。

GitHub 插件当前不提供 Release 附件上传接口，因此发布脚本使用 GitHub REST API；HTTP 报错时保留 draft 供排查，不公开未上传完整附件的版本。已经公开的版本不覆盖，修复应升版本。
