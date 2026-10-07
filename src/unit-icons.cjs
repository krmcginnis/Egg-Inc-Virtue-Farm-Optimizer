"use strict";
const Eggs = require("./egg-icons.cjs");
function amount(key, value, suffix = "") {
  const group = document.createElement("span"), number = document.createElement("span");
  group.className = "icon-amount"; group.dataset.unitIcon = key;
  const unit = key === "gem" ? "gems" : key === "soul" ? "Soul Eggs" : key+" eggs";
  group.setAttribute("aria-label", value+" "+unit+suffix);
  number.textContent = value; group.append(number);
  const image = key === "gem" ? document.createElement("img") : Eggs.icon(key);
  if (key === "gem") { image.src="assets/brand/gem.png";image.alt="";image.setAttribute("aria-hidden","true");image.width=20;image.height=20; }
  if (image) {
    image.classList.add("unit-icon");
    image.addEventListener("error",()=>{const fallback=document.createElement("span");fallback.textContent=unit;group.insertBefore(fallback,number.nextSibling);image.remove();},{once:true});
    group.append(image);
  } else group.append(document.createTextNode(" "+unit));
  if (suffix) group.append(document.createTextNode(suffix));
  return group;
}
function lines(...items) {
  const group=document.createElement("span");group.className="picker-detail-lines";
  for (const item of items) { const row=document.createElement("span");row.className="picker-detail-line";row.append(item);group.append(row); }
  return group;
}
function accessible(node) {
  if (typeof node === "string") return node;
  const copy=node.cloneNode(true);
  for (const item of copy.querySelectorAll("[aria-label]")) item.replaceChildren(document.createTextNode(item.getAttribute("aria-label")));
  return [...copy.childNodes].map(n=>n.textContent).join(" · ");
}
module.exports={amount,lines,accessible};
