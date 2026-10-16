---
name: nalam.me — Developer Workspace
description: A crisp developer workspace for engineering work and substantial technical reading.
colors:
  ws-bg: "#fbfcff"
  ws-panel: "#ffffff"
  ws-soft: "#f5f8fd"
  ws-ink: "#0b1234"
  ws-muted: "#536382"
  ws-faint: "#5a6d91"
  ws-blue: "#005de7"
  ws-green: "#087c38"
  ws-rule: "#e1e9f5"
  ws-active: "#eaf2ff"
  ws-bg-dark: "#0b1020"
  ws-panel-dark: "#101729"
  ws-soft-dark: "#151e34"
  ws-ink-dark: "#eef3ff"
  ws-muted-dark: "#acbad4"
  ws-faint-dark: "#8fa2c2"
  ws-blue-dark: "#80b2ff"
  ws-green-dark: "#6bd99a"
  ws-rule-dark: "#283550"
  ws-active-dark: "#172e50"
typography:
  display:
    fontFamily: '"Geist Sans", ui-sans-serif, system-ui, sans-serif'
    fontSize: "clamp(32px, 2.657vw, 44px)"
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: '"Geist Sans", ui-sans-serif, system-ui, sans-serif'
    fontSize: "clamp(25px, 2.125vw, 34px)"
    fontWeight: 720
    lineHeight: 1.19
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"Geist Sans", ui-sans-serif, system-ui, sans-serif'
    fontSize: "clamp(18px, 1.594vw, 26px)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: '"Geist Sans", ui-sans-serif, system-ui, sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: '"Geist Sans", ui-sans-serif, system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: '"Geist Mono", ui-monospace, monospace'
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
  source:
    fontFamily: '"Geist Mono", ui-monospace, monospace'
    fontSize: "clamp(10px, 0.84vw, 13px)"
    fontWeight: 400
    lineHeight: 1.7
  reader-display:
    fontFamily: '"Geist Sans", ui-sans-serif, system-ui, sans-serif'
    fontSize: "2.5rem"
    fontWeight: 730
    lineHeight: 1.16
    letterSpacing: "-0.035em"
  reader-headline:
    fontFamily: '"Geist Sans", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.5rem"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "-0.025em"
  reader-body:
    fontFamily: '"Geist Sans", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.85
  reader-meta:
    fontFamily: '"Geist Mono", ui-monospace, monospace'
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  utility: "3px"
  item: "4px"
  panel: "5px"
  row: "6px"
  control: "7px"
spacing:
  compact: "8px"
  control: "12px"
  text: "14px"
  body: "16px"
  panel: "20px"
  group: "24px"
  reader: "26px"
  block: "32px"
  section-mobile: "42px"
  section-desktop: "48px"
components:
  theme-control:
    textColor: "{colors.ws-muted}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  profile-copy:
    textColor: "{colors.ws-muted}"
    rounded: "{rounded.utility}"
    height: "28px"
    width: "28px"
  profile-copy-hover:
    backgroundColor: "{colors.ws-active}"
    textColor: "{colors.ws-blue}"
  explorer-link:
    textColor: "{colors.ws-muted}"
    rounded: "{rounded.item}"
    padding: "3px 8px"
  explorer-link-active:
    backgroundColor: "{colors.ws-active}"
    textColor: "{colors.ws-blue}"
  editor-tab:
    backgroundColor: "{colors.ws-panel}"
    textColor: "{colors.ws-ink}"
    typography: "{typography.label}"
    rounded: "6px 6px 0 0"
    padding: "8px 14px"
  project-row:
    rounded: "{rounded.row}"
  focus-panel:
    rounded: "{rounded.panel}"
  source-panel:
    rounded: "{rounded.panel}"
  reader-contents:
    padding: "19px 16px 24px"
  reader-prose:
    typography: "{typography.reader-body}"
---

# Design System: nalam.me

## Overview

**Creative North Star: "Developer Workspace"**

A developer's own workspace makes engineering work easy to inspect. Cool white fields, deep navy text, blue navigation and green source markers give the site the familiarity of an editor while keeping it an ordinary readable website. Flat panels, fine rules, a file explorer and a continuous document canvas carry the character; imagery and animation do not carry the interface.

Geist Sans provides strong headings and readable prose. Geist Mono identifies files, code, source rows and compact technical metadata. The homepage supports a denser README expression, while articles, work accounts and experience use the same shell with quieter reading typography. The user rejected the academic serif-led direction; its retained Vite stylesheet is historical and does not define this system.

**Key Characteristics:**

- Cool white or deep navy surfaces with blue navigation and green project/source markers.
- Flat editor chrome with fine dividers and restrained rounded corners.
- Strong sans-serif hierarchy paired with purposeful monospace detail.
- Real links, native disclosures and readable static documents.
- Minimal motion, clear keyboard focus and system/light/dark themes.

The normative values above are extracted from `src/styles/workspace.css` and `src/styles/reading.css`, with behavior checked in the shared workspace and reading components. They describe the local Astro implementation and validated public artifact; this document does not establish a live release. The sidecar's tonal strips are generated visualization aids, not additional application colors.

## Colors

The palette feels cool, precise and technical. The `ws-*` names retain the implementation's semantic roles; the `-dark` entries record the corresponding values assigned to those same roles in dark mode.

### Primary

- **Workspace Blue** (`ws-blue` / `ws-blue-dark`) identifies links, the professional role, current navigation, JSON keys and numbers, the caret and keyboard focus.
- **Selected Blue Field** (`ws-active` / `ws-active-dark`) sits behind the current explorer entry, selection, heading-anchor hover and copy-button hover.

### Secondary

- **Source Green** (`ws-green` / `ws-green-dark`) marks sequential project indices, work-state text and dots, focus indices, JSON strings and punctuation. The accompanying number or text preserves meaning beyond color.

### Neutral

- **Cool Ground** (`ws-bg` / `ws-bg-dark`) is the outer page, explorer and context-rail ground.
- **Document Surface** (`ws-panel` / `ws-panel-dark`) holds the main canvas and masthead.
- **Chrome Field** (`ws-soft` / `ws-soft-dark`) separates tab strips, file-panel headers, code, blockquotes and table headers from prose.
- **Navy Ink** (`ws-ink` / `ws-ink-dark`) carries headings and primary text.
- **Reading Slate** (`ws-muted` / `ws-muted-dark`) carries supporting prose, dates, metadata and inactive navigation.
- **Source Slate** (`ws-faint` / `ws-faint-dark`) carries decorative line numbers and quiet file icons.
- **Hairline Rule** (`ws-rule` / `ws-rule-dark`) separates editor columns, rows, headers and source gutters. It is a separator, not the sole indication that a control is actionable.

**The Semantic Theme Rule.** Change semantic roles together. Classless HTML follows the operating system; explicit light and dark classes override it. Keep the system-dark and explicit-dark declarations identical.

**The Measured Color Rule.** Preserve the measured text/background pairings and rerun `yarn check:contrast` after color changes. Blue and green never replace a readable label, number or focus outline.

## Typography

**Display and Body Font:** Geist Sans, with the frontmatter's sans-serif fallback stack.

**Label/Mono Font:** Geist Mono, with the frontmatter's monospace fallback stack.

Both are locally served variable WOFF2 faces covering weights (100–900), with normal style and swap loading. The document uses kerning, ligatures and contextual alternates; dates use tabular numerals. Headings balance where allowed, prose uses pretty wrapping, and fonts are never fetched from a third-party service.

### Hierarchy

- **Display, headline and title** use the frontmatter's homepage roles for the name, section headings and sequential project titles. The role line is a blue sans-serif step between name and body; experience and tagline use prominent mono type. These homepage proportions belong to the README expression, not every reader header.
- **Body** is the base document role. Supporting homepage prose commonly increases line-height to (1.7–1.8); compact desktop project summaries use mono text and become sans-serif prose below the shell breakpoint.
- **Label and source** distinguish filenames from literal source text. Navigation itself uses compact sans-serif text. Profile JSON keeps natural wrapping and an independent decorative gutter.
- **Reader display** titles reduce to (2rem) on the compact desktop band and below the shell breakpoint, then (1.75rem) at the smallest reader breakpoint. Reader headings reduce to (1.375rem) on mobile.
- **Reader body** is limited to (72ch), with the frontmatter's relaxed line-height. It becomes (1rem) on compact desktop and mobile. Reader leads use (1.125rem) and line-height (1.75), reducing to (1.0625rem) on mobile.
- **Reader metadata** follows titles. It retains the reviewed kind, knowledge state, evidence and dates without becoming a small eyebrow above a heading. Inline code is (0.85em); fenced code and tables use (0.875rem).

**The Two Faces Rule.** Use Geist Sans for headings and sustained reading, Geist Mono for file/code vocabulary and metadata. Preserve the deliberate mobile switch from dense mono summaries to sans-serif prose.

## Layout

The desktop shell is an editor frame: a masthead (60px), explorer, document canvas and optional context rail. With a rail the columns are (20.185% / 55.78% / 24.035%); without one, the document receives the remaining (79.815%). The masthead aligns to those same columns. At widths of (1601px) and above, the shell stops growing at (1800px) and centers. The document's minimum supported width is (320px).

The approved homepage uses a composition unit of `calc(100vw / 1506)` for its compact first-view spacing. Above the wide breakpoint that unit caps at (1.063px); below the mobile shell breakpoint it becomes (1px). This is an observed homepage proportion system, not a site-wide fluid spacing scale. The frontmatter records recurring fixed spacing values alongside it. Lower homepage sections separate by the documented desktop section spacing, reduced to the mobile section spacing.

Desktop navigation and the explorer compact between (901px) and (1199px). Focus panels stack in the (901–1050px) band. At (900px) and below, the shell becomes one column, the desktop explorer and top navigation give way to a native Explore disclosure, and the main canvas uses horizontal padding (23px). The personal rail follows the primary document and becomes two columns; at (540px) and below it and the focus panels stack, and canvas padding becomes (18px). No primary content depends on opening navigation or metadata.

Readers retain a (72ch) document/prose measure with a sticky contents rail on desktop. Between (901px) and (1100px), titles, prose and rail padding compact. At (900px) and below the rail is hidden and the article supplies a native Contents disclosure; the document centers within the available width. Tables and preformatted code scroll within their own regions, while ordinary prose and media fit the document. At (420px) and below, titles, metadata columns and code padding compact again.

The main document remains complete and useful before JavaScript. The explorer, file vocabulary and context rail support navigation and reading without turning the site into a simulated editor application.

## Elevation & Depth

The system has no box-shadow vocabulary. Depth comes from the cool ground, white document, tinted chrome, hairline column dividers and overlapping active file tab. The copy-status message uses a bounded surface above its local panel; it adds no shadow. Hover changes color, fill or underline without moving the surface. Navigation indicators, disclosure chevrons, source gutters and focus outlines are structural details.

**The Flat Chrome Rule.** Keep panels and rows flat at rest and on hover. Use existing tonal fields, rules and focus outlines to express separation and state.

Motion is minimal: native disclosure chevrons rotate with open state, the skip link moves into view on focus, and active navigation can follow the section in view. There are no timed transitions, entrance sequences, parallax or decorative animation. Reduced-motion preference disables transitions and animations and requests automatic scrolling.

## Shapes

Fine borders (1px) and restrained radii define the editor. The frontmatter's utility corners serve inline code and the copy control, item corners serve explorer selection and copy feedback, panel corners serve context/focus panels and code blocks, row corners serve projects, and control corners serve the theme selector. The file tab rounds only its top corners. Project rows retain a green leading edge (4px); focus panels use (3px), while reader blockquotes use a blue edge (1px). Those edges are native to the approved workspace world and accompany meaningful content.

Small outlined circular work-state dots remain secondary to their text. Icons are inline SVG from the established Lucide geometry or the reader's existing arrow paths. File and folder forms carry navigation meaning; decorative SVGs, hashes and source numbers stay out of the accessibility tree.

## Components

### Theme control and profile copy

The theme control is a bordered, gently rounded label around a native select. It offers System, Light and Dark with an icon and clear accessible name. It remains disabled until its React island is ready; CSS and the guarded pre-paint preference still render the document's theme before hydration. At narrow widths the visible Theme label disappears while the accessible name remains.

Profile copy is a real icon button in the file-panel header, sized by the frontmatter's utility token. It appears and enables when its local script is ready, changes to the selected field and blue ink on hover, and shares the global focus treatment. During copying it reports busy and disables repeated input. Success reads “Profile copied.” If the clipboard rejects the write, only the approved profile JSON text is selected and a status message explains the copy shortcut. Decorative numbers and personal notes are excluded from the copied text. The status region is announced without requiring a modal or toast service.

There is no text-input form or filled primary-action button in the current system; do not infer one from the theme select or utility button.

### Navigation and file tab

The primary navigation uses real section links, blue current text and a short underline. The explorer uses real anchors with familiar folder/file geometry, compact indentation, a tinted current row and a soft hover field. Mobile navigation is a native details/summary disclosure with usable touch rows; selecting a link closes the disclosure after enhancement. Every link remains a usable destination before JavaScript.

The current file tab is document chrome with an ellipsized filename and decorative file/close icons. Its close mark is not an interactive control. Do not turn the tab into a fabricated editor action.

All interactive links, buttons, selects and summaries share a blue focus outline (2px) offset by (4px). The skip link becomes visible at keyboard focus and targets the main document. Focus does not rely on a pale separator or hover styling.

### Sequential work rows and focus panels

Project rows are divided, numbered containers with a green leading edge, title, summary and ruled footer. They use a proportional desktop index column (10%), then fixed narrow columns (43px / 36px) at the mobile breakpoints. A work-state label and outlined dot remain meaningful without color. Links appear only when a reviewed real destination exists; a summary row is not itself a fake navigation affordance. The current three featured areas retain their honest In progress state.

Focus panels repeat the green index and flat ruled form at a smaller scale. Their responsive grid follows the documented layout bands. Experience and writing lists use continuous separators rather than expanding the homepage into a card grid. Writing titles precede their kind/evidence metadata.

### Profile and notes source panels

File-panel headers use tinted chrome, mono filenames and restrained SVG icons. Profile JSON is syntax colored with blue keys/numbers and green strings/punctuation. Notes use muted mono prose. Each panel has a separate ruled source gutter; decorative numbers follow displayed rows, including wraps, after enhancement, with a static fallback retained in HTML. Source text remains selectable and readable without scripts. Main homepage line gutters support the desktop README composition and disappear when the shell becomes one column; profile and notes keep their own local source treatment.

### Readers and writing index

Readers cover site-owned Markdown/MDX, reviewed work accounts, experience, the writing index and the genuine error document. They share the workspace shell, strong title, quieter lead, post-title metadata and a restrained prose measure. Headings offer real fragment links where supplied. Desktop contents use a sticky list; mobile contents use a native disclosure with the same destinations. Back/related/source/end links retain ordinary navigation semantics.

Reader prose supports nested lists, emphatic text, underlined links, restrained blockquotes, inline and fenced code, captions, responsive media and horizontally contained tables. Evidence labels follow the relevant headings. Work metadata separates period, role, evidence and technology; source context remains visually distinct from professional contribution. Writing index items present title and reading action before kind/date and summary. Curated external entries use the explicit Read on LinkedIn action when a reviewed destination exists; no article body, embed or remote runtime request is implied.

## Do's and Don'ts

### Do:

- **Do** preserve the cool workspace palette and the matched system/light/dark semantic roles.
- **Do** use the two locally served Geist faces according to the heading/prose and file/code roles.
- **Do** keep real anchors, native disclosures, visible keyboard focus and useful static main text.
- **Do** retain truthful work-state and evidence labels after their titles or headings.
- **Do** translate dense desktop chrome into readable mobile flow and contain code/table overflow locally.
- **Do** keep assets and automatic page resources same-origin and respect reduced-motion preference.

### Don't:

- **Don't** restore the rejected academic serif-led world from the retained Vite stylesheet.
- **Don't** add shadows, decorative motion or imagery as a substitute for the established editor structure.
- **Don't** invent project actions, article destinations, delivered outcomes or editor controls.
- **Don't** put small kind/evidence labels above headings as decorative eyebrows.
- **Don't** expose decorative source numbers to assistive technology or include them in copied JSON.
- **Don't** let optional rails, enhancement failure or service initialization delay reading or navigation.
