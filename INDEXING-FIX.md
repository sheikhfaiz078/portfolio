# Why the two freelance pages aren't indexing — and how to fix it

Pages in question:

- `https://sheikhfaiz.info/freelance-web-designer-mumbai.html`
- `https://sheikhfaiz.info/freelance-digital-marketer-mumbai.html`

Both render correctly in a browser, so this is **not** a hosting or markup problem.
A page that loads fine but will not index almost always fails on one of the four
checks below. They are ordered by how often they turn out to be the cause.

> **Important:** the live site is hosted on Hostinger, not from this repository.
> Nothing in this repo reaches the live site automatically. The files changed here
> must be uploaded to Hostinger (`public_html`) for any of it to take effect.

---

## 1. Wrong canonical tag (check this first)

These two pages were almost certainly built by copying an existing page. If the
copied `<link rel="canonical">` was never updated, it still points at the page it
was copied from — which tells Google "don't index me, index that other page
instead." Google obeys this, the page stays out of the index, and the page still
looks perfect to a human visitor. This is the single most common cause of exactly
this symptom.

Open each page, press `Ctrl+U` (view source), and search for `canonical`.

Each page must point at **itself**:

```html
<!-- in freelance-web-designer-mumbai.html -->
<link rel="canonical" href="https://sheikhfaiz.info/freelance-web-designer-mumbai.html">

<!-- in freelance-digital-marketer-mumbai.html -->
<link rel="canonical" href="https://sheikhfaiz.info/freelance-digital-marketer-mumbai.html">
```

If it names any other page (`services.html`, `ui-ux.html`, `index.html`, …), that
is the bug. Fix it and re-request indexing.

## 2. A stray `noindex`

Same view-source check, search for `robots`. Every other page on the site uses:

```html
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
```

If either page instead says `noindex` (again, easy to inherit by copying from
`404.html`, which is correctly set to `noindex,follow`), remove it and replace it
with the line above.

Also confirm the server isn't sending an `X-Robots-Tag: noindex` header — in
Hostinger, check for any rule in `public_html/.htaccess`.

## 3. The pages were orphans — **fixed in this repo**

Neither page had a single internal link pointing to it anywhere on the site, and
neither appeared in `sitemap.xml`. With no links in and no sitemap entry, Google
has no route to the page and very little reason to prioritise it. Pages in that
state typically sit in Search Console as *"Discovered – currently not indexed"* or
never get crawled at all.

This part is now fixed in this repository:

| File | Change |
| --- | --- |
| all 17 `.html` files | both pages added to the **Services** nav dropdown and the footer **Services** column |
| `sitemap.xml` | both URLs added (now 18 URLs) |
| `llms.txt` | both pages listed under Core services |

That gives each page 34 internal links instead of zero.

## 4. Thin or duplicate content

The site already has `ui-ux.html` (web design) and `services.html` /
`performance-marketing.html` (digital marketing). If the two freelance pages
largely restate that same content, Google may crawl them and then decline to index
them as duplicates — Search Console reports this as *"Crawled – currently not
indexed."*

If that's the status you see, the fix is editorial rather than technical: each page
needs material the other pages don't have — local Mumbai specifics, pricing or
engagement models, named projects, a distinct FAQ.

---

## What to do, in order

1. **Fix the canonical and robots tags** on both live pages if checks 1 or 2 found
   a problem. Nothing else matters until these are right.
2. **Upload the changed files** from this repo to Hostinger `public_html`:
   `sitemap.xml`, `llms.txt`, and the 17 `.html` files.
   ⚠️ See the warning below before bulk-uploading the HTML.
3. **Resubmit the sitemap** — Search Console → Sitemaps → enter `sitemap.xml` →
   Submit.
4. **Request indexing for each page** — Search Console → URL Inspection → paste the
   full URL → *Request indexing*. Do this once per page.
5. **Read what URL Inspection reports.** It names the exact reason, and that reason
   tells you which section above applies. Don't skip this step — it replaces all
   guesswork.
6. **Wait.** Even with everything correct, a new page on a low-authority domain can
   take one to three weeks to appear. Repeatedly requesting indexing does not speed
   it up.

### ⚠️ Before you bulk-upload the HTML files

This repository is **behind** the live site — the live site has at least these two
pages that the repo does not. If you upload all 17 HTML files over the live ones,
you will overwrite any newer edits made directly on Hostinger.

The safe route is to apply the link change by hand to your live files instead. In
each page, find the Services dropdown in the nav and the Services column in the
footer, and add these two links:

```html
<a href="freelance-web-designer-mumbai.html">Freelance Web Designer</a><a href="freelance-digital-marketer-mumbai.html">Freelance Digital Marketer</a>
```

In the nav, insert them immediately before:

```html
<a href="services.html" class="all">All Services</a>
```

In the footer, insert them immediately after:

```html
<a href="ui-ux.html">UI/UX</a>
```

`sitemap.xml` and `llms.txt` are safe to upload as-is **if** your live site has no
pages beyond the 18 now listed. If it has others, add the two new `<url>` blocks to
your existing sitemap rather than replacing the file.

---

## Things that are already fine — don't chase these

- `robots.txt` is permissive (`User-agent: * / Allow: /`) and points at the sitemap.
- All 16 original pages have a correct self-referencing canonical, `index,follow`,
  JSON-LD structured data and exactly one `<h1>`.
- The pages render server-side as plain HTML, so there's no JavaScript-rendering
  problem for Googlebot.
