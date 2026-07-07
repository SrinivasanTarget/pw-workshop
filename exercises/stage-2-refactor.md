# Stage 2 - Refactor to house style with skills + CLAUDE.md

Stage 1 explored the app with the raw browser MCP. Stage 2 turns on the **house
style**: the `Skill` tool and `CLAUDE.md` come online, and you use them to turn
generic, AI-written Playwright code into clean, opinionated tests - no Page Object
Model, no ceremony.

> **Enable stage 2 first** (see [`WORKSHOP_GUIDE.md`](../WORKSHOP_GUIDE.md) > Stage
> gating):
> 1. Delete the `"Skill"` line from `permissions.deny` in `.claude/settings.json`.
> 2. Rename `CLAUDE.stage2.md` -> `CLAUDE.md`.
> 3. Reload the window (Cmd/Ctrl-Shift-P -> Developer: Reload Window).
>
> The eight skills + `CLAUDE.md` are now loaded. The browser MCP stays on; the Test
> Agents (planner / generator / healer) remain a later stage.

App under test: **https://playwright-workshop.pages.dev** (relative paths below are
against that origin).

## The idea

You still drive the live app with the **browser MCP** to observe and find selectors.
But now, when Claude writes or refactors a test, the **skills** and **`CLAUDE.md`**
shape the output. The *same request* produces very different code with the house style
loaded - that contrast is the whole lesson.

## How you drive it

In the **Claude Code panel** you type a plain-English request. Two things changed from
stage 1:
- Claude can now **load skills** - watch for the `Skill` tool call in the stream. That
  call *is* the house style coming online.
- `CLAUDE.md` is always loaded, so the house-style anchors apply to every reply.

---

# Part A - Instructor-led: generate, then refactor

Run this live first, thinking aloud. The point is the before/after contrast.

### 1. Generate the "before"

Ask for a test with **no** guidance about style:

> *"Write a Playwright test that logs in as standard_user and checks the inventory page
> shows 6 products."*

Point out what generic AI code tends to look like, and why each is a smell:
- CSS / `.nth()` selectors (`page.locator('.product-card')`) - selector rot.
- values pulled with `.textContent()` then `expect(value).toBe(...)` - bypasses retry.
- a `waitForTimeout(...)` "to be safe" - flake and wasted time.
- the whole flow inline in the spec - nothing reusable, reads as mechanics.
- a fresh UI login - slow, repeated in every spec.

That is the raw material. Save it.

### 2. Refactor with the skills

Now ask for the house style, and **watch the `Skill` tool load**:

> *"Refactor that test to our house style."*

Call out each move and the skill behind it:

| Generic | House style | Skill |
|---|---|---|
| `.locator('.card').nth(0)` | `getByRole` / `getByLabel` / `getByTestId` | `playwright-locators` |
| `expect(await x.textContent())` | `await expect(locator).toHaveText(...)` | `playwright-locators` |
| `waitForTimeout(2000)` | auto-wait on the assertion | `playwright-locators` |
| inline login steps | a `login` function + `App` facade | `test-craftsmanship` |
| UI login every test | a fixture + `storageState` | `playwright-fixtures-auth` |
| a `LoginPage` page object | a functional helper (no POM) | `test-craftsmanship` |

### 3. Verify against the live app

Before committing a selector, confirm it with the MCP:

> *"Use the browser MCP to generate a locator for the Sort dropdown, then check it
> matches the house-style priority."*

Bridge: the MCP observes reality; the skills decide how the code should read.

---

# Part B - Your turn (attendee refactors)

Pick any order. For each: paste (or generate) the generic version, ask Claude to
refactor, and confirm the house style with the skill named in *italics*.

## R1 - Locators
Give Claude a spec that finds elements by CSS and `.nth()`. Ask it to refactor the
selectors to role/label/testId, and explain why each choice survives UI changes.
*(playwright-locators)*

## R2 - Web-first assertions
Give it `expect(await page.locator('[data-test=title]').textContent()).toBe('Products')`.
Ask for the web-first form and why it kills the flake. *(playwright-locators)*

## R3 - Kill the sleep
A test has `await page.waitForTimeout(2000)` after login. Have Claude remove it without
adding flake (anchor on the next page's URL/heading instead). *(playwright-locators)*

## R4 - Extract a helper
The login steps are copy-pasted across three specs. Ask Claude to extract a single
`login` business-intent function - one thing, reused - not a copy. *(test-craftsmanship)*

## R5 - Facade + DI
Introduce the `App` facade and an `app` fixture so specs stop touching `page` directly.
Confirm the spec now reads as intent. *(test-craftsmanship, playwright-fixtures-auth)*

## R6 - Cheap login
Every test logs in through the UI. Make login cheap: sign in once, save
`playwright/.auth/user.json`, and start specs already authenticated with `storageState`.
Compare runtime before/after. *(playwright-fixtures-auth)*

## R7 - No Page Object Model
Claude generated a `LoginPage` page object. Ask it to explain (per the house craft) why
this repo rejects POM, then refactor it into a functional helper. *(test-craftsmanship)*

## R8 - Make it deterministic
An inventory test is flaky when `/api/products` is slow. Have Claude stub the response
with `page.route` so it runs the same every time. *(playwright-network-mocking)*

## R9 - Assert the invariant, not the bug
Add a broken-image audit that asserts *no broken images* on `/inventory` (it will fail
on the Desk Lamp - that failure is the finding). Contrast with asserting the known bug
directly. *(playwright-bug-hunting)*

## R10 - Add the API seam
Write a pure API test for `GET /api/products` (status + shape), then discuss the hybrid
pattern: seed via API, assert through the UI. *(playwright-api-testing)*

## Stretch

- Give Claude a full generic "log in, sort by price, add the cheapest item, open cart"
  spec and have it refactor the whole thing to house style in one pass, verifying each
  selector against the app with the MCP as it goes.
- Ask Claude to review one of your refactored specs against `test-craftsmanship` and
  **name the smell + file + fix** for anything left.

---

# The refactor checklist

From `test-craftsmanship` - a spec is done when:

- [ ] The spec reads as intent, with no raw locators or `page.` plumbing.
- [ ] Each new function is one responsibility, one reason to change.
- [ ] A duplicated flow became a shared function, not a copy-paste.
- [ ] All assertions are web-first, and none hide inside an action.
- [ ] It would still work if you swapped the UI for the API surface.
- [ ] Structure was added only where duplication/variation justified it (no cargo cult).
- [ ] Locators follow the priority: role -> label -> placeholder -> testId, no CSS chains.

When these hold, the generic test has become a house-style test - and you did it with
the skills + `CLAUDE.md`, not by hand.
