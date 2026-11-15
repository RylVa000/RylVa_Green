# Input packet · autentikasi pelanggan

15 November 2026, code-led extension of existing Figma/project design.

- User task: implement Login & Registrasi pelanggan through rendered checking
  and fixes; preserve RylVa style and use current Figma. Include related email
  verification and password recovery. No commit/deployment.
- Mode: Operate; no chosen-world QUALITY BAR card or generated approved comp.
  Direction pinned by existing Figma. No comp-led build-phase obligation.
- Direction/acceptance: `docs/design/surfaces/customer-auth-surface.md`.
- Product/system: root `PRODUCT.md`, `DESIGN.md`; `.impeccable/design.json` is absent.
- Rules/source: v2.6 §6.2–6.3 in `docs/specifications/spesifikasi-proyek-v2.6.md`.
- Known scope: frontend synthetic preview; PHP controllers, real emails,
  CAPTCHA, Google OIDC and production sessions remain scaffold. UI explicitly
  names preview. Do not treat backend absence as a concealed shipped capability.
- Implementation: `public/pages/auth/{customer-login,customer-register,verify-email,
  forgot-password,reset-password}.html`, `public/assets/css/storefront/customer-auth.css`,
  `public/assets/js/storefront/customer-auth{,-preview}.js`.
- Entry point changes only: storefront-shell.js, account.js, checkout.js.
- Coverage: `docs/coverage/customer-auth-ui.md`.
- Required build screenshots in `storage/reports/customer-auth/`: login-desktop,
  register-desktop, verify-desktop, forgot-desktop, reset-desktop; each matching
  `*-mobile`; register-768, login-1024 and register-validation (all `.png`).
  Other captures/state images and verification.json are supplementary evidence.
- Required Figma references: `.impeccable/review/customer-auth/figma-{login,
  register,verify,forgot,reset}.png`. Original sizes: 1440×1024, 1440×1024,
  1440×832, 1364×761, 1378×769. Only artwork is reused, native HTML draws UI.
- Intentional adjustments: Indonesian copy; phone added to registration from
  baseline; OTP wording corrected from link to code; small text/eye icon
  contrast strengthened; existing transparent storefront logo reused; recovery
  actions/back links added; tablet stacks at 1100px to avoid photo collisions.
  Auth-specific Figma layout has no storefront navigation/footer.
- Testing: Chrome headless, 11 groups passed, 31 fixture states and five views
  across 320/390/768/1024/desktop; no page errors. Test report is supplied evidence,
  not an independent reviewer test. Latest capture-only pass follows tablet fix.
- Detector ran once, `.impeccable/review/customer-auth/detector.json`: zero primary,
  five radius advisories against loading shells. Pinned Figma shapes retained.
- Taste gate OPEN 26, rounds exhausted; not claimed PASS. Full artifacts remain
  `.taste-skill/gate/`. Marketing assumptions (hero/nav/moments/screens/wrappers)
  conflict with pinned Operate auth page. Source photo resolution/upscale remains
  an asset limitation. No added waivers or checker changes.
- Raster provenance scan: 6 shipping files, zero missing. Origin embedded in each file;
  `public/assets/images/auth/provenance.json` records nodes. Source SVGs unchanged.
- Craft floor: `C:/Users/Berryl/.codex/skills/impeccable/reference/craft-floor.md`.

Review actual captures before source conclusions. Treat this as full first
review at the UI-preview scope and deliver ship/fix/rebuild/recapture honestly.
