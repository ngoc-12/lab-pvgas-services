/* Builds the printable A4 pages (certificate, QTG record, uncertainty sheet) as HTML.
 * Layout follows the company mail-merge templates:
 *   "14 PT - Thang 8.docx" (PT) and "133.3-2 PS 801 Cert khong logo vcl.docx" (PS).
 */
(function () {
  "use strict";
  const C = window.LabCalc;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const p2 = n => String(n).padStart(2, "0");
  function toDate(s) { if (!s) return null; const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  const dVN = d => d ? `${p2(d.getDate())}-${p2(d.getMonth() + 1)}-${d.getFullYear()}` : "";
  const dEN = d => d ? `${p2(d.getDate())}-${MON[d.getMonth()]}-${String(d.getFullYear()).slice(2)}` : "";
  const fP = v => isFinite(v) ? C.xround(v, 2).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";   // "#,#0.00"
  const f3 = v => isFinite(v) ? C.xround(v, 3).toFixed(3) : "";                                                                          // "##0.000"
  const fN = (v, d) => isFinite(v) ? C.xround(v, d).toFixed(d) : "";
  const g = (v, d = 6) => isFinite(v) ? Number(v.toPrecision(d)).toString() : "—";
  function decimalsOf(arr, min = 1) { let d = min; arr.forEach(v => { const s = String(v); const i = s.indexOf("."); if (i >= 0) d = Math.max(d, s.length - i - 1); }); return Math.min(d, 4); }

  function standLines(s, dutUnit) {
    if (!s) return {};
    const rangeMax = s.kind === "e" && s.certRange ? s.certRange : s.max;
    return {
      name: s.name, model: s.model, serial: s.serial, maker: s.maker,
      range: `(${s.min}÷${rangeMax}) ${s.unit}`,
      unc: `${s.unc} ${s.uncUnit}`, trace: s.trace
    };
  }

  function header(st) {
    if (!st.showLogo) return `<div class="hdr-space"></div>`;
    return `<div class="hdr"><img src="assets/logo.jpg" alt=""><div class="hdr-t">${st.labLines.map((l, i) => `<div class="${i < 2 ? "b" : ""}">${esc(l)}</div>`).join("")}</div></div>`;
  }
  const footer = (st, i, n) => `<div class="ftr"><span>${esc(st.footer)}</span><span>Trang (Page) ${i}/${n}</span></div>`;
  const wm = st => `<div class="wm">${esc(st.watermark)}<br>${esc(st.watermark)}</div>`;
  const draft = info => info.draft ? `<div class="draft">BẢN NHÁP – ${esc(info.draft)}</div>` : "";

  function sigBlock(lTitle, lEn, lName, rTitle, rEn, rName) {
    return `<table class="sig"><tr><td><b>${esc(lTitle)}</b><br><i>${esc(lEn)}</i><div class="sp"></div><b>${esc(lName)}</b></td>
      <td><b>${esc(rTitle)}</b><br><i>${esc(rEn)}</i><div class="sp"></div><b>${esc(rName)}</b></td></tr></table>`;
  }

  /* ---------------- Certificate page 1 ---------------- */
  function certPage1(rec, res, st, info) {
    const h = rec.h, PT = rec.type === "PT";
    const cal = toDate(h.calDate), due = C.eomonth(cal, Number(st.dueMonths) || 12), iss = toDate(h.issueDate) || cal;
    const s1 = standLines(info.stand1), s2 = PT ? standLines(info.stand2) : null;
    const obj = PT ? `Thiết bị chuyển đổi áp suất <i>(${esc(h.description)})</i>` : `Thiết bị đặt mức áp suất <i>(Pressure Switch)</i>`;
    const spec = PT
      ? `Phạm vi đo <i>(Range)</i>: (${esc(h.min)}÷${esc(h.max)}) ${esc(h.unit)}<br>Độ chính xác <i>(Accuracy)</i>: ±${esc(h.acc)}%FS`
      : `Dải làm việc <i>(Calib Range)</i>: (${esc(h.min)} ÷ ${esc(h.max)}) ${esc(h.unit)}<br>Áp suất đặt <i>(Set point)</i>: ${esc(h.pset)} ${esc(h.unitPset)}<br>Độ chính xác <i>(Accuracy)</i>: ±${esc(h.acc)}% Pset`;
    const typeRow = PT
      ? `<tr><td>Kiểu <i>(Type)</i>: ${esc(h.model)}</td><td>Số <i>(Serial No)</i>/Mã QL <i>(Tag No)</i>: ${esc(h.serial)}/<b>${esc(h.tag)}</b></td></tr>`
      : `<tr><td>Kiểu <i>(Type)</i>: ${esc(h.model)}</td><td>Mã QL <i>(Tag No)</i>: <b>${esc(h.tag)}</b><br>Số hiệu <i>(Serial No.)</i>: ${esc(h.serial)}</td></tr>`;
    const sRow = (lab, en, k) => `<tr><td class="ind">${lab} <i>(${en})</i>:</td><td>${esc(s1[k] || "")}</td>${PT ? `<td>${esc(s2[k] || "")}</td>` : ""}</tr>`;
    return `<section class="a4">${header(st)}${draft(info)}
      <h1>GIẤY CHỨNG NHẬN HIỆU CHUẨN</h1><div class="sub"><i><b>(Calibration Certificate)</b></i></div>
      <div class="no">Số <i>(N<sup>o</sup>)</i>: ${esc(rec.certNo)}</div>
      <table class="kv">
        <tr><td>Tên đối tượng <i>(Object)</i>:</td><td>${obj}</td></tr>
        ${typeRow}
        <tr><td>Nơi sản xuất <i>(Manufacturer)</i>:</td><td>${esc(h.maker)}</td></tr>
        <tr><td>Đặc trưng kỹ thuật đo lường<br><i>(Specification)</i>:</td><td>${spec}</td></tr>
        <tr><td>Cơ sở sử dụng <i>(Customer)</i>:</td><td>${esc(info.loc.custVN)}<br>Địa điểm lắp đặt <i>(Location)</i>: ${esc(info.loc.locVN)}</td></tr>
        <tr><td>Phương pháp thực hiện<br><i>(Method of calibration)</i>:</td><td>${esc(h.procedure)}<br><br>Điều kiện môi trường <i>(Environment)</i>:<br>${esc(h.env)}</td></tr>
      </table>
      <div class="lbl">Chuẩn được sử dụng <i>(Standards used)</i>:</div>
      <table class="kv std">
        ${sRow("Tên thiết bị", "Object", "name")}${sRow("Kiểu", "Model", "model")}${sRow("Số hiệu", "Serial No.", "serial")}
        ${sRow("Nơi sản xuất", "Manufacturer", "maker")}${sRow("Phạm vi đo", "Range", "range")}${sRow("Độ KĐBĐ", "Uncertainty", "unc")}${sRow("Dẫn xuất chuẩn", "Traceability", "trace")}
      </table>
      <table class="kv">
        <tr><td>Kết quả <i>(Result)</i>:</td><td>Xem kết quả hiệu chuẩn trang sau.<br><i>(The result of the calibration on the next page)</i></td></tr>
        <tr><td>Ngày hiệu chuẩn đề nghị kế tiếp<br><i>(Recalibration recommended)</i>:</td><td>${dVN(due)} <i>(${dEN(due)})</i></td></tr>
      </table>
      <div class="issue"><i class="red">${esc(st.place)}, ngày ${p2(iss.getDate())} tháng ${p2(iss.getMonth() + 1)} năm ${iss.getFullYear()}</i><br><i>(Date of issue)</i></div>
      ${sigBlock(st.sig1Title, st.sig1TitleEn, st.sig1Name, st.sig2Title, st.sig2TitleEn, st.sig2Name)}
      ${footer(st, 1, 2)}</section>`;
  }

  /* ---------------- Certificate page 2 (result) ---------------- */
  function certPage2(rec, res, st, info) {
    const h = rec.h, PT = rec.type === "PT", cal = toDate(h.calDate);
    let table, ueq;
    if (PT) {
      const rows = res.rows.map((r, i) => `<tr><td>${p2(i + 1)}</td><td>${fP(r.x)}</td><td>${f3(r.ideal)}</td><td>${f3(r.rise)}</td><td>${f3(r.fall)}</td><td>${f3(r.shcR)}</td><td>${f3(r.shcF)}</td><td>${C.roundUnc(r.U).text}</td></tr>`).join("");
      table = `<table class="res"><thead>
        <tr><th rowspan="2">TT<br><i>(N<sup>o</sup>)</i></th><th rowspan="2">AS đặt<br><i>(Input Pressure)</i><br>${esc(h.unit)}</th><th rowspan="2">Tín hiệu điện quy đổi<br><i>(Ideal Output Current)</i><br>mA</th>
        <th colspan="2">Giá trị dòng trên thiết bị<br><i>(Measured Output Current)</i><br>mA</th><th colspan="2">Số hiệu chính<br><i>(Correction)</i><br>mA</th><th rowspan="2">Độ KĐBĐ<br><i>(Uncertainty)</i><br>${esc(h.unit)}</th></tr>
        <tr><th>Tăng<br><i>(Increasing)</i></th><th>Giảm<br><i>(Decreasing)</i></th><th>Tăng<br><i>(Increasing)</i></th><th>Giảm<br><i>(Decreasing)</i></th></tr></thead><tbody>${rows}</tbody></table>`;
      ueq = `<p><u>Công thức hiệu chuẩn</u> <i>(Calibration equation)</i>: y = ${f3(res.a)} + ${f3(res.b)} x</p>
        <ul><li>x: giá trị áp suất chỉ thị trên phương tiện chuẩn.<br><i>(x: Value of Input pressure from standard device)</i></li>
        <li>y: giá trị tín hiệu điện chỉ trên phương tiện cần hiệu chuẩn.<br><i>(y: Value of Measured output current from transmitter)</i></li></ul>
        <p>Độ không đảm bảo đo mở rộng lớn nhất được tính ứng với độ tin cậy 95%, hệ số phủ k=2:<br><i>(The maximum expanded uncertainty is based upon a standard uncertainty multiplied by a coverage factor k = 2, providing a level of confidence of approximate 95%):</i></p>
        <p class="c">U<sub>exp-max</sub> = ${res.UmaxText.text} ${esc(h.unit)}</p>`;
    } else {
      const d = decimalsOf([h.pset, ...rec.ps.high, ...rec.ps.low]);
      const rows = res.set.map((v, i) => `<tr><td>${p2(i + 1)}</td><td>${i === 0 ? esc(h.pset) : ""}</td><td>${fN(v, d)}</td><td>${fN(res.reset[i], d)}</td><td>${fN(res.setDev[i], d)}</td><td>${fN(res.resetDev[i], d)}</td><td>${i === 0 ? res.Utext.text : ""}</td></tr>`).join("");
      const u = esc(h.unitPset);
      table = `<table class="res"><thead><tr><th>TT<br><i>(N<sup>o</sup>)</i></th><th>Áp suất đặt<br><i>(Pset)</i><br>${u}</th><th>Áp suất mở<br><i>(Set-Pressure)</i><br>${u}</th><th>Áp suất đóng<br><i>(Reset-Pressure)</i><br>${u}</th><th>Chênh mở<br><i>(Set-deviation)</i><br>${u}</th><th>Chênh đóng<br><i>(Reset-deviation)</i><br>${u}</th><th>Độ KĐBĐ<br><i>(Uncertainty)</i><br>${u}</th></tr></thead><tbody>${rows}</tbody></table>`;
      ueq = `<p>Độ không đảm bảo đo mở rộng được tính ứng với độ tin cậy 95%, hệ số phủ k=2:<br><i>(The reported expanded uncertainty is based upon a standard uncertainty multiplied by a coverage factor k = 2, providing a level of confidence of approximate 95%):</i></p>
        <p class="c">U = ${res.Utext.text} ${u}</p>`;
    }
    const pf = res.pass ? "Đạt (Pass)" : "Không đạt (Fail)";
    const en = res.pass ? "(The calibration result meets the accuracy requirement)." : "(The calibration result does not meet the accuracy requirement).";
    return `<section class="a4">${wm(st)}${header(st)}${draft(info)}
      <h1>KẾT QUẢ HIỆU CHUẨN</h1><div class="sub"><i><b>(Calibration Result)</b></i></div>
      <div class="c"><b>Kèm theo giấy chứng nhận hiệu chuẩn số</b> <i>(Attached to certificate No)</i>: ${esc(rec.certNo)}</div>
      <div class="tagline"><span>Tagname: <b>${esc(h.tag)}</b></span><span>Ngày hiệu chuẩn <i>(Calibration Date)</i>: ${dVN(cal)} <i>(${dEN(cal)})</i></span></div>
      ${table}
      <div class="box">${ueq}
        <p>Các thông tin khác <i>(Other information)</i>:</p>
        <ul><li>Phương tiện đo này không sử dụng để định lượng hàng hóa, dịch vụ trong mua bán, thanh toán, đảm bảo an toàn, bảo vệ sức khỏe cộng đồng, bảo vệ môi trường, trong thanh tra, kiểm tra, giám định tư pháp và trong các hoạt động công vụ khác.<br><i>(This equipment is not used to quantify goods and services in purchase and sale, payment, safety assurance, community health protection, environmental protection, inspection, examination, judicial expertise and in other official activities)</i></li>
        <li>Phương tiện đo này không được sử dụng trực tiếp để kiểm định phương tiện đo nhóm 2.<br><i>(This equipment is not used directly to verify the measuring instrument of group 2)</i></li></ul></div>
      <div class="box"><u>Ghi chú</u> <i>(Note)</i>: Kết quả hiệu chuẩn trên là <b>${pf}</b> với yêu cầu về độ chính xác của thiết bị<br><i>${en}</i></div>
      ${sigBlock("Người kiểm tra", "(Checked by)", rec.sig.controller, "Người thực hiện", "(Calibrated by)", rec.sig.inspector)}
      ${footer(st, 2, 2)}</section>`;
  }

  /* ---------------- QTG record (transcription of the handwritten sheet) ---------------- */
  function qtgPage(rec, res, st, info) {
    const h = rec.h, PT = rec.type === "PT", cal = toDate(h.calDate);
    const kv = (a, b) => `<tr><td>${a}</td><td>${esc(b)}</td></tr>`;
    const s1 = info.stand1, s2 = info.stand2;
    const left = [
      kv("Số chứng chỉ", rec.certNo), kv("Location", `${h.location} – ${info.loc.locVN}`), kv("Tag Name", h.tag),
      kv("Description", PT ? h.description : h.description), kv("Dut Model", h.model), kv("Dut Serial", h.serial), kv("Dut Manufacture", h.maker),
      kv("Min / Max Range", `${h.min} ÷ ${h.max} ${h.unit}`), kv("Dut Accuracy", PT ? `±${h.acc}%FS` : `±${h.acc}% Pset`),
      PT ? "" : kv("Pset", `${h.pset} ${h.unitPset}`), PT ? "" : kv("Type / Microswitch", `${h.psType} / ${h.micro}`), PT ? "" : kv("Rising/Falling (QTG)", h.dirQTG),
      kv("Stand1 (áp suất)", s1 ? `${s1.key} – S/N ${s1.serial}` : ""), PT ? kv("Stand2 (điện)", s2 ? `${s2.key} – S/N ${s2.serial}` : "") : "",
      kv("Calibration Date", dVN(cal)), kv("Đã hiệu chỉnh áp suất", "Yes"), kv("Phương pháp", h.procedure), kv("Môi trường", h.env)
    ].join("");
    let data;
    if (PT) {
      data = `<table class="res"><thead><tr><th>Điểm</th><th>Standard Pressure<br>${esc(h.unit)}</th><th>Instrument – Rising<br>(mA)</th><th>Instrument – Falling<br>(mA)</th></tr></thead><tbody>
        ${rec.pt.points.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x)}</td><td>${esc(rec.pt.rise[i])}</td><td>${esc(rec.pt.fall[i])}</td></tr>`).join("")}</tbody></table>`;
    } else {
      data = `<table class="res"><thead><tr><th>Lần</th><th>Instrument – P.High<br>${esc(h.unitPset)}</th><th>Instrument – P.Low<br>${esc(h.unitPset)}</th></tr></thead><tbody>
        ${rec.ps.high.map((v, i) => `<tr><td>${i + 1}</td><td>${esc(v)}</td><td>${esc(rec.ps.low[i])}</td></tr>`).join("")}</tbody></table>`;
    }
    return `<section class="a4">${draft(info)}
      <div class="formcode">QTG – ${esc(rec.type)} · bản số hoá</div>
      <h1>BIÊN BẢN HIỆU CHUẨN – SỐ LIỆU HIỆN TRƯỜNG</h1><div class="sub"><i>(Calibration field record – QTG)</i></div>
      <table class="kv qtg">${left}</table>
      <div class="lbl">Số liệu đo:</div>${data}
      ${rec.h.note ? `<div class="box">Ghi chú: ${esc(rec.h.note)}</div>` : ""}
      <div class="lbl">Kết luận sơ bộ: <b>${res.pass ? "Đạt (Pass)" : "Không đạt (Fail)"}</b></div>
      ${sigBlock("Người kiểm tra", "(Người kiểm soát)", rec.sig.controller, "Người thực hiện", "(Kiểm định viên)", rec.sig.inspector)}
      <div class="ftr"><span>Bản số hoá từ QTG giấy. Bố cục tạm thời – chờ mẫu QTG chuẩn (KĐHC Giàn Rồng / mẫu 2026).</span><span>QTG</span></div></section>`;
  }

  /* ---------------- Uncertainty calculation sheet (for the Quality Checker) ---------------- */
  function uncPage(rec, res, st, info) {
    const h = rec.h, PT = rec.type === "PT";
    const form = PT ? st.PT.form : st.PS.form;
    const kv = (a, b, c = "") => `<tr><td>${a}</td><td class="num">${b}</td><td>${c}</td></tr>`;
    let body;
    if (PT) {
      const s1 = info.stand1, s2 = info.stand2;
      const top = `<table class="kv unc">
        ${kv("Thiết bị được hiệu chuẩn (DUT)", esc(h.description), "Output 4–20 mA")}
        ${kv("Phạm vi đo (Min / Max)", `${h.min} / ${h.max}`, esc(h.unit))}
        ${kv("Stand1", esc(s1.key), `${s1.min}÷${s1.max} ${s1.unit} · U=${s1.unc} ${s1.uncUnit} · hệ số đổi đơn vị ×${g(res.factor1, 10)}`)}
        ${kv("E9 / E10 Stand1 min / FS (đơn vị DUT)", `${g(res.E9)} / ${g(res.E10)}`, esc(h.unit))}
        ${kv("E11 ĐKĐBĐ Stand1 (đơn vị DUT)", g(res.E11), esc(h.unit))}
        ${kv("E12 ĐKĐBĐ quy đổi", g(res.E12), "%")}${kv("E13 % of Reading", g(res.E13), "%")}
        ${kv("Stand2", esc(s2.key), `${s2.min}÷${s2.max} ${s2.unit} · U=${s2.unc} ${s2.uncUnit} · %Rdg=${s2.rdg}`)}
        ${kv("H12 ĐKĐBĐ Stand2 quy đổi", g(res.H12), "%")}
        ${kv("Hệ số phủ k", res.k)}${kv("Đã hiệu chỉnh áp suất (G14)", "Yes", "x dùng trực tiếp, không qua bảng Stand Correct")}
      </table>`;
      const cols = res.cols;
      const hd = cols.map((c, j) => `<th>${j < cols.length / 2 ? "R" : "F"}${(j % (cols.length / 2)) + 1}</th>`).join("");
      const row = (lab, f) => `<tr><td class="l">${lab}</td>${cols.map(c => `<td>${f(c)}</td>`).join("")}</tr>`;
      const grid = `<table class="res tiny"><thead><tr><th class="l">Hàng</th>${hd}</tr></thead><tbody>
        ${row("19 Standard Pressure xi", c => g(c.x))}${row("21 Standard Current (mA)", c => g(c.I))}${row("22 Instrument Yi (mA)", c => g(c.y))}
        ${row("23 uA,i (mA)", c => g(c.uAmA, 4))}${row("24 uA,i (%)", c => g(c.uA, 4))}${row("38 us,i (%)", c => g(c.us, 4))}${row("25 Uc,i (%)", c => g(c.uc, 4))}</tbody></table>`;
      const reg = `<table class="kv unc">
        ${kv("F28 Hệ số b (LINEST)", g(res.b, 8))}${kv("F29 Hệ số a (LINEST)", g(res.a, 8))}
        ${kv("F33 Sy = STEYX", g(res.Sy, 6), "mA")}${kv("F34 Sa", g(res.Sa, 6))}${kv("F35 Sb", g(res.Sb, 6))}${kv("F36 r(a,b)", g(res.r, 6))}
        ${kv("F39 uv (Vôn/Ampe kế)", g(res.uv, 6), "%")}</table>`;
      const out = `<table class="res"><thead><tr><th>Áp suất chuẩn</th><th>Quy đổi mA</th><th>DUT tăng</th><th>DUT giảm</th><th>SHC tăng</th><th>SHC giảm</th><th>Uc,i(tb) %</th><th>Uexp %</th><th>Uexp ${esc(h.unit)}</th></tr></thead><tbody>
        ${res.rows.map(r => `<tr><td>${g(r.x)}</td><td>${g(r.ideal)}</td><td>${r.rise}</td><td>${r.fall}</td><td>${g(r.shcR, 4)}</td><td>${g(r.shcF, 4)}</td><td>${g(r.ucAvg, 5)}</td><td>${g(r.Upct, 5)}</td><td>${g(r.U, 6)}</td></tr>`).join("")}</tbody></table>`;
      const judge = `<table class="kv unc">
        ${kv("Uexp max (Data112!CZ)", g(res.Umax, 6), `${esc(h.unit)} → in chứng chỉ: ${res.UmaxText.text}`)}
        ${kv("Giới hạn Uexp = acc% × span", g(res.limU, 6), `${esc(h.unit)} · ${res.checks.uOK ? "OK" : "VƯỢT"}`)}
        ${kv("|SHC| max", g(res.shcMax, 4), `mA · giới hạn acc% × 16 = ${g(res.limI, 4)} mA · ${res.checks.iOK ? "OK" : "VƯỢT"}`)}
        ${kv("Kết luận (Data112!IF)", res.pass ? "Đạt (Pass)" : "Không đạt (Fail)")}</table>`;
      body = top + `<div class="lbl">Bảng tính từng điểm (R = Rising, F = Falling):</div>` + grid + reg + `<div class="lbl">Kết quả hiệu chuẩn:</div>` + out + judge;
    } else {
      const s1 = info.stand1;
      const rows = res.hi.map((v, i) => `<tr><td>${i + 1}</td><td>${i === 0 ? h.pset : ""}</td><td>${v}</td><td>${res.lo[i]}</td><td>${g(res.G[i], 5)}</td><td>${g(res.H[i], 5)}</td></tr>`).join("");
      body = `<table class="kv unc">
        ${kv("Thiết bị được hiệu chuẩn (DUT)", esc(h.description))}${kv("E6 Độ chính xác", h.acc, "% Pset")}
        ${kv("E7 Giá trị đặt Pset", h.pset, esc(h.unitPset))}${kv("I7 Hiệu chỉnh áp suất", "Yes")}
        ${kv("E8 Độ chia nhỏ nhất thước đặt mức", h.resolution || 0, esc(h.unitPset))}
        ${kv("E9 Chiều tác động (tự xác định)", res.dir, `QTG ghi: ${esc(h.dirQTG || "")}`)}
        ${kv("Stand1", esc(s1.key), `${s1.min}÷${s1.max} ${s1.unit} · U=${s1.unc} ${s1.uncUnit} · hệ số đổi ×${g(res.factor1, 10)}`)}
        ${kv("E11 / E12 Stand min / Full scale", `${g(res.E11)} / ${g(res.E12)}`, esc(h.unitPset))}
        ${kv("E13 ĐKĐBĐ chuẩn", g(res.E13), esc(h.unitPset))}${kv("E14 ĐKĐBĐ quy đổi", g(res.E14), "%")}${kv("G14 % of Rdg", g(res.G14), "%")}
        ${kv("E16 k chuẩn / E17 n / E18 k Student", `2 / 5 / ${res.k}`)}</table>
        <table class="res"><thead><tr><th>Lần</th><th>Pset</th><th>Pm (P.High)</th><th>Pđ (P.Low)</th><th>DPcm = Pset−Pm</th><th>DPcđ = Pset−Pđ</th></tr></thead><tbody>${rows}</tbody></table>
        <table class="kv unc">
        ${kv("F28 Pm trung bình", g(res.F28, 8))}${kv("F29 Pđ trung bình", g(res.F29, 8))}
        ${kv("F26 uA áp suất mở", g(res.F26, 6))}${kv("F27 uA áp suất đóng", g(res.F27, 6))}
        ${kv("F31 uB chuẩn", g(res.F31, 6))}${kv("F32 uB độ phân giải", g(res.F32, 6))}
        ${kv("F34 / F35 uc mở / đóng", `${g(res.F34, 6)} / ${g(res.F35, 6)}`)}
        ${kv("F37 / F38 U mở / đóng (k=2)", `${g(res.F37, 6)} / ${g(res.F38, 6)}`)}
        ${kv("I42 U báo cáo", g(res.U, 6), `${esc(h.unitPset)} → in chứng chỉ: ${res.Utext.text}`)}
        ${kv("J42 max|Set-dev| + U", g(res.J42, 6))}${kv("K42 Giới hạn acc% × Pset", g(res.K42, 6))}
        ${kv("D47 Kết luận", res.pass ? "Đạt (Pass)" : "Không đạt (Fail)")}</table>`;
    }
    return `<section class="a4">${draft(info)}
      <div class="formcode">${esc(form)}</div>
      <h1 class="sm">BẢNG TÍNH TOÁN ĐỘ KHÔNG ĐẢM BẢO ĐO CỦA PHÉP HIỆU CHUẨN</h1>
      <div class="sub">No.: ${esc(rec.certNo)} · Tag: ${esc(h.tag)} · ${PT ? "Pressure transmitter Uncertainty Calculation Report" : "Uncertainty Calculation Form"}</div>
      ${body}
      ${sigBlock("Người kiểm tra", "(Quality Checker)", rec.sig.controller, "Người thực hiện", "(Kiểm định viên)", rec.sig.inspector)}
      <div class="ftr"><span>Tính theo logic ${PT ? "DLVN112-2002_Rev2" : "DLVN133 - 2004"} (file Uncer Form 2024). Ô Excel ghi kèm để đối chiếu.</span><span>ĐKĐBĐ</span></div></section>`;
  }

  window.LabDocs = { certPage1, certPage2, qtgPage, uncPage, dVN, dEN, toDate, esc };
})();
