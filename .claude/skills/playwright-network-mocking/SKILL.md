---
name: playwright-network-mocking
description: Make tests deterministic and fast by controlling the network - page.route for stubs, HAR record/replay, request/response modification, WebSocket mocking. Use when tests are flaky due to a slow/unreliable backend, when testing edge-case responses, or when running CI without external services.
---

# Network mocking & interception

Two motivations:
- **Stability** - UI test shouldn't fail because a third-party is slow.
- **Coverage** - test "what happens on 503?" without breaking the real backend.

For *using* mocking to find bugs (force empty states, slow responses), see `[[playwright-bug-hunting]]`.

## `page.route` - the core primitive

For every request matching a pattern, decide:

- `route.fulfill({...})` - reply with your own response. Real server never hit.
- `route.continue({...})` - pass through, optionally modified URL/headers/postData.
- `route.fallback()` - pass to next matching handler (layered mocks).
- `route.abort()` - drop. Simulates network failure.

Routes registered later run first.

## Stub a response

```ts
// This app's GET /api/products returns { products: [...] }, so stub that shape.
await page.route('**/api/products', route =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ products: [] }),
  })
);
```

## Modify (don't stub)

```ts
// Tweak a real response
await page.route('**/api/products', async route => {
  const response = await route.fetch();
  const json = await response.json();
  json[0].price = '$0.00';
  await route.fulfill({ response, json });
});
```

## HAR record/replay - offline determinism

```ts
// Record
const context = await browser.newContext({
  recordHar: { path: 'tests/har/inventory.har', mode: 'full' },
});

// Replay (in another test/run)
await page.routeFromHAR('tests/har/inventory.har', { url: '**/api/**', update: false });
```

Use for **third-party** dependencies. Don't HAR your own backend - stale HARs give false confidence.

## WebSocket / SSE

```ts
await page.routeWebSocket('**/ws', ws => {
  ws.onMessage(m => m === 'subscribe' && ws.send('{"event":"tick"}'));
});
```

## Layering (fixture + per-test override)

Per-test routes run before fixture-scoped ones (later registration wins). See `[[playwright-fixtures-auth]]` for fixture setup.

## Decision matrix

| You want to… | Pattern |
|---|---|
| Test loading / empty / error states | `route.fulfill` per state |
| Run CI without staging | `routeFromHAR` |
| Inject test tokens | `route.continue` with modified headers |
| Assert what the app *sends* | `page.on('request', ...)` + capture |
| Block ads/trackers to speed CI | `route.abort()` on their domains |

## Pitfalls

- **Routes leak between tests** - register on `page` (fixture-scoped) or `unroute` in teardown.
- **Mocking your own backend everywhere** → you're testing your mocks. Mock third parties; keep some real end-to-ends.
- **`**/api/products` over-matches** - also hits `/api/products/123`. Use `page.route(/\/api\/products$/, ...)`.
- **Forgot `await` on `route.fulfill`** - test moves on before response is set.
- **Stale HAR** - regenerate quarterly; CI diff vs. real contract.

Workshop exercises in `WORKSHOP_GUIDE.md`.
