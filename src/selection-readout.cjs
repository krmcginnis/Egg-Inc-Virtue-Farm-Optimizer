"use strict";
// Native selects retain their keyboard behavior. A wrapped readout is added
// only when the selected name cannot fit inside the closed control.
let frame = null, context;
function refresh() {
  if (frame !== null) return;
  frame = requestAnimationFrame(() => {
    frame = null;
    context ||= document.createElement("canvas").getContext("2d");
    for (const select of document.querySelectorAll("select[data-selected-readout]")) {
      const readout = document.getElementById(select.dataset.selectedReadout);
      if (!readout) continue;
      const text = select.selectedOptions[0]?.textContent || "";
      readout.textContent = text;
      const style = getComputedStyle(select);
      if (context) context.font = style.font;
      const available = select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 22;
      const width = context ? context.measureText(text).width : text.length * 8;
      readout.hidden = !select.value || !select.getClientRects().length || width <= available;
    }
  });
}
function attach(select) {
  if (!/^(hab|vehicle|artifact|stone)-/.test(select.id)) return;
  const readout = document.createElement("span");
  readout.id = select.id + "-full-name";
  readout.className = "selected-value";
  // The native select already announces its selected value. Avoid repeating it
  // in the control's accessible label when this visual readout appears.
  readout.setAttribute("aria-hidden", "true");
  readout.hidden = true;
  select.dataset.selectedReadout = readout.id;
  select.after(readout);
  refresh();
}
function observe(container) {
  if (typeof ResizeObserver !== "undefined") {
    let previousWidth;
    new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === previousWidth) return;
      previousWidth = entry.contentRect.width;
      refresh();
    }).observe(container);
  }
  window.addEventListener("resize", refresh);
  document.addEventListener("toggle", refresh, true);
}
module.exports = { attach, refresh, observe };
