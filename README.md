# Junkyard Gold — junkyardgold.com

Website and staff text inbox for Junkyard Gold (2727 75th St W, Bradenton, FL 34209 · 904-481-5300 · support@junkyardgold.com).

## How it works

```
Customer ─► website: Year/Make/Model finder, VIN check, "Text me my options" form
               │
               ├─ VIN decoded free by NHTSA ─► matching units from YOUR inventory shown instantly
               └─ form ─► lead + consent proof saved ─► instant text, follow-ups at 3 h / 1 day / 3 days
                                        (only 10 AM–8 PM Eastern; a reply cancels the rest)
                                        ─► AI (Claude) drafts a reply with 2–3 matching units + links
                                        ─► email alert to support@junkyardgold.com (Zoho) / optional staff text

Customer texts 904-481-5300 directly ─► RingCentral ─► same inbox, same AI draft

Staff open /admin ─► review/edit the draft ─► Send (goes out as a real SMS)
                  ─► "+ Pay link" inserts a Stripe checkout link for that unit
Customer pays ─► Stripe webhook marks the unit SOLD and notes it in the thread
```

Nothing is ever sent to a customer by the AI on its own. The automatic texts are the
"we got your request" confirmation and the three follow-ups (same wording as v1), plus the
STOP / START / HELP replies carriers require.

**Deploying:** see [DEPLOY.md](DEPLOY.md) (GitHub Actions → Docker → VPS behind Traefik, replaces v1).

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
- **Price** = median of what customers paid, rounded to end in 9 ($1,697.91 → $1,699), but never
  below vendor cost + $300 (same rule as v1). If a row has no sale amount, vendor price × 1.40.
  Canadian-dollar amounts are ignored.
  **Vendor prices are never saved or shown.**
- **Mileage** (the sheet has none), per the owner's rule, newer vehicles toward the low end:
  2015–2025 → 10k–80k · 2000–2014 → 70k–110k · 1999 and older → 80k–130k · never above 130k.
  The site shows the listed figure (e.g. "73,000 mi").
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

**Photos:** listings use your v1 product photos (same model, else same make, else the engine/gearbox
family), labeled "Example photo", and every page offers real photos of the exact unit by text. A listing's
own `image_url` overrides them. Don't copy photos from Car-Part.com or other sellers' listings.

The site shows those photos **cut out** on a dark, lit backdrop (`public/img/parts-cut/*.webp`). After adding new
photos to `public/img/parts/`, regenerate the cutouts (needs Python with Pillow):

```bash
python3 -I scripts/cutout-photos.py public/img/parts public/img/parts-cut
```

## Going live

See **[DEPLOY.md](DEPLOY.md)**: GitHub secrets, the one-time switch from v1, RingCentral setup and rollback.

## Where things live

- `src/lib/business.ts` — name, phone, address, hours, warranty (change once, updates everywhere)
- `src/lib/vin.ts` — NHTSA VIN decoding
- `src/lib/inventory.ts` — fitment matching (year + make + model, engine size from VIN)
- `src/lib/ai.ts` — Claude draft prompt and rules (only quotes units from your inventory, exact prices)
- `src/lib/sms.ts` — send queue, 10 AM–8 PM window, demo mode · `src/lib/ringcentral.ts` — RingCentral API · `src/lib/followups.ts` — instant + 3 follow-ups
- `src/lib/consent.ts` — the SMS consent wording stored with every lead · `src/lib/email.ts` — Zoho lead alerts
- `src/lib/photos.ts` — matches listings to the v1 product photos (`public/img/parts`, shown as "Example photo")
- `src/app/api/leads` — website form handler · `src/app/api/sms/inbound` — RingCentral webhook · `src/instrumentation.ts` — the every-minute text worker
- `src/app/admin` — staff inbox and inventory screens
