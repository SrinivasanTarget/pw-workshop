# Stage 1 - Instructor answer key

> **Instructor only. Spoilers.** Grounded in the app source (the deployed build is
> built from it; verified live). Use this to steer discovery and confirm findings.

## Planted bugs & quirks (source of truth)

| # | Bug / quirk | Where | How it shows | data-test |
|---|---|---|---|---|
| 1 | **Broken product image** | Desk Lamp (`p-005`) `imageUrl = /images/does-not-exist.png` | Image 404s; `img.naturalWidth === 0` | `product-image-p-005` |
| 2 | **problem_user image/description mismatch** | `applyProblemUserShuffle` swaps `imageUrl` between adjacent pairs `(p-001,p-002)(p-003,p-004)(p-005,p-006)` | Each product shows its neighbour's picture; the broken image moves onto Field Recorder | `product-image-*` |
| 3 | **glitch_user cart-badge hydration race** | `Layout.tsx`: badge renders `cartCount - 1` then corrects after **600 ms** | Add the 1st item -> badge stays hidden ~600 ms, then pops to `1`; every count is briefly off by one | `cart-badge` |
| 4 | **locked_out cannot sign in** | `auth.ts` returns an error before setting session | Stays on `/login`, shows the error below | `login-error` (role=alert) |
| 5 | **Forms a11y: no group legend** | `Forms.tsx` "Newsletter frequency" uses a `<span>`, not `<legend>` | Radio group has no accessible group name | `freq-weekly` / `freq-monthly` |
| 6 | **Forms a11y: icon-only button** | `Forms.tsx` clear button renders `✕` with no accessible name | Button has no name for AT | `clear` |
| 7 | **Async debounce race** | `AsyncSearch.tsx` ~350 ms debounce | Assert-too-fast races the results | `search` / `results` |
| 8 | **Toast auto-dismiss** | `Toasts.tsx` removes after **2500 ms** | Appears then vanishes | `toast-stack` |
| 9 | **Shadow DOM** | `<hidden-counter>` open shadow root | Outer CSS selectors can't reach it; role/text + a11y snapshot can | `shadow-value` / `shadow-increment` |

## Per-user behaviour (all password `workshop123`)

- **standard_user** - happy path. Lands on `/inventory`, 6 products, Desk Lamp image broken.
- **locked_out_user** - stays on `/login`; error **"Sorry, this user has been locked out."** (a wrong password for anyone gives **"Username and password do not match any user in this service"**).
- **problem_user** - signs in; product **images are swapped between adjacent products** (mismatch), so the broken image ends up on Field Recorder. Descriptions/names stay correct - the tell is picture-vs-text.
- **glitch_user** - signs in; the **Cart badge is off by one for ~600 ms** after any cart change, then self-corrects (hydration race). Best seen by adding the first item and watching the badge appear late.

## Expected findings for the tricky exercises

- **G6.16 broken images** -> exactly one: Desk Lamp (`product-image-p-005`). For problem_user it appears on Field Recorder instead.
- **G6.17 /api/products** -> `200`, `{ products: [...] }`, 6 items with `id/name/price/stock`. Stock: Backpack 14, Keyboard 7, Notebook 42, **Aeropress 0 (out of stock)**, Desk Lamp 3, **Field Recorder 1 (only 1 left)**.
- **G7.19 empty stub** -> the grid (`data-test="inventory"`) renders with **zero cards; there is no empty-state message** (a gap worth discussing).
- **G7.20 500 / G7.21 offline** -> graceful: the page shows `inventory-error` (role=alert) **"Couldn't load inventory. HTTP 500"** (or the fetch error). No crash. The sort control is disabled until load succeeds.
- **G11.36 locked_out** -> error text above; never reaches `/inventory`.
- **G11.37 problem_user** -> the image/description **mismatch** (not a broken image).
- **G11.38 glitch_user** -> the **cart-badge** off-by-one for ~600 ms (see the corrected exercise). It is a timing/render bug, not a network or console error - a good lesson that not every bug shows up in logs.

## Facilitator facts

- **API/CMS split.** Inventory merges `/api/products` (price + stock, from `server/data.js` / the Pages function) with the static catalog `src/data/products.ts` (description + imageUrl). This is why network-mocking `**/api/products` changes stock/price but not images.
- **Auth is client-side.** No `/api/login`. Session lives in `localStorage["workshop-auth"]` (zustand persist); cart in `localStorage["workshop-cart"]`. That is what storage-state exercises capture.
- **Other real endpoints** (bonus): `GET /api/health`, `GET /api/products/:id`, `POST /api/checkout`, `GET /api/orders/:id`. There is a Checkout flow (`/checkout`, `/checkout/complete`).
- **Run it locally** (you now have the source): in the app repo, `npm install && npm run dev:all` (web on `:5173`, API alongside), then point this workshop repo at it with `BASE_URL=http://localhost:5173`.

## Playground data-test cheat sheet

- **Dialogs** (`/playground/dialogs`): in-DOM modal `open-modal` -> `modal` / `modal-confirm` / `modal-cancel` (Escape or backdrop closes) -> `modal-result`. Native: `fire-alert`, `fire-confirm` ("Delete this item?"), `fire-prompt` ("What should we call you?", default "Guest"); outcome in `dialog-result`.
- **Forms** (`/playground/forms`): `name` `email` `country`(select) `bio`(textarea) `tier-free/pro/team`(radio) `freq-weekly/monthly`(radio, **no legend**) `topic-testing/ai/devops/observability`(checkbox) `file` -> `file-name` `tos` `submit` `clear`(**no name**) -> `submitted`. Validation: name required, email must contain `@`, country required, TOS required.
- **Tables** (`/playground/tables`): `filter`, `people-table`, `th-name/team/role/joined` (click to sort, toggles asc/desc), `row-{id}`, `empty`, `page-prev/next`, `page-info`. 12 rows, page size 5.
- **Drag & Drop** (`/playground/dragdrop`): `sortable-list`, `item-a..e` (Plan release / Update changelog / Cut tag / Publish package / Announce on socials), current order in `order`.
- **Async** (`/playground/async`): `search` -> `loading` -> `result-{Name}` or `no-results`. ~350 ms debounce.
- **Toasts** (`/playground/toasts`): `toast-success/info/danger` -> `toast-stack` / `toast-{id}`, auto-dismiss after 2.5 s.
- **Iframes** (`/playground/iframes`): same-origin `demo-iframe` (srcdoc); inside: `iframe-name`, `iframe-submit`, `iframe-result`.
- **Shadow DOM** (`/playground/shadow-dom`): `<hidden-counter>` open shadow root; inside: `shadow-value` (starts 0), `shadow-increment`.
