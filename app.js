/* LAB PVGAS Services – UI */
(function () {
  "use strict";
  const C = window.LabCalc, D = window.LabDocs, SEED = window.LabSeed, esc = D.esc;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clone = o => JSON.parse(JSON.stringify(o));
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const PUNITS = Object.keys(C.UNITS);
  // Hãng phổ biến cho thiết bị áp suất / nhiệt độ, xếp theo mức độ phổ biến (sổ chọn nhanh)
  const MAKERS = ["Rosemount", "Yokogawa", "Endress+Hauser", "ABB", "Siemens", "Honeywell", "WIKA", "Foxboro", "Fuji Electric", "Azbil",
    "Krohne", "VEGA", "Ashcroft", "SOR", "Druck", "United Electric Controls", "Barksdale", "Danfoss", "Dwyer", "Nagano Keiki"];
  const OTHER = "__other";

  /* ---------- storage (never throws) ---------- */
  const store = {
    get(k, def) { try { const v = localStorage.getItem("lab." + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem("lab." + k, JSON.stringify(v)); return true; } catch (e) { toast("Không lưu được vào bộ nhớ máy"); return false; } }
  };
  function deepMerge(base, over) { const o = clone(base); for (const k in over || {}) o[k] = (over[k] && typeof over[k] === "object" && !Array.isArray(over[k]) && base[k]) ? deepMerge(base[k], over[k]) : over[k]; return o; }
  let settings = deepMerge(SEED.settings, store.get("settings", {}));
  let stands = store.get("stands", null) || clone(SEED.stands);
  let records = store.get("records", []);
  let names = store.get("names", []);
  let rec = store.get("current", null) || newRecord("PT");
  let lastPdf = null;

  function newRecord(type) {
    const st = settings[type];
    return {
      id: "r" + Date.now().toString(36), type, certNo: "", certAuto: true, ptAuto: true,
      h: {
        location: "GPP", locMode: "list", locFree: "", custFree: "", makerSel: "", tag: "", description: type === "PT" ? "Pressure Transmitter" : "Pressure Switch", model: "", serial: "", maker: "",
        min: "", max: "", unit: type === "PT" ? "psi" : "psi", acc: type === "PT" ? 0.25 : 1, calDate: todayISO(), issueDate: todayISO(),
        procedure: st.procedure, env: st.env, stand1: "", stand2: type === "PT" ? (stands.find(s => s.kind === "e") || {}).id || "" : "",
        pset: "", unitPset: "kPa", psType: "As Found", micro: "NC", dirQTG: "Rising", resolution: 0, note: ""
      },
      pt: { points: ["", "", "", "", ""], rise: ["", "", "", "", ""], fall: ["", "", "", "", ""] },
      ps: { high: ["", "", "", "", ""], low: ["", "", "", "", ""] },
      sig: { inspector: "", controller: "" }, saved: false
    };
  }

  /* ---------- helpers ---------- */
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("on"), 2200); }
  const num = v => (v === "" || v == null) ? NaN : Number(String(v).replace(",", "."));
  const standById = id => stands.find(s => s.id === id);
  function locInfo(code) { const l = SEED.locations.find(x => x[0] === code) || [code, code, "", "", ""]; return { code: l[0], locVN: l[1], locEN: l[2], custVN: l[3], custEN: l[4] }; }
  function recLoc() {
    const h = rec.h;
    if (h.locMode === "free") return { code: "", locVN: h.locFree || "", locEN: "", custVN: h.custFree || "", custEN: "" };
    return locInfo(h.location);
  }
  function makerSel(h) { return h.makerSel || (MAKERS.includes(h.maker) ? h.maker : (h.maker ? OTHER : "")); }
  function yy() { const d = D.toDate(rec.h.calDate) || new Date(); return String(d.getFullYear()).slice(2); }
  function autoCertNo() {
    const pre = `${settings[rec.type].prefix}.${yy()}.`;
    let max = 0;
    records.forEach(r => { if (r.id !== rec.id && r.certNo && r.certNo.startsWith(pre)) { const n = parseInt(r.certNo.slice(pre.length), 10); if (n > max) max = n; } });
    return pre + String(max + 1).padStart(4, "0");
  }
  function getPath(o, p) { return p.split(".").reduce((a, k) => a == null ? a : a[k], o); }
  function setPath(o, p, v) { const ks = p.split("."); const last = ks.pop(); const t = ks.reduce((a, k) => a[k], o); t[last] = v; }
  function isExpired(s, dateISO) { return !s || !s.due || (dateISO || todayISO()) > s.due; }

  /* ---------- compute + validate ---------- */
  function compute() {
    const h = rec.h, out = { errors: [], warns: [], res: null };
    const s1 = standById(h.stand1), s2 = standById(h.stand2);
    if (!h.tag) out.errors.push("Chưa nhập Tag");
    if (!s1) out.errors.push("Chưa chọn chuẩn áp suất (Stand1)");
    if (settings.warnExpired && s1 && isExpired(s1, h.calDate)) out.warns.push(`Chuẩn ${s1.key} (S/N ${s1.serial}) hết hạn ${s1.due} – trước ngày hiệu chuẩn`);
    if (s1 && !isFinite(C.factor(s1.unit, rec.type === "PT" ? h.unit : h.unitPset))) out.errors.push(`Không đổi được đơn vị ${s1.unit} → ${rec.type === "PT" ? h.unit : h.unitPset}`);
    if (!rec.sig.inspector) out.warns.push("Chưa nhập Kiểm định viên");
    if (!rec.sig.controller) out.warns.push("Chưa nhập Người kiểm soát");
    try {
      if (rec.type === "PT") {
        if (!s2) out.errors.push("Chưa chọn chuẩn điện (Stand2)");
        if (settings.warnExpired && s2 && isExpired(s2, h.calDate)) out.warns.push(`Chuẩn ${s2.key} hết hạn ${s2.due} – trước ngày hiệu chuẩn`);
        const mn = num(h.min), mx = num(h.max), acc = num(h.acc);
        if (!(mx > mn)) out.errors.push("Phạm vi đo chưa hợp lệ (Max > Min)");
        if (!(acc > 0)) out.errors.push("Chưa nhập độ chính xác %FS");
        const P = rec.pt.points.map(num), R = rec.pt.rise.map(num), F = rec.pt.fall.map(num);
        if (P.some(isNaN)) out.errors.push("Thiếu áp suất chuẩn ở điểm đo");
        if (R.some(isNaN)) out.errors.push("Thiếu số đọc chiều Tăng");
        if (F.some(isNaN)) out.errors.push("Thiếu số đọc chiều Giảm");
        if (s1 && mx > mn) { const f = C.factor(s1.unit, h.unit); if (Math.max(...P.filter(isFinite)) > s1.max * f * 1.0000001 || Math.min(...P.filter(isFinite)) < s1.min * f - 1e-9) out.warns.push("Điểm đo nằm ngoài phạm vi chuẩn Stand1"); }
        if (!/Transmitter$/.test(h.description)) out.warns.push("Mẫu PT chỉ áp dụng ngõ ra 4–20 mA (Transmitter)");
        if (!out.errors.length) out.res = C.calcPT({ min: mn, max: mx, unit: h.unit, acc, points: P, rise: R, fall: F, stand1: { ...s1, deadweight: s1.name === "Deadweight Tester" }, stand2: s2 });
      } else {
        const pset = num(h.pset), acc = num(h.acc);
        if (!(pset > 0 || pset < 0)) out.errors.push("Chưa nhập Pset");
        if (!(acc > 0)) out.errors.push("Chưa nhập độ chính xác % Pset");
        const H = rec.ps.high.map(num), L = rec.ps.low.map(num);
        if (H.some(isNaN)) out.errors.push("Thiếu số đọc P.High (tăng áp)");
        if (L.some(isNaN)) out.errors.push("Thiếu số đọc P.Low (giảm áp)");
        if (!out.errors.length) {
          out.res = C.calcPS({ pset, unitPset: h.unitPset, acc, high: H, low: L, stand1: { ...s1, deadweight: s1.name === "Deadweight Tester" }, resolution: num(h.resolution) || 0 });
          if (h.dirQTG && h.dirQTG !== out.res.dir) out.warns.push(`QTG ghi ${h.dirQTG} nhưng số liệu cho thấy công tắc tác động chiều ${out.res.dir} (công thức Excel tự chọn theo độ lệch nhỏ hơn)`);
        }
      }
    } catch (e) { out.errors.push("Lỗi tính: " + e.message); }
    if (out.res && ((out.res.UmaxText && out.res.UmaxText.flag) || (out.res.Utext && out.res.Utext.flag))) out.warns.push("U rất nhỏ: Excel sẽ in 0, app làm tròn lên 4 số lẻ");
    return out;
  }

  /* ---------- render: entry ---------- */
  const TYPES = [["PT", "PT / DPT", "Transmitter áp suất"], ["PS", "PS / DPS", "Công tắc áp suất"], ["TT", "TT", "Transmitter nhiệt"], ["PG", "PG", "Đồng hồ áp suất"], ["TG", "TG", "Đồng hồ nhiệt"], ["RTD", "RTD", "Nhiệt điện trở"], ["TC", "TC", "Cặp nhiệt"], ["DPG", "DPG", "Đồng hồ chênh áp"], ["TS", "TS", "Công tắc nhiệt"]];
  function fld(label, path, opt = {}) {
    const v = getPath(rec, path); const id = "f_" + path.replace(/\./g, "_");
    let ctl;
    if (opt.options) ctl = `<select id="${id}" data-p="${path}">${opt.options.map(o => { const [val, txt] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}"${String(val) === String(v) ? " selected" : ""}>${esc(txt)}</option>`; }).join("")}</select>`;
    else ctl = `<input id="${id}" data-p="${path}" value="${esc(v)}" ${opt.type ? `type="${opt.type}"` : ""} ${opt.num ? 'inputmode="decimal"' : ""} ${opt.list ? `list="${opt.list}"` : ""} placeholder="${esc(opt.ph || "")}" autocomplete="off">`;
    if (opt.sign) ctl = `<div class="pm">${ctl}<button type="button" class="pmb" data-neg="${path}" aria-label="Đổi dấu">±</button></div>`;
    return `<label class="f${opt.wide ? " wide" : ""}"><span>${label}</span>${ctl}</label>`;
  }
  function standOptions(kind) {
    return [["", "— chọn —"]].concat(stands.filter(s => s.kind === kind).map(s => [s.id, `${s.key} · S/N ${s.serial}`]));
  }
  function renderEntry() {
    const h = rec.h, PT = rec.type === "PT";
    h.makerSel = makerSel(h);
    const types = TYPES.map(([k, t, d]) => `<button class="chip${rec.type === k ? " on" : ""}" data-type="${k}" ${["PT", "PS"].includes(k) ? "" : "disabled"}><b>${t}</b><small>${["PT", "PS"].includes(k) ? d : "sắp có"}</small></button>`).join("");
    const locOpts = SEED.locations.map(l => [l[0], `${l[0]} – ${l[1]}`]);
    const descOpts = PT ? ["Pressure Transmitter", "Differential Pressure Transmitter"] : ["Pressure Switch", "Differential Pressure Switch"];
    const dev = `
      <div class="grid">
        <div class="f wide"><span>Địa điểm</span><div class="seg"><button data-loc="list" class="${h.locMode !== "free" ? "on" : ""}">Công trình khí (chọn sẵn)</button><button data-loc="free" class="${h.locMode === "free" ? "on" : ""}">Địa điểm 2 (gõ tay)</button></div></div>
        ${h.locMode === "free"
          ? fld("Địa điểm 2 – nơi lắp đặt", "h.locFree", { wide: 1, ph: "Theo gói thầu, VD: Giàn …" }) + fld("Cơ sở sử dụng (Customer)", "h.custFree", { wide: 1, ph: "Tên đơn vị sử dụng in trên chứng chỉ" })
          : fld("Địa điểm công trình khí", "h.location", { options: locOpts, wide: 1 })}
        ${fld("Số chứng chỉ", "certNo", { ph: autoCertNo() })}
        ${fld("Tag", "h.tag", { ph: PT ? "PT-1430A" : "PDSH-1106" })}
        ${fld("Mô tả (Description)", "h.description", { options: descOpts })}
        ${fld("Kiểu / Model", "h.model")}
        ${fld("Số serial", "h.serial")}
        ${fld("Hãng sản xuất", "h.makerSel", { options: [["", "— chọn hãng —"], [OTHER, "KHÁC (nhập tay)"]].concat(MAKERS) })}
        ${makerSel(h) === OTHER ? fld("Hãng (nhập tay)", "h.maker") : ""}
        ${fld(PT ? "Độ chính xác (±%FS)" : "Độ chính xác (±% Pset)", "h.acc", { num: 1 })}
        ${fld(PT ? "Phạm vi đo – Min" : "Dải làm việc – Min", "h.min", { num: 1, sign: 1 })}
        ${fld(PT ? "Phạm vi đo – Max" : "Dải làm việc – Max", "h.max", { num: 1, sign: 1 })}
        ${fld("Đơn vị phạm vi", "h.unit", { options: PUNITS })}
        ${PT ? "" : fld("Pset (giá trị đặt)", "h.pset", { num: 1 }) + fld("Đơn vị Pset", "h.unitPset", { options: PUNITS }) +
        fld("Loại (Type)", "h.psType", { options: ["As Found", "As Left"] }) + fld("Microswitch", "h.micro", { options: ["NC", "NO"] }) +
        fld("Chiều tác động ghi trên QTG", "h.dirQTG", { options: ["Rising", "Falling"] }) + fld("Độ chia nhỏ nhất thước đặt mức", "h.resolution", { num: 1 })}
        ${fld("Ngày hiệu chuẩn", "h.calDate", { type: "date" })}
        ${fld("Phương pháp", "h.procedure")}
        ${fld("Điều kiện môi trường", "h.env", { wide: 1 })}
      </div>`;
    const std = `<div class="grid">
        ${fld("Chuẩn áp suất (Stand1)", "h.stand1", { options: standOptions("p"), wide: 1 })}
        ${PT ? fld("Chuẩn điện (Stand2)", "h.stand2", { options: standOptions("e"), wide: 1 }) : ""}
        <div class="hint wide">Đã hiệu chỉnh áp suất: <b>Yes</b> (số đọc chuẩn dùng trực tiếp như mọi chứng chỉ 2024). Đường "No" cần bảng Stand Correct – chưa có số liệu hiệu lực.</div>
      </div>`;
    let pts;
    if (PT) {
      const rows = rec.pt.points.map((x, i) => {
        const ideal = (num(h.max) > num(h.min) && isFinite(num(x))) ? (4 + 16 * (num(x) - num(h.min)) / (num(h.max) - num(h.min))).toFixed(3) : "";
        return `<tr><td class="n">${i + 1}</td><td><div class="pm"><input data-p="pt.points.${i}" inputmode="decimal" value="${esc(x)}"><button type="button" class="pmb sm" data-neg="pt.points.${i}" aria-label="Đổi dấu">±</button></div></td><td class="mut">${ideal}</td>
          <td><input data-p="pt.rise.${i}" inputmode="decimal" value="${esc(rec.pt.rise[i])}" placeholder="mA"></td>
          <td><input data-p="pt.fall.${i}" inputmode="decimal" value="${esc(rec.pt.fall[i])}" placeholder="mA"></td></tr>`;
      }).join("");
      pts = `<table class="entry"><thead><tr><th>#</th><th>AS chuẩn<br>${esc(h.unit)}</th><th>mA lý tưởng</th><th>Tăng ↑<br>mA</th><th>Giảm ↓<br>mA</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="btns"><button class="btn" data-act="pts">Điểm 0-25-50-75-100%</button><button class="btn pri" data-act="sync">⇅ Đồng bộ Tăng / Giảm</button></div>`;
    } else {
      const rows = rec.ps.high.map((v, i) => `<tr><td class="n">${i + 1}</td><td><input data-p="ps.high.${i}" inputmode="decimal" value="${esc(v)}"></td><td><input data-p="ps.low.${i}" inputmode="decimal" value="${esc(rec.ps.low[i])}"></td></tr>`).join("");
      pts = `<table class="entry"><thead><tr><th>Lần</th><th>P.High – tăng áp ↑<br>${esc(h.unitPset)}</th><th>P.Low – giảm áp ↓<br>${esc(h.unitPset)}</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="btns"><button class="btn pri" data-act="copy1">Lần 2–5 = Lần 1</button></div>`;
    }
    const sig = `<div class="grid">
        ${fld("Kiểm định viên (Người thực hiện)", "sig.inspector", { list: "names" })}
        ${fld("Người kiểm soát (Người kiểm tra)", "sig.controller", { list: "names" })}
        ${fld("Ngày cấp chứng chỉ", "h.issueDate", { type: "date" })}
        ${fld("Ghi chú QTG", "h.note", { wide: 1 })}
        <div class="hint wide">Trang 1 chứng chỉ ký: ${esc(settings.sig1Title)} <b>${esc(settings.sig1Name)}</b> và ${esc(settings.sig2Title)} <b>${esc(settings.sig2Name)}</b> (đổi trong Cài đặt).</div>
      </div><datalist id="names">${names.map(n => `<option value="${esc(n)}">`).join("")}</datalist>`;
    $("#v-entry").innerHTML = `
      <div class="card"><h2><i>1</i> Loại thiết bị</h2><div class="chips">${types}</div></div>
      <div class="card"><h2><i>2</i> Thông tin thiết bị <small>(phần ghi tay trên QTG)</small></h2>${dev}</div>
      <div class="card"><h2><i>3</i> Chuẩn sử dụng</h2>${std}</div>
      <div class="card"><h2><i>4</i> Số liệu đo ${PT ? "lên / xuống" : "5 lần"}</h2>${pts}</div>
      <div class="card"><h2><i>5</i> Kết quả & ĐKĐBĐ</h2><div id="result"></div></div>
      <div class="card"><h2><i>6</i> Ký tên & xuất hồ sơ</h2>${sig}
        <div class="btns"><button class="btn pri" data-act="save">Lưu hồ sơ</button><button class="btn" data-act="new">Hồ sơ mới</button></div>
        <div class="btns"><button class="btn pri" data-pdf="cert">Chứng chỉ PDF</button><button class="btn" data-pdf="qtg">QTG + Bảng tính PDF</button><button class="btn" data-pdf="all">Trọn bộ PDF</button><button class="btn" data-act="preview">Xem trước</button></div>
        <div id="pdfout"></div></div>
      <div id="preview"></div>`;
    if (!rec.certNo) rec.certNo = autoCertNo();
    $("#f_certNo").value = rec.certNo;
    renderResult();
  }

  function renderResult() {
    const c = compute(), el = $("#result"); if (!el) return;
    const msgs = c.errors.map(e => `<li class="bad">${esc(e)}</li>`).join("") + c.warns.map(e => `<li class="warn">${esc(e)}</li>`).join("");
    let body = "";
    const r = c.res;
    if (r && rec.type === "PT") {
      body = `<div class="verdict ${r.pass ? "ok" : "ko"}">${r.pass ? "ĐẠT (Pass)" : "KHÔNG ĐẠT (Fail)"}<small>U<sub>exp-max</sub> = ${r.UmaxText.text} ${esc(rec.h.unit)} · y = ${r.a.toFixed(3)} + ${r.b.toFixed(3)} x</small></div>
        <table class="mini"><thead><tr><th>AS</th><th>mA lý tưởng</th><th>SHC ↑</th><th>SHC ↓</th><th>U (${esc(rec.h.unit)})</th></tr></thead><tbody>
        ${r.rows.map(x => `<tr><td>${x.x}</td><td>${x.ideal.toFixed(3)}</td><td class="${Math.abs(x.shcR) > r.limI ? "bad" : ""}">${x.shcR.toFixed(3)}</td><td class="${Math.abs(x.shcF) > r.limI ? "bad" : ""}">${x.shcF.toFixed(3)}</td><td>${C.roundUnc(x.U).text}</td></tr>`).join("")}</tbody></table>
        <details><summary>Bảng tính chi tiết cho Quality Checker</summary><div class="qc">
          <div>Giới hạn: U ≤ ${r.limU.toPrecision(6)} ${esc(rec.h.unit)} (${r.checks.uOK ? "OK" : "VƯỢT"}) · |SHC| ≤ ${r.limI.toPrecision(4)} mA (${r.checks.iOK ? "OK" : "VƯỢT"})</div>
          <div>Sy=${r.Sy.toPrecision(6)} · Sa=${r.Sa.toPrecision(6)} · Sb=${r.Sb.toPrecision(6)} · r=${r.r.toPrecision(6)} · uv=${r.uv.toPrecision(6)}% · E12=${r.E12.toPrecision(6)}%</div>
          <div>Uexp chưa làm tròn: ${r.rows.map(x => x.U.toPrecision(8)).join(" · ")}</div>
          <div>Bản đầy đủ có trong PDF "QTG + Bảng tính".</div></div></details>`;
    } else if (r) {
      body = `<div class="verdict ${r.pass ? "ok" : "ko"}">${r.pass ? "ĐẠT (Pass)" : "KHÔNG ĐẠT (Fail)"}<small>U = ${r.Utext.text} ${esc(rec.h.unitPset)} · tác động chiều ${r.dir}</small></div>
        <table class="mini"><thead><tr><th>Lần</th><th>Set</th><th>Reset</th><th>Set-dev</th><th>Reset-dev</th></tr></thead><tbody>
        ${r.set.map((v, i) => `<tr><td>${i + 1}</td><td>${v}</td><td>${r.reset[i]}</td><td>${r.setDev[i].toFixed(3)}</td><td>${r.resetDev[i].toFixed(3)}</td></tr>`).join("")}</tbody></table>
        <details><summary>Bảng tính chi tiết cho Quality Checker</summary><div class="qc">
          <div>uA mở=${r.F26.toPrecision(6)} · uA đóng=${r.F27.toPrecision(6)} · uB chuẩn=${r.F31.toPrecision(6)} · uB phân giải=${r.F32}</div>
          <div>U chưa làm tròn = ${r.U.toPrecision(8)} · max|Set-dev| + U = ${r.J42.toPrecision(6)} ≤ ${r.K42.toPrecision(6)} ?</div>
          <div>Bản đầy đủ có trong PDF "QTG + Bảng tính".</div></div></details>`;
    }
    el.innerHTML = (msgs ? `<ul class="msgs">${msgs}</ul>` : "") + (body || `<p class="mut">Nhập đủ thông tin để xem kết quả.</p>`);
  }

  /* ---------- events: entry ---------- */
  function onInput(e) {
    const p = e.target.dataset.p; if (!p) return;
    setPath(rec, p, e.target.value);
    if (p === "certNo") rec.certAuto = false;
    if (p === "h.makerSel") { rec.h.maker = e.target.value === OTHER ? "" : e.target.value; renderEntry(); if (e.target.value === OTHER) focusPath("h.maker"); persistCurrent(); return; }
    if (p.startsWith("pt.points")) rec.ptAuto = false;
    if (rec.type === "PT" && (p === "h.min" || p === "h.max") && rec.ptAuto) { genPoints(); renderEntry(); focusPath(p); }
    else if (p === "h.unit" || p === "h.unitPset" || p === "h.description" || p === "h.calDate") {
      if (p === "h.calDate" && rec.certAuto) rec.certNo = autoCertNo();
      renderEntry(); focusPath(p);
    } else renderResult();
    if (p.startsWith("pt.points") || p === "h.min" || p === "h.max") updateIdeal();
    persistCurrent();
  }
  function focusPath(p) { const el = $(`[data-p="${p}"]`); if (el && el.type !== "date" && el.tagName !== "SELECT") { el.focus(); try { const l = el.value.length; el.setSelectionRange(l, l); } catch (e) { } } }
  function updateIdeal() {
    if (rec.type !== "PT") return;
    $$("table.entry tbody tr").forEach((tr, i) => { const x = num(rec.pt.points[i]), mn = num(rec.h.min), mx = num(rec.h.max); tr.children[2].textContent = (mx > mn && isFinite(x)) ? (4 + 16 * (x - mn) / (mx - mn)).toFixed(3) : ""; });
  }
  function genPoints() {
    const mn = num(rec.h.min), mx = num(rec.h.max); if (!(mx > mn)) return;
    rec.pt.points = [0, 1, 2, 3, 4].map(k => String(C.xround((mx - mn) / 4 * k + mn, 6)));  // QTG!D23 = (G23-C23)/4*k + C23
  }
  // Một nút đồng bộ: điền ô trống từ chiều còn lại; nếu không có ô trống thì gán Giảm = Tăng.
  function syncRF() {
    const R = rec.pt.rise, F = rec.pt.fall; let filled = 0;
    for (let i = 0; i < R.length; i++) {
      const r = String(R[i]).trim(), f = String(F[i]).trim();
      if (r && !f) { F[i] = r; filled++; } else if (f && !r) { R[i] = f; filled++; }
    }
    if (!filled) { rec.pt.fall = R.slice(); toast("Đã đồng bộ: Giảm = Tăng"); } else toast(`Đã điền ${filled} ô từ chiều còn lại`);
    renderEntry();
  }
  let persistT;
  function persistCurrent() { clearTimeout(persistT); persistT = setTimeout(() => store.set("current", rec), 300); }

  function onClick(e) {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.loc) { rec.h.locMode = b.dataset.loc; renderEntry(); persistCurrent(); return; }
    if (b.dataset.neg) {
      const inp = $(`[data-p="${b.dataset.neg}"]`); let v = String(inp.value || "").trim();
      v = v.startsWith("-") ? v.slice(1) : "-" + v; inp.value = v === "-" ? "-" : v;
      onInput({ target: inp }); const n = $(`[data-p="${b.dataset.neg}"]`); if (n) n.focus(); return;
    }
    if (b.dataset.type) {
      if (b.dataset.type === rec.type) return;
      const keep = { location: rec.h.location, locMode: rec.h.locMode, locFree: rec.h.locFree, custFree: rec.h.custFree, calDate: rec.h.calDate, issueDate: rec.h.issueDate };
      const sig = rec.sig; rec = newRecord(b.dataset.type); Object.assign(rec.h, keep); rec.sig = sig; rec.certNo = autoCertNo();
      renderEntry(); persistCurrent(); return;
    }
    const act = b.dataset.act;
    if (act === "pts") { genPoints(); rec.ptAuto = true; renderEntry(); }
    if (act === "sync") syncRF();
    if (act === "copy1") { rec.ps.high = rec.ps.high.map(() => rec.ps.high[0]); rec.ps.low = rec.ps.low.map(() => rec.ps.low[0]); renderEntry(); toast("Đã chép lần 1 cho cả 5 lần"); }
    if (act === "save") saveRecord();
    if (act === "new") { const keep = { location: rec.h.location, locMode: rec.h.locMode, locFree: rec.h.locFree, custFree: rec.h.custFree }; const sig = rec.sig; const t = rec.type; rec = newRecord(t); Object.assign(rec.h, keep); rec.sig = sig; rec.certNo = autoCertNo(); renderEntry(); persistCurrent(); window.scrollTo(0, 0); }
    if (act === "preview") renderPreview("all");
    if (b.dataset.pdf) makePdf(b.dataset.pdf);
    if (act === "share") sharePdf();
    if (act === "download") downloadPdf();
    persistCurrent();
  }

  function rememberNames() {
    [rec.sig.inspector, rec.sig.controller].forEach(n => { n = (n || "").trim(); if (n && !names.includes(n)) names.unshift(n); });
    names = names.slice(0, 30); store.set("names", names);
  }
  function saveRecord() {
    if (!rec.h.tag) { toast("Nhập Tag trước khi lưu"); return; }
    const c = compute();
    rec.saved = true; rec.updated = new Date().toISOString();
    rec.summary = c.res ? { pass: c.res.pass, U: rec.type === "PT" ? c.res.UmaxText.text : c.res.Utext.text } : null;
    const i = records.findIndex(r => r.id === rec.id);
    if (i >= 0) records[i] = clone(rec); else records.unshift(clone(rec));
    store.set("records", records); rememberNames(); toast("Đã lưu " + rec.certNo);
  }

  /* ---------- documents ---------- */
  function docInfo() {
    const c = compute();
    const s1 = standById(rec.h.stand1), s2 = standById(rec.h.stand2);
    const exp = settings.warnExpired ? [s1, rec.type === "PT" ? s2 : null].filter(Boolean).filter(s => isExpired(s, rec.h.calDate)) : [];
    return { c, info: { stand1: s1, stand2: s2, loc: recLoc(), draft: exp.length ? "CHUẨN HẾT HẠN, CẦN CẬP NHẬT" : (c.warns.some(w => w.startsWith("Chưa nhập")) ? "CHƯA ĐỦ CHỮ KÝ" : "") } };
  }
  function pagesHtml(which) {
    const { c, info } = docInfo();
    if (!c.res) { toast(c.errors[0] || "Chưa đủ số liệu"); return null; }
    const a = [];
    if (which === "cert" || which === "all") a.push(D.certPage1(rec, c.res, settings, info), D.certPage2(rec, c.res, settings, info));
    if (which === "qtg" || which === "all") a.push(D.qtgPage(rec, c.res, settings, info), D.uncPage(rec, c.res, settings, info));
    return a.join("");
  }
  function renderPreview(which) {
    const html = pagesHtml(which); if (!html) return;
    const el = $("#preview"); el.innerHTML = `<div class="card"><h2>Xem trước</h2><div class="pv"><div class="pv-in">${html}</div></div></div>`;
    fitPreview(); el.scrollIntoView({ behavior: "smooth" });
  }
  function fitPreview() { const pv = $(".pv"); if (!pv) return; const s = Math.min(1, (pv.clientWidth - 2) / 794); const inn = $(".pv-in"); inn.style.transform = `scale(${s})`; pv.style.height = (inn.scrollHeight * s) + "px"; }
  window.addEventListener("resize", fitPreview);

  async function makePdf(which) {
    const html = pagesHtml(which); if (!html) return;
    const out = $("#pdfout"); out.innerHTML = `<p class="mut">Đang tạo PDF…</p>`;
    const host = $("#render"); host.innerHTML = html;
    try {
      await Promise.all($$("img", host).map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
      const pages = $$("section.a4", host);
      for (let i = 0; i < pages.length; i++) {
        const cv = await html2canvas(pages[i], { scale: 2, backgroundColor: "#ffffff", logging: false, width: 794, height: 1123, windowWidth: 794 });
        if (i) pdf.addPage();
        pdf.addImage(cv.toDataURL("image/jpeg", 0.82), "JPEG", 0, 0, 210, 297);
      }
      const label = { cert: "ChungChi", qtg: "QTG_BangTinh", all: "HoSo" }[which];
      const name = `${label}_${(rec.certNo || "").replace(/[^\w.-]+/g, "_")}_${(rec.h.tag || "").replace(/[^\w.-]+/g, "_")}.pdf`;
      lastPdf = { blob: pdf.output("blob"), name };
      out.innerHTML = `<div class="pdfready"><b>${esc(name)}</b><span class="mut">${(lastPdf.blob.size / 1024).toFixed(0)} KB</span>
        <div class="btns"><button class="btn pri" data-act="share">Chia sẻ / Lưu vào Tệp</button><button class="btn" data-act="download">Mở / Tải xuống</button></div></div>`;
    } catch (e) { out.innerHTML = `<p class="bad">Không tạo được PDF: ${esc(e.message)}</p>`; }
    host.innerHTML = "";
  }
  async function sharePdf() {
    if (!lastPdf) return;
    const file = new File([lastPdf.blob], lastPdf.name, { type: "application/pdf" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: lastPdf.name }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    downloadPdf();
  }
  function downloadPdf() {
    if (!lastPdf) return;
    const url = URL.createObjectURL(lastPdf.blob); const a = document.createElement("a");
    a.href = url; a.download = lastPdf.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  /* ---------- records tab ---------- */
  function renderRecords() {
    const q = ($("#rq") && $("#rq").value || "").toLowerCase();
    const list = records.filter(r => !q || [r.h.tag, r.certNo, r.h.model, r.h.location, r.h.locFree].join(" ").toLowerCase().includes(q));
    $("#v-records").innerHTML = `<div class="card"><h2>Hồ sơ đã lưu <small>(${records.length})</small></h2>
      <input id="rq" placeholder="Tìm tag, số chứng chỉ, model…" value="${esc(q)}">
      <div class="btns"><button class="btn" data-r="csv">Xuất danh mục CSV</button><button class="btn" data-r="backup">Sao lưu JSON</button><label class="btn">Nhập JSON<input type="file" id="imp" accept=".json,application/json" hidden></label></div>
      ${list.length ? list.map(r => `<div class="rec"><div><b>${esc(r.h.tag)}</b> <span class="tag">${r.type}</span> ${r.summary ? `<span class="${r.summary.pass ? "ok" : "bad"}">${r.summary.pass ? "Pass" : "Fail"}</span>` : ""}<br>
        <small class="mut">${esc(r.certNo)} · ${esc(r.h.calDate)} · ${esc(r.h.locMode === "free" ? r.h.locFree : r.h.location)} · U=${esc(r.summary ? r.summary.U : "—")}</small></div>
        <div class="ra"><button class="btn sm" data-r="open" data-id="${r.id}">Mở</button><button class="btn sm" data-r="dup" data-id="${r.id}">Nhân bản</button><button class="btn sm" data-r="del" data-id="${r.id}">Xoá</button></div></div>`).join("") : `<p class="mut">Chưa có hồ sơ.</p>`}</div>`;
    const imp = $("#imp"); if (imp) imp.onchange = importJson;
    const rq = $("#rq"); rq.oninput = () => { const pos = rq.selectionStart; renderRecords(); const n = $("#rq"); n.focus(); n.setSelectionRange(pos, pos); };
  }
  function onRecordsClick(e) {
    const b = e.target.closest("button[data-r]"); if (!b) return;
    const r = records.find(x => x.id === b.dataset.id);
    if (b.dataset.r === "open" && r) { rec = clone(r); persistCurrent(); go("entry"); }
    if (b.dataset.r === "dup" && r) {
      rec = clone(r); rec.id = "r" + Date.now().toString(36); rec.saved = false; rec.summary = null; rec.h.tag = ""; rec.h.serial = "";
      rec.pt = { points: r.pt.points.slice(), rise: ["", "", "", "", ""], fall: ["", "", "", "", ""] }; rec.ps = { high: ["", "", "", "", ""], low: ["", "", "", "", ""] };
      rec.certNo = autoCertNo(); rec.certAuto = true; persistCurrent(); go("entry"); toast("Đã nhân bản – nhập tag và số đọc mới");
    }
    if (b.dataset.r === "del" && r) {
      if (b.dataset.armed) { records = records.filter(x => x.id !== r.id); store.set("records", records); renderRecords(); toast("Đã xoá"); }
      else { b.dataset.armed = 1; b.textContent = "Xoá thật?"; b.classList.add("danger"); setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = "Xoá"; b.classList.remove("danger"); } }, 3000); }
    }
    if (b.dataset.r === "backup") saveFile(new Blob([JSON.stringify({ app: "lab-pvgas-services", records, stands, settings }, null, 1)], { type: "application/json" }), `LAB_PVGAS_backup_${todayISO()}.json`);
    if (b.dataset.r === "csv") {
      const head = ["Số chứng chỉ", "Loại", "Location", "Tag", "Mô tả", "Hãng", "Model", "Serial", "Min", "Max", "Đơn vị", "Pset", "Đơn vị Pset", "Độ chính xác", "Ngày HC", "U", "Kết quả", "Kiểm định viên", "Người kiểm soát"];
      const rows = records.map(r => [r.certNo, r.type, r.h.locMode === "free" ? r.h.locFree : r.h.location, r.h.tag, r.h.description, r.h.maker, r.h.model, r.h.serial, r.h.min, r.h.max, r.h.unit, r.type === "PS" ? r.h.pset : "", r.type === "PS" ? r.h.unitPset : "", r.h.acc, r.h.calDate, r.summary ? r.summary.U : "", r.summary ? (r.summary.pass ? "Đạt (Pass)" : "Không đạt (Fail)") : "", r.sig.inspector, r.sig.controller]);
      const csv = "﻿" + [head].concat(rows).map(a => a.map(v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
      saveFile(new Blob([csv], { type: "text/csv" }), `DanhMuc_${todayISO()}.csv`);
    }
  }
  async function saveFile(blob, name) {
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === "AbortError") return; } }
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function importJson(e) {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => {
      const d = JSON.parse(t); let n = 0;
      (d.records || []).forEach(r => { if (!records.some(x => x.id === r.id)) { records.push(r); n++; } });
      store.set("records", records); renderRecords(); toast(`Đã nhập ${n} hồ sơ`);
    }).catch(() => toast("File không hợp lệ"));
  }

  /* ---------- standards tab ---------- */
  let editStand = null;
  function renderStands() {
    const today = todayISO();
    const row = s => `<div class="rec"><div><b>${esc(s.key)}</b> <span class="tag">${s.kind === "p" ? "Áp suất" : "Điện"}</span> <span class="${s.due && s.due >= today ? "ok" : "bad"}">${s.due && s.due >= today ? "Còn hạn " + s.due : "Hết hạn " + (s.due || "?")}</span><br>
      <small class="mut">${esc(s.name)} · ${esc(s.maker)} ${esc(s.model)} · S/N ${esc(s.serial)} · (${s.min}÷${s.max}) ${esc(s.unit)} · U = ${s.unc} ${esc(s.uncUnit)}${s.rdg ? ` + ${s.rdg}%Rdg` : ""}</small></div>
      <div class="ra"><button class="btn sm" data-s="edit" data-id="${s.id}">Sửa</button></div></div>`;
    const form = editStand ? standForm(editStand) : "";
    $("#v-stands").innerHTML = `${form}<div class="card"><h2>Thư viện chuẩn</h2>
      <p class="hint">Số liệu lấy từ sheet "Stand Ref" năm 2024. Tất cả đã quá hạn hiệu chuẩn: cập nhật ĐKĐBĐ và ngày hết hạn theo giấy chứng nhận VMI mới trước khi xuất chứng chỉ thật.</p>
      <div class="btns"><button class="btn pri" data-s="add">Thêm chuẩn</button><button class="btn" data-s="reset">Khôi phục danh sách gốc</button></div>
      ${stands.map(row).join("")}</div>`;
  }
  function standForm(s) {
    const f = (lab, k, o = {}) => `<label class="f${o.wide ? " wide" : ""}"><span>${lab}</span>${o.options ? `<select data-k="${k}">${o.options.map(v => `<option${String(v) === String(s[k]) ? " selected" : ""}>${v}</option>`).join("")}</select>` : `<input data-k="${k}" value="${esc(s[k] == null ? "" : s[k])}" ${o.type ? `type="${o.type}"` : ""} ${o.num ? 'inputmode="decimal"' : ""}>`}</label>`;
    return `<div class="card hl"><h2>${s._new ? "Thêm chuẩn" : "Sửa chuẩn"}</h2><div class="grid" id="sf">
      ${f("Loại", "kind", { options: ["p", "e"] })}${f("Mã chọn nhanh (key)", "key")}${f("Tên thiết bị", "name", { wide: 1 })}${f("Model", "model")}${f("Serial", "serial")}${f("Hãng", "maker")}
      ${f("Min", "min", { num: 1 })}${f("Max", "max", { num: 1 })}${f("Đơn vị", "unit", { options: PUNITS.concat(["mA"]) })}
      ${f("ĐKĐBĐ (U)", "unc", { num: 1 })}${f("Đơn vị của U", "uncUnit", { options: ["%"].concat(PUNITS, ["mA"]) })}${f("% of Reading", "rdg", { num: 1 })}
      ${s.kind === "e" ? f("Phạm vi in trên chứng chỉ (Max)", "certRange", { num: 1 }) : ""}${f("Độ chính xác (text)", "accuracy")}${f("Dẫn xuất chuẩn", "trace")}${f("Hạn hiệu chuẩn", "due", { type: "date" })}
      </div><div class="btns"><button class="btn pri" data-s="save">Lưu chuẩn</button><button class="btn" data-s="cancel">Huỷ</button>${s._new ? "" : `<button class="btn" data-s="delete">Xoá chuẩn</button>`}</div></div>`;
  }
  function onStandsClick(e) {
    const b = e.target.closest("button[data-s]"); if (!b) return;
    const a = b.dataset.s;
    if (a === "edit") { editStand = clone(standById(b.dataset.id)); renderStands(); window.scrollTo(0, 0); }
    if (a === "add") { editStand = { _new: true, id: "s" + Date.now().toString(36), kind: "p", key: "", name: "", model: "", serial: "", maker: "", min: 0, max: 0, unit: "bar", unc: 0, uncUnit: "bar", rdg: 0, trace: "Viện ĐLVN (VMI)", due: "" }; renderStands(); }
    if (a === "cancel") { editStand = null; renderStands(); }
    if (a === "delete") { if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = "Xoá thật?"; return; } stands = stands.filter(s => s.id !== editStand.id); store.set("stands", stands); editStand = null; renderStands(); }
    if (a === "save") {
      $$("#sf [data-k]").forEach(i => { const k = i.dataset.k; editStand[k] = ["min", "max", "unc", "rdg", "certRange"].includes(k) ? num(i.value) || 0 : i.value; });
      if (!editStand.key) editStand.key = `${editStand.model} (${editStand.serial})`;
      const isNew = editStand._new; delete editStand._new;
      if (isNew) stands.push(editStand); else stands = stands.map(s => s.id === editStand.id ? editStand : s);
      store.set("stands", stands); editStand = null; renderStands(); toast("Đã lưu chuẩn");
    }
    if (a === "reset") { if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = "Chắc chắn khôi phục?"; return; } stands = clone(SEED.stands); store.set("stands", stands); renderStands(); toast("Đã khôi phục"); }
  }

  /* ---------- settings tab ---------- */
  function renderSettings() {
    const f = (lab, p, wide) => `<label class="f${wide ? " wide" : ""}"><span>${lab}</span><input data-sp="${p}" value="${esc(getPath(settings, p))}"></label>`;
    $("#v-settings").innerHTML = `<div class="card"><h2>Người ký trang 1 chứng chỉ</h2><div class="grid">
        ${f("Chức danh trái", "sig1Title")}${f("Tên", "sig1Name")}${f("Chức danh trái (EN)", "sig1TitleEn", 1)}
        ${f("Chức danh phải", "sig2Title")}${f("Tên", "sig2Name")}${f("Chức danh phải (EN)", "sig2TitleEn", 1)}
        ${f("Nơi cấp (dòng ngày)", "place")}${f("Chu kỳ HC (tháng)", "dueMonths")}</div></div>
      <div class="card"><h2>Tiêu đề & chân trang</h2><div class="grid">
        ${f("Dòng 1", "labLines.0", 1)}${f("Dòng 2", "labLines.1", 1)}${f("Địa chỉ", "labLines.2", 1)}${f("Điện thoại", "labLines.3", 1)}
        ${f("Watermark trang kết quả", "watermark", 1)}${f("Chân trang", "footer", 1)}
        <label class="f"><span>Cảnh báo chuẩn hết hạn</span><select data-sp="warnExpired"><option value=""${settings.warnExpired ? "" : " selected"}>Tắt (tạm thời)</option><option value="1"${settings.warnExpired ? " selected" : ""}>Bật – đóng dấu BẢN NHÁP</option></select></label>
        <label class="f"><span>In logo đầu trang</span><select data-sp="showLogo"><option value="1"${settings.showLogo ? " selected" : ""}>Có</option><option value=""${settings.showLogo ? "" : " selected"}>Không (giấy in sẵn logo)</option></select></label></div></div>
      <div class="card"><h2>Mặc định theo loại</h2><div class="grid">
        ${f("PT – Phương pháp", "PT.procedure")}${f("PT – Mã biểu mẫu ĐKĐBĐ", "PT.form")}${f("PT – Tiền tố số CC", "PT.prefix")}${f("PT – Môi trường", "PT.env", 1)}
        ${f("PS – Phương pháp", "PS.procedure")}${f("PS – Mã biểu mẫu ĐKĐBĐ", "PS.form")}${f("PS – Tiền tố số CC", "PS.prefix")}${f("PS – Môi trường", "PS.env", 1)}</div>
        <div class="btns"><button class="btn" data-t="resetset">Về mặc định</button></div></div>
      <div class="card"><h2>Tự kiểm tra công thức</h2><p class="hint">Chạy lại 2 ca thật từ file Excel 2024 và so sánh từng số.</p>
        <div class="btns"><button class="btn pri" data-t="selftest">Chạy kiểm tra</button></div><div id="stout"></div></div>
      <div class="card"><h2>Về ứng dụng</h2><p class="hint">LAB PVGAS Services · bản thử nghiệm PT/PS · chạy offline, dữ liệu chỉ lưu trên máy này (dùng Sao lưu JSON ở tab Hồ sơ).</p></div>`;
  }
  function onSettingsInput(e) {
    const p = e.target.dataset.sp; if (!p) return;
    let v = e.target.value; if (p === "showLogo" || p === "warnExpired") v = !!v; if (p === "dueMonths") v = num(v) || 12;
    const ks = p.split("."); const last = ks.pop(); const t = ks.reduce((a, k) => a[k], settings); t[last] = v;
    store.set("settings", settings);
  }
  function onSettingsClick(e) {
    const b = e.target.closest("button[data-t]"); if (!b) return;
    if (b.dataset.t === "resetset") { settings = clone(SEED.settings); store.set("settings", settings); renderSettings(); toast("Đã về mặc định"); }
    if (b.dataset.t === "selftest") $("#stout").innerHTML = selfTest();
  }
  function selfTest() {
    const st = id => clone(SEED.stands.find(s => s.id === id));
    const pt = C.calcPT({ min: 0, max: 1000, unit: "psi", acc: 0.25, points: [0, 250, 500, 750, 1000], rise: [3.998, 7.997, 11.993, 15.995, 19.997], fall: [3.998, 7.997, 11.993, 15.995, 19.997], stand1: st("700G29-6360326"), stand2: st("754-2745003") });
    const expPT = [0.37351378136145, 0.362042877135984, 0.358137606083042, 0.362042877135984, 0.37351378136145];
    const ps = C.calcPS({ pset: 103.4, unitPset: "kPa", acc: 1, high: [103.3, 103.3, 103.4, 103.4, 103.4], low: [101.2, 101.2, 101.4, 101.4, 101.4], stand1: st("700G05-6283134") });
    const line = (lab, got, exp) => { const ok = Math.abs(got - exp) <= Math.abs(exp) * 1e-9; return `<tr><td>${lab}</td><td>${Number(got).toPrecision(12)}</td><td>${exp}</td><td class="${ok ? "ok" : "bad"}">${ok ? "khớp" : "LỆCH"}</td></tr>`; };
    return `<table class="mini"><thead><tr><th>Ca</th><th>App</th><th>Excel 2024</th><th></th></tr></thead><tbody>
      ${pt.rows.map((r, i) => line(`PT-1430A Uexp điểm ${i + 1}`, r.U, expPT[i])).join("")}
      ${line("PT-1430A a", pt.a, 3.9968)}${line("PT-1430A b", pt.b, 0.0159984)}
      ${line("PDSH-1106 U", ps.U, 0.0494504483973003)}</tbody></table>
      <p class="hint">PT-1430A: ${pt.pass ? "Pass" : "Fail"}, in ${pt.UmaxText.text} psi (Excel 0.38). PDSH-1106: ${ps.pass ? "Pass" : "Fail"}, in ${ps.Utext.text} kPa (Excel 0.050).</p>`;
  }

  /* ---------- navigation ---------- */
  const VIEWS = { entry: renderEntry, records: renderRecords, stands: renderStands, settings: renderSettings };
  function go(v) {
    $$("main > section").forEach(s => s.hidden = s.id !== "v-" + v);
    $$("nav.tabs button").forEach(b => b.classList.toggle("on", b.dataset.v === v));
    VIEWS[v](); window.scrollTo(0, 0);
  }
  document.addEventListener("DOMContentLoaded", () => {
    $("nav.tabs").addEventListener("click", e => { const b = e.target.closest("button"); if (b) go(b.dataset.v); });
    $("#v-entry").addEventListener("input", onInput);
    $("#v-entry").addEventListener("change", e => { if (e.target.tagName === "SELECT" || e.target.type === "date") onInput(e); });
    $("#v-entry").addEventListener("click", onClick);
    $("#v-records").addEventListener("click", onRecordsClick);
    $("#v-stands").addEventListener("click", onStandsClick);
    $("#v-settings").addEventListener("input", onSettingsInput);
    $("#v-settings").addEventListener("change", onSettingsInput);
    $("#v-settings").addEventListener("click", onSettingsClick);
    go("entry");
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => { });
  });
})();
