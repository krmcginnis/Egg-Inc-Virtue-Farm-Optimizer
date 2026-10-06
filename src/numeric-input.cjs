'use strict';
const S = require('./simulator.cjs'), F = require('./number-format.cjs');
// Rounding is presentation only. Untouched imports, save files and recovery
// drafts retain the original number, including values close to a TE threshold.
const sources = new WeakMap(), fields = new WeakSet();
function source(node) {
  const stored = sources.get(node);
  return stored && (node.value === stored.display || node.value === String(stored.value)) ? stored : null;
}
function write(node, value) {
  let numeric = value;
  if (typeof numeric !== 'number' && node.tagName === 'INPUT') {
    try { numeric = S.number(value); } catch { numeric = null; }
  }
  if (node.tagName !== 'INPUT' || !Number.isFinite(numeric)) {
    sources.delete(node); node.value = String(value ?? 0); return;
  }
  node.value = node.type === 'number' ? F.decimal(numeric, false) : F.format(numeric);
  fields.add(node);
  sources.set(node, {value:numeric, display:node.value});
}
function value(node) { return source(node)?.value ?? node.value; }
function draft(node) { return String(source(node)?.value ?? node.value); }
function edited(node) { sources.delete(node); }
function focus(node) {
  const stored = source(node);
  if (!stored) return;
  // Preserve select-all during a replacement edit (including browser autofill).
  // Changing .value otherwise collapses the selection and appends the new text.
  node.value = String(stored.value);
  // Select the exact value so typing replaces it consistently after expansion.
  if (typeof node.select === 'function') node.select();
}
function blur(node) {
  if (!fields.has(node)) return;
  const stored = source(node);
  if (stored) write(node, stored.value);
  else { try { write(node, S.number(node.value)); } catch {} }
}
function restore(node, text) {
  if (fields.has(node) || node.type === 'number') write(node, text);
  else node.value = text;
}
module.exports = {write, value, draft, edited, focus, blur, restore};
