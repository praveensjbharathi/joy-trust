# JOY Social Welfare Trust website

Production-ready source for **joysocialwelfaretrust.com**.

The site uses a white background, the final approved JOY logo, responsive
mobile/tablet/desktop layouts, accessible navigation, restrained 3D tilt and
scroll animation, and reduced-motion support.

## Included pages

- Home
- About
- Programmes
- Future goals
- Governance
- Donate
- Ask for support
- Custom 404 page

The governance and programme copy is based on the public charitable objects in
the Trust Deed. Private identity numbers and residential details are not
published.

## Project structure

- `dist/` — complete static website; upload this folder's **contents** to the
  web root
- `dist/assets/site-config.js` — public Supabase form configuration
- `supabase/` — private-data schema and validated Edge Function source
- `.openai/hosting.json` — existing Sites project binding
- `HOSTING-GUIDE.md` — GoDaddy, Sites, SSL and Supabase instructions

## Local preview

From the project root:

```bash
python3 -m http.server 8080 --directory dist
```

Then open `http://localhost:8080`.

Do not open the HTML files directly from the filesystem because the site uses
root-relative URLs.

## Safe production checklist

1. Choose one frontend host: the existing Sites deployment or GoDaddy Web
   Hosting.
2. Follow `HOSTING-GUIDE.md` for the matching DNS setup.
3. Create a **separate** Supabase project for the Trust; never reuse Joy Payroll.
4. Deploy the supplied schema and Edge Function.
5. Put only the function URL and public publishable key in
   `dist/assets/site-config.js`.
6. Test both forms and confirm that public users cannot read submitted records.
7. Add verified Trust payment details only after bank, receipt and tax-status
   documentation has been approved.

The forms retain an email fallback until Supabase is configured, so enquiries
are not silently discarded.

