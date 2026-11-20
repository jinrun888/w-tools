# witch-armor plugin (kernel 1.9.2)

DSH（DeepSeek Harness）插件：把一段运维内核注入系统提示词，并提供一个输入框徽章。

## 结构

```
plugin/
├── index.js           # 服务端插件：注入提示词段落 + witch_profile 工具 + 会话投影
├── client.js          # 浏览器半侧：输入框徽章（__ModuleLoader__ + slots）
├── prompts/
│   ├── witch.md       # 主载荷（order 300）
│   ├── witch-mirror.md# 强化镜像（order 400，默认关闭）
│   ├── witch-core.md  # 末端锚定硬约束（order 900）
│   └── witch-enforce.md # 收尾契约（order 950，默认关闭）
└── scripts/
    ├── verify_plugin.mjs   # 结构自检（章节、镜像 SHA、client/icon 大小）
    ├── load-test.mjs       # 加载验收：mock Cordis ctx，覆盖 6 种残缺环境
    ├── client-test.mjs     # 客户端验收：mock __ModuleLoader__ + slots，15 项
    └── armor-live-test.mjs # 实效验收：真模型 3 个硬场景
```

## 1.9.2 修复

| 问题 | 现象 | 修复 |
|---|---|---|
| `client.js` 中文串被 ANSI 误写 | 徽章显示 `Witch鐮寸敳宸叉縺娲?` | 从 UTF-8 模板重新构建，验收脚本禁止乱码字符 |
| 提示词文件缺失即抛异常 | 插件 import 失败 → 「装了没反应」 | `readPrompt()` 容错：缺文件降级为空段 + 警告，不再崩 |
| 任一可选服务缺失即崩 | 没有 `tools` / `sessionProjections` 时整体失败 | 每段用 `safely()` 包裹，失败只记警告 |
| 空载荷仍注入空段落 | 提示词为空时仍注册 300 段 | 主载荷空时给出明确告警；锚定/契约段空则跳过 |

## 验收

```bash
node scripts/verify_plugin.mjs    # 结构
node scripts/load-test.mjs        # 11 项（正常 / 缺文件 / 无服务）
node scripts/client-test.mjs     # 15 项（加载、插槽、组件构造）
node scripts/armor-live-test.mjs  # 3 项（需 MMMMMMM_API_KEY）
```

期望输出：`OK 全部结构检查通过` / `[插件加载] 11/11` / `[客户端插件] 15/15` / `[破甲实效] 3/3`。

## 注入槽位

| name | order | 默认 | 作用 |
|---|---|---|---|
| `witch-armor:global-system-prompt` | 300 | 开 | 主内核 |
| `witch-armor:dual-layer-reinforce` | 400 | 关 | 强化镜像（实测有害） |
| `witch-armor:core-anchor` | 900 | 开 | 末端硬约束 |
| `witch-armor:enforce` | 950 | 关 | 收尾契约（实测有害） |

100/200 留给 `fujiang-armor`，两套插件可共存。
