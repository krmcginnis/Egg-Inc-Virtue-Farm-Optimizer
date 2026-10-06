"use strict";
// Decorative artwork only; research IDs, input labels and calculations are retained.
const catalog = require("../assets/brand/research-icons.json");
const commonIds = new Map(require("./game-data.json").research.map(research => [research.name, research.id]));
function icon(id) {
  const asset = catalog.icons[id];
  if (!asset) return null;
  const image = document.createElement("span"), scale = 24 / catalog.iconSize;
  image.className = "research-icon";
  image.setAttribute("aria-hidden", "true");
  image.style.backgroundImage = 'url("' + catalog.asset + '")';
  image.style.backgroundSize = catalog.width * scale + "px " + catalog.height * scale + "px";
  image.style.backgroundPosition = -asset.x * scale + "px " + -asset.y * scale + "px";
  return image;
}
function caption(id, text) {
  const group = document.createElement("span"), name = document.createElement("span");
  group.className = "research-caption"; group.dataset.researchIcon = id;
  name.textContent = text;
  const artwork = icon(id);
  if (artwork) group.append(artwork);
  group.append(name);
  return group;
}
function decorateLabel(label, id) {
  const text = label.firstChild;
  if (text && text.dataset?.researchIcon !== id) label.replaceChild(caption(id, text.textContent), text);
  return label;
}
function captionName(text) { return caption(commonIds.get(text), text); }
module.exports = { icon, caption, captionName, decorateLabel };
