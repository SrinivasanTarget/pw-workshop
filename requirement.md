# Requirement: Guest Checkout Flow

**Feature:** Browse → Cart → Checkout → Order Confirmation
**App under test:** https://playwright-workshop.pages.dev (a SauceDemo-style store)
**Status:** Ready for test planning

---

## 1. Summary

A logged-in shopper must be able to add one or more products to their cart,
review the cart, provide shipping details, and place an order. On success they
see an order-confirmation screen. The flow must reject incomplete shipping
details with clear, inline validation.

## 2. Actors & Preconditions

- **Actor:** Authenticated shopper.
- **Auth:** Inventory and all downstream pages require login. Use the workshop
  credentials `standard_user` / `workshop123`. Visiting `/inventory` while
  logged out redirects to the login screen.
- **Starting state:** Every scenario assumes a fresh session with an **empty
  cart** unless it explicitly adds items.

## 3. Key Screens & Routes

| Step          | Route                | Notes                                   |
| ------------- | -------------------- | --------------------------------------- |
| Login         | `/` (or `/login`)    | `username`, `password`, `login-submit`  |
| Inventory     | `/inventory`         | Product grid with "Add to cart" buttons |
| Cart          | `/cart`              | Reached via the header **Cart** link    |
| Checkout      | `/checkout`          | Shipping form + order summary           |
| Confirmation  | `/checkout/complete` | Shows heading "Thanks for your order"   |

## 4. Reference Product Data

| Product ID | Name                | Price   | Add button `data-test` |
| ---------- | ------------------- | ------- | ---------------------- |
| p-001      | Workshop Backpack   | $29.99  | `add-p-001`            |
| p-002      | Mechanical Keyboard | $89.50  | `add-p-002`            |

> Additional products exist on the inventory page; the planner should confirm
> the full catalogue by exploring the live app.

## 5. User Stories

- **US-1** — As a shopper, I can add a product to my cart from the inventory
  page and see the cart badge reflect the number of items.
- **US-2** — As a shopper, I can open my cart and see every item I added.
- **US-3** — As a shopper, I can start checkout, enter my shipping details, and
  review an order summary that lists my items and a correct subtotal.
- **US-4** — As a shopper, I can place my order and land on a confirmation
  screen.
- **US-5** — As a shopper, I am prevented from placing an order when required
  shipping fields are missing, and I am told which field is wrong.

## 6. Functional Requirements

### 6.1 Add to cart (Inventory)
- FR-1 Each product exposes an **Add to cart** action.
- FR-2 Adding an item increments the header **cart badge** count.
- FR-3 The badge reflects the total quantity in the cart at all times.

### 6.2 Cart review
- FR-4 The **Cart** link in the header navigates to `/cart`.
- FR-5 The cart lists every added product by name.
- FR-6 A **Checkout** action navigates to `/checkout`.

### 6.3 Checkout — shipping details
- FR-7 The checkout page presents a shipping form with **First name**,
  **Last name**, and **ZIP / postal code** fields (`firstName`, `lastName`,
  `zip`).
- FR-8 All three fields are **required**.
- FR-9 An **order summary** on the checkout page lists each item and shows a
  **subtotal equal to the sum of the item prices**.

### 6.4 Place order
- FR-10 **Place order** (`place-order`) submits the order when the form is valid.
- FR-11 On success, the app navigates to `/checkout/complete` and displays the
  heading **"Thanks for your order"**.

## 7. Validation Rules (Negative Cases)

| Rule  | Condition                          | Expected result                                   |
| ----- | ---------------------------------- | ------------------------------------------------- |
| VR-1  | First name empty on Place order    | Order not placed; inline error for First name     |
| VR-2  | Last name empty on Place order     | Order not placed; inline error for Last name      |
| VR-3  | ZIP empty on Place order           | Order not placed; inline error for ZIP            |
| VR-4  | Any required field empty           | Stay on `/checkout` (no navigation to complete)   |

## 8. Acceptance Criteria

- **AC-1 (happy path, single item)** Given a fresh session, when the shopper
  logs in, adds **Workshop Backpack**, opens the cart, checks out, fills
  `Ada` / `Lovelace` / `00001`, and places the order — then the confirmation
  page at `/checkout/complete` shows "Thanks for your order" and the order
  summary listed the Backpack at **$29.99**.
- **AC-2 (happy path, two items)** Adding **Workshop Backpack** and
  **Mechanical Keyboard** results in an order summary listing both items with a
  subtotal of **$119.49**.
- **AC-3 (validation)** Attempting to place an order with any of First name,
  Last name, or ZIP blank keeps the shopper on `/checkout` and surfaces an
  inline error naming the missing field.

## 9. Scope

**In scope:** login-gated browse, add-to-cart, cart review, shipping-form
validation, subtotal calculation, order placement, confirmation.

**Out of scope (for this requirement):** payment processing, taxes/shipping
fees, quantity editing in cart, item removal, promo codes, inventory sorting,
and logout.

## 10. Open Questions for the Planner to Resolve

1. Does the cart badge show **item count** or **total quantity**? Confirm on the
   live app.
2. Is there a **Remove** / quantity control in the cart, and should it be
   covered separately?
3. Are validation errors shown inline per-field, or as a single summary banner?
4. Does the subtotal include tax or shipping, or is it items-only?
