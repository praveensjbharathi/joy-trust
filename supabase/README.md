# Supabase backend setup

Use a dedicated Supabase project named **JOY Social Welfare Trust**. Do not run
this schema in the existing **Joy Payroll** project.

## What this backend stores

- Donation enquiries (no money is transferred by the form)
- Initial support requests
- Review status for authorised Trust staff

Public visitors cannot read either table. Row Level Security is enabled and
table access is revoked from the anonymous and authenticated browser roles.

## Setup

1. Create or select the dedicated Trust project.
2. Run `schema.sql` in the Supabase SQL editor.
3. Deploy the `intake` Edge Function with JWT verification disabled as defined
   in `config.toml`.
4. Set the function secret `ALLOWED_ORIGINS` to:

   `https://joysocialwelfaretrust.com,https://www.joysocialwelfaretrust.com`

5. Copy the function URL and the project's public publishable key into:

   `dist/assets/site-config.js`

   These two values are safe for the browser. Never place a secret key or
   service-role key in `dist`.
6. Submit one donation enquiry and one support request, then confirm each row
   appears in the correct table.
7. Review Supabase security advisors before production use.

The website automatically falls back to a pre-filled email when the endpoint is
not configured or temporarily unavailable.

