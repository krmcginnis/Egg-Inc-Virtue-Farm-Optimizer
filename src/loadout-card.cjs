"use strict";
const D = require("./game-data.json"), catalog = require("../assets/brand/artifact-icons.json");
const Picker = require("./gear-picker.cjs");
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
  if (className === "gear-choice-image") element.loading = "lazy";
  element.addEventListener("error", () => { element.hidden = true; });
  return element;
}
function render(host, artifactId, stoneIds = [], controls = {}) {
  const artifact = artifacts.get(artifactId);
  host.replaceChildren();
  host.dataset.artifactId = artifact?.id || "";
  host.dataset.rarity = String(artifact?.rarity || 0);
  host.append(node("h4", artifact ? titleCase(artifact.name) : "Empty Artifact Slot", "loadout-item-name"));
  host.append(node("span", artifact ? "T" + artifact.tier + " · " + rarities[artifact.rarity] : "Choose an artifact when editing manually.", "loadout-item-quality"));
  const artwork = node(controls.artifact ? "button" : "div", undefined, "loadout-item-artwork");
  if (controls.artifact) Picker.bind(artwork, controls.artifact, "artifact", image);
  if (artifact) artwork.append(image(artifact, 80, "loadout-artifact-image"));
  else artwork.append(node("span", "Empty", "loadout-empty-artifact"));
  host.append(artwork);

  const sockets = node("div", undefined, "loadout-stone-row");
  sockets.setAttribute("role", "list"); sockets.setAttribute("aria-label", "Socketed Stones");
  const equipped = [];
  for (let i = 0; i < (artifact?.slots || 0); i++) {
    const stone = stones.get(stoneIds[i]);
    const wrapper = node("span"); wrapper.setAttribute("role", "listitem");
    const socket = node(controls.stones?.[i] ? "button" : "span", undefined, "loadout-stone-socket");
    if (controls.stones?.[i]) Picker.bind(socket, controls.stones[i], "stone", image);
    wrapper.append(socket);
    socket.title = stone ? titleCase(stone.label) + " · " + stone.effect : "Empty Stone Slot " + (i + 1);
    if (!controls.stones?.[i]) socket.setAttribute("aria-label", socket.title);
    if (stone) { socket.append(image(stone, 30, "loadout-stone-image")); equipped.push(stone); }
    else { socket.classList.add("is-empty"); socket.append(node("span", controls.stones?.[i] ? "+" : "—")); }
    sockets.append(wrapper);
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
function strip(loadout, label, limit = loadout.length) {
  const host = node("div", undefined, "artifact-strip");
  host.setAttribute("role", "group"); host.setAttribute("aria-label", label);
  host.style.setProperty("--artifact-count",limit);
  const rank = slot => { const id = slot.artifactId || ""; return !id ? 4 : id.startsWith("ornate-gusset-") ? 0 : id.startsWith("quantum-metronome-") ? 1 : id.startsWith("interstellar-compass-") ? 2 : 3; };
  const slots = [...loadout]; while (slots.length < limit) slots.push({artifactId:null,stones:[]});
  for (const slot of slots.sort((a,b) => rank(a)-rank(b))) {
    const card = node("div", undefined, "loadout-card");
    render(card, slot.artifactId, slot.stones);
    const artifact = artifacts.get(slot.artifactId), name = card.querySelector(".loadout-item-name");
    if (artifact) { name.textContent = ["Gusset","Metronome","Compass"][rank(slot)] || titleCase(artifact.name); name.setAttribute("aria-label",titleCase(artifact.label)); card.title = titleCase(artifact.label)+" · "+artifact.effect; }
    host.append(card);
  }
  return host;
}
module.exports = { render, strip };
