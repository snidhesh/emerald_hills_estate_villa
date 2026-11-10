# Villa 181 — Emerald Hills, Dubai Hills Estate

Single-page luxury real-estate landing for **Villa 181, Emerald Hills** (Dubai Hills Estate),
a 21,045 sq ft contemporary family home marketed by **BlackOak Real Estate**. Asking AED 89,000,000.

Static site — vanilla HTML / CSS / JS, no framework, no build step. Built on the same
scaffold as the BK82 (Burj Khalifa penthouse) landing page.

## Design

Styled after the `Villa 181 Asset Sheet.pdf` (in `assets/docs/`): deep navy `#09294D`
surfaces with photo overlays, a white "paper" panel for the floor plans, Cormorant Garamond
serif display headings over Inter body text, and pale steel-blue (`#9FB6D1`) tracked
uppercase labels. Palette tokens live in `assets/css/tokens.css`. The floor-plan section mirrors
the sheet's spread: plan drawing on paper (left), level tabs + room table on navy with the two
"pictured" photos per level (right).

---

## Quick start

```bash
bash scripts/optimize-images.sh   # source/Images/*.jpg → assets/img/sections/*-{1600,2400}.webp
bash scripts/optimize-video.sh    # source walkthrough → assets/video/hero.{mp4,webm} + poster
bash scripts/serve.sh             # http://localhost:8080
```

Heavy originals (photos, walkthrough video, PDFs) live in `source/` and are gitignored.
Optimised assets in `assets/` are committed and deployed.

## Stack

- `index.html` — six scroll-snapped full-screen sections: Hero · Gallery · The Setting · Floor Plans · Highlights · Enquire
- Layered CSS via `@import` in `assets/css/main.css` (tokens → reset → base → layout → components → sections → animations)
- ESM modules in `assets/js/` — `main`, `nav`, `reveal`, `gallery`, `plans`, `lead-form`
- Self-hosted Inter + Cormorant Garamond (latin + latin-ext), strict CSP via `<meta>`, no inline scripts/styles
- Dual-tier WebP photos (2400 + 1600), silent MP4 + WebM hero loop, cropped WebP floor plans
- Three JSON-LD blocks (`SingleFamilyResidence` with `Offer`, `RealEstateAgent`, `BreadcrumbList`), `sitemap.xml`, `robots.txt`, `llms.txt`

## Lead capture → BlackOak Studio CRM

The enquiry form posts JSON to the bundled Vercel Function `api/leads.js`, which validates
the payload and forwards it to the Studio public intake endpoint:

```
POST https://studio.blackoak-re.com/api/v1/public/intake/leads
Authorization: Bearer $CRM_TOKEN
{ name, phone, email, requirements, source }
```

`requirements` is built from the property name, preferred date/time and message.
`source` defaults to `emerald-hills-villa-181` so leads can be filtered per landing page.

### Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Required | Notes |
|---|---|---|
| `CRM_TOKEN` | **yes** | Bearer token for the Studio intake API — same value the other BlackOak landing pages use |
| `CRM_URL` | no | Override the intake endpoint (staging, etc.) |
| `CRM_SOURCE` | no | Override the lead source tag |

Without `CRM_TOKEN` the function returns `500 server_misconfigured` and the form shows the fallback
email/phone. Redeploy after adding env vars.

## Deploy to Vercel

```bash
vercel link          # pick team "BlackOak Real Estate"
vercel env add CRM_TOKEN production   # paste the Studio token
vercel --prod
```

Framework preset: **Other**. No build command, output directory = repo root.
`vercel.json` ships security headers and long-lived cache rules for `/assets/*`.

### Before pointing a custom domain

Search for `emerald-hills-villa.vercel.app` and replace with the final domain in:
`index.html` (canonical, OG, JSON-LD), `sitemap.xml`, `robots.txt`, `llms.txt`.

## Image curation

Slugs are mapped from camera filenames in `scripts/optimize-images.sh`. All 33 photos are
converted; the gallery uses 16 of them. Swap a slide by changing the slug in `index.html`
(`src`, `srcset`, and the tag).

Floor-plan drawings were cropped from `source/Villa181_FloorPlans_blackOak.pdf` (pages 2–5)
into `assets/img/plans/{basement,ground,first,roof}.webp`. Both PDFs are served from
`assets/docs/` for download.

## Accessibility

Single `<h1>`, `aria-labelledby` on every section, focus-trapped mobile drawer, keyboard
gallery (← →) and floor-plan tabs (↑ ↓ ← →), honours `prefers-reduced-motion`, skip link.

## License

Photography and copy © BlackOak Real Estate. Code MIT.
