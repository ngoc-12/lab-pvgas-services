# Đọc hiểu TC / TG / DPG (PDI) trước khi mở trường – 30/10/2026

Chỉ là bản đọc hiểu, **app chưa sửa gì**. Nguồn: các file NGOC gửi (TC_GPP_2026_.xlsm, DVK_ĐVT_PG GPP_2026_KNV.xls, TG workbook, BIÊN BẢN HIỆU CHUẨN QTC_TC.docx, TC Cert co logo.docx, PDI Cert_CKS, PG_76_Cert_CKS.docx, Scan QTG PDI, GCN_TC/TG/PDI 2026, 3 danh sách đã ký).

## 1. Tổng quan

| | TC (Thermocouple) | TG (Temperature Gauge) | DPG / PDI |
|---|---|---|---|
| Loại công việc | Hiệu chuẩn | Hiệu chuẩn | Hiệu chuẩn (không phải kiểm định như PG hiện có) |
| Phương pháp | ĐLVN 161:2005 | ĐLVN 138:2004 | DVK.LAB.TM.22 (sheet tính DLVN76_2001) |
| Số GCN | CN.TC.26.nnnn | CN.TG.26.nnnn | **CN.PG.26.nnnn** |
| Biên bản (QTG) | BB.TC.26.nnnn, mã ĐLVN 161:2005.PL2 | (theo form TG workbook, sheet QTG) | BB.PG.26.nnnn, mã DVK.LAB.TM22.PL03 |
| Bảng tính KĐB | sheet DLVN161 | sheet DLVN138.2-1 (No. BT.TG.XX.XXXX) | sheet DLVN76_2001 (TM.10.BM.112.2-1) |
| Danh sách ký 2026 | 66 thiết bị, 66 Đạt | 45 thiết bị, 45 Đạt | 8 thiết bị, 8 Đạt |
| GCN trong bộ PDF | 66 | 45 | 8 (0001–0004, 0006, 0007, 0010, 0011) |

## 2. TC – Thermocouple

**Dữ liệu đo:** 8 điểm nhiệt × 5 lần đọc, DUT đọc bằng mV; chuẩn = lò RTC-159B (625606-00080) hoặc RTC-700B (710033-00961), đồng hồ đo mV Fluke 754 (2843012, 0÷100 mV, U 0,0035 %). Ví dụ loại J 0–160 °C ±2 %FS (Pyromation), TC-1 (K-01A) 0–650 °C.

**Công thức (sheet DLVN161):**
- Thành phần chuẩn: uch9 tản mạn chuẩn; uch7 điểm lạnh = U Fluke 1620A / k (0,2/2); uch8 lò nhiệt chọn theo Max (≤140 → RTC-159B, >400 → cột H, còn lại cột G); uch1.1 chuẩn (F7 ≥ 155 → G15).
- Thành phần DUT: ubk1 = (U%·E/100)/(k·S); ubk2 = res/(2√3·S); ubk6 tản mạn; ubk7 nội suy = sqrt(Σres²/(5·S)); ubk8 = 0,1 %·Max (theo BoA 2022).
- Uexp = 2·uc. ΔE = a0 + a1·t + a2·t² (bình phương tối thiểu). GCN in hệ số tham chiếu ITS-90 Ci. Độ nhạy loại J 0,053 mV/°C (sheet Ref).

**Điểm lạ trong Excel (giữ nguyên nếu chưa có ý kiến QC):**
- F35 chỉ lấy cột F, H, J, L chia N (bỏ các cột còn lại).
- ubk7 chia 5·S thay vì bậc tự do.
- Ô "U công bố" F59 có công thức khó hiểu (LibreOffice tính ra '001'); cần xem bản Excel gốc.

**Mâu thuẫn:**
- Biên bản ghi đồng hồ 754 với serial 710033-00961, đây là serial của RTC-700B.
- Biên bản: RTC-159B ±0,3 °C, còn GCN chuẩn là ±0,06 °C; RTC-700 dải 50÷700, còn GCN chuẩn là 33÷700.
- RTC-700B U = 0,15 °C trong workbook TC, nhưng GCN VMI mới là 0,30 °C.
- RTC-159B 625606-00080 hết hạn 31/08/2026 (vẫn còn hạn cho đợt tháng 8, nhưng không dùng được cho đợt sau).
- Lỗi chính tả "Ametrek".

## 3. TG – Temperature Gauge

**Dữ liệu đo:** 5 điểm × tăng/giảm × 3 lần đọc (F24 = 3), k = 2. Ví dụ TI-1431B Tel-Tru 0–120 °C, vạch chia 0,5 °C, ±1 %FS. Chuẩn chính RTC-159B 709766-00995 (U 0,08 °C), dải trung/cao dùng RTC-700B 710033-00961 (U 0,15).

**Công thức (sheet DLVN138.2-1 + sheet ẩn STDEV Calc):**
- Mỗi điểm được xếp vào dải: thấp ≤150 °C, cao >400 °C, còn lại là trung. Mỗi dải có một U riêng (GCN in U theo dải, ví dụ 0,58 °C).
- Thành phần chuẩn: uch4 = S gộp các điểm trong dải / √n; uch1 = U chuẩn / k (dải thấp dùng chuẩn 1, dải trung và cao dùng chuẩn 2); uch2 chỉ thị chuẩn (BlackStack 1560, ppm → °C qua 0,385, hiện bằng 0); uch3 lò = sqrt((stab/√3)² + (radial/√3)² + (axial/√3)²).
- Thành phần DUT: ubk2 = S gộp DUT / √n; ubk1 hồi trễ = max|tăng−giảm| / (2√3); ubk3 phân giải = (F7·res)/√3. F7 là loại chỉ thị: 0,5 = Digital, 1 = Analog.
- uc = sqrt(uch² + uDUT²); Uexp = 2·uc.
- "U công bố" làm tròn LÊN theo số chữ số thập phân (0,5829 → "0.59").
- Số hiệu chính = TB chuẩn (tăng+giảm) − TB DUT tăng.

**Điểm lạ:**
- Ô "Phương pháp" F15 ghi '112:2005', không phải 138:2004.
- Phân giải analog nhân hệ số 1 rồi chia √3 (không chia 2√3).
- Số hiệu chính chỉ dùng chiều tăng.
- Bảng STDEV Calc có ô D44 '=MAX(D40,E40,F40,G40,)' (dư dấu phẩy, vẫn chạy).
- Trong dải trung, uch1 dùng U của chuẩn 2 ngay cả khi chỉ có một chuẩn.
- Lò RTC-159B có stab/radial/axial = 0 trong sheet Stand (giống TS/TT, đã báo trước).

**Cần NGOC xác nhận:**
- Quy tắc làm tròn U của TG khác quy tắc 2 chữ số có nghĩa đã chốt cho PT/PS/TT. Áp dụng quy tắc nào?
- TG ghi kết quả theo vạch chia (0,5 °C) hay theo số đọc ước lượng?

## 4. DPG / PDI – Differential Pressure Gauge

**Thiết bị 2026 (GPP Dinh Cố):**
- 6 cái Orange Research 0–30 psi, ±2 %FS.
- PDI-0101 Mid-West 0–250 kPa, ±1,5 %FS.
- PDI-0102 ITEC 0–3 bar, ±1 %FS.

**Công thức (DLVN76_2001), cùng mô hình với PT DLVN112:**
- x = chuẩn, y = DUT; hồi quy tuyến tính, tính Sy, Sa, Sb, r.
- us = (E12·span_std + E13·|x|)/(2·span), hoặc biến thể cho cân pittông.
- uv = (res·100/span)/√6/2.
- uc,i = sqrt(uA² + us² + uv²); Uexp(%) = k·TB(tăng, giảm); U theo đơn vị = K·span/100.
- GCN in U lớn nhất, làm tròn lên (0,204 → 0,21; 1,040 → 1,05). Có mục "Hiệu chỉnh P" = Yes.

**Mâu thuẫn:**
- GCN in phương trình "y = 0.000 + 0.001 x" trong khi b = 1 (lỗi định dạng).
- GCN ghi chuẩn "20C-IS" S/N 703384 với U 0,0001 bar, nhưng U thật của MC6-P20C là 0,0011–0,0012 bar. QTG ghi MC6-P20C. Sheet Stand E8 lại là 'ACS400' (U 0,002 bar). Chuẩn nào được dùng thật? Lưu ý thêm: P1C và P20C trùng serial 703384 (đã báo trước).
- Môi trường: GCN ghi 20±5 °C / <80 %RH, QTG ghi 23±2 °C / ≤70 %RH.
- Số đọc chuẩn trên QTG có 3 số lẻ (psi), GCN in 2 số lẻ. Quy tắc digit mới (theo hiển thị của chuẩn) sẽ ràng buộc chỗ này.
- Mọi số đọc DUT bằng đúng chuẩn (sai số 0). Hợp lý với đồng hồ vạch 0,5 psi nhưng nên xác nhận.
- Lỗi chính tả "Orange Rearch" (trên cả danh sách và GCN).
- **Trùng tiền tố số GCN:** PDI dùng CN.PG.26.nnnn, các số 0005, 0008, 0009 không có trong bộ PDI. App hiện cấp PG (kiểm định) số N256.yyA.nnnnn. Nếu PG hiệu chuẩn khác cũng dùng CN.PG.26 thì DPG phải dùng chung bộ đếm, không được đếm riêng.

## 5. Đề xuất triển khai (khi NGOC cho mở)

1. **Mở 3 loại mới trong app, theo cách đã làm với PG/TS/TT/RTD:**
   - Thêm hàm calc vào calc2.js: `calcTC` (DLVN161), `calcTG` (DLVN138.2-1), `calcDPG` (DLVN76).
   - Thêm trang QTG + GCN vào docs2.js theo đúng mẫu GCN 2026 đã gửi.
2. **Kiểm chứng trước khi phát hành:**
   - Chạy lại các bản ghi 2026 (66 TC, 45 TG, 8 PDI).
   - So số GCN, sai số và U với PDF đã ký. Mục tiêu: khớp 100 %, hoặc liệt kê từng chỗ lệch.
3. **Màn nhập liệu:**
   - TC: 8 điểm × 5 lần, mV.
   - TG: 5 điểm × tăng/giảm × 3 lần.
   - DPG: 5 điểm tăng/giảm theo đơn vị của đồng hồ.
   - Kiểm tra digit theo chuẩn: mV cho 754, °C cho lò RTC; với lò nên dùng độ phân giải 0,01 °C, cần NGOC xác nhận.
4. **Stand:**
   - Đã có RTC-159B/700B và 754 trong thư viện.
   - Cần bổ sung Fluke 1620A (điểm lạnh) và BlackStack 1560 nếu dùng.
   - Cần xác nhận chuẩn của DPG là MC6-P20C, 20C-IS hay ACS400.

## 6. Câu hỏi cho NGOC

1. Áp dụng quy tắc công bố (số lẻ theo bộ và U 2 chữ số có nghĩa, làm tròn lên) cho cả TC/TG/DPG, hay giữ cách làm tròn của từng workbook?
2. DPG đi chung bộ đếm CN.PG.26 với PG hiệu chuẩn khác không, hay tách riêng?
3. Chuẩn áp suất dùng cho PDI 2026 là MC6-P20C (703384), "20C-IS" hay ACS400?
4. TC: U của RTC-700B lấy 0,15 (workbook) hay 0,30 (GCN VMI mới)?
5. Các điểm lạ trong Excel (F35 của TC, ubk7, phân giải TG chia √3): giữ nguyên chờ QC Mr Khải như với PG/TS/TT/RTD?
