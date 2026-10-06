"use strict";
const D = require("./game-data.json"), catalog = require("../assets/brand/artifact-icons.json");
const titleCase = require("./ui-text.cjs");
const artifacts = new Map(D.artifacts.map(item => [item.id, item]));
const stones = new Map(D.stones.map(item => [item.id, item]));
const rarities = ["Common", "Rare", "Epic", "Legendary"];

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function image(item, size, className) {
  const element = node("img", undefined, className);
  element.src = "assets/brand/" + catalog.icons[item.afxId + ":" + item.afxLevel];
  element.width = element.height = size;
  element.alt = ""; element.setAttribute("aria-hidden", "true");
  element.draggable = false;
  element.addEventListener("error", () => { element.hidden = true; });
  return element;
}
function render(host, artifactId, stoneIds = []) {
  const artifact = artifacts.get(artifactId);
  host.replaceChildren();
  host.dataset.artifactId = artifact?.id || "";
  host.dataset.rarity = String(artifact?.rarity || 0);
  host.append(node("h4", artifact ? titleCase(artifact.name) : "Empty Artifact Slot", "loadout-item-name"));
  host.append(node("span", artifact ? "T" + artifact.tier + " · " + rarities[artifact.rarity] : "Choose an artifact when editing manually.", "loadout-item-quality"));
  const artwork = node("div", undefined, "loadout-item-artwork");
  if (artifact) artwork.append(image(artifact, 80, "loadout-artifact-image"));
  else artwork.append(node("span", "Empty", "loadout-empty-artifact"));
  host.append(artwork);

  const sockets = node("div", undefined, "loadout-stone-row");
  sockets.setAttribute("role", "list"); sockets.setAttribute("aria-label", "Socketed Stones");
  const equipped = [];
  for (let i = 0; i < (artifact?.slots || 0); i++) {
    const stone = stones.get(stoneIds[i]);
    const socket = node("span", undefined, "loadout-stone-socket");
    socket.setAttribute("role", "listitem");
    socket.title = stone ? titleCase(stone.label) + " · " + stone.effect : "Empty Stone Slot " + (i + 1);
    socket.setAttribute("aria-label", socket.title);
    if (stone) { socket.append(image(stone, 30, "loadout-stone-image")); equipped.push(stone); }
    else { socket.classList.add("is-empty"); socket.append(node("span", "—")); }
    sockets.append(socket);
  }
  if (artifact && !artifact.slots) sockets.append(node("small", "No Stone Slots"));
  host.append(sockets);

  const effects = node("div", undefined, "loadout-item-effects");
  if (artifact) effects.append(node("p", artifact.effect, "loadout-artifact-effect"));
  const counts = new Map();
  for (const stone of equipped) counts.set(stone.id, (counts.get(stone.id) || 0) + 1);
  for (const [id, count] of counts) {
    const stone = stones.get(id), line = node("p", undefined, "loadout-stone-effect");
    line.append(node("span", (count > 1 ? count + " × " : "") + titleCase(stone.label)));
    line.append(node("span", stone.effect + (count > 1 ? " each" : "")));
    effects.append(line);
  }
  if (artifact?.slots && !equipped.length) effects.append(node("p", "No Stones Equipped", "loadout-stone-effect"));
  host.append(effects);
}
module.exports = { render };
