# Stage 1 - Explore the Playwright MCP server

Stage 1 is **raw MCP only**. Skills, the planner/generator/healer agents, and the
`playwright-test` MCP are disabled (see `WORKSHOP_GUIDE.md` > Stage gating), so the
only AI surface is the general **`playwright` MCP** - the full browser-automation
server. The goal: drive and inspect a real app, and see the full range of what the
MCP can do, before any house-style skills or agents enter.

App under test: **https://playwright-workshop.pages.dev** (relative paths below are
against that origin).

> New here? [`MCP_SERVERS.md`](../MCP_SERVERS.md) explains how the general
> `playwright` MCP (stage 1) differs from `run-test-mcp-server` (stage 2).

## How you drive it

You do not call tools by hand. In the **Claude Code panel** you type a plain-English
request; Claude decides which `playwright` tools to call and shows each call.
**Watch the tool calls** - that stream *is* the MCP server working. Each exercise
lists the tool(s) it should exercise so you can connect the ask to the capability.

> ✅ **No setup ceremony.** The general `playwright` MCP is a raw browser driver -
> just ask Claude to navigate and act. (The `planner_setup_page` step belongs to the
> stage-2 `run-test-mcp-server`, which is off here.)
>
> ⚠️ **Two tools are unavailable by design** (they are `skillOnly`): there is no
> `browser_reload` (ask Claude to **re-navigate** the same URL) and no
> `browser_check` (ask it to **click** the checkbox). `browser_navigate_forward`
> is absent too.

## Test accounts (password `workshop123` for all)

| User | Expect |
|---|---|
| `standard_user` | Happy path |
| `locked_out_user` | Cannot reach `/inventory` |
| `problem_user` | A planted quirk to discover |
| `glitch_user` | A planted quirk to discover |

## What the MCP can do (capability map)

| Capability | Tools |
|---|---|
| Navigate | `browser_navigate`, `browser_navigate_back`, `browser_tabs` (re-navigate for reload) |
| Observe structure | `browser_snapshot` (accessibility tree), `browser_take_screenshot`, `browser_generate_locator` |
| Interact | `browser_click` (also ticks checkboxes), `browser_type`, `browser_fill_form`, `browser_select_option`, `browser_hover`, `browser_press_key`, `browser_drag`/`drop`, `browser_file_upload`, `browser_handle_dialog` |
| Verify / wait | `browser_wait_for`, `browser_verify_element_visible`, `browser_verify_text_visible`, `browser_verify_list_visible`, `browser_verify_value` |
| Investigate | `browser_evaluate`, `browser_console_messages`, `browser_network_requests`, `browser_network_request` |
| Control the network | `browser_route`, `browser_route_list`, `browser_unroute`, `browser_network_state_set` |
| State & storage | `browser_cookie_*`, `browser_localstorage_*`, `browser_sessionstorage_*`, `browser_storage_state`, `browser_set_storage_state` |
| Diagnose & record | `browser_highlight`, `browser_annotate`, `browser_resize`, `browser_start_tracing`/`stop`, `browser_start_video`/`stop`, `browser_pdf_save` |

---

# Part A - Instructor-led walkthrough

Run these live first, thinking aloud. Each shows a prompt to type and what to point out.

1. **First look.** *"Go to /login and snapshot it."*
   Point out: the snapshot is an **accessibility tree** (roles + names), not a picture -
   that is what Claude reasons over. (`browser_navigate`, `browser_snapshot`.)
2. **Sign in.** *"Sign in as standard_user (password workshop123) and confirm we land
   on the Products page."* Point out how Claude picks the Username/Password fields and
   the Sign in button from the snapshot. (`browser_type`/`browser_fill_form`,
   `browser_click`, `browser_wait_for`.)
3. **Verify, don't guess.** *"Verify the 'Products' heading is visible and that there
   are 6 products."* (`browser_verify_element_visible`, `browser_verify_list_visible`.)
4. **Find a bug nobody told you about.** *"Check every product image on /inventory and
   tell me which ones are broken."* Reveal: the **Desk Lamp** image points at a 404.
   (`browser_evaluate`.)
5. **Look under the hood.** *"Show the network requests this page made, and any console
   errors."* Point out `GET /api/products`. (`browser_network_requests`,
   `browser_console_messages`.)
6. **Bend reality.** *"Intercept /api/products to return an empty product list, then
   re-open /inventory and describe what it shows."* Does it empty gracefully or
   break? (`browser_route`, `browser_navigate`.)
7. **A native dialog.** *"Go to /playground/dialogs, trigger the confirm dialog, and
   accept it."* (`browser_handle_dialog`, `browser_click`.)
8. **Get a real locator.** *"Generate a Playwright locator for the Sort dropdown on
   /inventory."* Bridge to stage 2: this is the selector a test would use.
   (`browser_generate_locator`.)
9. **Leave evidence.** *"Take a screenshot of the inventory page and save a trace of the
   last few steps."* (`browser_take_screenshot`, `browser_start_tracing`/`stop`.)
10. **Hand off.** Point attendees at Part B and the checklist.

---

# Part B - Your turn (attendee exercises)

Pick any order. For each: give Claude the prompt, watch the tool calls, confirm the
result. Tools you should see are in *italics*.

## G1 - Navigate

1. Open `/login`, then `/inventory`, then use browser history to go back. *(browser_navigate, browser_navigate_back)*
2. Open `/inventory` and `/cart` in two tabs and list the open tabs. *(browser_tabs)*
3. Re-open `/inventory` (navigate to it again) and confirm it re-fetches the products. *(browser_navigate, browser_network_requests)*

## G2 - Observe

4. Snapshot `/login`, then take a screenshot of the same page. Which is more useful to reason over, and why? *(browser_snapshot vs browser_take_screenshot)*
5. Ask for a Playwright locator for the Username field and for the Sign in button. *(browser_generate_locator)*
6. From the snapshot alone, list every interactive element on `/login` and its accessible name. *(browser_snapshot)*

## G3 - Interact: the login form

7. Sign in as `standard_user` by filling the form in one shot. *(browser_fill_form, browser_click)*
8. Sign in by typing each field separately and pressing Enter to submit. *(browser_type, browser_press_key)*
9. Try to submit the login form empty - what happens? *(browser_click, browser_snapshot)*

## G4 - Interact: inventory

10. Sort products by "Price (low-high)" and read back the first product. *(browser_select_option)*
11. Add "Desk Lamp" and "Lab Notebook" to the cart, then open the cart and describe it. *(browser_click, browser_navigate)*
12. Find the one product whose Add button is disabled and explain why. *(browser_snapshot)* (Hint: Aeropress Go is out of stock.)

## G5 - Verify & wait

13. Assert the Logout button shows the logged-in username. *(browser_verify_text_visible)*
14. Assert there are exactly 6 product cards. *(browser_verify_list_visible)*
15. On `/playground/toasts`, trigger a toast and wait for it to disappear. *(browser_wait_for with textGone)*

## G6 - Investigate

16. List the broken or mismatched images on `/inventory`. *(browser_evaluate)*
17. Capture `GET /api/products` and report the status and how many products it returns. *(browser_network_requests, browser_network_request)*
18. Watch the console while you log in with each account - does any user log a JS error? *(browser_console_messages)*

## G7 - Control the network

19. Stub `/api/products` to return `{ "products": [] }`, re-open `/inventory`, and describe the empty state (or crash). *(browser_route, browser_navigate)*
20. Make `/api/products` return a 500, re-open `/inventory`, and describe how the page handles it. *(browser_route, browser_navigate)*
21. Go offline (`browser_network_state_set`), re-open `/inventory`, and report what breaks. *(browser_network_state_set, browser_navigate)*

## G8 - State & storage

22. After logging in, inspect localStorage and cookies. Where does this app keep the session? (Login is client-side - there is no `/api/login`.) *(browser_localstorage_list, browser_cookie_list)*
23. Save the storage state to a file, then re-apply it with `browser_set_storage_state` and confirm the session is preserved. *(browser_storage_state, browser_set_storage_state)*
24. Clear the session storage and re-open the page - are you logged out? *(browser_sessionstorage_clear, browser_navigate)*

## G9 - Playground patterns (one page each)

25. **Forms** (`/playground/forms`): fill text, pick a select option, tick a checkbox (click it), choose a radio, and upload a file. *(browser_fill_form, browser_select_option, browser_click, browser_file_upload)*
26. **Tables** (`/playground/tables`): sort a column, filter by text, page through results. *(browser_click, browser_type)*
27. **Dialogs** (`/playground/dialogs`): accept an alert, accept a confirm, answer a prompt, and dismiss a modal with Escape. *(browser_handle_dialog, browser_press_key)*
28. **Drag & Drop** (`/playground/dragdrop`): reorder the sortable list. *(browser_drag / browser_drop)*
29. **Iframes** (`/playground/iframes`): fill the form that lives inside the same-origin iframe. *(browser_snapshot, browser_fill_form)*
30. **Shadow DOM** (`/playground/shadow-dom`): read and interact with the element inside the shadow root. *(browser_snapshot, browser_generate_locator)*
31. **Async** (`/playground/async`): run the debounced search and wait for results despite the simulated latency. *(browser_wait_for)*
32. **Toasts** (`/playground/toasts`): assert a toast appears and then auto-dismisses. *(browser_wait_for)*

## G10 - Diagnose & record

33. Resize to a mobile viewport and snapshot `/inventory` - does the layout change? *(browser_resize)*
34. Highlight the broken Desk Lamp image, then annotate the page to mark it. *(browser_highlight, browser_annotate)*
35. Record a trace (or a video) of a full login-and-sort flow. *(browser_start_tracing/stop, browser_start_video/stop)*

## G11 - The quirky users (discovery)

36. `locked_out_user`: try to sign in. Where do you end up, and is there any feedback? *(browser_click, browser_snapshot)*
37. `problem_user`: sign in, then compare each product's image against its name and description (vs what `standard_user` sees). What is planted? *(browser_snapshot, browser_evaluate)*
38. `glitch_user`: sign in, add an item to the cart, and watch the **Cart badge** the instant it changes versus a moment later. What is off, and for how long? *(browser_click, browser_snapshot, browser_wait_for)* (Hint: it is a timing/render bug - it will not show up in the network or console.)

## Stretch

- Reproduce the Desk Lamp bug **deterministically** with a network stub, so it fails the same way every run. *(browser_route)*
- Drive the whole "log in, sort by price, add the cheapest item, open cart" journey in one request and have Claude verify each step. *(everything)*
- Ask Claude to compare `browser_snapshot` output before and after adding to cart and summarise exactly what changed.

---

# Capabilities checklist

Tick a box once you have driven that capability against this app.

- [ ] `browser_navigate` / `browser_navigate_back` / `browser_tabs`
- [ ] `browser_snapshot` (and saw why it beats a screenshot)
- [ ] `browser_take_screenshot`
- [ ] `browser_generate_locator`
- [ ] `browser_type` / `browser_fill_form`
- [ ] `browser_click` (including a checkbox)
- [ ] `browser_select_option`
- [ ] `browser_press_key`
- [ ] `browser_hover`
- [ ] `browser_drag` / `browser_drop`
- [ ] `browser_file_upload`
- [ ] `browser_handle_dialog`
- [ ] `browser_wait_for`
- [ ] `browser_verify_*` (element / text / list / value)
- [ ] `browser_evaluate`
- [ ] `browser_console_messages`
- [ ] `browser_network_requests` / `browser_network_request`
- [ ] `browser_route` / `browser_unroute`
- [ ] `browser_network_state_set` (offline)
- [ ] `browser_localstorage_*` / `browser_cookie_*` / `browser_sessionstorage_*`
- [ ] `browser_storage_state` / `browser_set_storage_state`
- [ ] `browser_resize`
- [ ] `browser_highlight` / `browser_annotate`
- [ ] `browser_start_tracing` / `browser_start_video`

When most boxes are ticked, you have seen what the MCP server can do. Stage 2 layers
the house-style **skills**, the **Test Agents**, and the `playwright-test` MCP on top -
flip them on per `WORKSHOP_GUIDE.md`.
