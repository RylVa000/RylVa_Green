# Review packet · revisi gelombang autentikasi

User rejected the prior shipped result with screenshots and requested:
remove green side gutters on wide displays; mobile artwork must end in a
natural wave instead of a rectangle; soften the stiff desktop contours;
animate wave/image; apply the same treatment to forgot password.

User evidence (must inspect before conclusions):
- `C:/Users/Berryl/AppData/Local/Temp/codex-clipboard-47f8432c-9af4-4d7d-9e60-cdb286fce02a.png`
- `C:/Users/Berryl/AppData/Local/Temp/codex-clipboard-ae83ef37-0c1f-4c3c-95d5-0390f65cdd7e.png`

Fresh full review at this bounded revision scope, not a verdict on previous
fixes or production authentication. Code-led, no generated comp/QUALITY BAR.
Existing Poppins/RylVa colors/artwork/forms remain. User now explicitly permits
replacement of static source contours with smoother animated geometry.
PRODUCT.md, DESIGN.md and business rules are unchanged. Surface brief:
`docs/design/surfaces/customer-auth-surface.md`, revision paragraph.

Implementation: `public/assets/css/storefront/customer-auth.css`,
`public/assets/js/storefront/customer-auth-motion.js`, art/render/busy/error hooks
in `customer-auth.js`, one script include on five `public/pages/auth/*.html`.
The new module owns decorative markup and animation lifecycle, not auth logic.
Images are sourced Figma assets; SVG crops show only botanical regions of the
Login source that contains a prior UI. New SVG is geometric clipping, not an
illustration or an embedded page-as-UI. Existing raw SVG assets remain unchanged.

Required build captures in `storage/reports/customer-auth-wave/` (all PNG):
login-1440, login-1920, login-2560, login-1101, login-390, login-320,
register-1440, register-1101, register-390,
forgot-1920, forgot-390, reset-390, verify-390, login-reduced-motion.
Other sizes supplementary. Capture code decodes HTML and SVG image assets and
pauses motion at t=0 for comparison. Dynamic tests inspect contour interpolation
at t=9 and exercise the actual control, reduced motion and offscreen pause.

Baseline Figma references remain `.impeccable/review/customer-auth/figma-*.png`
if needed for identity/form comparison; the user screenshots outrank static
Figma contour geometry for this revision. No store navbar/footer change.

Testing: `tests/e2e/browser/verify-customer-auth-artwork.cjs`, six meaningful
groups: full width/overflow and five views, actual shape interpolation,
pointer/keyboard pause with persistence, reduced motion, offscreen lifecycle,
forgot submit. Full auth regression runs separately. Honest synthetic preview
and real-backend exclusions remain unchanged; this review is not production auth.

Review artwork placement/cropping, natural geometry, full bleed, mobile recovery
composition, form readability and motion controls. Verify source for lifecycle
and accessibility. Do not rerun detector or Taste: detector is handled by parent;
prior Taste gate exhausted rounds on marketing heuristics and is not PASS.
Write full first review and disposition at `.impeccable/review/customer-auth-wave/review.md`.
