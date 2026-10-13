# Sending the account emails from the app (spike)

Decision record for AGP-76. The question: can the front end send the two account emails
itself instead of handing them to the user's mail client, and should it?

## What exists today

The app composes two emails and sends neither. Both are `mailto:` links, so the message
is only ever drafted in whatever mail client the device has:

| Mail          | Who sends                  | Where                                                                                    | Body builder                      |
| ------------- | -------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------- |
| Reset request | the user, to the admin     | `reset-password-card.tsx` → "Solicitar" opens a mail to `ADMIN_EMAIL`                    | `src/lib/auth/reset-request.ts`   |
| Setup link    | the admin, to the new user | `create-user-dialog.tsx` → "Enviar por email" after `POST /api/auth/admin/users/create/` | `src/lib/auth/setup-link-mail.ts` |

Both builders are pure and unit-tested (`tests/unit/lib/auth/`), so their Spanish bodies
can be reused as the `text` of a real mail unchanged.

Two things worth knowing before choosing anything:

- `ADMIN_EMAIL` is still the placeholder `admin@admin.org` (`TODO(auth-admin-email)`). The
  reset request has no real destination yet, whichever transport it uses.
- The API returns the one-time link (`reset_link`, `expires_at`) and sends no mail. The
  admin is whoever `GET /api/auth/me/` reports with `is_staff: true`.

Why the `mailto:` hurts: it needs a configured mail client on the device (often absent on
a managed laptop or a phone), leaves no delivery record, and routes a one-time credential
through the admin's personal mailbox.

## Options

Pricing checked on the providers' own pages; the volume is tens of mails a month.

| Option                   | Shape                                                     | Cost at our volume                                                                            | Secret / setup on our side                                                                                                                            | Deliverability and bounces                                                                               | Data location                                                                      |
| ------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Resend**               | HTTP API, `resend` Node SDK (`{ data, error }`, no throw) | Free: 3,000/month, 100/day, 3 domains, 30-day logs. Pro $20 for 50,000.                       | One API key as a server env. Domain verification = DKIM + SPF (+ DMARC) DNS records.                                                                  | Dashboard log per mail; webhooks `email.bounced`, `email.failed`, `email.complained`, `email.delivered`. | Sending region selectable (incl. Ireland); account data and logs stored in the US. |
| **Twilio SendGrid**      | HTTP API, `@sendgrid/mail`                                | Free plan retired May 2025; 60-day trial then Essentials from $19.95/month (50,000).          | Same key + DNS shape, heavier dashboard.                                                                                                              | Event webhooks, bounce lists.                                                                            | US by default; EU residency on paid tiers, to confirm.                             |
| **Amazon SES**           | AWS SDK v3                                                | $0.10 per 1,000 à la carte; new accounts get $200 credits for 6 months, no monthly allowance. | IAM user/role + key, region choice, DNS, and a sandbox exit request (Trust & Safety; until then only verified recipients, 200/day).                   | SNS/EventBridge notifications; more wiring.                                                              | Region of our choice (São Paulo available).                                        |
| **Nodemailer over SMTP** | Library, not a service                                    | Free; the SMTP account is the cost.                                                           | SMTP host + credentials as server envs. **No DNS work if the account lives on a domain that already sends mail** (an institutional no-reply mailbox). | Whatever the mail server reports; bounces come back to the mailbox, not to us.                           | Wherever the mail server is.                                                       |
| **Backend sends**        | Django `send_mail` behind the existing endpoints          | Free for us; GMV's time.                                                                      | Nothing on our side. GMV still needs an SMTP account or provider and the same DNS.                                                                    | Their choice.                                                                                            | Their choice.                                                                      |
| **Keep the `mailto:`**   | Status quo                                                | Zero.                                                                                         | Nothing.                                                                                                                                              | None: no record, fails silently on devices without a mail client.                                        | n/a                                                                                |

All four providers are organisation-approved tooling, so the choice is on fit, not policy.

## What the app needs regardless of provider

If the front end sends, the pieces below are the same for Resend, SendGrid, SES or SMTP.

1. **A server route.** TanStack Start (`@tanstack/react-start` 1.168) defines one with
   `createFileRoute` and a `server.handlers.POST`. It runs in Nitro: the Node server in
   Docker, a function on Vercel. It must live **outside `/api/`**, because
   `vite.config.ts` relays `/api/**` to Django.
2. **A server-only secret.** `src/env.ts` validates `VITE_*` client vars only; a provider
   key must never be one of those (Vite inlines them into the browser bundle). Add a
   server schema (`createEnv({ server: { RESEND_API_KEY } })` in its own module read with
   `process.env`). On Vercel that is a project env var, available to the function at
   runtime. In Docker the current `ARG`s are build-time; the key is passed at container
   start (`-e` / compose), so the README's handover section gains a runtime env.
3. **The backend URL at runtime.** The route has to ask Django who is calling. On Vercel
   `API_PROXY_TARGET` already exists as a project env, so `process.env` has it at runtime.
   The Docker image has no backend URL at all today (the backend is assumed to serve the
   app under `/api`), so the container needs one more runtime env for the server-side call.
4. **Admin check.** Forward the request's `Cookie` header to `GET /api/auth/me/` and
   refuse unless `is_staff` is true. The browser's session cookie reaches the route because
   the app and `/api` are the same origin.
5. **Tests.** Playwright intercepts the route like any `/api` call (`page.route`), since
   the request leaves the browser. The handler's pure parts (body parsing, the staff
   decision, the message built from `setupLinkBody`) go to `tests/unit/`; the provider
   call sits behind a small injected `send` function so no key is needed in CI.

## Recommendation

**Send the setup link from the app through Resend. Leave the reset request as a
`mailto:` for now.**

- **Why Resend.** Free tier covers the volume with room to spare, one key and one SDK
  call, bounce and failure events out of the box, and the smallest setup of the four.
  SendGrid costs $19.95/month for the same thing. SES is only worth its IAM and sandbox
  ceremony if the client's hosting already lives in AWS, which the Docker handover does
  not assume.
- **Why only the setup link.** It is sent by an authenticated admin, so the route can
  verify the session before spending a mail. The reset request is anonymous by nature: a
  public route that mails on demand needs rate limiting or a captcha, and it still has no
  real inbox to go to. It belongs in the backend (a reset-request endpoint that mails the
  admin, or better, mails the user a link directly), which is GMV's work.
- **Bounces.** A setup link that bounces must not vanish. Minimum: the route returns the
  provider's error to the dialog, which keeps the "copy the link" fallback it already has.
  Next step: the `email.bounced` webhook marks the account in the users list.
- **Fallback if DNS is blocked.** If nobody can add DKIM/SPF records for a sending
  domain, Nodemailer over an existing institutional SMTP mailbox needs none, at the cost of
  no delivery dashboard. Same server route, different `send`.

## The open question: who owns the sending domain

This is the real blocker, whichever provider. Mail from a domain without SPF and DKIM
lands in spam, and every provider requires verifying the domain with DNS records.

- Which domain do the mails come from (the platform's domain, GMV's, the client's)?
- Who administers its DNS and can add three TXT/CNAME records?
- **Owner to confirm: GMV**, as the party running the backend and the hosting. If the
  domain is the client's, GMV routes the request. Until answered, the prototype can send
  from Resend's test sender to verified addresses only.

## Follow-ups (to create once the recommendation is agreed)

1. **Product**: replace "Enviar por email" with a real send from the server route; keep
   the copy-link fallback; show the provider error inline; wire `email.bounced`.
2. **Infra**: Vercel env `RESEND_API_KEY` (Preview + Production); Dockerfile/README
   runtime envs for the key and the backend URL; `src/env.server.ts`.
3. **GMV**: name the admin inbox (`ADMIN_EMAIL`), answer the DNS question, and take the
   reset request server-side.
4. **Prototype** (this ticket's second deliverable, not started): one POST route sending
   the setup-link mail through Resend from a preview deployment.
