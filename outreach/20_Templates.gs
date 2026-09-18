/**
 * 20_Templates.gs — the messages.
 *
 * THE PRINCIPLE BEHIND EVERY TEMPLATE
 * A founder or CEO reads email in a 4-second triage loop: "is this about me,
 * or about you?" Anything that opens with who you are gets deleted. So every
 * step below follows the same skeleton:
 *
 *   1. OBSERVATION  something specific and true about THEIR business
 *   2. PROBLEM      what that quietly costs them, in money or time
 *   3. IDEA         one concrete thing you would change (given away free)
 *   4. PROOF        one number from someone like them
 *   5. TINY ASK     a yes/no question, never "let's hop on a 30-min call"
 *
 * You supply 1-3 per prospect in the sheet. The template supplies 4-5.
 * That split is what makes 300 personalised emails possible in a morning.
 *
 * Hard rules baked in:
 *   - No attachments and no images on step 1. Both hurt deliverability.
 *   - Under ~120 words on step 1. It is read on a phone, between meetings.
 *   - One link maximum, and it goes to your portfolio, not a calendar.
 *   - Every mail carries a one-click opt-out. Non-negotiable, legally and
 *     practically: a reported email costs you the domain, not just the lead.
 */

/** Subject lines. One is chosen per prospect, stable per email (see pickVariant). */
var SUBJECTS = {
  1: ['{{company}} — quick thought on {{subjectHook}}',
      '{{firstName}}, noticed this on {{company}}',
      'idea for {{company}}'],
  2: ['re: {{company}} — the number behind it',
      '{{firstName}}, one more on {{company}}'],
  3: ['{{firstName}} — want the teardown?',
      'free teardown for {{company}}?'],
  4: ['closing the loop, {{firstName}}',
      'should I stop here?']
};

/**
 * BODIES[segment][step] -> plain text body.
 * Segment falls back to 'generic' when a prospect's segment has no entry.
 */
var BODIES = {

  /* ---------------------------------------------------------------- SaaS */
  saas: {
    1: [
      'Hi {{firstName}},',
      '',
      '{{observation}}',
      '',
      'Usually that means {{problem}} — which for a team your size is the difference between a founder-led pipeline and one that runs without you.',
      '',
      'The fix I would start with: {{idea}}.',
      '',
      'I did something similar recently and {{proofResult}}.',
      '',
      'Worth me sending over the specifics for {{company}}? One line back — yes or no — is all I need.',
      '',
      '{{signature}}'
    ],
    2: [
      'Hi {{firstName}},',
      '',
      'Following up with the number, since that is the only part that matters.',
      '',
      '{{proofResult}}. The lever was {{proofHow}} — not more spend.',
      '',
      'For {{company}} the same logic points at {{idea}}. I would expect the first movement inside three weeks, because it changes the top of the funnel rather than the bottom.',
      '',
      'Want me to map it out against your current flow?',
      '',
      '{{signature}}'
    ],
    3: [
      'Hi {{firstName}},',
      '',
      'Different approach: let me just do the work.',
      '',
      'I will record a 6-minute teardown of {{company}}\'s signup-to-activation path — where people drop, what I would change, in what order. Yours whether we ever speak again.',
      '',
      'Reply "send it" and it is in your inbox tomorrow.',
      '',
      '{{signature}}'
    ],
    4: [
      'Hi {{firstName}},',
      '',
      'I have written three times, which is my limit — you are running a company, not managing my pipeline.',
      '',
      'Closing the file. If {{problem}} becomes urgent later, my work is at {{portfolio}} and this thread still works.',
      '',
      'Good luck with {{company}}.',
      '',
      '{{signature}}'
    ]
  },

  /* ----------------------------------------------------------- Ecommerce */
  ecommerce: {
    1: [
      'Hi {{firstName}},',
      '',
      '{{observation}}',
      '',
      'On a D2C catalogue that normally shows up as {{problem}} — you pay for the click twice and convert it once.',
      '',
      'First thing I would change: {{idea}}.',
      '',
      'On a comparable account, {{proofResult}}.',
      '',
      'Want the breakdown for {{company}}? Yes or no is fine.',
      '',
      '{{signature}}'
    ],
    2: [
      'Hi {{firstName}},',
      '',
      'The specific number from last time: {{proofResult}}.',
      '',
      'It came from {{proofHow}}. No budget increase — the spend was already there, it was just landing on the wrong inventory.',
      '',
      '{{company}} looks like the same shape. {{idea}} is where I would start.',
      '',
      'Shall I send the two screenshots that show it?',
      '',
      '{{signature}}'
    ],
    3: [
      'Hi {{firstName}},',
      '',
      'Simplest version: I will audit {{company}}\'s ad account and product feed and send you the three changes I would make first, ranked by revenue impact. Free, no call needed.',
      '',
      'Reply "audit" and I will start today.',
      '',
      '{{signature}}'
    ],
    4: [
      'Hi {{firstName}},',
      '',
      'Last one from me — three emails is where I stop.',
      '',
      'If {{problem}} is still costing you next quarter, the offer stands. Work samples: {{portfolio}}',
      '',
      'Best with {{company}}.',
      '',
      '{{signature}}'
    ]
  },

  /* -------------------------------------------------------------- EdTech */
  edtech: {
    1: [
      'Hi {{firstName}},',
      '',
      '{{observation}}',
      '',
      'In EdTech that usually means {{problem}} — leads are not the constraint, the gap between enquiry and first conversation is.',
      '',
      'What I would change first: {{idea}}.',
      '',
      'Doing exactly that, {{proofResult}}.',
      '',
      'Useful to see how it maps to {{company}}? One word back works.',
      '',
      '{{signature}}'
    ],
    2: [
      'Hi {{firstName}},',
      '',
      'The detail I left out: {{proofResult}}, and the lever was {{proofHow}}.',
      '',
      'Counsellor time is the expensive resource, not ad spend — every no-show is a paid hour burned. {{idea}} protects that hour at {{company}}.',
      '',
      'Want the sequence I used, so your team can run it themselves?',
      '',
      '{{signature}}'
    ],
    3: [
      'Hi {{firstName}},',
      '',
      'Let me be concretely useful instead of persistent.',
      '',
      'I will write out the exact 3-touch follow-up (timing, channel, copy) for {{company}}\'s enquiry-to-counselling flow and send it over. Yours to use with or without me.',
      '',
      'Reply "send" and it is done.',
      '',
      '{{signature}}'
    ],
    4: [
      'Hi {{firstName}},',
      '',
      'Third and final — I will assume the timing is wrong rather than keep asking.',
      '',
      'Thread stays open if {{problem}} moves up your list. Work: {{portfolio}}',
      '',
      'All the best with {{company}}.',
      '',
      '{{signature}}'
    ]
  },

  /* ------------------------------------------------- Agencies / Services */
  services: {
    1: [
      'Hi {{firstName}},',
      '',
      '{{observation}}',
      '',
      'For a services business that tends to mean {{problem}} — revenue tracks your personal calendar, so growth and your evenings compete.',
      '',
      'Where I would start: {{idea}}.',
      '',
      '{{proofResult}}.',
      '',
      'Want the outline? Yes or no.',
      '',
      '{{signature}}'
    ],
    2: [
      'Hi {{firstName}},',
      '',
      'To put a number on it: {{proofResult}}, via {{proofHow}}.',
      '',
      'Nothing exotic — it removed the founder from the first two steps of the sales conversation. {{idea}} does the same at {{company}}.',
      '',
      'Shall I send the structure?',
      '',
      '{{signature}}'
    ],
    3: [
      'Hi {{firstName}},',
      '',
      'I will just build a piece of it for free: the inbound qualification flow for {{company}}, written out end to end. Use it in-house if you like it.',
      '',
      'Reply "yes" and I will send it this week.',
      '',
      '{{signature}}'
    ],
    4: [
      'Hi {{firstName}},',
      '',
      'Closing this out — you have a business to run.',
      '',
      'If {{problem}} gets loud later: {{portfolio}}, or just reply here.',
      '',
      'Best with {{company}}.',
      '',
      '{{signature}}'
    ]
  },

  /* ------------------------------------------------------------- Generic */
  generic: {
    1: [
      'Hi {{firstName}},',
      '',
      '{{observation}}',
      '',
      'Which usually means {{problem}}.',
      '',
      'The first thing I would change: {{idea}}.',
      '',
      '{{proofResult}}.',
      '',
      'Worth 5 minutes of your time, or not right now? Either answer is useful.',
      '',
      '{{signature}}'
    ],
    2: [
      'Hi {{firstName}},',
      '',
      'Adding the proof so this is not just an opinion: {{proofResult}} — through {{proofHow}}.',
      '',
      'At {{company}}, {{idea}} is the equivalent move.',
      '',
      'Want the detail?',
      '',
      '{{signature}}'
    ],
    3: [
      'Hi {{firstName}},',
      '',
      'Rather than ask again, I will do the work: a short written teardown of {{company}}\'s current funnel, the three things I would fix, in order. Free, yours regardless.',
      '',
      'Reply "send it" and I will get started.',
      '',
      '{{signature}}'
    ],
    4: [
      'Hi {{firstName}},',
      '',
      'Last email — I stop at three.',
      '',
      'If {{problem}} becomes a priority, everything I do is at {{portfolio}}.',
      '',
      'Good luck with {{company}}.',
      '',
      '{{signature}}'
    ]
  }
};

/** Signature. Deliberately plain — no images, no logo, no tracking pixel. */
function buildSignature() {
  return [
    ME.name,
    ME.title + ' · ' + ME.city,
    ME.portfolio,
    ME.phone
  ].join('\n');
}

/** Footer carrying the opt-out and postal address, appended to every email. */
function buildFooter(email) {
  return [
    '',
    '',
    '--',
    'You received this because I thought it was directly relevant to your business.',
    'Reply "unsubscribe" and I will remove you immediately and permanently.',
    ME.postalAddress
  ].join('\n');
}

/**
 * Deterministic variant choice: the same prospect always gets the same
 * subject line for a given step, so a follow-up never contradicts the first
 * email, but the population still splits roughly evenly for A/B reading.
 */
function pickVariant(list, email, step) {
  var h = 0, key = String(email) + '|' + step;
  for (var i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) % 100000;
  }
  return list[h % list.length];
}
