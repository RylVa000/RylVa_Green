# Review packet · tepi hijau variatif, foto statis

Latest user correction supersedes prior moving-photo/intensity direction:
“zoom foto jangan terlalu besar dan buat bentuk gelombangnya fariatif yang
gerak bagian hijau bukan gambar seperti glombang naturan yang acak, bukan
cuma besar kecilin saja”. Assess this bounded revision, not the previous ship.

World stays RylVa/Poppins, existing photos and forms. PRODUCT.md and DESIGN.md
are unchanged. Current surface brief is docs/design/surfaces/customer-auth-surface.md.
No chosen comp or QUALITY BAR applies; code-led narrow refinement.

Current implementation:
- customer-auth-motion.js replaces SMIL two-shape morphs with a genuine green
  SVG overlay. The photo underneath has no animation, transform, zoom or motion.
- The edge samples three continuous spatial/temporal waves with randomized
  per-page phase/speeds. Local vertices move in different directions; Catmull-Rom
  tangents form a continuous Bézier path. It is not a global scale animation.
- One active path paints at most 30fps. Pause/reduced motion, hidden document,
  offscreen visibility, resume continuity and observer cleanup are retained.
- Current CSS has static photograph viewports. Desktop recovery gets the green
  wave along its bottom; mobile has the green wave at the header boundary.

Required current captures under storage/reports/customer-auth-wave/ (PNG):
login-1440, login-390, register-1101, forgot-1920, forgot-390, reset-390,
login-1440-varied, login-390-varied, register-1101-varied, forgot-390-varied.
These are paused via the real user control after decode, so the control reads
Putar animasi. Random phases differ between views. Earlier *-peak captures are
superseded and not evidence for this revision. Parent visually opened resting
views; supplementary captures include all five views at 320–2560px.

Browser tests: tests/e2e/browser/verify-customer-auth-artwork.cjs, six groups
cover geometry/full bleed, actual local deformation with mixed vertex directions,
stationary photo transform/bounds, pause/keyboard/persistence/reduced/offscreen,
and forgot submit. Parent is rerunning with improved visible-photo measurement.
No production auth claim, no new assets/libraries. Do not run detector or Taste;
prior exhausted Taste marketing heuristics are not represented as PASS.

Inspect required captures and source for a full first review at this revision
scope, emphasizing the user's correction. Write honest disposition/findings to
.impeccable/review/customer-auth-green-wave/review.md. No UI edits.
