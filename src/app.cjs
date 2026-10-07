"use strict";
const Ships = require("./ships.cjs");
const titleCase = require("./ui-text.cjs"), DEFAULT_ROUTE = require("./default-route.cjs");
const upgradeStandardSequence = require("./sequence-upgrade.cjs"), Route = require("./switch-sequence.cjs");
const Model = require("./assumption-notices.cjs");
const Strategy = require("./planning-strategy.cjs"), SalePlans = require("./research-sale-plans.cjs");
const ShiftPlans = require("./shift-plans.cjs");
const gemsText = require("./gems-text.cjs");
const nextAscension = require("./next-ascension.cjs"), U = require("./shift-summary.cjs"), Q = require("./walkthrough-pdf.cjs"), N = require("./export-names.cjs"), V = require("./pdf-preview.cjs"), G = require("./guide-layout.cjs");
const S = require("./simulator.cjs"), O = require("./optimizer.cjs"), I = require("./importer.cjs"), A = require("./api.cjs"), C = require("./colleggtibles.cjs");
const NumberFormat = require("./number-format.cjs"), NumericInput = require("./numeric-input.cjs");
const ArtifactSets = require("./artifact-optimizer.cjs");
const LoadoutCard = require("./loadout-card.cjs");
const EggIcons = require("./egg-icons.cjs");
const Units = require("./unit-icons.cjs"), Zones = require("./timezones.cjs");
const ResearchIcons = require("./research-icons.cjs");
const FarmIcons = require("./farm-icons.cjs");
const ShipIcons = require("./ship-icons.cjs");
const PhysicalPreview = require("./physical-preview.cjs");
const DatePicker = require("./date-picker.cjs");
const displayEggOrder = [0,4,1,3,2];
const SelectionReadout = require("./selection-readout.cjs");
const AppUpdates = require("./app-updates.cjs");
const Defaults = require("./ui-defaults.cjs");
const remainingResearchCost = require("./research-cost-preview.cjs");
const $ = (id) => document.getElementById(id), D = S.D;
const EID_KEY = "virtue-optimizer.eid.v1", EID_NAME_KEY = "virtue-optimizer.eid-name.v1";
let savedEid = "", savedEidName = "", eidDraft = "";
let config = Defaults.freshFarm(), result = null, resultConfig = null, worker = null, dirty = false, refreshTimer, loadEpoch = 0, importingBackup = null, searchTimer = null, searchStartedAt = 0, searchBestSeconds = null, searchContext = "", resetSnapshot = null, invalidField = null;
const searchOptions = { width: 32, branches: 12, maxDepth: 1200, maxMs: 45e3 };
let activeLoadoutTab = "current";
const labels = { account: "Account", farm: "Virtue Farm", planning: "Planning", results: "Purchase timeline", help: "How it works" };
const colNames = { earnings: "Earnings", awayEarnings: "Away earnings", ihr: "Internal hatchery", elr: "Egg laying", shippingCap: "Shipping capacity", habCap: "Hab capacity", vehicleCost: "Vehicle cost", habCost: "Hab cost", researchCost: "Research cost" };
function el(tag, text, cls) {
  const e = document.createElement(tag);
  if (text !== void 0) e.textContent = typeof text === "string" ? gemsText(["h1", "h2", "h3", "h4", "h5", "h6", "button", "label", "th", "summary", "option"].includes(tag) ? titleCase(text) : text) : text;
  if (cls) e.className = cls;
  return e;
}
function option(value, text) {
  const o = el("option", text);
  o.value = value;
  return o;
}
function show(message, error = false) {
  $("notice").setAttribute("role", error ? "alert" : "status");
  $("notice").setAttribute("aria-live", error ? "assertive" : "polite");
  $("notice").textContent = gemsText(message);
  $("notice").classList.toggle("error", error);
}
function updateSequenceVisibility() {
  const strategy = $("strategy").value, automatic = strategy !== "user";
  $("fixed-sequence").hidden = automatic;
  $("sequence").disabled = automatic;
  $("sequence").required = !automatic;
  $("wasmegg-sequence-description").hidden = strategy === "user";
  $("automatic-shift-limit").hidden = !automatic;
  $("maxShifts").disabled = !automatic;
  $("strategy-description").textContent = {
    wasmegg: "Searches route order, research, and timing within your maximum new shifts. Shows up to three fastest plans using different shift counts.",
    user: "Enter your truth egg switch sequence below. The solver preserves your order and chooses visit durations. Plans can stop early once the goal and missions are complete. The final C is delivery-only."
  }[strategy] || "Select a planning strategy.";
  $("routing-help").textContent = automatic ? "Choose User Selected Sequence to enter your own order." : "Your truth egg sequence controls the visit order.";
}
function updatePlanControls() {
  const automatic = $("autoTeAllocation").checked;
  $("te-minimums").hidden = automatic;
  $("goal-fields").disabled = automatic;
}
function retainedNumber(id) {
  const value = NumericInput.value($(id));
  return value === "" || !Number.isFinite(Number(value)) ? value : Number(value);
}
const num = NumberFormat.format;
const compactNumber = value => num(value).replace(/\.0+(?=[A-Za-z]*$)/,"").replace(/(\.\d*[1-9])0+(?=[A-Za-z]*$)/,"$1");
const fuelNumber = require('./fuel-format.cjs');
function duration(n) {
  if (!Number.isFinite(n)) return "\u2014";
  if (n > 0 && n < 1) return "<1s";
  const seconds = Math.max(0, Math.ceil(n)), days = Math.floor(seconds / 86400), hours = Math.floor(seconds % 86400 / 3600), mins = Math.floor(seconds % 3600 / 60);
  return [days ? days + "d" : "", hours ? hours + "h" : "", mins ? mins + "m" : "", seconds < 60 ? seconds + "s" : ""].filter(Boolean).join(" ") || "0s";
}
function exactDuration(n) {
  const total = Math.max(0, Math.ceil(n)), d = Math.floor(total / 86400), h = Math.floor(total % 86400 / 3600), m = Math.floor(total % 3600 / 60), sec = total % 60;
  return [d ? d + "d" : "", h ? h + "h" : "", m ? m + "m" : "", sec ? sec + "s" : ""].filter(Boolean).join(" ") || "0s";
}
function waitTotals(t) {
  return "Online waiting " + exactDuration(t.onlineSeconds) + " \xB7 Offline " + exactDuration(t.offlineSeconds) + " (" + t.offlineBreaks + " breaks)" + (t.interactionSeconds ? " \xB7 Interactions " + exactDuration(t.interactionSeconds) : "") + (t.fuelSeconds ? " \xB7 Fueling " + exactDuration(t.fuelSeconds) : "");
}
function dateLocal(t) {
  const d = new Date(t * 1e3);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
// Formatting options are fixed. Reuse formatters instead of creating one for
// every purchase, while preserving each exact date and selected timezone.
const timestampFormats = new Map();
function timestamp(t, zone, includeYear = false, compact = false) {
  const key = zone + ":" + includeYear + ":" + compact;
  if (!timestampFormats.has(key)) timestampFormats.set(key, new Intl.DateTimeFormat("en-US", { timeZone: zone, year: includeYear ? "numeric" : void 0, month: "short", day: "numeric", weekday: compact ? undefined : "short", hour: "2-digit", minute: "2-digit", second: compact ? undefined : "2-digit", timeZoneName: "short" }));
  return timestampFormats.get(key).format(new Date(t * 1e3));
}
function tab(name, focusHeading = false) {
  const section = name === "artifacts" ? "artifacts-card" : name === "research" ? "common-research-card" : null;
  if (section) name = "farm";
  if (!labels[name]) name = "account";
  document.querySelectorAll("[data-tab]").forEach((x) => {
    x.classList.toggle("active", x.dataset.tab === name);
    if (x.dataset.tab === name) x.setAttribute("aria-current", "page");
    else x.removeAttribute("aria-current");
  });
  document.querySelectorAll("[data-page]").forEach((x) => x.hidden = x.dataset.page !== name);
  $("page-title").textContent = titleCase(labels[name]);
  updatePrimaryAction();
  window.scrollTo({ top: 0 });
  SelectionReadout.refresh();
  if (focusHeading) $("page-title").focus({ preventScroll: true });
  if (section) { if (section === "common-research-card") $("common-research-details").open = true; $(section).scrollIntoView({block:"start"}); }
}
function updatePrimaryAction() {
  const next = {account:"farm", farm:"planning"}[document.querySelector('[data-tab].active')?.dataset.tab];
  const reviewing = !!next;
  $("optimize").textContent = next ? "Continue to " + labels[next] : "Find Fastest Plan";
  $("optimize").disabled = !!worker || !!importingBackup || (!reviewing && !!invalidField);
}
function readNumber(id, name, min = 0, max = Infinity, integer = false) {
  try { return S.number(NumericInput.value($(id)), name, min, max, integer); }
  catch (error) { error.fieldId = id; throw error; }
}
function clearFieldError() {
  if (invalidField) {
    const node = $(invalidField);
    node?.removeAttribute("aria-invalid");
    $(node?.dataset.pickerId)?.removeAttribute("aria-invalid");
    $(node?.dataset.pickerId)?.removeAttribute("aria-describedby");
    const descriptions = (node?.getAttribute("aria-describedby") || "").split(/\s+/).filter(id => id && id !== "field-error");
    if (descriptions.length) node.setAttribute("aria-describedby", descriptions.join(" "));
    else node?.removeAttribute("aria-describedby");
  }
  $("field-error")?.remove();
  invalidField = null;
  $("review-inputs").hidden = true;
  $("planning-guidance").hidden = true;
  delete $("review-inputs").dataset.field;
}
function validationField(error) {
  if (error.fieldId) return error.fieldId;
  const message = error.message;
  for (const research of D.research) if (message.startsWith(research.name)) return "research-" + research.id;
  for (const research of D.epic) if (message.startsWith(research.name)) return "epic-" + research.id;
  if (/one artifact per family/.test(message)) for (const key of ["current", "earnings", "delivery"]) {
    const seen = new Set();
    for (const node of document.querySelectorAll(`[id^="artifact-${key}-"]`)) {
      const family = S.AMAP[node.value]?.family;
      if (family && seen.has(family)) return node.id;
      if (family) seen.add(family);
    }
  }
  for (const [test, id] of [
    [/Soul Eggs|next switch costs/i, "soulEggs"],
    [/All Epic Research levels are zero/i, "epic-hold_to_hatch"],
    [/Per-Virtue minimums/i, "target"], [/Silos/i, "silos"],
    [/Maximum.*switch|switch.*budget/i, "sequence"],
    [/sequence|before H|Humility visit|unreachable/i, $("strategy").value === "user" ? "sequence" : "strategy"],
    [/Tank capacity|fuel.*capacity/i, "tankCapacity"],
    [/start date|timestamp/i, "start"]
  ]) if (test.test(message)) return id;
  return null;
}
function showPlanningGuidance(message, fromSearch = false, inputsChanged = false) {
  const field = validationField({message}) || (!fromSearch ? invalidField : null);
  let targets, detail;
  const workerFailure = /Planner worker failed|Could not start the planner/i.test(message);
  if (workerFailure) {
    detail = "Try the search again. If the worker keeps failing, reopen the app using the Windows launcher. Your inputs are retained.";
    targets = [];
  } else if (/Soul Eggs|next switch costs/i.test(message)) {
    detail = "Check your Soul Eggs and previous switches. Switch costs use both values.";
    targets = [["soulEggs", "Review Soul Eggs"], ["shiftCount", "Review Previous Switches"]];
  } else if (/All Epic Research levels are zero/i.test(message)) {
    detail = "Load your account data or enter owned Epic Research. These upgrades also apply to a fresh Virtue farm.";
    targets = [["epic-hold_to_hatch", "Review Epic Research"]];
  } else if (/fuel|tank/i.test(message)) {
    detail = "Review stored fuel, tank capacity, and the planned missions for each Humility visit.";
    targets = [[field || "tankCapacity", "Review Fuel Inputs"], ["shipSlots", "Review Planned Ships"]];
  } else if (/mission|launch count/i.test(message)) {
    detail = "Review the mission slots and launch counts for each Humility visit.";
    targets = [[field || "shipSlots", "Review Planned Ships"]];
  } else if (/sequence|switch.*budget|Maximum.*switch|unreachable/i.test(message)) {
    detail = "Check the visit order. User Selected Sequence uses the full entered route, up to 30 switches.";
    targets = [[field || "strategy", "Review Routing Settings"]];
  } else if (/no egg production/i.test(message)) {
    detail = "Review the starting habs and vehicles. A fresh farm uses the free Coop, Trike, and one silo.";
    targets = [["hab-0", "Review Habitats"], ["vehicle-0", "Review Shipping Fleet"]];
  } else if (fromSearch) {
    detail = /^Under the entered farm settings/.test(message) ? "Review the imported values or lower the target. This limit was checked with an optimistic production estimate." : "No complete plan was found within the fixed planning horizon. Review the visit order and target. A failed heuristic search does not prove the goal is impossible.";
    targets = [["strategy", "Review Routing Settings"]];
  } else {
    detail = "Correct the marked value, then try planning again. Your other inputs are retained.";
    targets = [[field, "Review Input"]];
  }
  $("planning-guidance-heading").textContent = fromSearch ? "Search Needs Attention" : "Review Planning Inputs";
  $("planning-guidance-detail").textContent = gemsText((inputsChanged ? "This message applies to the inputs at the start of the search. " : "") + detail);
  const actions = $("planning-guidance-actions");
  actions.replaceChildren();
  for (const [id, label] of targets) if (id && $(id)) {
    const button = el("button", label, "secondary");
    button.type = "button";
    button.onclick = () => reviewField(id);
    actions.append(button);
  }
  if (workerFailure) {
    const retry = el("button", "Try Search Again", "secondary");
    retry.type = "button";
    retry.onclick = optimize;
    actions.append(retry);
  }
  $("review-inputs").dataset.field = targets.find(([id]) => id && $(id))?.[0] || "";
  $("review-inputs").hidden = workerFailure;
  $("planning-guidance").hidden = false;
}
function fieldError(error) {
  clearFieldError();
  invalidField = validationField(error);
  const node = $(invalidField);
  if (node) {
    node.setAttribute("aria-invalid", "true");
    node.setAttribute("aria-describedby", [node.getAttribute("aria-describedby"), "field-error"].filter(Boolean).join(" "));
    const hint = el("small", error.message, "field-error");
    hint.id = "field-error";
    const picker = $(node.dataset.pickerId);
    if (picker) { picker.setAttribute("aria-invalid", "true"); picker.setAttribute("aria-describedby", "field-error"); (picker.closest(".artifact-slot") || picker.closest("label"))?.append(hint); }
    else node.closest("label")?.append(hint);
    revealFleetField(node);
  }
  $("review-inputs").hidden = false;
  $("run-summary").textContent = worker ? "Searching · Check Changed Inputs" : "Check Your Inputs";
  if (!worker) $("run-detail").textContent = "Review your inputs to continue.";
  show(error.message, true);
  showPlanningGuidance(error.message);
}
function revealFleetField(node) {
  const slot = node?.closest(".fleet-slot");
  if (!slot) return;
  slot.hidden = false;
  if (node.classList.contains("car")) {
    node.closest("label").hidden = false;
    // The enclosing account fieldset still enforces the manual-edit lock.
    if (node.getAttribute("aria-invalid") === "true") node.disabled = false;
  }
}
function reviewField(id) {
  const node = $(id);
  tab(node?.closest("[data-page]")?.dataset.page || "account");
  const loadout = node?.closest("[data-loadout-panel]");
  if (loadout) {
    selectLoadout(loadout.dataset.loadoutPanel);
    // Old saved files can contain invalid delivery gear; expose only its repair
    // fields when validation requests them, without restoring a delivery tab.
    if (loadout.dataset.loadoutPanel === "delivery") loadout.hidden = false;
  }
  if (node?.closest(".research-tier") && $("research-filter").value) { $("research-filter").value = ""; filterResearch(); }
  for (let parent = node?.parentElement; parent; parent = parent.parentElement) if (parent.tagName === "DETAILS") parent.open = true;
  if (node) {
    revealFleetField(node);
    const fields = node.closest(".account-value-fields"), toggles = fields?.disabled ? [...document.querySelectorAll('[aria-controls~="' + fields.id + '"]')] : [];
    const toggle = toggles.find(x => x.closest("[data-page]") === node.closest("[data-page]")) || toggles[0];
    const target = toggle || $(node.dataset.pickerId) || node;
    target.scrollIntoView({ block: "center" });
    target.focus({ preventScroll: true });
  }
  else { $("notice").scrollIntoView({ block: "center" }); $("notice").focus({ preventScroll: true }); }
}
function reviewInputs() { reviewField(invalidField || $("review-inputs").dataset.field); }
function markInputsChanged() {
  dirty = !!result || !!worker;
  updateArtifactNotes();
  const stale = $("plan-stale");
  if (stale) { stale.textContent = "Inputs changed since this plan was generated. This timeline uses the saved inputs from its run. Re-run to update it."; stale.hidden = !dirty; }
  const next = $("next-ascension");
  if (next) next.disabled = dirty || !!worker || !result || result.target >= 490;
  if (dirty && !worker && result) {
    $("run-summary").textContent = "Inputs Changed · Re-run Planner";
    $("run-detail").textContent = "The purchase timeline still uses the previous plan's inputs.";
  }
}
function select(id, options, value) {
  const node = $(id);
  node.replaceChildren(...options.map(([v, l]) => option(v, l)));
  node.value = value;
}
function field(label, id, value, type = "text", attrs = {}, format) {
  const l = el("label", label), i = el("input");
  i.id = id;
  i.type = type;
  NumericInput.write(i, value, format);
  Object.assign(i, attrs);
  l.append(i);
  return l;
}
function selectField(label, id, opts, value) {
  const l = el("label", label), s = el("select");
  s.id = id;
  s.append(...opts.map(([v, t]) => option(v, t)));
  s.value = value === null ? "" : String(value);
  l.append(s);
  return l;
}
function renderColleggtibleTotals(tiers, overrides) {
  const totals = C.combine(tiers, overrides);
  $("col-totals").replaceChildren(...Object.entries(colNames).filter(([k]) => totals[k] !== 1).map(([k, label]) => el("span", label + " \xD7" + NumberFormat.decimal(totals[k]), "bonus-chip")));
  if (!$("col-totals").childElementCount) $("col-totals").textContent = "No Colleggtible bonuses selected.";
  const active = D.customEggs.filter(e => (tiers[e.identifier] ?? -1) >= 0).length;
  const maxed = D.customEggs.filter(e => tiers[e.identifier] === e.buffs.length - 1).length;
  $("col-summary").textContent = active + " / " + D.customEggs.length + " bonuses active · " + maxed + " at highest tier";
}
function updateAccountSummaries() {
  let levels = 0, maxed = 0, valid = true;
  for (const r of D.epic) {
    const value = Number($("epic-" + r.id)?.value);
    if (!Number.isInteger(value) || value < 0 || value > r.levels) valid = false;
    levels += value;
    if (value === r.levels) maxed++;
  }
  $("epic-summary").textContent = valid ? maxed + " / " + D.epic.length + " researches maxed · " + levels + " levels purchased" : "Review the entered research levels.";
  $("epic-key-levels").textContent = ["epic_egg_laying", "afx_mission_time"].map(id => {
    const r = D.epic.find(r => r.id === id);
    return r.name + " " + $("epic-" + id).value + " / " + r.levels;
  }).join(" · ");
  updateDataSources();
}
function setSource(node, label, detail, kind = "default") {
  if (!node) return;
  node.textContent = label;
  node.title = detail;
  node.dataset.kind = kind;
}
function updateDataSources() {
  const info = config.importInfo, manualAccount = $("manualAccountData").checked, manualFarm = $("manualFarmData").checked;
  const fallback = config.label?.startsWith("Blank farm") ? "Starting Values" : "Saved Farm";
  for (const node of document.querySelectorAll("[data-source]")) {
    const group = node.dataset.source, manual = group === "farm" ? manualFarm : group === "flights" ? false : manualAccount;
    if (manual) setSource(node, "Manual Override", "Manual editing is enabled. The solver uses the entered values.", "manual");
    else if (config.uiProvenance?.[group] === "manual") setSource(node, "Manually Edited", "Values were edited after loading and are now locked. Reimport to refresh them.", "manual");
    else if (config.uiProvenance?.[group] === "plan") setSource(node, "Projected from Plan", "Calculated for the next ascension from the completed plan; not a new game backup.");
    else if (group === "colleggtibles" && info?.colleggtibleSource === "partial") setSource(node, "Partially Imported", "Some contract records could not be matched. Imported bonuses are combined with retained selections; see the explanation below.", "warning");
    else if (group === "colleggtibles" && info?.colleggtibleSource === "unavailable") setSource(node, "Previous Values Retained", "Contract progress was missing from the backup. These bonuses were not refreshed; see the explanation below.", "warning");
    else if (group === "colleggtibles" && config.farm.colleggtibleTiersInferred) setSource(node, "Reconstructed from Totals", "Individual tiers were reconstructed from an older saved file's combined bonuses; see the explanation below.", "warning");
    else if (group === "flights" && info?.flightSource !== "backup") setSource(node, config.farm.shipFlights?.length ? "Retained Flights" : "Not Loaded", "Flight information was not supplied by the last import.");
    else if (group === "farm" && info?.scope === "account") setSource(node, "Retained Farm", "No active Virtue farm was found. Your starting farm was retained.");
    else if (info) setSource(node, "Imported Backup", "From the last loaded Egg Inc. backup; check its timestamp in the sidebar.", "imported");
    else setSource(node, fallback, "Values in this farm configuration. Enable manual editing to adjust them.");
  }
}
const editingGroups = {
  manualAccountData: {toggles:["manualAccountData", "manualAccountFuel"],fields:["account-basic-fields", "account-fuel-fields", "account-progress-fields", "col-fields", "epic-fields"]},
  manualFarmData: {toggles:["manualFarmData", "manualFarmResearch", "manualFarmArtifacts"],fields:["farm-basic-fields", "hab-fields", "vehicle-fields", "research-fields", "current-loadout-fields", "earnings-loadout-fields", "delivery-loadout-fields", "starting-set-fields"]}
};
function updateAccountEditing() {
  for (const [key, group] of Object.entries(editingGroups)) {
    const enabled = $(key).checked;
    for (const id of group.toggles) $(id).checked = enabled;
    for (const id of group.fields) if ($(id)) $(id).disabled = !enabled;
  }
  $("copy-earnings").disabled = !$("manualFarmData").checked;
  for (const id of ["col-details", "epic-details"]) {
    const node = $(id);
    if ($("manualAccountData").checked && !node.dataset.manualOpen) {
      node.dataset.beforeManual = String(node.open);
      node.dataset.manualOpen = "true";
      node.open = true;
    } else if (!$("manualAccountData").checked && node.dataset.manualOpen) {
      node.open = node.dataset.beforeManual === "true";
      delete node.dataset.manualOpen;
      delete node.dataset.beforeManual;
    }
  }
  updateAccountSummaries();
}
function renderForm() {
  const f = config.farm, p = config.plan;
  activeLoadoutTab = "current";
  $("manualAccountData").checked = f.manualAccountData ?? (f.manualColleggtibles === true || f.manualEpicResearch === true);
  $("manualFarmData").checked = f.manualFarmData === true;
  upgradeStandardSequence(p, f.virtue);
  Strategy.upgrade(p);
  select("virtue", S.EGGS.map((x, i) => [x, S.NAME[i]]), f.virtue);
  EggIcons.decorateLabel($("virtue").closest("label"), f.virtue);
  for (const k of ["cash", "soulEggs", "shiftCount", "silos", "earningsMode"]) NumericInput.write($(k), k === "silos" ? Math.max(1, f[k] ?? 1) : f[k]);
  for (const k of ["proPermit", "videoDoubler"]) $(k).value = String(f[k] !== false);
  for (const k of ["target", "shiftSeconds", "actionSeconds"]) NumericInput.write($(k), p[k] ?? { shiftSeconds: 5, actionSeconds: 0.3 }[k]);
  $("start").value = dateLocal(p.start || Date.now() / 1e3);
  const zone = p.eventTimezoneMode === Zones.automatic || !p.eventTimezone ? Zones.automatic : p.eventTimezone;
  if (![...$("eventTimezone").options].some(o => o.value === zone)) $("eventTimezone").append(option(zone, Zones.label(zone)));
  $("eventTimezone").value = zone;
  updateTimezoneHelp();
  $("sequence").value = typeof p.sequence === "string" ? p.sequence : (p.sequence ?? DEFAULT_ROUTE).map((x) => ({ curiosity: "C", integrity: "I", humility: "H", resilience: "R", kindness: "K" })[x] || x).join(" ");
  $("minOfflineMinutes").value = p.minOfflineMinutes ?? 1;
  $("strategy").value = p.strategy || "wasmegg";
  $("maxShifts").value = p.maxShifts ?? 12;
  $("autoTeAllocation").checked = p.autoTeAllocation ?? !(p.floors || []).some(n => Number(n) > 0);
  updateSequenceVisibility();
  for (const k of ["earningsScale", "researchCostScale"]) NumericInput.write($(k), f[k] ?? 1);
  const body = $("progress-body");
  body.replaceChildren();
  $("goal-fields").replaceChildren();
  for (const i of displayEggOrder) {
    const tr = el("tr");
    const virtue = el("td");
    virtue.append(EggIcons.caption(S.EGGS[i], S.NAME[i], "egg-label progress-egg"));
    tr.append(virtue);
    for (const [key, value] of [["claimed", f.claimed[i]], ["delivered", f.delivered[i]]]) {
      const td = el("td"), inp2 = el("input");
      inp2.id = key + "-" + i;
      if (key === "delivered") inp2.placeholder = "e.g. 1.564Q";
      inp2.setAttribute("aria-label", S.NAME[i] + " " + key);
      if (key === "claimed") {
        inp2.type = "number";
        inp2.min = "0";
        inp2.max = "98";
      }
      NumericInput.write(inp2, value);
      td.append(inp2);
      tr.append(td);
    }
    const pending = el("td");
    pending.id = "pending-" + i;
    const claimed = Number(f.claimed[i]), delivered = Number(f.delivered[i]);
    pending.textContent = Number.isInteger(claimed) && claimed >= 0 && claimed <= 98 && Number.isFinite(delivered) && delivered >= 0
      ? String(Math.max(0, S.countTE(Math.max(delivered, claimed ? D.te[claimed - 1] : 0)) - claimed)) : "—";
    tr.append(pending);
    const goal = el("label"), inp = el("input");
    goal.append(EggIcons.caption(S.EGGS[i], S.NAME[i]));
    inp.id = "floor-" + i;
    inp.type = "number";
    inp.min = "0";
    inp.max = "98";
    NumericInput.write(inp, (p.manualFloors ?? p.floors)?.[i] ?? 0);
    inp.setAttribute("aria-label", S.NAME[i] + " minimum final TE");
    goal.append(inp);
    $("goal-fields").append(goal);
    body.append(tr);
  }
  for (let i = 0; i < 5; i++) $("goal-fields").append($("floor-"+i).closest("label"));
  $("hab-fields").replaceChildren(...f.habs.map((v, i) => FarmIcons.decoratePicker(selectField("Habitat " + (i + 1), "hab-" + i, [["", "Empty"], ...D.habs.map((x) => [x.id, x.name])], v), "hab")));
  $("vehicle-fields").replaceChildren(...f.vehicles.map((v, i) => {
    const div = el("div", void 0, "fleet-slot");
    div.append(el("small", "Fleet Slot " + (i + 1)), FarmIcons.decoratePicker(selectField("", "vehicle-" + i, [["", "Empty"], ...D.vehicles.map((x) => [x.id, x.name])], v.id), "vehicle"), field("Train cars", "cars-" + i, v.cars, "number", { min: 1, max: 10, className: "car" }));
    div.querySelector("select").setAttribute("aria-label", "Fleet Slot " + (i + 1) + " Vehicle");
    div.querySelector("input").setAttribute("aria-label", "Fleet Slot " + (i + 1) + " Train Cars");
    return div;
  }));
  const selected = C.selections(f);
  f.colleggtibleTiers = selected.tiers;
  f.colleggtibleOverrides = selected.overrides;
  f.colleggtibleTiersInferred = selected.inferred;
  $("col-fields").replaceChildren(...D.customEggs.map((e) => {
    const name = e.name === "P.E.G.G." ? e.name : e.name.toLowerCase().replace(/\b\w/g, (x) => x.toUpperCase()), key = C.dimension[e.buffs[0].dimension];
    return EggIcons.decorateLabel(selectField(name + " \xB7 " + colNames[key], "col-egg-" + e.identifier, [[-1, "None (1\xD7)"], ...e.buffs.map((b, i) => [i, "Tier " + (i + 1) + " \xB7 " + (b.value >= 1 ? "+" : "\u2212") + NumberFormat.decimal(Math.abs(b.value - 1) * 100) + "% (" + NumberFormat.decimal(b.value) + "\xD7)"])], selected.tiers[e.identifier] ?? -1), e.identifier);
  }));
  const colleggtibleSource = config.importInfo?.colleggtibleSource;
  $("col-note").textContent = [
    selected.inferred ? "Older files store combined bonuses only. These tiers were reconstructed to match; verify the individual selections. " + (Object.keys(selected.overrides).length ? "Custom totals are preserved until you change a colleggtible affecting that stat." : "") : "",
    colleggtibleSource === "backup" ? "Colleggtible bonuses loaded from account contract progress." : colleggtibleSource === "partial" ? "Some contract records could not be matched to Colleggtible eggs. Recognized bonuses were imported; earlier selections were kept for missing records. Compare the individual bonuses with the game, or sync the game and reload." : colleggtibleSource === "unavailable" ? "Contract progress was missing from the backup, so Colleggtible bonuses were not refreshed. Previous selections were retained. Sync the game and reload, or enter the bonuses manually." : ""
  ].filter(Boolean).join(" ");
  renderColleggtibleTotals(selected.tiers, selected.overrides);
  renderResearch();
  $("epic-fields").replaceChildren(...D.epic.map((r) => {
    const label = ResearchIcons.decorateLabel(field(r.name, "epic-" + r.id, f.epic?.[r.id] || 0, "number", { min: 0, max: r.levels }), r.id);
    label.querySelector("[data-research-icon]").title = r.description;
    const description = el("span", r.description, "sr-only"); description.id = "epic-description-" + r.id;
    const input = label.querySelector("input"); input.setAttribute("aria-label",titleCase(r.name)); input.setAttribute("aria-describedby",description.id);
    label.append(description);
    return label;
  }));
  f.loadouts = f.loadouts || { current: [] };
  if (!f.loadouts.current) f.loadouts.current = structuredClone(f.loadouts[f.activeSet] || []);
  for (const key of ["earnings", "delivery"]) if (!f.loadouts[key]) f.loadouts[key] = structuredClone(f.loadouts.current);
  $("activeSet").value = f.activeSet || "current";
  renderLoadouts();
  const tank = f.fuelTank || {}, capacity = tank.capacity ?? 2e9, capacities = Ships.TANKS.includes(capacity) ? Ships.TANKS : [...Ships.TANKS, capacity];
  select("tankCapacity", capacities.map((n) => [n, fuelNumber(n)]), capacity);
  NumericInput.write($("tankOutput"), tank.outputPerMinute ?? Ships.rateFor(capacity), fuelNumber);
  $("fuel-fields").replaceChildren(...displayEggOrder.map(i => { const egg = S.EGGS[i]; return EggIcons.decorateLabel(field(S.NAME[i] + " Fuel", "fuel-" + egg, tank.amounts?.[egg] ?? 0, "text", {}, fuelNumber), egg); }));
  $("shipSlots").value = p.ships?.slots ?? 3;
  renderExistingFlights();
  const visits = Ships.plannedVisits(p.ships, result?.actions);
  for (let visit = 1; visit <= 2; visit++) renderShipMissions(visit, visits[visit - 1].missions);
  if (config.importInfo) {
    const backupTime = Number(config.importInfo.timestamp);
    const hasBackupTime = backupTime > 0 && Number.isFinite(new Date(backupTime * 1000).getTime());
    $("import-backup").hidden = false;
    $("import-backup-time").textContent = hasBackupTime ? timestamp(backupTime, p.eventTimezone, true, true) : "not supplied";
    if (hasBackupTime) $("import-backup-time").dateTime = new Date(backupTime * 1000).toISOString();
    else $("import-backup-time").removeAttribute("datetime");
  } else {
    $("import-backup").hidden = true;
    $("import-backup-time").textContent = "";
    $("import-backup-time").removeAttribute("datetime");
  }
  if (config.draftInputs) restoreDraftInputs(config.draftInputs);
  updateAccountEditing();
  filterResearch();
  return refresh();
}
const unsavedInputs = /* @__PURE__ */ new Set(["eid", "file-input", "research-filter", "update-repository"]);
function captureDraftInputs() {
  return { version: 1, fields: Object.fromEntries([...document.querySelectorAll("input[id],select[id]")].filter((node) => !unsavedInputs.has(node.id) && !node.closest("dialog")).map((node) => [node.id, node.type === "checkbox" ? { checked: node.checked } : { value: NumericInput.draft(node) }])) };
}
function restoreDraftInputs(draft) {
  if (draft.version !== 1 || !draft.fields || typeof draft.fields !== "object") return;
  function apply(test) {
    for (const [id, value] of Object.entries(draft.fields)) {
      const node = $(id);
      if (unsavedInputs.has(id) || ["strategy", "autoSequence"].includes(id) || !node?.matches("input,select") || !test(id)) continue;
      if (node.type === "checkbox" && typeof value.checked === "boolean") node.checked = value.checked;
      else if (typeof value.value === "string") NumericInput.restore(node, value.value);
    }
  }
  apply((id) => id === "proPermit");
  renderLoadouts();
  apply((id) => !id.startsWith("stone-"));
  for (const key of ["current", "earnings", "delivery"]) for (let i = 0; i < ($("proPermit").value === "true" ? 4 : 2); i++) renderStones(key, i);
  apply((id) => id.startsWith("stone-"));
  for (const key of ["current", "earnings", "delivery"]) for (let i = 0; i < ($("proPermit").value === "true" ? 4 : 2); i++) updateLoadoutCard(key, i);
  if (draft.fields.strategy || draft.fields.autoSequence) $("strategy").value = Strategy.selected({
    strategy: draft.fields.strategy?.value || config.plan.strategy,
    autoSequence: draft.fields.autoSequence?.checked ?? config.plan.autoSequence,
    sequence: draft.fields.sequence?.value ?? config.plan.sequence
  });
  if (!draft.fields.manualAccountData && (draft.fields.manualColleggtibles?.checked || draft.fields.manualEpicResearch?.checked)) $("manualAccountData").checked = true;
  updateSequenceVisibility();
}
function currentFarmImport(backup) {
  let existing, draft;
  try { existing = gather(); }
  catch {
    existing = {...config,farm:{...config.farm,loadouts:formLoadouts()}};
    draft = captureDraftInputs();
  }
  const next = I.importAll(backup, existing);
  if (existing.plan.targetMode === Defaults.targetMode) {
    next.plan.target = Defaults.target(next.farm.claimed);
    next.plan.targetMode = Defaults.targetMode;
  }
  if (existing.uiProvenance) {
    const retained = {};
    if (next.importInfo.scope === "account" && existing.uiProvenance.farm) retained.farm = existing.uiProvenance.farm;
    if (next.importInfo.colleggtibleSource !== "backup" && existing.uiProvenance.colleggtibles) retained.colleggtibles = existing.uiProvenance.colleggtibles;
    if (Object.keys(retained).length) next.uiProvenance = retained;
  }
  if (draft) {
    draft.fields = Object.fromEntries(Object.entries(draft.fields).filter(([id]) => !(next.importInfo.ultraProActive && id === "videoDoubler") && (next.importInfo.scope === "account"
      ? !["soulEggs", "shiftCount", "proPermit", "tankCapacity", "tankOutput", "manualAccountData", "manualAccountFuel", "manualColleggtibles", "manualEpicResearch"].includes(id) && !/^(fuel-|claimed-|delivered-|epic-|col-)/.test(id)
      : id !== "start" && ($("planning-card").contains($(id)) || $("ship-planning").contains($(id)) || id.startsWith("floor-")))));
    next.draftInputs = draft;
  }
  return next;
}
function replaySavedResult(savedConfig, savedResult) {
  return ShiftPlans.replay(savedConfig, savedResult, (raw,plan)=>SalePlans.replay(raw,plan,replaySingleResult));
}
function replaySingleResult(savedConfig, savedResult) {
  const verified = O.replay(savedConfig, savedResult.actions, true, {enforceOpeningCaps:savedResult.openingTimeLimits === true,oneStartingSilo:savedResult.initialSiloRule === "one" ? true : void 0});
  return {...savedResult,actions:S.history(verified.s),start:verified.c.start,end:verified.s.t,seconds:verified.s.t - verified.c.start,switches:verified.s.stage,soulCost:verified.s.lost,target:verified.c.target,finalTE:S.teByEgg(verified.s,verified.c),pendingTE:S.totalTE(verified.s,verified.c) - verified.c.claimedTotal,finalCash:verified.s.cash,finalStats:S.stats(verified.s,verified.c),validatedReplay:true};
}
function restoreUpdateSnapshot(saved, message = "Session restored.") {
  let recoveredResult = null, replayError = "";
  if (saved.result && saved.resultConfig) {
    try { recoveredResult = replaySavedResult(saved.resultConfig, saved.result); }
    catch (e) { replayError = " The saved timeline could not be replayed: " + e.message; }
  }
  config = saved.config;
  result = recoveredResult;
  resultConfig = result ? saved.resultConfig : null;
  dirty = !!result && (saved.dirty || saved.interrupted);
  loadEpoch++;
  clearTimeout(refreshTimer);
  const valid = renderForm();
  $("result-content").hidden = !result;
  $("empty-results").hidden = !!result;
  if (result) { result.summary = U.summarize(resultConfig, result); renderResult(); if (dirty) markInputsChanged(); }
  selectLoadout(saved.loadoutTab || "current");
  tab(saved.tab === "results" && !result ? "account" : (saved.tab || "account"), true);
  show(message + (saved.interrupted ? " The interrupted search needs to be run again." : "") + replayError + (!valid ? " Review the marked inputs before planning." : ""), !!replayError || !valid);
}
function updateTimezoneHelp() {
  const zone = $("eventTimezone").value;
  $("event-zone-help").textContent = (zone === Zones.automatic ? "Automatic: "+Zones.label(Zones.resolve(zone))+". " : "")+"Controls event times and displayed dates. Regional timezones follow daylight saving; UTC offsets stay fixed.";
}
function purchaseTime(seconds) {
  return seconds === null ? "Complete farm inputs for estimate" : seconds === 0 ? "~<1" : Number.isFinite(seconds) ? seconds > 365*86400 ? ">1 year" : "~"+duration(seconds) : "No current income";
}
function shipChoiceDescriptions(visit, index) {
  let state, earnings;
  try {
    const raw = gather(); raw.plan.ships = {mode:"none",slots:3};
    const {s,c} = S.prepare(raw); state = s; earnings = S.stats(s,c).eventEarning;
  } catch { }
  const length = $("mission-"+visit+"-"+index)?.value || "SHORT";
  return item => {
    const mission = Ships.mission(item.id,length);
    const seconds = state ? mission.cost <= state.cash ? 0 : earnings > 0 ? (mission.cost-state.cash)/earnings : Infinity : null;
    const estimate = purchaseTime(seconds);
    const fuel = el("span",undefined,"picker-fuels");
    for (const i of displayEggOrder.filter(i=>mission.fuel[i])) {
      const quantity=num(mission.fuel[i]),amount=Units.amount(S.EGGS[i],quantity);
      // Remove only redundant trailing zeroes; retain the rounded numeric value.
      amount.firstElementChild.textContent=compactNumber(mission.fuel[i]);
      fuel.append(amount);
    }
    return Units.lines(Units.amount("gem",compactNumber(mission.cost)),fuel,estimate);
  };
}
function renderShipMissions(visit, missions) {
  $("ship-missions-" + visit).replaceChildren(...missions.map((m, i) => {
    const row = el("div", void 0, "ship-mission-row");
    const shipField = selectField("Ship", "ship-" + visit + "-" + i, Ships.DATA.ships.map((s) => [s.id, s.name]), m.ship || "CHICKEN_ONE");
    ShipIcons.decorate(shipField, () => shipChoiceDescriptions(visit, i));
    row.append(shipField, selectField("Mission", "mission-" + visit + "-" + i, [["SHORT", "Short"], ["LONG", "Standard"], ["EPIC", "Extended"]], m.duration || "SHORT"), field("Launch Count", "ship-count-" + visit + "-" + i, m.count === null ? "" : m.count ?? 3, "number", { min: 1, max: 1e6, placeholder: "Tank Maximum" }));
    const remove = el("button", "Remove", "secondary");
    remove.type = "button";
    remove.setAttribute("aria-label", "Remove H" + visit + " Ship Mission " + (i + 1));
    remove.onclick = () => {
      try {
        config = gather();
        config.plan.ships.visits[visit - 1].missions.splice(i, 1);
        renderShipMissions(visit, config.plan.ships.visits[visit - 1].missions);
        markInputsChanged();
        refresh();
        const remaining = config.plan.ships.visits[visit - 1].missions.length;
        ($("pick-ship-" + visit + "-" + Math.min(i, remaining - 1)) || $("add-ship-" + visit)).focus();
      } catch (e) {
        show(e.message, true);
      }
    };
    const moves = el("div", undefined, "ship-row-actions");
    for (const [offset, text, direction] of [[-1, "↑", "Up"], [1, "↓", "Down"]]) {
      const move = el("button", text, "secondary ship-move");
      move.type = "button";
      move.setAttribute("aria-label", "Move H" + visit + " Ship Mission " + (i + 1) + " " + direction);
      move.title = "Move Mission " + direction;
      move.disabled = i + offset < 0 || i + offset >= missions.length;
      move.onclick = () => {
        try {
          config = gather();
          const list = config.plan.ships.visits[visit - 1].missions;
          [list[i], list[i + offset]] = [list[i + offset], list[i]];
          renderShipMissions(visit, list);
          markInputsChanged();
          refresh();
          $("pick-ship-" + visit + "-" + (i + offset)).focus();
          show("H" + visit + " mission moved " + direction.toLowerCase() + ". Ships will launch in this order.");
        } catch (error) { fieldError(error); }
      };
      moves.append(move);
    }
    moves.append(remove);
    row.append(moves);
    return row;
  }));
  $("add-ship-" + visit).disabled = missions.length >= 8;
}
function renderLoadouts() {
  const host = $("loadout-fields");
  host.replaceChildren();
  const tabs = el("div", undefined, "loadout-tabs"); tabs.setAttribute("role","tablist"); tabs.setAttribute("aria-label","Artifact sets");
  for (const key of ["current","earnings"]) {
    const button = el("button", key[0].toUpperCase()+key.slice(1), "secondary"); button.type = "button";
    button.id = "loadout-tab-"+key; button.dataset.loadoutTab = key; button.setAttribute("role","tab"); button.setAttribute("aria-controls","loadout-panel-"+key);
    button.onclick = () => selectLoadout(key);
    button.onkeydown = event => {
      const keys = ["current","earnings"], i = keys.indexOf(key);
      const next = event.key === "ArrowRight" || event.key === "ArrowLeft" ? keys[(i+1)%2] : event.key === "Home" ? keys[0] : event.key === "End" ? keys[1] : null;
      if (next) { event.preventDefault(); selectLoadout(next); $("loadout-tab-"+next).focus(); }
    };
    tabs.append(button);
  }
  host.append(tabs);
  const limit = $("proPermit").value === "true" ? 4 : 2;
  for (const key of ["current", "earnings", "delivery"]) {
    const section = el("div", void 0, "loadout");
    section.id = "loadout-panel-"+key; section.dataset.loadoutPanel = key; section.setAttribute("role",key === "delivery" ? "group" : "tabpanel"); section.tabIndex = 0; section.setAttribute("aria-labelledby",key === "delivery" ? "retained-delivery-heading" : "loadout-tab-"+key);
    const heading = el("div", void 0, "loadout-heading"), source = el("span", void 0, "source-badge");
    source.id = key + "-set-source";
    if (key === "current") source.dataset.source = "farm";
    const title = el("h3", key === "delivery" ? "Review Saved Delivery Gear" : key === "earnings" ? "Research & Earnings Set" : "Current Set");
    if (key === "delivery") title.id = "retained-delivery-heading";
    heading.append(title, source);
    section.append(heading);
    const grid = el("fieldset", void 0, "loadout-grid account-value-fields");
    grid.style.setProperty("--loadout-slots",limit);
    grid.id = key + "-loadout-fields"; grid.disabled = !$("manualFarmData").checked;
    const note = el("p", void 0, "hint"); note.id = key + "-set-note"; section.append(note);
    for (let i = 0; i < limit; i++) {
      const slot = config.farm.loadouts[key]?.[i] || { artifactId: null, stones: [] };
      const div = el("div", void 0, "artifact-slot");
      const preview = el("div", void 0, "loadout-card"); preview.id = `loadout-card-${key}-${i}`;
      div.append(preview);
      const editors = el("div", void 0, "loadout-editors");
      const artifactField = selectField("Artifact " + (i + 1), `artifact-${key}-${i}`, [["", "Empty"], ...D.artifacts.map((a) => [a.id, a.label])], slot.artifactId);
      artifactField.hidden = true;
      artifactField.querySelector("select").setAttribute("aria-label", `Artifact ${i+1} in ${key === "earnings" ? "Research & Earnings" : key[0].toUpperCase()+key.slice(1)} Set`);
      editors.append(artifactField);
      const stones = el("div", void 0, "stone-fields");
      stones.id = `stones-${key}-${i}`;
      editors.append(stones);
      div.append(editors);
      grid.append(div);
    }
    section.append(grid);
    host.append(section);
    for (let i = 0; i < limit; i++) renderStones(key, i, config.farm.loadouts[key]?.[i]?.stones || []);
  }
  selectLoadout(activeLoadoutTab);
  updateArtifactNotes();
}
function selectLoadout(key) {
  activeLoadoutTab = ["current","earnings"].includes(key) ? key : "current";
  document.querySelectorAll("[data-loadout-tab]").forEach(button => { const selected = button.dataset.loadoutTab === activeLoadoutTab; button.setAttribute("aria-selected",String(selected)); button.tabIndex = selected ? 0 : -1; });
  document.querySelectorAll("[data-loadout-panel]").forEach(panel => panel.hidden = panel.dataset.loadoutPanel !== activeLoadoutTab);
}
function updateLoadoutCard(key, i) {
  const art = S.AMAP[$(`artifact-${key}-${i}`)?.value];
  const controls = {artifact:$(`artifact-${key}-${i}`), stones:Array.from({length:art?.slots || 0}, (_,j) => $(`stone-${key}-${i}-${j}`))};
  LoadoutCard.render($(`loadout-card-${key}-${i}`), art?.id, controls.stones.map(control => control?.value || null), controls);
}
function updateArtifactNotes() {
  const manual = $("manualFarmData").checked, automatic = Array.isArray(config.farm.artifactInventory) && !manual;
  $("current-set-note").textContent = "Starting gear. Changes require Humility.";
  $("earnings-set-note").textContent = automatic ? "Owned gear with the highest starting research buying power: income ÷ research cost multiplier. The solver also compares income-focused sets." : manual ? "The solver uses these artifacts and stones." : "Import Virtue inventory for automatic sets, or enable Edit Farm Manually.";
  const chosen = !dirty && (result?.artifactRecommendations || result?.actions.find(a => a.type === "set" && a.set.startsWith("auto-delivery-")));
  $("delivery-set-note").textContent = automatic ? chosen ? "Selected for this plan's research and shipping capacity. Equip the gear shown in the timeline." : "Starting-farm preview. Recalculated for the planned equip time." : manual ? "The solver uses these artifacts and stones." : "Import Virtue inventory for automatic sets, or enable Edit Farm Manually.";
  setSource($("earnings-set-source"), manual ? "Manual Override" : automatic ? "Starting Farm Preview" : "Retained Set", "Research and earnings selection for the current starting inputs.", manual ? "manual" : "default");
  setSource($("delivery-set-source"), manual ? "Manual Override" : automatic ? chosen ? "Calculated for This Plan" : "Starting Farm Preview" : "Retained Set", chosen && automatic ? "Selected for the last completed plan. Changed inputs invalidate this recommendation." : "Preview for the starting farm, before planned upgrades.", manual ? "manual" : chosen && automatic ? "imported" : "default");
  updateDataSources();
}
function populateAutomaticSets(s, c) {
  if (!c.artifactModel) { updateArtifactNotes(); return; }
  const action = !dirty && result?.actions.find(a => a.type === "set" && a.set.startsWith("auto-delivery-")), delivery = !dirty && result?.artifactRecommendations?.delivery || action?.loadout || ArtifactSets.bestDelivery(c.artifactModel, S.stats(s, c)).loadout;
  const values = {earnings:c.earningLoadout, delivery}; let changed = false;
  if (config.farm.activeSet !== "current") { config.farm.loadouts.current = structuredClone(c.loadouts[s.set]); config.farm.activeSet = "current"; $("activeSet").value = "current"; changed = true; }
  for (const [key, value] of Object.entries(values)) if (ArtifactSets.signature(config.farm.loadouts[key]) !== ArtifactSets.signature(value)) { config.farm.loadouts[key] = structuredClone(value); changed = true; }
  if (changed) renderLoadouts(); else updateArtifactNotes();
}
function updateStartingGear(s, c) {
  const automatic = !!c.earningLoadout?.some(slot => slot.artifactId);
  $("starting-gear-controls").hidden = !automatic;
  const names = (c.loadouts[s.set] || []).map(slot => S.AMAP[slot.artifactId]?.label).filter(Boolean);
  $("starting-gear-summary").textContent = "Starting gear: " + (names.length ? names.join(" · ") : "Empty. No artifact or stone bonuses apply until gear is equipped on Humility.");
  const ready = automatic && ArtifactSets.signature(c.loadouts[s.set]) !== ArtifactSets.signature(c.earningLoadout);
  $("use-earnings-start").dataset.ready = String(ready);
  $("use-earnings-start").disabled = !ready || !!worker || !!importingBackup;
}
function renderStones(key, i, values = []) {
  const art = S.AMAP[$(`artifact-${key}-${i}`).value], host = $(`stones-${key}-${i}`);
  host.replaceChildren();
  for (let j = 0; j < (art?.slots || 0); j++) {
    const field = selectField("Stone " + (j + 1), `stone-${key}-${i}-${j}`, [["", "Empty"], ...D.stones.map((s) => [s.id, s.label])], values[j] || null);
    field.hidden = true; field.querySelector("select").setAttribute("aria-label", `Stone ${j+1} of Artifact ${i+1} in ${key === "earnings" ? "Research & Earnings" : key[0].toUpperCase()+key.slice(1)} Set`);
    host.append(field);
  }
  updateLoadoutCard(key, i);
}
function formLoadouts() {
  return Object.fromEntries(["current", "earnings", "delivery"].map(key => [key,Array.from({length:$("proPermit").value === "true" ? 4 : 2},(_,i) => {
    const id = $(`artifact-${key}-${i}`)?.value, a = S.AMAP[id];
    return {artifactId:id || null,stones:Array.from({length:a?.slots || 0},(_,j) => $(`stone-${key}-${i}-${j}`)?.value || null)};
  })]));
}
function renderExistingFlights() {
  const flights = Array.isArray(config.farm.shipFlights) ? config.farm.shipFlights : [], source = config.importInfo?.flightSource;
  const start = Number(config.plan.start), zone = config.plan.eventTimezone || "America/Los_Angeles";
  $("flight-list").replaceChildren(...flights.map(f => {
    const ship = Ships.DATA.ships.find(s => s.id === f.ship)?.name || "Virtue Ship", duration = {SHORT:"Short",LONG:"Standard",EPIC:"Extended"}[f.duration];
    return el("li", (duration ? duration + " " : "") + ship + " · " + (Number.isFinite(f.returnAt) ? (f.returnAt <= start ? "ready to collect at plan start" : "returns " + timestamp(f.returnAt, zone, true)) : "return time unavailable"));
  }));
  $("flight-status").textContent = flights.length ? flights.length + " existing Virtue flight" + (flights.length === 1 ? "" : "s") + " accounted for." : source === "backup" ? "No active Virtue flights in the imported backup." : source === "unavailable" ? "Flight records were not included in this backup." : "No flight records loaded. Selected mission slots are assumed available.";
  $("flight-help").textContent = source === "unavailable" ? "Sync the game, then press Enter in the sidebar EID field to refresh flight information before relying on the ship schedule." : source === "backup" ? "Loaded automatically with your Egg Inc. backup. Sync the game, then press Enter in the sidebar EID field to refresh. Existing launches do not consume planned fuel again." : "Enter your EID in the sidebar and press Enter to refresh current flights. Saved farms and previous plans retain their flight records.";
}
function syncDefaultTarget() {
  if (config.plan.targetMode !== Defaults.targetMode) return;
  const claimed = Array.from({length:5}, (_,i) => {
    const value = $("claimed-"+i)?.value;
    return value?.trim() ? Number(value) : NaN;
  });
  const target = Defaults.target(claimed);
  if (target !== null) NumericInput.write($("target"), target);
}
function gather() {
  syncDefaultTarget();
  const f = { ...config.farm };
  for (const id of Object.keys(editingGroups)) f[id] = $(id).checked;
  delete f.manualColleggtibles;
  delete f.manualEpicResearch;
  for (const k of ["cash", "soulEggs", "shiftCount", "silos", "earningsScale", "researchCostScale"]) f[k] = readNumber(k, {cash:"Current gems",soulEggs:"Soul Eggs",shiftCount:"Previous switches",silos:"Silos",earningsScale:"Earnings calibration",researchCostScale:"Research cost calibration"}[k], ["earningsScale","researchCostScale"].includes(k) ? .000001 : k === "silos" ? 1 : 0);
  f.virtue = $("virtue").value;
  f.proPermit = $("proPermit").value === "true";
  f.videoDoubler = $("videoDoubler").value === "true";
  f.earningsMode = $("earningsMode").value;
  f.activeSet = $("activeSet").value;
  f.shipFlights = structuredClone(config.farm.shipFlights || []);
  f.claimed = Array.from({ length: 5 }, (_, i) => readNumber("claimed-" + i, "Claimed TE", 0, 98, true));
  f.delivered = Array.from({ length: 5 }, (_, i) => readNumber("delivered-" + i, "Delivered eggs"));
  for (let i = 0; i < 5; i++) {
    const minimum = f.claimed[i] ? D.te[f.claimed[i] - 1] : 0;
    if (f.delivered[i] < minimum) {
      f.delivered[i] = minimum;
      NumericInput.write($("delivered-" + i), minimum);
      $("delivered-" + i).title = "Minimum lifetime delivery implied by claimed TE. Enter your exact lifetime total if known.";
    }
  }
  f.habs = Array.from({ length: 4 }, (_, i) => $("hab-" + i).value === "" ? null : Number($("hab-" + i).value));
  f.vehicles = Array.from({ length: 17 }, (_, i) => ({ id: $("vehicle-" + i).value === "" ? null : Number($("vehicle-" + i).value), cars: readNumber("cars-" + i, "Train cars", 1, 10, true) }));
  f.colleggtibleTiers = Object.fromEntries(D.customEggs.map((e) => [e.identifier, Number($("col-egg-" + e.identifier).value)]));
  f.colleggtibles = C.combine(f.colleggtibleTiers, f.colleggtibleOverrides);
  f.research = Object.fromEntries(D.research.map((r) => [r.id, readNumber("research-" + r.id, r.name, 0, r.levels, true)]));
  f.epic = Object.fromEntries(D.epic.map((r) => [r.id, readNumber("epic-" + r.id, r.name, 0, r.levels, true)]));
  f.loadouts = formLoadouts();
  const autoTeAllocation = $("autoTeAllocation").checked;
  const manualFloors = Array.from({length:5}, (_, i) => autoTeAllocation ? retainedNumber("floor-" + i) : readNumber("floor-" + i, "Per-Virtue goal", 0, 98, true));
  const p = { ...config.plan, start: $("start").value === dateLocal(config.plan.start) ? config.plan.start : new Date($("start").value).getTime() / 1e3, eventTimezone: Zones.resolve($("eventTimezone").value), eventTimezoneMode: $("eventTimezone").value === Zones.automatic ? Zones.automatic : "explicit", sequence: $("sequence").value, target: readNumber("target", "Target TE", 0, 490, true), solverVersion: 2, saleComparisonVersion: 1, autoTeAllocation, manualFloors, maxDays: 366, shiftSeconds: readNumber("shiftSeconds", "Switch seconds", 0, 3600), actionSeconds: readNumber("actionSeconds", "Purchase seconds", 0, 3600), autoSequence: $("strategy").value !== "user", strategy: $("strategy").value, strategyVersion: 2, searchEffort: "balanced", minOfflineMinutes: readNumber("minOfflineMinutes", "Minimum offline break minutes", 1, 1440, true), initialPhysicalPurchases: false, floors: autoTeAllocation ? Array(5).fill(0) : manualFloors.slice() };
  p.maxShifts=p.autoSequence?readNumber("maxShifts","Maximum new shifts",0,30,true):retainedNumber("maxShifts");
  for (const key of ["maxSwitches", "stagedSales", "priority", "priorityMaxDays", "priorityMaxShifts", "c1MaxMinutes", "k1MaxMinutes"]) delete p[key];
  if (!p.autoSequence) try {
    Route.parse(p.sequence, {required: true});
  } catch (error) { error.fieldId = "sequence"; throw error; }
  f.fuelTank = { capacity: readNumber("tankCapacity", "Tank capacity"), outputPerMinute: readNumber("tankOutput", "Tank output per minute", 1), amounts: Object.fromEntries(S.EGGS.map((egg) => [egg, readNumber("fuel-" + egg, egg + " fuel")])) };
  p.ships = { mode: "custom-two-visits", slots: readNumber("shipSlots", "Mission slots", 1, 3, true), visits: [1, 2].map((visit) => ({ missions: Array.from($("ship-missions-" + visit).children, (_, i) => ({ ship: $("ship-" + visit + "-" + i).value, duration: $("mission-" + visit + "-" + i).value, count: $("ship-count-" + visit + "-" + i).value.trim() === "" ? null : readNumber("ship-count-" + visit + "-" + i, "H" + visit + " launch count", 1, 1e6, true) })) })) };
  delete p.openingStepMinutes;
  p.sequenceVersion = 2;
  if (!Number.isFinite(p.start) || p.start <= 0) throw Object.assign(Error("Choose a valid start date/time."), {fieldId:"start"});
  const next = { ...config, version: 1, farm: f, plan: p };
  delete next.draftInputs;
  return next;
}
function stat(label, value, sub, egg) {
  const div = el("div", void 0, "stat");
  const heading = el("small", titleCase(label));
  if (egg) heading.replaceChildren(EggIcons.caption(egg, titleCase(label)));
  div.append(heading, el("strong", value), el("span", sub));
  return div;
}
function refresh() {
  updatePlanControls();
  updateTimezoneHelp();
  document.querySelectorAll("[data-farm-picker] select").forEach(FarmIcons.updatePicker);
  SelectionReadout.refresh();
  clearFieldError();
  updateAccountSummaries();
  EggIcons.decorateLabel($("virtue").closest("label"), $("virtue").value);
  updateSequenceVisibility();
  updatePlanningContext();
  $("sequence-budget").hidden = true;
  try {
    updateResearchSummaries();
    config = gather();
    if (!config.plan.autoSequence) {
      const route = Route.normalize(config.plan.sequence, config.farm.virtue), needed = route.length - 1;
      $("sequence-budget").hidden = false;
      $("sequence-budget").textContent = "Full sequence: " + needed + " new switches from " + S.NAME[S.EGGS.indexOf(config.farm.virtue)] + ".";
    }
    const { s, c } = S.prepare(config), r = S.stats(s, c), pending = S.totalTE(s, c) - c.claimedTotal;
    populateAutomaticSets(s, c);
    updateStartingGear(s, c);
    $("sequence-preview").hidden = c.autoSequence;
    $("sequence-preview").textContent = "Planned order: " + c.sequence.map((i) => ({ curiosity: "C", kindness: "K", integrity: "I", resilience: "R", humility: "H" })[S.EGGS[i]]).join(" ");

    const warnings = Model.notices(s, c);
    $("farm-advisories").replaceChildren(...warnings.map((message) => el("p", message)));
    $("farm-advisories").hidden = !warnings.length;
    renderColleggtibleTotals(config.farm.colleggtibleTiers, config.farm.colleggtibleOverrides);
    $("stats").replaceChildren(stat("Truth Eggs", c.claimedTotal + " + " + pending, "claimed + pending", "truth"), stat("Egg delivery / hour", num(r.delivery * 3600), r.bottleneck + " limited \xB7 headroom " + num(r.headroom * 3600) + "/hr"), stat("Normal earnings / hour", num(r.earning * 3600), c.earningsMode + " \xB7 before weekly event"), stat("Habitat capacity", compactNumber(r.hab), "Silo coverage: " + duration(r.siloHours * 3600)));
    for (let i = 0; i < 5; i++) $("pending-" + i).textContent = String(Math.max(0, S.countTE(s.eggs[i]) - c.claimed[i]));
    for (const research of D.research) {
      const i = S.RMAP[research.id];
      $("cost-" + research.id).textContent = s.r[i] === research.levels ? "Maxed" : S.isUnlocked(s, i) ? num(S.price(s, c, { type: "research", i })) : "Tier locked";
      const remaining = remainingResearchCost(s, c, i), total = $("max-cost-" + research.id);
      total.textContent = num(remaining);
      total.title = remaining.toLocaleString("en-US", {maximumFractionDigits:0}) + " gems at current discounts and sale prices; excludes prerequisites.";
    }
    let hiddenSlots = 0;
    for (let i = 0; i < 17; i++) {
      const slot = $("vehicle-" + i).closest(".fleet-slot"), cars = $("cars-" + i);
      slot.hidden = i >= r.slots && s.v[i].id === null;
      hiddenSlots += Number(slot.hidden);
      cars.disabled = s.v[i].id !== 11;
      cars.closest("label").hidden = cars.disabled;
    }
    $("fleet-status").textContent = r.slots + " unlocked " + (r.slots === 1 ? "slot" : "slots") + (hiddenSlots ? " · " + hiddenSlots + " locked empty slots hidden" : "");
    const m = c.mods[s.set];
    $("artifact-mods").textContent = "Active set effects: " + Object.entries(m).map(([k, v]) => k + " \xD7" + v.toFixed(3)).join(" \xB7 ");
    $("fuel-status").textContent = fuelNumber(c.ships.stored.reduce((a, b) => a + b, 0)) + " stored / " + fuelNumber(c.ships.capacity) + " capacity";
    renderExistingFlights();
    const shipEstimate = $("ship-estimate");
    shipEstimate.replaceChildren();
    if (!c.ships.enabled) shipEstimate.append(el("p", "No ship missions planned. Add missions to H1, H2, or both."));
    else {
      for (const run of c.ships.runs) {
        const heading = el("h4", "H" + run.visit + " Ship Plan");
        shipEstimate.append(heading);
        if (!run.count) {
          shipEstimate.append(el("p", "No ships planned for this visit."));
          continue;
        }
        for (const [i, m2] of run.missions.entries()) {
          const maximum = Ships.maximum(m2, c.ships.capacity, run.stored, Ships.needed(run.missions.filter((_, j) => j !== i)));
          shipEstimate.append(el("p", m2.count + " \xD7 " + m2.label + (maximum === null ? "" : " \xB7 Tank maximum with other missions: " + maximum), "ship-estimate-line"));
        }
        shipEstimate.append(el("p", "Fuel required: " + run.fuel.map((n, i) => n ? S.NAME[i] + " " + num(n) : "").filter(Boolean).join(" \xB7 ")));
        const missing = (run.collectionTargets || run.targets).map((n, i) => Math.max(0, n - run.stored[i]));
        shipEstimate.append(el("p", missing.some((n) => n) ? (run.visit === 1 ? "Collect before H1: " : "Refill after H1 for H2: ") + missing.map((n, i) => n ? S.NAME[i] + " " + num(n) : "").filter(Boolean).join(" \xB7 ") : "Required non-Humility fuel is already available."));
        if (run.visit === 1 && run.collectionTargets?.some((n, i) => n > run.targets[i])) shipEstimate.append(el("p", "Includes fuel reserved for H2 where the switch sequence has no refill stop."));
      }
      shipEstimate.append(el("p", "FTL: " + c.ships.ftl + " / 60 from Epic Research. Both schedules include gem costs, fueling, and earlier returns; final returns are not awaited."));
    }
    updatePrimaryAction();
    if (!worker && !dirty) {
      $("run-summary").textContent = result ? duration(result.seconds) + " to target · " + result.switches + " switches" : "Ready to Plan";
      $("run-detail").textContent = result ? "Validated plan · " + result.pendingTE + " pending TE" : "Minimum time to your Truth Egg target";
    }
    return true;
  } catch (e) {
    $("sequence-preview").hidden = true;
    fieldError(e);
    updatePrimaryAction();
    return false;
  }
}
function updatePlanningContext() {
  const virtue = $("virtue").value;
  $("planning-virtue").replaceChildren(EggIcons.caption(virtue, S.NAME[S.EGGS.indexOf(virtue)] || "Review Farm"));
  try {
    let claimed = 0, pending = 0;
    for (let i = 0; i < 5; i++) {
      const level = readNumber("claimed-" + i, "Claimed TE", 0, 98, true), delivered = readNumber("delivered-" + i, "Delivered eggs");
      claimed += level;
      pending += Math.max(0, S.countTE(Math.max(delivered, level ? D.te[level - 1] : 0)) - level);
    }
    $("planning-starting-te").replaceChildren(el("span", claimed + " Claimed"), el("small", "+" + pending + " Pending"));
  } catch {
    $("planning-starting-te").textContent = "Review TE Inputs";
  }
  const backupTime = Number(config.importInfo?.timestamp), backup = $("planning-backup-time");
  if (backupTime > 0 && Number.isFinite(new Date(backupTime * 1000).getTime())) {
    backup.textContent = timestamp(backupTime, Zones.resolve($("eventTimezone").value), true, true);
    backup.dateTime = new Date(backupTime * 1000).toISOString();
  } else {
    backup.textContent = config.importInfo ? "Timestamp Not Supplied" : "No Backup Loaded";
    backup.removeAttribute("datetime");
  }
}
function saveBlob(name, text, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type })), a = el("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3e3);
}
function save() {
  clearTimeout(refreshTimer);
  let saved;
  try {
    saved = gather();
    config = saved;
  } catch {
    saved = { ...structuredClone(config), draftInputs: captureDraftInputs() };
  }
  saveBlob(N.farm(saved), JSON.stringify(saved, null, 2));
  if (refresh()) show("Farm configuration saved.");
  else show("Farm saved. Planning still needs attention: " + $("notice").textContent, true);
}
function condensedActions(actions) {
  const out = [];
  let batch = /* @__PURE__ */ new Map(), t;
  for (const a of actions) {
    if (a.type === "wait" && a.earningsMode === "online" && a.end - a.t < 10) continue;
    if (a.type !== "research" || a.t !== t) {
      batch = /* @__PURE__ */ new Map();
      t = a.t;
    }
    const prev = a.type === "research" ? batch.get(a.i) : null;
    if (prev && prev.to === a.from) {
      prev.to = a.to;
      prev.cost += a.cost;
      prev.bank = a.bank;
      prev.after = a.after;
      prev.grouped = true;
    } else {
      const row = { ...a };
      out.push(row);
      if (a.type === "research") batch.set(a.i, row);
    }
  }
  return out;
}
function actionLabel(a) {
  switch (a.type) {
    case "research":
      return "Buy " + D.research[a.i].name + " " + a.from + " \u2192 " + a.to;
    case "hab":
      return "Buy " + D.habs[a.id].name + " \xB7 habitat " + (a.slot + 1);
    case "vehicle":
      return "Buy " + D.vehicles[a.id].name + " \xB7 fleet slot " + (a.slot + 1);
    case "car":
      return "Add Hyperloop car " + a.fromCars + " \u2192 " + a.toCars + " \xB7 slot " + (a.slot + 1);
    case "silo":
      return "Buy another silo";
    case "set":
      return "Equip " + (a.setLabel || ArtifactSets.label(a.set)) + " artifact set";
    case "shift":
      return "Switch to " + S.NAME[a.egg];
    case "fuel-dump":
      return "Set Tank Limits and Discard Excess Fuel";
    case "fuel":
      return "Store " + num(a.amount) + " " + S.NAME[a.egg] + " fuel";
    case "ship-visit":
      return "H" + a.visit + " \xB7 No Ships Planned";
    case "ship-run":
      return "Launch " + a.count + " planned ships";
    case "wait":
      return (a.earningsMode === "offline" ? "Go offline for " : "Wait online for ") + duration(a.end - a.t);
    default:
      return a.type;
  }
}
function renderResult() {
  const r = result, zone = resultConfig.plan.eventTimezone, host = $("result-content"), summary = U.summarize(resultConfig, r);
  if (!worker) {
    $("run-summary").textContent = duration(r.seconds) + " to target \xB7 " + r.switches + " switches";
    $("run-detail").textContent = "Validated plan \xB7 " + r.pendingTE + " pending TE";
  }
  result.summary = summary;
  host.replaceChildren();
  $("empty-results").hidden = true;
  host.hidden = false;
  if(r.shiftPlans){
    const choices=el("section",undefined,"card research-sale-comparison"),heading=el("h2","Plans by Shift Count"),row=el("div",undefined,"research-sale-options");
    choices.append(heading,el("p","Up to three fastest complete plans with distinct shift counts. Finish time comes first; equal times favor fewer shifts.","hint"));
    for(const entry of r.shiftPlans){
      const button=el("button",undefined,"research-sale-option");button.type="button";button.dataset.shifts=entry.switches;button.setAttribute("aria-pressed",String(entry.switches===r.selectedSwitches));
      button.append(el("strong",entry.switches+" New Shift"+(entry.switches===1?"":"s")),el("span",duration(entry.plan.seconds)),el("span","Ends "+timestamp(entry.plan.end,zone),"research-sale-end"));
      if(entry.switches===r.recommendedSwitches)button.append(el("span","Fastest Found","research-sale-best"));
      button.onclick=()=>{result=ShiftPlans.select(result,entry.switches);if(!worker&&!dirty)refresh();else updateArtifactNotes();renderResult();host.querySelector(`[data-shifts="${entry.switches}"]`).focus({preventScroll:true});};row.append(button);
    }
    choices.append(row);host.append(choices);
  }
  const card = el("div", void 0, "card result-summary"), head = el("div", void 0, "result-header");
  head.append(el("h2", "Target " + r.target + " TE in " + duration(r.seconds)));
  const tools = el("div", void 0, "inline");
  const txt = el("button", "Export Walkthrough", "secondary");
  txt.onclick = async () => {
    const raw = resultConfig, preview = V.open();
    if (!preview) {
      show("Your browser blocked the PDF tab. Allow pop-ups for this app, then click Export Walkthrough again.", true);
      return;
    }
    txt.disabled = true;
    txt.textContent = "Creating PDF\u2026";
    try {
      const bytes = await Q.create(raw, r);
      V.display(preview, bytes, N.pdf(raw, r.seconds, r.selectedResearchSales, r.selectedSwitches));
      show("PDF opened in a new tab with shift summaries and the quick guide.");
    } catch (e) {
      preview.close();
      show("Could not open PDF: " + e.message, true);
    } finally {
      txt.disabled = false;
      txt.textContent = "Export Walkthrough";
    }
  };
  txt.title = "Open a PDF with shift summaries and the quick guide in a new tab";
  const json = el("button", "Save plan", "secondary");
  json.onclick = () => saveBlob(N.plan(resultConfig, r.seconds, r.selectedResearchSales, r.selectedSwitches), JSON.stringify({ version: 1, config: resultConfig, result: r }, null, 2));
  const expand = el("button", "Expand all", "secondary");
  expand.onclick = () => {
    const items = [...host.querySelectorAll(".timeline-group, .full-breakdown")], open = items.some(d => !d.open);
    for (const d of items) { if (open) d.fill?.(); d.open = open; }
    expand.textContent = open ? "Collapse All" : "Expand All";
  };
  const next = el("button", "Start next ascension", "secondary");
  next.id = "next-ascension";
  next.disabled = !!worker || !!importingBackup || dirty || r.target >= 490;
  next.onclick = () => {
    if (worker) {
      show("Stop or finish the current search before starting the next ascension.", true);
      return;
    }
    if (dirty) {
      show("Inputs changed. Re-run the current plan before starting its next ascension.", true);
      return;
    }
    config = nextAscension(resultConfig, result);
    config.plan.targetMode = Defaults.targetMode; config.plan.target = Defaults.target(config.farm.claimed);
    config.uiProvenance = {...config.uiProvenance, ...Object.fromEntries(["farm", "account", "progress", "fuel", "flights"].map(group => [group, "plan"]))};
    result = null;
    resultConfig = null;
    dirty = false;
    renderForm();
    $("result-content").hidden = true;
    $("empty-results").hidden = false;
    tab("farm");
    show("Next ascension starts at the previous finish time. Claimed TE, lifetime eggs, Epic Research, artifacts, Soul Eggs, and shift history are preserved; farm upgrades and gems are reset.");
    };
  tools.append(txt, json, expand, next);
  head.append(tools);
  card.append(head, el("p", "Starts " + timestamp(r.start, zone), "plan-start"), el("p", "Ends " + timestamp(r.end, zone), "plan-end"), el("p", r.switches + " new switches \xB7 " + num(r.soulCost) + " Soul Eggs spent"), el("p", waitTotals(summary.totals), "waiting-totals"), el("p", "Minimum offline break: " + (resultConfig.plan.minOfflineMinutes ?? 1) + " min. Finish time comes first; ties favor fewer switches, then fewer earning breaks.", "hint"), el("p", "Validated by replay: purchases affordable, Virtue permissions enforced, target reached. Claim pending TE at ascension.", "hint"));
  const diagnostics = el("details", void 0, "search-details");
  diagnostics.append(el("summary", "Search Details"), el("p", r.method + " \xB7 " + r.explored.toLocaleString() + " states examined \xB7 " + r.termination + ".", "hint"));
  if (r.solverVersion === 2) diagnostics.append(el("p", "Research allowed through " + timestamp(r.researchDeadline, zone) + "; " + r.actualResearchSales + " sales actually used. Visit durations are automatic.", "hint"));
  if (r.openingSearch) diagnostics.append(el("p", "Compared " + r.openingSearch.combinationsCompared + " of " + r.openingSearch.totalCombinations + " C1/K1 opening combinations at " + (r.openingSearch.stepMinutes || 30) + "-minute intervals" + (r.openingSearch.complete ? " (complete)." : " (stopped early)."), "hint"));
  if (r.waitingRoutesCompared > 1) diagnostics.append(el("p", "Compared individual purchase waits and offline batches across " + r.waitingRoutesCompared + " staged routes.", "hint"));
  const c1 = summary.shifts.find((s) => s.phase === "C1"), k1 = summary.shifts.find((s) => s.phase === "K1");
  if (c1 && k1 && r.openingTimeLimits) diagnostics.append(el("p", "Opening duration: C1 " + exactDuration(c1.seconds) + " (limit " + (resultConfig.plan.c1MaxMinutes ?? 60) + " min) \xB7 K1 " + exactDuration(k1.seconds) + " (limit " + (resultConfig.plan.k1MaxMinutes ?? 60) + " min).", "hint"));
  if (r.baselineSeconds) diagnostics.append(el("p", "No-upgrade comparison: " + duration(r.baselineSeconds) + " \u2192 " + duration(r.seconds) + ".", "hint"));
  diagnostics.append(el("p", "Purchase paths and departure times are compared along the selected route. Saved plans never seed a search.", "hint"), el("p", "Online waits under 10 seconds are hidden; their time remains included.", "hint"));
  card.append(diagnostics);
  const stale = el("div", "Inputs changed since this plan was generated. This timeline uses the saved inputs from its run. Re-run to update it.", "notice stale-plan");
  stale.id = "plan-stale";
  stale.hidden = !dirty;
  stale.setAttribute("role", "status");
  card.append(stale);
  host.append(card);
  const initial = S.prepare(resultConfig, { oneStartingSilo: r.initialSiloRule === "one" || r.actions.some((a) => a.initialSiloRule === "one") }), guidance = el("div", void 0, "model-notices");
  guidance.append(el("p", Model.maintenance(initial.s, initial.c, r.finalStats)));
  for (const message of Model.notices(initial.s, initial.c)) guidance.append(el("p", message));
  host.append(guidance);
  const heading = el("div", void 0, "shift-overview-heading");
  heading.append(el("h2", "Shift activities"), el("p", "Open a shift for purchase targets in game order, then follow each break and resume time. Full Breakdown shows individual actions. Online waits under 10 seconds stay in purchase groups and totals.", "hint"));
  host.append(heading);
  const events = initial.c.calendar.filter((e) => e.t > r.start && e.t <= r.end);
  let ei = 0;
  let carriedGear = initial.c.loadouts[initial.s.set] || [];
  for (const shift of summary.shifts) {
    const equipActions = r.actions.slice(shift.firstIndex,shift.lastIndex+1).filter(a=>a.type === "set");
    const equipGear = action => action.loadout || initial.c.loadouts[action.set] || [];
    const appendGear = (host, action, inherited = false) => {
      const label = inherited ? "Artifacts carried into H2" : "Equip "+(action.setLabel || ArtifactSets.label(action.set))+" Artifacts";
      const box = el("div", undefined, "equip-artifact-display");
      box.append(el("p",label,"equip-artifact-label"),LoadoutCard.strip(inherited ? carriedGear : equipGear(action),label,initial.c.pro ? 4 : 2)); host.append(box);
    };
    const group = el("details", void 0, "timeline-group shift-summary"), header = el("summary"), top = el("div", void 0, "shift-summary-top"), title = el("span", shift.phase + " \xB7 " + shift.name, "shift-title"), timing = el("div", void 0, "shift-timing"), finish = el("time", "Ends " + timestamp(shift.end, zone, true), "shift-end");
    title.replaceChildren(EggIcons.caption(S.EGGS[shift.egg], shift.phase + " \xB7 " + shift.name));
    finish.dateTime = new Date(shift.end * 1e3).toISOString();
    const start = el("time", "Starts " + timestamp(shift.start, zone, true), "shift-start");
    start.dateTime = new Date(shift.start * 1e3).toISOString();
    const cost = el("span", shift.hasSwitch ? "Switch Cost: " : "Starting Farm · No Switch Cost", "shift-cost");
    if (shift.hasSwitch) cost.append(Units.amount("soul",num(shift.soulCost)));
    cost.title = shift.hasSwitch ? "Soul Eggs required to enter this Truth Egg visit." : "The farm you start on does not require a new switch.";
    const gained = el("span", exactDuration(shift.seconds)+" · ","shift-duration");
    gained.append(Units.amount(S.EGGS[shift.egg],"+"+shift.teGained));
    timing.append(gained, cost, start, finish);
    top.append(title, timing);
    header.append(top);
    const chips = el("div", void 0, "activity-chips");
    for (const activity of shift.activities) {
      if (activity.kind === "artifact") continue;
      const chip = el("span", void 0, "activity-chip " + activity.kind);
      chip.append(activity.kind === "research" ? ResearchIcons.captionName(activity.label) : FarmIcons.activityCaption(activity));
      if (activity.value) chip.append(el("b", activity.value));
      chips.append(chip);
    }
    header.append(chips);
    for (const action of equipActions) appendGear(header,action);
    if (shift.phase === "H2" && !equipActions.length) appendGear(header,null,true);
    header.append(el("div", waitTotals(shift), "shift-waits"));
    const peakRates = () => {
      const rates = el("dl", undefined, "shift-max-rates");
      rates.title = "Highest modeled farm rates during this shift. Earnings use the selected earnings mode and weekly events; laying and shipping show capacity before fuel diversion.";
      for (const [key, label] of [["earning","Maximum Earning Rate"],["shipping","Maximum Shipping Rate"],["laying","Maximum Egg Laying Rate"]]) {
        const item = el("div"); item.dataset.rate = key;
        const value = el("dd"); value.append(Units.amount(key === "earning" ? "gem" : S.EGGS[shift.egg],num(shift.maxRates[key]*3600),"/hour"));
        item.append(el("dt",label),value); rates.append(item);
      }
      return rates;
    };
    header.append(peakRates());
    group.append(header);
    const guide = el("div", void 0, "quick-guide");
    guide.append(el("h3", "Quick guide"));
    if (shift.phase === "H2" && !equipActions.length) appendGear(guide,null,true);
    const shownGear = new Set();
    for (const [index, step] of shift.quickGuide.entries()) {
      const block = el("section", void 0, "guide-step"), stepHead = el("div", void 0, "guide-step-heading");
      if (step.activities.length || step.shipRun) {
        stepHead.append(el("h4", step.activities.length ? "Purchase group " + (index + 1) : "Ship launches"), el("time", timestamp(step.start, zone), "guide-start"));
        block.append(stepHead);
      }
      const items = el("div", void 0, "guide-items");
      for (const action of equipActions) if (!shownGear.has(action) && action.t >= step.start && action.t <= step.purchaseEnd) { appendGear(block,action); shownGear.add(action); }
      for (const tier of G.groups(step.activities.filter(a=>a.kind !== "artifact"))) {
        const section = el("section", void 0, "guide-tier");
        section.dataset.tier = tier.tier ?? "other";
        section.append(el("h5", tier.label));
        const list = el("ul", void 0, "guide-item-list");
        for (const activity of tier.items) {
          const row = el("li", void 0, "guide-item " + activity.kind);
          if (activity.kind === "research") row.dataset.researchIndex = activity.i;
          row.append(activity.kind === "research" ? ResearchIcons.caption(D.research[activity.i].id, activity.label) : FarmIcons.activityCaption(activity));
          if (activity.value) row.append(el("b", activity.value));
          list.append(row);
        }
        section.append(list);
        items.append(section);
      }
      if (items.childElementCount) block.append(items);
      if (step.shipRun) {
        const run = step.shipRun, details = el("div", void 0, "ship-run-details");
        details.append(el("p", "Stay on Humility for " + exactDuration(run.end - run.t) + " to fund, fuel, and launch these missions."));
        for (const m of run.batches) details.append(el("p", m.count + " \xD7 " + m.label + " \xB7 First " + timestamp(m.firstLaunch, zone) + " \xB7 Final " + timestamp(m.lastLaunch, zone)));
        if (run.launches?.length) {
          const schedule = el("details", void 0, "ship-launch-schedule");
          schedule.append(el("summary", "Launch Schedule \xB7 " + run.launches.length + " Ships"));
          for (const [i, launch] of run.launches.entries()) schedule.append(el("p", i + 1 + ". " + launch.label + " \xB7 Slot " + launch.slot + " \xB7 " + timestamp(launch.t, zone, true)));
          for (const pause of run.waits || []) if (pause.mode === "offline" || pause.seconds >= 10) schedule.append(el("p", (pause.mode === "offline" ? "Offline " : "Online ") + exactDuration(pause.seconds) + " \xB7 " + pause.reason + " \xB7 Resume " + timestamp(pause.end, zone, true)));
          details.append(schedule);
        }
        details.append(el("p", "Final launches complete at " + timestamp(run.end, zone, true) + ". Final ships return later; the plan does not wait for them."));
        block.append(details);
      }
      if (step.hiddenOnlineSeconds || step.interactionSeconds) block.append(el("p", [step.hiddenOnlineSeconds ? "Brief online waits included: " + exactDuration(step.hiddenOnlineSeconds) : "", step.interactionSeconds ? "Interactions: " + exactDuration(step.interactionSeconds) : ""].filter(Boolean).join(" \xB7 "), "guide-overhead"));
      if (step.break) {
        const pause = step.break, breakBox = el("div", void 0, "guide-break " + pause.mode), breakHeading = el("div", void 0, "guide-break-heading"), resume = el("time", "Resume " + timestamp(pause.end, zone, true), "guide-resume");
        resume.dateTime = new Date(pause.end * 1e3).toISOString();
        breakHeading.append(el("b", pause.mode === "fuel" ? "Fuel Collection" : pause.mode === "offline" ? "Offline Break" : "Online Wait"), el("strong", exactDuration(pause.seconds), "guide-break-duration"));
        breakBox.append(breakHeading, resume, el("span", "Starts " + timestamp(pause.start, zone)));
        if (pause.reason) breakBox.append(el("small", pause.reason));
        block.append(breakBox);
      }
      guide.append(block);
    }
    if (equipActions.length) carriedGear = equipGear(equipActions.at(-1));
    if (!shift.quickGuide.length) guide.append(el("p", "No purchases or breaks in this shift.", "hint"));
    const complete = el("div", void 0, "guide-complete"), done = el("time", timestamp(shift.end, zone, true));
    done.dateTime = new Date(shift.end * 1e3).toISOString();
    complete.append(el("b", "Shift Complete"), Units.amount(S.EGGS[shift.egg],"+"+shift.teGained), done);
    complete.append(peakRates());
    guide.append(complete);
    group.append(guide);
    const full = el("details", void 0, "full-breakdown");
    full.append(el("summary", "Full breakdown \xB7 individual purchases and waits"));
    const content = el("div");
    full.append(content);
    group.append(full);
    host.append(group);
    // Assign events once in chronological order. Collapsed details need no
    // action DOM or date formatting until opened; expansion preserves order.
    const records = [];
    for (const a of condensedActions(r.actions.slice(shift.firstIndex, shift.lastIndex + 1))) {
      const leading = [], during = [];
      while (ei < events.length && events[ei].t <= a.t) leading.push(events[ei++]);
      if (a.type === "wait") while (ei < events.length && events[ei].t <= a.end) during.push(events[ei++]);
      records.push({a, leading, during});
    }
    full.fill = () => {
      if (full.dataset.loaded) return;
      full.dataset.loaded = "true";
      const fragment = document.createDocumentFragment();
      for (const {a, leading, during} of records) {
      for (const e of leading) fragment.append(el("div", timestamp(e.t, zone) + " \xB7 " + e.earnings + "\xD7 earnings \xB7 " + (e.sale === 0.3 ? "70% research discount" : "regular research prices"), "event-marker"));
      const row = el("div", void 0, "action " + a.type + (a.type === "wait" ? " " + (a.earningsMode || "online") : ""));
      const time = el("time", timestamp(a.t, zone));
      time.dateTime = new Date(a.t * 1e3).toISOString();
      const detail = el("div");
      const actionHeading = el("h4");
      actionHeading.append(a.type === "research" ? ResearchIcons.caption(D.research[a.i].id, titleCase(actionLabel(a))) : FarmIcons.actionCaption(a, titleCase(actionLabel(a))));
      detail.append(actionHeading);
      if (a.type === "wait") {
        detail.append(el("p", a.reason + " \xB7 " + num(a.eggsGained) + " eggs delivered"));
        for (const e of during) {
          detail.append(el("p", timestamp(e.t, zone) + " \xB7 " + e.earnings + "\xD7 earnings \xB7 " + (e.sale === 0.3 ? "70% research discount" : "regular research prices"), "delta"));
        }
      } else if (a.type === "ship-visit") {
        detail.append(el("p", "Continue with the listed activities; no ship launches on this visit."));
      } else if (a.type === "fuel-dump") {
        detail.append(el("p", "Discard " + a.removed.map((v, i) => v ? num(v) + " " + S.NAME[i] : "").filter(Boolean).join(" \xB7 ")));
      } else if (a.type === "fuel") {
        detail.append(el("p", "100% egg diversion for " + exactDuration(a.end - a.t) + " \xB7 no gems or TE delivery during filling"));
        detail.append(el("p", "Fuel ready " + timestamp(a.end, zone, true), "delta"));
      } else if (a.type === "ship-run") {
        detail.append(el("p", "Stay for " + exactDuration(a.end - a.t) + " \xB7 " + waitTotals(a) + " \xB7 Gems spent " + num(a.cost)));
        for (const m of a.batches) detail.append(el("p", m.count + " \xD7 " + m.label + " \xB7 First " + timestamp(m.firstLaunch, zone) + " \xB7 Final " + timestamp(m.lastLaunch, zone)));
        detail.append(el("p", "Earlier return waits " + exactDuration(a.returnWaitSeconds) + " \xB7 Funding waits " + exactDuration(a.fundingSeconds) + " \xB7 Tank transfer " + exactDuration(a.transferSeconds), "delta"));
        detail.append(el("p", "Final launches complete " + timestamp(a.end, zone, true) + ". Continue the listed plan; no wait for final returns.", "delta"));
      } else if (a.grouped) {
        detail.append(el("p", "Combined cost " + num(a.cost)));
      } else {
        detail.append(el("p", a.type === "shift" ? "Gems Reset \xB7 " + num(a.soulCost) + " Soul Eggs spent" : "Cost " + num(a.cost) + " \xB7 gems remaining " + num(a.bank)));
        detail.append(el("p", "Delivery " + num(a.before.delivery * 3600) + " \u2192 " + num(a.after.delivery * 3600) + "/hour \xB7 earnings " + num(a.after.earning * 3600) + "/hour", "delta"));
      }
      row.append(time, detail);
      fragment.append(row);
      }
      content.append(fragment);
    };
    new MutationObserver(() => { if (full.open) full.fill(); }).observe(full, {attributes:true,attributeFilter:["open"]});
    full.addEventListener("toggle", () => { if (full.open) full.fill(); });
  }
  const end = el("div", void 0, "card");
  const totals = el("p", void 0, "egg-totals");
  for (const [i, count] of r.finalTE.entries()) totals.append(EggIcons.caption(S.EGGS[i], S.NAME[i] + " " + count));
  end.append(el("h2", "Target available to claim"), el("p", timestamp(r.end, zone)), totals, el("p", r.pendingTE + " pending TE \xB7 final delivery " + num(r.finalStats.delivery * 3600) + "/hour"));
  host.append(end);
}
function renderSuggestion(suggestion, runConfig = resultConfig, inputsChanged = dirty) {
  const host = $("result-content");
  host.replaceChildren();
  host.hidden = false;
  $("empty-results").hidden = true;
  const card = el("div", void 0, "card");
  card.append(el("h2", "A validated plan is available with a longer window"), el("p", "No plan was found within your " + suggestion.requestedDays + "-day limit. A separately replayed plan reaches " + suggestion.result.target + " TE in " + duration(suggestion.result.seconds) + ". This does not prove that a shorter route is impossible."), el("p", "Your farm inputs are preserved. This alternative uses a 366-day planning limit."));
  const accept = el("button", "Use 366-day limit and view this plan");
  if (inputsChanged) {
    accept.disabled = true;
    card.append(el("p", "Inputs changed during the search. Re-run to get an alternative for the current inputs."));
  }
  accept.onclick = () => {
    if (JSON.stringify(gather()) !== JSON.stringify(runConfig)) {
      show("Inputs changed since this alternative was generated. Re-run for the current farm.", true);
      return;
    }
    config = structuredClone(suggestion.config);
    resultConfig = structuredClone(suggestion.config);
    result = suggestion.result;
    dirty = false;
    renderForm();
    renderResult();
    tab("results");
    show("Longer planning window applied. Every action in this plan passed replay validation.");
  };
  card.append(accept);
  host.append(card);
}
function renderSearchClock() {
  const total = Math.max(0, Math.floor((performance.now() - searchStartedAt) / 1e3)), elapsed = exactDuration(total) + (total >= 60 && total % 60 === 0 ? " 0s" : "");
  $("run-detail").textContent = [searchContext, searchBestSeconds !== null ? "Best so far: " + duration(searchBestSeconds) : "", "Searching for " + elapsed].filter(Boolean).join(" \xB7 ");
  $("search-elapsed").textContent = elapsed;
  $("search-best").textContent = searchBestSeconds !== null ? duration(searchBestSeconds) : "None Yet";
}
function startSearchClock() {
  clearInterval(searchTimer);
  searchStartedAt = performance.now();
  searchBestSeconds = null;
  searchContext = "Evaluating affordable purchases, event waits, and switches";
  $("search-stage").textContent = "Preparing Farm and Checking Limits";
  $("search-openings").textContent = "Not Started";
  delete $("search-openings").dataset.total;
  renderSearchClock();
  searchTimer = setInterval(renderSearchClock, 1e3);
}
function busy(active) {
  if (!active) {
    clearInterval(searchTimer);
    searchTimer = null;
  }
  $("stop").disabled = false;
  $("stop").textContent = "Stop & Keep Best";
  $("stop").hidden = !active;
  $("run-progress").hidden = !active;
  $("search-status").hidden = !active;
  $("empty-results").hidden = active || !!result;
  $("run-progress").removeAttribute("value");
  $("run-progress").removeAttribute("aria-valuetext");
  $("run-progress").setAttribute("aria-label", "Planner search in progress");
  $("optimize").setAttribute("aria-busy", String(active));
  updatePrimaryAction();
  if (active) $("optimize").disabled = true;
  if ($("next-ascension")) $("next-ascension").disabled = active || !!importingBackup || dirty || !result || result.target >= 490;
  for (const id of ["load-file", "eid"]) $(id).disabled = active || !!importingBackup;
  $("use-earnings-start").disabled = active || !!importingBackup || $("use-earnings-start").dataset.ready !== "true";
  $("eid").setAttribute("aria-busy", String(!!importingBackup));
}
function optimize() {
  if (importingBackup) return;
  if (!refresh()) return;
  const runConfig = structuredClone(config);
  $("search-limits").textContent = "Automatic purchase and departure timing · " + (runConfig.plan.autoSequence?"up to "+runConfig.plan.maxShifts+" new shifts":"entered route")+" · search budget " + exactDuration(searchOptions.maxMs / 1000) + ".";
  dirty = false;
  if ($("plan-stale")) { $("plan-stale").textContent = "A new search is running. This timeline is the previous plan; the completed search will replace it."; $("plan-stale").hidden = false; }
  show("Searching research orders and switch timing. You can keep using the interface.");
  tab("results");
  busy(true);
  $("run-summary").textContent = "Searching\u2026";
  startSearchClock();
  const blob = new Blob([globalThis.VIRTUE_WORKER_SOURCE], { type: "text/javascript" }), url = URL.createObjectURL(blob);
  try { worker = new Worker(url); }
  catch (error) {
    busy(false);
    markInputsChanged();
    show("Could not start the planner: " + error.message, true);
    showPlanningGuidance("Could not start the planner: " + error.message, true);
    $("run-summary").textContent = "Search Could Not Start";
    $("run-detail").textContent = "Try reopening the app or using the Windows launcher.";
    return;
  } finally { URL.revokeObjectURL(url); }
  const activeWorker = worker;
  let lastAnnouncement = 0;
  worker.onmessage = ({ data }) => {
    if (worker !== activeWorker) return;
    if (data.type === "progress") {
      const p = data.progress;
      if (p.phase === "alternative") {
        $("run-summary").textContent = "Checking a longer planning window";
        searchContext = "No plan found within " + p.requestedDays + " days; testing a validated alternative";
        $("search-stage").textContent = "Checking a Separate Longer-Window Plan";
        $("run-progress").removeAttribute("value");
        $("run-progress").removeAttribute("aria-valuetext");
        renderSearchClock();
        $("search-announcement").textContent = searchContext;
        return;
      }
      if (p.phase === "route-search") {
        $("run-summary").textContent = "Finding Fastest Plan · " + p.stage;
        searchContext = Number(p.explored || 0).toLocaleString() + " purchase states examined";
        $("search-stage").textContent = p.stage + " · Purchases and Departure Timing";
        $("search-openings").textContent = searchContext;
        $("run-progress").removeAttribute("value");
        $("run-progress").removeAttribute("aria-valuetext");
      } else if (p.phase === "openings") {
        $("run-summary").textContent = "Checking Opening " + (p.openingCompared + 1) + " / " + p.openingTotal;
        searchContext = (p.researchSales ? p.researchSales + " research sale" + (p.researchSales === 1 ? "" : "s") + " · " : "") + "C1 ≤" + p.openingBudget.c1MaxMinutes + " min · K1 ≤" + p.openingBudget.k1MaxMinutes + " min";
        const egg = {C:"Curiosity", K:"Kindness", I:"Integrity", R:"Resilience", H:"Humility"}[p.stage?.[0]];
        $("search-stage").textContent = /^[CKIRH]\d$/.test(p.stage) ? p.stage + " · " + egg + " Complete" : p.stage === "opening" ? "Opening Visits Complete" : p.stage;
        $("search-openings").textContent = p.openingCompared + " / " + p.openingTotal + " completed · checking " + (p.openingCompared + 1);
        $("search-openings").dataset.total = String(p.openingTotal);
        $("run-progress").max = p.openingTotal;
        $("run-progress").value = p.openingCompared;
        $("run-progress").setAttribute("aria-valuetext", p.openingCompared + " of " + p.openingTotal + " opening comparisons completed");
      } else {
        const route = runConfig.plan.strategy === "user" ? "User Sequence" : "Free Routing";
        $("run-summary").textContent = route + " Search";
        searchContext = Number(p.explored || 0).toLocaleString() + " states examined";
        $("search-stage").textContent = route + " · " + searchContext;
        const total = Number($("search-openings").dataset.total);
        $("search-openings").textContent = total ? total + " / " + total + " completed" : "Not Applicable to This Route";
        $("run-progress").removeAttribute("value");
        $("run-progress").removeAttribute("aria-valuetext");
      }
      if (p.bestSeconds !== null && p.bestSeconds !== void 0) searchBestSeconds = p.bestSeconds;
      renderSearchClock();
      if (performance.now() - lastAnnouncement > 5000) {
        $("search-announcement").textContent = $("run-summary").textContent + (searchBestSeconds !== null ? ". Best plan so far: " + duration(searchBestSeconds) : ". No complete plan found yet.");
        lastAnnouncement = performance.now();
      }
    } else {
      worker.terminate();
      worker = null;
      busy(false);
      if (data.type === "error") {
        const inputsChanged = dirty;
        dirty = dirty || !!result;
        if ($("plan-stale")) { $("plan-stale").textContent = "The new search did not finish. This timeline still uses the previous plan's inputs."; $("plan-stale").hidden = !dirty; }
        if ($("next-ascension")) $("next-ascension").disabled = true;
        show(data.error, true);
        showPlanningGuidance(data.error, true, inputsChanged);
        $("run-summary").textContent = "Planning could not finish";
        $("run-detail").textContent = "Review inputs or increase the search budget";
        if (data.suggestion) renderSuggestion(data.suggestion, runConfig, inputsChanged);
            } else {
        result = data.result;
        resultConfig = runConfig;
        if (!dirty) refresh();
        renderResult();
        show(dirty ? "Plan completed and replay validation passed. Inputs changed during the run; this timeline uses the starting inputs." : "Plan completed and replay validation passed.");
        $("run-summary").textContent = duration(result.seconds) + " to target \xB7 " + result.switches + " switches";
        $("run-detail").textContent = "Fastest plan found \xB7 " + result.actions.filter((a) => !["wait", "shift"].includes(a.type)).length + " purchases";
        if (dirty) markInputsChanged();
            }
    }
  };
  worker.onerror = (e) => {
    if (worker !== activeWorker) return;
    worker?.terminate();
    worker = null;
    busy(false);
    dirty = !!result;
    if ($("plan-stale")) { $("plan-stale").textContent = "The search failed. This timeline still uses the previous plan's inputs."; $("plan-stale").hidden = !dirty; }
    show("Planner worker failed: " + e.message, true);
    showPlanningGuidance("Planner worker failed: " + e.message, true);
    $("run-summary").textContent = "Worker error";
    $("run-detail").textContent = "Review inputs and try the search again";
    };
  worker.postMessage({ config: runConfig, options: { ...searchOptions } });
}
async function loadFile(file) {
  const epoch = loadEpoch;
  try {
    const text = await file.text();
    if (epoch !== loadEpoch) return;
    const raw = JSON.parse(text);
    if (worker) throw Error("Stop or finish the current search before loading a farm.");
    if (raw.version === 1 && raw.config && raw.result) {
      const recovered = replaySavedResult(raw.config, raw.result);
      config = raw.config;
      result = recovered;
      resultConfig = structuredClone(raw.config);
      dirty = false;
      result.summary = U.summarize(config, result);
      renderForm();
      renderResult();
      tab("results");
      const oldLimits = result.solverVersion !== 2 && !result.openingTimeLimits && U.openingViolations(config, result).length;
      show(oldLimits ? "Saved plan loaded and replayed. This older plan exceeds the current C1/K1 limits. Re-run the planner to enforce them." : "Saved plan loaded and replayed.", !!oldLimits);
          return;
    }
    const savedFarm = raw.version === 1 && raw.farm;
    const next = savedFarm ? raw : currentFarmImport(raw);
    for (const [key, length] of [["claimed", 5], ["delivered", 5], ["habs", 4], ["vehicles", 17]]) if (!Array.isArray(next.farm[key]) || next.farm[key].length !== length) throw Error("Farm file needs " + length + " " + key + " entries.");
    config = next;
    result = null;
    resultConfig = null;
    dirty = false;
    clearTimeout(refreshTimer);
    const valid = renderForm();
    $("result-content").hidden = true;
    $("empty-results").hidden = false;
    const loaded = !savedFarm && next.importInfo.scope === "account" ? "Account information has been loaded, but no current Virtue farm was found." : "Farm loaded.";
    show(valid ? loaded + " Check the target and start time before planning." : loaded + " Planning still needs attention: " + $("notice").textContent, !valid);
    tab("account");
    } catch (e) {
    show("Could not load file: " + e.message, true);
  }
}
for (const visit of [1, 2]) $("add-ship-" + visit).onclick = () => {
  try {
    config = gather();
    const missions = config.plan.ships.visits[visit - 1].missions;
    missions.push({ ship: "CHICKEN_ONE", duration: "SHORT", count: 3 });
    renderShipMissions(visit, missions);
    markInputsChanged();
    refresh();
    $("pick-ship-" + visit + "-" + (missions.length - 1)).focus();
  } catch (e) {
    show(e.message, true);
  }
};
$("copy-ships").onclick = () => {
  try {
    config = gather();
    config.plan.ships.visits[1] = structuredClone(config.plan.ships.visits[0]);
    renderShipMissions(2, config.plan.ships.visits[1].missions);
    markInputsChanged();
    refresh();
  } catch (e) {
    show(e.message, true);
  }
};
$("save-file").onclick = save;
$("load-file").onclick = () => $("file-input").click();
$("file-input").onchange = (e) => {
  if (e.target.files[0]) loadFile(e.target.files[0]);
  e.target.value = "";
};
$("clear-data").onclick = () => {
  let saved;
  try { saved = gather(); } catch { saved = {...structuredClone(config), draftInputs:captureDraftInputs()}; }
  resetSnapshot = {config:saved,result,resultConfig,dirty:dirty || !!worker && !!result,tab:document.querySelector("[data-tab].active").dataset.tab,loadoutTab:activeLoadoutTab};
  $("reset-undo").hidden = false;
  loadEpoch++;
  importingBackup = null;
  clearTimeout(refreshTimer);
  worker?.terminate();
  worker = null;
  busy(false);
  config = Defaults.freshFarm();
  result = null;
  resultConfig = null;
  dirty = false;
  $("file-input").value = "";
  $("research-filter").value = "";
  $("run-summary").textContent = "";
  $("run-detail").textContent = "";
  $("result-content").replaceChildren();
  $("result-content").hidden = true;
  $("empty-results").hidden = false;
  renderForm();
  tab("account");
  show("Data cleared. Undo Reset restores your previous inputs in this session. Enter your farm values to start from scratch; exported files are still available to load.");
};
$("undo-reset").onclick = () => {
  if (!resetSnapshot) return;
  const restoreTab = resetSnapshot.tab, restoreLoadout = resetSnapshot.loadoutTab;
  worker?.terminate(); worker = null; importingBackup = null; busy(false);
  loadEpoch++; clearTimeout(refreshTimer);
  ({config,result,resultConfig,dirty} = resetSnapshot);
  resetSnapshot = null;
  $("reset-undo").hidden = true;
  renderForm();
  if (result) renderResult();
  selectLoadout(restoreLoadout || "current");
  tab(restoreTab === "results" && !result ? "account" : restoreTab, true);
  show("Reset undone. Your farm, planning goals, and previous timeline have been restored.");
};
$("dismiss-reset").onclick = () => {
  resetSnapshot = null; $("reset-undo").hidden = true; $("page-title").focus({preventScroll:true});
};
function eidForSync() {
  const typed = $("eid").value.trim().toUpperCase();
  if (eidDraft) return eidDraft;
  return /^EI\d{16}$/.test(typed) ? typed : savedEid;
}
function showEidIdentity() {
  if (document.activeElement === $("eid")) $("eid").value = eidDraft || savedEid;
  else $("eid").value = eidDraft || savedEidName || savedEid;
}
async function loadEidData() {
  if (worker || importingBackup) return;
  const eid = eidForSync();
  const epoch = loadEpoch;
  importingBackup = "auto";
  busy(false);
  show("Requesting your saved Egg Inc. backup\u2026");
  try {
    const b = await A.loadBackup(eid);
    if (epoch !== loadEpoch) return;
    savedEid = A.eid(eid);
    savedEidName = String(b.backup?.userName || "").trim();
    eidDraft = "";
    try {
      localStorage.setItem(EID_KEY, savedEid);
      if (savedEidName) localStorage.setItem(EID_NAME_KEY, savedEidName);
      else localStorage.removeItem(EID_NAME_KEY);
    } catch { }
    showEidIdentity();
    const next = currentFarmImport(b);
    config = next;
    result = null;
    resultConfig = null;
    dirty = false;
    clearTimeout(refreshTimer);
    const valid = renderForm();
    $("result-content").hidden = true;
    $("empty-results").hidden = false;
    const message = next.importInfo.scope === "account" ? "Account information has been loaded, but no current Virtue farm was found. Your starting farm, start time, and planning goals are retained." : "Account information and the current Virtue farm have been loaded. Your planning goals are retained.";
    show(message + (valid ? " Review backup age and assumptions before planning." : " Your draft is retained; review the marked inputs before planning."), !valid);
  } catch (e) {
    if (epoch === loadEpoch) show(e.message, true);
  } finally {
    if (epoch === loadEpoch) { importingBackup = null; busy(!!worker); }
  }
}
function persistEid() {
  const value = $("eid").value.trim().toUpperCase();
  if (!value) {
    savedEid = "";
    savedEidName = "";
    eidDraft = "";
    try { localStorage.removeItem(EID_KEY); localStorage.removeItem(EID_NAME_KEY); } catch { }
    return;
  }
  if (!/^EI\d{16}$/.test(value)) { eidDraft = value; return; }
  eidDraft = "";
  if (value !== savedEid) savedEidName = "";
  savedEid = value;
  try {
    localStorage.setItem(EID_KEY, savedEid);
    if (!savedEidName) localStorage.removeItem(EID_NAME_KEY);
  } catch { }
}
$("eid").addEventListener("focus", () => { $("eid").value = eidDraft || savedEid || $("eid").value; $("eid").select(); });
$("eid").addEventListener("blur", () => { persistEid(); showEidIdentity(); });
$("eid").addEventListener("input", persistEid);
$("eid").addEventListener("keydown", (event) => {
  if (event.key === "Enter") { event.preventDefault(); persistEid(); loadEidData(); }
});
$("copy-earnings").onclick = () => copySet("earnings");
$("review-starting-gear").onclick = () => tab("artifacts", true);
$("use-earnings-start").onclick = () => {
  if (worker || importingBackup) return;
  try {
    config = gather();
    const {c} = S.prepare(config);
    if (!c.earningLoadout?.some(slot => slot.artifactId)) return;
    config.farm.loadouts.current = structuredClone(c.earningLoadout);
    (config.uiProvenance ||= {}).farm = "manual";
    config.farm.activeSet = "current";
    $("activeSet").value = "current";
    markInputsChanged();
    renderLoadouts();
    refresh();
    show("The plan now starts with your earning set. Equip the listed artifacts and stones on Humility before starting this plan. Automatic delivery optimization remains enabled.");
  } catch (e) { show(e.message, true); }
};
function copySet(key) {
  if (!$("manualFarmData").checked) return;
  try {
    config = gather();
    config.farm.loadouts.current = structuredClone(config.farm.loadouts[key]);
    config.farm.activeSet = "current";
    $("activeSet").value = "current";
    (config.uiProvenance ||= {}).farm = "manual";
    renderLoadouts();
    selectLoadout("current");
    markInputsChanged();
    refresh();
    show((key === "earnings" ? "Earnings" : "Delivery") + " loadout copied to Current. Equip these artifacts and stones in the game before starting the plan.");
  } catch (e) {
    show(e.message, true);
  }
}
function renderResearch() {
  const host = $("research-body");
  host.replaceChildren();
  for (const tier of [...new Set(D.research.map(r => r.tier))]) {
    const items = D.research.filter(r => r.tier === tier), section = el("details", undefined, "research-tier");
    section.dataset.tier = tier;
    section.open = !items.every(r => config.farm.research[r.id] === r.levels);
    const summary = el("summary"), label = el("span", "Tier " + tier, "research-tier-label"), totals = el("span", undefined, "research-tier-totals");
    summary.append(label, totals);
    section.append(summary);
    const table = el("table"), head = el("thead"), headings = el("tr"), body = el("tbody");
    for (const name of ["Research", "Level / Max", "Next Cost", "Cost to Max"]) {
      const th = el("th", name); th.scope = "col"; headings.append(th);
    }
    head.append(headings);
    for (const r of items) {
      const row = el("tr");
      row.dataset.search = (r.name + " " + r.description).toLowerCase();
      const name = el("td", undefined, "research-description"), caption = ResearchIcons.caption(r.id, r.name);
      caption.title = r.description;
      const description = el("span", r.description, "sr-only"); description.id = "description-" + r.id;
      name.append(caption, description);
      const level = el("td", undefined, "research-level"), input = el("input");
      input.id = "research-" + r.id; input.type = "number"; input.min = "0"; input.max = r.levels;
      NumericInput.write(input, config.farm.research[r.id] || 0);
      input.setAttribute("aria-label", r.name + " current level");
      input.setAttribute("aria-describedby", description.id);
      const levels = el("div", undefined, "research-level-value");
      levels.append(input, el("span", "/ " + r.levels)); level.append(levels);
      const cost = el("td", undefined, "research-cost"); cost.id = "cost-" + r.id;
      const total = el("td", undefined, "research-cost"); total.id = "max-cost-" + r.id;
      row.append(name, level, cost, total); body.append(row);
    }
    table.append(head, body); section.append(table); host.append(section);
  }
  updateResearchSummaries();
}
function updateResearchSummaries() {
  for (const section of document.querySelectorAll(".research-tier")) {
    const items = D.research.filter(r => String(r.tier) === section.dataset.tier);
    const values = items.map(r => Number($("research-" + r.id).value));
    const valid = values.every((n, i) => $("research-" + items[i].id).value.trim() !== "" && Number.isInteger(n) && n >= 0 && n <= items[i].levels);
    const maxed = valid && values.every((n, i) => n === items[i].levels);
    section.querySelector(".research-tier-totals").textContent = valid ? values.reduce((a, b) => a + b, 0) + " / " + items.reduce((sum, r) => sum + r.levels, 0) + " levels" : "Check levels";
    section.querySelector(".research-tier-label").textContent = "Tier " + section.dataset.tier + (maxed ? " (Maxed)" : "");
    section.classList.toggle("maxed", maxed);
  }
}
function filterResearch() {
  const query = $("research-filter").value.trim().toLowerCase();
  let count = 0;
  for (const section of document.querySelectorAll(".research-tier")) {
    let matches = 0;
    for (const row of section.querySelectorAll("tbody tr")) { row.hidden = !row.dataset.search.includes(query); if (!row.hidden) matches++; }
    count += matches;
    section.hidden = matches === 0;
    if (query) {
      if (section.dataset.beforeSearch === undefined) section.dataset.beforeSearch = String(section.open);
      section.open = matches > 0;
    } else if (section.dataset.beforeSearch !== undefined) {
      section.open = section.dataset.beforeSearch === "true";
      delete section.dataset.beforeSearch;
    }
  }
  $("research-count").textContent = query ? count + " of " + D.research.length + " research items" : D.research.length + " research items";
  $("research-empty").hidden = count !== 0;
  $("clear-research-filter").hidden = !query;
}
$("research-filter").oninput = filterResearch;
$("clear-research-filter").onclick = () => { $("research-filter").value = ""; filterResearch(); $("research-filter").focus(); };
$("optimize").onclick = () => {
  const next = {account:"farm", farm:"planning"}[document.querySelector("[data-tab].active")?.dataset.tab];
  if (next) tab(next, true);
  else optimize();
};
$("review-farm").onclick = () => tab("farm", true);
$("stop").onclick = () => {
  worker?.postMessage({ cancel: true });
  $("stop").disabled = true;
  $("stop").textContent = "Finishing Best Plan\u2026";
};
document.querySelectorAll("[data-tab]").forEach((b) => b.onclick = (event) => tab(b.dataset.tab, event.detail === 0));
$("review-inputs").onclick = reviewInputs;
// Keep fixed controls from hiding focused fields at narrow widths or zoom.
const runBar = document.querySelector(".run-bar");
function keepFocusedControlVisible(target = document.activeElement) {
  if (!target?.matches("input,select,button,summary,a") || runBar.contains(target) || target.closest("dialog[open]") || !target.getClientRects().length) return;
  // The desktop sidebar scrolls independently and does not overlap the run bar.
  if (innerWidth > 800 && target.closest("aside")) return;
  const rect = target.getBoundingClientRect(), bar = runBar.getBoundingClientRect();
  if (rect.bottom > bar.top - 12) window.scrollBy({top:rect.bottom - bar.top + 24,behavior:"instant"});
  else if (rect.top < 12) window.scrollBy({top:rect.top - 24,behavior:"instant"});
}
function sizeRunBar() {
  document.documentElement.style.setProperty("--run-bar-height", Math.ceil(runBar.getBoundingClientRect().height) + "px");
  requestAnimationFrame(() => keepFocusedControlVisible());
}
if (typeof ResizeObserver !== "undefined") new ResizeObserver(sizeRunBar).observe(runBar);
window.addEventListener("resize", sizeRunBar);
SelectionReadout.observe($("main-content"));
document.addEventListener("focusin", ({target}) => { NumericInput.focus(target); keepFocusedControlVisible(target); });
document.addEventListener("focusout", ({target}) => NumericInput.blur(target));
document.addEventListener("change", (e) => {
  FarmIcons.updatePicker(e.target);
  ShipIcons.update(e.target);
  if (e.target.matches("select")) SelectionReadout.refresh();
  const id = e.target.id;
  if (id === "autoTeAllocation") updatePlanControls();
  const editingKey = Object.keys(editingGroups).find(key => editingGroups[key].toggles.includes(id));
  if (editingKey) {
    $(editingKey).checked = e.target.checked;
    config.farm[editingKey] = e.target.checked;
    if (resultConfig) resultConfig.farm[editingKey] = e.target.checked;
    updateAccountEditing();
    updateArtifactNotes();
    if (editingKey === "manualFarmData" && !e.target.checked && Array.isArray(config.farm.artifactInventory)) {
      const previous = ArtifactSets.signature(config.farm.loadouts);
      refresh();
      if (previous !== ArtifactSets.signature(config.farm.loadouts)) markInputsChanged();
    }
    if (editingKey === "manualFarmData" && e.target.checked) $("starting-gear-controls").hidden = true;
    return;
  }
  if (id === "tankCapacity") NumericInput.write($("tankOutput"), Ships.rateFor(Number(e.target.value)));
  if (id.startsWith("col-egg-")) {
    const egg = D.customEggs.find((x) => x.identifier === id.slice(8));
    delete config.farm.colleggtibleOverrides?.[C.dimension[egg.buffs[0].dimension]];
  }
  if (id === "strategy") {
    updateSequenceVisibility();
    markInputsChanged();
    if (refresh()) show(dirty ? "Planning strategy changed. Re-run the planner to update the timeline." : "Planning strategy updated.");
    if (e.target.value === "user") $("sequence").focus();
  }
  if (id.startsWith("artifact-")) {
    const [, key, i] = id.split("-");
    renderStones(key, Number(i));
  }
  if (id.startsWith("stone-")) {
    const [, key, i] = id.split("-");
    updateLoadoutCard(key, Number(i));
  }
  if (id === "proPermit") {
    try {
      config = gather();
      renderLoadouts();
    } catch {
      renderLoadouts();
    }
  }
});
document.addEventListener("input", (e) => {
  if (!e.target.matches("input,select") || unsavedInputs.has(e.target.id) || e.target.closest("#gear-picker,#date-picker")) return;
  if (Object.values(editingGroups).some(group => group.toggles.includes(e.target.id))) return;
  const group = e.target.closest("#account-basic-fields") ? "account"
    : e.target.closest("#account-progress-fields") ? "progress"
    : e.target.closest("#account-fuel-fields") ? "fuel"
    : e.target.closest("#col-fields") ? "colleggtibles"
    : e.target.closest("#epic-fields") ? "epic"
    : e.target.closest("#farm-basic-fields,#hab-fields,#vehicle-fields,#research-fields,#current-loadout-fields,#starting-set-fields") ? "farm" : null;
  if (group) (config.uiProvenance ||= {})[group] = "manual";
  if (e.target.id === "target") delete config.plan.targetMode;
  NumericInput.edited(e.target);
  markInputsChanged();
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    const hadIssue = !$("planning-guidance").hidden;
    if (refresh()) {
      if (dirty) show("Inputs changed. Re-run the planner to update the timeline.");
      else if (hadIssue) show("Inputs updated. Ready to plan.");
    }
  }, 300);
});
FarmIcons.configure((kind,slot) => {
  try {
    const {s,c} = S.prepare(gather());
    return item => {
      const preview = PhysicalPreview.describe(s,c,kind,slot,item.id);
      return Units.lines((kind === "hab" ? compactNumber(preview.capacity) : num(preview.capacity))+(kind === "hab" ? " cap" : "/hr")+(item.id === 11 && kind === "vehicle" ? " · "+preview.cars+" car"+(preview.cars === 1 ? "" : "s") : ""),Units.amount("gem",num(preview.cost)),purchaseTime(preview.seconds));
    };
  } catch { return () => "Complete farm and planning inputs to see estimates"; }
});
DatePicker.bind($("start"));
EggIcons.decorateStatic();
$("eventTimezone").replaceChildren(...Zones.choices().map(zone=>option(zone,zone === Zones.automatic ? "Automatic" : Zones.label(zone))));
renderForm();
try {
  savedEid = localStorage.getItem(EID_KEY) || "";
  savedEidName = localStorage.getItem(EID_NAME_KEY) || "";
} catch { }
showEidIdentity();
tab("account");
sizeRunBar();
show("Enter your Egg Inc. ID and press Enter, or enable manual editing, before planning.");
AppUpdates.initialize({
  isBusy: () => !!worker || !!importingBackup,
  capture: () => {
    let saved;
    try { saved = gather(); }
    catch { saved = {...structuredClone(config), draftInputs:captureDraftInputs()}; }
    return {version:1,savedAt:Date.now()/1000,config:saved,result,resultConfig,dirty,interrupted:!!worker,tab:document.querySelector("[data-tab].active").dataset.tab,loadoutTab:activeLoadoutTab};
  },
  restore: restoreUpdateSnapshot
});
globalThis.VirtueApp = { S, O, I, A, selectLoadout, getConfig: () => gather(), getResult: () => result, condensedActions, summarize: U.summarize, loadFile, refresh, tab };
