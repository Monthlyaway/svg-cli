# 命令速查

在 `svg>` 中使用；`help` 也会显示语法。带空格的参数使用双引号。

| 命令 | 语法与效果 |
|---|---|
| init | `init [w] [h]`，默认 800×600；只给 w 时 h=600 |
| read | `read <file.svg>`，成功后替换文档并记住路径 |
| save | `save [file.svg]`，无路径时使用最近成功的 read/save 路径 |
| canvas | `canvas` 查看；`canvas <w> <h>` 修改，两个尺寸必须一起给 |
| create | 下表；所有类型均支持尾缀 `in <gid>`，否则放在根级 |
| delete | `delete <id>`，删除整个子树 |
| move | `move <id> <dx> <dy>`，增量移动，容器递归作用 |
| scale | `scale <id> <factor>`，正数；位置和尺寸一起缩放，描边宽度不变 |
| set | `set <id> <attr> <value>`，只允许下表属性 |
| group | `group <newGid> <id1> [id2 ...]`，按文档顺序收编，禁止祖先/子孙同时选中 |
| ungroup | `ungroup <gid>`，只允许嵌套组；子节点占据原组位置 |
| addto | `addto <gid> <id>`，移入容器末尾，禁止循环嵌套 |
| front/back | `front <id>` / `back <id>`，同级绘制顺序最后/最先 |
| tree | `tree [id]`，全文档或子树，内联几何与样式 |
| show | `show <id>`，属性与父容器明细 |
| undo/redo | `undo` / `redo`，一条编辑一个单位，最多保留 100 个单位 |
| help/exit | `help` 显示语法；`exit` 退出（请先 save） |

| type | create 的 ID 后参数 | 可 set 的几何属性 |
|---|---|---|
| rect | `x y w h [fill]` | x y width height |
| circle | `cx cy r [fill]` | cx cy r |
| ellipse | `cx cy rx ry [fill]` | cx cy rx ry |
| line | `x1 y1 x2 y2 [stroke]` | x1 y1 x2 y2 |
| text | `x y "content"` | x y；另有 text 修改内容 |
| g | 无参数 | 无几何属性，递归 move/scale |

全部类型支持 fill / stroke / stroke-width。组样式使用 SVG 原生继承，不强制覆盖子节点的独立样式。paint 支持命名色、十六进制、rgb/rgba/hsl/hsla，不支持 URL 引用。缺省 fill/stroke 不写入 SVG，由浏览器默认值决定。

成功的 init/read/save/canvas 改尺寸建立历史屏障；失败命令不影响任何状态。tree/show/help/canvas 查询不影响历史。undo 后新编辑会清空 redo。

批量入口：`./svg-cli.cmd --script file.svgcli [--keep-going]`。也支持标准输入流、`--help` 和 `--version`。EOF 或 Ctrl+C 均可结束交互。
