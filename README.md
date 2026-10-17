# Pramod Krishna & Co LLP website concept

This is an independent, static website concept. It is not an official or firm-approved website. It uses plain HTML and CSS, has no build step, and adds no runtime dependencies.

## Run locally

Serve this folder with any static file server and open `index.html` over HTTP. This allows the shared interaction script to load; direct `file://` opening may block JavaScript in some browsers. The pages link to one another using relative URLs.

## Files

- `index.html`, `about.html`, `services.html`, `insights.html`, `contact.html` — static pages
- `styles.css` — shared responsive design system
- `site-config.json` — editable business details and approval states
- `robots.txt` — blocks indexing while this is an unapproved concept

The page copy is intentionally static and readable without JavaScript. When approved details change, update the matching page copy and `site-config.json` together. Do not remove the concept disclosure, `noindex` metadata, or robots restriction until the firm authorizes publication and the production launch review is complete.

## Content requiring approval

- Legal firm name, full office address, telephone, email and office hours
- Current service catalogue and each service description
- Partner names, roles, credentials, biographies and any photographs
- All marketing and educational copy
- Any privacy policy, contact form, map/directions destination or domain

No form is wired to a backend. Do not present it as working unless a firm-approved endpoint, privacy notice and real success/error handling have been implemented and tested. No client-sensitive financial details should be requested through a general contact form.

## Launch review checklist

1. Obtain written authorization to publish the concept and verify all business details with the firm.
2. Have an authorized professional reviewer check the final copy, proposed calls to action, service claims and any solicitation against the ICAI professional-conduct, website, advertising and solicitation requirements in force at launch. This concept has not been reviewed for ICAI compliance.
3. Approve and publish an appropriate privacy notice before collecting any personal information; test the complete enquiry flow if one is added.
4. Replace the concept metadata and `robots.txt` only after the production domain is known and the firm approves search indexing. Then add the correct canonical URL and sitemap.
5. Check the final site at 375, 768, 1024 and 1440 CSS pixels, and verify every destination, keyboard focus state, reduced-motion behavior and browser console before release.

## Design and engineering notes

The visual direction uses ink navy `#172A3A`, warm ivory `#F8F6F1`, white `#FFFFFF`, muted slate `#66717D`, warm-gray rules `#E5E0D7` and antique brass `#A68A5B`. Brass is a fine accent rather than small body text. Georgia-family system serif faces carry display typography; system sans-serif faces handle body copy and navigation.

Spacing and page gutters use CSS custom properties, `clamp()` and a centered 82rem content grid. Sections alternate between ivory, white and ink rather than repeating cards. Service areas use ruled editorial lists; the homepage hero includes a paper-and-ledger illustration built with CSS 3D transforms rather than stock photography or a WebGL dependency. Its small tilt responds only to pointer hover and is disabled when reduced motion is requested. Layouts adapt at 1000px and 700px, including a compact, animated, keyboard-operable `details` mobile navigation. Skip navigation and visible keyboard focus are supported.

The site avoids external fonts, image dependencies, fabricated profiles and client-side rendering. A small vanilla JavaScript file provides a scroll progress cue, scroll-entry reveals, desktop pointer-responsive 3D tilt with layered depth and lighting, and touch press feedback. Motion is skipped for visitors who request reduced motion.
