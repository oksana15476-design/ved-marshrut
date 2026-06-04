/* Tweaks-панель для ВЭД-агрегатора.
   Главная страница на vanilla JS; здесь — отдельный React-root только для панели.
   Изменения применяются через CSS-переменные и window.__setLayout. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "cards",
  "accent": ["#00C281", "#009E69", "#DDF7EE"],
  "brand": ["#1652F0", "#0E3BC0", "#E6EDFE"],
  "radius": 16,
  "showTopBadge": true
}/*EDITMODE-END*/;

function TweaksApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const r = document.documentElement.style;
    // layout
    if (window.__setLayout) window.__setLayout(t.layout);
    // accent (CTA / "деньги")
    if (Array.isArray(t.accent)) {
      r.setProperty("--accent", t.accent[0]);
      r.setProperty("--accent-700", t.accent[1]);
      r.setProperty("--accent-100", t.accent[2]);
    }
    // brand (основной)
    if (Array.isArray(t.brand)) {
      r.setProperty("--brand", t.brand[0]);
      r.setProperty("--brand-700", t.brand[1]);
      r.setProperty("--brand-100", t.brand[2]);
    }
    // corner radius
    r.setProperty("--radius", t.radius + "px");
    r.setProperty("--radius-sm", Math.max(6, t.radius - 5) + "px");
    r.setProperty("--radius-lg", (t.radius + 8) + "px");
    // top badge visibility
    document.body.classList.toggle("hide-top-badge", !t.showTopBadge);
  }, [t]);

  return (
    <TweaksPanel>
      <TweakSection label="Блок сравнения" />
      <TweakRadio
        label="Вид"
        value={t.layout}
        options={[{ value: "table", label: "Таблица" }, { value: "cards", label: "Карточки" }]}
        onChange={(v) => setTweak("layout", v)}
      />
      <TweakToggle
        label="Бейдж «Топ выбор»"
        value={t.showTopBadge}
        onChange={(v) => setTweak("showTopBadge", v)}
      />

      <TweakSection label="Цвета" />
      <TweakColor
        label="Акцент (кнопки)"
        value={t.accent}
        options={[
          ["#00C281", "#009E69", "#DDF7EE"],
          ["#1652F0", "#0E3BC0", "#E6EDFE"],
          ["#FF8A00", "#C96A00", "#FFF1DE"],
          ["#7A3CF0", "#5A23C0", "#EFE7FD"]
        ]}
        onChange={(v) => setTweak("accent", v)}
      />
      <TweakColor
        label="Основной"
        value={t.brand}
        options={[
          ["#1652F0", "#0E3BC0", "#E6EDFE"],
          ["#0B1530", "#000814", "#E4E9F2"],
          ["#0E9F6E", "#067A53", "#DDF7EE"],
          ["#7A3CF0", "#5A23C0", "#EFE7FD"]
        ]}
        onChange={(v) => setTweak("brand", v)}
      />

      <TweakSection label="Форма" />
      <TweakSlider
        label="Скругление углов"
        value={t.radius}
        min={4}
        max={26}
        unit="px"
        onChange={(v) => setTweak("radius", v)}
      />
    </TweaksPanel>
  );
}

(function mountTweaks() {
  const host = document.createElement("div");
  host.id = "tweaks-root";
  document.body.appendChild(host);
  ReactDOM.createRoot(host).render(<TweaksApp />);
})();
