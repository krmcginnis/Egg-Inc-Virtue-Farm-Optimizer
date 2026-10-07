"use strict";
const D = require("./game-data.json"), titleCase = require("./ui-text.cjs");
let dialog, heading, search, grid, count, active;
function element(tag, text, cls) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}
function initialize() {
  if (dialog) return;
  dialog = element("dialog", undefined, "gear-picker"); dialog.id = "gear-picker";
  dialog.setAttribute("aria-labelledby", "gear-picker-title");
  const top = element("div", undefined, "gear-picker-heading");
  heading = element("h2"); heading.id = "gear-picker-title";
  const close = element("button", "Close", "secondary"); close.type = "button"; close.onclick = () => dialog.close();
  top.append(heading, close);
  search = element("input"); search.type = "search"; search.placeholder = "Find by name, tier or effect…";
  search.setAttribute("aria-label", "Filter items"); search.oninput = render;
  count = element("p", undefined, "hint"); count.setAttribute("role", "status"); count.setAttribute("aria-live", "polite");
  grid = element("div", undefined, "gear-picker-grid");
  const controls = element("div", undefined, "gear-picker-controls"); controls.append(top, search, count);
  dialog.append(controls, grid); document.body.append(dialog);
  dialog.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); dialog.close(); }
    if (event.key === "Tab") {
      const controls = [...dialog.querySelectorAll("button,input")].filter(node => !node.matches(":disabled") && node.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first || !event.shiftKey && document.activeElement === last) {
        event.preventDefault(); (event.shiftKey ? last : first)?.focus();
      }
    }
  });
  dialog.addEventListener("close", () => {
    const id = active?.control.dataset.pickerId;
    active = null;
    document.getElementById(id)?.focus({preventScroll:true});
  });
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
}
function choose(value) {
  const control = active?.control;
  if (!control?.isConnected || control.matches(":disabled")) { dialog.close(); return; }
  control.value = value;
  control.dispatchEvent(new Event("input", {bubbles:true}));
  control.dispatchEvent(new Event("change", {bubbles:true}));
  dialog.close();
}
function render() {
  if (!active) return;
  const query = search.value.trim().toLowerCase();
  const items = (active.catalog?.items || (active.kind === "artifact" ? D.artifacts : D.stones)).filter(item => ((item.label || item.name || "")+" "+(item.effect || "")).toLowerCase().includes(query));
  grid.classList.toggle("farm-choice-list", !!active.catalog && active.catalog.layout !== "grid");
  grid.classList.toggle("ship-choice-grid", active.kind === "ship");
  grid.replaceChildren();
  const empty = element("button", "Empty", "gear-choice gear-choice-empty"); empty.type = "button";
  empty.dataset.itemId = ""; empty.setAttribute("aria-pressed", String(!active.control.value)); empty.onclick = () => choose(""); if (active.catalog?.allowEmpty !== false) grid.append(empty);
  for (const item of items) {
    const button = element("button", undefined, "gear-choice"); button.type = "button";
    button.dataset.itemId = item.id;
    if (active.catalog) {
      const detail = active.catalog.describe(item);
      button.classList.add("farm-choice");
      button.setAttribute("aria-label", item.name+" · "+detail);
      button.setAttribute("aria-pressed", String(active.control.value === String(item.id)));
      const copy = element("span", undefined, "farm-choice-copy");
      copy.append(element("span", item.name, "gear-choice-name"), element("small", detail));
      button.append(active.image(item), copy);
      button.onclick = () => choose(item.id); grid.append(button); continue;
    }
    button.dataset.rarity = String(item.rarity || 0);
    button.setAttribute("aria-label", titleCase(item.label)+" · "+item.effect+(active.kind === "artifact" ? " · "+item.slots+" stone slots" : ""));
    button.setAttribute("aria-pressed", String(active.control.value === item.id));
    button.append(active.image(item, 64, "gear-choice-image"), element("span", titleCase(item.label), "gear-choice-name"), element("small", item.effect));
    if (active.kind === "artifact") button.append(element("small", item.slots+" stone slot"+(item.slots===1 ? "" : "s")));
    button.onclick = () => choose(item.id); grid.append(button);
  }
  count.textContent = items.length ? items.length+" matching "+(active.catalog?.plural || (active.kind === "artifact" ? "artifacts" : "stones")) : "No matches. Try another name or effect.";
  if (active.catalog) count.textContent += " · "+(active.catalog.note || "Current research and bonuses. ETA assumes full habs, maintained silos and unchanged current earnings; excludes future events and purchases.");
}
function bind(button, control, kind, image, catalog) {
  initialize();
  const label = control.getAttribute("aria-label");
  button.id = "pick-"+control.id; control.dataset.pickerId = button.id;
  button.type = "button"; button.setAttribute("aria-haspopup", "dialog"); button.setAttribute("aria-controls", "gear-picker");
  button.setAttribute("aria-label", "Choose "+label+": "+(control.selectedOptions[0]?.textContent || "Empty"));
  button.onclick = () => {
    if (control.matches(":disabled")) return;
    initialize(); active = {control,kind,image,catalog:typeof catalog === "function" ? catalog() : catalog}; search.value = "";
    search.placeholder = active.catalog ? "Find by name…" : "Find by name, tier or effect…";
    heading.textContent = "Choose "+label; render(); dialog.showModal(); search.focus();
  };
}
module.exports = {bind};
