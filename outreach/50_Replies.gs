/**
 * 50_Replies.gs — stop emailing people who answered, asked you to stop,
 * or do not exist.
 *
 * This runs against the Gmail mailbox that owns the script. In SMTP_BRIDGE
 * mode it still works as long as ME.replyTo is a Gmail address you monitor,
 * which is why the config defaults it that way.
 */

/** Anyone who replied moves to REPLIED and drops out of the sequence. */
function checkReplies() {
  var rows = readProspects();
  var hits = 0;

  rows.forEach(function (row) {
    if (row.isBlank()) return;
    var status = row.getStr('Status').toUpperCase();
    if (status !== 'SENT') return;

    var email = row.getStr('Email');
    if (!isValidEmail(email)) return;

    try {
      var threads = GmailApp.search('from:' + email + ' newer_than:60d', 0, 3);
      if (!threads.length) return;

      row.set('Status', 'REPLIED');
      row.set('Notes', 'Replied ' + Utilities.formatDate(new Date(), SEND.timezone, 'yyyy-MM-dd'));
      log_(email, row.getStr('Company'), row.get('Step'), 'REPLIED', threads[0].getFirstMessageSubject());
      hits++;
    } catch (e) {
      log_(email, row.getStr('Company'), row.get('Step'), 'ERROR', 'Reply check: ' + e.message);
    }
  });

  log_('', '', '', 'REPLY_SCAN', hits + ' new repl(ies)');
  return hits;
}

/**
 * Honours opt-outs. Scans for replies whose body contains an opt-out phrase
 * and suppresses the sender permanently.
 *
 * Treat a borderline case as an opt-out every time. The cost of wrongly
 * removing someone is one lost lead; the cost of wrongly keeping them is a
 * spam complaint against your domain.
 */
var OPT_OUT_PATTERNS = [
  /\bunsubscribe\b/i,
  /\bremove me\b/i,
  /\btake me off\b/i,
  /\bstop (emailing|contacting)\b/i,
  /\bdo not (contact|email)\b/i,
  /\bnot interested\b/i,
  /\bopt[- ]?out\b/i
];

function processUnsubscribes() {
  var threads = GmailApp.search('newer_than:30d -in:sent', 0, 100);
  var removed = 0;

  threads.forEach(function (thread) {
    thread.getMessages().forEach(function (message) {
      var from = extractEmail_(message.getFrom());
      if (!from) return;

      var body = message.getPlainBody() || '';
      // Only look at what they wrote, not your own quoted email below it.
      var theirText = body.split(/\n\s*(On .+wrote:|-{2,}\s*Original Message)/i)[0];

      var optedOut = OPT_OUT_PATTERNS.some(function (re) { return re.test(theirText); });
      if (!optedOut) return;

      addToSuppression(from, 'Replied opt-out');
      markProspect_(from, 'UNSUBSCRIBED', 'Opt-out honoured');
      log_(from, '', '', 'UNSUBSCRIBED', 'Opt-out phrase in reply');
      removed++;
    });
  });

  log_('', '', '', 'OPTOUT_SCAN', removed + ' opt-out(s) processed');
  return removed;
}

/** Hard bounces: suppress, so you never burn reputation on a dead address twice. */
function processBounces() {
  var threads = GmailApp.search('from:mailer-daemon OR from:postmaster newer_than:30d', 0, 50);
  var found = 0;

  threads.forEach(function (thread) {
    thread.getMessages().forEach(function (message) {
      var body = message.getPlainBody() || '';
      if (!/550|551|553|user unknown|does not exist|address not found|no such user/i.test(body)) return;

      var matches = body.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || [];
      matches.forEach(function (candidate) {
        var addr = candidate.toLowerCase();
        if (/mailer-daemon|postmaster|googlemail|no-?reply/.test(addr)) return;
        if (markProspect_(addr, 'BOUNCED', 'Hard bounce')) {
          addToSuppression(addr, 'Hard bounce');
          log_(addr, '', '', 'BOUNCED', 'Detected in bounce notice');
          found++;
        }
      });
    });
  });

  log_('', '', '', 'BOUNCE_SCAN', found + ' bounce(s)');
  return found;
}

/** Sets status on the prospect row matching an address. Returns true if found. */
function markProspect_(email, status, note) {
  var target = String(email).toLowerCase();
  var rows = readProspects();
  var matched = false;

  rows.forEach(function (row) {
    if (row.isBlank()) return;
    if (row.getStr('Email').toLowerCase() !== target) return;
    row.set('Status', status);
    row.set('Notes', note);
    matched = true;
  });

  return matched;
}

function extractEmail_(fromHeader) {
  var m = String(fromHeader).match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return m ? m[0].toLowerCase() : '';
}
