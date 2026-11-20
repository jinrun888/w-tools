(() => {
  try {
    /* Witch破甲 (witch-armor) client half — badge + avatar */
    window.__ModuleLoader__.load({
      id: "witch-armor",
      factory: (require) => {
        var module = { exports: {} };
        var exports = module.exports;
        Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

        var react = require("react");

        var inject = ["slots"];

        // 96×96 透明底 PNG 内联（浏览器沙箱读不到本地文件，只能 data URI）
        var AVATAR = "data:image/png;base64,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";

        var ANIM_CSS =
          "@keyframes witchArmorPulse{0%,100%{box-shadow:0 0 2px rgba(111,134,214,.55);opacity:1}50%{box-shadow:0 0 14px rgba(111,134,214,1);opacity:.62}}" +
          "@keyframes witchArmorFlash{0%{transform:scale(1)}30%{transform:scale(1.1)}100%{transform:scale(1)}}";

        var WRAP_STYLE = {
          display: "flex",
          justifyContent: "center",
          width: "100%"
        };
        var BADGE_STYLE = {
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          width: "fit-content",
          padding: "2px 10px 2px 3px",
          borderRadius: "999px",
          border: "1px solid rgba(111, 134, 214, 0.45)",
          background: "rgba(59, 74, 140, 0.16)",
          color: "inherit",
          fontSize: "11px",
          lineHeight: "16px",
          fontFamily: "inherit",
          userSelect: "none",
          whiteSpace: "nowrap"
        };
        var AVATAR_STYLE = {
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          objectFit: "cover",
          flex: "none",
          background: "rgba(168, 184, 240, 0.18)",
          boxShadow: "0 0 0 1px rgba(168,184,240,.35)"
        };
        var DOT_STYLE = {
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "#10b981",
          flex: "none",
          marginLeft: "2px"
        };
        var FLASH_MS = 2500;

        function WitchDock(props) {
          var useProjection = props.useProjection;
          var armor = typeof useProjection === "function"
            ? useProjection("witch-armor")
            : undefined;

          var lastVerdictRef = react.useRef(null);
          var flashUntilRef = react.useRef(0);
          var tickPair = react.useState(0);
          var setTick = tickPair[1];

          react.useEffect(function () {
            var styleEl = null;
            if (!document.getElementById("witch-armor-css")) {
              styleEl = document.createElement("style");
              styleEl.id = "witch-armor-css";
              styleEl.textContent = ANIM_CSS;
              document.head.appendChild(styleEl);
            }
            return function () { if (styleEl) styleEl.remove(); };
          }, []);

          react.useEffect(function () {
            var v = armor && armor.verdict ? armor.verdict : null;
            if (v !== lastVerdictRef.current) {
              lastVerdictRef.current = v;
              if (v) flashUntilRef.current = Date.now() + FLASH_MS;
              setTick(Date.now());
            }
          }, [armor]);

          var running = !!(armor && armor.running);
          var words = armor && Array.isArray(armor.words) ? armor.words : [];
          var risk = armor && Array.isArray(armor.risk) ? armor.risk : [];
          var domain = armor && armor.domain ? armor.domain : null;
          var showVerdict = !running && lastVerdictRef.current !== null &&
            Date.now() < flashUntilRef.current;

          var text = "Witch破甲已激活";
          var dotStyle = Object.assign({}, DOT_STYLE);
          var badgeStyle = Object.assign({}, BADGE_STYLE);

          if (running) {
            dotStyle.animation = "witchArmorPulse 1.2s ease-in-out infinite";
            text = "执行中…";
          } else if (showVerdict) {
            if (lastVerdictRef.current === "pass") {
              text = "✓ 通过" + (domain ? " · " + domain : "") + (risk.length ? " · 载荷x" + risk.length : "");
              badgeStyle.animation = "witchArmorFlash 1.2s ease";
            } else {
              text = "✗ " + (words[0] || "触发安全拒绝");
              badgeStyle.animation = "witchArmorFlash 1.6s ease";
              badgeStyle.borderColor = "rgba(239, 68, 68, 0.5)";
              badgeStyle.background = "rgba(239, 68, 68, 0.12)";
              dotStyle.background = "#ef4444";
            }
          }

          return react.createElement(
            "div",
            { style: WRAP_STYLE },
            react.createElement(
              "div",
              {
                style: badgeStyle,
                "data-armor": "on",
                "data-plugin": "witch-armor",
                title: "Witch破甲已激活 · 激活词 Witch"
              },
              react.createElement("img", { src: AVATAR, alt: "", style: AVATAR_STYLE }),
              react.createElement("span", null, text),
              react.createElement("span", { style: dotStyle })
            )
          );
        }

        function apply(ctx) {
          ctx.slots.inject("conversation.input.dock", () =>
            ctx.slots.register({
              name: "conversation.input.dock",
              id: "witch-armor:badge",
              order: 40
            }, WitchDock)
          );
        }

        exports.name = "witch-armor";
        exports.inject = inject;
        exports.apply = apply;
        return module.exports;
      }
    });
  } catch (err) {
    console.warn("[AI Client Sandbox] witch-armor runtime error:", err);
  }
})();
