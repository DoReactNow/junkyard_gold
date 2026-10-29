# Junkyard Gold — junkyardgold.com

Website and staff text inbox for Junkyard Gold (2727 75th St W, Bradenton, FL 34209 · 904-481-5300 · support@junkyardgold.com).

## How it works

```
Customer ─► website: Year/Make/Model finder, VIN check, "Text me my options" form
               │
               ├─ VIN decoded free by NHTSA ─► matching units from YOUR inventory shown instantly
               └─ form ─► lead saved ─► instant auto-text to customer
                                        ─► AI (Claude) drafts a reply with 2–3 matching units + links
                                        ─► optional text alert to a staff cell / email copy

Customer texts 904-481-5300 directly ─► Twilio ─► same inbox, same AI draft

Staff open /admin ─► review/edit the draft ─► Send (goes out as a real SMS)
                  ─► "+ Pay link" inserts a Stripe checkout link for that unit
Customer pays ─► Stripe webhook marks the unit SOLD and notes it in the thread
```

Nothing is ever sent to a customer by the AI on its own. The only automatic text is the
"we got your request" confirmation.

## Run it on your computer

```bash
npm install
cp .env.example .env        # then edit ADMIN_PASSWORD
docker compose up -d        # local Postgres on port 5433
npm run db:push             # creates the tables (Prisma migrations)
npm run import -- data/private/sales.xlsx   # your listings (or upload at /admin/parts)
npm run dev                 # http://localhost:3000  ·  staff inbox: http://localhost:3000/admin
```

With no keys in `.env` everything runs in **demo mode**: texts are only shown in the inbox
(marked "simulated"), drafts use a template instead of AI, and "Buy Now" asks the customer to
text/call. The top bar of `/admin` shows which parts are live vs demo. In demo mode you can use
"Simulate a customer text" in the inbox to try the whole flow.

## Your inventory

Listings come from your yearly **sales sheet** (columns: Car / Truck, Part, Specification, Total
Sales Amount, Vendor Price). Upload it as is at `/admin/parts` (.xlsx or .csv), or run
`npm run import -- "Vehicle Specification Sales.xlsx"` (add `--dry-run` to preview first).

How a sales row becomes a listing (`src/lib/sales-import.ts`):

- **One listing per vehicle + part + specification.** Repeat sales of the same item are merged.
- **Price** = median of what customers paid, rounded to end in 9 ($1,697.91 → $1,699). If a row
  has no sale amount, vendor price × 1.40 (your median markup). Canadian-dollar amounts are ignored.
  **Vendor prices are never saved or shown.**
- **Mileage** (the sheet has none), per the owner's rule, newer vehicles toward the low end:
  2015–2025 → 10k–80k · 2000–2014 → 70k–110k · 1999 and older → 80k–130k · never above 130k.
  The site shows the listed figure (e.g. "73,000 mi"). The unit bought from the vendor is within
  ±5,000 miles; staff text the customer the actual mileage before delivery.
- **Skipped:** rows without a readable year/make/model, cells naming two vehicles, multi-item
  packages (e.g. "Engine + Wiring Harness"), cores and reman units, and non-engine/transmission
  parts under $300. The import prints every skipped row and why.
- Customer VINs typed into the Car / Truck column are stripped and never published.
- Stock numbers (JG-XXXXXX) are derived from the listing, so re-uploading next year's sheet
  updates prices instead of duplicating. Tick "This is my complete list" to retire listings that
  aren't in the new file.

**Not listed?** When a customer's vehicle or part isn't in the list, the VIN check, the parts
search and the AI draft give an *approximate* price range from similar parts you've sold
(`src/lib/estimate.ts`) and ask the customer to text or call for the exact quote.

The private sheet lives in `data/private/` (git-ignored). `npm run seed` still loads the old
made-up sample parts, for demos only; don't run it on the live database.

**Photos:** listings show an illustration marked "Illustration", and every page invites the
customer to text for real photos of the exact unit. Don't copy photos from Car-Part.com or other
sellers' listings (copyright / terms of service). Add your own photo URLs in `image_url` any time.

## Going live — checklist

| Step | What to do | Time |
|---|---|---|
| 1. Hosting | On vercel.com, sign in with GitHub → **Add New → Project** → import `junkyardgold`. In the project's **Storage** tab add **Neon (Postgres)** and connect it to all environments; it sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. Every deploy runs the database migrations automatically. | 15 min |
| 2. Domain | Project → Settings → Domains → add `junkyardgold.com` and `www.junkyardgold.com`, then add the DNS records Vercel shows at your domain registrar. Set `SITE_URL=https://junkyardgold.com`. | 15 min + DNS |
| 3. Staff login | In Settings → Environment Variables set a long `ADMIN_PASSWORD` and a random `SESSION_SECRET` (`openssl rand -hex 32`), then redeploy. Log in at `/admin` and upload the sales sheet at `/admin/parts`. | 5 min |
| 4. Texting | Create a Twilio account. **Host 904-481-5300 for SMS on Twilio** (keeps voice calls with your current carrier) or port it. Register for **A2P 10DLC** (brand + "Customer care / quotes" campaign) — carriers block unregistered business texting. Use `/terms` and `/privacy` URLs in the registration; they already have the required SMS wording. Set the number's "A message comes in" webhook to `https://junkyardgold.com/api/sms/inbound`. Fill the `TWILIO_*` variables. | 1–3 weeks for approval |
| 5. AI drafts | Create an API key at console.anthropic.com, set `ANTHROPIC_API_KEY`. Uses Claude Opus 5.5. | 5 min |
| 6. Payments | Create a Stripe account, set `STRIPE_SECRET_KEY`. Add a webhook to `https://junkyardgold.com/api/stripe/webhook` for `checkout.session.completed` and set `STRIPE_WEBHOOK_SECRET`. | 30 min |
| 7. Alerts (optional) | `STAFF_ALERT_PHONE` = a staff cell to get a text for every new lead. `WEB3FORMS_ACCESS_KEY` (free at web3forms.com) to also email each lead to support@junkyardgold.com. | 10 min |
| 8. Review policies | Read `/warranty`, `/shipping-returns`, `/terms`, `/privacy` and adjust to how you actually operate. Business hours (Mon–Fri 10 AM–6 PM ET) are in `src/lib/business.ts`; outside them the instant text tells customers when you'll reply. No pickup is offered anywhere. | 30 min |

## Where things live

- `src/lib/business.ts` — name, phone, address, hours, warranty (change once, updates everywhere)
- `src/lib/vin.ts` — NHTSA VIN decoding
- `src/lib/inventory.ts` — fitment matching (year + make + model, engine size from VIN)
- `src/lib/ai.ts` — Claude draft prompt and rules (only quotes units from your inventory, exact prices)
- `src/lib/sms.ts` — Twilio send / demo mode
- `src/app/api/leads` — website form handler · `src/app/api/sms/inbound` — Twilio webhook
- `src/app/admin` — staff inbox and inventory screens
