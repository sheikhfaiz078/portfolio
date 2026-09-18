/**
 * 10_Setup.gs — menu, first-run sheet creation, trigger management.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📤 Outreach')
    .addItem('1. Set up sheets', 'setupSheets')
    .addSeparator()
    .addItem('Preview selected row', 'previewSelectedRow')
    .addItem('Send test to myself', 'sendTestToMyself')
    .addSeparator()
    .addItem('▶ Run sending queue now', 'runQueue')
    .addItem('Check for replies now', 'checkReplies')
    .addItem('Process unsubscribes now', 'processUnsubscribes')
    .addSeparator()
    .addItem('Install hourly triggers', 'installTriggers')
    .addItem('Remove all triggers', 'removeTriggers')
    .addItem('Show status', 'showStatus')
    .addToUi();
}

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var p = ss.getSheetByName(SHEETS.prospects) || ss.insertSheet(SHEETS.prospects);
  if (p.getLastRow() === 0 || String(p.getRange(1, 1).getValue()).trim() !== COLUMNS[0]) {
    p.clear();
    p.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
  }
  p.getRange(1, 1, 1, COLUMNS.length)
    .setFontWeight('bold')
    .setBackground('#1B5F39')
    .setFontColor('#FFFFFF');
  p.setFrozenRows(1);

  // Status dropdown, so a stray typo cannot silently re-queue someone.
  var statuses = ['QUEUED', 'SENT', 'REPLIED', 'BOUNCED', 'UNSUBSCRIBED', 'SKIPPED', 'ERROR'];
  p.getRange(2, 1, Math.max(p.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(statuses, true).build()
  );

  var segments = ['saas', 'ecommerce', 'edtech', 'services', 'generic'];
  var segCol = COLUMNS.indexOf('Segment') + 1;
  p.getRange(2, segCol, Math.max(p.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(segments, true).build()
  );

  var log = ss.getSheetByName(SHEETS.log) || ss.insertSheet(SHEETS.log);
  if (log.getLastRow() === 0) {
    log.appendRow(['Timestamp', 'Email', 'Company', 'Step', 'Event', 'Detail']);
    log.getRange(1, 1, 1, 6).setFontWeight('bold');
    log.setFrozenRows(1);
  }

  var sup = ss.getSheetByName(SHEETS.suppression) || ss.insertSheet(SHEETS.suppression);
  if (sup.getLastRow() === 0) {
    sup.appendRow(['Email or Domain', 'Reason', 'Added']);
    sup.getRange(1, 1, 1, 3).setFontWeight('bold');
    sup.setFrozenRows(1);
  }

  SpreadsheetApp.getUi().alert(
    'Sheets ready.\n\n' +
    'Next: paste your prospects into "' + SHEETS.prospects + '", set Status to QUEUED, ' +
    'and fill Observation / Problem / Idea for each one. Rows missing those three ' +
    'are skipped on purpose — a founder email without them does not get a reply.'
  );
}

/** Hourly send pass + reply and unsubscribe checks. */
function installTriggers() {
  removeTriggers();
  ScriptApp.newTrigger('runQueue').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('checkReplies').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('processUnsubscribes').timeBased().everyHours(4).create();
  SpreadsheetApp.getUi().alert(
    'Triggers installed.\n\nThe queue runs hourly but only sends inside ' +
    SEND.sendHourStart + ':00-' + SEND.sendHourEnd + ':00 ' + SEND.timezone +
    (SEND.weekdaysOnly ? ', weekdays only.' : '.')
  );
}

function removeTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
}

function showStatus() {
  var counts = {};
  readProspects().forEach(function (r) {
    var s = r.get('Status') || '(blank)';
    counts[s] = (counts[s] || 0) + 1;
  });
  var lines = Object.keys(counts).sort().map(function (k) { return k + ': ' + counts[k]; });

  var quota = '';
  try { quota = '\nGmail quota left today: ' + MailApp.getRemainingDailyQuota(); } catch (e) {}

  SpreadsheetApp.getUi().alert(
    'Mode: ' + SEND.mode + (SEND.dryRun ? '  (DRY RUN — nothing is sent)' : '') +
    '\nSent today: ' + sentToday() + ' / ' + SEND.dailyCap + quota +
    '\n\n' + lines.join('\n')
  );
}
