import { test as base, expect } from '@playwright/test';
import { createApp, type App } from '../src/app';

/**
 * Network evidence for failure triage (Module 9).
 *
 * Records every failed request and every HTTP >= 400 response during a test.
 * When the test fails, the log is attached to the report as
 * `network-failures.txt`, tagged [first-party] (same origin as baseURL) or
 * [third-party]. The triage agent uses this to tell "the app misbehaved"
 * apart from "an external dependency or the environment misbehaved" — the
 * browser-level error message alone can't make that call.
 *
 * CI notes: evidence is kept in memory (no temp files, no $DISPLAY) and only
 * written into the report as an attachment on failure, so it behaves
 * identically headed (workshop laptops) and headless (CI). Attachments with a
 * `body` are embedded in the JSON report, so they travel with the CI artifact
 * without any extra upload path. The fixture runs per attempt, so with
 * `retries: 2` in CI you get evidence from each failing attempt.
 *
 * Specs import { test, expect } from this file instead of '@playwright/test'.
 * tests/seed.spec.ts is the exception — it stays on '@playwright/test' so the
 * playwright-test MCP attach flow is untouched.
 */

/** Hard cap so a redirect loop or a hammering retry can't grow the log unbounded. */
const MAX_ENTRIES = 100;

export const test = base.extend<{ _networkEvidence: void; app: App }>({
  /** The App facade, injected into specs (DI). Composed on the base `page`. */
  app: async ({ page }, use) => {
    await use(createApp(page));
  },

  _networkEvidence: [
    async ({ page, baseURL }, use, testInfo) => {
      const entries: string[] = [];
      const firstParty = baseURL ? new URL(baseURL).origin : undefined;

      const originLabel = (url: string): string => {
        if (!firstParty) return '';
        try {
          return new URL(url).origin === firstParty ? ' [first-party]' : ' [third-party]';
        } catch {
          return '';
        }
      };

      page.on('requestfailed', (request) => {
        if (entries.length >= MAX_ENTRIES) return;
        const reason = request.failure()?.errorText ?? 'request failed';
        entries.push(`${request.method()} ${request.url()} — ${reason}${originLabel(request.url())}`);
      });

      page.on('response', (response) => {
        if (entries.length >= MAX_ENTRIES) return;
        if (response.status() >= 400) {
          entries.push(
            `${response.request().method()} ${response.url()} — HTTP ${response.status()}${originLabel(response.url())}`
          );
        }
      });

      await use();

      if (testInfo.status !== testInfo.expectedStatus && entries.length > 0) {
        await testInfo.attach('network-failures.txt', {
          body: entries.join('\n'),
          contentType: 'text/plain',
        });
      }
    },
    { auto: true },
  ],
});

export { expect };
