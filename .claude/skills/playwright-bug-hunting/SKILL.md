---
name: playwright-bug-hunting
description: Use Playwright as an investigation tool, not just a regression suite - broken-image audits, console-error capture, failed-request capture, negative-path tests, accessibility scans. Use during exploratory testing or whenever a real bug is suspected but not reliably reproducible.
---

# Bug hunting with Playwright

A regression test asks "did we break what we know about?" A bug hunt asks "what's broken that we don't know about?"

Live target in this app: the **Desk Lamp** product on `/inventory` has a genuinely
broken image (its `src` points at a 404). Write the broken-image audit below and it
finds that bug with no explicit knowledge of it. See the exercise in
`WORKSHOP_GUIDE.md`.

## Patterns that find real bugs

### Broken / mismatched image audit

```ts
const findings = await page.evaluate(() =>
  Array.from(document.querySelectorAll('img')).map(img => ({
    src: img.src, alt: img.alt,
    isBroken: !img.complete || img.naturalWidth === 0,
  }))
);
expect(findings.filter(f => f.isBroken)).toEqual([]);
```

### Global console-error guard

```ts
test.beforeEach(async ({ page }) => {
  page.on('console', m => {
    if (m.type() === 'error') throw new Error(`Console error: ${m.text()}`);
  });
});
```

Every test now fails on a JS error in the app. Catches bugs the explicit assertions miss.

### Global 5xx guard

```ts
page.on('response', r => {
  if (r.status() >= 500) throw new Error(`5xx from ${r.url()}`);
});
```

### Negative paths

For every form ask: empty input? wrong password? locked / suspended / trial-expired
user? Most bugs hide in unhappy branches. In this app, try `locked_out_user`
(password `workshop123`): it should *not* reach `/inventory`. Assert that it stays
on `/login`.

### Accessibility scan

```bash
npm i -D @axe-core/playwright
```

```ts
const results = await new AxeBuilder({ page }).analyze();
expect(results.violations).toEqual([]);
```

## Anti-patterns

- **Asserting on the bug itself** ("expect this image to be broken") - once fixed, the test passes for the wrong reason. Assert on the invariant ("no broken images").
- **Tests that depend on a buggy state** that gets fixed silently - same hazard.

## Network mocking for bug-hunting

Forcing empty states, errors, slow responses - see `[[playwright-network-mocking]]`. Use it to make hard-to-reproduce bugs reproducible.

Workshop exercises in `WORKSHOP_GUIDE.md`.
