disposition: fix

No QUALITY BAR card or generated-comp state/spec/diff reports apply to the pinned code-led extension; supporting cart/checkout files, Taste's individual findings and the Impeccable detector log were not re-audited, and their status is taken from the supplied packet and follow-up.

## persistence

Pass for the applicable persistence requirements: PRODUCT.md and the existing DESIGN.md are present, the homepage surface contract is recorded, and the implementation retains the established RylVa world. FORM records `seed: none (pinned)` and quotes the user's instruction to take the Figma “homepage rev” design; that named frame pins both world and first-surface experience. No concept roll or generated-comp approval/state is owed for this reproduction.

Evidence passes: all eight required captures exist and show the claimed surface. The six full-page captures show the document top through the footer at widths 1920, 1440, 1024, 768, 390 and 320; their heights are respectively 3400, 3034, 3577, 4731, 6138 and 6287. The two 1440×1080 dialog captures show the collection and product-detail states. No blank, black, prematurely clipped or misidentified capture prevents review.

Verification remains open: the supplied interaction report has six passing groups and no reported JavaScript errors; the follow-up reports cart 19 groups/49 scenarios and checkout 17 groups/34 states passing. Taste has 73 open first-round findings, with round two still running. The supplied Hallmark final report ran its render and reports 36 FAIL, 46 REFLEX and 13 WARN findings, including the offer eyebrows and the visible two-line package CTA at 1024px. Its asset/font loading warnings conflict with the valid settled captures and performance's zero broken requests, and need explicit reconciliation rather than automatic acceptance or silent dismissal. Performance passes image bytes/largest image, CLS and broken requests, while font bytes (1600.1 KiB), icon lazy labels and source-image ratios still fail. These results cannot be represented as a completed finish gate. Existing shell font/contrast issues remain protected context, not permission to restyle the shell.

## fidelity

The source inventory is a three-level commerce shell; a pale rounded hero with a large uppercase Monstera heading, botanical logo, left copy and pill action, a basketed plant overlapping a green arch, and three selectors; eight circular category photographs; three colored offer panels with photographs; horizontal product cards; four line-art benefit devices; recommendation filters; five city illustrations; and the existing footer.

| Element or promise | Assessment | Evidence |
| --- | --- | --- |
| TYPE | match | Poppins preserves the source's rounded geometric character and bold display hierarchy. The established logo lettering is retained; the existing footer's Inter exception is disclosed rather than introduced by the homepage. |
| MATERIAL | match | The photographed hero, category imagery, product cutouts, offer photographs and original illustration plates are visibly shipped. The botanical subject has its original alpha edge rather than a geometric substitute. No new simulated physical material replaces the source assets. |
| GROUND | match | A plain page-field pixel at (10, 220) in figma-reference.png and (10, 210) in home-1920.png is exactly #FBF7F4 in both. The pale hero and green fields retain the established temperature. |
| Main topology and first viewport | match | Hero, categories, offers, collection, benefits, recommendations, shipping and footer retain their order; the plant/arch and large Monstera word remain the first-view memory. |
| Existing navigation and footer | adaptation | The user's requirement preserves the existing shell and compact mobile footer. The surface contract explicitly replaces unsupported service claims with neutral copy while keeping its slots. The shorter existing desktop shell is therefore authorized. |
| Responsive composition | adaptation | The surface plan explicitly requires reflow instead of scaling the Figma canvas. Four-column categories and single-column offers/products at phone widths retain readable content and accessible actions; no new horizontal overflow is visible. |
| Claims, prices, availability and wishlist | adaptation | The documented product-truth decisions remove unsupported guarantees and expert/health claims, calculate discount labels from fixture prices, retain Calathea's existing cart price and omit product wishlist controls because the baseline excludes that capability. The Sirih Gading photograph repeats the source mismatch, which the packet independently verified. |
| Collection and detail dialogs | adaptation | The surface plan explicitly supplies preview dialogs because catalog/detail routes do not yet exist. Both captures show clear titles, close controls and actionable product information; the detail states that products, photographs, price and availability are examples and care information is unavailable. |
| Search promise | contradicted | home.html:50–56 promises category search, but homepage.js:210–211 matches only product.name. Searching the visible category “Tanaman Indoor” cannot find its fixture products. This is a new behavioral gap in the supplied STORY, not a protected shell defect. |
| Three offer eyebrows | contradicted | home.html:197, 204 and 211 places “Paket tanaman”, “Koleksi buket” and “Terrarium & DIY” above headings in pills. These are visible in every full-page capture. The craft floor explicitly bans eyebrows even when a pinned brief contains them. |
| New glyph action icons | contradicted | The two “Lihat Semua” arrows use the → character in home.html:126 and 221; the new dialog and toast use × in home.html:375 and homepage.js:271. They substitute font glyphs for the otherwise drawn icon system and violate the floor. The existing shell's accordion symbols are outside this finding. |
| Offer action sizing at 1024px | contradicted | home-1024.png shows “Lihat Paket Rp245.000” wrapping into a taller two-line pill while the neighboring offer actions stay on one line. The final Hallmark render independently flags this same newly introduced wrapping; the offer has sufficient usable width to retain a readable single-line action. |

THESIS and FIRST VIEWPORT are kept. OWN-WORLD is kept. STORY is kept through collection review, detail and cart handoff according to the supplied interaction evidence, with the category-search contradiction above. FORM is satisfied by the pinned source. Truth labeling is visible at page level and in the product detail; the documented empty recommendation filters avoid inventing plant-safety or air-quality attributes.

## ceiling

The applicable ceiling is the existing Figma world, not an invented replacement identity. Its native devices—large botanical photography, green arch, circular category portraits, contrasting offer fields, product cutouts and city linework—are present. No additional depth, ornament or motion treatment is required to reproduce that world. The prohibited promo eyebrows and inconsistent new action glyphs remain below its finish bar; the supplied open gate results also prevent a claim that the finish ceiling has been verified.

## material_fixes

1. STORY/search: implement category-name matching alongside product-name matching in homepage.js:210–211 so a header query such as “Tanaman Indoor” returns the products assigned to that category; preserve the current collection query, reset and return behavior.
2. Floor/eyebrow ban: remove the three home-offer-tag pills in home.html:197, 204 and 211 and their unused styling; retain the offer headings, colored fields, photography and actions.
3. Floor/icon system: replace the homepage-introduced → and × action glyphs with drawn SVG icons of a consistent stroke, retaining their accessible labels and click targets; leave the protected shell controls alone.
4. Floor/control sizing: let the 1024px package action use enough available width, or an equivalent readable responsive treatment, to keep “Lihat Paket Rp245.000” on one line without clipping or colliding with the photograph; do not apply nowrap alone to an undersized control.
5. FINISH/evidence: close the pending applicable Taste, Hallmark and performance verification after the fixes; resolve homepage-introduced failures, reconcile Hallmark's asset/font warnings against the settled captures and zero broken requests, and explicitly attribute protected shell/source conflicts, retaining every remaining failure in the delivery status instead of reporting PASS.

## keep

Keep the original plant/arch hero, photographic assets, horizontal product cards, compact existing mobile shell, honest preview labeling, and tested cart/checkout continuity while applying the fixes.
