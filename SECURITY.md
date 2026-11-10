# Security policy — BK82 landing

## Reporting

Email **security@blackoak.example** with reproduction steps. We aim to respond within 3 business days.

## Static-site hardening summary

This is a single-page static site with one outbound POST (the lead form). All hardening below is enforced by `index.html` meta + JS sanitisation. Host-level headers are still required at deploy.

### Content-Security-Policy

Strict policy declared via `<meta http-equiv>`. No `'unsafe-inline'`, no `'unsafe-eval'`. All JS/CSS is external. The CRM proxy host must be appended to `connect-src` and `form-action`.

### Outbound network

The lead form POSTs JSON to **`/api/leads`** (same-origin) — a Vercel Function at `api/leads.js` that holds the CRM secret in env vars and forwards to the real CRM. The browser never sees the API key. The CSP only needs `connect-src 'self'`.

If migrating off Vercel, replicate the same proxy pattern on the new host (Netlify Function, Cloudflare Worker, etc.) — never put a CRM API key in client JS.

### Form

- Client-side validation: required, length caps, email and phone format.
- Honeypot `_gotcha` — silently drops bots.
- 30 s submit cooldown.
- Output rendering uses `textContent` only (XSS safe).
- `mode: 'cors'`, `credentials: 'omit'`.

### Asset privacy

- `cwebp -metadata none` strips EXIF/ICC including GPS.
- `ffmpeg -an` removes audio from the hero loop.
- Originals (MOV, full-res JPGs) are gitignored.

## Host headers

On Vercel these are set automatically via `vercel.json`. On other hosts, replicate:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Cache-Control:
  *.html        no-cache
  *.webp,*.mp4,*.webm,*.woff2  public, max-age=31536000, immutable
```

## Verification

- Mozilla Observatory — target grade A+
- securityheaders.com — target grade A+
- Lighthouse → Best Practices = 100
