"use strict";
// Presentation only: bundled artwork never enters farm inputs or calculations.
const catalog = require("../assets/eggs/catalog.json");
function icon(key) {
  const asset = catalog.eggs[key];
  if (!asset) return null;
  const image = document.createElement("img");
  image.src = asset.path;
  image.className = "egg-icon";
  image.width = 24;
  image.height = 24;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  image.decoding = "async";
  image.addEventListener("error", () => image.remove(), { once: true });
  return image;
}
function caption(key, text, classes = "egg-label") {
  const group = document.createElement("span"), name = document.createElement("span");
  group.className = classes;
  group.dataset.eggIcon = key;
  name.textContent = text;
  const image = icon(key);
  if (image) group.append(image);
  group.append(name);
  return group;
}
function decorateLabel(label, key) {
  const text = label.firstChild;
  if (!text || text.dataset?.eggIcon === key) return label;
  label.replaceChild(caption(key, text.textContent), text);
  return label;
}
function decorateStatic(root = document) {
  for (const node of root.querySelectorAll("[data-egg]")) {
    const image = icon(node.dataset.egg);
    if (!image) continue;
    node.classList.add("egg-label");
    node.prepend(image);
  }
}
module.exports = { icon, caption, decorateLabel, decorateStatic };
