# Phase 4: CNN Visualization - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Add CNN visualization components to the existing Phase 3 frontend: activation heatmaps for each conv layer, a confidence bar chart for all 10 digits, a network architecture diagram, and loading/error states. This is the project's core educational value — making CNN internals visible and understandable.

</domain>

<decisions>
## Implementation Decisions

### Activation heatmaps
- 2x4 grid layout for the 8 filter maps per conv layer
- Each individual map displayed at ~64px (small, compact)
- Viridis colormap applied (not grayscale) — more visually distinct activations
- Layer-level labels only (e.g. "Conv Layer 1 — 26x26, 8 filters"), no per-filter labels
- Pixelated scaling to match MNIST image aesthetic (CSS image-rendering: pixelated)

### Confidence chart
- Vertical bars — digits 0-9 on X axis, probability extends upward
- Predicted digit bar highlighted in blue accent color, other bars in light gray
- Use a chart library (e.g. Chart.js or Recharts) for polished axes, labels, and rendering
- Show confidence percentages on or above each bar (e.g. "98.7%")

### Architecture diagram
- Flowchart / box diagram style — boxes for each layer connected by arrows
- Horizontal flow: left to right (Input → Conv → Pool → ... → Output)
- Simplified: show key layers only (conv, pool, dense, output) — skip dropout and flatten for clarity
- Use an SVG or canvas library for precise rendering (not pure CSS)
- Each box shows layer name and output shape

### Loading & error states
- Skeleton loaders during inference — gray placeholder shapes matching section layouts (shimmer effect)
- Skeleton placeholders for heatmap grid, confidence chart, and architecture diagram areas

### Claude's Discretion
- Error state design and behavior (Phase 3 already has basic error handling to build on)
- Specific chart library choice (Chart.js vs Recharts vs other)
- Specific SVG library for architecture diagram (or hand-rolled SVG)
- Viridis colormap implementation approach (CSS filter, canvas, or pre-colored backend images)
- Skeleton loader animation details
- Whether architecture diagram highlights the current active layer
- Exact sizing and spacing between visualization sections

</decisions>

<specifics>
## Specific Ideas

- The viridis colormap for activation maps is important — it makes different activation levels visually distinct (grayscale is harder to read)
- The architecture diagram should be educational — showing the CNN "pipeline" at a glance so students understand data flow
- Confidence percentages on bars help students see exactly how confident the model is for each digit

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-cnn-visualization*
*Context gathered: 2026-03-10*
