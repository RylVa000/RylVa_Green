disposition: fix

Missing scope: no chosen-world QUALITY BAR card; the packet's `.impeccable/design.json` does not exist. Unread scope: unrelated portions of DESIGN.md, supplementary captures beyond the four sampled states, and executable test implementations. This is a file-based first review of the frontend synthetic preview; no browser, detector, or Taste gate was run by this reviewer. Generated approved-comp, phase-state, and comp-diff artifacts do not apply to this code-led extension of the pinned Figma baseline.

## persistence

- **Pass at the stated preview scope.** PRODUCT.md, the existing DESIGN.md, the surface direction contract, coverage document, implementation files, and supplied verification report exist. PRODUCT.md states that checkout requires a verified customer and that customer/staff accounts are distinct; the implementation does not claim to have delivered production authentication.
- **Evidence pass after recapture.** All 13 required build captures were reopened: five desktop views, their five mobile views, `register-768.png`, `login-1024.png`, and `register-validation.png`. All five Figma references were opened before reading the contract. The references have the packet's native dimensions; build captures show the named views with document tops and plausible viewport dimensions. The corrected 1024px Login capture now visibly contains vines across the entire media strip. The preceding recapture disposition is superseded by this full first review.
- The sampled supplementary captures are `state-brokenImage.png`, `state-resetInvalid.png`, `state-longContent.png`, and `state-csrfExpired.png`. They show a usable photo-failure fallback, an actionable invalid-link state, contained long field values, and retained form values after configuration recovery. Other state behavior is supplied source/report evidence, not an independent execution result.
- No comp-led state, approval, measured-spec, hero score, or diff closure is required for this pinned code-led extension. The absent `.impeccable/design.json` is an input gap, not proof that a generated comp round was skipped.

## fidelity

The initial source-image inventory was: Login has a left green form and right vine/daisy photograph separated by a pronounced organic boundary; Registration mirrors this with clover/daisy photography on the left; both use heavy Poppins greetings, broad Google pills, pale outlined fields, and cream primary actions. Verification and recovery use white rounded cards over textured green botanical artwork, with six OTP cells or one/two large fields and broad green actions. This inventory comes from the five Figma references, not the builder's summary.

| Element | State | Evidence |
| --- | --- | --- |
| Desktop Login/Registration topology and reading order | match | Required desktop captures retain the mirrored photo/form arrangement, organic divider, logo position, greeting, Google option, fields, and primary action. No storefront navigation/footer was inserted. |
| TYPE: lettering character and heading scale | match | Poppins retains the rounded, heavy greeting/title character; desktop headings and white-card titles preserve the baseline hierarchy. |
| TYPE: action-label hierarchy | contradicted | Google and primary button labels visibly fall back to ordinary body weight/size in all required captures. `customer-auth.css:67` applies `font: inherit` with the more specific `.customer-auth-page button` selector, overriding the intended 18px/600 action declaration at lines 244–245. The source Figma actions are conspicuously heavier. |
| MATERIAL: photography, contours, botanical plates | match | The supplied photographs, original organic SVG geometry, and textured corner-leaf backgrounds are visibly present. CSS does not substitute imitation foliage or a gradient for the source artwork. The soft/upscaled photo resolution remains the disclosed source-asset limitation. |
| GROUND: net green field and white cards | match | Pixel samples: Login's source and build solid field both `#6B9071`; the source and built recovery-card field both `#FFFFFF`. No warm-cream or slate drift replaces those fields. The narrow preview notice uses the existing background token for an explicit product-truth purpose. |
| Logo variant | adaptation | The transparent storefront logo replaces the source's dark auth logo. The surface brief explicitly records reuse for identity consistency and to avoid a boxed background on photography. |
| Registration fields and Indonesian content | adaptation | The surface brief and v2.6 §6.3.1 require the added phone field; the email field spans the resulting grid. Indonesian copy follows PRODUCT.md. OTP wording is corrected to the actual six-digit code. |
| Recovery navigation and OTP action density | adaptation | Back links, resend, alternate email, expiry guidance, and recovery actions follow the brief's findable-action and recoverability criteria. The extra controls occupy space the static source did not need. |
| Phone/tablet reflow | adaptation | The brief explicitly permits stacking through 1100px to prevent photo collisions. Required phone/tablet captures retain artwork, clear field order, and reachable actions without visible horizontal overflow. |
| Input boundary visibility and consent target | contradicted | The green-panel input outlines do not reach 3:1 against adjacent surfaces; the checkbox/associated label do not provide the documented 44px hit target. These are accessibility defects rather than approved fidelity adaptations. |

Contract check: THESIS is present in the five understandable account views; OWN-WORLD retains Poppins, RylVa green, and original assets subject to the action-type defect; STORY offers explicit next steps and safe customer destinations within the preview; FIRST VIEWPORT keeps the pinned mirrored/carded composition and passes the botanical memory test. FORM is recorded through the SIGNATURE/CHOICE paragraphs rather than a separate FORM heading: `seed: none (pinned)` cites the user's instruction to preserve agreed project design and identifies the five existing auth frames, so this build makes no unsupported concept-roll claim.

Truth check: the preview notice and result copy explicitly distinguish example data from account creation, emails, real sessions, or real password changes. Google/CAPTCHA unavailability is explained, policies are described as unpublished, and example email domains are synthetic. Missing PHP, mail, OIDC, CAPTCHA, session, rate-limit, and token integrations remain documented production work and are not hidden capability claims at this review scope.

## ceiling

No chosen-world QUALITY BAR card was supplied, so a card-based ceiling verdict is unavailable. Against the pinned baseline, the native devices used are the asymmetrical botanical frame, original organic contours, photographic depth, pale/dark form contrast, rounded Poppins lettering, and corner foliage. The action-label weight is an underused native device. Additional ornament, hero choreography, marketing sections, or fabricated physical materials would not improve this Operate task. The supplied Taste gate remains OPEN with 26 findings; this review does not relabel it PASS.

## material_fixes

1. **Fidelity / OWN-WORLD / TYPE:** In `public/assets/css/storefront/customer-auth.css:67`, replace the broad `font: inherit` reset with family inheritance (or scope the action typography with sufficient specificity) so `.auth-action` and `.auth-google` actually render at 600 weight and their declared desktop/mobile sizes. Preserve the current Poppins headings and composition; recapture the same required views to show the corrected primary-action hierarchy.
2. **Floor / accessibility / input visibility:** At `public/assets/css/storefront/customer-auth.css:355`, strengthen only the green-panel field outlines. `#E3EED4` is 2.981:1 against `#6B9071` and approximately 2.565:1 against the translucent white field fill (`#799B7E`), below a 3:1 control boundary. Use a color meeting 3:1 against both adjacent surfaces, such as white; keep existing error/focus semantics and the recovery-card outline treatment.
3. **Floor / DESIGN.md touch targets:** At `public/assets/css/storefront/customer-auth.css:482` and `:491`, retain the checkbox's 24px visible box but give its associated clickable consent label/row a real minimum 44px hit height. The current checkbox is 24×24px and the separate label is approximately 27.5px tall; adjacent policy buttons do not count as the checkbox target. Keep the two policy actions independently operable and verify the target in the mobile registration capture.

## keep

Keep the original botanical assets and mirrored organic composition, explicit preview honesty, Indonesian permanent labels, inline recovery paths, and safe separation of customer and staff destinations while applying the three fixes.
