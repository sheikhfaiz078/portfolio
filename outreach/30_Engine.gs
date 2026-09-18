/**
 * 30_Engine.gs — reading the sheet, rendering a message, running the queue.
 */

/* ------------------------------------------------------------------ rows */

/** Reads Prospects into row objects that can also write themselves back. */
function readProspects() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.prospects);
  if (!sh || sh.getLastRow() < 2) return [];

  var width = sh.getLastColumn();
  var header = sh.getRange(1, 1, 1, width).getValues()[0].map(function (h) { return String(h).trim(); });
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, width).getValues();

  return data.map(function (values, i) {
    return makeRow(sh, header, values, i + 2);
  });
}

function makeRow(sh, header, values, rowIndex) {
  function idx(name) {
    var i = header.indexOf(name);
    if (i < 0) throw new Error('Missing column "' + name + '". Run Outreach > Set up sheets.');
    return i;
  }
  return {
    rowIndex: rowIndex,
    get: function (name) { return values[idx(name)]; },
    getStr: function (name) { return String(values[idx(name)] || '').trim(); },
    set: function (name, value) {
      values[idx(name)] = value;
      sh.getRange(rowIndex, idx(name) + 1).setValue(value);
    },
    isBlank: function () {
      return values.every(function (v) { return String(v).trim() === ''; });
    }
  };
}

/* -------------------------------------------------------------- rendering */

/**
 * Builds the full message for a prospect at a given step.
 * Returns { subject, body, to, replyTo } or throws with a readable reason.
 */
function renderMessage(row, step) {
  var segment = (row.getStr('Segment') || 'generic').toLowerCase();
  var proof = PROOF[segment] || PROOF.generic;
  var bodies = BODIES[segment] || BODIES.generic;
  var lines = bodies[step];
  if (!lines) throw new Error('No template for segment "' + segment + '" step ' + step);

  var observation = row.getStr('Observation');
  var problem = row.getStr('Problem');
  var idea = row.getStr('Idea');

  // These three are the whole point. Refusing to send without them is the
  // single highest-value guard in this script.
  if (step === 1) {
    if (!observation) throw new Error('Observation is empty — write what you actually saw on their site or LinkedIn.');
    if (!problem)     throw new Error('Problem is empty — write what that observation costs them.');
    if (!idea)        throw new Error('Idea is empty — write the one thing you would change.');
  }

  var tokens = {
    firstName:   row.getStr('First Name') || 'there',
    company:     row.getStr('Company') || 'your company',
    title:       row.getStr('Title'),
    website:     row.getStr('Website'),
    observation: sentence(observation),
    problem:     problem,
    idea:        idea,
    subjectHook: shortHook(idea || observation),
    proofResult: proof.result,
    proofHow:    proof.how,
    myName:      ME.name,
    myTitle:     ME.title,
    portfolio:   ME.portfolio,
    linkedin:    ME.linkedin,
    phone:       ME.phone,
    signature:   buildSignature()
  };

  if (/^TODO/i.test(String(proof.result)) || /^TODO/i.test(String(proof.how))) {
    throw new Error('PROOF.' + (PROOF[segment] ? segment : 'generic') +
      ' still says TODO in 00_Config.gs. Put a real result there before sending.');
  }

  var subject = render(pickVariant(SUBJECTS[step], row.getStr('Email'), step), tokens);
  var body = render(lines.join('\n'), tokens) + buildFooter(row.getStr('Email'));

  assertNoUnresolvedTokens(subject);
  assertNoUnresolvedTokens(body);

  return {
    to: row.getStr('Email'),
    replyTo: ME.replyTo,
    subject: subject,
    body: body
  };
}

function render(text, tokens) {
  return String(text).replace(/\{\{(\w+)\}\}/g, function (whole, key) {
    return (tokens[key] === undefined || tokens[key] === null) ? whole : String(tokens[key]);
  });
}

/** A half-rendered "{{firstName}}" in a live send is unrecoverable. Block it. */
function assertNoUnresolvedTokens(text) {
  var left = String(text).match(/\{\{\w+\}\}/g);
  if (left) throw new Error('Unresolved placeholder(s): ' + left.join(', '));
}

/**
 * Compresses an idea into a few words usable inside a subject line.
 * Trailing joining words are dropped, so a subject never ends mid-phrase
 * ("quick thought on add one trial CTA and a" reads like a broken mail merge).
 */
var HOOK_TRAILING = ['and', 'a', 'an', 'the', 'to', 'for', 'with', 'plus',
                     'or', 'of', 'in', 'on', 'at', 'by', 'from', 'that'];

function shortHook(text) {
  var t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return 'your funnel';

  var words = t.toLowerCase().replace(/[.,;:]+$/, '').split(' ').slice(0, 6);
  while (words.length > 2 && HOOK_TRAILING.indexOf(words[words.length - 1]) >= 0) {
    words.pop();
  }
  return words.join(' ');
}

/** Ensures a sheet cell reads as a sentence even if the user skipped the period. */
function sentence(text) {
  var t = String(text || '').trim();
  if (!t) return t;
  return /[.!?]$/.test(t) ? t : t + '.';
}

/* ------------------------------------------------------------- the queue */

function runQueue() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) { log_('', '', '', 'SKIPPED', 'Another run is in progress'); return; }

  try {
    if (!withinSendWindow()) {
      log_('', '', '', 'SKIPPED', 'Outside send window');
      return;
    }

    var remainingToday = SEND.dailyCap - sentToday();
    var budget = Math.min(SEND.perRunCap, remainingToday);
    if (budget <= 0) { log_('', '', '', 'SKIPPED', 'Daily cap reached'); return; }

    var suppressed = loadSuppression();
    var now = new Date();
    var sent = 0;

    var rows = readProspects();
    for (var i = 0; i < rows.length && sent < budget; i++) {
      var row = rows[i];
      if (row.isBlank()) continue;

      var email = row.getStr('Email').toLowerCase();
      var status = row.getStr('Status').toUpperCase();
      var step = Number(row.get('Step') || 0);

      if (['REPLIED', 'UNSUBSCRIBED', 'BOUNCED', 'SKIPPED', 'ERROR'].indexOf(status) >= 0) continue;
      if (step >= 4) { row.set('Status', 'SKIPPED'); row.set('Notes', 'Sequence complete'); continue; }

      if (!isValidEmail(email)) { fail_(row, 'Invalid email address'); continue; }
      if (isSuppressed(email, suppressed)) {
        row.set('Status', 'UNSUBSCRIBED');
        log_(email, row.getStr('Company'), step, 'SUPPRESSED', 'On suppression list');
        continue;
      }

      var due = row.get('Next Send');
      if (step > 0 && due instanceof Date && due > now) continue;
      if (step === 0 && status && status !== 'QUEUED') continue;

      if (companyOnCooldown(row.getStr('Company'), email)) {
        log_(email, row.getStr('Company'), step, 'SKIPPED', 'Company cooldown active');
        continue;
      }

      var nextStep = step + 1;
      var msg;
      try {
        msg = renderMessage(row, nextStep);
      } catch (e) {
        fail_(row, e.message);
        continue;
      }

      if (SEND.dryRun) {
        log_(email, row.getStr('Company'), nextStep, 'DRY_RUN', msg.subject);
        sent++;
        continue;
      }

      try {
        var result = sendMessage(msg, row, nextStep);
        row.set('Step', nextStep);
        row.set('Status', 'SENT');
        row.set('Last Sent', now);
        row.set('Next Send', addDays(now, SEND.stepDelaysDays[nextStep] || 7));
        if (result.threadId) row.set('Thread Id', result.threadId);
        if (result.messageId) row.set('Message Id', result.messageId);
        row.set('Error', '');
        log_(email, row.getStr('Company'), nextStep, 'SENT', msg.subject);
        sent++;
      } catch (e) {
        fail_(row, e.message);
        continue;
      }

      if (sent < budget) Utilities.sleep(randomGap());
    }

    log_('', '', '', 'RUN_DONE', sent + ' message(s) processed');
  } finally {
    lock.releaseLock();
  }
}

function fail_(row, message) {
  row.set('Status', 'ERROR');
  row.set('Error', message);
  log_(row.getStr('Email'), row.getStr('Company'), row.get('Step'), 'ERROR', message);
}

/* ------------------------------------------------------------- the guards */

function withinSendWindow() {
  var now = new Date();
  var hour = Number(Utilities.formatDate(now, SEND.timezone, 'H'));
  var dow = Number(Utilities.formatDate(now, SEND.timezone, 'u')); // 1=Mon .. 7=Sun
  if (SEND.weekdaysOnly && dow > 5) return false;
  return hour >= SEND.sendHourStart && hour < SEND.sendHourEnd;
}

function sentToday() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.log);
  if (!sh || sh.getLastRow() < 2) return 0;
  var today = Utilities.formatDate(new Date(), SEND.timezone, 'yyyy-MM-dd');
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues();
  return rows.filter(function (r) {
    return r[4] === 'SENT' && r[0] instanceof Date &&
      Utilities.formatDate(r[0], SEND.timezone, 'yyyy-MM-dd') === today;
  }).length;
}

/** Two cold emails from the same person to the same company in one week reads as spam. */
function companyOnCooldown(company, selfEmail) {
  if (!company) return false;
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.log);
  if (!sh || sh.getLastRow() < 2) return false;

  var cutoff = addDays(new Date(), -SEND.companyCooldownDays);
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues();
  var target = company.toLowerCase();

  return rows.some(function (r) {
    return r[4] === 'SENT' &&
      r[0] instanceof Date && r[0] > cutoff &&
      String(r[2]).toLowerCase() === target &&
      String(r[1]).toLowerCase() !== String(selfEmail).toLowerCase();
  });
}

function loadSuppression() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.suppression);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues()
    .map(function (r) { return String(r[0]).trim().toLowerCase(); })
    .filter(String);
}

function isSuppressed(email, list) {
  var domain = email.split('@')[1] || '';
  return list.some(function (entry) { return entry === email || entry === domain; });
}

function addToSuppression(email, reason) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.suppression);
  var existing = loadSuppression();
  if (existing.indexOf(String(email).toLowerCase()) >= 0) return;
  sh.appendRow([String(email).toLowerCase(), reason, new Date()]);
}

/* -------------------------------------------------------------- utilities */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email));
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function randomGap() {
  return Math.floor(SEND.minGapMs + Math.random() * (SEND.maxGapMs - SEND.minGapMs));
}

function log_(email, company, step, event, detail) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.log);
  if (!sh) return;
  sh.appendRow([new Date(), email || '', company || '', step === undefined ? '' : step, event, detail || '']);
}
