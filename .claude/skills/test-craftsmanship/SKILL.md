---
name: test-craftsmanship
description: The house craft for this repo - SOLID, DRY, clean code, the Dependency Rule, code smells, and design-pattern discipline (Uncle Bob's canon) applied to test automation for UI and API. Use when writing, refactoring, or reviewing test code, or deciding how much structure a framework needs. Explains why this repo rejects the Page Object Model in favor of lightweight functional helpers.
---

# Test craftsmanship

Test code is production code. It is read far more than it is written, it outlives the
features it covers, and a flaky or unreadable suite erodes trust faster than no suite
at all. So we hold it to the same bar as the app.

This skill aggregates Robert C. Martin's craft - Clean Code, Clean Architecture, The
Clean Coder, Clean Agile, and design-pattern discipline - and applies it to tests. It
is about **structure and design, not syntax**: naming style, line length, and
formatting stay the job of the linter/formatter, not this skill. (Adapted from Uncle
Bob's books and the community `uncle-bob-craft` skill.)

## Clean code, applied to tests

- **Names reveal intent.** A test title states a behaviour ("standard_user can sign
  in"), not a mechanic ("test1"). A helper is a business verb (`login`, `addToCart`),
  never `doStuff`.
- **Small things that do one thing.** If you can extract another meaningful step from a
  function, it was doing two. Extract until you can't.
- **Few arguments.** 0-2 is comfortable, 3 is a smell, more wants an object. Never a
  boolean flag argument - `submit(true)` should be two named functions.
- **Command-Query Separation.** A function either *does* something (returns void) or
  *answers* something (returns a value/Locator) - never both. Actions command; query
  helpers answer.
- **DRY, but the right abstraction.** A duplicated flow collapses into one function; a
  duplicated locator lives in one place. But a little duplication beats the wrong
  abstraction - don't unify two things that merely look alike today.
- **Fail loudly.** Prefer an exception with a clear message over a silent fallback.
- **No comments that apologise for the code.** Make the code say it; keep comments for
  the "why", not the "what".
- **Assertions are web-first.** `await expect(locator).toX()`, never
  `expect(await locator.textContent())`. Let Playwright wait ([[playwright-locators]]).

## SOLID, in context

| Principle | In this repo |
|---|---|
| **SRP** - one reason to change | A `login` action owns the login flow; a products API client owns that endpoint; the thin `App` facade owns the driver seam. A login-screen change touches one file. |
| **OCP** - open to extension | Add a new action/query as a new function; you stop editing an ever-growing god-object. |
| **LSP** - substitutability | Anything typed `App` works anywhere an `App` is expected - including a future authenticated variant. |
| **ISP** - small interfaces | API helpers take the narrow `APIRequestContext`, not the whole `App`. Depend on exactly what you use. |
| **DIP** - depend on abstractions | Actions depend on the `App` facade, not on raw Playwright globals. The concrete `page`/`request` are injected by the `app` fixture. |

## The Dependency Rule (Clean Architecture)

Dependencies point **inward**. Business intent (the `login` action, the products
client) is the center; the Playwright driver is a detail at the edge, wrapped by the
`App` facade. Specs and actions never reach past the facade to poke `page` globals,
so swapping how we reach the browser or API changes one seam, not the suite.

## Code smells (name them in review)

| Smell | Meaning |
|---|---|
| Rigidity | A small change forces many edits. |
| Fragility | A change breaks unrelated areas. |
| Immobility | Hard to reuse a piece in another context. |
| Viscosity | Easy to hack, hard to do the right thing. |
| Needless complexity | Speculative or unused abstraction. |
| Needless repetition | DRY violated; the same idea in several places. |
| Opacity | Code is hard to understand. |

In a review, **name the smell with its file/function and propose one or two concrete
refactors** ("SRP: this parses and asserts - split it", "invert this so the spec
depends on the facade, not `page`"). "Violates SOLID" with no location or fix is not
a review.

## Design patterns: use vs misuse

- Introduce a pattern when a **real** design need appears - roughly the *third
  duplication* or the *second reason to change* - and name it so intent is clear.
- **Avoid cargo cult.** Don't add a Factory/Strategy/Screenplay layer because the repo
  "should" have one. Signs of misuse: a pattern name in every file, layers that only
  delegate without logic, abstraction that makes simple code harder to follow (the
  *needless complexity* smell).
- **Why this repo uses plain functions.** For today's small suite, a `login` function
  plus a thin `App` facade is enough and reads clearly. The **Screenplay pattern**
  (Actors/Abilities/Tasks/Questions) is the principled next step *if* this grows a
  second axis of change - many reused flows across a broad UI **and** API surface. We
  don't build it speculatively; that would be the smell, not the cure.

## Why we do NOT use the Page Object Model

The POM is the industry default, and it fights the principles above:

- **It violates SRP.** A page object accretes locators + actions + often assertions for
  a whole page - many reasons to change, and it grows into a god-object.
- **It thinks in UI, not user.** Methods describe *how* you click, not *what* the user
  achieves, so tests read as mechanics.
- **It doesn't cross interfaces.** A page object is welded to the screen, so you can't
  reuse a flow via the API. When the UI is the only abstraction, everything gets tested
  through it - slow and brittle.
- **It leans on inheritance** (a `BasePage`) where composition is looser and cleaner.

## One model, UI or API

The same `App` drives the browser or, via a typed API client, calls HTTP directly. A hybrid test
seeds state through the API (fast, reliable) and asserts through the UI. The principles
don't change between UI and API - only the collaborator does ([[playwright-api-testing]],
[[playwright-fixtures-auth]]).

## The shape to refactor toward

Generic AI-written tests inline everything - locators, actions, and assertions in the
spec. Refactor toward this layout (you build it as you go; it does not exist yet):

```
src/app.ts         the App facade + createApp: the driver seam tests depend on (DIP)
src/actions/       business-intent functions (login, ...); one thing each, reused (DRY)
src/api/           typed clients (products): one place per endpoint + its shape
tests/fixtures.ts  composes page/request into `app` and injects it (DI)
tests/*.spec.ts    read as intent; assertions web-first, in the spec
```

## Craft checklist (before you push a test)

- Does the spec read as intent, with no raw locators or `page.` plumbing?
- Is each new function one responsibility, one reason to change?
- Did a duplicated flow become a shared function, not a copy-paste?
- Are all assertions web-first, and none hiding inside an action?
- Would this still work if you swapped the UI for the API surface?
- Did you add structure only where duplication/variation justified it (no cargo cult)?
- Linter and formatter run separately and green (craft is not style).
