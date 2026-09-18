# Founder & CEO Outreach — Google Apps Script

A cold-email system built around one idea: **a founder replies to a problem, not to a pitch.**

Everything here exists to make that possible at volume — templates that lead with
their problem, guards that refuse to send a generic email, a sequence that stops
the moment someone answers, and two ways to send: Gmail, or your own
`@sheikhfaiz.info` address through your hosting's SMTP.

---

## 1. Why these emails are shaped this way

A CEO triages email in about four seconds, asking one question: *is this about me,
or about you?* Anything that opens with who you are and what you offer loses.

So every message follows the same five-part skeleton:

| Part | Who supplies it | Example |
|---|---|---|
| **Observation** | You, per prospect | "Your pricing page has no trial CTA above the fold" |
| **Problem** | You, per prospect | "so paid traffic lands and leaves without a next step" |
| **Idea** | You, per prospect | "a single trial CTA plus a 3-email activation sequence" |
| **Proof** | The template, per segment | "cut demo no-shows 46% → 19% in six weeks" |
| **Tiny ask** | The template | "Yes or no is all I need" |

The first three come from the sheet, the last two from the template. That split is
what lets you send 30 genuinely personal emails in a morning instead of 30 identical ones.

**The script will refuse to send step 1 if Observation, Problem or Idea is blank.**
That is deliberate. A blank there produces exactly the email founders delete, and
each one costs you domain reputation you cannot buy back.

The sequence is four steps and then it stops:

1. **Problem** — observation, cost, idea, one number, yes/no question.
2. **Proof** — the number, and the lever behind it. Sent as a reply in the same thread.
3. **The give** — you offer to do a piece of the work for free, no call required. This step gets the most replies.
4. **Close the loop** — "I stop at three." Persistence without obligation; it reliably wins a few late yeses.

Follow-ups thread under the original email, because that is how a human follows up.

---

## 2. Files

```
outreach/
├── 00_Config.gs        your details, your proof points, sending limits  ← edit this
├── 10_Setup.gs         menu, sheet creation, triggers
├── 20_Templates.gs     subjects + bodies, 5 segments × 4 steps          ← edit this
├── 30_Engine.gs        rendering, queue, caps, cooldowns, guards
├── 40_Mailer.gs        Gmail backend + hosting-SMTP backend
├── 50_Replies.gs       reply / opt-out / bounce detection
├── 60_Manual.gs        preview and test-send
├── prospects.sample.csv
└── php-bridge/
    ├── send.php            upload to your hosting
    └── config.sample.php   copy outside public_html
```

---

## 3. Setup (15 minutes)

1. Create a new Google Sheet. **Extensions → Apps Script.**
2. Create one file per `.gs` above (the `00_`, `10_` … prefixes control load order — keep them) and paste the contents in. Save.
3. In `00_Config.gs`:
   - check `ME` (already filled from sheikhfaiz.info) and set a real `postalAddress`;
   - **replace every `TODO` in `PROOF`.** The script refuses to send while a TODO remains — that guard exists because an unsubstantiated claim to a CEO is worse than no email.
4. Reload the Sheet. A **📤 Outreach** menu appears → **Set up sheets**. Approve the permissions prompt (it is your own script; the warning screen is standard for unverified personal scripts — *Advanced → Go to project*).
5. Paste your prospects in. See `prospects.sample.csv` for the shape.
6. Select a row → **Preview selected row**. Read it as if you were the CEO. If it does not sound like a person wrote it for them specifically, the row's Observation/Problem/Idea is too generic — fix the row, not the template.
7. **Send test to myself**, and read it on your phone. That is where it will be read.
8. Set `SEND.dryRun = false` in `00_Config.gs`.
9. **Install hourly triggers.**

---

## 4. The sheet

| Column | Notes |
|---|---|
| Status | `QUEUED` to start. The script manages it after that. |
| First Name, Company, Title, Email, Website | The basics. |
| Segment | `saas` / `ecommerce` / `edtech` / `services` / `generic` — picks the template set and proof point. |
| **Observation** | What you actually saw. Specific and checkable. |
| **Problem** | What that costs them, in their language. |
| **Idea** | One concrete change. Give it away. |
| Step, Last Sent, Next Send, Thread Id, Message Id | Script-managed — don't edit. |
| Notes, Error | Why a row stalled. |

Budget about 3 minutes per prospect on those three columns. That is the entire job;
everything else in this repo is plumbing around it.

Statuses that permanently stop a sequence: `REPLIED`, `UNSUBSCRIBED`, `BOUNCED`, `ERROR`.

---

## 5. What the script refuses to do

These guards are the difference between an outreach system and a spam cannon:

- **Won't send with a `{{placeholder}}` left unrendered** — one `Hi {{firstName}}` is unrecoverable.
- **Won't send step 1 without Observation, Problem and Idea.**
- **Won't send while a `PROOF` entry still says TODO.**
- **Daily cap (30) and per-run cap (12)**, with a random 20–75 second gap between sends.
- **Business hours only**, weekdays, Asia/Kolkata.
- **Company cooldown** — no two people at the same company inside 14 days.
- **Suppression list** by address *or* whole domain, checked before every send.
- **Opt-out scanning** on a generous match ("not interested" counts). Wrongly removing someone costs one lead; wrongly keeping them costs your domain.
- **Hard-bounce detection**, so a dead address is never hit twice.
- **Script lock**, so two triggers cannot double-send a row.

---

## 6. Sending from your own hosting (`faiz@sheikhfaiz.info`)

Apps Script cannot open a raw SMTP socket, so there are two honest routes.

### Route A — Gmail alias (recommended; 10 minutes, free)

Your hosting mailbox relays through Gmail, and Apps Script keeps sending via `GmailApp`.

1. In your hosting panel (cPanel/Hostinger), create the mailbox `faiz@sheikhfaiz.info` and note its SMTP host, port 465, username and password.
2. Gmail → **Settings → Accounts and Import → Send mail as → Add another email address**.
3. Enter the address, untick "Treat as an alias", and supply the hosting SMTP details. Gmail sends a confirmation to that mailbox — confirm it.
4. In Apps Script: **Project Settings → Script Properties → Add**: `SEND_AS_ALIAS` = `faiz@sheikhfaiz.info`.
5. Keep `SEND.mode = 'GMAIL'`.

You get Gmail's deliverability and threading, your domain in the From line, replies in your normal inbox, and nothing to maintain. Start here.

### Route B — PHP bridge on your hosting (full control)

Use this if you want mail to leave your host's SMTP server directly, or you're past Gmail's ~100/day ceiling.

1. On the server: `composer require phpmailer/phpmailer` inside `public_html/outreach/`.
2. Upload `php-bridge/send.php` to `public_html/outreach/send.php`.
3. Copy `config.sample.php` to `/home/youruser/outreach-config.php` — **outside `public_html`** — fill it in, then `chmod 600`.
4. Generate a secret: `php -r "echo bin2hex(random_bytes(32));"` — same value in the config and in Script Properties.
5. Visit `https://sheikhfaiz.info/outreach/send.php` in a browser. It must return `{"ok":false,"error":"POST only"}`. **If it shows PHP source code, stop immediately** — PHP is not executing and your SMTP password is publicly readable.
6. Script Properties: `BRIDGE_URL` = `https://sheikhfaiz.info/outreach/send.php`, `BRIDGE_SECRET` = the secret, `BRIDGE_FROM` = `faiz@sheikhfaiz.info`.
7. Set `SEND.mode = 'SMTP_BRIDGE'`.

The secret never travels in the request — Apps Script signs the body with HMAC-SHA256
and the bridge recomputes it. Requests expire after 5 minutes, the From domain is locked
to yours, and header injection is blocked.

Replies still need reading: keep `ME.replyTo` as a Gmail address you monitor, or forward
the hosting mailbox into Gmail. `checkReplies` and `processUnsubscribes` read Gmail.

### DNS — do this before either route

Without these three records your mail lands in spam regardless of how good the copy is.

| Record | Type | Value |
|---|---|---|
| SPF | TXT on `sheikhfaiz.info` | `v=spf1 include:_spf.google.com include:<your-host-spf> ~all` |
| DKIM | TXT | Generated in your hosting panel (cPanel → Email Deliverability → *Install the suggested record*). For Route A also enable DKIM in Google Admin if on Workspace. |
| DMARC | TXT on `_dmarc.sheikhfaiz.info` | `v=DMARC1; p=none; rua=mailto:faiz@sheikhfaiz.info` |

Start DMARC at `p=none` and read the reports for two weeks before tightening to `p=quarantine`.

Verify with a free tool like mail-tester.com — send it one real email from the system and aim for 9/10 or better **before** your first campaign.

---

## 7. Warm-up — the part people skip and regret

A domain that has never sent email and suddenly sends 50 cold emails gets filtered,
and the damage takes months to undo. `SEND.dailyCap` starts at 30 for this reason.

| Week | Daily cap | Also do this |
|---|---|---|
| 1 | 5 | Send to friends/colleagues who will reply. Replies are the strongest positive signal there is. |
| 2 | 10 | Watch bounce rate. Above 3% means your list needs verifying, not more sending. |
| 3 | 20 | Check mail-tester again. |
| 4+ | 30–50 | Only if reply rate holds and complaints stay at zero. |

Verify addresses before importing (NeverBounce, ZeroBounce, Hunter). A 5% bounce rate
on a cold domain is enough to get you filtered on its own.

---

## 8. Reading the numbers

The `Log` tab records every event. What is worth watching:

- **Reply rate** (replies ÷ sent) — the only metric that matters. 8–15% is good for tightly targeted founder outreach; under 3% means the Observation column is too generic.
- **Bounce rate** — keep under 2%. Higher means list quality, and it is urgent.
- **Opt-outs** — a couple is normal. A spike means your targeting is wrong, not your copy.

Deliberately **no open tracking**: tracking pixels are a common spam signal, Apple Mail
Privacy Protection has made open rates fiction, and a founder who spots the pixel
distrusts the sender. Replies are the metric.

---

## 9. Legal footing

- Every email carries a plain-language opt-out and a postal address — set a real one in `ME.postalAddress`.
- Opt-outs are honoured automatically and permanently via the Suppression tab, and apply per-address or per-domain.
- This is B2B outreach to a business address about their business, which is the standard basis under CAN-SPAM and the legitimate-interest route under GDPR. **Do not import purchased consumer lists into this**; it is a different legal question and a worse business.
- If you contact someone in the EU/UK, expect to honour deletion requests too — the Suppression tab is your record that you did.

---

## 10. Troubleshooting

| Symptom | Cause |
|---|---|
| "Unresolved placeholder(s)" | A `{{token}}` in your edited template has no matching value in `renderMessage`. |
| "PROOF.saas still says TODO" | Fill in `PROOF` in `00_Config.gs`. |
| "Observation is empty" | Fill the row's three personalisation columns. |
| Nothing sends, log says "Outside send window" | Working as intended — check `SEND.sendHourStart/End` and `weekdaysOnly`. |
| `SEND_AS_ALIAS is not a verified alias` | Finish the Gmail "Send mail as" confirmation step. |
| Bridge HTTP 401 "Bad signature" | `BRIDGE_SECRET` and `config.php` `secret` differ. |
| Bridge HTTP 502 "SMTP: ..." | Wrong SMTP host/port/password — the message after `SMTP:` is your server's own reason. |
| Follow-ups start new threads | Thread Id is blank; harmless, and Gmail search may have missed the sent copy. |
