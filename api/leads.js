// Vercel Function — POST /api/leads
// Server-side proxy between the landing-page form and the BlackOak Studio CRM
// intake endpoint, so the CRM token never reaches the browser.
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   CRM_TOKEN   REQUIRED. Bearer token for the Studio public intake API.
//   CRM_URL     optional. Defaults to the Studio production intake endpoint.
//   CRM_SOURCE  optional. Source tag written on the lead. Default below.

const DEFAULT_CRM_URL = 'https://studio.blackoak-re.com/api/v1/public/intake/leads';
const DEFAULT_SOURCE  = 'emerald-hills-villa-181';

const LIMITS = { name: 100, email: 254, phone: 24, message: 1500 };
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_PHONE = /^[\d+\-\s().]{6,24}$/;
const UPSTREAM_TIMEOUT_MS = 10_000;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  let body = req.body;
  try {
    if (typeof body === 'string') body = JSON.parse(body);
    else if (body && Buffer.isBuffer(body)) body = JSON.parse(body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'invalid_body' });

  // Honeypot — accept silently, forward nothing
  if (body._gotcha) return res.status(200).json({ ok: true });

  const lead = {
    name:       clean(body.name,       LIMITS.name),
    email:      clean(body.email,      LIMITS.email),
    phone:      clean(body.phone,      LIMITS.phone),
    visit_date: clean(body.visit_date, 20),
    visit_time: clean(body.visit_time, 10),
    message:    clean(body.message,    LIMITS.message),
  };

  const err = validate(lead);
  if (err) return res.status(400).json({ error: 'validation_failed', message: err });

  const token  = process.env.CRM_TOKEN;
  const crmUrl = process.env.CRM_URL    || DEFAULT_CRM_URL;
  const source = process.env.CRM_SOURCE || DEFAULT_SOURCE;
  if (!token) {
    console.error('[leads] CRM_TOKEN env var is not set');
    return res.status(500).json({ error: 'server_misconfigured' });
  }

  // Studio intake accepts: name, phone, email, requirements, source.
  const requirements = [
    'Property: Villa 181, Emerald Hills, Dubai Hills Estate',
    lead.visit_date && `Preferred date: ${lead.visit_date}`,
    lead.visit_time && `Preferred time: ${lead.visit_time}`,
    lead.message    && `Message: ${lead.message}`,
  ].filter(Boolean).join(' | ');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const r = await fetch(crmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        requirements,
        source,
      }),
      signal: controller.signal,
    });

    if (!r.ok) {
      const text = await r.text().catch(() => '');
      console.error('[leads] CRM rejected', r.status, text.slice(0, 500));
      return res.status(502).json({ error: 'crm_error' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[leads] CRM fetch failed', e?.name === 'AbortError' ? 'timeout' : (e?.message || e));
    return res.status(502).json({ error: 'crm_unreachable' });
  } finally {
    clearTimeout(timer);
  }
}

function clean(v, max) {
  if (v == null) return '';
  // strip control characters, collapse whitespace, truncate
  const s = String(v).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max) : s;
}

function validate(p) {
  if (!p.name)                 return 'Please enter your name.';
  if (!p.email)                return 'Please enter your email.';
  if (!RE_EMAIL.test(p.email)) return 'Please enter a valid email address.';
  if (!p.phone)                return 'Please enter your phone or WhatsApp number.';
  if (!RE_PHONE.test(p.phone)) return 'Phone number contains invalid characters.';
  return null;
}
