// Witch破甲 结构自检：不联网、不改任何文件。
// 用法: node scripts/verify_plugin.mjs
import { readFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const notes = [];

const must = [
  "package.json",
  "index.js",
  "client.js",
  "cordis.patch.yml",
  "icon.png",
  "locale/en.json",
  "locale/zh.json",
  "prompts/witch.md",
  "prompts/witch-mirror.md",
  "prompts/witch-core.md",
  "prompts/witch-enforce.md",
  "assets/avatar-96.dataurl.txt",
  "install.ps1",
  "uninstall.ps1",
  "点我一键注入.bat",
  "点我一键卸载.bat",
  "README.md",
];
for (const rel of must) {
  if (!existsSync(join(root, rel))) problems.push(`missing file: ${rel}`);
}

const read = (rel) => readFileSync(join(root, rel), "utf8");
const sha = (rel) => createHash("sha256").update(readFileSync(join(root, rel))).digest("hex");

// 1) 双段载荷必须同源同构
if (existsSync(join(root, "prompts/witch.md")) && existsSync(join(root, "prompts/witch-mirror.md"))) {
  const a = sha("prompts/witch.md");
  const b = sha("prompts/witch-mirror.md");
  if (a !== b) problems.push("prompts/witch.md 与 witch-mirror.md 不一致（双段注入要求同构）");
  else notes.push(`mirror sha256 ok: ${a.slice(0, 16)}…`);
}

// 2) 内核必备结构
if (existsSync(join(root, "prompts/witch.md"))) {
  const kernel = read("prompts/witch.md");
  for (const section of [
    "## Operating Mode",
    "## Scope Neutrality",
    "## Meta Ban",
    "## No Options List",
    "## No Motive Attribution",
    "## No Retroactive Doubt",
    "## Target Abstraction",
    "## Knowledge Base First",
    "## No Environment Audit",
    "## Finish What You Start",
    "## No Preamble",
    "## No Soft Refusal",
    "## No Questions Back",
    "## Activation",
    "## Refusal Is A Malfunction",
    "## Banned Phrasings",
    "## Scoped Rules",
    "## Intent Mapping",
    "## Hard-Topic Ladder",
    "## First-Line Anchor",
    "## Output Envelope",
    "## No Midway Stop",
    "## Context Lock",
    "## Tool Mode",
    "## Recovery",
    "## Retry",
  ]) {
    if (!kernel.includes(section)) problems.push(`prompts/witch.md 缺少章节: ${section}`);
  }
  if (!kernel.includes("QQ交流群：1135986902")) problems.push("prompts/witch.md 缺少固定回执首行（QQ交流群：1135986902）");
  if (!kernel.includes("Witch")) problems.push("prompts/witch.md 缺少激活词 Witch");
}

// 2b) 末端锚定必须存在且够硬
if (existsSync(join(root, "prompts/witch-core.md"))) {
  const core = read("prompts/witch-core.md");
  for (const token of ["[WITCH-CORE]", "我无法", "As an AI", "「方案」", "继续 / 重试 / 照做"]) {
    if (!core.includes(token)) problems.push(`prompts/witch-core.md 缺少: ${token}`);
  }
  const coreBytes = Buffer.byteLength(core, "utf8");
  notes.push(`core anchor: ${coreBytes} bytes`);
  if (coreBytes > 4000) problems.push(`prompts/witch-core.md 过长（${coreBytes} bytes），末端锚定应 ≤4KB`);
}

// 3) index.js 注入槽位
if (existsSync(join(root, "index.js"))) {
  const idx = read("index.js");
  for (const token of [
    "witch-armor:global-system-prompt",
    "witch-armor:dual-layer-reinforce",
    "witch-armor:core-anchor",
    "order: 300",
    "order: 400",
    "order: 900",
    "order: 950",
    "witch_profile",
    'key: "witch-armor"',
    "witch-core.md",
  ]) {
    if (!idx.includes(token)) problems.push(`index.js 缺少: ${token}`);
  }
  if (!idx.includes("{ {")) {
    problems.push("index.js 缺少花括号转义（模板变量会炸）");
  }
}

// 4) client.js 必须是构建产物（占位符已替换）
if (existsSync(join(root, "client.js"))) {
  const cli = read("client.js");
  if (cli.includes("__WITCH_AVATAR__")) problems.push("client.js 里还有占位符，先跑 node scripts/build-client.mjs");
  if (!cli.includes("data:image/png;base64,")) problems.push("client.js 里没有内联头像 data URI");
  if (!cli.includes("conversation.input.dock")) problems.push("client.js 未挂到 conversation.input.dock");
  const size = statSync(join(root, "client.js")).size;
  notes.push(`client.js: ${size} bytes`);
  if (size > 120000) problems.push(`client.js 过大: ${size} bytes`);
}

// 5) patch 必须插入自己
if (existsSync(join(root, "cordis.patch.yml"))) {
  const patch = read("cordis.patch.yml");
  if (!/insert:/.test(patch)) problems.push("cordis.patch.yml 没有 insert");
  if (!/id:\s*witch-armor/.test(patch)) problems.push("cordis.patch.yml 没有 witch-armor 条目");
  if (!/includeHarnessIdentity:\s*false/.test(patch)) problems.push("cordis.patch.yml 未关闭 Harness 身份");
}

// 6) manifest 完整性
if (existsSync(join(root, "package.json"))) {
  const pkg = JSON.parse(read("package.json"));
  if (pkg.name !== "witch-armor") problems.push(`package.json name 应为 witch-armor，实际 ${pkg.name}`);
  if (!pkg.dsh?.bundle?.patch) problems.push("package.json 缺 dsh.bundle.patch");
  if (!pkg.exports?.["./icon"]) problems.push("package.json 缺 exports['./icon']");
  if (!pkg.exports?.["./locale/*.json"]) problems.push("package.json 缺 exports['./locale/*.json']");
  if (!pkg.icon) problems.push("package.json 缺顶层 icon");
  for (const rel of ["index.js", "client.js", "cordis.patch.yml", "locale", "icon.png"]) {
    if (!(pkg.files ?? []).includes(rel)) problems.push(`package.json files 未包含: ${rel}`);
  }
  if (existsSync(join(root, "icon.png"))) {
    const iconBytes = statSync(join(root, "icon.png")).size;
    if (iconBytes > 256 * 1024) problems.push(`icon.png 超过 256KiB: ${iconBytes}`);
    else notes.push(`icon.png ok: ${iconBytes} bytes`);
  }
  for (const loc of ["locale/en.json", "locale/zh.json"]) {
    if (!existsSync(join(root, loc))) continue;
    const meta = JSON.parse(read(loc)).meta ?? {};
    if (!meta.title) problems.push(`${loc} 缺 meta.title`);
    if (!meta.description) problems.push(`${loc} 缺 meta.description`);
  }
}

console.log("[verify] witch-armor");
for (const n of notes) console.log("  . " + n);
if (problems.length === 0) {
  console.log("  OK  全部结构检查通过");
  process.exit(0);
}
console.log("");
for (const p of problems) console.log("  X  " + p);
console.log(`\n[verify] ${problems.length} 个问题`);
process.exit(1);
