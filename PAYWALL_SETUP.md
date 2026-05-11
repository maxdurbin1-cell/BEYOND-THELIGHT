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
- `PAYWALL_GOD_KEY`: optional plaintext God Key.
- `PAYWALL_GOD_KEY_HASH`: optional SHA-256 hash of your God Key (recommended for production).
- `LICENSE_STORE_PATH`: optional path for license/session data file.
- `PAYWALL_SESSION_TTL_MS`: optional cookie session duration in milliseconds.

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

From that page you can:

- issue `1` or `4` codes to an email,
- search by email or code,
- revoke a code,
- restore a revoked code.

You must enter `PAYWALL_ADMIN_KEY` in the admin UI.

## Payments (Stripe, PayPal, Venmo)

- Stripe was just one option for payment automation.
- You can absolutely use PayPal instead of Stripe.
- Venmo support is typically done through PayPal/Braintree flows.

The paywall itself is payment-provider agnostic: any payment method works as long as your payment-success step calls the code-issue endpoint (or you issue codes manually in the admin UI).

## Buyer Login

Buyers go to `/access`, enter email + code, then access persists in that browser.

## Notes

- Code redemption is tied to the email assigned during issuance.
- The God Key bypasses purchase-code checks.
- License and session data are stored in `license-data.json` by default.
