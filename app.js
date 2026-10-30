/* LAB PVGAS Services – UI */
(function () {
  "use strict";
  const C = window.LabCalc, C2 = window.LabCalc2, D = window.LabDocs, D2 = window.LabDocs2, SEED = window.LabSeed, esc = D.esc;
  const NEWT = ["PG", "TS", "TT", "RTD"], READY = ["PT", "PS"].concat(NEWT), TEMP = ["TS", "TT", "RTD"];
  const DESC0 = { PT: "Pressure Transmitter", PS: "Pressure Switch", PG: "Pressure Gauge", TS: "Temperature Switch", TT: "Temperature Transmitter", RTD: "Industrial Platinum Resistance Thermometer" };
  const blank = n => Array(n).fill("");
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
  // v2 (mẫu 2026): bỏ các thiết lập tiêu đề/chân trang cũ, giữ tên người ký và tuỳ chọn của người dùng
  function loadSettings() {
    let o = store.get("settings", {}) || {};
    if ((o.ver || 1) < 2) {
      const keep = {}; ["sig1Name", "sig2Name", "dueMonths", "warnExpired", "showLogo"].forEach(k => { if (k in o) keep[k] = o[k]; });
      o = keep; store.set("settings", o);
    }
    const m = deepMerge(SEED.settings, o); m.ver = SEED.settings.ver; return m;
  }
  // Danh mục chuẩn: khi đổi phiên bản seed thì thay chuẩn gốc, giữ chuẩn người dùng tự thêm (id bắt đầu bằng "s")
  function loadStands() {
    const st = store.get("stands", null), ver = store.get("standsVer", 1);
    if (!st) return clone(SEED.stands);
    if (ver < SEED.version) {
      const mine = st.filter(s => /^s[0-9a-z]+$/.test(s.id));
      const out = clone(SEED.stands).concat(mine); store.set("stands", out); store.set("standsVer", SEED.version); return out;
    }
    return st;
  }
  // Hồ sơ cũ: PS lưu P.High/P.Low -> đổi sang Set/Reset như QTG 2026
  function normalize(r) {
    if (!r) return r;
    r.h = r.h || {};
    if (r.h.envOk === undefined || r.h.envOk === true) r.h.envOk = "1";
    if (r.h.mfgYear === undefined) r.h.mfgYear = "";
    if (r.h.calPlace === undefined) r.h.calPlace = "";
    if (!r.h.psType) r.h.psType = "As Left";
    r.ps = r.ps || {};
    if (!r.ps.set) {
      const hi = r.ps.high || ["", "", "", "", ""], lo = r.ps.low || ["", "", "", "", ""], rising = r.h.dirQTG !== "Falling";
      r.ps.set = (rising ? hi : lo).slice(); r.ps.reset = (rising ? lo : hi).slice();
    }
    delete r.ps.high; delete r.ps.low;
    const b = newRecord(r.type || "PT");
    for (const k in b.h) if (r.h[k] === undefined) r.h[k] = b.h[k];
    ["pg", "ts", "tt", "rtd"].forEach(k => { if (!r[k]) r[k] = b[k]; });
    return r;
  }
  let settings = loadSettings();
  let stands = loadStands(); store.set("standsVer", SEED.version);
  let records = store.get("records", []).map(normalize);
  let names = store.get("names", []);
  let rec = normalize(store.get("current", null)) || newRecord("PT");
  let lastPdf = null;

  function newRecord(type) {
    const st = settings[type], T = TEMP.includes(type);
    return {
      id: "r" + Date.now().toString(36), type, certNo: "", certAuto: true, ptAuto: true,
      h: {
        location: "Giàn DGCP", locMode: "list", locFree: "", custFree: "", calPlace: "", makerSel: "", tag: "", description: DESC0[type], model: "", serial: "", maker: "", mfgYear: "",
        min: "", max: "", unit: T ? "°C" : (type === "PG" ? "bar" : "kPa"), acc: type === "PT" ? 0.25 : type === "PS" ? 1 : "", calDate: todayISO(), issueDate: todayISO(),
        procedure: st.procedure, env: st.env, envOk: "1", stand1: "", stand2: type === "PT" ? (stands.find(s => s.kind === "e") || {}).id || "" : "",
        pset: "", unitPset: "kPa", psType: ["PS", "TS"].includes(type) ? "As Found" : "As Left", micro: "NC", dirQTG: "Rising", resolution: 0, note: "",
        stand3: "", tset: "", scale: "", res: "", errFactor: "0.8", heightDiff: "0", verType: "Định kỳ", extCheck: "1", techCheck: "1", stamp: "", typeEN: "Spring", insul: "", sens: "0.385"
      },
      pt: { points: ["", "", "", "", ""], rise: ["", "", "", "", ""], fall: ["", "", "", "", ""] },
      ps: { set: ["", "", "", "", ""], reset: ["", "", "", "", ""] },
      pg: { std: blank(5), rise: blank(5), fall: blank(5), before: "", after: "" },
      ts: { set: blank(5), reset: blank(5) },
      tt: { nom: blank(5), sr: [0, 1, 2, 3, 4].map(() => blank(3)), sf: [0, 1, 2, 3, 4].map(() => blank(3)), dr: [0, 1, 2, 3, 4].map(() => blank(3)), df: [0, 1, 2, 3, 4].map(() => blank(3)) },
      rtd: { std: blank(6), dut: [0, 1, 2, 3, 4, 5].map(() => blank(5)) },
      sig: { inspector: "", controller: "" }, saved: false
    };
  }

  /* ---------- helpers ---------- */
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("on"), 2200); }
  const num = v => (v === "" || v == null) ? NaN : Number(String(v).replace(",", "."));
  const standById = id => stands.find(s => s.id === id);
  function locInfo(code) { const l = SEED.locations.find(x => x[0] === code) || [code, code, "", "", ""]; return { code: l[0], locVN: l[1], locEN: l[2], custVN: l[3], custEN: l[4] }; }
  function recLoc(r = rec) {
    const h = r.h;
    if (h.locMode === "free") return { code: "", locVN: h.locFree || "", locEN: "", custVN: h.custFree || "", custEN: "" };
    const l = locInfo(h.location); if (h.custFree) l.custVN = h.custFree;   // sửa Cơ sở sử dụng khi khác danh mục
    return l;
  }
  function makerSel(h) { return h.makerSel || (MAKERS.includes(h.maker) ? h.maker : (h.maker ? OTHER : "")); }
  function yy() { const d = D.toDate(rec.h.calDate) || new Date(); return String(d.getFullYear()).slice(2); }
  // PS: QTG ghi Áp suất tác động / Áp suất trả về theo chiều tác động -> P.High (tăng áp) / P.Low (giảm áp) cho sheet DLVN133
  /* Số chữ số thập phân chuẩn hiển thị được (yêu cầu 30/10/2026: số đọc chuẩn không được nhiều chữ số hơn màn hình của chuẩn).
   * Áp suất: màn hình có D chữ số (D = số chữ số phần nguyên của Max + số lẻ của độ phân giải trên GCN), giống bảng đơn vị của
   * Fluke 700G (5 chữ số, giới hạn 100 000 counts), Crystal XP2i (5) và Beamex MC6/EXT (5–6): đổi đơn vị thì số lẻ = D − số chữ số phần nguyên
   * của Max ở đơn vị đó (Max < 1 tính là 1 chữ số, như 700G02 hiện 0.0689 bar). Kết quả < 0 = chuẩn không hiển thị được đơn vị này.
   * Điện / điện trở: theo thang đo (steps = [[giới hạn thang, độ phân giải]], lấy từ bảng kết quả trên GCN). Nhiệt độ: độ phân giải °C. */
  const decOf = v => { const x = parseFloat(String(v).replace(",", ".")); return x > 0 ? Math.max(0, Math.round(-Math.log10(x))) : null; };
  const intDig = x => { x = Math.abs(x); return x < 1 ? 1 : Math.floor(Math.log10(x) + 1e-9) + 1; };
  const typedDec = v => (String(v).trim().replace(",", ".").split(".")[1] || "").replace(/[^0-9]/g, "").length;
  function standDec(s, unit, value) {
    if (!s) return null;
    if (s.dec && s.dec[unit] != null) return s.dec[unit];
    if (s.kind === "p") {
      if (s.name === "Deadweight Tester") return null;           // quả cân: áp suất tính từ khối lượng, không có màn hình
      const d0 = decOf(s.res), f = C.factor(s.unit, unit); if (d0 == null || !isFinite(f)) return null;
      const fs = Math.max(Math.abs(s.min), Math.abs(s.max));
      return intDig(fs) + d0 - intDig(fs * f);
    }
    if (s.steps && s.steps.length) { const v = Math.abs(num(value)) || 0; const st = s.steps.find(x => v <= x[0]) || s.steps[s.steps.length - 1]; return decOf(st[1]); }
    if (s.kind === "t") return unit === "°C" ? decOf(s.res) : null;
    if (s.kind === "e" || s.kind === "r") return decOf(s.res);
    return null;
  }
  // vals: chuỗi người dùng nhập; lỗi khi nhiều chữ số lẻ hơn chuẩn hiển thị (điện trở chỉ cảnh báo – xem review/stand_digits)
  function checkDec(s, unit, vals, lab, E, W) {
    if (!s) return;
    const bad = [];
    for (const v of vals.flat()) {
      if (v === "" || v == null || isNaN(num(v))) continue;
      const d = standDec(s, unit, v); if (d == null) continue;
      if (d < 0) { E.push(`${s.key} không hiển thị được đơn vị ${unit} (vượt số chữ số màn hình) – chọn đơn vị khác hoặc chuẩn khác`); return; }
      if (typedDec(v) > d) bad.push([v, d]);
    }
    if (!bad.length) return;
    const [v, d] = bad[0];
    const msg = `${lab}: "${v}"${bad.length > 1 ? ` (và ${bad.length - 1} số khác)` : ""} có ${typedDec(v)} chữ số thập phân, nhưng ${s.key} chỉ hiển thị ${d} chữ số ở đơn vị ${unit}${s.kind === "p" ? "" : " (thang đo này)"}`;
    (s.kind === "r" ? W : E).push(msg);
  }
  function decHint(list) {
    const parts = list.filter(([s]) => s).map(([s, unit, sample]) => { const d = standDec(s, unit, sample); return d == null ? `${s.key}: không giới hạn (không có màn hình / chưa có số liệu)` : d < 0 ? `${s.key}: KHÔNG hiển thị được ${unit}` : `${s.key}: tối đa ${d} chữ số thập phân (${unit}${s.steps ? ", tuỳ thang đo" : ""})`; });
    return parts.length ? `<div class="hint wide">Số đọc chuẩn – ${parts.map(esc).join(" · ")}</div>` : "";
  }
  function psHL(r) { const rising = r.h.dirQTG !== "Falling"; const S = r.ps.set.map(num), R = r.ps.reset.map(num); return rising ? { H: S, L: R } : { H: R, L: S }; }
  function autoCertNo() {
    const S0 = settings[rec.type], pg = rec.type === "PG";
    const pre = `${S0.prefix}.${yy()}${pg ? S0.series || "" : ""}.`;
    let max = 0;
    records.forEach(r => { if (r.id !== rec.id && r.certNo && r.certNo.startsWith(pre)) { const n = parseInt(r.certNo.slice(pre.length), 10); if (n > max) max = n; } });
    return pre + String(max + 1).padStart(pg ? 5 : 4, "0");
  }
  function getPath(o, p) { return p.split(".").reduce((a, k) => a == null ? a : a[k], o); }
  function setPath(o, p, v) { const ks = p.split("."); const last = ks.pop(); const t = ks.reduce((a, k) => a[k], o); t[last] = v; }
  function isExpired(s, dateISO) { return !s || !s.due || (dateISO || todayISO()) > s.due; }

  /* ---------- compute + validate ---------- */
  const curRec = () => rec;
  function compute(target) {
    const rec = target || curRec();   // hồ sơ đang nhập, hoặc hồ sơ đã lưu (bảng kiểm tra QC)
    // Hồ sơ đã lưu (danh sách QC) vẫn tính được: lỗi số chữ số thập phân chỉ thành cảnh báo
    const h = rec.h, out = { errors: [], warns: [], res: null, strict: !target };
    if (NEWT.includes(rec.type)) return computeNew(rec, out);
    const s1 = standById(h.stand1), s2 = standById(h.stand2);
    if (!h.tag) out.errors.push("Chưa nhập Tag");
    if (!s1) out.errors.push("Chưa chọn chuẩn áp suất (Stand1)");
    if (settings.warnExpired && s1 && isExpired(s1, h.calDate)) out.warns.push(`Chuẩn ${s1.key} (S/N ${s1.serial}) hết hạn ${s1.due} – trước ngày hiệu chuẩn`);
    if (s1 && s1.due && h.calDate && s1.due < h.calDate) out.warns.push(`Chuẩn ${s1.key} hết hạn ${s1.due}, trước ngày hiệu chuẩn`);
    if (h.locMode !== "free" && !recLoc(rec).custVN) out.warns.push("Địa điểm này chưa có Cơ sở sử dụng trong danh mục – nhập ở ô Cơ sở sử dụng");
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
        checkDec(s1, h.unit, rec.pt.points, "Áp suất chuẩn", out.strict ? out.errors : out.warns, out.warns);
        checkDec(s2, "mA", [rec.pt.rise, rec.pt.fall], "Số đọc mA", out.strict ? out.errors : out.warns, out.warns);
        if (R.some(isNaN)) out.errors.push("Thiếu số đọc chiều Tăng");
        if (F.some(isNaN)) out.errors.push("Thiếu số đọc chiều Giảm");
        if (s1 && mx > mn) { const f = C.factor(s1.unit, h.unit); if (Math.max(...P.filter(isFinite)) > s1.max * f * 1.0000001 || Math.min(...P.filter(isFinite)) < s1.min * f - 1e-9) out.warns.push("Điểm đo nằm ngoài phạm vi chuẩn Stand1"); }
        if (!/Transmitter$/.test(h.description)) out.warns.push("Mẫu PT chỉ áp dụng ngõ ra 4–20 mA (Transmitter)");
        if (s2 && s2.due && h.calDate && s2.due < h.calDate) out.warns.push(`Chuẩn điện ${s2.key} hết hạn ${s2.due}, trước ngày hiệu chuẩn`);
        if (!out.errors.length) out.res = C.calcPT({ min: mn, max: mx, unit: h.unit, acc, points: P, rise: R, fall: F, stand1: { ...s1, deadweight: s1.name === "Deadweight Tester" }, stand2: s2 });
      } else {
        const pset = num(h.pset), acc = num(h.acc);
        if (!(pset > 0 || pset < 0)) out.errors.push("Chưa nhập Pset");
        if (!(acc > 0)) out.errors.push("Chưa nhập độ chính xác % Pset");
        const { H, L } = psHL(rec);
        if (rec.ps.set.map(num).some(isNaN)) out.errors.push("Thiếu Áp suất tác động (Set-Pressure)");
        if (rec.ps.reset.map(num).some(isNaN)) out.errors.push("Thiếu Áp suất trả về (Reset-Pressure)");
        checkDec(s1, h.unitPset, [rec.ps.set, rec.ps.reset], "Áp suất chuẩn (Set/Reset)", out.strict ? out.errors : out.warns, out.warns);
        if (!out.errors.length) {
          out.res = C.calcPS({ pset, unitPset: h.unitPset, acc, high: H, low: L, stand1: { ...s1, deadweight: s1.name === "Deadweight Tester" }, resolution: num(h.resolution) || 0 });
          if (h.dirQTG && h.dirQTG !== out.res.dir) out.warns.push(`QTG đánh dấu ${h.dirQTG} nhưng số liệu cho thấy công tắc tác động chiều ${out.res.dir} (sheet DLVN133 ô E9 tự chọn theo độ lệch nhỏ hơn) – kiểm tra lại cột Set/Reset`);
        }
      }
    } catch (e) { out.errors.push("Lỗi tính: " + e.message); }
    if (out.res && !out.res.pass) out.warns.push("Không đạt: không cấp số chứng chỉ / số tem và không xuất chứng chỉ (quy tắc 30/10/2026)");
    return out;
  }

  // PG / TS / TT / RTD – formulas in calc2.js
  function computeNew(rec, out) {
    const h = rec.h, T = rec.type, E = out.errors, W = out.warns, ED = out.strict ? E : W;
    const s1 = standById(h.stand1), s2 = standById(h.stand2), s3 = standById(h.stand3);
    const mn = num(h.min), mx = num(h.max), acc = num(h.acc);
    const need = (s, lab) => { if (!s) E.push(`Chưa chọn ${lab}`); else if (s.due && h.calDate && s.due < h.calDate) W.push(`Chuẩn ${s.key} hết hạn ${s.due}, trước ngày hiệu chuẩn`); };
    const nums = (a, lab) => { const v = a.map(num); if (v.some(isNaN)) E.push(`Thiếu ${lab}`); return v; };
    if (!h.tag) E.push("Chưa nhập Tag");
    if (h.locMode !== "free" && !recLoc(rec).custVN) W.push("Địa điểm này chưa có Cơ sở sử dụng trong danh mục – nhập ở ô Cơ sở sử dụng");
    if (!rec.sig.inspector) W.push("Chưa nhập Kiểm định viên");
    if (!rec.sig.controller) W.push("Chưa nhập Người kiểm soát");
    if (!(acc > 0)) E.push(T === "TS" ? "Chưa nhập độ chính xác % Tset" : "Chưa nhập độ chính xác %FS");
    if (T !== "TS" && !(mx > mn)) E.push("Phạm vi đo chưa hợp lệ (Max > Min)");
    try {
      if (T === "PG") {
        need(s1, "chuẩn áp suất (Stand1)");
        if (s1 && !isFinite(C.factor(s1.unit, h.unit))) E.push(`Không đổi được đơn vị ${s1.unit} → ${h.unit}`);
        const std = nums(rec.pg.std, "áp suất chuẩn"), rise = nums(rec.pg.rise, "số đọc chiều Tăng"), fall = nums(rec.pg.fall, "số đọc chiều Giảm");
        if (!(num(h.scale) > 0)) W.push("Chưa nhập vạch chia (in trên GCN và QTG)");
        checkDec(s1, h.unit, rec.pg.std, "Áp suất chuẩn", ED, W);
        if (s1 && mx > mn && isFinite(C.factor(s1.unit, h.unit))) { const f = C.factor(s1.unit, h.unit); if (Math.max(...std.filter(isFinite)) > s1.max * f * 1.0000001) W.push("Điểm đo vượt phạm vi chuẩn Stand1"); }
        if (!E.length) {
          out.res = C2.calcPG({ min: mn, max: mx, acc, std, rise, fall, before: rec.pg.before, after: rec.pg.after });
          if (out.res.red && !out.res.red.ok) W.push("Độ sụt áp của chuẩn ≥ 5%");
          if (h.errFactor === "1.0") W.push("QTG tick hệ số sai số 1.0 nhưng Data08 không dùng hệ số này khi kết luận");
        }
      } else if (T === "TS") {
        need(s1, "nhiệt kế chuẩn / thiết bị tạo nhiệt (Stand1)");
        const tset = num(h.tset); if (isNaN(tset)) E.push("Chưa nhập nhiệt độ đặt Tset");
        const set = nums(rec.ts.set, "nhiệt độ tác động (Set)"), reset = nums(rec.ts.reset, "nhiệt độ trả về (Reset)");
        checkDec(s1, "°C", [rec.ts.set, rec.ts.reset], "Nhiệt độ chuẩn", ED, W);
        if (!E.length) out.res = C2.calcTS({ tset, acc, dir: h.dirQTG, set, reset, stand: { unc: s1.unc }, heat: s1 });
      } else if (T === "TT") {
        need(s1, "chuẩn nhiệt dải thấp (Stand1)"); need(s3, "ampe kế (Stand3)"); if (s2) need(s2, "");
        const flat = k => rec.tt[k].flat();
        nums(flat("sr"), "số đọc chuẩn chiều tăng"); nums(flat("sf"), "số đọc chuẩn chiều giảm"); nums(flat("dr"), "số đọc DUT chiều tăng"); nums(flat("df"), "số đọc DUT chiều giảm");
        [s1, s2].forEach(s => checkDec(s, "°C", [flat("sr"), flat("sf")], "Nhiệt độ chuẩn", ED, W));
        checkDec(s3, "mA", [flat("dr"), flat("df")], "Số đọc mA (ampe kế)", ED, W);
        if (!E.length) {
          const pts = rec.tt.sr.map((_, p) => ({ sr: rec.tt.sr[p].map(num), sf: rec.tt.sf[p].map(num), dr: rec.tt.dr[p].map(num), df: rec.tt.df[p].map(num) }));
          out.res = C2.calcTT({ min: mn, max: mx, acc, pts, s1, s2: s2 || s1, amm: { unc: s3.unc, uncUnit: s3.uncUnit, min: s3.min, max: s3.max, err: s3.err || 0 }, res: num(h.res) || 0 });
          if ((out.res.nM || out.res.nH) && !s2) W.push("Có điểm > 150 °C nhưng chưa chọn chuẩn dải trung/cao (Stand2) – đang dùng Stand1");
          if (!out.res.pass) W.push("Không đạt: không cấp số chứng chỉ / số tem và không xuất chứng chỉ (quy tắc 30/10/2026)");
          if (out.res.lowSingle) W.push("Dải thấp chỉ có 1 điểm: chứng chỉ không in dòng U dải thấp (như Data188)");
        }
      } else if (T === "RTD") {
        need(s1, "chuẩn nhiệt dải thấp (Stand1)"); need(s3, "thiết bị đo điện trở (Stand3)"); if (s2) need(s2, "");
        const std = nums(rec.rtd.std, "nhiệt độ chuẩn"); nums(rec.rtd.dut.flat(), "số đọc điện trở");
        [s1, s2].forEach(s => checkDec(s, "°C", rec.rtd.std, "Nhiệt độ chuẩn", ED, W));
        checkDec(s3, "Ω", rec.rtd.dut, "Số đọc điện trở", ED, W);
        const sens = num(h.sens) || 0.385;
        if (!E.length) {
          out.res = C2.calcRTD({ min: mn, max: mx, acc, sens, pts: std.map((t, i) => ({ std: t, dut: rec.rtd.dut[i].map(num) })), s1, s2: s2 || s1, meter: { unc: s3.unc, uncUnit: s3.uncUnit, max: s3.max, err: s3.err || 0 } });
          if (mx >= 140 && !s2) W.push("Max ≥ 140 °C nhưng chưa chọn chuẩn dải cao (Stand2) – đang dùng Stand1");
          if (out.res.rows.some(r => r.refSrc === "iec")) W.push("Có điểm không có trong Bảng giá trị chuẩn của file – dùng IEC 60751");
        }
      }
    } catch (e) { E.push("Lỗi tính: " + e.message); }
    return out;
  }
  // Rule 30/10/2026 §4 (PT/PS/TT): a failed instrument gets no certificate number and no certificate, not even a draft
  const NOCERT = ["PT", "PS", "TT"];
  const failed = c => NOCERT.includes(rec.type) && c.res && !c.res.pass;
  function syncCertNo(c) {
    if (!rec.certAuto && !failed(c)) return;
    if (failed(c)) { rec.certNo = ""; rec.certAuto = true; } else if (!rec.certNo) rec.certNo = autoCertNo();
    const f = $("#f_certNo"); if (f) { f.value = rec.certNo; f.placeholder = failed(c) ? "Không đạt – không cấp số" : autoCertNo(); }
  }
  function summaryU(type, r) {
    if (!r) return "";
    return type === "PT" ? D.uTxt("PT", r.Umax) : type === "PS" ? r.Utext.text : type === "PG" ? "—" : type === "TS" ? D.vn(r.Uprint, 2) : type === "TT" ? D.uTxt("TT", r.Umax) : D.vn(r.U, 2);
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
    const today = todayISO();
    return [["", "— chọn —"]].concat(stands.filter(s => s.kind === kind).map(s => [s.id, `${s.key} · S/N ${s.serial}${s.loc ? " · " + s.loc : ""}${s.due && s.due < today ? " · HẾT HẠN" : ""}`]));
  }
  function renderEntry() {
    const h = rec.h, PT = rec.type === "PT";
    h.makerSel = makerSel(h);
    const types = TYPES.map(([k, t, d]) => `<button class="chip${rec.type === k ? " on" : ""}" data-type="${k}" ${READY.includes(k) ? "" : "disabled"}><b>${t}</b><small>${READY.includes(k) ? d : "sắp có"}</small></button>`).join("");
    const locOpts = SEED.locations.map(l => [l[0], `${l[0]} – ${l[1]}`]);
    const descOpts = PT ? ["Pressure Transmitter", "Differential Pressure Transmitter"] : ["Pressure Switch", "Differential Pressure Switch"];
    const locHtml = `<div class="f wide"><span>Địa điểm</span><div class="seg"><button data-loc="list" class="${h.locMode !== "free" ? "on" : ""}">Công trình khí (chọn sẵn)</button><button data-loc="free" class="${h.locMode === "free" ? "on" : ""}">Địa điểm 2 (gõ tay)</button></div></div>
        ${h.locMode === "free"
          ? fld("Địa điểm 2 – nơi lắp đặt", "h.locFree", { wide: 1, ph: "Theo gói thầu, VD: Giàn …" }) + fld("Cơ sở sử dụng (Customer)", "h.custFree", { wide: 1, ph: "Tên đơn vị sử dụng in trên chứng chỉ" })
          : fld("Địa điểm công trình khí", "h.location", { options: locOpts, wide: 1 }) + fld("Cơ sở sử dụng (để trống = theo danh mục)", "h.custFree", { wide: 1, ph: locInfo(h.location).custVN || "Chưa có trong danh mục – nhập tay" })}
        ${fld("Địa điểm thực hiện (in trên QTG)", "h.calPlace", { ph: h.locMode === "free" ? (h.locFree || "") : h.location })}
        ${fld("Số chứng chỉ", "certNo", { ph: autoCertNo() })}`;
    let dev = `
      <div class="grid">
        ${locHtml}
        ${fld("Tag", "h.tag", { ph: PT ? "PT-1430A" : "PDSH-1106" })}
        ${fld("Mô tả (Description)", "h.description", { options: descOpts })}
        ${fld("Kiểu / Model", "h.model")}
        ${fld("Số serial", "h.serial")}
        ${fld("Hãng sản xuất", "h.makerSel", { options: [["", "— chọn hãng —"], [OTHER, "KHÁC (nhập tay)"]].concat(MAKERS) })}
        ${makerSel(h) === OTHER ? fld("Hãng (nhập tay)", "h.maker") : ""}
        ${PT ? "" : fld("Năm sản xuất", "h.mfgYear", { ph: "N/A" })}
        ${fld(PT ? "Độ chính xác (±%FS)" : "Độ chính xác (±% Pset)", "h.acc", { num: 1 })}
        ${fld(PT ? "Phạm vi đo – Min" : "Dải làm việc – Min", "h.min", { num: 1, sign: 1 })}
        ${fld(PT ? "Phạm vi đo – Max" : "Dải làm việc – Max", "h.max", { num: 1, sign: 1 })}
        ${fld("Đơn vị phạm vi", "h.unit", { options: PUNITS })}
        ${PT ? "" : fld("Pset (giá trị đặt)", "h.pset", { num: 1 }) + fld("Đơn vị Pset", "h.unitPset", { options: PUNITS }) +
        fld("Chế độ làm việc", "h.micro", { options: [["NC", "Thường đóng (NC)"], ["NO", "Thường mở (NO)"]] }) +
        fld("Chiều tác động (QTG)", "h.dirQTG", { options: [["Rising", "Chiều tăng (Rising)"], ["Falling", "Chiều giảm (Falling)"]] }) + fld("Độ chia nhỏ nhất thước đặt mức", "h.resolution", { num: 1 })}
        ${fld("Số liệu và kết quả", "h.psType", { options: [["As Found", "As Found"], ["As Left", "As Left"]] })}
        ${fld("Ngày hiệu chuẩn", "h.calDate", { type: "date" })}
        ${fld("Phương pháp", "h.procedure")}
        ${fld("Điều kiện môi trường (in chứng chỉ)", "h.env", { wide: 1 })}
        ${fld("Tick ô môi trường trên QTG", "h.envOk", { wide: 1, options: [["1", `Có – ${PT ? settings.PT.qtgTemp + ", " + settings.PT.qtgHum : settings.PS.qtgTemp + ", " + settings.PS.qtgHum}`], ["", "Không tick"]] })}
      </div>`;
    let std = `<div class="grid">
        ${fld("Chuẩn áp suất (Stand1)", "h.stand1", { options: standOptions("p"), wide: 1 })}
        ${PT ? fld("Chuẩn điện (Stand2)", "h.stand2", { options: standOptions("e"), wide: 1 }) : ""}
        <div class="hint wide">Danh mục chuẩn 2026 (sheet Stand Ref). Hiệu chỉnh áp suất: <b>Yes</b> – số đọc chuẩn dùng trực tiếp như toàn bộ hồ sơ DGCP 10/2026.</div>
        ${decHint([[standById(h.stand1), PT ? h.unit : h.unitPset], [PT ? standById(h.stand2) : null, "mA", 20]])}
      </div>`;
    let pts;
    if (PT) {
      const rows = rec.pt.points.map((x, i) => {
        const ideal = (num(h.max) > num(h.min) && isFinite(num(x))) ? (4 + 16 * (num(x) - num(h.min)) / (num(h.max) - num(h.min))).toFixed(3) : "";
        return `<tr><td class="n">${i + 1}</td><td><div class="pm"><input data-p="pt.points.${i}" inputmode="decimal" value="${esc(x)}"><button type="button" class="pmb sm" data-neg="pt.points.${i}" aria-label="Đổi dấu">±</button></div></td><td class="mut">${ideal}</td>
          <td><input data-p="pt.rise.${i}" inputmode="decimal" value="${esc(rec.pt.rise[i])}" placeholder="mA"></td>
          <td><input data-p="pt.fall.${i}" inputmode="decimal" value="${esc(rec.pt.fall[i])}" placeholder="mA"></td></tr>`;
      }).join("");
      pts = `<table class="entry"><thead><tr><th>#</th><th>Áp suất chuẩn<br>${esc(h.unit)}</th><th>mA lý tưởng</th><th>Tăng ↑<br>mA</th><th>Giảm ↓<br>mA</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="btns"><button class="btn" data-act="pts">Điểm 0-25-50-75-100%</button><button class="btn pri" data-act="sync">⇅ Đồng bộ Tăng / Giảm</button></div>`;
    } else {
      const rows = rec.ps.set.map((v, i) => `<tr><td class="n">${i + 1}</td><td><input data-p="ps.set.${i}" inputmode="decimal" value="${esc(v)}"></td><td><input data-p="ps.reset.${i}" inputmode="decimal" value="${esc(rec.ps.reset[i])}"></td></tr>`).join("");
      pts = `<p class="hint">Như QTG: chiều ${h.dirQTG === "Falling" ? "giảm (Falling) – áp suất tác động đọc khi giảm áp" : "tăng (Rising) – áp suất tác động đọc khi tăng áp"}.</p>
        <table class="entry"><thead><tr><th>TT</th><th>Áp suất tác động<br>(Set) ${esc(h.unitPset)}</th><th>Áp suất trả về<br>(Reset) ${esc(h.unitPset)}</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="btns"><button class="btn pri" data-act="copy1">Lần 2–5 = Lần 1</button></div>`;
    }
    let ptsTitle = PT ? "lên / xuống" : "5 lần";
    if (NEWT.includes(rec.type)) ({ dev, std, pts, ptsTitle } = buildNew(locHtml));
    const sig = `<div class="grid">
        ${fld("Người thực hiện (Kiểm định viên)", "sig.inspector", { list: "names" })}
        ${fld("Người soát lại / kiểm tra (Người kiểm soát)", "sig.controller", { list: "names" })}
        ${fld("Ngày cấp chứng chỉ", "h.issueDate", { type: "date" })}
        ${fld("Ghi chú QTG", "h.note", { wide: 1 })}
        <div class="hint wide">Trang 1 chứng chỉ ký: ${esc(settings.sig1Title)} <b>${esc(settings.sig1Name)}</b> và ${esc(settings.sig2Title)} <b>${esc(settings.sig2Name)}</b> (đổi trong Cài đặt).</div>
      </div><datalist id="names">${names.map(n => `<option value="${esc(n)}">`).join("")}</datalist>`;
    $("#v-entry").innerHTML = `
      <div class="card"><h2><i>1</i> Loại thiết bị</h2><div class="chips">${types}</div></div>
      <div class="card"><h2><i>2</i> Thông tin thiết bị <small>(phần ghi tay trên QTG)</small></h2>${dev}</div>
      <div class="card"><h2><i>3</i> Chuẩn sử dụng</h2>${std}</div>
      <div class="card"><h2><i>4</i> Số liệu đo ${ptsTitle}</h2>${pts}</div>
      <div class="card"><h2><i>5</i> Kết quả & ĐKĐBĐ</h2><div id="result"></div></div>
      <div class="card"><h2><i>6</i> Ký tên & xuất hồ sơ</h2>${sig}
        <div class="btns"><button class="btn pri" data-act="save">Lưu hồ sơ</button><button class="btn" data-act="new">Hồ sơ mới</button></div>
        <div class="btns"><button class="btn pri" data-pdf="cert">Chứng chỉ (2 trang)</button><button class="btn" data-pdf="qtg">Biên bản QTG</button><button class="btn" data-pdf="unc">Bảng Uncer (QC)</button><button class="btn" data-pdf="all">Trọn bộ PDF</button></div>
        <div class="btns"><button class="btn" data-act="preview">Xem trước trọn bộ</button></div>
        <div id="pdfout"></div></div>
      <div id="preview"></div>`;
    if (!rec.certNo) rec.certNo = autoCertNo();
    $("#f_certNo").value = rec.certNo;
    renderResult();   // syncCertNo blanks the number when the result fails
  }

  // Entry blocks for PG / TS / TT / RTD (fields follow the 2026 QTG forms)
  function buildNew(locHtml) {
    const h = rec.h, T = rec.type, u = T === "PG" ? h.unit : "°C";
    const S0 = settings[T];
    const yn = [["1", "Đạt (Pass)"], ["", "Không đạt (Fail)"]];
    const asf = fld("Số liệu và kết quả", "h.psType", { options: [["As Found", "As Found"], ["As Left", "As Left"]] });
    let spec = "";
    if (T === "PG") spec = fld("Năm sản xuất", "h.mfgYear", { ph: "N/A" }) + fld("Kiểu (EN, in GCN)", "h.typeEN") + fld("Độ chính xác (±%FS)", "h.acc", { num: 1 })
      + fld("Phạm vi đo – Min", "h.min", { num: 1, sign: 1 }) + fld("Phạm vi đo – Max", "h.max", { num: 1, sign: 1 }) + fld("Đơn vị", "h.unit", { options: PUNITS })
      + fld("Vạch chia (Scale interval)", "h.scale", { num: 1 }) + fld("Độ phân giải (Division)", "h.res", { num: 1 })
      + fld("Hệ số sai số cơ bản (QTG)", "h.errFactor", { options: ["0.8", "1.0"] }) + fld("Chênh lệch chiều cao (mm)", "h.heightDiff", { num: 1 })
      + fld("Chế độ kiểm định", "h.verType", { options: ["Ban đầu", "Định kỳ", "Sau sửa chữa"] }) + fld("Số tem kiểm định (trống = số GCN)", "h.stamp")
      + fld("Kiểm tra bên ngoài", "h.extCheck", { options: yn }) + fld("Kiểm tra kỹ thuật", "h.techCheck", { options: yn });
    if (T === "TS") spec = fld("Độ chính xác (±% Tset)", "h.acc", { num: 1 }) + fld("Dải làm việc – Min (°C)", "h.min", { num: 1, sign: 1 }) + fld("Dải làm việc – Max (°C)", "h.max", { num: 1, sign: 1 })
      + fld("Nhiệt độ đặt Tset (°C)", "h.tset", { num: 1, sign: 1 }) + fld("Chế độ làm việc", "h.micro", { options: [["NC", "Thường đóng (NC)"], ["NO", "Thường mở (NO)"]] })
      + fld("Chiều tác động (QTG)", "h.dirQTG", { options: [["Rising", "Chiều tăng (Rising)"], ["Falling", "Chiều giảm (Falling)"]] }) + asf;
    if (T === "TT") spec = fld("Độ chính xác (±%FS)", "h.acc", { num: 1 }) + fld("Phạm vi đo – Min (°C)", "h.min", { num: 1, sign: 1 }) + fld("Phạm vi đo – Max (°C)", "h.max", { num: 1, sign: 1 })
      + fld("Độ phân giải DUT (mA)", "h.res", { num: 1, ph: "0" }) + asf;
    if (T === "RTD") spec = fld("Năm sản xuất", "h.mfgYear") + fld("Độ chính xác (±%FS)", "h.acc", { num: 1 }) + fld("Phạm vi đo – Min (°C)", "h.min", { num: 1, sign: 1 }) + fld("Phạm vi đo – Max (°C)", "h.max", { num: 1, sign: 1 })
      + fld("Độ nhạy (Ω/°C)", "h.sens", { num: 1 }) + fld("Điện trở cách điện (MΩ)", "h.insul", { num: 1 }) + asf;
    const dev = `<div class="grid">${locHtml}
        ${fld("Tag", "h.tag")}${fld("Kiểu / Model", "h.model")}${fld("Số serial", "h.serial")}
        ${fld("Hãng sản xuất", "h.makerSel", { options: [["", "— chọn hãng —"], [OTHER, "KHÁC (nhập tay)"]].concat(MAKERS) })}
        ${makerSel(h) === OTHER ? fld("Hãng (nhập tay)", "h.maker") : ""}
        ${spec}
        ${fld(T === "PG" ? "Ngày kiểm định" : "Ngày hiệu chuẩn", "h.calDate", { type: "date" })}
        ${fld("Phương pháp", "h.procedure")}
        ${T === "PG" ? "" : fld("Điều kiện môi trường (in chứng chỉ)", "h.env", { wide: 1 })}
        ${fld("Tick ô môi trường trên QTG", "h.envOk", { wide: 1, options: [["1", `Có – ${S0.qtgTemp}, ${S0.qtgHum}`], ["", "Không tick"]] })}
      </div>`;
    let std;
    if (T === "PG") std = `<div class="grid">${fld("Chuẩn áp suất (Stand1)", "h.stand1", { options: standOptions("p"), wide: 1 })}
        <div class="hint wide">Số đọc chuẩn nhập theo đơn vị của áp kế (${esc(u)}). Kiểm định theo ĐLVN 08:2011 – không tính độ KĐBĐ.</div>${decHint([[standById(h.stand1), u]])}</div>`;
    if (T === "TS") std = `<div class="grid">${fld("Nhiệt kế chuẩn / thiết bị tạo nhiệt (Stand1)", "h.stand1", { options: standOptions("t"), wide: 1 })}
        <div class="hint wide">U của chuẩn (uch1) và độ ổn định / radial / axial của thiết bị tạo nhiệt (uch3) lấy từ thư viện chuẩn.</div>${decHint([[standById(h.stand1), "°C"]])}</div>`;
    if (T === "TT") std = `<div class="grid">${fld("Chuẩn nhiệt dải thấp ≤150 °C (Stand1)", "h.stand1", { options: standOptions("t"), wide: 1 })}
        ${fld("Chuẩn nhiệt dải trung / cao (Stand2, trống = Stand1)", "h.stand2", { options: standOptions("t"), wide: 1 })}
        ${fld("Ampe kế (Stand3)", "h.stand3", { options: standOptions("e"), wide: 1 })}${decHint([[standById(h.stand1), "°C"], [standById(h.stand2), "°C"], [standById(h.stand3), "mA", 20]])}</div>`;
    if (T === "RTD") std = `<div class="grid">${fld("Chuẩn nhiệt dải thấp (Stand1)", "h.stand1", { options: standOptions("t"), wide: 1 })}
        ${fld("Chuẩn nhiệt dải cao ≥150 °C (Stand2, trống = Stand1)", "h.stand2", { options: standOptions("t"), wide: 1 })}
        ${fld("Thiết bị đo điện trở (Stand3)", "h.stand3", { options: standOptions("r"), wide: 1 })}${decHint([[standById(h.stand1), "°C"], [standById(h.stand2), "°C"], [standById(h.stand3), "Ω", 150]])}</div>`;
    const inp = (p, v, ph) => `<input data-p="${p}" inputmode="decimal" value="${esc(v)}"${ph ? ` placeholder="${ph}"` : ""}>`;
    const sgn = (p, v) => `<div class="pm">${inp(p, v)}<button type="button" class="pmb sm" data-neg="${p}" aria-label="Đổi dấu">±</button></div>`;
    let pts, ptsTitle;
    if (T === "PG") {
      const rows = rec.pg.std.map((x, i) => `<tr><td class="n">${i + 1}</td><td>${sgn(`pg.std.${i}`, x)}</td><td>${inp(`pg.rise.${i}`, rec.pg.rise[i])}</td><td>${inp(`pg.fall.${i}`, rec.pg.fall[i])}</td></tr>`).join("");
      pts = `<table class="entry"><thead><tr><th>#</th><th>Áp suất chuẩn<br>${esc(u)}</th><th>Tăng ↑<br>${esc(u)}</th><th>Giảm ↓<br>${esc(u)}</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="btns"><button class="btn" data-act="pts">Điểm 0-25-50-75-100%</button><button class="btn pri" data-act="syncpg">⇅ Đồng bộ Tăng / Giảm</button></div>
        <div class="grid">${fld(`Sụt áp chuẩn – áp suất kiểm tra (${esc(u)})`, "pg.before", { num: 1 })}${fld(`Áp suất sau (${esc(u)})`, "pg.after", { num: 1 })}</div>`;
      ptsTitle = "lên / xuống";
    }
    if (T === "TS") {
      const rows = rec.ts.set.map((v, i) => `<tr><td class="n">${i + 1}</td><td>${sgn(`ts.set.${i}`, v)}</td><td>${sgn(`ts.reset.${i}`, rec.ts.reset[i])}</td></tr>`).join("");
      pts = `<p class="hint">Như QTG: chiều ${h.dirQTG === "Falling" ? "giảm (Falling)" : "tăng (Rising)"} · ghi vào cột ${h.psType === "As Left" ? "As left" : "As found"}.</p>
        <table class="entry"><thead><tr><th>TT</th><th>Nhiệt độ tác động<br>(Set) °C</th><th>Nhiệt độ trả về<br>(Reset) °C</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="btns"><button class="btn pri" data-act="copyts">Lần 2–5 = Lần 1</button></div>`;
      ptsTitle = "5 lần";
    }
    if (T === "TT") {
      const ord = ["1st", "2nd", "3rd"];
      const rows = rec.tt.nom.map((nm, p) => [0, 1, 2].map(k => `<tr class="${k === 2 ? "sep" : ""}">${k === 0 ? `<td rowspan="3" class="n">${sgn(`tt.nom.${p}`, nm)}</td>` : ""}<td class="n">${ord[k]}</td>
          <td>${inp(`tt.sr.${p}.${k}`, rec.tt.sr[p][k], "°C")}</td><td>${inp(`tt.sf.${p}.${k}`, rec.tt.sf[p][k], "°C")}</td><td>${inp(`tt.dr.${p}.${k}`, rec.tt.dr[p][k], "mA")}</td><td>${inp(`tt.df.${p}.${k}`, rec.tt.df[p][k], "mA")}</td></tr>`).join("")).join("");
      pts = `<div class="xs"><table class="entry tt"><thead><tr><th>Điểm HC<br>°C</th><th>Lần</th><th>Chuẩn ↑<br>°C</th><th>Chuẩn ↓<br>°C</th><th>DUT ↑<br>mA</th><th>DUT ↓<br>mA</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="btns"><button class="btn" data-act="pts">Điểm 0-25-50-75-100%</button><button class="btn" data-act="tt23">Lần 2–3 = Lần 1</button><button class="btn pri" data-act="ttsync">⇅ Giảm = Tăng (ô trống)</button></div>`;
      ptsTitle = "5 điểm × 3 lần";
    }
    if (T === "RTD") {
      const L = ["01", "02", "03 (tg)", "04", "05", "tg lần 2"];
      const rows = rec.rtd.std.map((v, i) => `<tr><td class="n">${L[i]}</td><td>${sgn(`rtd.std.${i}`, v)}</td>${rec.rtd.dut[i].map((d, k) => `<td>${inp(`rtd.dut.${i}.${k}`, d, "Ω")}</td>`).join("")}</tr>`).join("");
      pts = `<p class="hint">Như QTG: 5 điểm tăng dần, dòng cuối đo lại điểm 03 khi giảm (tính hồi trễ).</p>
        <div class="xs"><table class="entry rtd"><thead><tr><th>TT</th><th>Chuẩn<br>°C</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="btns"><button class="btn" data-act="rtd6">tg lần 2 = điểm 03</button><button class="btn pri" data-act="rtdcopy">Lần 2–5 = Lần 1</button></div>`;
      ptsTitle = "6 dòng × 5 lần đọc";
    }
    return { dev, std, pts, ptsTitle };
  }

  function renderNewResult(r) {
    const T = rec.type, vn = D.vn, f3 = v => vn(v, 3);
    const vd = (extra) => `<div class="verdict ${r.pass ? "ok" : "ko"}">${r.pass ? "ĐẠT (Pass)" : "KHÔNG ĐẠT (Fail)"}<small>${extra}</small></div>`;
    const qc = `<div>Bản đầy đủ: nút "Bảng Uncer (QC)".</div>`;
    if (T === "PG") return vd(`Max |SHC| = ${r.maxSHC.toPrecision(4)} / cho phép ${r.lim.toPrecision(4)} ${esc(rec.h.unit)}${r.red ? ` · sụt áp ${r.red.pct.toFixed(2)}%` : ""}`)
      + `<table class="mini"><thead><tr><th>Chuẩn</th><th>Tăng</th><th>Giảm</th><th>SHC ↑</th><th>SHC ↓</th></tr></thead><tbody>
        ${r.rows.map(x => `<tr><td>${x.x}</td><td>${x.rise}</td><td>${x.fall}</td><td class="${Math.abs(x.cR) > r.lim ? "bad" : ""}">${C.xround(x.cR, 6)}</td><td class="${Math.abs(x.cF) > r.lim ? "bad" : ""}">${C.xround(x.cF, 6)}</td></tr>`).join("")}</tbody></table>`;
    if (T === "TS") return vd(`U = ${vn(r.Uprint, 2)} °C · max |Set − Tset| = ${r.maxDev.toPrecision(4)} / cho phép ${r.lim.toPrecision(4)} °C`)
      + `<table class="mini"><thead><tr><th>Lần</th><th>Set</th><th>Reset</th><th>Set-dev</th><th>Reset-dev</th></tr></thead><tbody>
        ${r.set.map((v, i) => `<tr><td>${i + 1}</td><td>${v}</td><td>${r.reset[i]}</td><td>${f3(r.setDev[i])}</td><td>${f3(r.resetDev[i])}</td></tr>`).join("")}</tbody></table>
        <details><summary>Bảng tính chi tiết cho Quality Checker</summary><div class="qc"><div>utm=${r.F30.toPrecision(6)} · utd=${r.F31.toPrecision(6)} · uch1=${r.F33.toPrecision(6)} · uch3=${r.F35.toPrecision(6)} · U chưa làm tròn=${r.U.toPrecision(8)}</div>${qc}</div></details>`;
    if (T === "TT") return vd(r.lines.map(l => `${l.from}÷${l.to} °C: U = ${D.uTxt("TT", l.U)}`).join(" · ") + ` · max sai lệch ${r.maxErr.toPrecision(4)}%`)
      + `<table class="mini"><thead><tr><th>Chuẩn °C</th><th>mA lý tưởng</th><th>SHC ↑</th><th>SHC ↓</th><th>%</th></tr></thead><tbody>
        ${r.pt.map(p => `<tr><td>${f3(p.stdT)}</td><td>${f3(p.ideal)}</td><td>${f3(p.cR)}</td><td>${f3(p.cF)}</td><td>${f3(p.err)}</td></tr>`).join("")}</tbody></table>
        <details><summary>Bảng tính chi tiết cho Quality Checker</summary><div class="qc"><div>Cj=${r.Cj.toPrecision(6)} · điểm thấp/trung/cao = ${r.nL}/${r.nM}/${r.nH} · uch2 ampe kế=${r.F40.toPrecision(6)}</div>
        <div>U thấp=${r.R.low.U.toPrecision(8)} · trung=${r.R.mid.U.toPrecision(8)} · cao=${r.R.high.U.toPrecision(8)}</div>${qc}</div></details>`;
    return vd(`U = ${vn(r.U, 2)} °C · R0 = ${vn(r.R0, 3)} Ω · ${r.neg ? "bậc 3" : "bậc 2"}`)
      + `<table class="mini"><thead><tr><th>Chuẩn</th><th>R đo</th><th>R đặc tuyến</th><th>Lệch Ω</th><th>Lệch °C</th></tr></thead><tbody>
        ${r.rows.map(x => `<tr><td>${x.std}</td><td>${vn(x.dut, 3)}</td><td>${vn(x.Rfit, 3)}</td><td>${vn(x.eO, 3)}</td><td>${vn(x.eC, 2)}</td></tr>`).join("")}</tbody></table>
        <details><summary>Bảng tính chi tiết cho Quality Checker</summary><div class="qc"><div>A=${r.A.toPrecision(6)} · B=${r.B.toPrecision(6)} · C=${r.C.toPrecision(6)} · max|lệch|=${r.maxE} + U ≤ ${r.lim.toPrecision(4)} ?</div>
        <div>uch=${r.G38.toPrecision(6)} · uDUT=${r.Q38.toPrecision(6)} · U chưa làm tròn=${r.U.toPrecision(8)}</div>${qc}</div></details>`;
  }

  function renderResult() {
    const c = compute(), el = $("#result"); if (!el) return;
    syncCertNo(c);
    const msgs = c.errors.map(e => `<li class="bad">${esc(e)}</li>`).join("") + c.warns.map(e => `<li class="warn">${esc(e)}</li>`).join("");
    let body = "";
    const r = c.res;
    if (r && NEWT.includes(rec.type)) body = renderNewResult(r);
    else if (r && rec.type === "PT") {
      body = `<div class="verdict ${r.pass ? "ok" : "ko"}">${r.pass ? "ĐẠT (Pass)" : "KHÔNG ĐẠT (Fail)"}<small>U<sub>exp-max</sub> = ${D.uTxt("PT", r.Umax)} ${esc(rec.h.unit)} · y = ${D.vn(r.a, 3)} + ${D.vn(r.b, 3)} x</small></div>
        <table class="mini"><thead><tr><th>AS</th><th>mA lý tưởng</th><th>SHC ↑</th><th>SHC ↓</th><th>U (${esc(rec.h.unit)})</th></tr></thead><tbody>
        ${r.rows.map(x => `<tr><td>${x.x}</td><td>${x.ideal.toFixed(3)}</td><td class="${Math.abs(x.shcR) > r.limI ? "bad" : ""}">${x.shcR.toFixed(3)}</td><td class="${Math.abs(x.shcF) > r.limI ? "bad" : ""}">${x.shcF.toFixed(3)}</td><td>${D.uTxt("PT", x.U)}</td></tr>`).join("")}</tbody></table>
        <details><summary>Bảng tính chi tiết cho Quality Checker</summary><div class="qc">
          <div>Giới hạn: U ≤ ${r.limU.toPrecision(6)} ${esc(rec.h.unit)} (${r.checks.uOK ? "OK" : "VƯỢT"}) · |SHC| ≤ ${r.limI.toPrecision(4)} mA (${r.checks.iOK ? "OK" : "VƯỢT"})</div>
          <div>Sy=${r.Sy.toPrecision(6)} · Sa=${r.Sa.toPrecision(6)} · Sb=${r.Sb.toPrecision(6)} · r=${r.r.toPrecision(6)} · uv=${r.uv.toPrecision(6)}% · E12=${r.E12.toPrecision(6)}%</div>
          <div>Uexp chưa làm tròn: ${r.rows.map(x => x.U.toPrecision(8)).join(" · ")}</div>
          <div>Bản đầy đủ: nút "Bảng Uncer (QC)".</div></div></details>`;
    } else if (r) {
      body = `<div class="verdict ${r.pass ? "ok" : "ko"}">${r.pass ? "ĐẠT (Pass)" : "KHÔNG ĐẠT (Fail)"}<small>U = ${r.Utext.text} ${esc(rec.h.unitPset)} · tác động chiều ${r.dir}</small></div>
        <table class="mini"><thead><tr><th>Lần</th><th>Set</th><th>Reset</th><th>Set-dev</th><th>Reset-dev</th></tr></thead><tbody>
        ${r.set.map((v, i) => `<tr><td>${i + 1}</td><td>${v}</td><td>${r.reset[i]}</td><td>${r.setDev[i].toFixed(3)}</td><td>${r.resetDev[i].toFixed(3)}</td></tr>`).join("")}</tbody></table>
        <details><summary>Bảng tính chi tiết cho Quality Checker</summary><div class="qc">
          <div>uA mở=${r.F26.toPrecision(6)} · uA đóng=${r.F27.toPrecision(6)} · uB chuẩn=${r.F31.toPrecision(6)} · uB phân giải=${r.F32}</div>
          <div>U chưa làm tròn = ${r.U.toPrecision(8)} · max|Set-dev| + U = ${r.J42.toPrecision(6)} ≤ ${r.K42.toPrecision(6)} ?</div>
          <div>Bản đầy đủ: nút "Bảng Uncer (QC)".</div></div></details>`;
    }
    el.innerHTML = (msgs ? `<ul class="msgs">${msgs}</ul>` : "") + (body || `<p class="mut">Nhập đủ thông tin để xem kết quả.</p>`);
  }

  /* ---------- events: entry ---------- */
  function onInput(e) {
    const p = e.target.dataset.p; if (!p) return;
    setPath(rec, p, e.target.value);
    if (p === "certNo") rec.certAuto = false;
    if (p === "h.makerSel") { rec.h.maker = e.target.value === OTHER ? "" : e.target.value; renderEntry(); if (e.target.value === OTHER) focusPath("h.maker"); persistCurrent(); return; }
    if (p.startsWith("pt.points") || p.startsWith("pg.std") || p.startsWith("tt.nom")) rec.ptAuto = false;
    if (["PT", "PG", "TT"].includes(rec.type) && (p === "h.min" || p === "h.max") && rec.ptAuto) { genPoints(); renderEntry(); focusPath(p); }
    else if (p === "h.psType" && rec.type === "TS") { renderEntry(); focusPath(p); }
    else if (p === "h.unit" || p === "h.unitPset" || p === "h.description" || p === "h.calDate" || p === "h.dirQTG" || p === "h.location" || p === "h.locFree" || p.startsWith("h.stand")) {
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
    const P = [0, 1, 2, 3, 4].map(k => String(C.xround((mx - mn) / 4 * k + mn, 6)));  // QTG!D23 = (G23-C23)/4*k + C23
    if (rec.type === "PG") rec.pg.std = P; else if (rec.type === "TT") rec.tt.nom = P; else rec.pt.points = P;
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
    if (act === "syncpg") {
      const R = rec.pg.rise, F = rec.pg.fall; let n = 0;
      R.forEach((r, i) => { r = String(r).trim(); const f = String(F[i]).trim(); if (r && !f) { F[i] = r; n++; } else if (f && !r) { R[i] = f; n++; } });
      if (!n) rec.pg.fall = R.slice(); toast(n ? `Đã điền ${n} ô từ chiều còn lại` : "Đã đồng bộ: Giảm = Tăng"); renderEntry();
    }
    if (act === "copyts") { rec.ts.set = rec.ts.set.map(() => rec.ts.set[0]); rec.ts.reset = rec.ts.reset.map(() => rec.ts.reset[0]); renderEntry(); toast("Đã chép lần 1 cho cả 5 lần"); }
    if (act === "tt23") { ["sr", "sf", "dr", "df"].forEach(k => rec.tt[k] = rec.tt[k].map(a => a.map(() => a[0]))); renderEntry(); toast("Đã chép lần 1 cho lần 2–3"); }
    if (act === "ttsync") {
      let n = 0;
      [["sr", "sf"], ["dr", "df"]].forEach(([a, b]) => rec.tt[a].forEach((row, p) => row.forEach((v, k) => {
        const x = String(v).trim(), y = String(rec.tt[b][p][k]).trim();
        if (x && !y) { rec.tt[b][p][k] = x; n++; } else if (y && !x) { rec.tt[a][p][k] = y; n++; }
      })));
      renderEntry(); toast(`Đã điền ${n} ô`);
    }
    if (act === "rtd6") { rec.rtd.std[5] = rec.rtd.std[2]; renderEntry(); }
    if (act === "rtdcopy") { rec.rtd.dut = rec.rtd.dut.map(a => a.map(() => a[0])); renderEntry(); toast("Đã chép lần 1 cho lần 2–5"); }
    if (act === "copy1") { rec.ps.set = rec.ps.set.map(() => rec.ps.set[0]); rec.ps.reset = rec.ps.reset.map(() => rec.ps.reset[0]); renderEntry(); toast("Đã chép lần 1 cho cả 5 lần"); }
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
    const c = compute(); syncCertNo(c);
    rec.saved = true; rec.updated = new Date().toISOString();
    rec.summary = c.res ? { pass: c.res.pass, U: summaryU(rec.type, c.res) } : null;
    const i = records.findIndex(r => r.id === rec.id);
    if (i >= 0) records[i] = clone(rec); else records.unshift(clone(rec));
    store.set("records", records); rememberNames(); toast("Đã lưu " + rec.certNo);
  }

  /* ---------- documents ---------- */
  function docInfo() {
    const c = compute();
    const s1 = standById(rec.h.stand1), s2 = standById(rec.h.stand2), s3 = standById(rec.h.stand3), T = rec.type;
    const used = T === "PT" ? [s1, s2] : ["TT", "RTD"].includes(T) ? [s1, s2, s3] : [s1];
    const exp = settings.warnExpired ? used.filter(Boolean).filter(s => isExpired(s, rec.h.calDate)) : [];
    return { c, info: { stand1: s1, stand2: ["PT", "TT", "RTD"].includes(T) ? s2 : null, stand3: s3, heat: T === "TS" ? s1 : null, loc: recLoc(), draft: exp.length ? "CHUẨN HẾT HẠN, CẦN CẬP NHẬT" : (c.warns.some(w => w.startsWith("Chưa nhập")) ? "CHƯA ĐỦ CHỮ KÝ" : "") } };
  }
  function pagesHtml(which) {
    const { c, info } = docInfo();
    if (!c.res) { toast(c.errors[0] || "Chưa đủ số liệu"); return null; }
    if (failed(c)) {
      if (which === "cert") { toast("Không đạt: không xuất chứng chỉ (kể cả bản nháp)"); return null; }
      if (which === "all") toast("Không đạt: bộ PDF chỉ gồm Biên bản và bảng Uncer");
      which = which === "all" ? "noCert" : which;
    }
    const a = [], P = D2.PAGES[rec.type];
    if (which === "noCert") {
      a.push(P ? P.q(rec, c.res, settings, info) : D.qtgPage(rec, c.res, settings, info));
      a.push(P ? P.u(rec, c.res, settings, info) : D.uncPage(rec, c.res, settings, info));
      return a.join("");
    }
    if (P) {
      if (which === "qtg" || which === "all") a.push(P.q(rec, c.res, settings, info));
      if (which === "cert" || which === "all") a.push(P.c1(rec, c.res, settings, info), P.c2(rec, c.res, settings, info));
      if (which === "unc" || which === "all") a.push(P.u(rec, c.res, settings, info));
      return a.join("");
    }
    if (which === "qtg" || which === "all") a.push(D.qtgPage(rec, c.res, settings, info));
    if (which === "cert" || which === "all") a.push(D.certPage1(rec, c.res, settings, info), D.certPage2(rec, c.res, settings, info));
    if (which === "unc" || which === "all") a.push(D.uncPage(rec, c.res, settings, info));
    return a.join("");
  }
  function renderPreview(which) {
    const html = pagesHtml(which); if (!html) return;
    const el = $("#preview"); el.innerHTML = `<div class="card"><h2>Xem trước</h2><div class="pv"><div class="pv-in">${html}</div></div></div>`;
    fitPreview(); el.scrollIntoView({ behavior: "smooth" });
  }
  function fitPreview() { const pv = $(".pv"); if (!pv) return; const s = Math.min(1, (pv.clientWidth - 2) / 794); const inn = $(".pv-in"); inn.style.transform = `scale(${s})`; pv.style.height = (inn.scrollHeight * s) + "px"; }
  window.addEventListener("resize", fitPreview);

  async function makePdf(which, htmlIn, nameIn, outSel) {
    const html = htmlIn || pagesHtml(which); if (!html) return;
    const out = $(outSel || "#pdfout"); out.innerHTML = `<p class="mut">Đang tạo PDF…</p>`;
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
      const label = { cert: "ChungChi", qtg: "BienBan", unc: "Uncer", all: "HoSo" }[which];
      const name = nameIn || `${label}_${(rec.certNo || "").replace(/[^\w.-]+/g, "_")}_${(rec.h.tag || "").replace(/[^\w.-]+/g, "_")}.pdf`;
      lastPdf = { blob: pdf.output("blob"), name };
      out.innerHTML = `<div class="pdfready"><b>${esc(name)}</b><span class="mut">${(lastPdf.blob.size / 1024).toFixed(0)} KB</span>
        <div class="btns"><button class="btn pri" data-act="share" data-r="share">Chia sẻ / Lưu vào Tệp</button><button class="btn" data-act="download" data-r="download">Mở / Tải xuống</button></div></div>`;
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
      <div class="btns"><button class="btn pri" data-r="qcPT">Bảng kiểm tra PT (QC)</button><button class="btn pri" data-r="qcPS">Bảng kiểm tra PS (QC)</button></div><div id="qcout"></div>
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
      const b = newRecord(r.type);
      rec.pt = { points: r.pt.points.slice(), rise: ["", "", "", "", ""], fall: ["", "", "", "", ""] }; rec.ps = b.ps; rec.ts = b.ts;
      rec.pg = Object.assign(b.pg, { std: (r.pg || b.pg).std.slice() }); rec.tt = Object.assign(b.tt, { nom: (r.tt || b.tt).nom.slice() }); rec.rtd = Object.assign(b.rtd, { std: (r.rtd || b.rtd).std.slice() });
      rec.certNo = autoCertNo(); rec.certAuto = true; persistCurrent(); go("entry"); toast("Đã nhân bản – nhập tag và số đọc mới");
    }
    if (b.dataset.r === "del" && r) {
      if (b.dataset.armed) { records = records.filter(x => x.id !== r.id); store.set("records", records); renderRecords(); toast("Đã xoá"); }
      else { b.dataset.armed = 1; b.textContent = "Xoá thật?"; b.classList.add("danger"); setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = "Xoá"; b.classList.remove("danger"); } }, 3000); }
    }
    if (b.dataset.r === "qcPT" || b.dataset.r === "qcPS") {
      const type = b.dataset.r.slice(2), q = ($("#rq") && $("#rq").value || "").toLowerCase();
      const items = records.filter(x => x.type === type && (!q || [x.h.tag, x.certNo, x.h.model, x.h.location, x.h.locFree].join(" ").toLowerCase().includes(q)))
        .map(x => { const c = compute(x); const s1 = standById(x.h.stand1), s2 = standById(x.h.stand2); return c.res ? { rec: Object.assign(clone(x), { s1key: s1 ? s1.key : x.h.stand1, s2key: s2 ? s2.key : x.h.stand2 }), res: c.res } : null; })
        .filter(Boolean).sort((a, z) => a.rec.certNo.localeCompare(z.rec.certNo));
      if (!items.length) { toast(`Chưa có hồ sơ ${type} tính được`); return; }
      makePdf("qc", D.qcPages(type, items, settings), `BangKiemTra_${type}_${todayISO()}.pdf`, "#qcout");
      return;
    }
    if (b.dataset.r === "share") { sharePdf(); return; }
    if (b.dataset.r === "download") { downloadPdf(); return; }
    if (b.dataset.r === "backup") saveFile(new Blob([JSON.stringify({ app: "lab-pvgas-services", records, stands, settings }, null, 1)], { type: "application/json" }), `LAB_PVGAS_backup_${todayISO()}.json`);
    if (b.dataset.r === "csv") {
      const head = ["Số chứng chỉ", "Loại", "Location", "Tag", "Mô tả", "Hãng", "Model", "Serial", "Min", "Max", "Đơn vị", "Pset", "Đơn vị Pset", "Độ chính xác", "Ngày HC", "U", "Kết quả", "Kiểm định viên", "Người kiểm soát"];
      const rows = records.map(r => [r.certNo, r.type, r.h.locMode === "free" ? r.h.locFree : r.h.location, r.h.tag, r.h.description, r.h.maker, r.h.model, r.h.serial, r.h.min, r.h.max, r.h.unit, r.type === "PS" ? r.h.pset : r.type === "TS" ? r.h.tset : "", r.type === "PS" ? r.h.unitPset : r.type === "TS" ? "°C" : "", r.h.acc, r.h.calDate, r.summary ? r.summary.U : "", r.summary ? (r.summary.pass ? "Đạt (Pass)" : "Không đạt (Fail)") : "", r.sig.inspector, r.sig.controller]);
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
  let editStand = null, standKind = "";
  const KINDS = { p: "Áp suất", e: "Điện (mA)", t: "Nhiệt độ", r: "Điện trở" };
  function renderStands() {
    const today = todayISO();
    const row = s => `<div class="rec"><div><b>${esc(s.key)}</b> <span class="tag">${KINDS[s.kind] || s.kind}</span>${s.loc ? ` <span class="tag loc">${esc(s.loc)}</span>` : ""} <span class="${s.due && s.due >= today ? "ok" : "bad"}">${s.due && s.due >= today ? "Còn hạn " + s.due : "Hết hạn " + (s.due || "?")}</span><br>
      <small class="mut">${esc(s.name)} · ${esc(s.maker)} ${esc(s.model)} · S/N ${esc(s.serial)} · (${s.min}÷${s.max}) ${esc(s.unit)} · U = ${s.unc} ${esc(s.uncUnit)}${s.rdg ? (s.kind === "p" ? ` + ${s.rdg}%Rdg` : ` · sai số ${s.rdg} ${esc(s.unit)}`) : ""}${s.err && s.kind === "r" ? ` · sai số ${s.err} Ω` : ""}${s.cert ? ` · GCN ${esc(s.cert)}` : ""} · ${esc(s.trace || "")}</small>${dispTxt(s) ? `<br><small class="mut">Hiển thị (số chữ số thập phân): ${esc(dispTxt(s))}</small>` : ""}${s.note ? `<br><small class="${/CHỈ DÙNG|nghi|cần chốt/.test(s.note) ? "bad" : "mut"}">${esc(s.note)}</small>` : ""}</div>
      <div class="ra"><button class="btn sm" data-s="edit" data-id="${s.id}">Sửa</button></div></div>`;
    const form = editStand ? standForm(editStand) : "";
    $("#v-stands").innerHTML = `${form}<div class="card"><h2>Thư viện chuẩn</h2>
      <p class="hint">Cập nhật 30/10/2026 theo các giấy chứng nhận hiệu chuẩn mới (VMI, Unitek): U là giá trị lớn nhất trên GCN, kèm số GCN và ghi chú chỗ thay đổi. Nhãn "Cà Mau" = chuẩn có trong file Excel của Cà Mau (1.TT_LFS_CM_26, RTD_DK_CM_2026); sửa ô "Nơi đặt" nếu chuẩn đã chuyển chỗ. Khi có GCN mới, sửa U và hạn hiệu chuẩn tại đây.</p>
      <div class="btns">${["", "p", "e", "t", "r"].map(k => `<button class="btn sm${standKind === k ? " pri" : ""}" data-s="kind" data-k="${k}">${k ? KINDS[k] : "Tất cả"}</button>`).join("")}</div>
      <div class="btns"><button class="btn pri" data-s="add">Thêm chuẩn</button><button class="btn" data-s="reset">Khôi phục danh sách gốc</button></div>
      ${stands.filter(s => !standKind || s.kind === standKind).map(row).join("")}</div>`;
  }
  function dispTxt(s) {
    if (s.kind === "p") { if (s.name === "Deadweight Tester") return ""; return ["bar", "mbar", "kPa", "MPa", "psi", "kg/cm2"].map(u => { const d = standDec(s, u); return d == null ? "" : `${u} ${d < 0 ? "—" : d}`; }).filter(Boolean).join(" · "); }
    if (s.steps) return s.steps.map(([lim, st]) => `≤${lim} ${s.unit}: ${decOf(st)}`).join(" · ");
    const d = standDec(s, s.unit); return d == null ? "" : `${s.unit} ${d}`;
  }
  function standForm(s) {
    const f = (lab, k, o = {}) => `<label class="f${o.wide ? " wide" : ""}"><span>${lab}</span>${o.options ? `<select data-k="${k}">${o.options.map(v => `<option${String(v) === String(s[k]) ? " selected" : ""}>${v}</option>`).join("")}</select>` : `<input data-k="${k}" value="${esc(s[k] == null ? "" : s[k])}" ${o.type ? `type="${o.type}"` : ""} ${o.num ? 'inputmode="decimal"' : ""}>`}</label>`;
    return `<div class="card hl"><h2>${s._new ? "Thêm chuẩn" : "Sửa chuẩn"}</h2><div class="grid" id="sf">
      ${f("Loại (p áp suất · e điện mA · t nhiệt độ · r điện trở)", "kind", { options: ["p", "e", "t", "r"] })}${f("Mã chọn nhanh (key)", "key")}${f("Tên thiết bị", "name", { wide: 1 })}${f("Model", "model")}${f("Serial", "serial")}${f("Hãng", "maker")}
      ${f("Min", "min", { num: 1 })}${f("Max", "max", { num: 1 })}${f("Đơn vị", "unit", { options: PUNITS.concat(["mA", "°C", "Ω"]) })}
      ${f("ĐKĐBĐ (U)", "unc", { num: 1 })}${f("Đơn vị của U", "uncUnit", { options: ["%", "ppm"].concat(PUNITS, ["mA", "°C", "Ω"]) })}${f("% of Reading", "rdg", { num: 1 })}
      ${s.kind === "e" ? f("Phạm vi in trên chứng chỉ (Max)", "certRange", { num: 1 }) : ""}
      ${s.kind === "e" || s.kind === "r" ? f("Sai số / phân giải (TT N17 · RTD O14)", "err", { num: 1 }) : ""}
      ${s.kind === "t" ? f("Độ ổn định (°C)", "stab", { num: 1 }) + f("Đồng đều hướng kính – radial (°C)", "radial", { num: 1 }) + f("Đồng đều hướng trục – axial (°C)", "axial", { num: 1 }) + f("Tên thiết bị tạo nhiệt (QTG)", "heat") : ""}${f("Độ chính xác (text)", "accuracy")}${f("Dẫn xuất chuẩn", "trace")}${f("Hạn hiệu chuẩn", "due", { type: "date" })}${f("Số giấy chứng nhận", "cert")}${f("Nơi đặt (vd. Cà Mau, Vũng Tàu)", "loc")}${f("Ghi chú", "note", { wide: 1 })}
      </div><div class="btns"><button class="btn pri" data-s="save">Lưu chuẩn</button><button class="btn" data-s="cancel">Huỷ</button>${s._new ? "" : `<button class="btn" data-s="delete">Xoá chuẩn</button>`}</div></div>`;
  }
  function onStandsClick(e) {
    const b = e.target.closest("button[data-s]"); if (!b) return;
    const a = b.dataset.s;
    if (a === "edit") { editStand = clone(standById(b.dataset.id)); renderStands(); window.scrollTo(0, 0); }
    if (a === "add") { editStand = { _new: true, id: "s" + Date.now().toString(36), kind: "p", key: "", name: "", model: "", serial: "", maker: "", min: 0, max: 0, unit: "bar", unc: 0, uncUnit: "bar", rdg: 0, trace: "Viện ĐLVN (VMI)", due: "", cert: "", loc: "", note: "" }; renderStands(); }
    if (a === "cancel") { editStand = null; renderStands(); }
    if (a === "kind") { standKind = b.dataset.k; renderStands(); }
    if (a === "delete") { if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = "Xoá thật?"; return; } stands = stands.filter(s => s.id !== editStand.id); store.set("stands", stands); editStand = null; renderStands(); }
    if (a === "save") {
      $$("#sf [data-k]").forEach(i => { const k = i.dataset.k; editStand[k] = ["min", "max", "unc", "rdg", "certRange", "err", "stab", "radial", "axial"].includes(k) ? num(i.value) || 0 : i.value; });
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
    const sel = (lab, p, opts) => `<label class="f"><span>${lab}</span><select data-sp="${p}">${opts.map(([v, t]) => `<option value="${v}"${!!getPath(settings, p) === !!v ? " selected" : ""}>${t}</option>`).join("")}</select></label>`;
    $("#v-settings").innerHTML = `<div class="card"><h2>Người ký trang 1 chứng chỉ</h2><div class="grid">
        ${f("Chức danh trái", "sig1Title")}${f("Tên", "sig1Name")}${f("Chức danh trái (EN)", "sig1TitleEn", 1)}
        ${f("Chức danh phải", "sig2Title")}${f("Tên", "sig2Name")}${f("Chức danh phải (EN)", "sig2TitleEn", 1)}
        ${f("Nơi cấp (dòng ngày)", "place")}${f("Chu kỳ HC (tháng)", "dueMonths")}
        ${sel("Ngày cấp trên chứng chỉ", "issueDayBlank", [["1", "Để trống ngày (ghi tay) như mẫu"], ["", "In ngày cấp đã nhập"]])}
        ${sel("Logo VILAS / ilac dưới chữ ký", "showAccred", [["1", "Có"], ["", "Không"]])}</div></div>
      <div class="card"><h2>Tiêu đề & chân trang (mẫu 2026)</h2><div class="grid">
        ${f("Dòng 1", "certLines.0", 1)}${f("Dòng 2 (tên công ty)", "certLines.1", 1)}${f("Mã đỏ cạnh tên", "companyTag")}${f("Tên phòng (QTG PT)", "labName")}
        ${f("Tên tiếng Anh", "certLines.2", 1)}${f("Add (EN)", "certLines.3", 1)}${f("Tel (chứng chỉ)", "certLines.4", 1)}
        ${f("Địa chỉ (QTG PS)", "addrVN", 1)}${f("Add (QTG)", "addrEN", 1)}
        ${f("Chân trang (VN)", "footerVN", 1)}${f("Chân trang (EN)", "footerEN", 1)}
        ${sel("Cảnh báo chuẩn hết hạn", "warnExpired", [["", "Tắt (tạm thời)"], ["1", "Bật – đóng dấu BẢN NHÁP"]])}
        ${sel("In logo đầu trang", "showLogo", [["1", "Có"], ["", "Không (giấy in sẵn logo)"]])}</div></div>
      <div class="card"><h2>Mặc định theo loại</h2><div class="grid">
        ${f("PT – Phương pháp", "PT.procedure")}${f("PT – Mã biểu mẫu QTG", "PT.qtgForm")}${f("PT – Mã bảng Uncer", "PT.form")}${f("PT – Tiền tố CC / BB", "PT.prefix")}
        ${f("PT – Môi trường (chứng chỉ)", "PT.env", 1)}${f("PT – Nhiệt độ QTG", "PT.qtgTemp")}${f("PT – Độ ẩm QTG", "PT.qtgHum")}
        ${f("PS – Phương pháp", "PS.procedure")}${f("PS – Mã biểu mẫu QTG", "PS.qtgForm")}${f("PS – Mã bảng Uncer", "PS.form")}${f("PS – Tiền tố CC / BB", "PS.prefix")}
        ${f("PS – Môi trường (chứng chỉ)", "PS.env", 1)}${f("PS – Nhiệt độ QTG", "PS.qtgTemp")}${f("PS – Độ ẩm QTG", "PS.qtgHum")}
        ${NEWT.map(t => `${f(`${t} – Phương pháp`, `${t}.procedure`)}${f(`${t} – Mã biểu mẫu QTG`, `${t}.qtgForm`)}${t === "PG" ? f("PG – Ký hiệu series (N256.yy<b>A</b>)", "PG.series") : f(`${t} – Mã bảng Uncer`, `${t}.form`)}${f(`${t} – Tiền tố CC`, `${t}.prefix`)}${f(`${t} – Tiền tố BB`, `${t}.bbPrefix`)}
          ${t === "PG" ? f("PG – Phương pháp in GCN (VN)", "PG.procVN", 1) + f("PG – Phương pháp in GCN (EN)", "PG.procEN", 1) : f(`${t} – Môi trường (chứng chỉ)`, `${t}.env`, 1)}${f(`${t} – Nhiệt độ QTG`, `${t}.qtgTemp`)}${f(`${t} – Độ ẩm QTG`, `${t}.qtgHum`)}`).join("")}</div>
        <div class="btns"><button class="btn" data-t="resetset">Về mặc định</button></div></div>
      <div class="card"><h2>Tự kiểm tra công thức</h2><p class="hint">Chạy lại 2 ca thật từ file DGCP 10/2026 (PT-1506A, PSHH-0522) và so sánh từng số.</p>
        <div class="btns"><button class="btn pri" data-t="selftest">Chạy kiểm tra</button></div><div id="stout"></div></div>
      <div class="card"><h2>Về ứng dụng</h2><p class="hint">LAB PVGAS Services · bản thử nghiệm PT, PS, PG, TS, TT, RTD · chạy offline, dữ liệu chỉ lưu trên máy này (dùng Sao lưu JSON ở tab Hồ sơ).</p></div>`;
  }
  function onSettingsInput(e) {
    const p = e.target.dataset.sp; if (!p) return;
    let v = e.target.value; if (["showLogo", "warnExpired", "issueDayBlank", "showAccred"].includes(p)) v = !!v; if (p === "dueMonths") v = num(v) || 12;
    const ks = p.split("."); const last = ks.pop(); const t = ks.reduce((a, k) => a[k], settings); t[last] = v;
    store.set("settings", settings);
  }
  function onSettingsClick(e) {
    const b = e.target.closest("button[data-t]"); if (!b) return;
    if (b.dataset.t === "resetset") { settings = clone(SEED.settings); store.set("settings", settings); renderSettings(); toast("Đã về mặc định"); }
    if (b.dataset.t === "selftest") $("#stout").innerHTML = selfTest();
  }
  function selfTest() {
    // Chuẩn đóng băng đúng như sheet "Stand Ref" của file Excel 2026 dùng để đối chiếu (không lấy từ danh mục đang dùng, vì U đã cập nhật theo GCN mới)
    const FROZEN = {
      "700G05": { min: -1, max: 2, unit: "bar", unc: 0.0001, uncUnit: "bar", rdg: 0.05 },
      "754 (66830024)": { min: 0, max: 30, unit: "mA", unc: 0.017, uncUnit: "%", rdg: 0 },
      "APM30 (322077 - 30 bar)": { min: 0, max: 30, unit: "bar", unc: 0.002, uncUnit: "bar", rdg: 0 }
    };
    const st = id => clone(FROZEN[id]);
    // PT_DGCP_10_2026.xls › Data112 (CN.PT.26.2885) và PS_DGCP_10_2026.xls › Data133 (CN.PS.26.2744)
    const pt = C.calcPT({ min: 0, max: 100, unit: "kPa", acc: 0.25, points: [0, 25, 50, 75, 100], rise: [4.035, 8.03, 12.02, 16.006, 20.001], fall: [4.031, 8.013, 12.023, 16.019, 20.005], stand1: st("700G05"), stand2: st("754 (66830024)") });
    const expPT = [0.0539295692323056, 0.0491778103547832, 0.0532773550631725, 0.06456358905212, 0.0800524730260224];
    const ps = C.calcPS({ pset: 300, unitPset: "kPa", acc: 1, high: [299.91, 299.71, 300.06, 299.95, 300.03], low: [220.4, 220.31, 220.47, 220.43, 220.46], stand1: st("APM30 (322077 - 30 bar)") });
    const line = (lab, got, exp) => { const ok = Math.abs(got - exp) <= Math.abs(exp) * 1e-9; return `<tr><td>${lab}</td><td>${Number(got).toPrecision(12)}</td><td>${exp}</td><td class="${ok ? "ok" : "bad"}">${ok ? "khớp" : "LỆCH"}</td></tr>`; };
    return `<table class="mini"><thead><tr><th>Ca</th><th>App</th><th>Excel 2026</th><th></th></tr></thead><tbody>
      ${pt.rows.map((r, i) => line(`PT-1506A Uexp điểm ${i + 1}`, r.U, expPT[i])).join("")}
      ${line("PT-1506A a", C.xround(pt.a, 4), 4.0321)}${line("PT-1506A b", C.xround(pt.b, 6), 0.159724)}
      ${line("PSHH-0522 U", ps.U, 0.234980850283593)}</tbody></table>
      <p class="hint">PT-1506A: ${pt.pass ? "Pass" : "Fail"}, in U<sub>exp-max</sub> = ${D.uTxt("PT", pt.Umax)} kPa (quy tắc 30/10/2026: 2 chữ số có nghĩa, làm tròn lên; mẫu cũ in 0,080). PSHH-0522: ${ps.pass ? "Pass" : "Fail"}, chiều ${ps.dir}, in U = ${ps.Utext.text} kPa (Excel 0.24).</p>`;
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
    $("#v-stands").addEventListener("change", e => {
      if (e.target.dataset.k !== "kind" || !editStand) return;
      $$("#sf [data-k]").forEach(i => { const k = i.dataset.k; editStand[k] = ["min", "max", "unc", "rdg", "certRange", "err", "stab", "radial", "axial"].includes(k) ? num(i.value) || 0 : i.value; });
      renderStands();
    });
    $("#v-settings").addEventListener("input", onSettingsInput);
    $("#v-settings").addEventListener("change", onSettingsInput);
    $("#v-settings").addEventListener("click", onSettingsClick);
    go("entry");
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => { });
  });
})();
