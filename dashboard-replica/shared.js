// ═══════════════════════════════════════════════════════════════════════
// shared.js — AssetAlign dashboard suite: state and behavior shared across
// three REAL, separately-loaded pages (Dashboard, Marketplace, and each
// partner detail page like marketplace/kevin/).
//
// 2026-09-04, per Alex: Marketplace used to be a display:none/block toggle
// inside the same single-page dashboard file — no real URL, no back button,
// still "on the same page" no matter how contained the styling looked. He
// wants the real thing: separate physical pages, a real <a href>, but a
// *smooth* handoff — so this file is the one place session state (name,
// credits, the goal picked during onboarding, etc.) actually lives, backed
// by sessionStorage so it survives a real page navigation within one
// browser tab. Every page loads this before its own inline script and
// calls aaResolveSession() once at the top.
//
// This is deliberately NOT split further (a bundler, per-feature modules,
// etc.) — three plain <script src> pages is the whole point: "as close to
// copy-paste into production as possible," runnable and editable by Alex
// alone with no build step, the same philosophy as every other site in
// this workspace.
// ═══════════════════════════════════════════════════════════════════════

const AA_SESSION_KEY = 'aa_session';

// SKUNKWORKS -- 2026-09-13, per Alex: "i want to start a side route where i
// can actually start to use this as my financial decision making engine..
// once i fill in the information i can favorite it and have everything
// save so i can start to put myself in the position of the people." Every
// other visit to this suite is the shared-demo case this file's own header
// note describes -- deliberately reset on every reload since multiple
// people reuse the same link. This is the opposite case: one person's own
// real, ongoing data. `?alex=1` (set once, from onboarding-replica's own
// aaIsPersistentMode() or directly on a dashboard-replica link) flips this
// localStorage flag permanently, so it "sticks" across visits without the
// query param again. When it's on, aaLoadSession()/aaSaveSession() read
// and write localStorage (survives closing the tab/browser) instead of
// sessionStorage, and aaResetSessionOnReload() no longer wipes it on
// refresh -- the entire point of a real, ongoing session.
const AA_PERSISTENT_MODE_KEY = 'aa_persistent_mode';
const AA_PERSISTENT_SESSION_KEY = 'aa_persistent_session';
function aaIsPersistentMode() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('alex') === '1') localStorage.setItem(AA_PERSISTENT_MODE_KEY, '1');
    return localStorage.getItem(AA_PERSISTENT_MODE_KEY) === '1';
  } catch (e) { return false; }
}

// 2026-09-04, per Alex: "multiple people will be using this link.. i think
// everytime its closed or someone refreshes it should re start." Closing
// the tab already resets everything for free — sessionStorage is
// per-tab, wiped by the browser the moment the tab closes, and a brand
// new tab opening the same link never sees another tab's data. Refreshing
// is the one case that didn't reset (sessionStorage's whole point is
// surviving a reload) — this fixes just that, without breaking the
// "smooth handoff" clicking between Dashboard/Marketplace/a partner page
// is specifically built to preserve (see this file's header note): the
// Performance Navigation Timing API can tell a real reload apart from a
// normal link click, even though both are full page loads with no shared
// in-page JS state. Runs once, before anything else reads the session.
// 2026-09-09 — real gap found during a "does every button actually work"
// pass, per Alex: Logout was a bare href="#" with no onclick anywhere in
// this suite — clicking it did nothing at all. There's no real auth system
// to log out of here (see assetalign-tech-faq's own "no real auth anywhere"
// note) — the honest equivalent, given the only real state that exists is
// this session's own sessionStorage, is to actually clear it and land back
// on a fresh, anonymous dashboard. Same real effect a genuine logout would
// have, not a fake confirmation. Navigates to the bare pathname (no query
// string) so a cleared session doesn't immediately get repopulated from
// old URL params still sitting in the address bar.
const AA_SIGNED_OUT_KEY = 'aa_signed_out';
// SKUNKWORKS -- real fix, 2026-09-13, per Alex: "when someone logs them
// out, it should bring them to a screen that says they successfully
// logged out," then, once that worked: "i think the goal is i kind of
// have full functionality.. so it should allow me to log back in.. so i
// can start to simulate what a month or so looks like." Real logout
// isn't the same thing as deleting an account -- this used to actually
// erase aa_persistent_session, so there was no way back to the same
// profile/favorites/progress once "logged out," which defeats the whole
// point of a persistent instance meant to be used repeatedly over time.
// In persistent mode, logout now only sets a signed-out FLAG and leaves
// the real data untouched; aaLogBackIn() clears that flag and returns to
// the same account exactly as it was. A shared/normal demo session has
// no real account to log back into, so that path keeps its original,
// actually-destructive behavior (sessionStorage genuinely cleared) --
// unaffected by any of this.
function aaLogout() {
  try {
    if (aaIsPersistentMode()) localStorage.setItem(AA_SIGNED_OUT_KEY, '1');
    else sessionStorage.removeItem(AA_SESSION_KEY);
  } catch (e) {}
  // SKUNKWORKS -- real fix, 2026-09-13, per Alex, still seeing the old
  // "Welcome, Jordan" behavior even after a hard refresh: a hard refresh
  // only forces freshness for the page it's performed ON, not for
  // wherever a script-driven location.href navigation goes next -- and
  // this exact URL (?logged_out=1, always the same string) is exactly
  // the kind of thing a browser or GitHub Pages' CDN can serve a cached
  // copy of once it's been hit before. Date.now() makes every logout hit
  // a URL that has never been requested before, so nothing anywhere can
  // possibly have a stale cached response for it.
  window.location.href = window.location.pathname + '?logged_out=' + Date.now();
}
// The real "log back in" -- only meaningful in persistent mode (a normal
// shared-demo session has nothing left to return to once logged out).
// Clears the signed-out flag and reloads; the dashboard's own guard (see
// its dev note near applyPersonalization()) then sees a normal, still-
// intact persistent session and personalizes exactly as before logout.
function aaLogBackIn() {
  try { localStorage.removeItem(AA_SIGNED_OUT_KEY); } catch (e) {}
  window.location.href = window.location.pathname + '?t=' + Date.now();
}
// The actual destructive action -- real account deletion, kept as a
// clearly separate, secondary choice (see aaShowLoggedOutScreen()) so it
// can never be reached by the same click that a real "log back in" is.
function aaStartOverFresh() {
  try {
    localStorage.removeItem(AA_SIGNED_OUT_KEY);
    localStorage.removeItem(AA_PERSISTENT_SESSION_KEY);
  } catch (e) {}
  const base = aaIsPersistentMode() ? '../onboarding-replica/?alex=1' : '../onboarding-replica/';
  window.location.href = base + (base.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();
}
// Reusable, same injected-overlay pattern as aaInjectDemoStop()/
// aaShowDemoStop() above. Persistent mode gets two real, visually distinct
// choices (a primary "Log back in," a muted secondary "start over as
// someone new" that's the only path that actually deletes data); a normal
// shared-demo session has nothing to log back into, so it only ever
// offers the restart link.
function aaShowLoggedOutScreen() {
  const existing = document.getElementById('aaLoggedOutModal');
  if (existing) { existing.classList.add('show'); aaLockBodyScroll(); return; }
  const modal = document.createElement('div');
  modal.className = 'disclosure-overlay';
  modal.id = 'aaLoggedOutModal';
  const actionsHtml = aaIsPersistentMode()
    ? '<button class="btn-run-quotes" style="width:100%;margin-bottom:14px;" onclick="aaLogBackIn()">Log back in →</button>' +
      '<a href="#" onclick="event.preventDefault(); aaStartOverFresh();" style="font-size:12px;color:var(--muted,#999);">Start over as someone new instead</a>'
    : '<button class="btn-run-quotes" style="width:100%;" onclick="aaStartOverFresh()">Start again →</button>';
  const bodyText = aaIsPersistentMode()
    ? 'Your profile, favorites, and progress are still saved on this browser.'
    : 'Your session data has been cleared from this browser.';
  modal.innerHTML = '<div class="disclosure-box" style="max-width:400px;height:auto;">' +
    '<div class="disclosure-body" style="padding:36px 28px;text-align:center;">' +
    '<div style="font-size:32px;margin-bottom:10px;">✓</div>' +
    '<div style="font-size:16px;font-weight:700;color:var(--navy,#0d1f33);margin-bottom:8px;">You’ve been logged out.</div>' +
    '<div style="font-size:13px;color:var(--muted,#666);line-height:1.6;margin-bottom:22px;">' + bodyText + '</div>' +
    actionsHtml +
    '</div></div>';
  document.body.appendChild(modal);
  modal.classList.add('show');
  aaLockBodyScroll();
}
function aaResetSessionOnReload() {
  // Persistent mode (see AA_PERSISTENT_MODE_KEY's own dev note above) is
  // real, ongoing data for one specific person -- a refresh should never
  // wipe it, which is the whole point of it existing.
  if (aaIsPersistentMode()) return;
  try {
    const entries = performance.getEntriesByType('navigation');
    const isReload = entries.length
      ? entries[0].type === 'reload'
      : (performance.navigation && performance.navigation.type === performance.navigation.TYPE_RELOAD);
    if (isReload) sessionStorage.removeItem(AA_SESSION_KEY);
  } catch (e) {}
}
aaResetSessionOnReload();

function aaLoadSession() {
  try {
    if (aaIsPersistentMode()) return JSON.parse(localStorage.getItem(AA_PERSISTENT_SESSION_KEY)) || {};
    return JSON.parse(sessionStorage.getItem(AA_SESSION_KEY)) || {};
  } catch (e) { return {}; }
}
// 2026-09-07, per Alex: "why didn't the email populate?" — root cause:
// Marketplace (and Vault) are real, separately-hosted pages — reached
// via assetalign-combined-flow.netlify.app they're a DIFFERENT origin, so
// sessionStorage never carries across that jump. Every "go to
// Marketplace/Vault" link was a bare relative path with no session data
// attached, so the destination always started from scratch — this
// affected every field (name, goal, credits, age, marital), not just
// email; email was just the one Alex happened to test. Use this instead
// of a bare window.location.href string wherever a page links to
// marketplace/ or vault/ — appends the current session's real fields as
// URL params (same fields aaResolveSession() already knows to read on the
// other end), same as a personalized test link already does. Works
// whether `path` is still relative ('marketplace/') or merge_flow.js has
// already rewritten it to an absolute URL — treated as an opaque string
// either way, and existing query params (e.g. 'marketplace/?dept=estate')
// are preserved rather than overwritten.
function aaExternalHref(path) {
  const session = aaLoadSession();
  const qIndex = path.indexOf('?');
  const base = qIndex === -1 ? path : path.slice(0, qIndex);
  const params = qIndex === -1 ? new URLSearchParams() : new URLSearchParams(path.slice(qIndex + 1));
  ['name', 'goal', 'state', 'age', 'marital', 'email', 'credits'].forEach(function (k) {
    if (session[k] !== undefined && session[k] !== null && session[k] !== '' && !params.has(k)) {
      params.set(k, session[k]);
    }
  });
  const qs = params.toString();
  return base + (qs ? '?' + qs : '');
}
function aaSaveSession(patch) {
  const merged = Object.assign(aaLoadSession(), patch);
  try {
    if (aaIsPersistentMode()) localStorage.setItem(AA_PERSISTENT_SESSION_KEY, JSON.stringify(merged));
    else sessionStorage.setItem(AA_SESSION_KEY, JSON.stringify(merged));
  } catch (e) {}
  return merged;
}

// ── FAVORITES -- 2026-09-13, part of the persistent "Alex's own real
// instance" mode above, but not actually gated on it: favoriting works the
// same way (stored on the session object, same as any other field) whether
// a given visit is persistent or the normal shared-demo session -- it just
// won't survive a demo reload, same as everything else in a normal
// session. `id` is a stable per-partner string (e.g. 'kevin', 'zebra',
// 'goodtrust') -- same ids already used as this suite's session-field/
// PURCHASE_PRODUCTS keys where those exist, invented plainly where they
// don't (e.g. a directory-listed advisor has no PURCHASE_PRODUCTS entry).
function aaToggleFavorite(id) {
  const session = aaLoadSession();
  const favorites = Array.isArray(session.favorites) ? session.favorites.slice() : [];
  const idx = favorites.indexOf(id);
  if (idx === -1) favorites.push(id); else favorites.splice(idx, 1);
  aaSaveSession({ favorites: favorites });
  return favorites.indexOf(id) !== -1;
}
function aaIsFavorited(id) {
  const session = aaLoadSession();
  return Array.isArray(session.favorites) && session.favorites.indexOf(id) !== -1;
}
// Heart glyph, not the star already used everywhere else in this suite for
// "Overall Pick"/quality ranking (Kevin's row, the Marketplace ribbon) --
// a different symbol keeps "our recommendation" and "your own favorite"
// from reading as the same thing on a card that shows both.
function aaPaintFavoriteButton(btn, isFav) {
  btn.textContent = isFav ? '♥' : '♡';
  btn.classList.toggle('is-favorited', isFav);
  btn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
}
function aaHandleFavoriteClick(btn, id) {
  const isFav = aaToggleFavorite(id);
  aaPaintFavoriteButton(btn, isFav);
}
// Call once at page load (after the button markup exists) so hearts
// reflect whatever's already saved, same pattern as aaPaintNav/setLiveCredits.
function aaInitFavoriteButtons() {
  document.querySelectorAll('[data-favorite-id]').forEach(function (btn) {
    aaPaintFavoriteButton(btn, aaIsFavorited(btn.getAttribute('data-favorite-id')));
  });
}

// Call once at the top of every page. URL params (the real handoff from
// onboarding's goToDashboard(), or any link that carries them) always win
// and get written back to the session; anything NOT in the URL falls back
// to whatever the session already has, so a later real navigation that
// carries no params at all (Dashboard -> Marketplace, a plain <a href>)
// still picks up name/credits/goal correctly instead of resetting to
// defaults. goalKnown tracks whether a real ?goal= was EVER supplied this
// session (not just "is goal set" — it's always set, defaulting to 'home')
// since the Marketplace auto-highlight needs that real/defaulted distinction.
function aaResolveSession() {
  const params = new URLSearchParams(window.location.search);
  const patch = {};
  // 'email' added 2026-09-07 for the real Nudge Cadence enrollment (see
  // assetalign-nudge-cadence-engine) — the personalized test links already
  // carry ?email= (onboarding's goToDashboard() doesn't forward it
  // automatically, but a direct link with the param, like Alex's/Keiron's
  // own combined-flow links, is picked up here same as every other field).
  // 'independent' added 2026-09-09 for the "Give the Gift" invite flow —
  // set by onboarding's goToDashboard() when the visitor came through the
  // ?gift=1 path (no employer relationship at all), so the dashboard can
  // avoid the one tutorial line that otherwise wrongly credits "your
  // employer" — see the dev note where that line gets read below.
  // 'meeting_date'/'meeting_time'/'advisor_location'/'employer_name' added
  // 2026-09-09 for a persistent "Your Advisor" rail that was tried and then
  // removed the same day for being too much on the screen (see this file's
  // own removed-outright dev note, where aaRenderAdvisorRail() used to be).
  // Left in the passthrough list since they're harmless real data forwarded
  // by onboarding's goToDashboard() — meeting_date/meeting_time still feed
  // the Dashboard's own pre-existing "Your Advisor" card stats (a separate,
  // still-live fix, see index.html's #advisorSessionsCount dev note);
  // advisor_location/employer_name have no reader left, but keeping them
  // costs nothing.
  // 2026-09-09 — Financial Passport schema expansion: these carry the S9
  // answers and Finch fields that used to be asked and then discarded (see
  // PASSPORT_FIELD_LABELS' own dev note above for the full list of what
  // used to get thrown away and where each of these comes from).
  // 'advisor_skipped' added 2026-09-11 for the real advisor off-ramp (see
  // onboarding-replica's skipAdvisorForNow()) — the one explicit signal
  // that no advisor was matched on purpose, as opposed to a bare dashboard
  // visit with no onboarding handoff at all (which still gets the
  // advisor_name/advisor_creds defaults below, same as before).
  ['goal', 'name', 'state', 'age', 'marital', 'balance', 'email', 'advisor_name', 'advisor_creds', 'advisor_location', 'employer_name', 'meeting_date', 'meeting_time', 'independent', 'advisor_skipped',
   'income', 'ownHome', 'emergencyFund', 'retireContrib', 'balance401k', 'balanceIRA', 'balanceSavings', 'riskTolerance', 'involvement', 'yearsAtCompany', 'retirementPlanEnrolled'].forEach(function (k) {
    const v = params.get(k);
    if (v !== null) patch[k] = v;
  });
  // 2026-09-07, per Alex — real bug: visiting a real marketplace/dashboard
  // page directly with the SAME ?first_name=&last_name= query string his
  // own personalized links already use (onboarding's convention) showed
  // "Jordan" instead of "Alex" — this only ever read ?name=. Falls back to
  // first_name whenever a real ?name= isn't set, so either link
  // convention resolves to the same real name. Just the first name (not
  // "First Last") to match how every "Hi {name}" spot already displays it.
  if (patch.name === undefined) {
    const firstName = params.get('first_name');
    if (firstName) patch.name = firstName;
  }
  const creditsParam = parseInt(params.get('credits'), 10);
  if (!isNaN(creditsParam)) patch.credits = creditsParam;
  if (params.get('goal') !== null) patch.goalKnown = true;
  let session = aaSaveSession(patch);
  // 2026-09-04 — real bug, caught while building the auto-populated
  // contact email: these defaults used to only exist on the local
  // `session` object this function returns, never written back to
  // sessionStorage. Every call site that got its session THROUGH this
  // function (aaPaintNav, etc.) looked fine, but anything calling
  // aaLoadSession() directly afterward (aaBuildMailto's mailto: body, for
  // one) saw the raw, still-undefined values underneath — "Jordan"/the
  // goal never showed up in the email. Persisting the defaults here fixes
  // it for every current and future direct aaLoadSession() caller, not
  // just this one.
  const defaults = {};
  if (session.name === undefined) defaults.name = 'Jordan';
  if (session.credits === undefined) defaults.credits = 25;
  if (session.goalKnown === undefined) defaults.goalKnown = false;
  if (!session.goal) defaults.goal = 'home';
  // 2026-09-08, real bug: the dashboard's "Your Advisor" card was hardcoded
  // to "Sarah Mitchell, CFP®" for every visitor, regardless of who they
  // actually got matched with — a name that doesn't even exist in
  // onboarding's real advisorArchive (Michael Torres/Jennifer Park/David
  // Kim/Sandra Liu), so it read as an orphaned leftover, not a real match.
  // goToDashboard() now forwards the real schedulingAdvisor's name/creds;
  // this default only covers a bare dashboard visit with no onboarding
  // handoff at all (e.g. testing the dashboard URL directly) — falls back
  // to advisorArchive[0] (Michael Torres), the same advisor onboarding's
  // own pickPrimaryAdvisor() defaults to with no in-person preference set.
  // 2026-09-11 — guarded against session.advisor_skipped: without this, a
  // real off-ramp visit (see onboarding-replica's skipAdvisorForNow(),
  // which deliberately never sends advisor_name/advisor_creds) would have
  // silently fallen through to this same "no handoff at all" default and
  // shown a fake matched advisor to someone who explicitly said they
  // weren't ready for one — exactly the dishonesty this whole feature
  // exists to avoid.
  if (session.advisor_name === undefined && !session.advisor_skipped) defaults.advisor_name = 'Michael Torres';
  if (session.advisor_creds === undefined && !session.advisor_skipped) defaults.advisor_creds = 'CFP®';
  if (Object.keys(defaults).length) session = aaSaveSession(defaults);
  return session;
}

// ── NAV — the name/initial in the top-right, identical markup on every
// page, so painting it is one shared call instead of three copies. ──
// 2026-09-09 — nav is a fixed 70px on desktop but wraps to two rows on
// mobile (see index.html's own --nav-h dev note) — anything positioned
// relative to nav's real height (the goal-checklist-strip, .mkt-dept-tiles)
// needs the ACTUAL rendered height, not a second hand-guessed number that
// could drift from the CSS. Measures the real element instead. Debounced
// via rAF so a flurry of resize events (e.g. an iOS address bar animating
// in/out while scrolling) doesn't spam style recalculation.
let aaNavHeightRaf = null;
function aaSyncNavHeight() {
  if (aaNavHeightRaf) return;
  aaNavHeightRaf = requestAnimationFrame(function () {
    aaNavHeightRaf = null;
    const navEl = document.querySelector('nav');
    if (navEl) document.documentElement.style.setProperty('--nav-h', navEl.getBoundingClientRect().height + 'px');
  });
}
window.addEventListener('resize', aaSyncNavHeight);
window.addEventListener('orientationchange', aaSyncNavHeight);

function aaPaintNav(session) {
  aaSyncNavHeight();
  const initial = (session.name || 'A').charAt(0).toUpperCase() || 'A';
  const nameEl = document.getElementById('navUserName');
  const avatarEl = document.getElementById('navAvatarInitial');
  if (nameEl) nameEl.textContent = session.name;
  if (avatarEl) avatarEl.textContent = initial;

  // 2026-09-09 — real bug, per Alex: "it says sarah... and then once we
  // get to marketplace it says jordan?? i don't get it." Root cause: the
  // top nav's Dashboard/Marketplace/Documents links have always been bare
  // hrefs with no session params. Invisible on the real standalone
  // dashboard-v2 site, since same-origin sessionStorage covers the gap —
  // but a real bug in assetalign-combined-flow, where merge_flow.js
  // rewrites these SAME links to point at the real, DIFFERENT-ORIGIN
  // dashboard-v2 site (different origin = no shared sessionStorage), so
  // clicking Marketplace/Documents/Dashboard from inside the merged demo
  // silently reset to the generic defaults ("Jordan") instead of carrying
  // the real name over. Fix: append the real session as URL params onto
  // whatever href is already there — works whether that base is a
  // same-origin relative path or merge_flow.js's rewritten absolute one,
  // since every page reads these back via aaResolveSession() regardless
  // of whether storage is actually shared. aaExternalHref() is idempotent
  // (skips params already present), so this is safe even if aaPaintNav()
  // is ever called more than once in a page's lifetime.
  // 'navLogo' added 2026-09-09 — the AssetAlign logo itself was a genuinely
  // dead href="#" link on every page except Vault (found during a "does
  // every button actually work" pass, per Alex). Now a real link back to
  // the dashboard everywhere, carrying session data the same as the other
  // nav links so clicking it doesn't reset the name/goal/credits shown.
  ['navDashboard', 'navExchange', 'navVault', 'navLogo'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.setAttribute('href', aaExternalHref(el.getAttribute('href')));
  });
}

// ── CREDITS — single source of truth for the balance shown in however
// many places a given page has (hero number, nav pill, Marketplace badge,
// a department's "use N credits" copy). Reads/writes the session, not a
// specific DOM element, so it works identically whether or not a page has
// a hero coin to animate (only the Dashboard does — the animation branch
// below just no-ops elsewhere since those elements don't exist there). ──
function setLiveCredits(total) {
  aaSaveSession({ credits: total });
  const navCredits = document.getElementById('navCreditsNum');
  if (navCredits) navCredits.textContent = total;
  const exCredits = document.getElementById('exCreditsNum');
  if (exCredits) exCredits.textContent = total;
  const spendLaneCredits = document.getElementById('spendLaneCredits');
  if (spendLaneCredits) spendLaneCredits.textContent = total;

  const heroNum = document.getElementById('liveCredits');
  const heroCoin = document.getElementById('liveCreditsCoin');
  if (heroNum && heroCoin) {
    setTimeout(function () {
      heroCoin.classList.remove('coin-flip');
      void heroCoin.offsetWidth;
      heroCoin.classList.add('coin-flip');
      setTimeout(function () { heroNum.textContent = total; }, 550);
    }, 1000);
  } else if (heroNum) {
    heroNum.textContent = total;
  }
}
function addLiveCredits(delta) {
  const session = aaLoadSession();
  const current = parseInt(session.credits, 10) || 0;
  const total = current + delta;
  setLiveCredits(total);
  if (delta > 0) showCreditToast(delta);
  return total;
}
function showCreditToast(delta) {
  const existing = document.getElementById('creditToast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'creditToast';
  toast.className = 'credit-toast show';
  toast.innerHTML = '<div class="credit-toast-coin">⬡</div><div class="credit-toast-label">+' + delta + '</div>';
  document.body.appendChild(toast);
  setTimeout(function () { toast.remove(); }, 2200);
}

// ── TOAST — plain status messages, unrelated to the credit-earned toast
// above. Every page includes the same #toast element in its markup. ──
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function () { toast.classList.remove('show'); }, 2800);
}

// ── BODY SCROLL LOCK — 2026-09-09, real bug per Alex testing live on his
// phone: every modal in this suite (disclosure gate, full disclosures,
// demo-stop, credits checkout) locked background scroll with a plain
// `document.body.style.overflow = 'hidden'`. That alone is a well-known
// unreliable pattern on iOS Safari specifically — it can leave the WHOLE
// page, including a modal's own internally-scrollable content, unable to
// receive touch-scroll at all, not just the background. The disclosure
// gate is where this actually surfaced (checking the box did nothing
// because the scroll-to-bottom requirement could never be satisfied — the
// text was un-scrollable), but the same broken lock was used everywhere
// else too. This is the standard, battle-tested fix: take the body OUT of
// normal flow with position:fixed (recording + restoring the real scroll
// position around it) instead of merely hiding overflow — every modal
// open/close call site below now goes through this pair instead of poking
// body.style.overflow directly.
let aaBodyScrollLockY = 0;
let aaBodyScrollLockCount = 0; // nested-modal safe: only the first lock/last unlock actually touches the body
function aaLockBodyScroll() {
  if (aaBodyScrollLockCount++ > 0) return;
  aaBodyScrollLockY = window.scrollY || window.pageYOffset || 0;
  document.body.style.position = 'fixed';
  document.body.style.top = '-' + aaBodyScrollLockY + 'px';
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.overflow = 'hidden';
}
function aaUnlockBodyScroll() {
  if (aaBodyScrollLockCount === 0 || --aaBodyScrollLockCount > 0) return;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.overflow = '';
  window.scrollTo(0, aaBodyScrollLockY);
}

// ── DISCLOSURE MODAL — per-browser (localStorage, not session-scoped) so
// it still only nags once per device regardless of which real page someone
// happens to land on first. Every page includes the same modal markup. ──
// 2026-09-06, per Alex, relaying Keiron's reaction to a screenshot of this
// modal: "I would have thought it would have a whole thing to scroll down
// like our competitors do." The content was already fully scrollable — the
// gap was that nothing actually REQUIRED reading it, so it read as a small,
// skippable dialog rather than a real disclosure document. Added a genuine
// scroll-to-bottom gate (same clickwrap pattern most real compensation
// disclosures use) on top of the existing checkbox — both are now required
// to enable Agree.
let disclosureScrolledToBottom = false;
function toggleAgreeBtn() {
  const check = document.getElementById('disclosureCheck');
  const btn = document.getElementById('btnAgree');
  if (check && btn) btn.disabled = !(check.checked && disclosureScrolledToBottom);
}
// 2026-09-09 — real bug, per Alex testing live on his phone: could check
// the box but "Agree" stayed grey, and the disclosure body wouldn't scroll
// at all when he tried to go back and finish reading it. Two real causes,
// both mobile-only (this never showed up in the desktop-browser testing
// this modal originally got):
//   1. .disclosure-body had no -webkit-overflow-scrolling/overscroll-
//      behavior — a well-known iOS Safari interaction where a `position:
//      fixed` overlay's own internally-scrollable child can stop responding
//      to touch-scroll entirely once the page body has overflow:hidden set
//      (aaShowDisclosureIfNeeded() sets exactly that to block background
//      scroll). Fixed on the CSS side (see .disclosure-body's own rule,
//      duplicated per page same as everywhere else in this suite).
//   2. Even where scrolling did work, a 12px "close enough to the bottom"
//      tolerance is tight on a phone — momentum/rubber-band scrolling and
//      subpixel/high-DPI rounding can leave a real device a few more
//      pixels short of the exact bottom than a mouse-wheel scroll on
//      desktop ever would. Widened to 32px, generous enough to absorb
//      that without meaningfully shortening how much someone has to
//      actually read (the gate's whole point, per Alex/Keiron's original
//      "make people actually scroll through it" ask).
const AA_DISCLOSURE_BOTTOM_TOLERANCE = 32;
// 2026-09-09 — real, tap-driven fallback added alongside the touch-scroll
// fixes above: this is a second, independent way to satisfy the same
// scroll-to-bottom requirement that doesn't depend on native touch-scroll
// gesture recognition working at all. If there's a third factor on a real
// device neither of the fixes above accounts for, this still gets someone
// through — it advances the same real scroll position `checkDisclosureScroll`
// already watches (via a native `scrollBy`, which fires real scroll events),
// so it isn't a bypass of the "actually read it" requirement — someone
// still has to tap through the same amount of content, just via a button
// instead of a finger-drag.
function aaScrollDisclosureDown() {
  const body = document.getElementById('disclosureBody');
  if (!body) return;
  // Plain, instant scrollTop math — deliberately NOT `behavior:'smooth'`.
  // This exists specifically as a guaranteed-to-work fallback for someone
  // whose device won't take a touch-scroll gesture at all; adding an
  // animation is one more thing that can fail to complete or feel laggy
  // on exactly the kind of device already having trouble here, for a
  // purely cosmetic benefit. Immediately fires checkDisclosureScroll()
  // itself too, rather than relying on the browser's own scroll event to
  // get around to firing — this button needs to feel instant.
  body.scrollTop = Math.min(body.scrollTop + body.clientHeight * 0.8, body.scrollHeight);
  checkDisclosureScroll();
}
function checkDisclosureScroll() {
  const body = document.getElementById('disclosureBody');
  const hint = document.getElementById('disclosureScrollHint');
  if (!body) return;
  const atBottom = body.scrollHeight - body.scrollTop - body.clientHeight < AA_DISCLOSURE_BOTTOM_TOLERANCE;
  if (atBottom && !disclosureScrolledToBottom) {
    disclosureScrolledToBottom = true;
    if (hint) hint.style.display = 'none';
    toggleAgreeBtn();
  }
}
function resetDisclosureScrollGate() {
  const body = document.getElementById('disclosureBody');
  const hint = document.getElementById('disclosureScrollHint');
  disclosureScrolledToBottom = !!(body && body.scrollHeight <= body.clientHeight + AA_DISCLOSURE_BOTTOM_TOLERANCE);
  if (hint) hint.style.display = disclosureScrolledToBottom ? 'none' : 'block';
  if (body) { body.scrollTop = 0; body.onscroll = checkDisclosureScroll; }
  toggleAgreeBtn();
}
function agreeDisclosure() {
  localStorage.setItem('aa_disclosed', '1');
  const modal = document.getElementById('disclosureModal');
  if (modal) modal.classList.remove('show');
  aaUnlockBodyScroll();
}
function declineDisclosure() {
  const modal = document.getElementById('disclosureModal');
  if (modal) modal.classList.remove('show');
  const trail = document.getElementById('trailEndsOverlay');
  if (trail) trail.classList.add('show');
}
function goBackToDisclosure() {
  const trail = document.getElementById('trailEndsOverlay');
  if (trail) trail.classList.remove('show');
  const modal = document.getElementById('disclosureModal');
  if (modal) modal.classList.add('show');
  resetDisclosureScrollGate();
}
function aaShowDisclosureIfNeeded() {
  if (!localStorage.getItem('aa_disclosed')) {
    const modal = document.getElementById('disclosureModal');
    if (modal) modal.classList.add('show');
    aaLockBodyScroll();
    resetDisclosureScrollGate();
  }
}
// 2026-09-06, per Alex: "I don't really think we need to disclose the
// employer level stuff [in the mandatory gate] — I think that can be in
// our disclosures link... and it can be soft worded." The short gate
// (#disclosureModal, above) is what someone has to scroll through and
// agree to before scheduling with an advisor; it no longer covers employer/
// introducing-party compensation. The full picture — including that
// section — lives here instead, in a separate, non-blocking reference
// modal opened only from the persistent footer link. No checkbox, no
// scroll gate, no Agree/Decline: it's a "read anytime," not a consent gate.
function openFullDisclosures() {
  const modal = document.getElementById('fullDisclosuresModal');
  if (modal) modal.classList.add('show');
  aaLockBodyScroll();
}
function closeFullDisclosures() {
  const modal = document.getElementById('fullDisclosuresModal');
  if (modal) modal.classList.remove('show');
  aaUnlockBodyScroll();
}

// ═══════════════════════════════════════════════════════════════════════
// CREDITS CHECKOUT — drag-and-drop / click purchase flow.
// 2026-09-04, per Alex: "for things like MyGoodTrust.. thats more of a
// straightforward purchase where they can see how many credits they have
// and just click in drag them into the box... figure out what it costs to
// do lets say the simple will and have them purchase it, and then have our
// stripe process come up to add money." Real GoodTrust pricing pulled
// directly from the actual deal terms — Robyn Sechler (GoodTrust) / Eric
// Witkowski email thread, subject "AssetAlign", 2025-05-27/28 — not
// invented: $139 for year one, $39/year renewal after that, delivered as a
// one-time-use promo code redeemed on GoodTrust's own site (their real
// fulfillment model, not a made-up one). Eric's own idea in that same
// thread for the renewal — "tell the user 'hey, you've got points.. and
// for only 39 points you can renew'... an action on their accord, not
// automatic" — is exactly the mechanic built below, just finally shipped.
// Uses the "1 credit = $1" conversion already stated in the Credits Detail
// Modal's Spending Credits table — not a new rate invented for this.
// ═══════════════════════════════════════════════════════════════════════
const AA_CREDIT_VALUE_USD = 1;
const PURCHASE_PRODUCTS = {
  goodtrust: {
    key: 'goodtrust', title: 'Will & Trust Setup', partner: 'MyGoodTrust · Estate Planning', cost: 139,
    description: "Your first year of GoodTrust's will, trust, and beneficiary tools — legally binding, attorney-guided, valid in all 50 states.",
    sessionField: 'estatePlanningDone', successType: 'promo',
  },
  goodtrustRenewal: {
    key: 'goodtrustRenewal', title: 'GoodTrust Renewal — Year 2', partner: 'MyGoodTrust · Estate Planning', cost: 39,
    description: 'Keep your GoodTrust will and trust documents active for another year.',
    sessionField: 'estateRenewalDone', successType: 'promo',
  },
  // lifeinsurance entry removed 2026-09-06 along with the dashboard's
  // "Upcoming Payment" card (per Alex: "take out the life insurance
  // stuff. it makes no sense") — openCreditsCheckout('lifeinsurance') has
  // no remaining caller anywhere in the suite. session.lifeInsurancePaid
  // stays as a real, honestly-always-false field elsewhere (Vault mosaic,
  // Recent Activity, Credits History) — nothing reads it expecting it to
  // ever flip true anymore, same as Tax prep's existing pattern.
};
// 2026-09-04, per Alex, dropping the standalone "buy credits anytime"
// bundles: "i don't really see why people would purchase credits without
// it beng at the checkout counter." Real money only ever enters through
// an actual product's checkout now (the "pay the shortfall" card form
// already in openCreditsCheckout() below) — there's no separate top-up
// product/flow anymore. If that ever comes back, it was a PURCHASE_PRODUCTS
// entry with isTopup:true; see this file's history.

// 2026-09-09, per Alex: replace every "coming soon" toast with the same
// honest 🛑 "this is where it goes live" boundary already used for the real
// Zebra auto-insurance handoff (assetalign-dashboard-v2/index.html's own
// showDemoBoundary()) — his framing: "we don't want any coming soon or
// whatever. we want this to feel like we have a great live product." A
// "coming soon" label reads like an unfinished product; a clearly-labeled
// demo stop reads like a real, live product that this particular prototype
// just doesn't wire further past this point, which is the honest truth.
// Generic/reusable (unlike showDemoBoundary(), which is hardcoded to the
// Zebra nudge panel's own markup + Financial Passport tie-in) — takes
// whatever headline/body a given dead-end needs. Shared here (not
// duplicated per page) since every page that loads shared.js can now hit a
// dead end that needs this treatment.
function aaInjectDemoStop() {
  if (document.getElementById('aaDemoStopModal')) return;
  const modal = document.createElement('div');
  modal.className = 'disclosure-overlay';
  modal.id = 'aaDemoStopModal';
  modal.innerHTML = '<div class="disclosure-box" style="max-width:420px;height:auto;">' +
    '<div class="disclosure-body" style="padding:32px 28px;text-align:center;">' +
    '<div style="font-size:32px;margin-bottom:10px;">🛑</div>' +
    '<div style="font-size:16px;font-weight:700;color:var(--navy,#0d1f33);margin-bottom:8px;">This is where it goes live.</div>' +
    '<div id="aaDemoStopBody" style="font-size:13px;color:var(--muted,#666);line-height:1.6;margin-bottom:20px;"></div>' +
    '<button class="btn-run-quotes" style="width:100%;" onclick="aaCloseDemoStop()">Got it →</button>' +
    '</div></div>';
  document.body.appendChild(modal);
}
function aaShowDemoStop(message) {
  aaInjectDemoStop();
  document.getElementById('aaDemoStopBody').textContent = 'We stopped you here for the sake of this demo — ' + message;
  document.getElementById('aaDemoStopModal').classList.add('show');
  aaLockBodyScroll();
}
function aaCloseDemoStop() {
  const m = document.getElementById('aaDemoStopModal');
  if (m) m.classList.remove('show');
  aaUnlockBodyScroll();
}

// 2026-09-09 — REMOVED OUTRIGHT, per Alex, after trying it in three
// different spots the same day (a standalone floating card, then folded
// into #accountsShelf on the right, then into the left .earn-rail card
// below "Ways to Earn"/"Align Marketplace"): "i don't think it works
// because it's too much for the screen — take it out and put it back to
// the way it was." Was a persistent "Your Advisor" reminder (matched
// advisor + synced meeting date, or a re-engagement nudge if none was
// booked) meant to live on every page via aaRenderAdvisorRail(session,
// marketplaceAdvisorHref), called from each page's own init function.
// The underlying session fields it read (meeting_date, meeting_time,
// advisor_location, employer_name — forwarded by onboarding's
// goToDashboard()) were left in place since they're harmless unused data,
// not the thing that made the screen feel crowded; only the rendered UI
// and its call sites were pulled. If this comes back, see this file's own
// git/session history for the full three-attempt implementation rather
// than starting from scratch.

function aaInjectCreditsCheckout() {
  if (document.getElementById('creditsCheckoutModal')) return;
  const style = document.createElement('style');
  style.textContent = '.cc-drop-zone{transition:box-shadow .15s,border-color .15s,background .15s;}' +
    '.cc-drop-zone.drag-over{border-color:var(--yellow-dark,#b8860b) !important;box-shadow:0 0 0 3px rgba(244,211,94,0.35);background:var(--yellow-bg,#fdf6e3) !important;}' +
    'body.aa-dragging-credits .cc-drop-zone{outline:1.5px dashed var(--yellow-dark,#b8860b);outline-offset:3px;}' +
    '.points-pill[draggable="true"]{cursor:grab;}' +
    '.points-pill.aa-drag-source{opacity:.4;}' +
    '.cc-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border,#e5e5e5);font-size:13px;gap:12px;}' +
    '.cc-row:last-child{border-bottom:none;}' +
    '.cc-bundle{display:flex;align-items:center;justify-content:space-between;border:1.5px solid var(--border,#e5e5e5);border-radius:10px;padding:12px 16px;margin-bottom:8px;cursor:pointer;transition:border-color .15s;}' +
    '.cc-bundle:hover{border-color:var(--yellow-dark,#b8860b);background:var(--yellow-bg,#fdf6e3);}';
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.className = 'disclosure-overlay';
  modal.id = 'creditsCheckoutModal';
  modal.innerHTML = '<div class="disclosure-box" style="max-width:480px;">' +
    '<div class="disclosure-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">' +
    '<div><h2 id="ccTitle">Complete Your Purchase</h2><p id="ccPartner"></p></div>' +
    '<button class="btn-msg" onclick="closeCreditsCheckout()" style="flex-shrink:0;">✕ Close</button>' +
    '</div><div class="disclosure-body" id="ccBody"></div></div>';
  document.body.appendChild(modal);
}

let ccCurrentProduct = null;

function openCreditsCheckout(productKey) {
  aaInjectCreditsCheckout();
  const product = PURCHASE_PRODUCTS[productKey];
  if (!product) return;
  ccCurrentProduct = product;
  const session = aaLoadSession();
  const balance = parseInt(session.credits, 10) || 0;

  document.getElementById('ccTitle').textContent = product.title;
  document.getElementById('ccPartner').textContent = product.partner;

  let html = '<div class="cc-row"><span>' + product.description + '</span></div>';

  const applied = Math.min(balance, product.cost);
  const shortfall = product.cost - applied;
  html += '<div class="cc-row"><span>Cost</span><span style="font-weight:700;">' + product.cost + ' credits ($' + product.cost + ')</span></div>';
  html += '<div class="cc-row"><span>Your credit balance</span><span>' + balance + ' credits</span></div>';
  html += '<div class="cc-row"><span>Credits applied</span><span style="color:#15803d;font-weight:700;">-' + applied + '</span></div>';
  if (shortfall > 0) {
    html += '<div class="cc-row" style="background:var(--yellow-bg);margin:0 -20px;padding:12px 20px;border-bottom:none;"><span>Remaining balance due</span><span style="font-weight:700;">$' + shortfall + '</span></div>';
    html += '<div style="font-size:11px;color:var(--muted);margin:10px 0;">Your credits cover $' + applied + ' of this. The rest is billed to a card — this is a prototype, no real charge occurs.</div>';
    html += ccCardFormHtml();
    html += '<button class="btn-run-quotes" style="width:100%;" onclick="confirmCreditsPurchase()">Apply ' + applied + ' credits + pay $' + shortfall + ' →</button>';
  } else {
    html += '<div style="font-size:12px;color:#15803d;font-weight:600;margin:14px 0;">✓ Fully covered by your Align Credits.</div>';
    html += '<button class="btn-run-quotes" style="width:100%;" onclick="confirmCreditsPurchase()">Confirm purchase →</button>';
  }

  document.getElementById('ccBody').innerHTML = html;
  const modal = document.getElementById('creditsCheckoutModal');
  modal.classList.add('show');
  aaLockBodyScroll();
}

function ccCardFormHtml() {
  return '<div style="border:1.5px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:14px;">' +
    '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Add a card (illustrative — Stripe)</div>' +
    '<input placeholder="Card number" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;margin-bottom:8px;font-size:13px;font-family:\'Outfit\',sans-serif;">' +
    '<div style="display:flex;gap:8px;"><input placeholder="MM / YY" style="flex:1;box-sizing:border-box;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:\'Outfit\',sans-serif;">' +
    '<input placeholder="CVC" style="flex:1;box-sizing:border-box;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:\'Outfit\',sans-serif;"></div></div>';
}

function closeCreditsCheckout() {
  const modal = document.getElementById('creditsCheckoutModal');
  if (modal) modal.classList.remove('show');
  aaUnlockBodyScroll();
}

// 2026-09-07 — targetId added so a real, standalone page (not just the
// small checkout modal) can reuse the exact same purchase logic (credit
// deduction, session field, promo code, Financial Passport handoff
// success state) instead of duplicating it. Defaults to the modal's own
// container so every existing caller is unaffected.
function confirmCreditsPurchase(targetId) {
  if (!ccCurrentProduct) return;
  const product = ccCurrentProduct;
  targetId = targetId || 'ccBody';

  let successHtml = '<div style="text-align:center;padding:10px 0;"><div style="font-size:32px;margin-bottom:10px;">✓</div>';

  {
    const session = aaLoadSession();
    const balance = parseInt(session.credits, 10) || 0;
    const applied = Math.min(balance, product.cost);
    addLiveCredits(-applied);
    aaSaveSession({ [product.sessionField]: true });
    // Dashboard-only, no-op elsewhere (Marketplace/partner pages don't
    // define this) — keeps the Dashboard's Recent Activity feed in sync
    // the instant a purchase completes there, not just on next page load.
    if (typeof renderActivityFeed === 'function') renderActivityFeed();
    // Marketplace-only (guarded the same way, for the same reason) — a
    // completed purchase changes what's "not done yet" for ranking
    // purposes (see rankMarketplaceDepts()'s own scoring), so re-run it
    // right away instead of leaving the Overall Picks order stale until
    // the next full page load.
    if (typeof rankMarketplaceDepts === 'function') rankMarketplaceDepts();

    if (product.successType === 'promo') {
      const code = 'AAGT-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      // 2026-09-05, per Alex: "even in a handoff where it may click over to
      // another company's tech... fill in my digital financial passport...
      // so it starts to reinforce how easy our experience is." This IS a
      // real handoff to GoodTrust's own site — we can't literally inject
      // data into their form, so the honest version is confirming exactly
      // what Passport data travels ahead, only ever listing fields that
      // are actually in the session (see aaPassportHandoffFields()).
      aaInjectPassportStyles();
      const passportFields = aaPassportHandoffFields(PASSPORT_ALL_KEYS);
      const passportExplainer = 'GoodTrust doesn\'t have an API connection yet, so this won\'t auto-fill on their site — but here\'s what\'s already on file, so you\'re not starting from zero when you get there.';
      successHtml += '<div style="font-weight:700;color:var(--navy);margin-bottom:6px;">Purchase complete</div>';
      successHtml += '<div style="font-size:12px;color:var(--muted);margin-bottom:14px;">Here\'s your one-time GoodTrust access code — use it on their site to finish setting up your documents.</div>';
      successHtml += '<div style="font-family:monospace;font-size:16px;font-weight:700;background:var(--gray);border:1.5px dashed var(--border);border-radius:8px;padding:10px;margin-bottom:14px;">' + code + '</div>';
      successHtml += '<button type="button" class="passport-fill-badge" style="width:100%;justify-content:center;margin-bottom:6px;" onclick="this.nextElementSibling.style.display=\'block\';this.style.display=\'none\';">' + PASSPORT_ICON_SVG + ' Your Financial Passport travels with you →</button>';
      successHtml += '<div class="passport-popover">' + aaPassportPopoverHtml(passportExplainer, passportFields, PASSPORT_ALL_KEYS.length) + '</div>';
      successHtml += '<button class="btn-run-quotes" style="width:100%;margin-top:10px;" onclick="showToast(\'This would hand off to mygoodtrust.com in production\');closeCreditsCheckout();">Continue to GoodTrust →</button>';
    } else {
      successHtml += '<div style="font-weight:700;color:var(--navy);margin-bottom:6px;">Payment applied</div>';
      successHtml += '<div style="font-size:12px;color:var(--muted);margin-bottom:14px;">You\'re all set for this year\'s coverage.</div>';
      successHtml += '<button class="btn-run-quotes" style="width:100%;" onclick="closeCreditsCheckout();">Done</button>';
    }
  }
  successHtml += '</div>';
  const target = document.getElementById(targetId);
  if (target) target.innerHTML = successHtml;
}

// ═══════════════════════════════════════════════════════════════════════
// FINANCIAL PASSPORT FILL BADGE — one shared, consistently-branded action
// used anywhere a partner interaction could either (a) pull real session
// fields directly into OUR OWN form fields, or (b) confirm what Passport
// data travels along with a handoff to a REAL external partner (GoodTrust,
// The Zebra, Movement Mortgage) whose own form we don't control.
// 2026-09-05, per Alex: "for each partner we are hoping information can
// travel... even in a handoff where it may click over to another
// company's tech... [they] click fill in with my digital financial
// passport... so it starts to reinforce how easy our experience is."
// Always honest about partial data — never claims a full fill/send it
// didn't actually do (mirrors the same discipline as the Zebra form's
// original autofillZebraFromPassport(), generalized here so every page
// gets the same look and the same honesty instead of a one-off per page).
// ═══════════════════════════════════════════════════════════════════════
// 2026-09-09 — SCHEMA EXPANSION, per Alex: "i want to make sure the
// financial passport is collecting everything we can... anytime we can
// store data, during onboarding, when they add that they have a mortgage,
// credit bracket, plus documents we need it all." Before this pass, only
// 4 fields existed here (name/state/marital/age) even though the product
// asks a lot more than that and simply threw the rest away the moment a
// screen was left:
//   - Onboarding's S9 asks 9 real questions; only marital and a combined
//     balance dollar figure ever reached the dashboard. The other 6
//     (income/own_home/emergency/retire_contrib/balance_401k/market/
//     involvement) weren't even stored in a JS variable — a click only
//     toggled a CSS class, so the answer was gone the instant the user
//     moved to the next screen. See selectedAnswers/S9_TO_PASSPORT in
//     assetalign-onboarding's own script.
//   - The Zebra auto-insurance form collects vehicle year, insured
//     duration, credit score bracket, and owned/financed/leased status;
//     submitNudge() only ever saved a boolean "submitted" flag and
//     discarded the actual answers. See captureZebraFormFields() below.
//   - Finch's own employer/years-at-company/retirement-plan fields were
//     shown once on onboarding's S2 and never forwarded past it.
//   - Life insurance intake (new, same day) adds gender/tobacco/health/
//     coverage fields — see marketplace/index.html's openLifeQuoteFlow().
// This is still a flat key→label map by design (same shape as before) —
// just every field the product actually asks about somewhere, so nothing
// collected anywhere gets silently thrown away. Add to this list, in the
// right section, the moment ANY new screen/form asks the member something
// real — don't let a new question ship without a home here.
const PASSPORT_FIELD_LABELS = {
  // Identity / always-known
  name: 'Name', state: 'State', marital: 'Marital status', age: 'Age', goal: 'Priority', email: 'Email',
  // Employment (Finch) — onboarding S2. employer_name (not a new
  // "employer" key) deliberately reuses the URL param already forwarded by
  // goToDashboard() for the (now-removed) Your Advisor rail — same real
  // Finch field, no need for a second name for the same fact.
  employer_name: 'Employer', yearsAtCompany: 'Years at company', retirementPlanEnrolled: 'Retirement plan',
  // Household financial picture — onboarding S9
  income: 'Household income', ownHome: 'Owns a home', emergencyFund: 'Emergency fund status',
  retireContrib: 'Retirement contribution status', balance401k: '401(k) balance', balanceIRA: 'IRA balance',
  balanceSavings: 'Savings & investments', riskTolerance: 'Risk tolerance', involvement: 'Advice involvement',
  // Auto insurance — Zebra nudge form
  vehicleYear: 'Vehicle year', vehicleOwnership: 'Vehicle owned/financed/leased',
  durationInsured: 'Time currently insured', creditScoreBracket: 'Credit score range', insuredStatus: 'Currently insured',
  // Life insurance — PolicyGenius intake (placeholder pending their real requirements)
  gender: 'Gender', tobaccoUse: 'Tobacco use', healthRating: 'Self-rated health',
  coverageAmount: 'Coverage amount', termLength: 'Term length', lifeReason: 'Reason for coverage',
  // Vault document reading — assetalign-dashboard-v2/vault's real pdf.js/
  // Tesseract.js extraction pipeline (2026-09-09). See that file's own
  // extractFieldsFromText() for exactly how these get found.
  autoInsuranceCarrier: 'Current auto insurance carrier', autoInsurancePremium: 'Current auto insurance premium',
  vehicleVIN: 'Vehicle VIN', incomeDocEmployer: 'Employer (from income document)',
  hasMortgage: 'Has a mortgage', mortgageRemainingBalance: 'Mortgage remaining balance', mortgageRate: 'Mortgage interest rate',
  hasWillOnFile: 'Has a will/trust on file',
};
// Every real handoff/fill call should check this same full set (never a
// narrower one-off list per call site) — 2026-09-05, per Alex, after
// noticing GoodTrust's handoff badge was missing Age even though it's real
// Finch data (DOB) the same as every other spot already uses. Derived from
// the labels map (2026-09-09) so the two can never drift out of sync —
// every field that has a label is automatically fillable/reportable.
const PASSPORT_ALL_KEYS = Object.keys(PASSPORT_FIELD_LABELS);

// A small purpose-built passport icon (navy card, gold border/emblem) —
// 2026-09-05, per Alex, replacing the plain 📘 emoji ("a much better
// graphic"). Reuses the exact brand navy/gold, not a new palette.
const PASSPORT_ICON_SVG = '<svg width="22" height="22" viewBox="0 0 28 28" fill="none" style="flex-shrink:0;">' +
  '<rect x="2" y="2" width="24" height="24" rx="5" fill="#0D3B66"/>' +
  '<rect x="2" y="2" width="24" height="24" rx="5" stroke="#F4D35E" stroke-width="1.4"/>' +
  '<circle cx="14" cy="11.5" r="4" fill="none" stroke="#F4D35E" stroke-width="1.4"/>' +
  '<path d="M8.5 20c1.6-2.6 3.2-3.7 5.5-3.7s3.9 1.1 5.5 3.7" stroke="#F4D35E" stroke-width="1.4" stroke-linecap="round" fill="none"/>' +
  '</svg>';

function aaInjectPassportStyles() {
  if (document.getElementById('aaPassportStyles')) return;
  const style = document.createElement('style');
  style.id = 'aaPassportStyles';
  style.textContent = '.passport-fill-badge{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;background:rgba(244,211,94,0.12);border:1.5px solid var(--yellow,#F4D35E);border-radius:8px;font-size:12px;font-weight:700;color:var(--yellow-dark,#c9a227);cursor:pointer;font-family:\'Outfit\',sans-serif;transition:background .15s;}' +
    '.passport-fill-badge:hover{background:rgba(244,211,94,0.22);}' +
    '.passport-popover{display:none;text-align:left;background:#fff;border:1.5px solid var(--border,#e5e5e5);border-radius:12px;box-shadow:0 10px 28px rgba(13,59,102,0.16);padding:14px 16px;margin-top:8px;}' +
    '.passport-popover-head{display:flex;align-items:center;gap:9px;margin-bottom:7px;}' +
    '.passport-popover-title{font-size:13px;font-weight:700;color:var(--navy,#0D3B66);}' +
    '.passport-popover-sub{font-size:11.5px;color:var(--muted,#6b7c93);line-height:1.55;margin-bottom:10px;}' +
    '.passport-popover-list{font-size:12px;color:var(--text,#1a2d42);line-height:1.8;}' +
    '.passport-popover-list b{color:#15803d;}';
  document.head.appendChild(style);
}

// Builds the popover's inner HTML — one shared explanation + list format,
// used whether we're reporting a real in-page fill or a real handoff.
function aaPassportPopoverHtml(explainer, foundLabels, totalCount) {
  const list = foundLabels.length
    ? foundLabels.map(function (f) { return '<div>✓ <b>' + f + '</b></div>'; }).join('')
    : '<div>Nothing on your Passport yet to fill in.</div>';
  return '<div class="passport-popover-head">' + PASSPORT_ICON_SVG + '<div class="passport-popover-title">Your Financial Passport</div></div>'
    + '<div class="passport-popover-sub">' + explainer + '</div>'
    + '<div class="passport-popover-list">' + list + '</div>';
}

// Fills real DOM fields on THIS page from session data. fieldMap is
// {elementId: sessionKey}. Flashes each filled field, then opens a small
// popover explaining what it found — never claims more than it actually
// filled.
function aaPassportFillFields(fieldMap, resultElId) {
  aaInjectPassportStyles();
  const session = aaLoadSession();
  let found = 0;
  const foundLabels = [];
  const keys = Object.keys(fieldMap);
  keys.forEach(function (elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    const key = fieldMap[elId];
    let val = session[key];
    if (key === 'state' && val) val = val.toUpperCase();
    if (val) {
      el.value = val;
      found++;
      foundLabels.push(PASSPORT_FIELD_LABELS[key] || key);
      el.style.transition = 'background 0.3s';
      el.style.background = 'rgba(244,211,94,0.3)';
      setTimeout(function () { el.style.background = ''; }, 900);
    }
  });
  const result = document.getElementById(resultElId);
  if (result) {
    result.className = 'passport-popover';
    result.style.display = 'block';
    const explainer = 'This is what AssetAlign already has on file for you — from onboarding and your payroll connection. We just filled it into the fields below.';
    result.innerHTML = aaPassportPopoverHtml(explainer, foundLabels, keys.length);
  }
  return { found: found, total: keys.length };
}

// For a real handoff to an external partner's own site/form (no DOM
// fields of ours to fill) — reports which of `keys` are actually on file,
// so the badge can say what travels with the member instead of a vague
// promise. Never invents a value that isn't in the session.
function aaPassportHandoffFields(keys) {
  const session = aaLoadSession();
  return keys.filter(function (k) { return !!session[k]; }).map(function (k) { return PASSPORT_FIELD_LABELS[k] || k; });
}

// ── DRAG-AND-DROP — drag the nav credits pill onto a drop-zone card to
// open that card's checkout directly. Same openCreditsCheckout() a normal
// click already uses — dragging is just an alternate trigger, not a
// parallel flow, so both paths stay in sync automatically. ──
function aaEnableCreditsDrag(pillId) {
  const pill = document.getElementById(pillId || 'tutPointsPill');
  if (!pill || pill.dataset.dragWired) return;
  pill.dataset.dragWired = '1';
  pill.setAttribute('draggable', 'true');
  pill.addEventListener('dragstart', function (e) {
    e.dataTransfer.setData('text/plain', 'aa-credits');
    document.body.classList.add('aa-dragging-credits');
    pill.classList.add('aa-drag-source');
  });
  pill.addEventListener('dragend', function () {
    document.body.classList.remove('aa-dragging-credits');
    pill.classList.remove('aa-drag-source');
  });
}
function aaWireDropZone(el, productKey) {
  if (!el || el.dataset.dropWired) return;
  el.dataset.dropWired = '1';
  el.classList.add('cc-drop-zone');
  el.addEventListener('dragover', function (e) { e.preventDefault(); el.classList.add('drag-over'); });
  el.addEventListener('dragleave', function () { el.classList.remove('drag-over'); });
  el.addEventListener('drop', function (e) {
    e.preventDefault();
    el.classList.remove('drag-over');
    document.body.classList.remove('aa-dragging-credits');
    openCreditsCheckout(productKey);
  });
}

// Used by the Dashboard's insurance nudge estimate copy today; kept here
// since it's plain reference data any page could reasonably need.
const stateNames = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'D.C.', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' };

// ── AUTO-POPULATED CONTACT EMAIL ──
// 2026-09-04, per Alex: "when someone clicks on the email.. i think
// outlook should pop up like you have it.. but also have the email
// autopopulate with an email so Kevin can get the email, have some basic
// information and than respond quickly. same should be for any other
// services where we have a contact or email." Builds a real mailto: URL
// pre-filled with the member's actual session data (name, goal, state) —
// a plain mailto:, so it opens whatever mail client is actually configured
// on the device (Outlook, if that's the default) — not something this
// page can force specifically. Reusable for any future real partner
// contact, not just Kevin; only ever wire this to a REAL person's real
// email (see the "no real contact info for fictional profiles" rule
// already followed on the Sarah Kim / Marcus Bennett demo pages).
const GOAL_LABELS = { home: 'buying a home', debt: 'paying down debt', invest: 'investing', retire: 'retirement planning', protect: 'protecting my family' };
function aaBuildMailto(toEmail, partnerFirstName, topicLabel) {
  const session = aaLoadSession();
  const name = session.name || 'there';
  const knowsName = !!session.name;
  const subject = 'AssetAlign Introduction' + (knowsName ? ' — ' + name : '');
  let body = 'Hi ' + partnerFirstName + ',\n\n';
  body += "I'm " + (knowsName ? name : 'a member') + ', connecting through the AssetAlign Marketplace';
  body += topicLabel ? ' about ' + topicLabel + '.' : '.';
  body += '\n\nA bit about me:\n';
  body += '- Priority: ' + (GOAL_LABELS[session.goal] || 'not specified') + '\n';
  if (session.state && stateNames[session.state.toUpperCase()]) body += '- Location: ' + stateNames[session.state.toUpperCase()] + '\n';
  body += '\nLooking forward to connecting.\n\nThanks,\n' + (knowsName ? name : '');
  return 'mailto:' + toEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
}
// Sets a link's href to the real, personalized mailto: above — call after
// aaResolveSession() so session data is actually loaded. Leaves a page's
// own plain mailto:address (already in the HTML as a safe fallback)
// untouched if this never runs for some reason.
function aaWireContactEmail(linkId, toEmail, partnerFirstName, topicLabel) {
  const link = document.getElementById(linkId);
  if (link) link.href = aaBuildMailto(toEmail, partnerFirstName, topicLabel);
}

// ── GIVE THE GIFT OF FINANCIAL PLANNING ──
// 2026-09-09, per Alex's idea backlog: a member can invite a friend/family
// member who is NOT covered by any employer sponsoring AssetAlign —
// AssetAlign enrolls that person directly, independent of the usual
// employer-sponsored path. Alex's own suggested framing ("give the gift of
// financial planning," not "refer and earn") is why there's no credit
// reward wired in here — this is deliberately gift-framed goodwill, not a
// growth-loop mechanic.
//
// The invite link points at the onboarding prototype's GitHub Pages mirror
// (not the netlify.app one) — same reasoning as every other real link in
// this suite: Outlook/Exchange mail filters broadly block netlify.app links
// (see the sites-workspace memory's Outlook-block note), and an invite sent
// over email is exactly the case that would hit that block. ?gift=1 tells
// assetalign-onboarding to skip its Finch/employer-verify step entirely
// (see that file's isGift/initGiftMode()) since an independent enrollee has
// no payroll record to confirm against.
const AA_GIFT_ONBOARDING_URL = 'https://assetalign.github.io/assetalign-onboarding/';
function aaBuildGiftInviteLink(friendName, friendEmail) {
  const session = aaLoadSession();
  const referrerName = session.name || 'A friend';
  const params = new URLSearchParams({ gift: '1', from: referrerName });
  if (friendName) params.set('first_name', friendName);
  if (friendEmail) params.set('email', friendEmail);
  return AA_GIFT_ONBOARDING_URL + '?' + params.toString();
}
// Real send: builds a mailto: that opens the MEMBER'S OWN email client,
// addressed to their friend and already written — they're the one who
// actually hits send, same as aaBuildMailto() above for real partner
// contact. Nothing here fakes a "sent!" confirmation on its own.
function aaBuildGiftInviteMailto(friendName, friendEmail, personalNote) {
  const session = aaLoadSession();
  const referrerName = session.name || 'A friend';
  const link = aaBuildGiftInviteLink(friendName, friendEmail);
  const subject = referrerName + ' sent you a free financial plan';
  let body = 'Hi ' + (friendName || 'there') + ',\n\n';
  body += referrerName + ' wanted you to have this — a complimentary financial plan through AssetAlign. No employer required, and no cost to you.\n\n';
  if (personalNote) body += personalNote + '\n\n';
  body += 'Get started here: ' + link + '\n\n';
  body += 'Thanks,\n' + referrerName;
  return 'mailto:' + (friendEmail || '') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
}
