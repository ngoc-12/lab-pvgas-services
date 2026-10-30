/* Seed data from the 2026 company workbooks PT_DGCP_10_2026.xls / PS_DGCP_10_2026.xls
 * (sheets "Stand Ref" -> Stand, "Location"); temperature / resistance standards (kind t, r) and the TT ammeter
 * from 1.TT_LFS_CM_26.xls, RTD_DK_CM_2026_.xls and LFS_TS 09 2026.xls (sheet "Stand", in-date rows only). Only standards that are in date in the 2026 workbook are listed;
 * the expired entries of the PS workbook (DPI620/DPI605/Deadweight/700G08/MC6 EXT 250-1000/DPG100) are left out.
 * key = the name used in the workbook drop-down (Data112!N / Data133!N), so records can be traced back to the sheet.
 */
window.LabSeed = {
  version: 3,
  // kind: "p" pressure standard, "e" electrical (mA) standard, "t" temperature standard / heat source, "r" resistance meter
  // t: stab / radial / axial = Stand!Stability/Radial/Axial of the heat source (°C); heat = name printed as "Thiết bị tạo nhiệt"
  // e / r: err = column "Sai số" (mA or Ω) used by the TT / RTD sheets beside the uncertainty
  // rdg = column "Reading/Err" (% of reading for Stand1, error term for Stand2)
  stands: [
    {"id": "APM30 (322077 - 30 bar)", "kind": "p", "key": "APM30 (322077 - 30 bar)", "name": "Digital Pressure Gauge", "model": "ASC400/APM30", "serial": "322077", "maker": "Ametek", "min": 0, "max": 30, "unit": "bar", "res": "0.001", "accuracy": "0.0075 %FS", "unc": 0.002, "uncUnit": "bar", "rdg": 0.0, "trace": "Viện ĐLVN (VMI)", "due": "2026-12-31"},
    {"id": "APM100 (322070 - 100 bar)", "kind": "p", "key": "APM100 (322070 - 100 bar)", "name": "Digital Pressure Gauge", "model": "ASC400/APM100", "serial": "322070", "maker": "Ametek", "min": 0, "max": 100, "unit": "bar", "res": "0.001", "accuracy": "0.0075 %FS", "unc": 0.006, "uncUnit": "bar", "rdg": 0.0, "trace": "Viện ĐLVN (VMI)", "due": "2026-12-31"},
    {"id": "APM700 (322789 - 700 bar)", "kind": "p", "key": "APM700 (322789 - 700 bar)", "name": "Digital Pressure Gauge", "model": "ASC400/APM700", "serial": "322789", "maker": "Ametek", "min": 0, "max": 700, "unit": "bar", "res": "0.01", "accuracy": "0.0075 %FS", "unc": 0.04, "uncUnit": "bar", "rdg": 0.0, "trace": "Viện ĐLVN (VMI)", "due": "2026-12-31"},
    {"id": "750PD3 (350 mbar)", "kind": "p", "key": "750PD3 (350 mbar)", "name": "Digital Pressure Gauge", "model": "750PD3 / Fluke 754", "serial": "5877181", "maker": "Fluke", "min": 0, "max": 350, "unit": "mbar", "res": "0.01", "accuracy": "0.07 %FS", "unc": 0.02, "uncUnit": "mbar", "rdg": 0.07, "trace": "Viện ĐLVN (VMI)", "due": "2026-12-31"},
    {"id": "MC6-EX/P20C-EX", "kind": "p", "key": "MC6-EX/P20C-EX", "name": "Digital Pressure Gauge", "model": "MC6", "serial": "703384", "maker": "Beamex", "min": 0, "max": 20, "unit": "bar", "res": "1e-05", "accuracy": "0.015% FS + 0.025%RD", "unc": 0.0011, "uncUnit": "bar", "rdg": 0.0, "trace": "Viện ĐLVN (VMI)", "due": "2026-12-31"},
    {"id": "MC6-EX/EXT 160 IS", "kind": "p", "key": "MC6-EX/EXT 160 IS", "name": "Digital Pressure Gauge", "model": "MC6", "serial": "89548", "maker": "Beamex", "min": 0, "max": 160, "unit": "bar", "res": "0.001", "accuracy": "0.015% FS + 0.025%RD", "unc": 0.01, "uncUnit": "bar", "rdg": 0.04, "trace": "Viện ĐLVN (VMI)", "due": "2026-12-31"},
    {"id": "MC6-EX/P1C-EX", "kind": "p", "key": "MC6-EX/P1C-EX", "name": "Digital Pressure Gauge", "model": "MC6", "serial": "703384", "maker": "Beamex", "min": -1, "max": 1, "unit": "bar", "res": "1e-05", "accuracy": "0.015% FS + 0.025%RD", "unc": 6e-05, "uncUnit": "bar", "rdg": 0.025, "trace": "Viện ĐLVN (VMI)", "due": "2026-12-31"},
    {"id": "XP2i (70 bar)", "kind": "p", "key": "XP2i (70 bar)", "name": "Digital Pressure Gauge", "model": "XP2i", "serial": "424289", "maker": "Ametek", "min": 0, "max": 70, "unit": "bar", "res": "0.001", "accuracy": "±0.02 %FS", "unc": 0.001, "uncUnit": "bar", "rdg": 0.0, "trace": "Viện ĐLVN (VMI)", "due": "2026-12-31"},
    {"id": "XP2i (700 bar)", "kind": "p", "key": "XP2i (700 bar)", "name": "Digital Pressure Gauge", "model": "XP2i", "serial": "323258", "maker": "Ametek", "min": 0, "max": 700, "unit": "bar", "res": "0.01", "accuracy": "±0.02 %FS", "unc": 0.01, "uncUnit": "bar", "rdg": 0.02, "trace": "Viện ĐLVN (VMI)", "due": "2026-12-31"},
    {"id": "700G05", "kind": "p", "key": "700G05", "name": "Digital Pressure Gauge", "model": "Fluke 700G05", "serial": "6283134", "maker": "Fluke", "min": -1, "max": 2, "unit": "bar", "res": "0.0001", "accuracy": "±0.05 %FS", "unc": 0.0001, "uncUnit": "bar", "rdg": 0.05, "trace": "Viện ĐLVN (VMI)", "due": "2027-05-20"},
    {"id": "700G07", "kind": "p", "key": "700G07", "name": "Digital Pressure Gauge", "model": "700G07", "serial": "4327226", "maker": "Fluke", "min": -0.83, "max": 34, "unit": "bar", "res": "0.001", "accuracy": "±0.05 %FS", "unc": 0.002, "uncUnit": "bar", "rdg": 0.05, "trace": "Viện ĐLVN (VMI)", "due": "2026-12-31"},
    {"id": "700G29", "kind": "p", "key": "700G29", "name": "Digital Pressure Gauge", "model": "700G29", "serial": "6360326", "maker": "Fluke", "min": -0.97, "max": 200, "unit": "bar", "res": "0.01", "accuracy": "±0.05 %FS", "unc": 0.01, "uncUnit": "bar", "rdg": 0.0, "trace": "Viện ĐLVN (VMI)", "due": "2026-12-31"},
    {"id": "700G02", "kind": "p", "key": "700G02", "name": "Digital Pressure Gauge", "model": "700G02", "serial": "6507514", "maker": "Fluke", "min": 0, "max": 70, "unit": "mbar", "res": "0.001", "accuracy": "±0.05 %FS", "unc": 0.007, "uncUnit": "mbar", "rdg": 0.05, "trace": "Viện ĐLVN (VMI)", "due": "2026-12-31"},
    {"id": "754 (ĐCM)", "kind": "e", "key": "754 (ĐCM)", "name": "Documenting Process Cal.", "model": "754", "serial": "3857051", "maker": "Fluke", "min": 0, "max": 30, "unit": "mA", "res": "0.001mA", "accuracy": "±(0.01% Rdg + 5 μA)", "unc": 0.02, "uncUnit": "%", "rdg": 0.0, "trace": "Quatest 3", "due": "2026-12-31", "certRange": 30},
    {"id": "754 (6801009)", "kind": "e", "key": "754 (6801009)", "name": "Documenting Process Cal.", "model": "754", "serial": "6801009", "maker": "Fluke", "min": 0, "max": 30, "unit": "mA", "res": "0.001mA", "accuracy": "±(0.01% Rdg + 5 μA)", "unc": 0.017, "uncUnit": "%", "rdg": 0.0, "trace": "Viện ĐLVN (VMI)", "due": "2026-11-07", "certRange": 30},
    {"id": "754 (66830024)", "kind": "e", "key": "754 (66830024)", "name": "Documenting Process Cal.", "model": "754", "serial": "66830024", "maker": "Fluke", "min": 0, "max": 30, "unit": "mA", "res": "0.001mA", "accuracy": "±(0.01% Rdg + 5 μA)", "unc": 0.017, "uncUnit": "%", "rdg": 0.0, "trace": "Viện ĐLVN (VMI)", "due": "2026-12-31", "certRange": 30},
    {"id": "754 (3857051)", "kind": "e", "key": "754 (3857051)", "name": "Documenting Process Cal.", "model": "754", "serial": "3857051", "maker": "Fluke", "min": 0, "max": 30, "unit": "mA", "res": "0.001mA", "accuracy": "±(0.01% Rdg + 5 μA)", "unc": 0.017, "uncUnit": "%", "err": 0.001, "rdg": 0.0, "trace": "Viện ĐLVN (VMI)", "due": "2027-05-08", "certRange": 30},
    {"id": "754 (61930026)", "kind": "r", "key": "754 (61930026)", "name": "Documenting Process Cal.", "model": "754", "serial": "3821003", "maker": "Fluke", "min": 0, "max": 1000, "unit": "Ω", "res": "0.001 Ω", "accuracy": "±(0.05% Rdg + 50 mΩ)", "unc": 0.008, "uncUnit": "%", "err": 0.03, "trace": "Viện ĐLVN (VMI)", "due": "2027-07-14"},
    {"id": "RTC-159B Internal (654164-00305)", "kind": "t", "key": "RTC-159B Internal (654164-00305)", "name": "Reference Temperature Calibrator", "model": "RTC-159B", "serial": "654164-00305", "maker": "Ametek", "min": -100, "max": 155, "unit": "°C", "res": "0.001 °C", "accuracy": "±0.3 °C", "unc": 0.07, "uncUnit": "°C", "stab": 0, "radial": 0, "axial": 0, "heat": "Ametek RTC-159B", "trace": "Viện Đo lường Việt Nam (VMI)", "due": "2027-05-08"},
    {"id": "9173 (B13638) low", "kind": "t", "key": "9173 (B13638) low", "name": "Metrology Well Calibrator", "model": "9173", "serial": "B13638", "maker": "Fluke", "min": 50, "max": 700, "unit": "°C", "res": "0.001 °C", "accuracy": "±0.2 °C", "unc": 0.25, "uncUnit": "°C", "stab": 0, "radial": 0, "axial": 0, "heat": "Fluke 9173", "trace": "Viện Đo lường Việt Nam (VMI)", "due": "2026-12-31"},
    {"id": "9173 (B13638) high", "kind": "t", "key": "9173 (B13638) high", "name": "Metrology Well Calibrator", "model": "9173", "serial": "B13638", "maker": "Fluke", "min": 50, "max": 700, "unit": "°C", "res": "0.001 °C", "accuracy": "±0.25 °C", "unc": 0.4, "uncUnit": "°C", "stab": 0, "radial": 0, "axial": 0, "heat": "Fluke 9173", "trace": "Viện Đo lường Việt Nam (VMI)", "due": "2026-12-31"},
    {"id": "9173 (B87357) low", "kind": "t", "key": "9173 (B87357) low", "name": "Metrology Well Calibrator", "model": "9173", "serial": "B87357", "maker": "Fluke", "min": 50, "max": 700, "unit": "°C", "res": "0.001 °C", "accuracy": "±0.2 °C", "unc": 0.35, "uncUnit": "°C", "stab": 0, "radial": 0, "axial": 0, "heat": "Fluke 9173", "trace": "Viện Đo lường Việt Nam (VMI)", "due": "2027-07-17"}
  ],
  // [Location (short, as on QTG), Location VN, Location EN, Customer VN, Customer EN] – sheet "Location" 2026
  locations: [
    ["KCTV", "Kho Cảng PVGAS Vũng Tàu", "PVGAS Vung Tau Terminal", "Chi nhánh Logistics – Tổng Công ty Khí Việt Nam - CTCP", "PetroVietnam Gas Joint Stock Corporation - Logistics Branch"],
    ["TNTV", "Kho Cảng PVGAS Vũng Tàu", "PVGAS Vung Tau Terminal", "Chi nhánh Logistics – Tổng Công ty Khí Việt Nam - CTCP", "PetroVietnam Gas Joint Stock Corporation - Logistics Branch"],
    ["KLTV", "Kho Cảng PVGAS Vũng Tàu", "PVGAS Vung Tau Terminal", "Chi nhánh Logistics – Tổng Công ty Khí Việt Nam - CTCP", "PetroVietnam Gas Joint Stock Corporation - Logistics Branch"],
    ["GPP", "Nhà máy xử lý Khí Dinh Cố", "Dinh Co Gas Processing Plant", "", ""],
    ["KLNG", "Kho LNG Thị Vải", "LNG Thi Vai Terminal", "Chi nhánh Logistics – Tổng Công ty Khí Việt Nam - CTCP", "PetroVietnam Gas Joint Stock Corporation - Logistics Branch"],
    ["Kho Đình Vũ", "Kho LPG Đình Vũ", "Dinh Vu LPG Storage", "Chi nhánh Khí Hải Phòng - TCT Khí Việt Nam - CTCP", "PVGAS Hai Phong"],
    ["Kho Gò Dầu", "Kho LPG Gò Dầu", "Go Dau LPG Storage", "Chi nhánh Logistics – Tổng Công ty Khí Việt Nam - CTCP", "PetroVietnam Gas Joint Stock Corporation - Logistics Branch"],
    ["Trạm GDS PM", "Trạm GDS Phú Mỹ", "Phu My Gas Distribution Station", "Chi nhánh Khí Đông Nam Bộ - Tổng công ty Khí Việt Nam – CTCP", "Petrovietnam Gas South East Branch"],
    ["Trạm GDS BR", "Trạm GDS Bà Rịa", "Bà Rịa Gas Distribution Station", "Chi nhánh Khí Đông Nam Bộ - Tổng công ty Khí Việt Nam – CTCP", "Petrovietnam Gas South East Branch"],
    ["GDC PM", "Trạm GDC Phú Mỹ", "Phu My Gas Distribution Center", "Chi nhánh Khí Đông Nam Bộ - Tổng công ty Khí Việt Nam – CTCP", "Petrovietnam Gas South East Branch"],
    ["Trạm GDS HP", "Trạm GDS Hiệp Phước", "Hiep Phuoc Gas Distribution Station", "Chi nhánh Khí Đông Nam Bộ - Tổng công ty Khí Việt Nam – CTCP", "Petrovietnam Gas South East Branch"],
    ["Trạm GDC NT", "Trạm GDC Nhơn Trạch", "Nhon Trach Gas Distribution Center", "Chi nhánh Khí Đông Nam Bộ - Tổng công ty Khí Việt Nam – CTCP", "Petrovietnam Gas South East Branch"],
    ["LBV1 NT", "Trạm LBV1 Nhơn Trạch", "Nhon Trach LBV1 Station", "Chi nhánh Khí Đông Nam Bộ - Tổng công ty Khí Việt Nam – CTCP", "Petrovietnam Gas South East Branch"],
    ["LBV2 NT", "Trạm LBV2 Nhơn Trạch", "Nhon Trach LBV2 Station", "Chi nhánh Khí Đông Nam Bộ - Tổng công ty Khí Việt Nam – CTCP", "Petrovietnam Gas South East Branch"],
    ["Trạm PH", "Trạm Phước Hòa", "Phước Hòa LBV Station", "Chi nhánh Khí Đông Nam Bộ - Tổng công ty Khí Việt Nam – CTCP", "Petrovietnam Gas South East Branch"],
    ["Trạm SD", "Trạm Sông Dinh", "Sông Dinh LBV Station", "Chi nhánh Khí Đông Nam Bộ - Tổng công ty Khí Việt Nam – CTCP", "Petrovietnam Gas South East Branch"],
    ["Trạm BR", "Trạm Bà Rịa", "Ba Ria LBV Station", "Chi nhánh Khí Đông Nam Bộ - Tổng công ty Khí Việt Nam – CTCP", "Petrovietnam Gas South East Branch"],
    ["Trạm LH", "Trạm Long Hải", "Long Hai LBV Station", "Chi nhánh Khí Đông Nam Bộ - Tổng công ty Khí Việt Nam – CTCP", "Petrovietnam Gas South East Branch"],
    ["GDC TH", "Trạm GDC Tiền Hải", "Tien Hai Gas Distribution Center", "Chi nhánh Khí Hải Phòng - TCT Khí Việt Nam - CTCP", "PVGAS Hai Phong"],
    ["LFS TH", "Trạm LFS Tiền Hải", "Tien Hai Lane Fall Station", "Chi nhánh Khí Hải Phòng - TCT Khí Việt Nam - CTCP", "PVGAS Hai Phong"],
    ["Trạm LFS", "Trạm Tiếp Bờ", "Ca Mau Lane Fall Station", "CN Khí Tây Nam Bộ - TCT Khí Việt Nam - CTCP", "Petrovietnam Gas South West Branch"],
    ["LFS Cà Mau", "Trạm Tiếp Bờ (LFS)", "Ca Mau Land Fall Station", "CN Khí Tây Nam Bộ - TCT Khí Việt Nam - CTCP", "Petrovietnam Gas South West Branch"],
    ["LBV Cà Mau", "Trạm LBV Cà Mau", "Ca Mau LBV Station", "CN Khí Tây Nam Bộ - TCT Khí Việt Nam - CTCP", "Petrovietnam Gas South West Branch"],
    ["GDC CM", "Trạm GDC Cà Mau", "Ca Mau Gas Distribution Center", "CN Khí Tây Nam Bộ - TCT Khí Việt Nam - CTCP", "Petrovietnam Gas South West Branch"],
    ["GPP Cà Mau", "Nhà máy xử lý Khí Cà Mau", "Ca Mau Gas Processing Plant", "CN Khí Tây Nam Bộ - TCT Khí Việt Nam - CTCP", "Petrovietnam Gas South West Branch"],
    ["NCS GPP", "Nhà máy xử lý Khí Nam Côn Sơn", "Nam Con Son Gas Processing Plant", "Công ty Đường Ống Khí Nam Côn Sơn", "NAMCONSON Pipeline Company."],
    ["Lab DVK", "Phòng Lab DVK", "VILAS 389", "TCT Khí Việt Nam - CTCP- Công ty Dịch Vụ Khí", "PetroVietnam Gas Services"],
    ["Xưởng ĐX", "Xưởng BDSC Đông Xuyên", "Dong Xuyen Maintenance WorkShop", "TCT Khí Việt Nam - CTCP- Công ty Dịch Vụ Khí", "PetroVietnam Gas Services"],
    ["101 Lê Lợi", "Văn phòng 101 Lê Lợi", "101 Le Loi Head Office", "Chi nhánh Khí Đông Nam Bộ - Tổng công ty Khí Việt Nam – CTCP", ""],
    ["Giàn DGCP", "Giàn nén khí Rồng (DGCP)", "Dragon Gas Compression Platform", "Chi nhánh Khí Đông Nam Bộ - Tổng công ty Khí Việt Nam – CTCP", "Petrovietnam Gas South East Branch"],
    ["Giàn CCP", "Giàn nén Khí Trung tâm CCP", "Central Compression Platform", "Chi nhánh Khí Đông Nam Bộ - Tổng công ty Khí Việt Nam – CTCP", "Petrovietnam Gas South East Branch"],
    ["Giàn TB", "Giàn Thái Bình (TBDP-A)", "Thai Binh Platform", "Chi nhánh Khí Hải Phòng - TCT Khí Việt Nam - CTCP", "PVGAS Hai Phong"],
    ["Giàn TƯ", "Giàn Thiên Ưng", "Thien Ung Platform", "Chi nhánh Khí Đông Nam Bộ - Tổng công ty Khí Việt Nam – Công ty cổ phần", "Petrovietnam Gas South East Branch"]
  ],
  settings: {
    ver: 3,
    // Certificate header (MailMerge_PT_Cert / MailMerge_PS_Cert)
    certLines: ["TỔNG CÔNG TY KHÍ VIỆT NAM", "CÔNG TY DỊCH VỤ KHÍ", "PetroVietnam Gas Services Company", "Add: 101 Le Loi Street-Vung Tau Ward- Ho Chi Minh City", "Tel: 84.254.3586376, Fax: 84.254.3563180"],
    companyTag: "(ĐK 18)",
    labName: "PHÒNG THỬ NGHIỆM HIỆU CHUẨN",
  labNameEN: "Experiment Calibration Laboratory",
    addrVN: "Địa chỉ: 101 Lê Lợi, Phường Vũng Tàu, Thành Phố Hồ Chí Minh",
    addrEN: "Add: 101 Le Loi Street-Vung Tau Ward- Ho Chi Minh City",
    tel: "Điện thoại <i>(Tel):</i> 84.254.3586376, Fax: 84.254.3563180",
    place: "TP. Hồ Chí Minh",
    issueDayBlank: true,
    sig1Title: "Trưởng Phòng TNHC", sig1TitleEn: "(Manager of Laboratory)", sig1Name: "Phan Việt Anh",
    sig2Title: "PHÓ GIÁM ĐỐC", sig2TitleEn: "(Deputy General Manager)", sig2Name: "Đỗ Thành Trung",
    footerVN: "Không được sao chép rời khi giấy chứng nhận có nhiều trang nếu không được sự đồng ý bằng văn bản của Công ty Dịch Vụ Khí.",
    footerEN: "(This certificate shall not be reproduced, except in full, without written approval of PV GAS Services.)",
    showLogo: true,
    showAccred: true,
    warnExpired: false,
    dueMonths: 12,
    PT: { procedure: "DVK.LAB.TM.21", env: "Nhiệt độ (Temp): 23±2 ºC, Độ ẩm (Humidity): <70%RH", qtgTemp: "(23 ± 2) °C", qtgHum: "(≤70) %RH",
          form: "TM.10.BM.112.2-1", qtgForm: "DVK.LAB.TM21.PL03", prefix: "CN.PT", bbPrefix: "BB.PT" },
    PS: { procedure: "ĐLVN 133:2004", env: "Nhiệt độ (Temp): 23±5 ºC, Độ ẩm (Humidity): <80%RH", qtgTemp: "(23 ± 5) °C", qtgHum: "(≤80) %RH",
          form: "DVK.LAB.TM.10.BM.133-03", qtgForm: "ĐLVN 133:2004.PL1", prefix: "CN.PS", bbPrefix: "BB.PS" },
    // PG = verification (GCN kiểm định N256.yyA.nnnnn) – 08-2011_PG_CKS_Oct-2026.docx, QTG PG GPP T8 CKS.docx
    PG: { procedure: "ĐLVN 08:2011", procVN: "ĐLVN 08:2011 Áp kế kiểu lò xo - Quy trình kiểm định", procEN: "ĐLVN 08:2011 PG with elastic sensing elements-Methods & means of verification",
          qtgTemp: "(20 ± 5) °C", qtgHum: "< 80 %RH", qtgForm: "ĐLVN 08:2011.PL1", prefix: "N256", series: "A", bbPrefix: "BB.PG", env: "Nhiệt độ: 20±5 °C, Độ ẩm: <80%RH" },
    TS: { procedure: "DVK.LAB.TM.13", env: "Nhiệt độ (Temp): (23±2)°C, Độ ẩm (Humidity): <70%RH", qtgTemp: "(23 ± 2) °C", qtgHum: "(≤70) %RH",
          form: "DLVNTM13", qtgForm: "BM.TM.13-1", prefix: "CN.TS", bbPrefix: "BB.TS" },
    TT: { procedure: "DVK.LAB.TM.12", env: "Nhiệt độ (Temp): (23±2)°C, Độ ẩm (Humidity): <70%RH", qtgTemp: "(23 ± 2) °C", qtgHum: "(≤70) %RH",
          form: "DLVN188.2-2", qtgForm: "DVK.LAB.TM.12.PL2", prefix: "CN.TT", bbPrefix: "BB.TT" },
    RTD: { procedure: "ĐLVN 125:2003", env: "Nhiệt độ (Temp): (23±2)°C, Độ ẩm (Humidity): <70%RH", qtgTemp: "(23 ± 2) °C", qtgHum: "≤50 %RH",
          form: "TM.10.BM.125.2", qtgForm: "ĐLVN 125:2003.PL2", prefix: "CN.RTD", bbPrefix: "BB.RTD" }
  }
};
