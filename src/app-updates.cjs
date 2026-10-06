'use strict';
const VERSION = require('./version.cjs');
const Recovery = require('./session-recovery.cjs');
const HANDOFF = 'virtue-optimizer.update-session.v1';
const LAST_ERROR = 'virtue-optimizer.update-error.v1';
function initialize({isBusy, capture, restore}) {
  const $ = id => document.getElementById(id);
  const dialog = $('update-dialog'), status = $('update-status'), install = $('update-install'), check = $('update-check');
  let release = null, updating = false, checking = false;
  let lastError = '';
  try { lastError = localStorage.getItem(LAST_ERROR) || ''; } catch { }
  const local = location.protocol === 'http:' && location.hostname === '127.0.0.1' && Number(location.port) >= 8765 && Number(location.port) <= 8790 && !!globalThis.VIRTUE_PROXY_TOKEN;
  function errorDetails() {
    $('update-error').hidden = !lastError;
    $('update-error-text').textContent = lastError;
  }
  const message = (text, error = false) => {
    status.textContent = text; status.classList.toggle('error', error);
    status.setAttribute('role', error ? 'alert' : 'status');
    status.setAttribute('aria-live', error ? 'assertive' : 'polite');
    if (error) {
      lastError = text;
      try { localStorage.setItem(LAST_ERROR, text); } catch { }
      errorDetails();
    }
  };
  function clearError() { lastError = ''; try { localStorage.removeItem(LAST_ERROR); } catch { } errorDetails(); }
  function controls() {
    check.disabled = checking || updating || !local;
    install.disabled = !release || checking || updating || isBusy();
    $('update-configure').disabled = checking || updating || !local;
    $('update-repository').disabled = checking || updating || !local;
    $('update-close').disabled = updating;
    dialog.setAttribute('aria-busy', String(checking || updating));
  }
  async function api(route, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), route === 'check' ? 155000 : 15000);
    try {
      const response = await fetch('/api/update/' + route, {
        cache:'no-store', signal:controller.signal,
        ...(body === undefined ? {} : {method:'POST', headers:{'Content-Type':'application/json','X-Virtue-Token':globalThis.VIRTUE_PROXY_TOKEN},body:JSON.stringify(body)})
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'The app update request failed.');
      return data;
    } finally { clearTimeout(timer); }
  }
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function checkRelease() {
    if (!local || checking || updating) return;
    release = null; checking = true; controls();
    message('Checking for a new release...');
    $('update-notes').hidden = true;
    try {
      const state = await api('status');
      $('update-repository').value = state.repository || '';
      $('update-source').open = !state.configured;
      if (!state.configured) { message('Connect the app to its public GitHub release repository below. This is a one-time setup.'); return; }
      const found = await api('check', {});
      if (found.available) {
        release = found;
        message('v' + found.version + ' is available. Your current version is v' + VERSION + '.');
        $('update-notes').textContent = found.notes || 'A new app release is ready.';
        $('update-notes').hidden = false;
        if (isBusy()) message('v' + found.version + ' is available. Finish or stop your search or account import before updating.');
      } else message('You’re up to date: v' + VERSION + '.');
    } catch (error) { message('Could not check for updates. Check your connection and release repository, then try again. ' + error.message, true); }
    finally { checking = false; controls(); }
  }
  $('update-app').onclick = () => {
    dialog.showModal();
    controls();
    if (!local) message('Launch Start-Virtue-Optimizer.cmd to use Update App. Your offline farm files can still be loaded there.');
    else checkRelease();
  };
  $('update-close').onclick = () => { dialog.close(); if (local) api('acknowledge', {}).catch(() => {}); };
  dialog.addEventListener('cancel', event => { if (updating) event.preventDefault(); });
  check.onclick = () => { clearError(); checkRelease(); };
  $('update-copy-error').onclick = async () => {
    try { await navigator.clipboard.writeText(lastError); message('Error copied.'); }
    catch { message('Select the error details below and copy them.'); }
  };
  $('update-configure').onclick = async () => {
    if (checking || updating) return;
    checking = true; controls();
    try {
      await api('configure', {repository:$('update-repository').value.trim()});
      checking = false;
      await checkRelease();
    } catch (error) { message(error.message, true); }
    finally { checking = false; controls(); }
  };
  install.onclick = async () => {
    if (!release || updating || isBusy()) { message('Finish or stop your search or account import before updating.', true); return; }
    updating = true; controls();
    let restarting = false;
    try {
      await api('start', {version:release.version});
      const deadline = Date.now() + 180000;
      let ready = false;
      while (Date.now() < deadline) {
        const state = await api('status');
        message(state.job?.message || 'Preparing the update...');
        if (state.job?.state === 'failed') throw Error(state.job.message);
        if (state.job?.state === 'ready') { ready = true; break; }
        await pause(1000);
      }
      if (!ready) throw Error('The update download timed out. Your installed app is unchanged.');
      const saved = capture();
      if (!Recovery.valid(saved)) throw Error('The current session could not be preserved. Save your farm and plan before retrying.');
      try {
        localStorage.setItem(HANDOFF, JSON.stringify({version:VERSION,snapshot:Recovery.sanitize(saved)}));
      } catch { throw Error('Your browser cannot preserve this session for the restart. Save your farm and plan, then free some browser storage and retry.'); }
      message('Installing and restarting. Your farm and settings have been preserved...');
      // A connection interruption can occur after the helper accepts the restart.
      // Poll before deciding whether it failed, rather than submitting twice.
      try { await api('install', {}); restarting = true; }
      catch (error) {
        try { const state = await api('health'); if (!state.pending && state.job?.state !== 'complete' && state.job?.state !== 'failed') throw error; }
        catch (healthError) { if (healthError === error) throw error; }
        restarting = true;
      }
      const restartDeadline = Date.now() + 75000;
      while (Date.now() < restartDeadline) {
        try {
          const state = await api('health');
          if (!state.pending && (state.version !== VERSION || state.result || ['complete','failed'].includes(state.job?.state))) { location.reload(); return; }
        } catch { }
        await pause(1000);
      }
      throw Error('The restart is taking longer than expected. Close the launcher and open Start-Virtue-Optimizer.cmd again; your preserved session will be restored.');
    } catch (error) {
      if (!restarting) { try { localStorage.removeItem(HANDOFF); } catch { } }
      message(error.message, true);
      release = null;
    } finally { updating = false; controls(); }
  };
  controls();
  errorDetails();
  if (local) {
    (async () => {
      let state = await api('health');
      // A manual refresh can arrive while the replacement helper is starting.
      for (let attempt = 0; state.pending && attempt < 75; attempt++) { await pause(1000); state = await api('health'); }
      if (state.pending) return;
      let saved;
      try { saved = JSON.parse(localStorage.getItem(HANDOFF)); } catch { }
      if (saved && Recovery.valid(saved.snapshot)) {
        try { restore(saved.snapshot, state.result?.message || 'Your session was restored after updating the app.'); localStorage.removeItem(HANDOFF); }
        catch { message('Your preserved session is still available. Restart the app or load your saved farm.', true); }
      }
      if (state.result?.ok === false) {
        // Keep restart/rollback failures visible independently of farm notices.
        dialog.showModal(); message(state.result.message, true); controls();
      } else if (state.result) api('acknowledge', {}).catch(() => {});
    })().catch(() => {});
  }
  return {active:() => updating};
}
module.exports = {initialize, HANDOFF, LAST_ERROR};
