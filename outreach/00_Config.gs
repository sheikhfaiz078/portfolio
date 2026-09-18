/**
 * 00_Config.gs — every knob you will realistically touch lives here.
 *
 * Nothing secret goes in this file. Passwords, API keys and the PHP bridge
 * secret live in Script Properties (Project Settings > Script Properties),
 * because this file is readable by anyone you share the Sheet with.
 */

/** Who the email is from — your positioning, pulled from sheikhfaiz.info. */
var ME = {
  name:      'Sheikh Faiz',
  title:     'Digital Marketing & Sales Executive',
  tagline:   'Turning ideas into impactful digital campaigns',
  city:      'Mumbai',
  phone:     '+91 99676 29945',
  portfolio: 'https://sheikhfaiz.info/',
  linkedin:  'https://www.linkedin.com/in/sheikh-faiz-143717261',
  resume:    'https://drive.google.com/file/d/1A9XVBbwxIcuepi6Xft-QI9RBMbteslgR/view?usp=sharing',

  // Address shown in the footer. CAN-SPAM and most Indian B2B norms expect a
  // real postal address. Put a real one here before your first send.
  postalAddress: 'Mumbai, Maharashtra, India',

  // Where replies land. Keep this a mailbox you actually watch every day —
  // reply detection (see 40_Replies.gs) reads this mailbox via Gmail.
  replyTo: 'sheikhfaiz078@gmail.com'
};

/**
 * PROOF — the part that decides whether a founder replies.
 *
 * A CEO does not care that you "do digital marketing". They care that someone
 * with their exact problem got a number they wanted. Replace every TODO below
 * with something true and specific. If you cannot fill a slot honestly, delete
 * that segment rather than inventing a number — one fabricated stat that gets
 * checked ends the relationship and your domain reputation with it.
 */
var PROOF = {
  saas: {
    // e.g. 'cut demo no-shows from 46% to 19% for a 12-person B2B SaaS in 6 weeks'
    result: 'TODO: one sentence, one number, one timeframe',
    how:    'TODO: the single lever that did it (e.g. rebuilt the trial-to-demo email sequence)'
  },
  ecommerce: {
    result: 'TODO: e.g. brought blended ROAS from 1.8 to 3.1 on INR 4L/mo spend',
    how:    'TODO: e.g. killed 60% of the ad sets and rebuilt the catalog feed'
  },
  edtech: {
    result: 'TODO: e.g. lifted counsellor-call show rate 28% with a 3-touch WhatsApp + email flow',
    how:    'TODO: the lever'
  },
  services: {
    result: 'TODO: e.g. took an agency from 4 to 11 qualified calls/month with no ad spend increase',
    how:    'TODO: the lever'
  },
  generic: {
    result: 'TODO: your single best result, used when no segment matches',
    how:    'TODO: the lever'
  }
};

/** Sending behaviour. Conservative on purpose — see README "Warm-up". */
var SEND = {
  // 'GMAIL'       — send through the Google account that owns this script.
  // 'SMTP_BRIDGE' — send through your hosting's SMTP via the PHP bridge
  //                 (outreach/php-bridge/send.php). See README section 6.
  mode: 'GMAIL',

  // Hard ceiling per calendar day across all runs. Consumer Gmail allows ~100
  // recipients/day, Workspace ~1500. Cold outreach should sit far below either.
  dailyCap: 30,

  // Ceiling for a single trigger run, so one run cannot burn the whole day.
  perRunCap: 12,

  // Only send inside these hours, in the timezone below. Founders open mail
  // early; 8-11am local has consistently outperformed afternoon in B2B tests.
  timezone: 'Asia/Kolkata',
  sendHourStart: 8,
  sendHourEnd: 18,

  // Skip Saturday and Sunday.
  weekdaysOnly: true,

  // Random pause between sends (ms), so the pattern is not machine-regular.
  minGapMs: 20000,
  maxGapMs: 75000,

  // Do not email two people at the same company within this many days.
  companyCooldownDays: 14,

  // Follow-up spacing, in days after the previous step in that thread.
  stepDelaysDays: [0, 3, 5, 7],

  // Send follow-ups as replies inside the original thread (Gmail mode only).
  // Threaded follow-ups read as persistence; separate emails read as spam.
  threadFollowUps: true,

  // Set true to render and log everything without sending a single email.
  dryRun: true
};

/** Sheet names. Change only if you rename the tabs. */
var SHEETS = {
  prospects: 'Prospects',
  log: 'Log',
  suppression: 'Suppression'
};

/** Column headers, in order. 10_Setup.gs writes these; the code reads by name. */
var COLUMNS = [
  'Status',        // QUEUED | SENT | REPLIED | BOUNCED | UNSUBSCRIBED | SKIPPED | ERROR
  'First Name',
  'Company',
  'Title',
  'Email',
  'Website',
  'Segment',       // saas | ecommerce | edtech | services | generic
  'Observation',   // what you actually saw on their site/LinkedIn — REQUIRED
  'Problem',       // the cost of that observation, in their words — REQUIRED
  'Idea',          // the one specific thing you would do — REQUIRED
  'Step',          // 0 = nothing sent yet
  'Last Sent',
  'Next Send',
  'Thread Id',
  'Message Id',
  'Notes',
  'Error'
];
