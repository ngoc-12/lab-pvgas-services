# Phân tích file "Bảng tính xuất Chứng chỉ" (27.12.24) – cơ sở cho LAB PVGAS Services

## 1. Trong file rar có gì
| Thư mục | Bảng tính (Uncer Form) | Mẫu chứng chỉ (mail merge Word) |
|---|---|---|
| GPP_PT_2024 | GPP_2024_PT_Uncer Form.xls | 14 PT - Thang 8.docx, 16 PT - Thang 9.docx |
| GPP_PS_2024 | GPP_PS Uncer Form.xls | 133.3-2 PS 801 Cert khong logo vcl.docx |
| GPP_PG_2024 | KVT_GPP_PG_DK_2024.xlsm | 08-2011 PG cert khong logo_sua vcl.docx |
| GPP_TG_2024 | GPP_TG_2024_TG Uncer Form sua dai trung.xls | 138.3-2 TG cert ko logo vcl.docx |
| GPP_RTD_2024 | RTD Uncer Form 125.2003.xls | RTD Cert_CKS.docx, RTD Cert_in giay logo.docx |
| GPP_TC_2024 | TC Uncer form_GPP_2024_Khai.xlsm | TC_logo (Type J) 1–38, 39–66.docx, TC loại K (.rar) |
| GPP_DPG_2024 | GPP_DPG_DLVN76.xls | 76.3-2 DPI Cert khong logo vcl.doc |
| LNG_TT_2024 | 3 file TT Uncer Form TM.12 | TM12_TT_Cert co logo.docx |
| GDS_TS_2024 | KDV_2024_TS Uncer Form.xls | TS Cert_CKS - Copy.docx |
| TNTV_PSV_2024 | (bỏ qua theo yêu cầu) | |

Quy trình trong mỗi file Excel (macro của khainv@pvgas.com.vn):
sheet **QTG** (gõ lại số liệu ghi tay, mỗi thiết bị 1 khối 26 dòng PT / 23 dòng PS) → macro chép từng thiết bị vào sheet tính
ĐKĐBĐ (**DLVN112-2002_Rev2** cho PT, **DLVN133 - 2004** cho PS) → chép kết quả sang **Data112 / Data133** → Word mail merge
đọc Data112/Data133 để in chứng chỉ. Sheet ẩn: **Stand Correct** (bảng hiệu chính chuẩn theo giấy VMI), Rev2_3, List(print).

## 2. Logic PT/DPT (4–20 mA) – DLVN112-2002_Rev2
- 5 điểm 0-25-50-75-100% span, đọc mA chiều tăng và giảm (QTG mặc định Giảm = Tăng).
- Hồi quy y(mA) theo x(áp suất) 10 điểm: a, b (LINEST), Sy (STEYX).
- Sa, Sb, r tính theo dòng chuẩn I = 4 + 16(x−min)/span; uA,i = √(Sa² + I²Sb² + 2I·Sa·Sb·r), % = 100·uA/16.
- uB chuẩn áp suất: us = (E12·(FS−min chuẩn) + %Rdg·|x|) / (2·span) với E12 = U chuẩn quy về % dải chuẩn (Deadweight: E12·|x|/(2·span)).
- uB chuẩn điện: uv = √[(H12·dải/(2·16))² + ((%Rdg/dải)/(2√3))²].
- Uc,i = √(uA² + us² + uv²); Uexp% = k·trung bình(tăng, giảm), k = 2; Uexp = Uexp%·span/100.
- Đạt khi Uexp max ≤ acc%·span **và** |số hiệu chính| max ≤ acc%·16 mA.
- Số in chứng chỉ: U làm tròn LÊN (2/3/4 số lẻ tuỳ độ lớn); áp suất "#,#0.00", mA "0.000"; y = a + b x (3 số lẻ).

## 3. Logic PS/DPS – DLVN133-2004
- 1 điểm đặt Pset, 5 lần đọc P.High (tăng áp) và P.Low (giảm áp).
- Chiều tác động tự xác định: chiều nào có độ lệch trung bình với Pset nhỏ hơn là "Set".
- uA = độ lệch chuẩn của trung bình (n = 5); uB chuẩn = (E14·FS chuẩn + %Rdg·Pset)/(100·2); uB phân giải = d/2/√3.
- U = 2·√(uA² + uB²) theo chiều Set. Đạt khi max|Set-dev| + U ≤ acc%·Pset.

## 4. Đối chiếu app với Excel
- PT: 28/28 thiết bị có đủ dữ liệu cho cùng Uexp từng điểm (sai lệch < 1e-15), cùng Pass/Fail và cùng số in chứng chỉ.
- PS: 12/12 cùng U và Pass/Fail; 11/12 cùng số in. PDSL-1103: Excel làm tròn tay 0,075 (dòng này bị thay công thức), quy tắc chung làm tròn lên ra 0,076. App dùng quy tắc chung.

## 5. Phát hiện cần lưu ý
1. Mọi chuẩn trong file đã hết hạn (hạn cuối 31-05-2025). App đóng dấu "BẢN NHÁP – CHUẨN HẾT HẠN" cho đến khi nhập ĐKĐBĐ và hạn mới từ giấy VMI.
2. Hai chuẩn cùng tên "700G05 (2 bar)" khác serial/dải: file PT S/N 5947047 (−1÷2 bar), file PS S/N 6283134 (−0,97÷2 bar). App giữ cả hai.
3. Data112 thiếu Stand1 của PT-1441B và PT-1941 (đã có số chứng chỉ).
4. Chứng chỉ Fail dùng câu tiếng Anh "meets the accuracy requirement": app đổi thành "does not meet" khi Fail.
5. Excel in U = 0 nếu phần lẻ < 0,001 (ví dụ U = 2,0000): app làm tròn lên 4 số lẻ và cảnh báo.
6. Mẫu chứng chỉ trang 1 cũ ghi Hoàng Năng Hải / Lê Diệp Bình; app tạm dùng Phan Việt Anh (Trưởng Phòng TNHC) và Đỗ Thành Trung (Phó Giám đốc), sửa được trong Cài đặt.
7. Địa chỉ đầu trang lấy từ sheet List ("Phường Thắng Nhì, TP Vũng Tàu"); cần xác nhận địa chỉ mới sau sáp nhập hành chính 2025.
8. Đường "Đã hiệu chỉnh áp suất = No" (dùng bảng Stand Correct) chưa bật vì mọi hồ sơ 2024 đều "Yes" và bảng hiệu chính không còn hiệu lực.

## 6. Chưa có trong rar (cần mẫu)
- Mẫu QTG giấy (biên bản hiện trường) của dự án KĐHC Giàn Rồng: app tạm in "Biên bản QTG bản số hoá".
- Biểu mẫu chuẩn 2026 (mã TM/BM, phiên bản quy trình DVK.LAB.TM.21 và ĐLVN 133 có còn áp dụng).
- File ĐKĐBĐ ẩn "của anh Khanh": trong rar chỉ thấy macro ký tên khainv và sheet ẩn Stand Correct.
