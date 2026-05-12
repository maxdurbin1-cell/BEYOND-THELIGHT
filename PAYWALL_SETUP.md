# Paywall Setup

This project now includes a built-in paywall gate.

## What It Does

- Requires every visitor to enter a purchase email and unique code at `/access`.
- Binds each code to one email address.
- Remembers access in the same browser using a secure cookie session.
- Redirects unauthenticated visitors to `/access`.
- Supports a God Key override.
- Includes an admin UI at `/admin/licenses` for issuing, searching, revoking, and restoring codes.

## Pricing Rules Implemented

- `quantity: 1` issues 1 code and represents `$10`.
- `quantity: 4` issues 4 codes and represents `$25`.

## Environment Variables

Set these before running the server:

- `PAYWALL_ADMIN_KEY`: required for issuing codes through the admin API.
- Default if not set: `Turbo_GooseDT*24`.
- `PAYWALL_ADMIN_EMAIL`: admin account email allowed to use the admin key as a website login code. Default: `maxadurbin@gmail.com`.
- `PAYWALL_GOD_KEY`: optional plaintext God Key.
- `PAYWALL_GOD_KEY_HASH`: optional SHA-256 hash of your God Key (recommended for production).
- `LICENSE_STORE_PATH`: optional path for license/session data file.
- `PAYWALL_SESSION_TTL_MS`: optional cookie session duration in milliseconds.

For production durability, set `LICENSE_STORE_PATH` to a persistent volume path (not an ephemeral container filesystem).

If both `PAYWALL_GOD_KEY` and `PAYWALL_GOD_KEY_HASH` are set, the hash is used.

## Run

```bash
npm start
```

## Issue Codes (Seller/Admin)

Use this endpoint after a payment succeeds:

- `POST /api/license/issue`
- Header: `x-admin-key: <PAYWALL_ADMIN_KEY>`
- Body fields:
  - `email`: buyer email
  - `quantity`: `1` or `4`

Example:

```bash
curl -X POST http://localhost:3000/api/license/issue \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -d '{"email":"buyer@example.com","quantity":4}'
```

Response includes generated codes.

## Admin UI (No API Tools Needed)

Open:

- `/admin/licenses`

If admin actions fail, verify server env var `PAYWALL_ADMIN_KEY` is set before starting the server.

Example run command:

```bash
PAYWALL_ADMIN_KEY="replace-with-your-secret" PAYWALL_ADMIN_EMAIL="maxadurbin@gmail.com" npm start
```

From that page you can:

- issue `1` or `4` codes to an email,
- search by email or code,
- revoke a code,
- restore a revoked code,
- click **Test Admin Access** to confirm your current key/session can issue codes.

You can either:

- enter `PAYWALL_ADMIN_KEY` in the admin UI, or
- log in at `/access` using `PAYWALL_ADMIN_EMAIL` + `PAYWALL_ADMIN_KEY` first, then open `/admin/licenses`.

## Payments (Stripe, PayPal, Venmo)

- Stripe was just one option for payment automation.
- You can absolutely use PayPal instead of Stripe.
- Venmo support is typically done through PayPal/Braintree flows.

The paywall itself is payment-provider agnostic: any payment method works as long as your payment-success step calls the code-issue endpoint (or you issue codes manually in the admin UI).

## PayPal Flow In This Project

- Buyer pays your PayPal (`paypal.me/madbookz`, handle `@madbookz`) and includes their email + quantity in payment note.
- You issue code(s) from `/admin/licenses`.
- Buyer signs in at `/access` using email + code.

Note: this project uses manual issuance for PayPal unless you later integrate a provider/API with webhook support.

## Local Access URLs

- Game: `http://localhost:3000/`
- Access gate: `http://localhost:3000/access`
- Admin: `http://localhost:3000/admin/licenses`

If you see "site can't be reached", start the server first with `npm start`.

## Buyer Login

Buyers go to `/access`, enter email + code, then access persists in that browser.

## Notes

- Code redemption is tied to the email assigned during issuance.
- The God Key bypasses purchase-code checks.
- License and session data are stored in `license-data.json` in the project directory by default.
- The server also keeps a `.bak` backup file and can auto-migrate from an older home-directory license file.
