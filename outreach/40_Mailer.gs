/**
 * 40_Mailer.gs — the one place that actually puts a message on the wire.
 *
 * Two backends behind one function, so the rest of the script never changes
 * when you move from Gmail to your own domain's SMTP:
 *
 *   GMAIL        GmailApp. Simplest, best deliverability out of the box,
 *                but the From address must be your Google account or a
 *                verified "Send mail as" alias.
 *   SMTP_BRIDGE  Apps Script cannot open a raw SMTP socket, so it POSTs the
 *                message to a small signed PHP endpoint on your own hosting,
 *                which relays it through your host's SMTP server. This is how
 *                you send as faiz@sheikhfaiz.info from hosting. See README §6.
 */

function sendMessage(msg, row, step) {
  if (SEND.mode === 'SMTP_BRIDGE') return sendViaBridge_(msg, row, step);
  return sendViaGmail_(msg, row, step);
}

/* ----------------------------------------------------------------- Gmail */

function sendViaGmail_(msg, row, step) {
  var options = {
    name: ME.name,
    replyTo: msg.replyTo
  };

  // Optional verified alias, e.g. faiz@sheikhfaiz.info added under
  // Gmail > Settings > Accounts > "Send mail as". Unset -> normal address.
  var alias = PropertiesService.getScriptProperties().getProperty('SEND_AS_ALIAS');
  if (alias) {
    var allowed = GmailApp.getAliases();
    if (allowed.indexOf(alias) < 0) {
      throw new Error('SEND_AS_ALIAS "' + alias + '" is not a verified alias on this Gmail account.');
    }
    options.from = alias;
  }

  var threadId = row ? String(row.get('Thread Id') || '') : '';

  if (step > 1 && SEND.threadFollowUps && threadId) {
    var thread = null;
    try { thread = GmailApp.getThreadById(threadId); } catch (e) { thread = null; }
    if (thread) {
      // Reply in-thread: the follow-up sits under the original email, which is
      // how a human follows up. Gmail keeps the original subject.
      thread.reply(msg.body, options);
      return { threadId: threadId, messageId: '' };
    }
  }

  GmailApp.sendEmail(msg.to, msg.subject, msg.body, options);
  return captureThread_(msg);
}

/** Finds the thread we just created, so follow-ups can reply into it. */
function captureThread_(msg) {
  try {
    var query = 'in:sent to:' + msg.to + ' subject:"' + msg.subject.replace(/"/g, '') + '"';
    var threads = GmailApp.search(query, 0, 1);
    if (threads.length) {
      var t = threads[0];
      var messages = t.getMessages();
      return { threadId: t.getId(), messageId: messages[messages.length - 1].getId() };
    }
  } catch (e) { /* threading is a nicety, never a reason to fail a send */ }
  return { threadId: '', messageId: '' };
}

/* ----------------------------------------------------- hosting SMTP bridge */

function sendViaBridge_(msg, row, step) {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('BRIDGE_URL');
  var secret = props.getProperty('BRIDGE_SECRET');
  var from = props.getProperty('BRIDGE_FROM') || ME.replyTo;

  if (!url || !secret) {
    throw new Error('SMTP_BRIDGE mode needs BRIDGE_URL and BRIDGE_SECRET in Script Properties.');
  }
  if (url.indexOf('https://') !== 0) {
    throw new Error('BRIDGE_URL must be https — the payload contains prospect data.');
  }

  // Our own Message-ID, so follow-ups can thread correctly on the SMTP side.
  var domain = String(from).split('@')[1] || 'localhost';
  var messageId = '<' + Utilities.getUuid() + '@' + domain + '>';

  var payload = {
    ts: Math.floor(Date.now() / 1000),
    to: msg.to,
    fromEmail: from,
    fromName: ME.name,
    replyTo: msg.replyTo,
    subject: msg.subject,
    text: msg.body,
    messageId: messageId,
    inReplyTo: (step > 1 && row) ? String(row.get('Message Id') || '') : ''
  };

  var body = JSON.stringify(payload);
  var signature = Utilities.base64Encode(
    Utilities.computeHmacSha256Signature(body, secret)
  );

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'X-Outreach-Signature': signature },
    payload: body,
    muteHttpExceptions: true,
    followRedirects: false
  });

  var code = response.getResponseCode();
  var text = response.getContentText();
  if (code !== 200) throw new Error('Bridge returned HTTP ' + code + ': ' + text.slice(0, 300));

  var parsed;
  try { parsed = JSON.parse(text); } catch (e) {
    throw new Error('Bridge returned non-JSON: ' + text.slice(0, 200));
  }
  if (!parsed.ok) throw new Error('Bridge error: ' + (parsed.error || 'unknown'));

  // Keep the first Message-ID for the whole thread so replies chain properly.
  var keep = (step > 1 && row && row.get('Message Id')) ? String(row.get('Message Id')) : messageId;
  return { threadId: '', messageId: keep };
}
