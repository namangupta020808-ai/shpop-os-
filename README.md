# ShopOS — initial prototype

This is a **local browser prototype**, not a production inventory or GST system.

## Included
- Product catalogue for the six confirmed categories
- Add product form with unique SKU check
- Search by SKU, name, brand and category
- Stock quantity and low-stock indicators
- Basic demo sale transaction with stock deduction and insufficient-stock protection
- CSV export that opens in Excel
- Local browser persistence using `localStorage`

## Not included yet
- Supabase/cloud database, authentication or staff roles
- Reliable offline transaction queue and multi-device conflict resolution
- Bill of Supply PDF generation or GST compliance validation
- Thermal printer / Bluetooth printer integration
- WhatsApp sharing integration
- Supplier purchase workflow, returns, repairs, serial-number tracking
- Automated cloud backups or restore process

## Run locally
Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

Open the local address printed by Vite. For a production build:

```bash
npm run build
```

## Important prototype limitations
1. Data stays in the browser profile on this device. Clearing browser data can erase it. Export CSV regularly while testing.
2. The demo sale counter is not an official invoice number sequence. Do not issue these references to customers.
3. No customer Bill of Supply is generated. Do not use this prototype for live billing or GST records.
4. Seed products are demonstration data. Delete them and enter verified opening stock before any pilot.
5. `localStorage` is not a secure or reliable database for a live shop. Replace it with IndexedDB plus a server-backed transaction ledger before deployment.

## Production architecture
- Android-installable PWA: React + TypeScript
- Backend: Supabase PostgreSQL + Auth + Row Level Security
- Offline: IndexedDB outbox with idempotent transaction IDs
- Server-side stock ledger: immutable stock movements; balances derived from movements
- Billing: server-issued sequential Bill of Supply numbers, PDF generation, print layout
- Backups: automated database backups plus owner-triggered CSV/XLSX exports
- Monitoring: audit log, sync failures, failed print/share events

## Composition-scheme billing requirements
The production document flow must be designed for a composition taxpayer, not a regular taxpayer. CBIC guidance says a composition taxpayer issues a Bill of Supply rather than a tax invoice and cannot collect tax separately from the customer. The prescribed composition declaration must appear on the Bill of Supply. Have the shop's CA verify the current legal wording, fields, numbering and eligibility before enabling live billing.

Reference: https://cbic-gst.gov.in/composition-rules.html
Reference: https://cbic-gst.gov.in/hindi/sectoral-faq.html

## Recommended implementation phases
1. Replace demo local storage with schema-backed product and stock movement APIs.
2. Add owner/staff authentication and permission policies.
3. Add suppliers, purchase receipts, stock adjustments and stocktake.
4. Add Bill of Supply workflow and validate it with the accountant.
5. Add thermal printer support and PDF/WhatsApp sharing.
6. Add offline sync, conflict handling, backups and restore drills.
7. Pilot with a copy of real data before switching live operations.
