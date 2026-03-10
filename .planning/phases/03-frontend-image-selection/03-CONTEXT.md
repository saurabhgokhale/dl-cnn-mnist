# Phase 3: Frontend & Image Selection - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Next.js app with Tailwind CSS and Montserrat font that connects to the Phase 2 FastAPI backend. Users can pick a random MNIST digit or select a specific digit (0-9), see it displayed, and view the prediction result. The app is ready to receive CNN visualization components in Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Page layout
- Vertical scroll layout — stacked sections, not side-by-side columns
- Section order: Input (image + picker) → Prediction → Layer activations (for Phase 4)
- Narrow centered content area (~800px max-width) with whitespace on sides
- Page header with app title + subtitle (e.g. "See what a CNN sees when classifying handwritten digits")

### Visual style & branding
- Light theme — white/light gray background, dark text
- Blue accent color for buttons, highlights, and active states — professional, academic feel
- Distinct card containers for each section (border/shadow)
- Explanatory captions under sections + expandable "What am I seeing?" tooltips

### Image display
- MNIST image scaled to ~150-200px (medium size)
- Original colors preserved — white digit on black background
- Pixelated scaling (nearest-neighbor / CSS `image-rendering: pixelated`) to show the 28x28 grid nature
- True label shown below the image (e.g. "True label: 7") for comparison with prediction

### Pick-a-digit interaction
- "Pick Random Digit" button + row of 10 digit buttons (0-9) for specific digit selection
- Number buttons displayed as a row above or near the random button
- Loading state: button disabled with small loading indicator, previous result stays visible
- Auto-load a random digit on page load — app looks alive immediately

### Claude's Discretion
- Exact Tailwind color values for the blue accent palette
- Spacing, padding, and typography scale
- Tooltip implementation approach
- Card shadow/border styling details
- Responsive behavior for smaller screens
- Footer content (if any)
- How to handle backend-down error state

</decisions>

<specifics>
## Specific Ideas

- The digit picker (0-9 buttons + random) is the primary interaction — should feel prominent and easy to use
- Digit-specific selection requires a backend endpoint that filters by label (currently only `/api/random-predict` exists — Phase 3 will need to add a query parameter or new endpoint)
- Montserrat font specified in original requirements — apply globally

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-frontend-image-selection*
*Context gathered: 2026-03-10*
