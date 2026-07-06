---
name: playwright-debugging
description: Unblock a failing or hard-to-author Playwright test - UI mode, codegen, trace viewer, Inspector, page.pause(), failure artifacts. Use whenever a test fails mysteriously, when you need to discover a locator, or when stepping through a flow.
---

# Debugging Playwright

Five tools, in the order to reach for them.

## 1. `--ui` - primary workflow

```bash
npx playwright test --ui
```

Time-travel DOM snapshots per step, file watcher, locator picker. Replaces 90% of `console.log`.

## 2. `codegen` - discover a locator

```bash
npx playwright codegen https://playwright-workshop.pages.dev/login
```

Click in the browser → it writes the test. Treat output as a **starting point**, not a commit. It often picks brittle text or `nth(n)`.

## 3. Trace viewer - for "why did CI fail"

This repo's config sets `trace: 'on-first-retry'`. View a saved trace:

```bash
npx playwright show-trace test-results/.../trace.zip
```

Look at: failed step's DOM snapshot, network tab (5xx? slow?), console tab (JS errors).

## 4. `--debug` - Inspector + step through

```bash
npx playwright test path/to.spec.ts:9 --debug
```

Hover any locator → highlight. Edit locator inline → see what matches.

## 5. `await page.pause()` - drop-in breakpoint

```ts
await page.pause();
```

Runs normally until hit, then opens Inspector.

## Failure artifacts (config)

```ts
use: {
  trace: 'retain-on-failure',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
},
```

Most "what happened?" tickets answer themselves once these are on.

## Decision matrix

| Situation | Reach for |
|---|---|
| Test failed, don't know why | HTML report → trace |
| Need to write a new locator | `codegen` or `--ui` locator picker |
| Step through line by line | `--debug` or `page.pause()` |
| Passes locally, fails in CI | `trace: 'retain-on-failure'`, download artifact |
| Flakes 1 in 10 | Usually a missing `expect(...)` before the action - check trace's last passing step |
