'use strict';
const Snapshot = require('./update-snapshot.cjs');
const HANDOFF = 'virtue-optimizer.update-session.v1';
const DATABASE = 'virtue-optimizer.update-recovery.v1', STORE = 'session', KEY = 'pending';

// A saved plan can exceed localStorage's quota, especially with alternate
// routes and remaining-plan comparisons. IndexedDB stores the complete handoff
// in one transaction. Keep the old localStorage format as a fallback and accept
// handoffs written by earlier app versions.
function database(operation, value) {
  return new Promise((resolve, reject) => {
    let db, finished = false, transaction;
    const finish = (error, result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      db?.close();
      if (error) reject(error); else resolve(result);
    };
    const timer = setTimeout(() => {
      try { transaction?.abort(); } catch { }
      finish(Error('Session storage did not respond.'));
    }, 5000);
    let request;
    try { request = indexedDB.open(DATABASE, 1); }
    catch (error) { finish(error); return; }
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onerror = () => finish(request.error || Error('Session storage is unavailable.'));
    request.onblocked = () => finish(Error('Session storage is busy in another window.'));
    request.onsuccess = () => {
      db = request.result;
      if (finished) { db.close(); return; }
      db.onversionchange = () => db.close();
      try {
        transaction = db.transaction(STORE, operation === 'get' ? 'readonly' : 'readwrite');
        const store = transaction.objectStore(STORE);
        const record = operation === 'put' ? store.put(value, KEY) : operation === 'get' ? store.get(KEY) : store.delete(KEY);
        transaction.oncomplete = () => finish(null, record.result);
        transaction.onabort = transaction.onerror = () => finish(transaction.error || Error('Session storage could not finish saving.'));
      } catch (error) { finish(error); }
    };
  });
}
async function save(handoff) {
  // Resolve only after the write transaction commits, before allowing install.
  try { await database('put', handoff); }
  catch {
    const text = JSON.stringify(handoff);
    localStorage.setItem(HANDOFF, text);
    if (localStorage.getItem(HANDOFF) !== text) throw Error('Session storage did not retain the session.');
    return;
  }
  try { localStorage.removeItem(HANDOFF); } catch { }
}
async function load() {
  let legacy, saved;
  try { legacy = JSON.parse(localStorage.getItem(HANDOFF)); } catch { }
  try { saved = await database('get'); } catch { }
  return [saved, legacy].filter(value => Snapshot.valid(value?.snapshot))
    .sort((a, b) => b.snapshot.savedAt - a.snapshot.savedAt)[0];
}
async function clear() {
  try { localStorage.removeItem(HANDOFF); } catch { }
  try { await database('delete'); } catch { }
}
module.exports = {HANDOFF, save, load, clear};
