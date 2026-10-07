"use strict";
const Eggs = require("./egg-icons.cjs");
// Frame the visible artwork, rather than its transparent source padding.
// Bounds use alpha >16 on the pinned originals; source files stay untouched.
const frames = {
  gem:[64,64,12,13,38,39], curiosity:[256,256,47,19,162,215],
  kindness:[512,512,77,29,352,456], integrity:[256,256,50,22,157,210],
  resilience:[256,256,50,22,157,210], humility:[256,256,52,22,154,210],
  soul:[336,448,0,0,336,448]
};
function amount(key, value, suffix = "") {
  const group = document.createElement("span"), number = document.createElement("span");
  group.className = "icon-amount"; group.dataset.unitIcon = key;
  const unit = key === "gem" ? "gems" : key === "soul" ? "Soul Eggs" : key+" eggs";
  group.setAttribute("aria-label", value+" "+unit+suffix);
  number.textContent = value; group.append(number);
  const image = key === "gem" ? document.createElement("img") : Eggs.icon(key);
  if (key === "gem") { image.src="assets/brand/gem.png";image.alt="";image.setAttribute("aria-hidden","true");image.width=20;image.height=20; }
  if (image) {
    const symbol = document.createElement("span");symbol.className="unit-symbol";symbol.setAttribute("aria-hidden","true");
    image.classList.add("unit-icon");
    const frame=frames[key];
    if(frame) {
      const [sourceWidth,sourceHeight,x,y,width,height]=frame,scale=100/Math.max(width,height);
      Object.assign(image.style,{width:sourceWidth*scale+"%",height:sourceHeight*scale+"%",left:((100-width*scale)/2-x*scale)+"%",top:((100-height*scale)/2-y*scale)+"%"});
    }
    image.addEventListener("error",()=>{const fallback=document.createElement("span");fallback.textContent=unit;group.insertBefore(fallback,number.nextSibling);symbol.remove();},{once:true});
    symbol.append(image);group.append(symbol);
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
