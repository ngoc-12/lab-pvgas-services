# Số chữ số thập phân của số đọc chuẩn – 30/10/2026

Yêu cầu của NGOC: số đọc chuẩn ghi trong hồ sơ không được có nhiều chữ số sau dấu phẩy hơn màn hình của chuẩn hiển thị được, ở đúng đơn vị đang dùng. Ví dụ không được ghi 3,0001 bar khi chuẩn chỉ hiện 3,000 bar.

## App làm gì

- Khi chọn chuẩn, ngay dưới ô chọn hiện dòng "Số đọc chuẩn – … tối đa N chữ số thập phân (đơn vị)".
- Nếu số nhập nhiều chữ số hơn, app báo **lỗi** và không tính, không xuất hồ sơ. Áp dụng cho:
  - áp suất chuẩn của PT, PS, PG;
  - số đọc mA của PT và TT (đo bằng ampe kế chuẩn);
  - nhiệt độ chuẩn của TS, TT, RTD.
- Nếu đơn vị đang chọn vượt quá số chữ số màn hình của chuẩn, app báo lỗi "không hiển thị được đơn vị". Ví dụ 700G29 không hiện được mbar.
- Số đọc điện trở (RTD) chỉ **cảnh báo**, không chặn. Lý do ở mục "Chỗ lệch", điểm 2.
- Hồ sơ đã lưu trước đây vẫn tính và in được. Trong danh sách QC, lỗi này chỉ hiện thành cảnh báo.
- Tab Chuẩn hiện số chữ số thập phân của từng chuẩn theo từng đơn vị.

## Quy tắc (chuẩn áp suất)

Màn hình chuẩn có **D chữ số**. D = số chữ số phần nguyên của Max + số chữ số lẻ của độ phân giải ghi trên GCN. Ví dụ 700G05: Max 2 bar, độ phân giải 0,0001 bar, nên D = 1 + 4 = 5.

Khi đổi sang đơn vị khác, số chữ số lẻ = D − số chữ số phần nguyên của Max ở đơn vị đó:
- Max < 1 tính là 1 chữ số. Ví dụ 700G02 hiện 0.0689 bar.
- Kết quả < 0 nghĩa là chuẩn không hiển thị được đơn vị đó (ô "—" trong bảng).

Đối chiếu với manual:

| Nguồn | Kết quả đối chiếu |
|---|---|
| **Fluke 700G Series Users Manual** (Rev. 2, 8/17), bảng Range/Resolution tr. 12–13 | Khớp **toàn bộ** 6 model 700G02/05/07/08/29/31 × 6 đơn vị, kể cả các ô "*" không hiển thị |
| **Crystal XP2i (bar) datasheet** | Khớp, trừ 2 chỗ phải sửa riêng (đánh dấu * trong bảng): XP2i 70 bar không hiện mbar; XP2i 1000 bar hiện psi không có số lẻ |
| **Ametek APM datasheet** | APM30 và APM700 khớp. APM100 phải sửa riêng: psi 1 số lẻ, không hiện mbar |
| **Beamex MC6-Ex / EXT datasheet** (P1C, P20C, EXT160/250/1000; kPa, bar, psi) | Khớp |

Các chuẩn sau chưa có manual để đối chiếu, nên tính theo độ phân giải ghi trên GCN: DPI620/PM620, DPG100, 750PD3. Nếu anh em có manual thì gửi để kiểm tra lại.

Quả cân (deadweight) không giới hạn số chữ số, vì áp suất tính từ khối lượng quả cân chứ không đọc trên màn hình.

| Chuẩn | Độ phân giải GCN | bar | mbar | kPa | MPa | psi | kg/cm² |
|---|---|---|---|---|---|---|---|
| APM30 (322077 - 30 bar) | 0.001 bar | 3 | 0 | 1 | 4 | 2 | 3 |
| APM100 (322070 - 100 bar) | 0.001 bar | 3 | — | 1 | 4 | 1* | 3 |
| APM700 (322789 - 700 bar) | 0.01 bar | 2 | — | 0 | 3 | 0 | 2 |
| 750PD3 (350 mbar) | 0.01 mbar | 4 | 2 | 3 | 4 | 4 | 4 |
| MC6-EX/P1C-EX | 0.00001 bar | 5 | 2 | 3 | 5 | 4 | 5 |
| MC6-EX/P20C-EX | 0.0001 bar | 4 | 1 | 2 | 5 | 3 | 4 |
| MC6-EX/EXT 160 IS | 0.001 bar | 3 | 0 | 1 | 4 | 2 | 3 |
| MC6-EX/EXT 250 IS | 0.01 bar | 2 | — | 0 | 3 | 1 | 2 |
| MC6-EX/EXT 1000 IS | 0.01 bar | 2 | — | 0 | 3 | 1 | 2 |
| XP2i (70 bar) | 0.001 bar | 3 | — | 1 | 4 | 1 | 3 |
| XP2i (322238 - 70 bar) | 0.001 bar | 3 | — | 1 | 4 | 1 | 3 |
| XP2i (700 bar) | 0.01 bar | 2 | — | 0 | 3 | 0 | 2 |
| XP2i (423876 - 700 bar) | 0.01 bar | 2 | — | 0 | 3 | 0 | 2 |
| XP2i (322240 - 1000 bar) | 0.01 bar | 2 | — | 0 | 3 | 0* | 2 |
| 700G02 | 0.001 mbar | 4 | 3 | 4 | 4 | 4 | 4 |
| 700G02 (6269597) | 0.001 mbar | 4 | 3 | 4 | 4 | 4 | 4 |
| 700G05 | 0.0001 bar | 4 | 1 | 2 | 4 | 3 | 4 |
| 700G05 (5947047) | 0.0001 bar | 4 | 1 | 2 | 4 | 3 | 4 |
| 700G05 (6556009) | 0.0001 bar | 4 | 1 | 2 | 4 | 3 | 4 |
| 700G07 | 0.001 bar | 3 | 0 | 1 | 4 | 2 | 3 |
| 700G08 (6122502) | 0.001 bar | 3 | 0 | 1 | 4 | 1 | 3 |
| 700G08 (6661072) | 0.001 bar | 3 | 0 | 1 | 4 | 1 | 3 |
| 700G29 | 0.01 bar | 2 | — | 0 | 3 | 1 | 2 |
| 700G29 (6402074) | 0.01 bar | 2 | — | 0 | 3 | 1 | 2 |
| 700G31 (6451539) | 0.01 bar | 2 | — | 0 | 3 | 0 | 2 |
| 700G31 (6661105) | 0.01 bar | 2 | — | 0 | 3 | 0 | 2 |
| DPG100-22 | 0.01 bar | 2 | — | 0 | 3 | 1 | 2 |
| DPI620 (4164405 - 200 bar) | 0.01 bar | 2 | — | 0 | 3 | 1 | 2 |
| DPI620 (3177055 - 350 bar) | 0.01 bar | 2 | — | 0 | 3 | 1 | 2 |
| DPI620 (11071238 - 700 bar) | 0.01 bar | 2 | — | 0 | 3 | 0 | 2 |
| Deadweight Khí (59746) | (quả cân) | không giới hạn ||||||
| Deadweight Khí (12886-0) | (quả cân) | không giới hạn ||||||
| Deadweight dầu (59900) | (quả cân) | không giới hạn ||||||

(* = sửa riêng theo datasheet; — = không hiển thị được)

## Chuẩn điện và nhiệt độ

Độ phân giải theo thang đo, lấy từ bảng kết quả trên GCN:

| Chuẩn | Thang đo và độ phân giải |
|---|---|
| Fluke 754, đo mA | ≤ 30 mA: 0,001 mA; ≤ 100 mA: 0,01 mA |
| Fluke 754, đo Ω | ≤ 11 Ω: 0,001; ≤ 110 Ω: 0,01; ≤ 1100 Ω: 0,1; ≤ 11 kΩ: 1 Ω (GCN VMI: 8,998 / 89,99 / 900,0 / 9,000 kΩ) |
| Fluke 725, đo mA | 0,001 mA (thang 24 mA) |
| Beamex MC6-Ex, đo mA | 0,0001 mA (GCN đọc 9,9994 mA) |
| Beamex MC6-Ex, đo Ω | < 1000 Ω: 0,001; đến 4000 Ω: 0,01 |
| Lò nhiệt, nhiệt kế chuẩn | theo độ phân giải °C trong danh mục (0,001 °C; SPRT 0,0001 °C) |

## Chỗ lệch phát hiện được

1. **Hồ sơ PS mẫu PSHH-0522** (CN.PS.26.2744, file PS_DGCP_10_2026) dùng APM30 nhưng ghi số đọc 299,91 / 220,31 kPa, tức 2 chữ số lẻ.
   - APM30 ở đơn vị kPa chỉ hiện 0,1 kPa (theo datasheet APM và theo GCN: 0,001 bar).
   - Theo quy tắc mới thì app không cho nhập như vậy.
   - Cần xem lại: hoặc số đọc thực là 1 chữ số lẻ, hoặc chuẩn dùng thực tế không phải APM30.
2. **File RTD_DK_CM_2026** ghi số đọc điện trở 2 chữ số lẻ (157,39 Ω; 212,11 Ω) khi đo bằng 754.
   - GCN VMI của 754 cho thấy thang 1100 Ω chỉ hiện 1 chữ số lẻ (900,0 Ω).
   - Có thể anh em đo bằng chế độ khác hoặc thiết bị khác.
   - App tạm chỉ cảnh báo, cần anh xác nhận để chuyển thành lỗi.
3. Các điểm đo tự sinh (0–25–50–75–100 %) chỉ là giá trị danh định. Khi nhiều chữ số hơn chuẩn hiện được (ví dụ dải 0–6,895 kPa), app sẽ báo lỗi để anh em nhập số đọc thật trên chuẩn.

## Nguồn

- Fluke 700G Series Pressure Gauges Users Manual, Rev. 2 8/17: https://assets.fluke.com/manuals/700g____umeng0200.pdf
- Crystal XP2i bar datasheet: https://www.instrumart.com/assets/Crystal-XP2i-bar-Datasheet.pdf
- Ametek APM/CPF datasheet: https://core.instrumart.com/assets/Ametek-APM-CPF-datasheet.pdf
- Beamex EXT pressure modules datasheet: https://www.transcat.ca/media/pdf/Beamex-EXT-pressure-modules-datasheet.pdf
- Beamex MC6-Ex datasheet (P1C/P20C): https://introl.pl/filedownload/1923
- GCN VMI của 754/725/MC6 trong loạt 30/10/2026
