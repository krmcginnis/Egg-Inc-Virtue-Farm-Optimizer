"use strict";
// Decorative artwork only. Native selects and raw plan actions remain unchanged.
const catalog = require("../assets/brand/farm-icons.json"), data = require("./game-data.json");
let checkedArtwork = false;
function applyIcon(node, kind, id, large = false) {
  const key = kind + ":" + id, asset = id === "" || id === null ? null : catalog.icons[key];
  node.className = "farm-icon";
  node.setAttribute("aria-hidden", "true");
  node.dataset.farmKind = kind;
  if (!asset) {
    delete node.dataset.farmIcon;
    delete node.dataset.wide;
    node.style.backgroundImage = "none";
    node.removeAttribute("title");
    return;
  }
  const wide = asset.sourceWidth / asset.sourceHeight >= 48 / 28, width = large ? 56 : wide ? 48 : 24, height = large ? 56 : wide ? 28 : 24, scale = width / catalog.iconSize;
  node.dataset.wide = String(wide);
  node.dataset.farmIcon = key;
  node.title = asset.name;
  node.style.backgroundImage = 'url("' + catalog.asset + '")';
  node.style.backgroundSize = catalog.width * scale + "px " + catalog.height * scale + "px";
  node.style.backgroundPosition = -asset.x * scale + "px " + (-asset.y * scale - (width - height) / 2) + "px";
}
function icon(kind, id) {
  if (!catalog.icons[kind + ":" + id]) return null;
  const node = document.createElement("span");
  applyIcon(node, kind, id);
  return node;
}
function caption(kind, id, text) {
  const group = document.createElement("span"), name = document.createElement("span");
  group.className = "farm-caption";
  const artwork = icon(kind, id);
  if (artwork) group.append(artwork);
  name.textContent = text;
  group.append(name);
  return group;
}
function decoratePicker(label, kind) {
  const select = label.querySelector("select"), first = label.firstChild, text = first?.nodeType === 3 ? first : null;
  const group = document.createElement("span"), artwork = document.createElement("span"), name = document.createElement("span");
  label.dataset.farmPicker = kind;
  group.className = "farm-picker-caption";
  artwork.className = "farm-icon";
  name.textContent = text?.textContent || "";
  group.append(artwork, name);
  if (text) label.replaceChild(group, text);
  else label.insertBefore(group, select);
  if (kind === "hab") {
    select.setAttribute("aria-label", name.textContent);
    const empty = document.createElement("span"); empty.className = "hab-empty-caption"; empty.textContent = "Empty"; group.append(empty);
    if (!checkedArtwork) {
      checkedArtwork = true;
      const probe = new Image(); probe.onerror = () => document.documentElement.classList.add("farm-artwork-unavailable"); probe.src = catalog.asset;
    }
  }
  updatePicker(select);
  return label;
}
function updatePicker(select) {
  if (select?.tagName !== "SELECT") return;
  const label = select.closest("[data-farm-picker]");
  if (label) {
    applyIcon(label.querySelector(".farm-icon"), label.dataset.farmPicker, select.value, label.dataset.farmPicker === "hab");
    label.dataset.empty = String(!select.value);
    select.title = catalog.icons[label.dataset.farmPicker + ":" + select.value]?.name || "Empty";
  }
}
function activityCaption(activity) {
  if (activity.kind === "physical") {
    const items = activity.label === "Habitats" ? data.habs : activity.label === "Vehicles" ? data.vehicles : [];
    const item = items.find(item => activity.value?.endsWith(" × " + item.name));
    if (item) return caption(activity.label === "Habitats" ? "hab" : "vehicle", item.id, activity.label);
    if (activity.label === "Hyperloop Cars" || /^Train \d+ cars$/i.test(activity.label)) return caption("car", "hyperloop", activity.label);
  }
  return caption(null, null, activity.label);
}
function actionCaption(action, text) {
  return caption(action.type, action.type === "car" ? "hyperloop" : action.id, text);
}
module.exports = { decoratePicker, updatePicker, activityCaption, actionCaption };
