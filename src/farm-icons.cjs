"use strict";
// Farm choices use image buttons; hidden native values keep the saved schema.
// Timeline artwork and raw plan actions remain unchanged.
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
  const wide = asset.sourceWidth / asset.sourceHeight >= 48 / 28, width = large ? 42 : wide ? 48 : 24, height = large ? 42 : wide ? 28 : 24, scale = width / catalog.iconSize;
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
let describeChoices;
function configure(callback) { describeChoices = callback; }
function pickerImage(kind, id) {
  const artwork = document.createElement("span");
  applyIcon(artwork, kind, id, kind === "hab");
  // Farm picker sizes are 25% smaller; timeline artwork keeps its original size.
  const wide = artwork.dataset.wide === "true";
  const width = kind === "hab" ? 42 : wide ? 36 : 18, height = kind === "hab" ? 42 : wide ? 21 : 18;
  artwork.style.width = width+"px"; artwork.style.height = height+"px"; artwork.style.flexBasis = width+"px";
  if (kind === "vehicle") {
    const asset = catalog.icons[kind+":"+id], scale = width/catalog.iconSize;
    if (asset) { artwork.style.backgroundSize = catalog.width*scale+"px "+catalog.height*scale+"px";
      artwork.style.backgroundPosition = -asset.x*scale+"px "+(-asset.y*scale-(width-height)/2)+"px"; }
  }
  return artwork;
}
function decoratePicker(label, kind) {
  const select = label.querySelector("select"), name = label.firstChild?.textContent || "";
  select.setAttribute("aria-label", kind === "hab" ? name : "Fleet Slot "+(Number(select.id.split("-")[1])+1)+" Vehicle");
  label.dataset.farmPicker = kind;
  for (const node of [...label.childNodes]) if (node !== select) node.remove();
  select.hidden = true;
  const button = document.createElement("button"); button.className = "farm-image-picker secondary";
  label.append(button);
  require("./gear-picker.cjs").bind(button, select, kind, item => pickerImage(kind,item.id), () => ({
    items:kind === "hab" ? data.habs : data.vehicles, plural:kind === "hab" ? "habitats" : "vehicles",
    describe:describeChoices?.(kind,Number(select.id.split("-")[1])) || (() => "Complete farm inputs to see estimates")
  }));
  if (!checkedArtwork) {
    checkedArtwork = true;
    const probe = new Image(); probe.onerror = () => document.documentElement.classList.add("farm-artwork-unavailable"); probe.src = catalog.asset;
  }
  updatePicker(select);
  return label;
}
function updatePicker(select) {
  if (select?.tagName !== "SELECT") return;
  const label = select.closest("[data-farm-picker]");
  if (!label) return;
  const button = label.querySelector(".farm-image-picker"), name = select.selectedOptions[0]?.textContent || "Empty";
  const fallback = document.createElement("span"); fallback.className = "farm-picker-name"; fallback.textContent = name;
  button.replaceChildren(pickerImage(label.dataset.farmPicker,select.value),fallback);
  label.dataset.empty = String(!select.value);
  button.title = name; button.setAttribute("aria-label", "Choose "+select.getAttribute("aria-label")+": "+name);
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
module.exports = { configure, decoratePicker, updatePicker, activityCaption, actionCaption };
