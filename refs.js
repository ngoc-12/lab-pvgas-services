/* LAB PVGAS Services – tab "Căn cứ": hệ thống văn bản đang áp dụng (ISO/IEC, VILAS, ĐLVN, quy trình nội bộ).
 * Yêu cầu NGOC 31/10/2026: GCN giữ nguyên form chuẩn, không thêm gì; thay vào đó có tab riêng cho thấy phòng đang áp dụng
 * văn bản hiện hành. Dữ liệu chỉ lấy từ nguồn đã tra (phạm vi VILAS 389 05/2025 trên boa.gov.vn, các phạm vi VILAS 2025–2026
 * của phòng khác, iso.org, IEC webstore, BIPM). Rà soát ngày 31/10/2026.
 * File: chỉ gắn link tới bản chính thức. ISO/IEC có bản quyền, không đưa file lên. Quy trình nội bộ DVK.LAB.TM không công khai
 * (repo/GitHub Pages là public). Muốn đính kèm PDF ĐLVN: chép vào thư mục refs/ rồi điền trường file. */
(function () {
  "use strict";
  const REVIEWED = "31/10/2026";
  const BOA389 = "https://boa.gov.vn/sites/default/files/2025-05/389l0525hc.pdf";
  const DLVN_LIST = "https://tcvn.gov.vn/van-ban-ky-thuat-do-luong-viet-nam-dlvn/31/08/2017/";

  const ACCRED = [
    { code: "ISO/IEC 17025:2017", vn: "TCVN ISO/IEC 17025:2017",
      title: "Yêu cầu chung về năng lực của phòng thử nghiệm và hiệu chuẩn",
      use: "Chuẩn mực công nhận của phòng hiệu chuẩn (VILAS 389).",
      state: "Hiện hành – ISO rà soát và xác nhận lại năm 2023; chưa có phiên bản mới.",
      links: [["iso.org", "https://www.iso.org/standard/66912.html"]] },
    { code: "VILAS 389", title: "Phạm vi được công nhận – Văn phòng Công nhận Chất lượng (BoA)",
      use: "Lĩnh vực đo lường – hiệu chuẩn: áp suất, nhiệt độ.",
      state: "Hiệu lực đến 09/05/2030.",
      links: [["Phạm vi VILAS 389 (PDF, boa.gov.vn)", BOA389]] }
  ];

  // Theo bộ app. vilas: dòng tương ứng trong phạm vi VILAS 389. gcn: khoá settings để hiện "Đang in trên GCN".
  const PROC = [
    { t: "PT", name: "Bộ chuyển đổi / truyền áp suất", docs: [
      { code: "DVK.LAB.TM.21:2025", kind: "Quy trình hiệu chuẩn nội bộ", internal: true },
      { code: "ĐLVN 112:2002", kind: "Quy trình hiệu chuẩn (cơ sở bảng tính độ KĐBĐ)" }] },
    { t: "PS", name: "Công tắc áp suất", docs: [{ code: "ĐLVN 133:2004", kind: "Quy trình hiệu chuẩn" }] },
    { t: "PG", name: "Áp kế kiểu lò xo – kiểm định", docs: [
      { code: "ĐLVN 08:2011", kind: "Quy trình kiểm định", noVilas: true,
        links: [["PDF chính thức (tcvn.gov.vn)", "https://tcvn.gov.vn/wp-content/uploads/2017/08/DLVN_08-2011.pdf"]] }] },
    { t: "DPG", name: "Áp kế / chênh áp kế lò xo và hiện số", docs: [
      { code: "DVK.LAB.TM.22:2025", kind: "Quy trình hiệu chuẩn nội bộ", internal: true },
      { code: "ĐLVN 76:2001", kind: "Quy trình hiệu chuẩn (cơ sở bảng tính độ KĐBĐ)" }] },
    { t: "TS", name: "Công tắc nhiệt độ", docs: [{ code: "DVK.LAB.TM.13:2024", kind: "Quy trình hiệu chuẩn nội bộ", internal: true }] },
    { t: "TT", name: "Bộ chuyển đổi / truyền nhiệt độ", docs: [{ code: "DVK.LAB.TM.12:2024", kind: "Quy trình hiệu chuẩn nội bộ", internal: true }] },
    { t: "RTD", name: "Nhiệt kế điện trở platin công nghiệp", docs: [{ code: "ĐLVN 125:2003", kind: "Quy trình hiệu chuẩn" }] },
    { t: "TG", name: "Nhiệt kế chỉ thị hiện số và tương tự", docs: [{ code: "ĐLVN 138:2004", kind: "Quy trình hiệu chuẩn" }] },
    { t: "TC", name: "Cặp nhiệt điện công nghiệp", docs: [{ code: "ĐLVN 161:2005", kind: "Quy trình hiệu chuẩn" }] }
  ];
  const SCOPE_ONLY = [{ code: "ĐLVN 160:2005", name: "Thiết bị chỉ thị nhiệt độ hiện số và tương tự" }];

  const TECH = [
    { code: "IEC 60751:2022", title: "Industrial platinum resistance thermometers and platinum temperature sensors",
      use: "Bộ RTD: giá trị điện trở chuẩn Pt100 cho điểm không có trong bảng của file tính.",
      links: [["IEC webstore", "https://webstore.iec.ch/publication/63753"]] },
    { code: "IEC 60584-1:2013", title: "Thermocouples – Part 1: EMF specifications and tolerances",
      use: "Bộ TC: hàm chuẩn và hàm ngược sức điện động theo ITS-90 (loại J, K).",
      links: [["IEC webstore", "https://webstore.iec.ch/publication/2521"]] }
  ];

  // Chỉ hiện cho cấp 3: các điểm rà soát chưa khép lại – không phải nội dung trình bày cho khách.
  const OPEN = [
    "ĐLVN 08:2011 (kiểm định áp kế) không nằm trong phạm vi hiệu chuẩn VILAS 389; chưa đối chiếu được với danh mục chính thức của Ủy ban TCĐLCL Quốc gia (tcvn.gov.vn chặn truy cập lúc rà soát).",
    "Quyết định 2025 \"ban hành 06 ĐLVN chuẩn đo lường và 02 soát xét\" (tcvn.gov.vn) chưa đọc được – cần mở để xác nhận 2 văn bản soát xét không thuộc các số đang dùng.",
    "File Excel TT đặt tên sheet \"DLVN188.2-2\" – không có ĐLVN 188 trong phạm vi nào; file Data76 có ô ghi \"ĐLVN 76:2002\" (đúng là 76:2001)."
  ];

  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lk = a => (a || []).map(([t, u]) => `<a class="rlink" href="${esc(u)}" target="_blank" rel="noopener">${esc(t)} ↗</a>`).join("");
  const pill = (cls, t) => `<span class="rpill ${cls}">${t}</span>`;

  function render(settings, role) {
    const doc = (d, gcn) => {
      const st = d.internal ? pill("int", "Nội bộ · VILAS 389") : d.noVilas ? pill("chk", "Kiểm định") : pill("ok", "Hiện hành");
      const links = d.internal ? `<span class="mut rnote">Bản gốc lưu tại phòng – không công bố trực tuyến.</span>`
        : lk(d.links || [["Danh mục ĐLVN (tcvn.gov.vn)", DLVN_LIST]]) + (d.file ? `<a class="rlink" href="${esc(d.file)}" download>Tải PDF</a>` : "");
      return `<div class="rdoc"><div class="rhead"><b>${esc(d.code)}</b>${st}</div><div class="mut">${esc(d.kind)}</div><div class="rlinks">${links}</div></div>`;
    };
    const procs = PROC.map(p => {
      const gcn = settings && settings[p.t] && settings[p.t].procedure;
      return `<div class="rrow"><div class="rtype"><span class="rt">${p.t}</span><span>${esc(p.name)}</span></div>
        ${p.docs.map(d => doc(d)).join("")}
        ${gcn ? `<div class="rgcn mut">Đang in trên GCN: <b>${esc(gcn)}</b></div>` : ""}</div>`;
    }).join("");
    const card = x => `<div class="rdoc"><div class="rhead"><b>${esc(x.code)}</b>${pill("ok", "Hiện hành")}</div>
      ${x.vn ? `<div class="mut">${esc(x.vn)}</div>` : ""}<div>${esc(x.title)}</div>
      <div class="rnote">${esc(x.use)}</div>${x.state ? `<div class="rnote ok">${esc(x.state)}</div>` : ""}<div class="rlinks">${lk(x.links)}</div></div>`;

    return `<div class="card rhero">
        <div class="rtop"><div><div class="rbadge">✓ Đã rà soát ${REVIEWED}</div><h2>Căn cứ kỹ thuật</h2></div><img src="assets/vilas.jpg" alt="VILAS 389"></div>
        <p>LAB PVGAS Services hoạt động theo <b>ISO/IEC 17025:2017</b>, được công nhận <b>VILAS 389</b> (hiệu lực đến 09/05/2030).
        Mọi quy trình dưới đây đã được đối chiếu với phạm vi công nhận và các phạm vi VILAS cấp năm 2025–2026: <b>tất cả là phiên bản hiện hành</b>.</p>
        <div class="rstats"><div><b>9</b><span>bộ thiết bị</span></div><div><b>${PROC.reduce((n, p) => n + p.docs.filter(d => !d.internal).length, 0)}</b><span>văn bản ĐLVN</span></div><div><b>4</b><span>quy trình nội bộ</span></div></div>
      </div>
      <div class="card"><h2>Công nhận & hệ thống chất lượng</h2>${ACCRED.map(card).join("")}</div>
      <div class="card"><h2>Quy trình áp dụng theo từng bộ</h2>
        <p class="hint">Quy trình nội bộ DVK.LAB.TM được BoA công nhận trong phạm vi VILAS 389. ĐLVN: Văn bản kỹ thuật đo lường Việt Nam.</p>${procs}
        <div class="rrow"><div class="rtype"><span class="rt sm">+</span><span>Trong phạm vi VILAS 389, chưa có trên app</span></div>
        ${SCOPE_ONLY.map(s => `<div class="rdoc"><div class="rhead"><b>${s.code}</b>${pill("ok", "Hiện hành")}</div><div class="mut">${esc(s.name)}</div></div>`).join("")}</div>
      </div>
      <div class="card"><h2>Tiêu chuẩn kỹ thuật tham chiếu</h2>${TECH.map(card).join("")}
        <p class="hint">Tiêu chuẩn ISO/IEC có bản quyền: app chỉ dẫn link tới nơi phát hành chính thức, không lưu file.</p></div>
      <div class="card"><h2>Nguồn rà soát</h2><div class="rlinks col">
        ${lk([["Phạm vi VILAS 389 – 05/2025", BOA389],
          ["VILAS 1288 – 06/2026", "https://boa.gov.vn/sites/default/files/2026-06/1288l.hc-062026-final-15.6.pdf"],
          ["VILAS 1407 – 04/2026", "https://boa.gov.vn/sites/default/files/2026-04/1407tt0426.pdf"],
          ["VILAS 216 – 12/2025", "https://boa.gov.vn/sites/default/files/2025-12/vilas-216tt1225na.pdf"],
          ["VILAS 212 – 10/2025", "https://boa.gov.vn/sites/default/files/2025-10/212l1025.pdf"],
          ["VILAS 072 (Viện Đo lường VN) – 05/2025", "https://boa.gov.vn/sites/default/files/2025-05/vilas-072-l-05.25-nhiet.pdf"],
          ["Danh mục ĐLVN – tcvn.gov.vn", DLVN_LIST]])}</div></div>
      ${role >= 3 ? `<div class="card"><h2>Điểm rà soát còn mở <small>(chỉ cấp 3 thấy)</small></h2><ul class="ropen">${OPEN.map(o => `<li>${esc(o)}</li>`).join("")}</ul></div>` : ""}`;
  }
  window.LabRefs = { render, PROC, ACCRED, TECH, REVIEWED };
})();
