/* LAB PVGAS Services – ảnh bằng chứng (tối đa 10 ảnh / hồ sơ, không bắt buộc), yêu cầu của NGOC 30/10/2026.
 * Ảnh lưu trong IndexedDB của trình duyệt (khoá "<id hồ sơ>:<ô>"), thu nhỏ còn cạnh dài 1600 px, JPEG 0,75.
 * Thông tin ô (chú thích, người chụp, thời điểm) nằm trong hồ sơ: rec.photos[i]. */
(function () {
  "use strict";
  const SLOTS = 10, MAXPX = 1600, Q = 0.75;
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((res, rej) => {
      const r = indexedDB.open("lab-pvgas-photos", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("p");
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(mode, fn) {
    const d = await db();
    return new Promise((res, rej) => { const t = d.transaction("p", mode); const out = fn(t.objectStore("p")); t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error); });
  }
  const put = (k, v) => tx("readwrite", s => s.put(v, k));
  const get = k => tx("readonly", s => s.get(k));
  const del = k => tx("readwrite", s => s.delete(k));
  async function delRecord(id) { for (let i = 0; i < SLOTS; i++) await del(`${id}:${i}`); }
  async function all() {
    const d = await db();
    return new Promise((res, rej) => {
      const out = {}, r = d.transaction("p").objectStore("p").openCursor();
      r.onsuccess = () => { const c = r.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); };
      r.onerror = () => rej(r.error);
    });
  }
  function resize(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const k = Math.min(1, MAXPX / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        res(c.toDataURL("image/jpeg", Q));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Không đọc được ảnh")); };
      img.src = url;
    });
  }
  window.LabPhotos = { SLOTS, put, get, del, delRecord, all, resize };
})();
