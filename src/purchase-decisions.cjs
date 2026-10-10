'use strict';
const S = require('./simulator.cjs');
const tiers = [...new Set(S.D.research.map(r => r.tier))];
const grows = (before, after) => after > before + Math.max(1, Math.abs(before)) * 1e-10;

// Presentation only. Reconstruct each purchase with its contemporary farm and
// gear; historical rate snapshots and saved explanations are never trusted.
function build(initial, c, actions) {
  let state = S.clone(initial);
  const purchases = [];
  for (const [index, action] of actions.entries()) {
    state.t = action.t;
    if (action.type === 'research') {
      const research = S.D.research[action.i], from = state.r[action.i];
      const to = action.to ?? from + 1, effects = [];
      if (!research || !Number.isInteger(to) || to <= from || to > research.levels)
        throw Error('Cannot explain an invalid research level range.');
      const later = actions.slice(index + 1);
      for (let level = from; level < to; level++) {
        const before = S.stats(state, c), locked = tiers.filter(t => !S.isUnlocked(state, S.D.research.findIndex(r => r.tier === t)));
        state = S.mutate(state, c, action);
        const after = S.stats(state, c);
        const unlocked = locked.filter(t => S.isUnlocked(state, S.D.research.findIndex(r => r.tier === t)));
        const prerequisite = locked.find(t => research.tier < t && later.some(a => a.type === 'research' && S.D.research[a.i].tier === t));
        const capacity = [];
        if (grows(before.slots, after.slots)) capacity.push({key:'slots', from:before.slots, to:after.slots,
          later:later.some(a => a.type === 'vehicle' && a.slot >= before.slots && a.slot < after.slots)});
        if (grows(before.trainLength, after.trainLength)) capacity.push({key:'train', from:before.trainLength, to:after.trainLength,
          later:later.some(a => a.type === 'car' && a.toCars > before.trainLength && a.toCars <= after.trainLength)});
        if (!grows(before.earning, after.earning)) {
          if (grows(before.laying, after.laying)) capacity.push({key:'laying'});
          if (grows(before.shipping, after.shipping)) capacity.push({key:'shipping'});
          if (research.id === 'wormhole_dampening' && !grows(before.hab, after.hab)) capacity.push({key:'portal', later:later.some(a => a.type === 'hab' && a.id >= 17)});
          if (['hover_upgrades','hyper_portalling'].includes(research.id) && !grows(before.shipping, after.shipping)) capacity.push({key:research.id, later:later.some(a => a.type === 'vehicle' && (research.id === 'hover_upgrades' ? a.id >= 9 : a.id === 11))});
          if (grows(before.eggValue, after.eggValue)) capacity.push({key:'value'});
        }
        effects.push({earning:grows(before.earning, after.earning), gain:before.earning > 0 ? after.earning / before.earning - 1 : null,
          unlocked, prerequisite, capacity});
      }
      purchases.push({index, i:action.i, from, to, effects});
    } else if (['shift','hab','vehicle','car','silo','set'].includes(action.type)) {
      state = S.mutate(state, c, action);
    }
    state.t = action.end ?? action.t;
  }
  return purchases;
}

function explain(purchases) {
  const effects = purchases.flatMap(p => p.effects);
  if (!effects.length) return null;
  const reasons = [], earning = effects.filter(e => e.earning), unlocked = [...new Set(effects.flatMap(e => e.unlocked))].sort((a,b) => a-b);
  if (earning.length) {
    const text = effects.length === 1
      ? 'Raises earnings now' + (earning[0].gain === null ? ' from zero.' : ' by ' + new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(earning[0].gain*100) + '%.')
      : 'Raises earnings immediately on ' + (earning.length === effects.length ? 'all ' + effects.length : earning.length + ' of ' + effects.length) + ' purchased levels.';
    reasons.push({kind:'earnings', text});
  } else reasons.push({kind:'current', text:'No immediate earnings gain.'});
  if (unlocked.length) reasons.push({kind:'tier', text:'Unlocks Tier' + (unlocked.length > 1 ? 's ' : ' ') + unlocked.join(', ') + '.'});
  const prerequisites = new Map();
  for (const e of effects) if (e.prerequisite && !unlocked.includes(e.prerequisite)) prerequisites.set(e.prerequisite, (prerequisites.get(e.prerequisite) || 0) + 1);
  if (prerequisites.size) {
    const count = [...prerequisites.values()].reduce((sum,n) => sum+n,0), needed = [...prerequisites.keys()].sort((a,b) => a-b);
    reasons.push({kind:'tier', text:'Adds ' + count + ' prerequisite level' + (count === 1 ? '' : 's') + ' toward Tier' + (needed.length === 1 ? ' ' : 's ') + needed.join(', ') + ' used later in this plan.'});
  }
  const capacity = new Map();
  for (const e of effects) for (const item of e.capacity) {
    const prev = capacity.get(item.key);
    capacity.set(item.key, {...item, added:(prev?.added || 0) + ((item.to ?? 0) - (item.from ?? 0)), from:prev?.from ?? item.from, later:prev?.later || item.later});
  }
  for (const [key, item] of capacity) {
    let text;
    if (key === 'slots') text = 'Adds ' + item.added + ' vehicle slot' + (item.added === 1 ? '' : 's') + (item.later ? ' for later Kindness purchases.' : '; existing vehicles are unchanged.');
    if (key === 'train') text = 'Raises maximum train length ' + item.from + ' → ' + item.to + (item.later ? ' for later Kindness car purchases.' : '; existing trains keep their current cars.');
    if (key === 'laying') text = 'Increases laying capacity on levels where shipping still limits earnings.';
    if (key === 'shipping') text = 'Increases shipping capacity on levels where laying still limits earnings.';
    if (key === 'value') text = 'Increases egg value on levels where delivery is still zero.';
    if (key === 'portal') text = item.later ? 'Prepares portal habitat capacity for later Integrity purchases.' : 'Improves portal habitat capacity; current habitats cannot use it.';
    if (key === 'hover_upgrades') text = item.later ? 'Prepares hover vehicle capacity for later Kindness purchases.' : 'Improves hover vehicle capacity; the current fleet cannot use it.';
    if (key === 'hyper_portalling') text = item.later ? 'Prepares Hyperloop capacity for later Kindness purchases.' : 'Improves Hyperloop capacity; the current fleet cannot use it.';
    reasons.push({kind:'capacity', text});
  }
  if (!earning.length && !unlocked.length && !prerequisites.size && !capacity.size)
    reasons.push({kind:'model', text:'Its effect does not increase earnings in the model, which assumes full habitats and no running chickens.'});
  return {reasons, text:reasons.map(r => r.text).join(' ')};
}
function range(purchases, i, from, to) {
  return explain(purchases.filter(p => p.i === i && p.from >= from && p.to <= to));
}
module.exports = {build, explain, range};
