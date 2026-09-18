/**
 * 60_Manual.gs — the things you click before trusting the automation.
 */

/** Renders the next email for the selected row and shows it, without sending. */
function previewSelectedRow() {
  var ui = SpreadsheetApp.getUi();
  var sh = SpreadsheetApp.getActiveSheet();

  if (sh.getName() !== SHEETS.prospects) {
    ui.alert('Select a row on the "' + SHEETS.prospects + '" tab first.');
    return;
  }

  var rowIndex = sh.getActiveRange().getRow();
  if (rowIndex < 2) { ui.alert('Select a data row, not the header.'); return; }

  var width = sh.getLastColumn();
  var header = sh.getRange(1, 1, 1, width).getValues()[0].map(function (h) { return String(h).trim(); });
  var values = sh.getRange(rowIndex, 1, 1, width).getValues()[0];
  var row = makeRow(sh, header, values, rowIndex);

  var step = Number(row.get('Step') || 0) + 1;
  if (step > 4) { ui.alert('This prospect has finished the 4-step sequence.'); return; }

  try {
    var msg = renderMessage(row, step);
    ui.alert(
      'Step ' + step + ' to ' + msg.to + '\n' +
      'Reply-To: ' + msg.replyTo + '\n\n' +
      'SUBJECT: ' + msg.subject + '\n\n' + msg.body
    );
  } catch (e) {
    ui.alert('Cannot send this row yet:\n\n' + e.message);
  }
}

/** Sends the selected row's next email to YOU, so you see it as a founder would. */
function sendTestToMyself() {
  var ui = SpreadsheetApp.getUi();
  var sh = SpreadsheetApp.getActiveSheet();

  if (sh.getName() !== SHEETS.prospects) {
    ui.alert('Select a row on the "' + SHEETS.prospects + '" tab first.');
    return;
  }

  var rowIndex = sh.getActiveRange().getRow();
  if (rowIndex < 2) { ui.alert('Select a data row, not the header.'); return; }

  var width = sh.getLastColumn();
  var header = sh.getRange(1, 1, 1, width).getValues()[0].map(function (h) { return String(h).trim(); });
  var values = sh.getRange(rowIndex, 1, 1, width).getValues()[0];
  var row = makeRow(sh, header, values, rowIndex);

  var step = Number(row.get('Step') || 0) + 1;

  try {
    var msg = renderMessage(row, Math.min(step, 4));
    msg.to = Session.getActiveUser().getEmail();
    msg.subject = '[TEST] ' + msg.subject;
    sendMessage(msg, null, 1);   // null row => never threads, never writes back
    ui.alert('Test sent to ' + msg.to + '. Read it on your phone — that is where it will be read.');
  } catch (e) {
    ui.alert('Could not send test:\n\n' + e.message);
  }
}
