disposition: fix

Unread: unrelated portions of DESIGN.md, customer-auth.js, customer-auth.css, and the HTML bodies; primary transition and shared-motion modules were read in full. Approved comp, QUALITY BAR, measured spec, build state, and comp diffs do not apply to this pinned, code-led extension.

## persistence

Pass. PRODUCT.md and the existing DESIGN.md exist; docs/design/surfaces/customer-auth-surface.md records the pinned Figma world, prior corrections, transition request, directions, durations, fallback behavior, and scope. The existing pinned direction is corroborated by the packet's explicit instruction to extend that composition; this work does not introduce a new world or require a new concept roll.

Evidence passes. All 12 named captures exist and were opened. Desktop images are 1440×1024; mobile phase images are 390×844, with settled full-page images at 390×928 and 390×1319. Settled captures show the destination document top, complete usable forms, photographs, and heading focus. The green fields in phase captures are intentional moving covers. The mobile registration departure correctly shows the scrolled source form rather than pretending to be a document-top capture.

The transition report contains eight check groups and no errors; the auth regression report contains eleven groups, including 31 development states, and no errors. The packet discloses the existing five radius advisories and OPEN26 Taste status without claiming either was cleared by this feature. No detector or browser pass was repeated.

## fidelity

| Element or promise | State | Evidence |
| --- | --- | --- |
| TYPE | match | The settled captures preserve the existing Poppins lettering, hierarchy, and form labels. The transition adds no display face or lettering treatment. |
| MATERIAL | match | The existing botanical rasters remain visibly present. Source uses the existing static photographic views without a new transform or zoom. The tide is explicitly authored SVG geometry, appropriate to the requested moving green field; it does not impersonate a photographic cutout or physical material. |
| GROUND | match | Sampled settled desktop/mobile panel pixels and departure/arrival cover pixels all equal #6B9071, matching DESIGN.md primary-light and the veil's shared --auth-green token. No temperature or value drift appears at the cover boundary. |
| Desktop tide direction and edge | match | Source covers and reveals left→right toward registration and right→left toward login. Phase captures show a continuous locally varying boundary rather than a rigid straight wipe. |
| Mobile tide direction | adaptation | The vertical rise toward registration and fall toward login follow the packet's explicit mobile direction and the surface brief's mobile/tablet requirement. The phase captures show those horizontal wave fronts. |
| Form drift and final composition | match | Source limits drift to 20px on desktop or 18px on mobile over the documented 380ms departure and 460ms arrival. Settled captures restore the original opposing desktop compositions and stacked mobile forms without residual transforms or veils. |
| Navigation and recovery | match | Native location.assign navigation, modifier-click exclusions, pre-departure dirty-form confirmation, arrival marker expiry, cleanup, reduced-motion/pause suppression, and BFCache recovery are present in source and covered by the supplied verification report. |
| Arrival heading focus appearance | contradicted | All four ready captures show a browser-default black/white rectangular outline spanning the full heading block. arrive() now focuses #auth-title after each animated switch, while the palette-based focus rule only covers button, input, and a. The new normal arrival state therefore exposes an unthemed browser surface absent from the intended botanical treatment. |
| Preview truth | match | The example-data disclosure remains visible in every settled destination. No new claims, account behavior, or raster substitutions were introduced. |

THESIS retains a clear account task; OWN-WORLD retains Poppins, botanical photographs, and RylVa green; STORY preserves login/registration and safe return context; FIRST VIEWPORT restores each destination's original topology. The existing pinned CHOICE and bounded transition brief supply the form authority here. The memorable added device is the directional green tide. Its perceived smoothness cannot be established from stills alone; the source and supplied interaction checks support its geometry and cleanup, not a claim of measured frame pacing.

## ceiling

The requested motion scope uses the world's existing organic edge as the transition device, carries it across desktop and mobile, and leaves the photographs static. No additional frame, depth, ornament, asset, or animation is warranted by this extension. The remaining finish gap is the newly exposed default heading outline, addressed below.

## material_fixes

1. Floor / browser surfaces; FIRST VIEWPORT: author the #auth-title focus appearance in customer-auth.css so every completed navigation no longer leaves the full-width browser-default black/white rectangle visible in the four ready captures. Preserve programmatic heading focus and a clear palette-based keyboard focus cue; distinguish pointer arrival if needed rather than globally disabling outlines.

## keep

Keep the directional locally varying green tide, restrained form drift, static photographs, unchanged settled layouts, native navigation semantics, unsaved-form protection, and reduced-motion/pause behavior while fixing heading focus presentation.
