---
name: bid-ethiopia-ui
description: Design, review, prototype, or implement Bid Ethiopia interfaces for the Expo Android app, responsive Next.js website, and staff console. Use for vehicle galleries, tender browsing, listing details, subscriptions, and operator workflows.
---

# Bid Ethiopia UI

Start with the task someone needs to finish. Prioritize finding a relevant bid, assessing a pictured vehicle, and locating the issuer's bidding instructions. On staff screens, prioritize publishing a verified notice and reviewing a payment reference. Explain how any proposed visual change improves one of those tasks.

## Prototype and review

- Use Google Stitch to explore Android and responsive web concepts quickly. Use Figma Make when a clickable flow is needed for review. Use screenshots and synthetic fixtures as design inputs. A prototype can guide implementation in Expo and Next.js.
- Start with Android home, vehicle results, and vehicle detail. Then adapt the same hierarchy for responsive web. Show all four launch sections and feature vehicle bids with large, legible photos.
- Test with a used fleet car and a damaged vehicle. Make condition, closing time in EAT, access level, and the action to bid with the issuer easy to find. Preserve separate lot identities and label demo listings clearly.
- Review the states that change the workflow, including loading, empty results, expired listings, paid previews, and inaccessible photos. Check narrow screens, enlarged text, focus order, contrast, and touch targets.

## Implement in the existing app

- Use the existing Expo Android app and Next.js website as implementation entry points. Reuse the API and account flows. Share labels and hierarchy across surfaces while adapting controls to each platform.
- Preserve the server-defined paid preview. Vehicle cards may show the authorized cover and condition. Additional photos, issuer details, and bidding instructions follow the subscription access rules. Keep purchase and payment instructions on the website.
- Verify the search-to-detail path and the route to the original notice. Check a guest view and an entitled view before calling the UI ready.
