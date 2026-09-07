# Hosting and domain guide

## Recommended architecture

- **Frontend:** existing OpenAI Sites deployment
- **Domain and DNS:** GoDaddy
- **Database and form intake:** a dedicated Supabase project
- **Public address:** `https://joysocialwelfaretrust.com`

Supabase is the backend. Its custom-domain feature is for Supabase APIs and is
not intended to host the public HTML website.

## Option A — keep the website on Sites

In GoDaddy DNS, configure the following records for the existing Sites custom
domain:

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| A | @ | 162.159.143.30 | 600 seconds or default |
| A | @ | 172.66.3.26 | 600 seconds or default |
| TXT | _openai-site-verification | openai-site-verification=o4xUaOrS9rtoBopk9VAETq25XU76MCGpSihD-trD6IA | 600 seconds or default |
| TXT | _cf-custom-hostname | 19040607-3590-41af-a568-86b2cbe19564 | 600 seconds or default |

Remove only conflicting website records at `@` after confirming they are not
used by another website. Do not remove MX records or unrelated email-verification
TXT records.

DNS validation and SSL issuance can take time after the records propagate. The
domain is ready only when both the custom-domain status and SSL status show
active.

## Option B — use GoDaddy Web Hosting

Use this option only if a GoDaddy hosting plan is attached to the domain:

1. Open the hosting File Manager.
2. Open `public_html` (or the document root shown by GoDaddy).
3. Upload the **contents** of `dist/`, including the hidden `.htaccess` file.
4. Keep the DNS records supplied by that GoDaddy hosting plan instead of the
   Sites A records above.
5. Enable the GoDaddy SSL certificate and force HTTPS.
6. Test every page, the mobile menu, the donation form, the support form and the
   404 page.

Do not point the same apex domain to both Sites and GoDaddy Web Hosting.

## Supabase form connection

Follow `supabase/README.md`. After deploying the function, edit:

`dist/assets/site-config.js`

```js
window.JOY_SITE_CONFIG = Object.freeze({
  supabaseIntakeUrl: "https://YOUR_PROJECT.supabase.co/functions/v1/intake",
  supabasePublishableKey: "sb_publishable_YOUR_PUBLIC_KEY",
  fallbackEmail: "info@joycorporatesolutions.com"
});
```

The publishable key is intended for browser use. Never put a secret key,
database password or service-role key anywhere under `dist/`.

