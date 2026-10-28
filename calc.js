/* LAB PVGAS Services – calculation core.
 * Ported 1:1 from the company workbooks (macros by khainv@pvgas.com.vn):
 *  - PT : "GPP_2024_PT_Uncer Form.xls"  sheet DLVN112-2002_Rev2 (form TM.10.BM.112.2-1) + Data112
 *  - PS : "GPP_PS Uncer Form.xls"       sheet "DLVN133 - 2004" (form DVK.LAB.TM.10.BM.133-03) + Data133
 * Cell references are kept in comments so the Quality Checker can trace every number.
 */
(function (root) {
  "use strict";

  // Stand!A4:K14 – pressure unit factors, expressed per 1 bar (the sheet builds every row from these).
  const UNITS = { bar: 1, "kg/cm2": 1.019716213, kPa: 100, psi: 14.503773773, inH2O: 401.47, mbar: 1000, MPa: 0.1, "lbf/in2": 14.503773773, mmH2O: 10197.162 };
  function factor(from, to) {
    if (from === to) return 1;
    if (!(from in UNITS) || !(to in UNITS)) return NaN;
    return UNITS[to] / UNITS[from];
  }

  // Excel ROUND (half away from zero) with float guard.
  function xround(v, d) {
    const p = Math.pow(10, d);
    const s = v < 0 ? -1 : 1;
    return s * Math.round((Math.abs(v) * p) * (1 + 1e-12)) / p;
  }

  // Data112!GC / Data133!CG – uncertainty is always rounded UP by adding half a digit:
  //  fraction ≥ 0.1  -> 2 decimals ; 0.01–0.099 -> 3 decimals ; 0.001–0.0099 -> 4 decimals.
  // Excel returns 0 when the fraction is < 0.001 (e.g. U = 2.0000); we fall back to 4 decimals instead
  // and flag it, so a certificate never prints U = 0.
  function roundUnc(x) {
    if (!isFinite(x)) return { text: "—", flag: false };
    const frac = xround(x - Math.floor(x), 4);
    const digits = String(Math.round(frac * 1e4)).length;
    const frac4 = Math.round(frac * 1e4);
    if (frac4 >= 1000 || (digits === 4)) return { text: xround(x + 0.005, 2).toFixed(2), flag: false };
    if (frac4 >= 100) return { text: xround(x + 0.0005, 3).toFixed(3), flag: false };
    if (frac4 >= 10) return { text: xround(x + 0.00005, 4).toFixed(4), flag: false };
    return { text: xround(x + 0.00005, 4).toFixed(4), flag: true };
  }

  function mean(a) { return a.reduce((s, v) => s + v, 0) / a.length; }
  function devsq(a) { const m = mean(a); return a.reduce((s, v) => s + (v - m) * (v - m), 0); }
  function steyx(y, x) {
    const n = x.length, mx = mean(x), my = mean(y);
    let sxx = 0, sxy = 0, syy = 0;
    for (let i = 0; i < n; i++) { sxx += (x[i] - mx) ** 2; sxy += (x[i] - mx) * (y[i] - my); syy += (y[i] - my) ** 2; }
    return Math.sqrt(Math.max(0, (syy - sxy * sxy / sxx) / (n - 2)));
  }
  function linest(y, x) {
    const mx = mean(x), my = mean(y);
    let sxx = 0, sxy = 0;
    for (let i = 0; i < x.length; i++) { sxx += (x[i] - mx) ** 2; sxy += (x[i] - mx) * (y[i] - my); }
    const b = sxy / sxx;
    return { b, a: my - b * mx };
  }

  /* Standard (Stand) record, as in sheet "Stand Ref":
   * { min, max, unit, unc, uncUnit ('%' or pressure/elec unit), rdg (% of reading), deadweight (bool) }
   * For a pressure standard the uncertainty is converted to the DUT unit the same way the sheet does:
   * value * factor(stand.unit -> DUT unit).
   */
  function standInUnit(s, unit) {
    const f = factor(s.unit, unit);
    return { min: s.min * f, max: s.max * f, unc: s.uncUnit === "%" ? s.unc : s.unc * f, f };
  }

  /* ---------------- PT / DPT (4–20 mA) – DLVN112-2002_Rev2 ---------------- */
  function calcPT(inp) {
    const { min: mn, max: mx, unit, acc, k = 2 } = inp;
    const xs = inp.points.map(Number);
    const rise = inp.rise.map(Number), fall = inp.fall.map(Number);
    const m = xs.length;
    const span = mx - mn;
    const s1 = inp.stand1, s2 = inp.stand2;
    const S1 = standInUnit(s1, unit);                       // E9, E10, E11
    const E12 = s1.uncUnit === "%" ? s1.unc : S1.unc / (S1.max - S1.min) * 100; // ĐKĐBĐ quy đổi (%)
    const E13 = s1.rdg || 0;                                // % of reading
    const H9 = s2.min, H10 = s2.max;
    const H12 = s2.uncUnit === "%" ? s2.unc : s2.unc / (H10 - H9) * 100;
    const H13 = s2.rdg || 0;
    const G6 = 4, G7 = 20;

    // Row 20: corrected pressure. "Đã hiệu chỉnh áp suất" = Yes -> x used as is (only path supported).
    const X = xs.concat(xs);
    const Y = rise.concat(fall);
    const I = X.map(x => 4 + 16 * (x - mn) / span);         // row 21 standard current
    const { a, b } = linest(Y, X);                          // F29, F28
    const Sy = steyx(Y, X);                                 // F33
    const K34 = devsq(I), L34 = I.reduce((s, v) => s + v * v, 0), M34 = I.length, N34 = I.reduce((s, v) => s + v, 0);
    const Sa = Sy * Math.sqrt(L34 / M34 / K34);             // F34
    const Sb = Sy * Math.sqrt(1 / K34);                     // F35
    const r = -N34 / Math.sqrt(M34 * L34);                  // F36
    const uv = Math.sqrt((H12 * (H10 - H9) / (2 * (G7 - G6))) ** 2 + ((H13 / (H10 - H9)) / (2 * Math.sqrt(3))) ** 2); // F39

    const cols = X.map((x, j) => {
      const uAmA = Math.sqrt(Math.max(0, Sa * Sa + I[j] * I[j] * Sb * Sb + 2 * I[j] * Sa * Sb * r)); // row 23
      const uA = 100 * uAmA / (G7 - G6);                    // row 24 (%)
      const us = s1.deadweight
        ? (E12 * Math.abs(x)) / (2 * span)
        : (E12 * (S1.max - S1.min) + E13 * Math.abs(x)) / (2 * span); // row 38 (%)
      const uc = Math.sqrt(uA * uA + us * us + uv * uv);    // row 25 (%)
      return { x, I: I[j], y: Y[j], uAmA, uA, us, uc };
    });

    const rows = xs.map((x, i) => {
      const ideal = 4 + 16 * (x - mn) / span;
      const shcR = ideal - rise[i], shcF = ideal - fall[i];
      const ucAvg = (cols[i].uc + cols[i + m].uc) / 2;      // I46
      const Upct = ucAvg * k;                               // K46
      const U = Upct * span / 100;                          // J46 (DUT unit)
      return { x, ideal, rise: rise[i], fall: fall[i], shcR, shcF, ucAvg, Upct, U };
    });
    const Umax = Math.max(...rows.map(r => r.U));           // Data112!CZ
    const shcMax = Math.max(...rows.map(r => Math.max(Math.abs(r.shcR), Math.abs(r.shcF))));
    const limU = acc * span / 100, limI = acc * 16 / 100;
    const pass = Umax <= limU && !(shcMax > limI);          // Data112!IF
    return {
      type: "PT", k, a, b, Sy, Sa, Sb, r, uv, E9: S1.min, E10: S1.max, E11: S1.unc, E12, E13, H12, H13, H9, H10,
      factor1: S1.f, cols, rows, Umax, shcMax, limU, limI, pass,
      UmaxText: roundUnc(Umax),
      checks: { uOK: Umax <= limU, iOK: !(shcMax > limI) }
    };
  }

  /* ---------------- PS / DPS – DLVN133-2004 ---------------- */
  function calcPS(inp) {
    const { pset, unitPset: unit, acc, k = 2, n = 5, resolution = 0 } = inp;
    const hi = inp.high.map(Number), lo = inp.low.map(Number);   // C20:C24 (P.High) , D20:D24 (P.Low)
    const s1 = inp.stand1;
    const S1 = standInUnit(s1, unit);                             // E11 (min), E12 (FS), E13 (unc)
    const E14 = s1.uncUnit === "%" ? s1.unc : S1.unc / (S1.max - S1.min) * 100;
    const G14 = s1.rdg || 0;
    const G = hi.map(v => pset - v), H = lo.map(v => pset - v);   // G20:H24
    const dir = Math.abs(mean(G)) > Math.abs(mean(H)) ? "Falling" : "Rising"; // E9
    const F28 = mean(hi), F29 = mean(lo);
    const F26 = Math.sqrt(hi.reduce((s, v) => s + (v - F28) ** 2, 0) / (n * (n - 1)));
    const F27 = Math.sqrt(lo.reduce((s, v) => s + (v - F29) ** 2, 0) / (n * (n - 1)));
    const F31 = s1.deadweight ? (E14 * pset) / (2 * 100) : (E14 * S1.max + G14 * pset) / (100 * 2); // uses E16 = 2
    const F32 = resolution / 2;
    const F34 = Math.sqrt(F26 ** 2 + F31 ** 2 + (F32 / Math.sqrt(3)) ** 2);
    const F35 = Math.sqrt(F27 ** 2 + F31 ** 2 + (F32 / Math.sqrt(3)) ** 2);
    const F37 = k * F34, F38 = k * F35;
    const rising = dir === "Rising";
    const set = rising ? hi : lo, reset = rising ? lo : hi;
    const setDev = rising ? G : H, resetDev = rising ? H : G;
    const U = rising ? F37 : F38;                                  // I42
    const J42 = Math.max(...setDev.map(Math.abs)) + U;
    const K42 = acc * pset / 100;
    const pass = U > 0 ? !(J42 > K42) : false;                     // D47
    return {
      type: "PS", k, dir, E11: S1.min, E12: S1.max, E13: S1.unc, E14, G14, factor1: S1.f,
      F26, F27, F28, F29, F31, F32, F34, F35, F37, F38, U, J42, K42, pass,
      set, reset, setDev, resetDev, hi, lo, G, H, Utext: roundUnc(U)
    };
  }

  // Data112!V/X : EOMONTH(calDate, months)
  function eomonth(d, months) { return new Date(d.getFullYear(), d.getMonth() + months + 1, 0); }

  const api = { UNITS, factor, xround, roundUnc, calcPT, calcPS, eomonth, steyx, linest };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LabCalc = api;
})(typeof self !== "undefined" ? self : this);
