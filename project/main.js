/* ВЭД-агрегатор — логика */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const AGENTS = window.AGENTS || [];
  const DICT = window.DICT || { countries: [], currencies: [] };

  /* ---------- state ---------- */
  const state = {
    type: "",      // "" | agent | bank
    country: "",
    currency: "",
    flow: "",
    amount: 0,
    sortBy: "rating",
    layout: "cards", // table | cards
    expanded: new Set(),
  };

  /* ---------- helpers ---------- */
  const fmtMoney = (n) => "$" + n.toLocaleString("ru-RU");
  const parseNum = (v) => parseInt(String(v).replace(/[^\d]/g, ""), 10) || 0;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function fillSelect(el, items, allLabel) {
    if (!el) return;
    const keep = el.querySelector("option");
    el.innerHTML = "";
    if (keep) el.appendChild(keep);
    items.forEach((i) => {
      const o = document.createElement("option");
      o.value = i; o.textContent = i;
      el.appendChild(o);
    });
  }

  /* ---------- filtering + sorting ---------- */
  function getFiltered() {
    let list = AGENTS.filter((a) => {
      if (state.type && a.type !== state.type) return false;
      if (state.country && !a.countries.includes(state.country)) return false;
      if (state.currency && !a.currencies.includes(state.currency)) return false;
      if (state.flow && !a.flow.includes(state.flow)) return false;
      if (state.amount && a.minAmount > state.amount) return false;
      return true;
    });
    const dir = {
      rating: (a, b) => b.rating - a.rating,
      commission: (a, b) => a.commissionFrom - b.commissionFrom,
      term: (a, b) => a.termDays - b.termDays,
      min: (a, b) => a.minAmount - b.minAmount,
    }[state.sortBy];
    return list.sort(dir);
  }

  /* ---------- rendering ---------- */
  function initials(name) {
    const words = name.trim().split(/\s+/);
    if (name.length <= 3) return name;
    if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  function agentLogo(a) {
    const ini = initials(a.name);
    const fs = ini.length >= 3 ? "15px" : "";
    return `<div class="agent-logo" style="background:${a.color}${fs ? ";font-size:" + fs : ""}">${esc(ini)}</div>`;
  }
  function badges(a) {
    let h = "";
    if (a.top) h += `<span class="badge badge-top">★ Топ выбор</span>`;
    if (a.verified) h += `<span class="badge badge-verified">✓ Проверен</span>`;
    return h;
  }
  function chips(items, max = 4) {
    const shown = items.slice(0, max).map((c) => `<span class="chip">${esc(c)}</span>`).join("");
    const more = items.length > max ? `<span class="chip">+${items.length - max}</span>` : "";
    return `<div class="chips">${shown}${more}</div>`;
  }

  function rowHTML(a) {
    const open = state.expanded.has(a.id) ? "open" : "";
    return `
    <div class="cmp-row ${open}" data-id="${a.id}">
      <div class="agent">
        ${agentLogo(a)}
        <div>
          <div class="agent-name">${esc(a.name)}</div>
          <div style="display:flex;gap:6px;margin-top:5px;flex-wrap:wrap">${badges(a)}</div>
          <div class="agent-meta">
            <span class="rating"><svg class="star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>${a.rating} · ${a.reviews} отзывов</span>
          </div>
        </div>
      </div>
      <div><div class="cell-big">${esc(a.commissionText)}</div><div class="cell-sub">за перевод</div></div>
      <div><div class="cell-big">${esc(a.minText)}</div><div class="cell-sub">мин. сумма</div></div>
      <div><div class="cell-big">${esc(a.termText)}</div><div class="cell-sub">ПД/SWIFT: ${esc(a.docText)}</div></div>
      <div>
        ${chips(a.currencies, 4)}
        <div style="margin-top:6px">${chips(a.countries, 3)}</div>
        <button class="expand-btn" data-expand="${a.id}" type="button">Все параметры
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>
      <div class="cmp-actions">
        <button class="btn btn-primary btn-sm" data-apply="${a.id}" type="button">Оставить заявку</button>
        <button class="btn btn-ghost btn-sm" data-expand="${a.id}" type="button">Подробнее</button>
      </div>
    </div>
    <div class="cmp-detail">
      <div class="detail-grid">
        <div class="detail-item"><div class="dt">Срок ПД / SWIFT</div><div class="dd">${esc(a.docText)}</div></div>
        <div class="detail-item"><div class="dt">Направление</div><div class="dd">${a.flow.map((f) => (f === "import" ? "Импорт" : "Экспорт")).join(" · ")}</div></div>
        <div class="detail-item"><div class="dt">Типы сделок</div><div class="dd">${esc(a.deals.join(", "))}</div></div>
        <div class="detail-item"><div class="dt">Документы</div><div class="dd">${esc(a.docs)}</div></div>
        <div class="detail-item"><div class="dt">Юрисдикции / инфраструктура</div><div class="dd">${esc(a.jurisdiction)}</div></div>
        <div class="detail-item"><div class="dt">Страны</div><div class="dd">${esc(a.countries.join(", "))}</div></div>
        <div class="detail-item"><div class="dt">Валюты</div><div class="dd">${esc(a.currencies.join(", "))}</div></div>
        <div class="detail-item"><div class="dt">Лимиты / ограничения</div><div class="dd">${esc(a.limits)}</div></div>
        <div class="detail-item"><div class="dt">Персональный менеджер</div><div class="dd ${a.manager ? "good" : "bad"}">${a.manager ? "Да" : "Нет"}</div></div>
        <div class="detail-item"><div class="dt">Валютный контроль</div><div class="dd ${a.currencyControl ? "good" : "bad"}">${a.currencyControl ? "Сопровождение есть" : "Не предоставляется"}</div></div>
        <div class="detail-item"><div class="dt">Статус проверки</div><div class="dd ${a.verified ? "good" : ""}">${esc(a.statusText)}</div></div>
        <div class="detail-item"><div class="dt">Рейтинг</div><div class="dd">${a.rating} / 5 · ${a.reviews} отзывов</div></div>
      </div>
    </div>`;
  }

  function sealHTML() {
    return `<span class="seal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>`;
  }
  function cardHTML(a) {
    const typeLabel = a.type === "bank" ? "Банк" : "Платёжный агент";
    return `
    <div class="acard" data-id="${a.id}">
      <div class="acard-head">
        <div>
          <div class="acard-kind">${typeLabel}</div>
          <div class="acard-name">${esc(a.name)}</div>
        </div>
        <div class="acard-logo-wrap">
          ${agentLogo(a)}
          ${a.verified ? sealHTML() : ""}
        </div>
      </div>
      <div class="acard-plan">«${esc(a.plan)}»</div>
      <div class="acard-stats">
        <div class="astat"><div class="av">${esc(a.commissionText)}</div><div class="al">Комиссия агента</div></div>
        <div class="astat"><div class="av">${esc(a.minText)}</div><div class="al">Минимальная сумма</div></div>
        <div class="astat"><div class="av">${esc(a.termText)}</div><div class="al">Срок платежа</div></div>
        <div class="astat"><div class="av">${esc(a.docText)}</div><div class="al">Срок ПД / SWIFT</div></div>
      </div>
      <button class="acard-btn" data-apply="${a.id}" type="button">Оставить заявку</button>
    </div>`;
  }

  function emptyHTML() {
    return `<div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <h3 style="font-size:20px;color:var(--ink);margin-bottom:6px">Под эти параметры провайдеров не нашлось</h3>
      <p>Попробуйте смягчить фильтры или оставьте заявку — подберём маршрут вручную.</p>
    </div>`;
  }

  function render() {
    const list = getFiltered();
    $("#resultCount").textContent = list.length;

    const table = $("#cmpTable");
    const cards = $("#cmpCards");
    if (state.layout === "cards") {
      table.classList.add("is-hidden");
      cards.classList.remove("is-hidden");
      cards.innerHTML = list.length ? list.map(cardHTML).join("") : emptyHTML();
    } else {
      cards.classList.add("is-hidden");
      table.classList.remove("is-hidden");
      $("#cmpBody").innerHTML = list.length ? list.map(rowHTML).join("") : emptyHTML();
    }
  }

  /* ---------- modal ---------- */
  const modal = $("#modal");
  function openModal(agentId) {
    const a = AGENTS.find((x) => x.id === agentId);
    $("#modalForm").reset();
    $("#modalForm").style.display = "";
    $("#modalOk").classList.remove("show");
    $$(".field", $("#modalForm")).forEach((f) => f.classList.remove("invalid"));
    if (a) {
      $("#modalAgent").innerHTML = `${agentLogo(a)}<div><div class="agent-name">${esc(a.name)}</div><div class="agent-meta">${esc(a.commissionText)} · ${esc(a.termText)}</div></div>`;
      $("#modalAgent").style.display = "";
    } else {
      $("#modalAgent").style.display = "none";
    }
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  /* ---------- form validation ---------- */
  function validPhone(v) { return (v.replace(/[^\d]/g, "").length >= 10); }
  function validateForm(form) {
    let ok = true;
    $$(".field", form).forEach((f) => {
      const inp = f.querySelector("input[required]");
      if (!inp) return;
      let bad = false;
      if (inp.type === "tel") bad = !validPhone(inp.value);
      else bad = !inp.value.trim();
      f.classList.toggle("invalid", bad);
      inp.classList.toggle("err", bad);
      if (bad) ok = false;
    });
    return ok;
  }

  /* ---------- events ---------- */
  function bind() {
    // selects
    fillSelect($("#fCountry"), DICT.countries);
    fillSelect($("#fCurrency"), DICT.currencies);
    fillSelect($("#flCountry"), DICT.countries);
    fillSelect($("#flCurrency"), DICT.currencies);

    // category tabs
    $$("#catTabs button").forEach((b) => b.addEventListener("click", () => {
      $$("#catTabs button").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      state.type = b.dataset.type;
      render();
    }));

    // filters
    $("#flCountry").addEventListener("change", (e) => { state.country = e.target.value; render(); });
    $("#flCurrency").addEventListener("change", (e) => { state.currency = e.target.value; render(); });
    $("#flFlow").addEventListener("change", (e) => { state.flow = e.target.value; render(); });
    $("#flAmount").addEventListener("input", (e) => { state.amount = parseNum(e.target.value); render(); });
    $("#sortBy").addEventListener("change", (e) => { state.sortBy = e.target.value; render(); });
    $("#filterReset").addEventListener("click", () => {
      state.country = state.currency = state.flow = ""; state.amount = 0;
      $("#flCountry").value = ""; $("#flCurrency").value = ""; $("#flFlow").value = ""; $("#flAmount").value = "";
      render();
    });

    // sortable headers
    $$(".cmp-head .th").forEach((th) => th.addEventListener("click", () => {
      state.sortBy = th.dataset.sort;
      $("#sortBy").value = state.sortBy;
      $$(".cmp-head .th").forEach((x) => x.classList.remove("sorted"));
      th.classList.add("sorted");
      render();
    }));

    // delegated clicks (expand / apply)
    document.addEventListener("click", (e) => {
      const exp = e.target.closest("[data-expand]");
      if (exp) {
        const id = exp.dataset.expand;
        if (state.expanded.has(id)) state.expanded.delete(id); else state.expanded.add(id);
        render();
        return;
      }
      const app = e.target.closest("[data-apply]");
      if (app) { openModal(app.dataset.apply); return; }
      if (e.target.closest("[data-close]")) { closeModal(); return; }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

    // finder bar (inline)
    $("#finder").addEventListener("submit", (e) => {
      e.preventDefault();
      state.flow = $("#fFlow").value;
      state.country = $("#fCountry").value;
      state.currency = $("#fCurrency").value;
      state.amount = parseNum($("#fAmount").value);
      // sync filter bar
      $("#flFlow").value = state.flow;
      $("#flCountry").value = state.country;
      $("#flCurrency").value = state.currency;
      $("#flAmount").value = state.amount ? state.amount.toLocaleString("ru-RU") : "";
      render();
      document.getElementById("compare").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // lead form
    $("#leadForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateForm(e.target)) return;
      e.target.style.display = "none";
      $("#leadOk").classList.add("show");
    });
    // modal form
    $("#modalForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateForm(e.target)) return;
      e.target.style.display = "none";
      $("#modalOk").classList.add("show");
    });
    // clear error on input
    document.addEventListener("input", (e) => {
      if (e.target.matches(".control.err")) { e.target.classList.remove("err"); e.target.closest(".field")?.classList.remove("invalid"); }
    });
  }

  /* ---------- tweaks hook (layout switch) ---------- */
  window.__setLayout = (v) => { state.layout = v; render(); };

  /* ---------- init ---------- */
  bind();
  render();
})();
