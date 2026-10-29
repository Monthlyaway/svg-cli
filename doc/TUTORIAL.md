# 从零开始画 SVG

## 1. 我们要做什么

SVG 是一种图形文件。与截图不同，它保存的是“在什么位置画什么形状”，放大后边缘仍清晰。这个 CLI（命令行界面）让你用文字指令制作流程图、示意图、小卡片，再保存为 `.svg` 文件。它只实现课程要求的六种图形及属性，不是完整的外部 SVG 排版工具。

先按首页下载免安装包并解压。在解压目录打开 PowerShell，运行 `./svg-cli.cmd`。出现 `svg>` 说明编辑器正在等待命令。直接双击也能打开，但在终端使用更方便查看报错。

后面的代码框只复制内容，不输入 `svg>`。命令和类型使用小写；ID 区分大小写。示例中的 `#e8f2ff` 是颜色值，并非注释；只有整行以 `#` 开头才是注释。

## 2. 第一张图

```text
init 400 200
create rect card 30 40 340 120 #e8f2ff
create text title 60 105 "Hello SVG"
tree
show card
save hello.svg
```

`init` 创建宽 400、高 200 的画布。左上角是 `(0,0)`，x 向右、y 向下，单位为像素。`rect` 是矩形，后面的 `card` 是它的唯一 ID，`30 40` 是左上角，`340 120` 是宽高。`text` 创建文字，`60 105` 是文字基线起点，所以文字主要显示在 y=105 的上方。

`tree` 列出文档树及属性，`show card` 查看某个图形的明细。`save` 将图写到磁盘；保存路径相对于打开终端时的工作目录。将文件拖入浏览器预览，之后每次保存再刷新浏览器。

不指定颜色时 SVG 默认为黑色填充、没有描边，因此 line 通常需要显式提供 `black` 等描边颜色。不要把同一个 ID 用两次。

## 3. 修改与撤销

```text
move title 10 0
set card fill #fff0c2
set card stroke #3266a8
set card stroke-width 2
undo
redo
scale card 0.8
```

`move` 使用增量；`10 0` 表示向右 10。`scale 0.8` 会将位置和尺寸都乘以 0.8，围绕画布原点缩放，不是围绕图形中心。`set` 只能修改白名单属性，不能修改 ID；完整列表见命令速查。

每条编辑命令是一个撤销单位。撤销后再编辑会丢弃重做分支。查看 tree/show/help 和不带尺寸的 canvas 不影响历史。成功执行 init、read、save 或 canvas 改尺寸后，旧历史被清空，undo/redo 会提示 `error: undo not allowed after io command`；下一条成功的编辑重新开启历史。失败命令不会改变图形、路径或历史。

## 4. 分组让文字跟着图形走

```text
init 800 300
create g flow
create g node1 in flow
create rect start 120 100 160 60 #4a90d9 in node1
create text caption 155 135 "开始" in node1
set caption fill white
move node1 0 50
undo
tree flow
save node.svg
```

`g` 是一个不直接显示的容器。`in node1` 表示创建时就放进 node1；整体移动 node1 时，矩形和文字一起移动。移动/缩放组会递归修改所有后代的几何属性，组本身没有 x/y。`set node1 fill red` 设置的是 SVG 继承样式；已有独立 fill 的子图形仍保留自己的颜色。

已经有图形时，可用 `group pair start caption` 将它们收进新容器。按原文档顺序排列成员，新组放在最早成员原位置；跨父容器也遵循这一规则。`addto flow pair` 将已有图形移入另一个容器。`ungroup pair` 把嵌套组的孩子提升一层；课程规定直接位于 svg 下的顶层组不能解散。

同级节点越后绘制越靠前。`front start` 把矩形放到同级最前面，可能遮住文字；`back start` 则放到底部。这只调整同级顺序。

## 5. 跑完整案例

先 `exit` 离开编辑器，回到 PowerShell。不要在 `svg>` 里输入 PowerShell 命令。

```powershell
./svg-cli.cmd --script examples/01-first-drawing.svgcli
./svg-cli.cmd --script examples/02-flowchart.svgcli
./svg-cli.cmd --script examples/03-status-board.svgcli
./svg-cli.cmd --script examples/04-floor-plan.svgcli
```

每次执行都是一个新会话，SVG 输出在当前目录。依次打开 `first-drawing.svg`、`flowchart.svg`、`status-board.svg`、`floor-plan.svg`。预期效果也保存在 `examples/expected/`。

| 案例 | 你可以验收什么 |
|---|---|
| 第一张图 | 创建、描边、移动、undo/redo |
| 两节点流程图 | 课程案例；嵌套 g、节点移动后撤销、中文标题更新 |
| 任务看板（额外） | 六种类型、分组收编、缩放重做、解组、前后图层 |
| 工作室平面图（额外） | 小数坐标、跨组归属、删除子树后恢复 |

把自己的命令存成 UTF-8 的 `.svgcli` 文件即可重复运行。默认在首个错误处停止，进程退出码为 1；调试时附加 `--keep-going` 会继续后续命令，但仍以 1 退出。脚本里的路径仍相对于终端工作目录。

## 6. 读回、继续编辑和路径

```powershell
./svg-cli.cmd
```

```text
read flowchart.svg
show process-label
set process-label text "处理完成"
save
save "我的流程图.svg"
exit
```

`save` 无参数会使用最近一次成功 read/save 的路径；init 会清除该路径。含空格的路径和文字用双引号：`read "D:\My drawings\scene.svg"`。双引号内可用 `\"` 表示引号、`\\` 表示反斜杠；普通 Windows 路径中的单个反斜杠可直接写。文本可以为空：`set process-label text ""`。

外部 SVG 缺 ID 时会自动分配，并输出 `warning: assigned id rect1 to unnamed <rect>`。重复 ID 则拒绝读入。支持的 SVG 子集、大小限制和不支持的属性见 [工程说明](README.md)。若文件带有 transform、style、path 等特性，read 会明确报错；不要假定任意设计软件导出的 SVG 都能编辑。

## 7. 出错怎么办

| 提示 | 处理 |
|---|---|
| no document | 先 init 或 read |
| id already exists | 给新图形换一个唯一 ID |
| no such shape/container | 用 tree 检查 ID、大小写及容器归属 |
| unknown attribute | 查白名单；宽度叫 width，不是 w |
| scale factor must be positive | 缩放倍数必须大于 0 |
| cannot read/write file | 检查路径、写入权限和父目录是否存在 |
| unknown shape type: box | box 属后续插件阶段，本阶段只支持六种内建类型 |
| Windows 无法运行程序 | 本包适用 Windows 10/11 x64；不是 ARM64 原生包 |

编辑命令不会自动保存。关闭程序前先 save；本阶段没有自动恢复会话功能。验证包的 SHA256 可在 PowerShell 执行 `Get-FileHash ./svg-cli-版本号-win-x64.zip -Algorithm SHA256`，与同一 Release 的 `SHA256SUMS.txt` 比对。
