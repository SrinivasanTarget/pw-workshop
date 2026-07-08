# Stage 2 - Skill labs (explore each skill on its own merits)

[`stage-2-refactor.md`](stage-2-refactor.md) is one lens: take generic AI code and
make it house style. It leans hardest on `playwright-locators` and
`test-craftsmanship`. These **skill labs** are the other lens - one focused lab per
skill that the refactor arc under-serves, so you exercise the whole surface of each,
grounded in this app's real, planted behaviour.

> **Prereqs:** stage 2 is enabled (skills + `CLAUDE.md` live, browser MCP on - see
> [`WORKSHOP_GUIDE.md`](../WORKSHOP_GUIDE.md) > Stage gating). Test Agents stay off.

App under test: **https://playwright-workshop.pages.dev** (relative paths are against
that origin). All accounts use password **`workshop123`**.

## How a lab runs

Each lab has an **Instructor explore** block (live demos to run and think aloud) and
**Attendee tasks** (numbered, do-it-yourself). You still drive the live app with the
**browser MCP** to observe and confirm selectors; the **skills** shape the code Claude
writes. The skill each task exercises is named in *italics*.

Ground truth you will lean on repeatedly:

- `GET /api/products` -> `{ products: [...] }`, 6 items, each `{ id, name, price, stock }`.
  Aeropress Go (`p-004`) `stock: 0`; Field Recorder (`p-006`) `stock: 1`; Desk Lamp
  (`p-005`) has a broken image (`/images/does-not-exist.png`).
- Login is **client-side** - no `/api/login`. The session is `localStorage["workshop-auth"]`
  (there is no auth cookie); the cart is `localStorage["workshop-cart"]`.
- Planted users: `locked_out_user` (cannot sign in), `problem_user` (product images
  swapped between adjacent pairs), `glitch_user` (cart badge off by one for ~600 ms).

---

# Lab 1 - Debugging *(the biggest gap: no stage-2 exercise until now)*

You will write tests, and they will fail - sometimes the test is wrong, sometimes the
app is. This lab is the toolchain that tells you which, fast, without `console.log`.
*(playwright-debugging)*

### Instructor explore

1. **Time-travel a real failure.** In `tests/login.spec.ts`, change the expected
   heading from `Products` to `Product`. Run `npm run test:ui`, click the failing step,
   and read the **DOM snapshot at that moment** - actual vs expected. Point out: you
   diagnosed it from the snapshot, not the stack trace. Revert.
2. **codegen is a starting point, not a commit.**
   `npx playwright codegen https://playwright-workshop.pages.dev/login` - click
   Username, Password, Sign in. Show it often emits brittle text or `nth(n)`. Bridge to
   `playwright-locators`: treat the output as raw material, then rewrite to the priority.
3. **Trace viewer for "why did CI fail."** The config sets `trace: 'on-first-retry'`
   (and `retries: 0` locally), so run one failing spec with `--retries=1` to capture a
   trace, then `npx playwright show-trace test-results/.../trace.zip`. Walk the network
   tab (any 5xx or slow request?) and the console tab.

### Attendee tasks

- **D1** Break your login spec's expected heading to `Product`. Run `--ui` and identify
  the failing step from the time-travel snapshot **without reading the error text**,
  then fix it. *(playwright-debugging)*
- **D2** Use `codegen` on `/login` to discover a locator for the **Sign in** button,
  then rewrite whatever it emits to the house priority (role/label) and say why.
  *(playwright-debugging, playwright-locators)*
- **D3** Drop `await page.pause()` after login in a spec, run it, and use the Inspector
  to hover and highlight the **Sort** dropdown locator live. *(playwright-debugging)*
- **D4** Make an inventory test fail on the broken **Desk Lamp** image, run it with
  `--retries=1`, open the trace, and from the **network + DOM tabs alone** name which
  product and which URL 404'd. *(playwright-debugging)*
- **D5** A test "flakes 1 in 10." Per the skill's decision matrix, where do you look
  first? Reproduce it by asserting on the inventory grid *before* it loads, watch it
  fail, then fix it by anchoring on a web-first assertion. *(playwright-debugging, playwright-locators)*
- **D6** The config already sets `screenshot: 'only-on-failure'` and
  `video: 'retain-on-failure'`. Force a failure, then open the saved screenshot and
  video from `test-results/`. What did each answer that the error message did not?
  *(playwright-debugging)*

> **Lab done when:** you can take any red test and, in under a minute, say "test bug" or
> "app bug" with the trace/UI open as evidence.

---

# Lab 2 - Bug hunting *(refactor R9 was 1 of ~5 patterns)*

A regression suite asks "did we break what we know about?" A bug hunt asks "what's
broken that we *don't* know about?" This app ships planted bugs on purpose. Turn each
into an **invariant** test - assert the rule, not the bug, so the test keeps guarding
after a fix. *(playwright-bug-hunting)*

### Instructor explore

1. **Assert the invariant.** Write the broken-image audit on `/inventory` as
   `standard_user` (`img.naturalWidth === 0`). It fails on **Desk Lamp** - and that
   failure *is* the finding. Stress: we asserted "no broken images," not "Desk Lamp is
   broken," so it survives the fix.
2. **The bug that is not in the logs.** Sign in as `glitch_user`, add the first item,
   and watch the **cart badge**: it stays hidden ~600 ms, then pops to `1`. Console
   clean, network clean. Lesson: not every bug shows up in logs; some need a timed UI
   assertion.
3. **A guard that catches what assertions miss.** Add a console-error and a 5xx
   listener in a fixture, re-run the suite, and talk about what each would catch.

### Attendee tasks

- **H1** Write the broken-image invariant audit for `/inventory` (`standard_user`). It
  fails on Desk Lamp - contrast that with asserting the Desk Lamp is broken *directly*.
  Why is the invariant the better test? *(playwright-bug-hunting)*
- **H2** Sign in as `problem_user` and run the H1 audit again - it now flags **Field
  Recorder** instead. Explain why (adjacent-image swap), and note the descriptions stay
  correct, so the real tell is picture-vs-text. *(playwright-bug-hunting)*
- **H3** Negative path: assert `locked_out_user` **stays on `/login`** and shows the
  alert "Sorry, this user has been locked out." Then submit a wrong password for
  `standard_user` and assert the *different* message. *(playwright-bug-hunting)*
- **H4** Add a global **console-error guard** and a **5xx guard** in a fixture and run
  the whole suite. Does anything trip? (The glitch/problem bugs will not - discuss why.)
  *(playwright-bug-hunting, playwright-fixtures-auth)*
- **H5** The `glitch_user` badge is off by one for ~600 ms. Write one test that catches
  the wrong intermediate state (hard) and one that only checks the settled state (easy).
  Which belongs in CI, and what does each tell you? *(playwright-bug-hunting)*
- **H6** a11y scan `/playground/forms` with `@axe-core/playwright`. It has a radio group
  with no `<legend>` and an icon-only clear button with no accessible name. Assert
  `violations` is empty (it fails) and read the two findings. *(playwright-bug-hunting)*

> **Lab done when:** every finding is written as an invariant that would still pass once
> the bug is fixed, and none assert the bug itself.

---

# Lab 3 - Network mocking *(refactor R8 was 1 of ~7 patterns)*

Two reasons to control the network: **stability** (do not fail because the backend is
slow) and **coverage** (test the 503 you cannot trigger for real). This app's
`/api/products` returns `{ products: [...] }` with `{ id, name, price, stock }` - stub
it, delay it, break it, and record it. *(playwright-network-mocking)*

### Instructor explore

1. **Shape matters.** Stub `{ products: [] }` -> the grid renders **zero cards with no
   empty-state message** (a real gap). Now stub a **bare `[]`** (no `products` key) ->
   the route **crashes** behind a React error boundary (`Cannot read properties of
   undefined (reading 'map')`). You just found a robustness bug by mocking.
2. **Slow, then broken.** Delay `/api/products` by 2 s and look for a loading state.
   Then fulfill a **500**: the page shows an `inventory-error` alert ("Couldn't load
   inventory. HTTP 500") and the Sort control is disabled - graceful, unlike the
   bare-array crash. Contrast the two.
3. **Record once, replay offline.** HAR-record a visit to `/inventory`, then replay with
   `routeFromHAR` and show it renders with no live backend.

### Attendee tasks

- **N1** Stub `/api/products` -> `{ products: [] }` and open `/inventory`. Empty grid,
  or an empty-state message? (It is a gap worth naming.) *(playwright-network-mocking)*
- **N2** Stub a **bare `[]`** (no `products` key). It crashes behind an error boundary.
  Which is the app's bug and which is your bad mock, and how would you tell them apart?
  *(playwright-network-mocking, playwright-bug-hunting)*
- **N3** Fulfill `/api/products` with a **500**. Assert the page shows the
  `inventory-error` alert, does **not** crash, and that the Sort control is disabled.
  *(playwright-network-mocking)*
- **N4** Delay `/api/products` by 2 s (wait inside the route before you fulfill). Is
  there a loading indicator? Assert it, then assert the grid after it resolves.
  *(playwright-network-mocking)*
- **N5** **Modify, do not stub:** `route.fetch()` the real response, rewrite one
  product's `price` to `$0.00`, and fulfill. Assert the UI shows your tampered price -
  proof the UI trusts the API. *(playwright-network-mocking)*
- **N6** Record a **HAR** of `/inventory`, then replay it with `routeFromHAR` and
  confirm the grid renders with no live backend. Why is *your own* backend a poor HAR
  candidate, and a third party a good one? *(playwright-network-mocking)*
- **N7** Fix the over-match: `**/api/products` also matches `/api/products/p-005`.
  Rewrite as `/\/api\/products$/` and confirm the product-detail route is untouched.
  *(playwright-network-mocking)*

> **Lab done when:** you can force empty / slow / error / offline states on demand and
> tell an app bug (bare-array crash) from a mocking mistake.

---

# Lab 4 - API testing *(refactor R10 was pure-GET only)*

The `request` fixture is an HTTP client that shares `baseURL` and state with the
browser. Use **pure API** tests for shape and contract, and **hybrid** tests to seed
fast then assert through the UI - but know what is API-drivable here: login is
client-side, so there is no `/api/login`. *(playwright-api-testing)*

### Instructor explore

1. **Contract in milliseconds.** Write a pure API test for `GET /api/products`: status
   `200`, `products` length `6`, and the stock invariants (Aeropress `0`, Field Recorder
   `1`). No browser, no flake - it tests the contract, not the paint.
2. **What is API-drivable.** Try to seed a login over the API. There is no `/api/login`;
   auth lives in `localStorage`. So the hybrid "seed via API" story here means seeding
   the **session via storageState / localStorage**, not a bearer token - contrast with
   the skill's generic hybrid snippet.
3. **Guard the parse.** Show that `res.json()` on a 500 throws opaquely; check
   `res.status()` first.

### Attendee tasks

- **A1** Pure API: `GET /api/products` -> assert `200` and `products` length `6`.
  *(playwright-api-testing)*
- **A2** Extend A1 with the live invariants: Aeropress Go `stock: 0`, Field Recorder
  `stock: 1`, and every product carries `id/name/price/stock`. *(playwright-api-testing)*
- **A3** Hit `GET /api/products/p-005` (Desk Lamp) and `GET /api/health`. Assert each
  status and shape, checking `status()` **before** `json()`, and say why the order
  matters. *(playwright-api-testing)*
- **A4** The hybrid question: login is client-side (no `/api/login`), so how do you seed
  an authenticated session for a UI test without clicking through login? Wire it (via
  `storageState` / seeding `localStorage`) and prove a spec starts logged in.
  *(playwright-api-testing, playwright-fixtures-auth)*
- **A5** Put A1-A3 behind the typed client in `src/api/products.ts` so specs call
  `app.products.list()` instead of raw `request.get(...)`. Confirm the spec reads as
  intent. *(playwright-api-testing, test-craftsmanship)*
- **A6** For each check, decide **UI / API / hybrid** per the skill's table and justify
  it: "the Sort dropdown reorders the grid", "`/api/products` returns 6 items", "adding
  to cart updates the badge". *(playwright-api-testing)*

> **Lab done when:** you can state, for this app, exactly what belongs in an API test vs
> a UI test, and why login is not among the API-drivable parts.

---

# Lab 5 - Fixtures, auth & isolation *(refactor R6 had storageState only)*

You already have an `app` fixture (`tests/fixtures.ts`) - that *is* Dependency
Injection. This lab makes login cheap, gives each user type its own session, and proves
**isolation** by breaking it on purpose. *(playwright-fixtures-auth)*

### Instructor explore

1. **Cheap login.** Sign in once as `standard_user`, save
   `playwright/.auth/standard.json`, and set `use.storageState` so specs start
   authenticated. Note: the session is `localStorage["workshop-auth"]` (client-side,
   **no cookie**), and `storageState` captures localStorage + origins, so it works
   anyway. Compare runtime before and after.
2. **Isolation, demonstrated.** Write two order-dependent tests (A adds to cart, B
   expects the badge to read `1`). Run with `--workers=2` and watch B fail when it runs
   first. Fix by moving the setup into a fixture. The contract is: **fresh context per
   test**.
3. **Compose, do not copy.** Build an `authenticatedApp` fixture on top of the base
   `app` so a spec that uses it has no login step at all.

### Attendee tasks

- **F1** Sign in once, save `playwright/.auth/standard.json`, set `storageState`, and
  prove a spec lands on `/inventory` with **no UI login**. Compare runtime vs logging in
  through the UI. *(playwright-fixtures-auth)*
- **F2** This app has **no auth cookie** - the session is `localStorage["workshop-auth"]`.
  Open the saved storage-state JSON and confirm it captured that origin. Why does the
  skill's "do not expect a session cookie" note apply here? *(playwright-fixtures-auth)*
- **F3** Give `problem_user` and `glitch_user` their **own** storage files +
  `test.use({ storageState })` so their specs skip login too. (Why can `locked_out_user`
  not get one?) *(playwright-fixtures-auth)*
- **F4** Add a composed `authenticatedApp` fixture that builds on your base `app` and
  starts signed in. A spec that uses it reads with no login step. *(playwright-fixtures-auth, test-craftsmanship)*
- **F5** Isolation break-and-fix: write `test('adds item')` and `test('badge shows 1')`
  where the second depends on the first. Run with `--workers=2`, watch it fail, then move
  the setup into a fixture so each is independent. *(playwright-fixtures-auth)*
- **F6** "Works alone, fails in suite." Deliberately mutate the cart in one test and
  leave it dirty. Show a later test tripping on the leaked state, then explain why
  fresh-context-per-test normally prevents this and what you did to defeat it.
  *(playwright-fixtures-auth)*

> **Lab done when:** most specs skip the UI login, every test passes in any order under
> parallel workers, and you can explain why.

---

# Lab 6 - Craftsmanship review *(the untapped reviewer's seat)*

The refactor file *builds* house style. This lab is the **reviewer's** seat: name the
smell **with its file/function and one concrete fix**, and decide how much structure is
enough. "Violates SOLID" with no location and no fix is not a review.
*(test-craftsmanship)*

### Instructor explore

1. **Review live.** Feed Claude a generic spec (or an attendee's) and ask: "Review this
   against `test-craftsmanship` - name each smell with its file/function and one fix."
   Watch it cite SRP / CQS / DRY with locations, not slogans.
2. **The tell-tale smells.** Show a `login(app, true)` boolean-flag call or a 4-argument
   helper; have Claude propose two named functions or an options object. Show an action
   that both clicks and returns a value it asserts on (CQS violation) and split it.
3. **When is Screenplay justified?** Discuss out loud: not yet. One small suite, plain
   functions read clearly. Screenplay (Actors/Abilities/Tasks/Questions) becomes the
   principled step only with many reused flows across a broad UI **and** API surface.
   Adding it now would be the *needless complexity* smell, not the cure.

### Attendee tasks

- **C1** Ask Claude to review one of your specs against `test-craftsmanship` and produce
  a table: **smell / file:function / one-line fix**. Reject any entry with no location.
  *(test-craftsmanship)*
- **C2** **CQS:** find a function that both *does* and *answers* (an action that returns
  a value it also acted on) and split it into a command and a query. *(test-craftsmanship)*
- **C3** **Arguments:** refactor a `doThing(app, true)` boolean-flag call, or a
  4-argument helper, into named functions or an options object. *(test-craftsmanship)*
- **C4** **Assertion-in-action:** find an assertion hiding inside an action helper, move
  it to the spec as a web-first assertion, and say why actions command while specs
  assert. *(test-craftsmanship, playwright-locators)*
- **C5** **DRY vs the wrong abstraction:** find two flows that merely *look* alike and
  argue whether to unify them. When does a little duplication beat the abstraction?
  *(test-craftsmanship)*
- **C6** Write the two-sentence case for why this suite does **not** need Screenplay yet,
  and name the exact condition that would flip that decision. *(test-craftsmanship)*

> **Lab done when:** every review comment has a file, a named smell, and a concrete fix -
> and you can defend why the framework is exactly as heavy as it needs to be, no more.

---

# Coverage map (labs vs the refactor file)

| Skill | Refactor file | This file |
|---|---|---|
| `playwright-locators` | R1, R2, R3 | (woven into D2, D5, C4) |
| `test-craftsmanship` | R4, R5, R7 (build) | **Lab 6** (review) |
| `playwright-fixtures-auth` | R5, R6 | **Lab 5** (multi-user, isolation) |
| `playwright-network-mocking` | R8 | **Lab 3** |
| `playwright-bug-hunting` | R9 | **Lab 2** |
| `playwright-api-testing` | R10 | **Lab 4** |
| `playwright-debugging` | - | **Lab 1** |

Run the refactor file for the *build* muscle; run these labs for the *breadth* of each
skill against the app's real, planted behaviour.
