# Sheikh Faiz — Portfolio Website

The source for **sheikhfaiz.info** — a static, hand-built portfolio for Sheikh Faiz,
Digital Marketing & Growth Manager (Mumbai / Thane, Maharashtra, India).

No build step, no framework, no dependencies. Every page is a self-contained HTML
file with its CSS and JavaScript inline, so it can be opened straight from disk or
served by any static host.

---

## Live site

| Where | URL |
| --- | --- |
| GitHub Pages | `https://sheikhfaiz078.github.io/portfolio/` |
| Custom domain | `https://sheikhfaiz.info/` |

See **[Hosting on GitHub Pages](#hosting-on-github-pages)** below for the one-time setup.

---

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `about.html` | About |
| `who-is-sheikh-faiz.html` | Who Is Sheikh Faiz |
| `services.html` | All Services |
| `performance-marketing.html` | Performance Marketing |
| `google-ads.html` | Google Ads |
| `meta-ads.html` | Meta Ads |
| `chatgpt-ads.html` | ChatGPT Ads |
| `linkedin-marketing.html` | LinkedIn Marketing |
| `email-whatsapp-marketing.html` | Email & WhatsApp Marketing |
| `seo.html` | SEO |
| `ui-ux.html` | UI/UX Design |
| `projects.html` | Projects |
| `case-studies.html` | Case Studies |
| `Resume.html` | Resume (with PDF download) |
| `contact.html` | Contact |
| `404.html` | Not-found page (served automatically by GitHub Pages) |

## Supporting files

| File | Purpose |
| --- | --- |
| `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png` | Browser tab icons |
| `apple-touch-icon.png` | iOS home-screen icon (180×180) |
| `images/icon-192.png`, `images/icon-512.png` | PWA / manifest icons |
| `images/sf-logo.png` | Full-resolution SF logo |
| `og-image.png` | Social share card (1200×630) for Open Graph and Twitter |
| `site.webmanifest` | Web app manifest |
| `robots.txt` | Crawler rules, points to the sitemap |
| `sitemap.xml` | All 16 public pages |
| `llms.txt` | Plain-text summary for AI assistants and LLM crawlers |
| `.nojekyll` | Tells GitHub Pages to serve files as-is, without Jekyll |
| `.github/workflows/pages.yml` | Automatic deploy to GitHub Pages on push to `main` |

---

## Hosting on GitHub Pages

Pages has to be switched on once by hand — it cannot be enabled from a commit.

### Option A — deploy from a branch (simplest)

1. Merge this branch into `main`.
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Pick branch `main`, folder `/ (root)`, and press **Save**.
5. Wait about a minute. The site goes live at
   `https://sheikhfaiz078.github.io/portfolio/`.

### Option B — deploy with the included workflow

1. Merge this branch into `main`.
2. Go to **Settings → Pages**.
3. Under **Source**, choose **GitHub Actions**.
4. `.github/workflows/pages.yml` then runs on every push to `main` and publishes
   the site. Progress is visible under the **Actions** tab.

### Using the custom domain

To serve the site at `sheikhfaiz.info` instead:

1. In **Settings → Pages → Custom domain**, enter `sheikhfaiz.info` and save.
   GitHub creates a `CNAME` file in the repository.
2. At the DNS provider for `sheikhfaiz.info`, add these `A` records for the apex:

   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   And a `CNAME` record for `www` pointing at `sheikhfaiz078.github.io`.
3. Once DNS resolves, tick **Enforce HTTPS**.

No `CNAME` file is committed here on purpose — adding one would immediately
redirect the domain, which would break the site if it is currently hosted
somewhere else.

---

## Known limitations

**The contact forms will not send email on GitHub Pages.**
Every form posts JSON to `/send-email.php`. GitHub Pages serves static files only
and cannot execute PHP, so submissions return a 404 and the page shows a network
error. The email and phone links on every page still work.

Two ways to fix it:

- Host on a server that runs PHP (shared hosting, cPanel, VPS) and keep
  `send-email.php` alongside the HTML; or
- Point the forms at a hosted form service. In each page's lead-form script,
  change the endpoint:

  ```js
  var EP = "/send-email.php";                              // before
  var EP = "https://formspree.io/f/YOUR_FORM_ID";          // after
  ```

  Formspree, Web3Forms and Getform all accept the JSON payload this form already
  sends (`name`, `email`, `phone`, `message`, `source`).

**The portrait photo is not in the repository.**
`who-is-sheikh-faiz.html` looks for `images/sheikh-faiz-portrait.jpg` (with a
`.webp` alternative). Until those are added the page falls back to an "SF"
monogram automatically — nothing breaks, but adding the real photo is better:

```
images/sheikh-faiz-portrait.jpg
images/sheikh-faiz-portrait.webp
```

**Canonical and social tags point at `sheikhfaiz.info`.**
That is deliberate — it keeps search engines and social previews attributed to the
production domain. On the `github.io` preview URL the social card image is fetched
from `sheikhfaiz.info`, so it only renders once that domain is live.

**The PWA icons are upscaled.**
`images/icon-192.png` and `images/icon-512.png` are scaled up from a 180×180
source. Replacing them with exports from the original artwork will look sharper.

---

## Editing

Each page is standalone. To change something site-wide — the navigation, the
footer, the colour tokens in `:root` — the same block has to be edited in every
HTML file. Searching for these markers helps:

- `<!-- SF:HEAD -->` … `<!-- /SF:HEAD -->` — meta tags, icons, Open Graph
- `<!-- SF:SCHEMA -->` … `<!-- /SF:SCHEMA -->` — JSON-LD structured data
- `===== UNIFIED HEADER / FOOTER SYSTEM =====` — shared nav and footer CSS

To preview locally:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

---

## Analytics

Google Analytics 4 (`G-JWH4720J9F`) is loaded on every page via gtag.js.

---

© 2026 Sheikh Faiz. All rights reserved.
