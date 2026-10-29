"use strict";
// Draft date/time values are committed together only when OK is pressed.
function bind(control) {
  const dialog = document.createElement("dialog"); dialog.id = "date-picker"; dialog.className = "gear-picker date-picker";
  dialog.setAttribute("aria-labelledby","date-picker-title");
  dialog.innerHTML = '<h2 id="date-picker-title">Start Date &amp; Time</h2><p class="hint">PC local time · 24-hour time</p><div class="fields"><label>Date<input type="date" aria-label="Start date" required></label><label>Time (24-hour)<input type="text" data-time aria-label="Start time" inputmode="numeric" placeholder="HH:MM" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" required></label></div><div class="date-picker-actions"><button type="button" class="secondary" data-cancel>Cancel</button><button type="button" data-ok>Ok</button></div>';
  document.body.append(dialog);
  const date = dialog.querySelector('[type="date"]'), time = dialog.querySelector('[data-time]');
  const open = () => {
    if (control.matches(":disabled") || dialog.open) return;
    const parts = control.value.replace(' ','T').split("T"); date.value = parts[0] || ""; time.value = parts[1]?.slice(0,5) || "";
    dialog.showModal(); date.focus();
  };
  control.setAttribute("aria-haspopup","dialog"); control.setAttribute("aria-controls",dialog.id);
  control.addEventListener("click",event => { event.preventDefault(); open(); });
  control.addEventListener("keydown",event => {
    if (event.key === " " || event.altKey && event.key === "ArrowDown") { event.preventDefault(); open(); }
  });
  dialog.querySelector("[data-cancel]").onclick = () => dialog.close();
  dialog.querySelector("[data-ok]").onclick = () => {
    if (!date.reportValidity() || !time.reportValidity()) return;
    const value = date.value+" "+time.value;
    if (!Number.isFinite(require('./date-time.cjs').parseLocal(value))) return;
    if (control.value !== value) {
      control.value = value;
      control.dispatchEvent(new Event("input",{bubbles:true})); control.dispatchEvent(new Event("change",{bubbles:true}));
    }
    dialog.close();
  };
  dialog.addEventListener("close",() => control.focus({preventScroll:true}));
  dialog.addEventListener("click",event => {
    const r = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
  });
  dialog.addEventListener("keydown",event => {
    if (event.key === "Escape") { event.preventDefault(); dialog.close(); }
    if (event.key === "Enter") { event.preventDefault(); dialog.querySelector("[data-ok]").click(); }
    if (event.key === "Tab") {
      const controls = [...dialog.querySelectorAll("input,button")], first=controls[0], last=controls.at(-1);
      if (event.shiftKey && document.activeElement === first || !event.shiftKey && document.activeElement === last) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
    }
  });
}
module.exports = {bind};
