// 客户端插件（client.js）验收：模拟 DSH Web 的 __ModuleLoader__ 与 slots API
import { readFileSync } from "node:fs";

const SRC = "D:/pojiatishici/witch-armor/client.js";
const code = readFileSync(SRC, "utf8");
const results = [];
const ok = (n, p, d = "") => {
  results.push({ n, p });
  console.log(`${p ? "PASS" : "FAIL"}  ${n}${d ? "  " + d : ""}`);
};

// 1. 语法可解析
let parsed = true;
try {
  new Function(code);
} catch (e) {
  parsed = false;
  console.log("  语法错误:", e.message);
}
ok("client.js 语法可解析", parsed);

// 2. 乱码检测（用户看到「Witch鐮寸敳」这类就是这里出的问题）
const bad = ["鐮", "閫", "鍐", "璇", "锛", "鈥", "鉁"].filter((c) => code.includes(c));
ok("无 UTF-8 乱码", bad.length === 0, bad.length ? "命中: " + bad.join(",") : "");
const zh = [...new Set((code.match(/[\u4e00-\u9fa5]{2,}/g) || []))];
ok("中文串正常", zh.includes("破甲已激活") || zh.some((s) => s.includes("破甲")), zh.slice(0, 4).join(" / "));

// 3. 模拟浏览器加载器
const loaded = [];
const fakeWindow = {
  __ModuleLoader__: {
    load(entry) {
      loaded.push(entry);
    },
  },
  addEventListener() {},
  document: { head: { appendChild() {} }, createElement: () => ({}) },
};
const fakeReact = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  Fragment: "Fragment",
  useState: (v) => [v, () => {}],
  useEffect: () => {},
  useMemo: (f) => f(),
  useRef: (v) => ({ current: v }),
};

let threw = null;
try {
  new Function("window", "document", "navigator", code)(fakeWindow, fakeWindow.document, { userAgent: "test" });
} catch (e) {
  threw = e;
}
ok("执行不抛异常", !threw, threw ? threw.message.slice(0, 80) : "");
ok("调用 __ModuleLoader__.load", loaded.length === 1, loaded[0]?.id || "");

const entry = loaded[0];
if (!entry) {
  console.log("\n无法继续：未捕获到模块");
  process.exit(1);
}
ok("模块 id 正确", entry.id === "witch-armor", entry.id);

// 4. 工厂执行
let mod = null;
let factoryErr = null;
try {
  mod = entry.factory((name) => {
    if (name === "react") return fakeReact;
    throw new Error("未知依赖: " + name);
  });
} catch (e) {
  factoryErr = e;
}
ok("factory 执行成功", !factoryErr, factoryErr ? factoryErr.message.slice(0, 80) : "");

const exp = mod && (mod.default || mod);
ok("导出 apply", !!exp && typeof exp.apply === "function", exp ? Object.keys(exp).join(",") : "");
ok("inject 含 slots", Array.isArray(exp?.inject) && exp.inject.includes("slots"), (exp?.inject || []).join(","));

// 5. apply 时注册到正确的插槽
const injected = [];
const registered = [];
const ctx = {
  slots: {
    inject(slot, cb) {
      injected.push(slot);
      cb();
    },
    register(def, component) {
      registered.push({ ...def, __component: component });
      return () => {};
    },
  },
  get: () => undefined,
};
let applyErr = null;
try {
  exp.apply(ctx);
} catch (e) {
  applyErr = e;
}
ok("apply 不抛异常", !applyErr, applyErr ? applyErr.message.slice(0, 90) : "");
ok("插槽为 conversation.input.dock", injected.includes("conversation.input.dock"), injected.join(","));
ok("注册了一个 dock 组件", registered.length === 1, registered[0]?.name || "");

const def = registered[0];
if (def) {
  ok("注册带 order 与 name", typeof def.order === "number" && typeof def.name === "string", `${def.name} order=${def.order}`);
  // 6. 组件能否构造（不真正渲染，只调函数）
  let compErr = null;
  let tree = null;
  try {
    // DSH rc.5 契约：register(def, Component)，Component 是第二个参数
    const comp = registered[0].__component;
    const props = typeof def.inject === "function" ? def.inject("session-1") : {};
    tree = typeof comp === "function" ? comp({ ...props, sessionId: "session-1", useProjection: () => undefined }) : null;
  } catch (e) {
    compErr = e;
  }
  ok("组件可构造", !compErr, compErr ? compErr.message.slice(0, 90) : "");
  ok("组件返回有效节点", !!tree, tree && typeof tree === "object" ? "ok" : String(tree));
}

const pass = results.filter((r) => r.p).length;
console.log(`\n[客户端插件] ${pass}/${results.length}`);
process.exit(results.length - pass);
