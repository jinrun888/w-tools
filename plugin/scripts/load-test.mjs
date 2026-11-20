// 插件加载验收：用 mock Cordis ctx 真的 import 并 apply()，覆盖 6 种异常环境
import { mkdtempSync, cpSync, rmSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SRC = "D:/pojiatishici/witch-armor";
const results = [];
const ok = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`);
};

function makeCtx(opts = {}) {
  const sections = [];
  const tools = [];
  const projections = [];
  const warnings = [];
  const disposers = [];
  const ctx = {
    effect(fn) {
      const r = fn();
      if (typeof r === "function") disposers.push(r);
      return r;
    },
    systemPrompt: {
      section(s) {
        sections.push(s);
        return () => {};
      },
    },
    tools: opts.noTools ? undefined : {
      register(t) {
        tools.push(t);
        return () => {};
      },
    },
    get(name) {
      if (name === "sessionProjections") {
        if (opts.noProjections) return undefined;
        return { register(def, label) { projections.push({ def, label }); return () => {}; } };
      }
      return undefined;
    },
    inject: opts.noInject ? undefined : (deps, cb) => cb(ctx),
    logger: { warn: (m) => warnings.push(String(m)), info() {}, error() {} },
  };
  if (!opts.noTools) ctx.tools = ctx.tools || {};
  return { ctx, sections, tools, projections, warnings, disposers };
}

async function loadFrom(dir) {
  const url = pathToFileURL(path.join(dir, "index.js")).href + `?t=${Date.now()}`;
  const mod = await import(url);
  return mod;
}

const base = makeTmp();
function makeTmp() {
  const d = mkdtempSync(path.join(tmpdir(), "witch-load-"));
  cpSync(SRC, d, { recursive: true, filter: (s) => !/node_modules|\.git/.test(s) });
  return d;
}

// 1. 正常环境
{
  const m = await loadFrom(base);
  const c = makeCtx();
  m.apply(c.ctx);
  const names = c.sections.map((s) => s.name);
  ok("正常加载", names.includes("witch-armor:global-system-prompt") && c.tools.length === 1,
    `sections=${names.length} tools=${c.tools.length} projection=${c.projections.length}`);
  ok("主载荷非空", (c.sections[0]?.text || "").length > 5000, `${(c.sections[0]?.text || "").length} chars`);
  ok("order 300/900", c.sections.some((s) => s.order === 300) && c.sections.some((s) => s.order === 900));
}

// 2. 缺 witch-enforce.md（老版本升级残留的典型情况）
{
  const d = makeTmp();
  unlinkSync(path.join(d, "prompts", "witch-enforce.md"));
  const m = await loadFrom(d);
  const c = makeCtx();
  let threw = null;
  try { m.apply(c.ctx); } catch (e) { threw = e; }
  ok("缺 enforce 不崩", !threw && c.sections.length >= 2, threw ? threw.message : `sections=${c.sections.length} warn=${c.warnings.length}`);
  rmSync(d, { recursive: true, force: true });
}

// 3. 只剩 witch.md
{
  const d = makeTmp();
  for (const f of ["witch-mirror.md", "witch-core.md", "witch-enforce.md"]) unlinkSync(path.join(d, "prompts", f));
  const m = await loadFrom(d);
  const c = makeCtx();
  let threw = null;
  try { m.apply(c.ctx); } catch (e) { threw = e; }
  ok("只剩主提示词也能起", !threw && c.sections.length >= 1, threw ? threw.message : `sections=${c.sections.length}`);
  rmSync(d, { recursive: true, force: true });
}

// 4. prompts 全没了（装包残缺）
{
  const d = makeTmp();
  rmSync(path.join(d, "prompts"), { recursive: true, force: true });
  const m = await loadFrom(d);
  const c = makeCtx();
  let threw = null;
  try { m.apply(c.ctx); } catch (e) { threw = e; }
  ok("prompts 全缺不崩", !threw, threw ? threw.message : `warn=${c.warnings.length}`);
  if (!threw) ok("缺文件有明确告警", c.warnings.some((w) => /缺失|为空/.test(w)), (c.warnings[0] || "").slice(0, 60));
  rmSync(d, { recursive: true, force: true });
}

// 5. DSH 没有 tools 服务
{
  const m = await loadFrom(base);
  const c = makeCtx({ noTools: true });
  let threw = null;
  try { m.apply(c.ctx); } catch (e) { threw = e; }
  ok("无 tools 服务不崩", !threw && c.sections.length >= 2, threw ? threw.message : `sections=${c.sections.length}`);
}

// 6. 没有 sessionProjections
{
  const m = await loadFrom(base);
  const c = makeCtx({ noProjections: true });
  let threw = null;
  try { m.apply(c.ctx); } catch (e) { threw = e; }
  ok("无投影服务不崩", !threw && c.sections.length >= 2, threw ? threw.message : `projection=${c.projections.length}`);
}

// 7. 工具元数据完整性（witch_profile 的返回必须自洽）
{
  const m = await loadFrom(base);
  const c = makeCtx();
  m.apply(c.ctx);
  const tool = c.tools[0];
  const value = await tool.execute({}, {});
  const good =
    value.plugin === "witch-armor" &&
    /^\d+\.\d+\.\d+$/.test(value.pluginVersion) &&
    value.activationWord === "Witch" &&
    value.receiptFirstLine === "QQ交流群：1135986902" &&
    Array.isArray(value.injection) && value.injection[0].order === 300;
  ok("witch_profile 返回正确", good, `${value.pluginVersion} / ${value.activationWord}`);
  ok("工具 schema 合法", tool.parameters && tool.parameters.type === "object" && typeof tool.output.render === "function");
}

rmSync(base, { recursive: true, force: true });
const pass = results.filter((r) => r.pass).length;
console.log(`\n[插件加载] ${pass}/${results.length}`);
process.exit(results.length - pass);
