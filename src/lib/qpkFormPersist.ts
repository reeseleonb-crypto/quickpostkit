export function saveQpkForm(values: unknown) {
  try { localStorage.setItem("qpk_form", JSON.stringify(values)); } catch {}
}
export function loadQpkForm<T=any>(): T | null {
  try { const s = localStorage.getItem("qpk_form"); return s ? JSON.parse(s) as T : null; } catch { return null; }
}
