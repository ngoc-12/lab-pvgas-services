/* LAB PVGAS Services – tab "Công thức": công thức toán học của 9 bộ, viết lại đúng theo code đang chạy (calc.js / calc2.js),
 * mà code đó đã được đối chiếu với các file Uncer Excel của anh Khai (ô Excel ghi trong ngoặc vuông).
 * Yêu cầu NGOC 31/10/2026: người dùng hiểu app đang tính gì. Mục "Khác file Excel" liệt kê mọi chỗ app không làm giống hệt file. */
(function () {
  "use strict";
  // f(): one formula line – math, then Excel cell / note
  const f = (math, ref) => `<div class="fx"><div class="fm">${math}</div>${ref ? `<div class="fr">${ref}</div>` : ""}</div>`;
  const h = t => `<h4>${t}</h4>`;
  const p = t => `<p>${t}</p>`;
  const ul = a => `<ul>${a.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const diff = a => `<div class="fdiff"><b>Khác file Excel / cần lưu ý</b>${ul(a)}</div>`;
  const sq = x => `√(${x})`;
  const STD = `Chuẩn quy đổi sang đơn vị thiết bị: hệ số đổi đơn vị theo bảng Stand!A4:K14 (1 bar = 100 kPa = 14,503773773 psi = 1,019716213 kg/cm² = 1000 mbar = 401,47 inH₂O = 10197,162 mmH₂O).`;
  const HEAT = f(`u<sub>lò</sub> = ${sq("(ổn định/√3)² + (radial/√3)² + (axial/√3)²")}`, "Stand!Stability / Radial / Axial – phân bố chữ nhật");

  const SECTIONS = [
    { id: "PT", t: "PT / DPT – Transmitter áp suất 4–20 mA", src: "PT_DGCP_10_2026.xls · sheet DLVN112-2002_Rev2 + Data112 · khớp 31/31 hồ sơ DGCP 10/2026",
      body: h("1. Dữ liệu") + ul(["x<sub>i</sub>: áp suất chuẩn tại 5 điểm, y: dòng đo tăng và giảm (10 cặp x–y)", "Phạm vi Min ÷ Max, span = Max − Min, độ chính xác acc (%FS), k = 2", STD])
        + h("2. Dòng lý tưởng và hồi quy")
        + f("I<sub>j</sub> = 4 + 16·(x<sub>j</sub> − Min)/span", "[hàng 21]")
        + f("y = a + b·x (bình phương tối thiểu, 10 điểm)", "[F28 = b, F29 = a]")
        + f(`S<sub>y</sub> = ${sq("(Σ(y−ȳ)² − (Σ(x−x̄)(y−ȳ))²/Σ(x−x̄)²)/(n−2)")}`, "[F33 = STEYX]")
        + f(`S<sub>a</sub> = S<sub>y</sub>·${sq("ΣI²/(n·Σ(I−Ī)²)")} ; S<sub>b</sub> = S<sub>y</sub>·${sq("1/Σ(I−Ī)²")} ; r = −ΣI/${sq("n·ΣI²")}`, "[F34, F35, F36]")
        + h("3. Thành phần độ KĐBĐ (tính bằng % span)")
        + f(`u<sub>A</sub>(mA) = ${sq("S<sub>a</sub>² + I²·S<sub>b</sub>² + 2·I·S<sub>a</sub>·S<sub>b</sub>·r")} ; u<sub>A</sub>(%) = 100·u<sub>A</sub>/16`, "[hàng 23, 24]")
        + f("E12 = U<sub>chuẩn</sub>/(Max<sub>chuẩn</sub> − Min<sub>chuẩn</sub>)·100 (%) ; E13 = %Rdg của chuẩn", "[E12, E13]")
        + f("u<sub>s</sub> = (E12·(Max<sub>chuẩn</sub> − Min<sub>chuẩn</sub>) + E13·|x|)/(2·span) &nbsp;&nbsp;(quả cân: E12·|x|/(2·span))", "[hàng 38]")
        + f(`u<sub>v</sub> = ${sq("(H12·(H10−H9)/(2·16))² + ((H13/(H10−H9))/(2√3))²")}`, "[F39] – chuẩn điện mA (Stand2)")
        + f(`u<sub>c</sub> = ${sq("u<sub>A</sub>² + u<sub>s</sub>² + u<sub>v</sub>²")}`, "[hàng 25]")
        + h("4. Độ KĐBĐ mở rộng theo điểm")
        + f("U%<sub>i</sub> = k·(u<sub>c,tăng</sub> + u<sub>c,giảm</sub>)/2 ; U<sub>i</sub> = U%<sub>i</sub>·span/100", "[I46, K46, J46]")
        + f("U<sub>max</sub> = max(U<sub>i</sub>)", "[Data112!CZ]")
        + h("5. Số hiệu chính và kết luận")
        + f("SHC = I<sub>lý tưởng</sub> − I<sub>đo</sub> (mA), tăng và giảm", "")
        + f("ĐẠT khi U<sub>max</sub> ≤ acc·span/100 và max|SHC| ≤ acc·16/100", "[Data112!IF]")
        + diff(["App chỉ làm trường hợp \"Đã hiệu chỉnh áp suất = Yes\" (số đọc chuẩn dùng trực tiếp) – như toàn bộ hồ sơ DGCP 10/2026.",
          "U in chứng chỉ: quy tắc NGOC 30/10/2026 – 2 chữ số có nghĩa, làm tròn LÊN (file Excel cộng nửa chữ số rồi làm tròn; ví dụ PT-1506A file in 0,080, app in 0,081).",
          "Không đạt: không cấp số chứng chỉ, không xuất chứng chỉ (quy tắc 30/10/2026)."]) },

    { id: "PS", t: "PS / DPS – Công tắc áp suất", src: "PS_DGCP_10_2026.xls · sheet \"DLVN133 - 2004\" + Data133 · khớp 13/13 hồ sơ DGCP 10/2026",
      body: h("1. Dữ liệu") + ul(["P<sub>set</sub>, 5 lần đọc P.High (tăng áp) và P.Low (giảm áp), độ chính xác acc (% Pset), độ chia thước đặt mức d, k = 2, n = 5", STD])
        + h("2. Chiều tác động")
        + f("G<sub>i</sub> = P<sub>set</sub> − P.High<sub>i</sub> ; H<sub>i</sub> = P<sub>set</sub> − P.Low<sub>i</sub>", "[G20:H24]")
        + f("Falling nếu |trung bình G| > |trung bình H|, ngược lại Rising", "[E9]")
        + h("3. Độ KĐBĐ")
        + f(`u<sub>A,mở</sub> = ${sq("Σ(P.High − P̄.High)²/(n(n−1))")} ; u<sub>A,đóng</sub> tương tự với P.Low`, "[F26, F27]")
        + f("E14 = U<sub>chuẩn</sub>/(FS − Min)·100 (%) ; G14 = %Rdg chuẩn", "")
        + f("u<sub>B,chuẩn</sub> = (E14·FS + G14·P<sub>set</sub>)/(100·2) &nbsp;&nbsp;(quả cân: E14·P<sub>set</sub>/200)", "[F31]")
        + f("u<sub>B,phân giải</sub> = d/2", "[F32]")
        + f(`u<sub>c</sub> = ${sq("u<sub>A</sub>² + u<sub>B,chuẩn</sub>² + (u<sub>B,phân giải</sub>/√3)²")}`, "[F34 mở, F35 đóng]")
        + f("U = k·u<sub>c</sub> của chiều tác động (Rising → mở, Falling → đóng)", "[F37, F38, I42]")
        + h("4. Kết luận")
        + f("ĐẠT khi max|Set − P<sub>set</sub>| + U ≤ acc·P<sub>set</sub>/100", "[J42 ≤ K42, D47]")
        + diff(["U in chứng chỉ: 2 chữ số có nghĩa, làm tròn LÊN, dấu chấm thập phân (quy tắc 30/10/2026).",
          "QTG đánh dấu chiều tác động bằng tay; nếu khác chiều do số liệu suy ra (ô E9) thì app cảnh báo."]) },

    { id: "PG", t: "PG – Áp kế lò xo (kiểm định)", src: "PG_08_Data_Rev2026_Oct-2026.xlsm · sheet Data08 · ĐLVN 08:2011",
      body: p("Kiểm định – không tính độ KĐBĐ.")
        + f("SHC<sub>tăng</sub> = P<sub>chuẩn</sub> − P<sub>đọc tăng</sub> ; SHC<sub>giảm</sub> = P<sub>chuẩn</sub> − P<sub>đọc giảm</sub>", "[AX..BG]")
        + f("Sai số cho phép = acc·(Max − Min)/100", "[EX]")
        + f("ĐẠT khi max|SHC| ≤ sai số cho phép", "[EY, EV]")
        + f("Sụt áp chuẩn = (P<sub>trước</sub> − P<sub>sau</sub>)/P<sub>trước</sub>·100 &lt; 5 %", "mẫu QTG")
        + diff(["Sheet tháng 10/2026 trỏ SHC chiều tăng nhầm sang cột Falling; app dùng số đọc chiều tăng (như bố cục tháng 5/2026).",
          "Hệ số sai số 0,8 / 1,0 trên QTG chỉ để in – Data08 không dùng khi kết luận."]) },

    { id: "DPG", t: "DPG / PDI – Đồng hồ chênh áp", src: "DVK_ĐVT_PG GPP_2026_KNV.xls · sheet DLVN76_2001 + Data76 · khớp 8/8 hồ sơ PDI GPP 2026",
      body: h("1. Hồi quy (10 cặp chuẩn x – đọc y, tăng và giảm)")
        + f("y = a + b·x ; S<sub>y</sub>, S<sub>a</sub>, S<sub>b</sub>, r như PT nhưng tính theo x (áp suất), không theo dòng", "[F26, F27, F31:F34]")
        + h("2. Thành phần")
        + f(`u<sub>A</sub> = ${sq("S<sub>a</sub>² + x²·S<sub>b</sub>² + 2·x·S<sub>a</sub>·S<sub>b</sub>·r")} (đơn vị đồng hồ)`, "[hàng 22]")
        + f("u<sub>s</sub> = (E12·(Max<sub>chuẩn</sub> − Min<sub>chuẩn</sub>) + E13·|x|)/(2·span) (%)", "[hàng 36]")
        + f("u<sub>v</sub> = (d·100/span)/√6/2 (%) &nbsp;&nbsp; d = độ chia nhỏ nhất", "[F37]")
        + f(`u<sub>c</sub> = ${sq("u<sub>A</sub>² + u<sub>s</sub>² + u<sub>v</sub>²")}`, "[hàng 23]")
        + f("U%<sub>i</sub> = k·(u<sub>c,tăng</sub> + u<sub>c,giảm</sub>)/2 ; U<sub>i</sub> = U%<sub>i</sub>·span/100 ; U<sub>max</sub> = max U<sub>i</sub>", "[I44, K44, J44, Data76!CR]")
        + f("ĐẠT khi U<sub>max</sub> + max|SHC| ≤ acc·span/100", "[HX, IA]")
        + diff(["Hàng 23 của file cộng u<sub>A</sub> (đơn vị đồng hồ) chung với các thành phần % – app giữ nguyên như file.",
          "GCN mẫu PDI-0101 in U = 1,05 do ô GI bị sửa tay (ROUNDUP); công thức chuẩn của file cho 1,041.",
          "Công thức hiệu chuẩn trên GCN mẫu in \"y = 0.000 + 0.001 x\" (lỗi mẫu); app in a, b thật.",
          "APM30: %Rdg trong file 0,001, thư viện chuẩn của app 0 – chờ NGOC chốt."]) },

    { id: "TS", t: "TS – Công tắc nhiệt độ", src: "LFS_TS 09 2026.xls · sheet DLVNTM13 + DataTM13 · DVK.LAB.TM.13",
      body: f("T<sub>m</sub> = 5 lần nhiệt độ tác động chiều được chọn ; T<sub>d</sub> = 5 lần chiều còn lại", "[C23:C27, D23:D27]")
        + f(`u<sub>tm</sub> = ${sq("Σ(T<sub>m</sub> − T̄<sub>m</sub>)²/(n(n−1))")} ; u<sub>td</sub> tương tự`, "[F30, F31]")
        + f("u<sub>ch1</sub> = U<sub>chuẩn</sub>/k ; u<sub>ch2</sub> = 0 (chỉ dùng khi có SPRT/BlackStack)", "[F33, F34]")
        + HEAT.replace("u<sub>lò</sub>", "u<sub>ch3</sub>")
        + f(`u<sub>ch</sub> = ${sq("u<sub>ch1</sub>² + u<sub>ch2</sub>² + u<sub>ch3</sub>²")} ; u<sub>c</sub> = ${sq("u<sub>tm</sub>² + u<sub>ch</sub>²")} ; U = k·u<sub>c</sub>`, "[F36, F38/F39, F41/F42]")
        + f("Set-deviation = T<sub>set đọc</sub> − T<sub>set</sub> ; ĐẠT khi U &gt; 0 và max|Set-deviation| ≤ acc·T<sub>set</sub>/100", "[D51]")
        + diff(["U in chứng chỉ: ROUND 2 chữ số như file (chưa áp quy tắc làm tròn lên – chờ NGOC chốt cho TS)."]) },

    { id: "TT", t: "TT – Transmitter nhiệt độ", src: "1.TT_LFS_CM_26.xls · sheets DLVN188.2-2 + STDEV calc + Data188 · DVK.LAB.TM.12",
      body: f("C<sub>j</sub> = span/16 (°C trên 1 mA) ; n = 3 lần đọc mỗi điểm", "[F7, F24]")
        + f("Dải của điểm theo số đọc chuẩn đầu tiên: ≤150 °C thấp ; 150–400 °C trung ; &gt;400 °C cao", "[F21:F23]")
        + f("T<sub>chuẩn</sub> = trung bình 6 số đọc chuẩn (tăng + giảm) ; I<sub>lý tưởng</sub> = 4 + 16·(T − Min)/span", "[E60, G60]")
        + f("SHC = I<sub>lý tưởng</sub> − I<sub>đo TB</sub> ; sai lệch % = max|SHC|/16·100", "[M60, O60]")
        + h("Mỗi dải (thấp / trung / cao)")
        + f("Ultb<sub>chuẩn</sub> = RMS các độ lệch chuẩn số đọc chuẩn trong dải ; u<sub>ch4</sub> = Ultb/√n", "[F36]")
        + f("u<sub>ch1</sub> = U<sub>chuẩn</sub>/2 ; u<sub>ch3</sub> = u<sub>lò</sub> ; u<sub>ch5</sub> = 0", "")
        + f(`u<sub>ch2</sub> (ampe kế) = ${sq("(L17·C<sub>j</sub>/2)² + (N17·C<sub>j</sub>/(2√3))²")}`, "[F40]")
        + f(`u<sub>ch</sub> = ${sq("u<sub>ch4</sub>² + u<sub>ch1</sub>² + u<sub>ch5</sub>² + u<sub>ch2</sub>² + u<sub>ch3</sub>²")}`, "")
        + f("u<sub>bk1</sub> = Ultb<sub>DUT</sub>·C<sub>j</sub>/√n ; u<sub>bk2</sub> = hồi trễ·C<sub>j</sub>/(2√3) ; u<sub>bk3</sub> = 0,5·độ phân giải·C<sub>j</sub>/√3", "[F49, F52]")
        + f(`u<sub>c</sub> = ${sq("u<sub>ch</sub>² + u<sub>bk1</sub>² + u<sub>bk2</sub>² + u<sub>bk3</sub>²")} ; U = 2·u<sub>c</sub>`, "")
        + f("ĐẠT khi max(sai lệch %, U<sub>thấp</sub>, U<sub>trung</sub>, U<sub>cao</sub>, max|SHC|) ≤ acc·span/100", "[FI, FJ]")
        + diff(["Điểm 1 phân dải bằng \"&lt;400\", các điểm khác \"≤400\" – giữ như file.",
          "Dải thấp chỉ có 1 điểm: chứng chỉ không in dòng U dải thấp (như Data188).",
          "U in chứng chỉ: 2 chữ số có nghĩa, làm tròn LÊN (quy tắc 30/10/2026)."]) },

    { id: "RTD", t: "RTD – Nhiệt điện trở Platin", src: "RTD_DK_CM_2026_.xls · sheet \"DLVN125 NK chuan + do Ohm\" + Data125 · ĐLVN 125:2003",
      body: f("R̄<sub>i</sub> = trung bình 5 lần đọc điện trở ; S<sub>i</sub> = độ lệch chuẩn", "[M31:R31, M32:Q32]")
        + f("Min ≥ 0: R(t) = R0 + R0A·t + R0B·t² (bình phương tối thiểu 5 điểm) ; Min &lt; 0: thêm bậc 3", "[AB38:AB40, AL39:AL42]")
        + f("A = (R0A)/R0 ; B = (R0B)/R0 ; C = −(hệ số bậc 3/100)/R0", "[AL53, AM53, AN53]")
        + f(`u<sub>DUT6</sub> = ${sq("Σ(R<sub>fit</sub> − R̄)²/((5−3)·S)")} &nbsp; S = độ nhạy Ω/°C`, "[Q36]")
        + f("O33 = ΣS<sub>i</sub>²/5 ; u<sub>DUT5</sub> = O33/(√n·S) ; u<sub>DUT4</sub> = |R̄<sub>6</sub> − R̄<sub>3</sub>|/(2√3·S)", "[Q34, Q35]")
        + f("u<sub>ch1</sub> = U<sub>chuẩn</sub>/k (Max ≥ 150 °C dùng chuẩn dải cao) ; u<sub>ch3</sub> = u<sub>lò</sub> (Max ≥ 140 °C lò 2)", "[G35, G37]")
        + f(`u<sub>ch2</sub> = ${sq("((U%·R<sub>max</sub>/100)/(S·k))² + ((sai số/S)/(2√3))²")}`, "[G36] – thiết bị đo Ω")
        + f(`u<sub>c</sub> = ${sq("u<sub>ch</sub>² + u<sub>DUT</sub>²")} ; U = 2·u<sub>c</sub>`, "[G39, G40]")
        + f("Lệch °C = (R<sub>fit</sub> − R<sub>hàm chuẩn</sub>)/S ; ĐẠT khi max|lệch °C| + U ≤ acc·span/100", "[ET, EV]")
        + diff(["O33 trong file không lấy căn bậc hai – giữ như file, cần xác nhận.",
          "Điểm không có trong \"Bảng giá trị chuẩn\" của file: app dùng IEC 60751 (có đánh dấu *)."]) },

    { id: "TG", t: "TG – Đồng hồ nhiệt độ", src: "TG_GPP 08-2026_Phuoc_.xlsm · sheets DLVN138.2-1 + STDEV Calc + Data138 · khớp 44/45 hồ sơ (1 hồ sơ chỉ khác nhãn \"03\")",
      body: f("T<sub>chuẩn</sub> = trung bình(TB tăng, TB giảm) ; SHC = T<sub>chuẩn</sub> − T<sub>đọc tăng TB</sub>", "[G55, M55]")
        + f("Dải: ≤150 °C thấp (Stand1 + lò 1) ; 150–400 trung, &gt;400 cao (Stand2 + lò 2)", "[I21:M23]")
        + f("u<sub>ch4</sub> = Ultb<sub>chuẩn</sub>/√3 ; u<sub>ch1</sub> = U<sub>chuẩn</sub>/k ; u<sub>ch3</sub> = u<sub>lò</sub> ; u<sub>ch2</sub> = 0", "[hàng 34–37]")
        + f("u<sub>bk2</sub> = Ultb<sub>DUT</sub>/√3 ; u<sub>bk1</sub> = hồi trễ/(2√3) ; u<sub>bk3</sub> = F7·d/√3 (F7 = 1 kim, 0,5 số)", "[F46, F47, F48]")
        + f(`U = 2·${sq("u<sub>ch4</sub>² + u<sub>ch1</sub>² + u<sub>ch3</sub>² + u<sub>bk1</sub>² + u<sub>bk2</sub>² + u<sub>bk3</sub>²")}`, "[F51]")
        + f("ĐẠT khi max(U<sub>max</sub>, max|SHC|) ≤ acc·span/100", "[EG, DZ]")
        + diff(["U in chứng chỉ: ROUND 2 như Data138 (có thể nhỏ hơn U tính, VD 0,5829 → 0,58) – chờ NGOC chốt áp quy tắc làm tròn lên."]) },

    { id: "TC", t: "TC – Cặp nhiệt điện", src: "TC_GPP_2026_.xlsm · sheets DLVN161 + Ref + Data161 · khớp 66/66 hồ sơ GPP 2026 (đều loại J)",
      body: f("E<sub>ref</sub>(t) = Σ C<sub>i</sub>·t<sup>i</sup> (+ α0·e<sup>α1(t−126,9686)²</sup> với loại K &gt; 0 °C) – hàm chuẩn ITS-90", "[Ref, I62]")
        + f("ΔE = E<sub>đo TB</sub> − E<sub>ref</sub>(t<sub>chuẩn</sub>) ; Δt = hàm ngược ITS-90 tại |ΔE|, mang dấu của ΔE", "[O62]")
        + f("Hồi quy ΔE<sub>K</sub> = a0 + a1·t + a2·t² với ΔE<sub>K</sub> = E<sub>đo</sub> − E<sub>K</sub>(t)", "[S38:Y59]")
        + h("Độ KĐBĐ (8 điểm, 5 lần đọc, S = độ nhạy 0,053 mV/°C loại J, 0,041 loại K)")
        + f(`Ultb = ${sq("(s₁² + s₃² + s₅² + s₇²)/8")} – chỉ điểm 1, 3, 5, 7, chia cho 8 điểm (STDEV có tính cả hàng trung bình) ; u<sub>ch9</sub> = Ultb/√5`, "[F34, F35, F36]")
        + f("u<sub>ch7</sub> = U<sub>bù đầu tự do</sub>/k ; u<sub>ch8</sub> = u<sub>lò</sub> (Max ≤ 140 lò 1, ngược lại lò 2) ; u<sub>ch1</sub> = U<sub>chuẩn</sub>/k (Max ≥ 155 chuẩn 2)", "[F37, F38, F41]")
        + f("u<sub>bk6</sub> = Ultb<sub>DUT</sub>/√5 (Ultb<sub>DUT</sub> cùng cách trên) ; u<sub>bk1</sub> = (U%<sub>mV</sub>·E<sub>điểm 8</sub>/100)/(k·S) ; u<sub>bk2</sub> = 0,5·d<sub>mV</sub>/(√3·S)", "[F52, F53, F54]")
        + f(`u<sub>bk7</sub> = ${sq("Σ phần dư hồi quy²/(5·S)")} ; u<sub>bk8</sub> = 0,1 %·Max`, "[F55, M55]")
        + f(`U = 2·${sq("u<sub>ch9</sub>² + u<sub>ch7</sub>² + u<sub>ch8</sub>² + u<sub>ch1</sub>² + u<sub>bk6</sub>² + u<sub>bk1</sub>² + u<sub>bk2</sub>² + u<sub>bk7</sub>² + u<sub>bk8</sub>²")}`, "[F58]")
        + f("ĐẠT khi U + max|Δt| ≤ acc·span/100", "[Data161!HE]")
        + diff(["Hồi quy ΔE luôn dùng bảng loại K, kể cả cặp nhiệt loại J – giữ như file.",
          "u<sub>ch7</sub> dùng U thiết bị bù đầu tự do 0,2 °C (Fluke 1620A trong file anh Khai); NGOC cho rằng 1620A không liên quan – để trong Cài đặt, đặt 0 để bỏ.",
          "Điểm âm: hàm ngược dải 1 bỏ C1 vì ô Ref!$JH$37 trống – giữ như file.",
          "Loại K chưa có hồ sơ mẫu để đối chiếu."]) }
  ];

  function render() {
    const nav = SECTIONS.map(s => `<button class="chip fchip" data-fj="${s.id}"><b>${s.id}</b></button>`).join("");
    return `<div class="card"><h2>Công thức tính <small>(9 bộ)</small></h2>
      <p class="hint">Viết lại đúng công thức app đang chạy, đã đối chiếu với các file Uncer Excel của anh Khai. Ô Excel ghi bên dưới mỗi dòng để Quality Checker dò lại.
      Ô "Khác file Excel" liệt kê mọi chỗ app không làm giống hệt file. Muốn xem số cụ thể của một hồ sơ: mở hồ sơ, bấm "Bảng Uncer (QC)".</p>
      <div class="chips fnav">${nav}</div>
      <details class="fsec" id="f-common"><summary><b>Chung cho mọi bộ</b></summary>
        ${f("Trung bình x̄ = Σx/n ; độ lệch chuẩn s = √(Σ(x − x̄)²/(n − 1))", "STDEV")}
        ${f("Thành phần phân bố chữ nhật: u = a/√3 ; chuẩn có U, k: u = U/k", "")}
        ${HEAT}
        ${f(`Tổng hợp: u<sub>c</sub> = ${sq("Σ u<sub>i</sub>²")} ; độ KĐBĐ mở rộng U = k·u<sub>c</sub>, k = 2 (≈ 95 %)`, "")}
        ${p("U của chuẩn: lấy U lớn nhất trên toàn dải của GCN chuẩn (quyết định NGOC 31/10/2026) – vì vậy U có thể lớn hơn file Excel cũ.")}
      </details>
      ${SECTIONS.map(s => `<details class="fsec" id="f-${s.id}"><summary><b>${s.t}</b><br><small class="mut">${s.src}</small></summary>${s.body}</details>`).join("")}
    </div>`;
  }
  window.LabFormulas = { render, SECTIONS };
})();
