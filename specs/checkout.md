# Test Plan: Guest Checkout Flow

**Source requirement:** `requirement.md`
**App under test:** https://playwright-workshop.pages.dev (SauceDemo-style store)
**Seed:** `tests/seed.spec.ts`

> Authored from `requirement.md` and the ground truth already encoded in the
> existing specs under `tests/guest-checkout/`. The live-app exploration step
> (browser MCP) was unavailable in this run, so facts drawn from code are
> marked **[from specs]** and unresolved items are collected under
> [Open Questions](#open-questions-to-confirm-during-generation). Confirm those
> against the live app while generating.

---

## Preconditions & Conventions

- **Auth is required.** Inventory and everything downstream is login-gated. Log
  in with `standard_user` / `workshop123`. Two entry patterns both work
  **[from specs]**:
  - Go to `/login`, fill credentials, submit, then go to `/inventory`.
  - Go to `/inventory` directly and complete the login form it presents.
- **Fresh state.** Every scenario assumes a new session with an **empty cart**.
  Scenarios are independent and may run in any order.
- **`data-test` is the test id.** `playwright.config.ts` sets
  `testIdAttribute: 'data-test'`, so `getByTestId('username')` resolves to
  `[data-test="username"]`.

## Reference Selectors & Data [from specs]

| Element / data                | Selector / value                                   |
| ----------------------------- | -------------------------------------------------- |
| Username / password / submit  | `username` / `password` / `login-submit`           |
| Add Workshop Backpack ($29.99)| `add-p-001`                                         |
| Add Mechanical Keyboard ($89.50)| `add-p-002`                                       |
| Cart header link              | role `link`, name starts with `Cart` (badge count appended, e.g. "Cart1") |
| Cart badge                    | `cart-badge`                                        |
| Checkout button               | `checkout` **or** `checkout-btn` — see Open Q1      |
| Shipping fields               | `firstName` / `lastName` / `zip`                    |
| Place order                   | `place-order`                                       |
| Field errors (inline)         | `error-firstName` / `error-lastName` / `error-zip`  |
| Checkout page heading         | role `heading`, name `Checkout`                     |
| Confirmation heading / marker | `Thanks for your order` / `thank-you`               |
| Confirmation link             | role `link`, name `Continue shopping`               |
| Routes                        | `/login` · `/inventory` · `/cart` · `/checkout` · `/checkout/complete` |

---

## 1. Guest Checkout

**Seed:** `tests/seed.spec.ts`

### 1.1 Successful checkout — single item

_Covers US-1..US-4, AC-1, FR-1..FR-11._

**Steps:**
1. Log in as `standard_user` / `workshop123` and open `/inventory`.
2. Add the **Workshop Backpack** to the cart (`add-p-001`).
3. Verify the header Cart link reflects **1** item.
4. Open the cart via the header **Cart** link; verify the URL is `/cart`.
5. Verify the cart lists **Workshop Backpack**.
6. Click **Checkout**; verify the URL is `/checkout` and the **Checkout** heading is visible.
7. Verify the order summary lists **Workshop Backpack** with a subtotal of **$29.99**.
8. Fill First name `Ada`, Last name `Lovelace`, ZIP `00001`.
9. Click **Place order**.

**Expected:**
- The app navigates to `/checkout/complete`.
- The **Thanks for your order** confirmation (`thank-you`) is visible.
- A **Continue shopping** link is visible.

### 1.2 Successful checkout — two items

_Covers AC-2, FR-9 (subtotal math)._

**Steps:**
1. Log in and open `/inventory`.
2. Add **Workshop Backpack** (`add-p-001`) and **Mechanical Keyboard** (`add-p-002`).
3. Verify the cart badge/Cart link reflects **2** items (see Open Q2).
4. Open the cart; verify both **Workshop Backpack** and **Mechanical Keyboard** are listed.
5. Click **Checkout**.
6. Verify the order summary lists **both** items and shows a subtotal of **$119.49** (`29.99 + 89.50`).
7. Fill First name `Ada`, Last name `Lovelace`, ZIP `00001`.
8. Click **Place order**.

**Expected:**
- The app navigates to `/checkout/complete`.
- The **Thanks for your order** confirmation is visible.

### 1.3 Empty First name shows validation error

_Covers VR-1, AC-3._

**Steps:**
1. Log in, open `/inventory`, add **Workshop Backpack** (`add-p-001`).
2. Open the cart and click **Checkout**.
3. Leave **First name** empty; fill Last name `Lovelace` and ZIP `00001`.
4. Click **Place order**.

**Expected:**
- Inline error `error-firstName` is visible with text **"First name is required"**.
- The user stays on `/checkout` (the **Checkout** heading is still visible).
- No navigation to `/checkout/complete` occurs.

### 1.4 Empty Last name shows validation error

_Covers VR-2, AC-3._

**Steps:**
1. Log in, open `/inventory`, add **Workshop Backpack** (`add-p-001`).
2. Open the cart and click **Checkout**.
3. Fill First name `Ada`; leave **Last name** empty; fill ZIP `00001`.
4. Click **Place order**.

**Expected:**
- Inline error `error-lastName` is visible with text **"Last name is required"**.
- The user stays on `/checkout`.

### 1.5 Empty ZIP shows validation error

_Covers VR-3, AC-3._

**Steps:**
1. Log in, open `/inventory`, add **Workshop Backpack** (`add-p-001`).
2. Open the cart and click **Checkout**.
3. Fill First name `Ada` and Last name `Lovelace`; leave **ZIP** empty.
4. Click **Place order**.

**Expected:**
- Inline error `error-zip` is visible with text **"ZIP / postal code is required"**.
- The user stays on `/checkout`.

### 1.6 All shipping fields empty — order blocked

_Covers VR-4; boundary case for "any required field empty"._

**Steps:**
1. Log in, open `/inventory`, add **Workshop Backpack** (`add-p-001`).
2. Open the cart and click **Checkout**.
3. Leave First name, Last name, and ZIP all empty.
4. Click **Place order**.

**Expected:**
- The user stays on `/checkout` (no navigation to `/checkout/complete`).
- At least one required-field error is shown (ideally all three:
  `error-firstName`, `error-lastName`, `error-zip`) — confirm the app's
  behavior when multiple fields are blank (see Open Q3).

### 1.7 Cart badge reflects the number of items added

_Covers FR-2, FR-3; guards against the badge miscount seen on this branch._

**Steps:**
1. Log in and open `/inventory`. Verify no cart badge / a zero count initially.
2. Add **Workshop Backpack** (`add-p-001`); verify the badge shows **1**.
3. Add **Mechanical Keyboard** (`add-p-002`); verify the badge shows **2**.

**Expected:**
- The badge equals the number of distinct items added (**2** after two adds).

> ⚠️ The existing `tests/guest-checkout/two-item-checkout.spec.ts` asserts the
> badge shows **`4`** after adding two items (its own comment says "shows '2'").
> This is on the `test-failure` branch (commit _"trfailing the test"_) and
> appears to be an **intentionally injected failure**. This plan treats the
> correct expectation as **2** and calls out the mismatch for confirmation
> (see Open Q2). Do not copy the `4` assertion.

### 1.8 Checkout with an empty cart (edge case)

_Not in the requirement's happy paths; probes an undefined boundary._

**Steps:**
1. Log in and open `/inventory` without adding anything.
2. Attempt to reach checkout — via the **Cart → Checkout** path if the button
   is enabled, or by navigating directly to `/checkout`.

**Expected (to be determined on the live app — see Open Q4):**
- Document the actual behavior: is checkout blocked/redirected for an empty
  cart, or does it show an empty order summary with a **$0.00** subtotal and a
  disabled/no-op **Place order**? Assert whatever the app actually does.

---

## Traceability

| Requirement            | Scenario(s)          |
| ---------------------- | -------------------- |
| US-1 / FR-1..FR-3      | 1.1, 1.2, 1.7        |
| US-2 / FR-4..FR-6      | 1.1, 1.2             |
| US-3 / FR-7..FR-9      | 1.1, 1.2             |
| US-4 / FR-10, FR-11    | 1.1, 1.2             |
| US-5 / VR-1..VR-4      | 1.3, 1.4, 1.5, 1.6   |
| AC-1                   | 1.1                  |
| AC-2                   | 1.2                  |
| AC-3                   | 1.3, 1.4, 1.5, 1.6   |

---

## Open Questions to confirm during generation

1. **Checkout button id.** Specs disagree: `two-item-checkout` and the three
   validation specs use `[data-test="checkout"]`, but `single-item-checkout`
   uses `[data-test="checkout-btn"]`. Confirm the real id on the live app and
   standardize the generated specs on it.
2. **Cart badge counting (requirement Open Q1).** Does the badge count
   **distinct items** or **total quantity**? Two distinct items should read
   **2**; the existing two-item spec's **`4`** contradicts this and is presumed
   to be the injected failure. Confirm on the live app.
3. **Validation error presentation (requirement Open Q3).** Errors are
   **inline, per-field** with ids `error-firstName` / `error-lastName` /
   `error-zip` **[confirmed from specs]**. Still confirm whether **all** blank
   fields error simultaneously (scenario 1.6) or only the first.
4. **Empty-cart checkout (requirement Open Q2).** Is checkout reachable with an
   empty cart, and what does it show? Drives scenario 1.8.
5. **Subtotal composition (requirement Open Q4).** Is the subtotal
   **items-only**, or does it include tax/shipping? Specs only ever assert the
   raw item sum ($29.99, $119.49), implying items-only — confirm no
   tax/shipping line changes the total.
6. **Remove / quantity control (requirement Open Q2).** Is there a remove or
   quantity control in the cart? If so, it deserves its own scenario (out of
   scope for this plan per the requirement, but worth noting).
