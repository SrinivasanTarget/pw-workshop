# Guest Checkout Flow — Verified Test Plan

## Application Overview

A verified, finalized test plan for the Guest Checkout Flow of the Playwright Workshop Store (https://playwright-workshop.pages.dev). All open questions from specs/checkout.md have been resolved against the live app. Auth is required (standard_user / workshop123). The testIdAttribute is 'data-test'. Every scenario assumes a fresh, empty-cart session.

RESOLVED OPEN QUESTIONS (from specs/checkout.md):

Q1 — Checkout button data-test id: The real id is "checkout" (not "checkout-btn"). Confirmed from the live cart page DOM.

Q2 — Cart badge counting: The badge counts DISTINCT ITEMS, not total quantity. Two distinct items → badge shows "2". The existing two-item spec asserting "4" is an intentionally injected failure on the test-failure branch and must NOT be copied.

Q3 — All-blank validation: ALL three field errors appear SIMULTANEOUSLY when Place order is clicked with all three fields empty. Each error is a separate inline element: error-firstName ("First name is required"), error-lastName ("Last name is required"), error-zip ("ZIP / postal code is required").

Q4 — Empty-cart checkout: The Checkout button is NOT rendered when the cart is empty — there is no way to reach checkout from an empty cart via the UI. Navigating directly to /checkout with an empty cart redirects immediately to /cart, which shows [data-test="cart-empty"] with text "Your cart is empty." and a "Back to inventory" link.

Q5 — Subtotal composition: The subtotal ([data-test="summary-subtotal"]) is ITEMS ONLY (raw price sum). The checkout page also shows a separate Tax (8%) line ([data-test="summary-tax"]) and a Grand Total ([data-test="summary-total"]). For a single Backpack: Subtotal $29.99, Tax $2.40, Total $32.39. For two items: Subtotal $119.49, Tax $9.56, Total $129.05.

Q6 — Remove/quantity control: YES, there is a Remove button per cart item ([data-test="cart-remove-p-{id}"]). No quantity stepper exists — each "Add to cart" adds one unit and the button changes to "Remove". Removing the last item empties the cart and hides the badge.

CONFIRMED SELECTORS:
- Login: [data-test="username"] / [data-test="password"] / [data-test="login-submit"]
- Add Workshop Backpack ($29.99): [data-test="add-p-001"]
- Add Mechanical Keyboard ($89.50): [data-test="add-p-002"]
- Cart badge: [data-test="cart-badge"] (inside the Cart nav link; absent when cart is empty)
- Cart link accessible name: "Cart" (no badge) or "Cart1", "Cart2", etc.
- Cart item list: [data-test="cart-list"]; items: [data-test="cart-item-p-001"], [data-test="cart-item-p-002"]
- Remove buttons in cart: [data-test="cart-remove-p-001"], [data-test="cart-remove-p-002"]
- Cart total display: [data-test="cart-total"]
- Empty cart sentinel: [data-test="cart-empty"]
- Checkout button: [data-test="checkout"]
- Checkout form: [data-test="checkout-form"]
- Shipping fields: [data-test="firstName"] / [data-test="lastName"] / [data-test="zip"]
- Place order: [data-test="place-order"]
- Validation errors: [data-test="error-firstName"] / [data-test="error-lastName"] / [data-test="error-zip"]
- Order summary subtotal: [data-test="summary-subtotal"]
- Order summary tax: [data-test="summary-tax"]
- Order summary total: [data-test="summary-total"]
- Confirmation heading: [data-test="thank-you"] (h1 text: "Thanks for your order")
- Order ID: [data-test="order-id"]
- Routes: /login, /inventory, /cart, /checkout, /checkout/complete

## Test Scenarios

### 1. Guest Checkout

**Seed:** `tests/seed.spec.ts`

#### 1.1. 1.1 Successful checkout — single item

**File:** `tests/guest-checkout/single-item-checkout.spec.ts`

**Steps:**
  1. Navigate to /login. Fill [data-test='username'] with 'standard_user' and [data-test='password'] with 'workshop123'. Click [data-test='login-submit'].
    - expect: The page navigates to /inventory. The Products heading is visible.
  2. Click [data-test='add-p-001'] (Add to cart for Workshop Backpack, $29.99).
    - expect: The button changes to 'Remove'. [data-test='cart-badge'] shows '1'. The Cart nav link accessible name becomes 'Cart1'.
  3. Click the Cart nav link (accessible name 'Cart1') to open the cart.
    - expect: The URL is /cart. The heading 'Your cart' is visible. [data-test='cart-item-p-001'] is present and contains 'Workshop Backpack' and '$29.99'. [data-test='cart-total'] shows '$29.99'. The [data-test='checkout'] button is visible and enabled.
  4. Click [data-test='checkout'].
    - expect: The URL is /checkout. An h1 with text 'Checkout' is visible. The Order summary section lists 'Workshop Backpack' at '$29.99'. [data-test='summary-subtotal'] shows '$29.99'. [data-test='summary-tax'] shows '$2.40'. [data-test='summary-total'] shows '$32.39'.
  5. Fill [data-test='firstName'] with 'Ada', [data-test='lastName'] with 'Lovelace', [data-test='zip'] with '00001'. Click [data-test='place-order'].
    - expect: The URL is /checkout/complete. [data-test='thank-you'] (h1) is visible with text 'Thanks for your order'. [data-test='order-id'] is visible and contains an order reference starting with 'WS-'. A link with accessible name 'Continue shopping' pointing to /inventory is visible. The cart badge is absent from the header (cart is now empty).

#### 1.2. 1.2 Successful checkout — two items

**File:** `tests/guest-checkout/two-item-checkout.spec.ts`

**Steps:**
  1. Navigate to /login. Fill [data-test='username'] with 'standard_user' and [data-test='password'] with 'workshop123'. Click [data-test='login-submit'].
    - expect: The page navigates to /inventory.
  2. Click [data-test='add-p-001'] (Workshop Backpack, $29.99).
    - expect: [data-test='cart-badge'] shows '1'.
  3. Click [data-test='add-p-002'] (Mechanical Keyboard, $89.50).
    - expect: [data-test='cart-badge'] shows '2'. The Cart nav link accessible name is 'Cart2'. Note: the correct expected value is 2, not 4 — the existing two-item spec on the test-failure branch asserts 4 as an intentionally injected failure.
  4. Click the Cart nav link (accessible name 'Cart2') to open the cart.
    - expect: The URL is /cart. [data-test='cart-item-p-001'] is present containing 'Workshop Backpack' and '$29.99'. [data-test='cart-item-p-002'] is present containing 'Mechanical Keyboard' and '$89.50'. [data-test='cart-total'] shows '$119.49'. [data-test='checkout'] is visible and enabled.
  5. Click [data-test='checkout'].
    - expect: The URL is /checkout. The Order summary lists both 'Workshop Backpack' ($29.99) and 'Mechanical Keyboard' ($89.50). [data-test='summary-subtotal'] shows '$119.49' (items-only sum: 29.99 + 89.50). [data-test='summary-tax'] shows '$9.56'. [data-test='summary-total'] shows '$129.05'.
  6. Fill [data-test='firstName'] with 'Ada', [data-test='lastName'] with 'Lovelace', [data-test='zip'] with '00001'. Click [data-test='place-order'].
    - expect: The URL is /checkout/complete. [data-test='thank-you'] is visible with text 'Thanks for your order'. [data-test='order-id'] is visible. A 'Continue shopping' link pointing to /inventory is visible.

#### 1.3. 1.3 Empty First name shows validation error

**File:** `tests/guest-checkout/validation-firstname.spec.ts`

**Steps:**
  1. Log in as standard_user / workshop123 and navigate to /inventory.
    - expect: The inventory page is displayed.
  2. Click [data-test='add-p-001'] to add Workshop Backpack.
    - expect: [data-test='cart-badge'] shows '1'.
  3. Navigate to /cart and click [data-test='checkout'].
    - expect: The URL is /checkout. The Checkout heading is visible.
  4. Leave [data-test='firstName'] empty. Fill [data-test='lastName'] with 'Lovelace' and [data-test='zip'] with '00001'. Click [data-test='place-order'].
    - expect: The URL remains /checkout. The Checkout heading is still visible — no navigation to /checkout/complete occurred. [data-test='error-firstName'] is visible with text 'First name is required'. [data-test='error-lastName'] is NOT present in the DOM (no spurious lastName error). [data-test='error-zip'] is NOT present in the DOM (no spurious zip error).

#### 1.4. 1.4 Empty Last name shows validation error

**File:** `tests/guest-checkout/validation-lastname.spec.ts`

**Steps:**
  1. Log in as standard_user / workshop123 and navigate to /inventory.
    - expect: The inventory page is displayed.
  2. Click [data-test='add-p-001'] to add Workshop Backpack.
    - expect: [data-test='cart-badge'] shows '1'.
  3. Navigate to /cart and click [data-test='checkout'].
    - expect: The URL is /checkout.
  4. Fill [data-test='firstName'] with 'Ada'. Leave [data-test='lastName'] empty. Fill [data-test='zip'] with '00001'. Click [data-test='place-order'].
    - expect: The URL remains /checkout. No navigation to /checkout/complete occurred. [data-test='error-lastName'] is visible with text 'Last name is required'. [data-test='error-firstName'] is NOT present. [data-test='error-zip'] is NOT present.

#### 1.5. 1.5 Empty ZIP shows validation error

**File:** `tests/guest-checkout/validation-zip.spec.ts`

**Steps:**
  1. Log in as standard_user / workshop123 and navigate to /inventory.
    - expect: The inventory page is displayed.
  2. Click [data-test='add-p-001'] to add Workshop Backpack.
    - expect: [data-test='cart-badge'] shows '1'.
  3. Navigate to /cart and click [data-test='checkout'].
    - expect: The URL is /checkout.
  4. Fill [data-test='firstName'] with 'Ada' and [data-test='lastName'] with 'Lovelace'. Leave [data-test='zip'] empty. Click [data-test='place-order'].
    - expect: The URL remains /checkout. No navigation to /checkout/complete occurred. [data-test='error-zip'] is visible with text 'ZIP / postal code is required'. [data-test='error-firstName'] is NOT present. [data-test='error-lastName'] is NOT present.

#### 1.6. 1.6 All shipping fields empty — all errors shown simultaneously, order blocked

**File:** `tests/guest-checkout/validation-all-fields.spec.ts`

**Steps:**
  1. Log in as standard_user / workshop123 and navigate to /inventory.
    - expect: The inventory page is displayed.
  2. Click [data-test='add-p-001'] to add Workshop Backpack.
    - expect: [data-test='cart-badge'] shows '1'.
  3. Navigate to /cart and click [data-test='checkout'].
    - expect: The URL is /checkout. The shipping form [data-test='checkout-form'] is present. All three fields ([data-test='firstName'], [data-test='lastName'], [data-test='zip']) are empty.
  4. Leave all three fields empty. Click [data-test='place-order'].
    - expect: The URL remains /checkout. No navigation to /checkout/complete occurred. All three inline errors appear SIMULTANEOUSLY: [data-test='error-firstName'] with text 'First name is required', [data-test='error-lastName'] with text 'Last name is required', [data-test='error-zip'] with text 'ZIP / postal code is required'. The Checkout h1 heading is still visible.

#### 1.7. 1.7 Cart badge reflects number of distinct items added

**File:** `tests/guest-checkout/cart-badge.spec.ts`

**Steps:**
  1. Log in as standard_user / workshop123 and navigate to /inventory.
    - expect: The inventory page is displayed. [data-test='cart-badge'] does NOT exist in the DOM (cart is empty, no badge is rendered). The Cart nav link accessible name is exactly 'Cart' (no number suffix).
  2. Click [data-test='add-p-001'] to add Workshop Backpack.
    - expect: [data-test='cart-badge'] appears in the DOM with text '1'. The Cart nav link accessible name is 'Cart1'.
  3. Click [data-test='add-p-002'] to add Mechanical Keyboard.
    - expect: [data-test='cart-badge'] text changes to '2'. The Cart nav link accessible name is 'Cart2'. Note: the badge counts DISTINCT ITEMS (one unit each), not total quantity. Two items → badge = 2, not 4. The test-failure branch spec asserting '4' is an intentionally injected failure and is incorrect.

#### 1.8. 1.8 Empty cart — checkout unreachable, direct navigation redirects to cart

**File:** `tests/guest-checkout/empty-cart-checkout.spec.ts`

**Steps:**
  1. Log in as standard_user / workshop123 and navigate to /inventory without adding any items.
    - expect: The inventory page is displayed. [data-test='cart-badge'] is absent. Cart nav link accessible name is 'Cart'.
  2. Click the Cart nav link to open the cart.
    - expect: The URL is /cart. The heading 'Your cart' is visible. [data-test='cart-empty'] is present with text 'Your cart is empty.' A 'Back to inventory' link pointing to /inventory is visible. The [data-test='checkout'] button does NOT exist in the DOM — checkout is not reachable from an empty cart via the UI.
  3. Navigate directly to /checkout by setting window.location to 'https://playwright-workshop.pages.dev/checkout' (or using page.goto('/checkout')).
    - expect: The app immediately redirects to /cart. The final URL is /cart. [data-test='cart-empty'] is visible. The [data-test='checkout'] button is absent. The user is NOT able to reach the checkout form with an empty cart.

#### 1.9. 1.9 Remove item from cart

**File:** `tests/guest-checkout/cart-remove-item.spec.ts`

**Steps:**
  1. Log in as standard_user / workshop123 and navigate to /inventory.
    - expect: The inventory page is displayed.
  2. Click [data-test='add-p-001'] to add Workshop Backpack. Click [data-test='add-p-002'] to add Mechanical Keyboard.
    - expect: [data-test='cart-badge'] shows '2'. Cart nav link is 'Cart2'.
  3. Navigate to /cart.
    - expect: Both items are listed: [data-test='cart-item-p-001'] and [data-test='cart-item-p-002']. [data-test='cart-total'] shows '$119.49'. Both [data-test='cart-remove-p-001'] and [data-test='cart-remove-p-002'] Remove buttons are visible.
  4. Click [data-test='cart-remove-p-001'] to remove Workshop Backpack.
    - expect: [data-test='cart-item-p-001'] is removed from the DOM. [data-test='cart-item-p-002'] (Mechanical Keyboard) remains. [data-test='cart-total'] updates to '$89.50'. [data-test='cart-badge'] now shows '1'. Cart nav link accessible name is 'Cart1'.
  5. Click [data-test='cart-remove-p-002'] to remove Mechanical Keyboard.
    - expect: [data-test='cart-item-p-002'] is removed from the DOM. [data-test='cart-empty'] is now visible with text 'Your cart is empty.' [data-test='cart-badge'] is absent from the DOM. Cart nav link accessible name is 'Cart'. [data-test='checkout'] button is absent.
