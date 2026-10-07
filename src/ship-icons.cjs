"use strict";
const catalog = require("../assets/brand/ship-icons.json"), Ships = require("./ships.cjs"), Picker = require("./gear-picker.cjs");
function image(item) {
  const icon = document.createElement("span"), asset = catalog.icons[item.id];
  icon.className = "ship-icon"; icon.setAttribute("aria-hidden","true");
  if (asset) {
    icon.dataset.shipIcon = item.id;
    icon.style.backgroundImage = 'url("'+catalog.asset+'")';
    icon.style.backgroundSize = catalog.width*.75+"px "+catalog.height*.75+"px";
    icon.style.backgroundPosition = -asset.x*.75+"px "+(-asset.y*.75)+"px";
  }
  return icon;
}
function decorate(label, describe) {
  const select = label.querySelector("select"), button = document.createElement("button");
  select.setAttribute("aria-label", "Ship"); select.hidden = true;
  button.className = "ship-image-picker secondary"; label.dataset.shipPicker = "true"; label.append(button);
  Picker.bind(button, select, "ship", image, () => ({items:Ships.DATA.ships,plural:"ships",layout:"grid",allowEmpty:false,describe:describe(),note:"Cost and fuel are per launch for the selected mission length. Purchase time uses current gems and current farm earnings, assuming full habs and maintained silos; excludes fueling, future events and purchases."}));
  update(select);
  const probe = new Image(); probe.onerror = () => document.documentElement.classList.add("ship-artwork-unavailable"); probe.src = catalog.asset;
  return label;
}
function update(select) {
  const label = select?.closest?.("[data-ship-picker]"); if (!label) return;
  const item = Ships.DATA.ships.find(s=>s.id===select.value), button = label.querySelector("button"), name = document.createElement("span");
  name.textContent = item?.name || "Choose Ship"; name.className = "ship-picker-name";
  button.replaceChildren(...(item ? [image(item)] : []), name);
  button.title = name.textContent; button.setAttribute("aria-label", "Choose Ship: "+name.textContent);
}
module.exports = {decorate,update};
