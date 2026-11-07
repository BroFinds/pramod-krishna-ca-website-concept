# Pramod Krishna & Co LLP website concept

This is an independent, static website concept. It is not an official or firm-approved website. It is plain HTML, CSS and JavaScript with no build step. The animation libraries are vendored locally in `vendor/`, so the site makes no third-party requests unless a visitor chooses to load the Google map.

## Run locally

Serve this folder with any static file server (for example `python -m http.server`) and open `index.html` over HTTP. Direct `file://` opening may block the scripts in some browsers. The pages link to one another using relative URLs.

## Files

- `index.html`, `about.html`, `services.html`, `insights.html`, `contact.html`: static pages
- `404.html`: not-found page (most static hosts serve it automatically)
- `styles.css`: shared design system, layout and motion states
- `site-effects.js`: interactions and motion; every page reads and navigates without it
- `vendor/`: GSAP 3.12.5 and ScrollTrigger (GreenSock standard licence, free for commercial use), Lenis 1.1.13 (MIT)
- `fonts/`: self-hosted Bricolage Grotesque and Geist variable fonts (latin subset) with their SIL Open Font Licences
- `favicon.svg`: tick-mark icon
- `site-config.json`: business details, their public sources and verification status
- `robots.txt`: blocks indexing while this is an unapproved concept

Each page repeats the same header, concept banner and footer, so a change to one of them must be made in all six HTML files. When approved details change, update the matching page copy and `site-config.json` together. Do not remove the concept banner, `noindex` metadata or robots restriction until the firm authorises publication and the launch review is complete.

### Where the business details came from

The address, phone, email, office hours and "since 2017" were gathered from public directory listings on 7 November 2026 (ThreeBestRated and Justdial; see `site-config.json`). None has been confirmed by the firm. The two listings disagree on the PIN code (575002 vs 575003).

Public ratings exist (Justdial showed 4.9 from 249 ratings) but are **deliberately not shown on the site**. ICAI guidance restricts testimonials and promotional claims on members' websites, so ratings or review quotes should only be added after an authorised reviewer approves them. Google reviews could not be retrieved automatically.

### Review notes

Unconfirmed content carries a red "To confirm" note (`<p class="note" role="note">`), and the contact page holds a launch checklist (`.note-block`). Both are hidden by default so the site previews as it would read once approved. The "Review notes" switch in the gold banner shows them; the choice is remembered in that browser only.

## Content requiring approval

- Legal firm name, full office address and PIN, telephone, email and office hours
- Current service catalogue, each description and the "what to bring" lists
- Partner names, roles, credentials, biographies and any photographs
- All marketing and educational copy, including the financial-year calendar
- Any privacy policy, contact form, map destination or domain

No form is wired to a backend. Do not present it as working unless a firm-approved endpoint, privacy notice and real success/error handling have been implemented and tested. No client-sensitive financial details should be requested through a general contact form.

## Launch review checklist

1. Obtain written authorisation to publish the concept and verify all business details with the firm.
2. Have an authorised professional reviewer check the final copy, calls to action, service claims and any solicitation against the ICAI professional-conduct, website, advertising and solicitation requirements in force at launch. This concept has not been reviewed for ICAI compliance.
3. Approve and publish an appropriate privacy notice before collecting any personal information; test the complete enquiry flow if one is added.
4. Replace the concept metadata and `robots.txt` only after the production domain is known and the firm approves search indexing. Then add the correct canonical URL and sitemap.
5. Check the final site at 375, 768, 1024 and 1440 CSS pixels, and verify every destination, keyboard focus state, reduced-motion behaviour and browser console before release.

## Design and engineering notes

**Direction: modern, warm and playful.** Night-green heroes with a drifting colour aurora, saffron and mint accents, paper-coloured reading sections and rounded, card-based layouts. Bricolage Grotesque for headlines (with a saffron-to-coral gradient on the second line), Geist for text with tabular figures.

- **Colour:** night `#07140F`, forest `#0F3D2E` / `#15634A`, saffron `#F6B73C` (deep `#8A5A00` for text on light), mint `#9BE7C4`, sky `#C7E3FF`, coral `#FF7A59`, tick red `#E0482F`, paper `#F6F4EF`. All text pairs meet WCAG AA.
- **Mobile sizing:** hero headline about 42px at 390px wide, buttons 46px tall, tighter section spacing, a shortened banner and compact cards.

**Home:** aurora hero with a rotating headline ("Your income tax / GST returns / audit / books, sorted.") and glass cards that float and follow the pointer, or the phone's tilt on Android; a tilted saffron marquee; a statement whose words light up as you scroll; a pinned story where scattered tax documents settle into a finished year-end file; six service cards that stack as you scroll; a bento grid with a live IST clock and week bars, a tap-to-call tile, a "since 2017" odometer, a tap-to-tick "before your first visit" checklist, a map tile and a Mangalore-tile roof; the April-to-March dial with a needle on the current month; and a footer whose letters rise and ripple under the pointer.

**Tikku, the mascot.** An original character: a brass coin with a red tick for an antenna. He appears on every page.

- On the home page he drops into the hero, then flies to the bottom corner as you scroll. On other pages he pops up in the corner.
- He blinks, floats, follows the pointer (or touches) with his eyes, leans into fast scrolling, waves when hovered, falls asleep after about 20 seconds idle and wakes on input.
- He says one line per section as it comes into view, cheers when checklist items are ticked, and steps aside while the mobile menu is open.
- Tap or click him for quick help: call, directions, office hours (an accordion) and what to bring. Drag him to either edge; the side is remembered for the visit. "Hide Tikku" leaves a small coin tab that brings him back; that choice is remembered in the browser.
- Keyboard: he is a button with an expanded state; the panel is labelled, Escape closes it and focus returns to him. With reduced motion he stays static but the panel still works.

**Open and close are always both animated:** the mobile menu (a circle that grows from and shrinks back into the menu button, with links staggering in and out), Tikku's panel, the hours accordion, the review notes, speech bubbles, Tikku hiding and returning, checklist ticks and the page curtain between pages.

**Motion stack:** GSAP + ScrollTrigger and Lenis smooth scrolling. Only transforms, opacity and (for reveals) clip-path are animated. Infinite loops pause with the tab hidden where relevant. Under `prefers-reduced-motion`, or if the scripts fail to load, there is no smooth scrolling, pinning, cursor, curtain or looping motion, and all content is shown in its final state.

**Engineering.** Semantic landmarks, a skip link, visible focus states, a native `<details>` mobile menu that still works without JavaScript, `aria-current` for the current page and section, a text description for the dial, `translate="no"` on the firm name, and live status calculated in India Standard Time. The head carries a small inline script that sets the starting motion state before first paint and drops it after 2.5s if the scripts never run; if a Content-Security-Policy is added, allow it by hash. Layouts adapt at 1180, 960 and 640px.

Verified in Microsoft Edge (Chromium) at 1440, 1024, 768 and 390px: no console errors, failed requests or horizontal overflow; every internal link and anchor resolves; axe-core reports no WCAG 2.1 AA or best-practice violations; reduced-motion and no-JavaScript modes render all content; 43 scripted interaction checks pass, covering Tikku, the menu, the panels, checklists, notes, navigation, mobile and fallbacks.
