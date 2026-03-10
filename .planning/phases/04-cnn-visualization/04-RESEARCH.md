# Phase 4: CNN Visualization - Research

**Researched:** 2026-03-10
**Domain:** React visualization components (heatmaps, charts, diagrams) in Next.js 15
**Confidence:** HIGH

## Summary

This phase replaces the `ActivationsPlaceholder` component and enhances `PredictionSection` with three visualization components: activation heatmaps with viridis colormap, a confidence bar chart, and a CNN architecture diagram. It also adds loading skeleton states and error handling across all visualization sections.

The backend already returns all needed data in a single API call: base64 grayscale PNG activation maps (64px, 8 filters per conv layer), confidence scores as an array of 10 `{digit, probability}` objects, and layer metadata. The CNN has exactly 2 conv layers: `conv2d_1` (26x26, 8 filters) and `conv2d_2` (11x11, 8 filters), so the activation grid will show 2 sections of 2x4 grids.

The key technical challenge is applying the viridis colormap client-side to grayscale images. This requires a Canvas-based approach: decode base64 PNG to canvas, read pixel data, map through a viridis lookup table, and render the colored result. For the confidence chart, Recharts (3.8.0, available on the corporate npm registry) is the recommended library -- it is React-native, declarative, and requires minimal boilerplate for a simple bar chart. The architecture diagram should be hand-crafted inline SVG since it is static content with only ~6 boxes and arrows.

**Primary recommendation:** Use Recharts for the confidence bar chart, Canvas API for viridis colormapping, and inline SVG for the architecture diagram. No other external libraries needed.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Activation heatmaps: 2x4 grid, ~64px per map, viridis colormap, layer labels only, pixelated scaling
- Confidence chart: vertical bars, blue accent highlight on predicted digit, chart library, show percentages
- Architecture diagram: horizontal flowchart boxes with arrows, simplified key layers, SVG/canvas library
- Loading: skeleton loaders with shimmer effect

### Claude's Discretion
- Error state design
- Chart library choice (Chart.js vs Recharts)
- Viridis colormap implementation approach
- SVG library for architecture diagram
- Skeleton loader animation details
- Whether architecture diagram highlights active layer
- Exact sizing/spacing

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIS-01 | Layer activation heatmaps displayed as 2D grids for each conv layer | Canvas-based viridis colormapping of backend's base64 grayscale PNGs; 2x4 grid layout; model has exactly 2 conv layers with 8 filters each |
| VIS-02 | Confidence bar chart showing prediction probabilities for all 10 digits | Recharts BarChart component; backend returns `confidence` array of 10 `{digit, probability}` objects sorted by digit |
| VIS-03 | Network architecture diagram showing CNN layer structure | Inline SVG horizontal flowchart; model layers: Input -> Conv2D(26x26x8) -> MaxPool(13x13x8) -> Conv2D(11x11x8) -> MaxPool(5x5x8) -> Dense(128) -> Dense(64) -> Output(10) |
| VIS-04 | Loading state while inference is running | Skeleton loaders with shimmer animation via Tailwind `animate-pulse`; match shapes of each visualization section |
| VIS-05 | Error state if backend is unreachable | Phase 3 already has a global error banner with retry; extend with per-section fallback messages |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Recharts | 3.8.0 | Confidence bar chart | React-native declarative API, minimal boilerplate for simple bar charts, well-maintained |
| Canvas API | (browser built-in) | Viridis colormap application | Only way to pixel-manipulate base64 images client-side without a library |
| Inline SVG | (JSX) | Architecture diagram | Static content with ~6 boxes; no library needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-chartjs-2 + chart.js | 5.3.1 + 4.5.1 | Alternative chart library | Only if Recharts has React 19 issues |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Chart.js + react-chartjs-2 | Chart.js requires manual registration of components (BarElement, CategoryScale, etc.), imperative API; Recharts is more React-idiomatic |
| Recharts | Pure SVG bars | More control but requires manual axis rendering, labels, responsive sizing -- chart library handles all this |
| Inline SVG | reactflow / d3 | Massive overkill for a static 6-box diagram; adds ~200KB+ bundle weight |
| Canvas viridis | CSS filters | CSS cannot produce viridis colormap; only grayscale/sepia/hue-rotate available |
| Canvas viridis | Backend-side coloring | Would require modifying Phase 2 inference module; current design sends grayscale intentionally (smaller payload) |

### Installation

```bash
cd frontend && npm install recharts
```

**Verified:** `recharts@3.8.0` is available on the corporate npm registry (`npm.apple.com`). No proxy issues expected -- the frontend was already installed with Next.js, React, and Tailwind from the same registry.

## Architecture Patterns

### Recommended Project Structure

```
frontend/app/
  components/
    ActivationHeatmaps.js    # Replaces ActivationsPlaceholder.js
    ConfidenceChart.js        # New: Recharts bar chart
    ArchitectureDiagram.js    # New: Inline SVG flowchart
    SkeletonLoader.js         # New: Reusable skeleton components
    PredictionSection.js      # Existing: enhanced with chart + loading
    Header.js                 # Existing: unchanged
    ImageSection.js           # Existing: add loading skeleton
  lib/
    viridis.js                # Viridis colormap LUT (256 RGB entries)
  page.js                     # Existing: pass loading/result to new components
```

### Pattern 1: Canvas-Based Viridis Colormapping

**What:** Convert grayscale base64 PNGs to viridis-colored canvases
**When to use:** For every activation heatmap image (16 total: 8 per conv layer x 2 layers)

```javascript
// lib/viridis.js -- Export a 256-entry lookup table
// Each entry is [R, G, B] for that grayscale intensity
export const VIRIDIS_LUT = [
  [68, 1, 84],     // 0 (dark purple)
  [68, 2, 85],     // 1
  // ... 254 more entries ...
  [253, 231, 37],  // 255 (bright yellow)
];

// Component pattern: ViridisCanvas
// Uses useEffect + useRef to draw colored image on mount/update
function ViridisCanvas({ base64, size = 64 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!base64) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      // Draw grayscale image to canvas
      ctx.drawImage(img, 0, 0, size, size);
      // Read pixel data
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      // Apply viridis LUT
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i]; // R channel (grayscale, so R=G=B)
        const [r, g, b] = VIRIDIS_LUT[gray];
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        // alpha stays 255
      }
      ctx.putImageData(imageData, 0, 0);
    };
    img.src = `data:image/png;base64,${base64}`;
  }, [base64, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
```

**Key detail:** The backend images are already 64x64 (nearest-neighbor scaled from original activation dimensions). The canvas reads these at 64x64 and applies the colormap. The `imageRendering: pixelated` CSS ensures the browser does not smooth pixels if the canvas is displayed at a different CSS size.

### Pattern 2: Recharts Bar Chart for Confidence

**What:** Vertical bar chart with 10 bars (digits 0-9), predicted digit highlighted
**When to use:** For the confidence display section

```javascript
import { BarChart, Bar, XAxis, YAxis, Cell, LabelList } from "recharts";

function ConfidenceChart({ confidence, prediction }) {
  // confidence: [{digit: 0, probability: 0.001}, ..., {digit: 9, probability: 0.987}]
  const data = confidence.map((c) => ({
    digit: c.digit.toString(),
    probability: c.probability * 100, // Convert to percentage
  }));

  return (
    <BarChart width={400} height={250} data={data}>
      <XAxis dataKey="digit" />
      <YAxis domain={[0, 100]} hide />
      <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
        {data.map((entry, idx) => (
          <Cell
            key={idx}
            fill={idx === prediction ? "#2563eb" : "#e5e7eb"}
          />
        ))}
        <LabelList
          dataKey="probability"
          position="top"
          formatter={(v) => `${v.toFixed(1)}%`}
          style={{ fontSize: 11 }}
        />
      </Bar>
    </BarChart>
  );
}
```

**Key detail:** The `Cell` component allows per-bar coloring -- `accent-600` (#2563eb) for the predicted digit, `gray-200` (#e5e7eb) for others. `LabelList` renders percentage values above each bar.

### Pattern 3: Inline SVG Architecture Diagram

**What:** Horizontal flowchart showing CNN pipeline
**When to use:** Static diagram always visible on the page

The architecture diagram shows simplified layers (per user decision: skip dropout and flatten):
- Input (28x28x1) -> Conv2D (26x26x8) -> MaxPool (13x13x8) -> Conv2D (11x11x8) -> MaxPool (5x5x8) -> Dense (128) -> Dense (64) -> Output (10)

```javascript
// Each box: rounded rect with layer name + output shape
// Arrows: simple SVG lines connecting boxes
// Total width: ~700px, height: ~80px
// Boxes are ~80px wide, ~60px tall, with 20px gaps + arrow connectors
function ArchitectureDiagram() {
  const layers = [
    { name: "Input", shape: "28x28x1" },
    { name: "Conv2D", shape: "26x26x8" },
    { name: "MaxPool", shape: "13x13x8" },
    { name: "Conv2D", shape: "11x11x8" },
    { name: "MaxPool", shape: "5x5x8" },
    { name: "Dense", shape: "128" },
    { name: "Dense", shape: "64" },
    { name: "Output", shape: "10" },
  ];
  // Render as inline SVG with rect + text + arrow paths
}
```

**Recommendation on active layer highlighting:** Do highlight the active conv layers when activations are shown. This connects the diagram to the heatmaps visually. Use accent-500 fill for conv layers, neutral fill for others. This is a small enhancement that adds significant educational value.

### Anti-Patterns to Avoid

- **Loading images synchronously in render:** The viridis canvas effect is async (Image.onload). Never block render. Use useEffect.
- **Re-creating Image objects on every render:** Memoize or use useEffect dependencies correctly so canvas only redraws when base64 data actually changes.
- **Giant viridis LUT inline in component:** Put the 256-entry array in a separate `lib/viridis.js` file. It's ~5KB of static data.
- **Using Recharts ResponsiveContainer without fixed parent height:** ResponsiveContainer needs a parent with explicit height, or it collapses to 0.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bar chart with axes and labels | Custom SVG bars with manual tick calculation | Recharts BarChart | Axes, responsive sizing, label positioning, hover states all handled |
| Viridis colormap values | Manual colormap interpolation math | Pre-computed 256-entry LUT | Matplotlib/d3 viridis is well-defined; just export the 256 RGB values |
| Shimmer animation | Custom CSS keyframes | Tailwind `animate-pulse` on gray background | Built into Tailwind, matches the existing design system |

**Key insight:** The viridis LUT is the one piece of "data" that must be correct. It should be exported from a well-known source (matplotlib's viridis), not hand-approximated. A 256-entry array is small and easily verifiable.

## Common Pitfalls

### Pitfall 1: Canvas CORS / Tainted Canvas
**What goes wrong:** `getImageData()` throws a SecurityError if the image source is cross-origin
**Why it happens:** Base64 data URLs are same-origin, so this should NOT happen in our case
**How to avoid:** Always use `data:image/png;base64,...` format (which the backend already provides). Never load from a cross-origin URL without CORS headers.
**Warning signs:** "Failed to execute 'getImageData' on 'CanvasRenderingContext2D': The canvas has been tainted by cross-origin data"

### Pitfall 2: Canvas Not Updated After State Change
**What goes wrong:** Activation heatmaps show stale (previous) image data
**Why it happens:** useEffect dependency array missing `base64` prop, or Image.onload closure stale
**How to avoid:** Include `base64` in useEffect dependency array. Create new Image() inside the effect, not outside.
**Warning signs:** Clicking "Pick Random Digit" changes the MNIST image but heatmaps stay the same

### Pitfall 3: Recharts Renders at 0 Height
**What goes wrong:** Chart appears as empty white space
**Why it happens:** ResponsiveContainer without a parent that has explicit height. Or using ResponsiveContainer when a fixed-size BarChart would suffice.
**How to avoid:** For this project, use fixed width/height on BarChart directly (the layout is max-w-3xl, so ~700px). Only use ResponsiveContainer if truly needed.
**Warning signs:** Chart container exists in DOM but has 0 computed height

### Pitfall 4: Viridis LUT Off-By-One or Wrong Values
**What goes wrong:** Heatmaps look wrong -- wrong colors, banding artifacts, or all one color
**Why it happens:** LUT has wrong number of entries, or values are in 0-1 range instead of 0-255
**How to avoid:** Verify LUT has exactly 256 entries. Verify each entry is [R, G, B] with values 0-255. Generate from a trusted source (matplotlib).
**Warning signs:** All heatmaps appear as a single color, or colors don't match viridis reference

### Pitfall 5: Skeleton Loaders Don't Match Content Size
**What goes wrong:** Layout shifts when content loads -- skeleton is different height than actual content
**Why it happens:** Skeleton dimensions don't match the actual component dimensions
**How to avoid:** Use the same container dimensions for skeleton as for content. For the heatmap grid: 2 rows x 4 cols of 64px squares. For the chart: same height as BarChart.
**Warning signs:** Visible "jump" when loading completes

## Code Examples

### Generating the Viridis LUT

The viridis colormap has 256 precisely defined RGB values. Generate once from matplotlib:

```python
# Run this once to generate the LUT for lib/viridis.js
import matplotlib.cm as cm
import json

lut = []
for i in range(256):
    r, g, b, _ = cm.viridis(i / 255.0)
    lut.append([round(r * 255), round(g * 255), round(b * 255)])

print("export const VIRIDIS_LUT = " + json.dumps(lut) + ";")
```

This produces a JavaScript module with exactly 256 `[R, G, B]` entries. The values range from dark purple [68, 1, 84] at index 0 to bright yellow [253, 231, 37] at index 255.

### Skeleton Loader Pattern

```javascript
function SkeletonHeatmapGrid() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="w-16 h-16 bg-gray-200 rounded animate-pulse"
        />
      ))}
    </div>
  );
}

function SkeletonBarChart() {
  return (
    <div className="flex items-end gap-2 h-[250px] pt-8">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-200 rounded-t animate-pulse"
          style={{ height: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  );
}
```

### Recharts with Tailwind Accent Colors

```javascript
// Use the exact color values from globals.css @theme
const ACCENT_600 = "#2563eb"; // Predicted digit bar
const GRAY_200 = "#e5e7eb";   // Other digit bars
const GRAY_500 = "#6b7280";   // Axis text
```

### Error State Pattern

```javascript
function VisualizationError({ section, onRetry }) {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <p className="text-gray-400 font-medium">
        Could not load {section}
      </p>
      <p className="text-sm text-gray-400 mt-1">
        The backend may be unavailable
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm text-accent-600 hover:text-accent-700 underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts 2.x (class-based) | Recharts 3.x (hooks-based, React 19 compatible) | 2024 | Use Recharts 3.x API; 2.x examples may show deprecated patterns |
| Chart.js + wrapper | Recharts | Ecosystem trend | Recharts is more React-idiomatic; Chart.js still valid but more boilerplate |
| D3 for everything | Specialized libraries | Ongoing | D3 is overkill for simple charts in React |

**Deprecated/outdated:**
- Recharts 2.x: Some API changes in 3.x. Use current 3.x documentation.
- `react-vis` (Uber): Unmaintained since 2022. Do not use.

## Data Format Reference

The backend API response from `/api/random-predict` (verified from `inference.py`):

```json
{
  "image": "<base64 PNG string, 112x112, grayscale>",
  "true_label": 7,
  "prediction": 7,
  "confidence": [
    {"digit": 0, "probability": 0.000123},
    {"digit": 1, "probability": 0.000456},
    {"digit": 2, "probability": 0.001234},
    {"digit": 3, "probability": 0.000089},
    {"digit": 4, "probability": 0.002100},
    {"digit": 5, "probability": 0.000300},
    {"digit": 6, "probability": 0.000050},
    {"digit": 7, "probability": 0.987000},
    {"digit": 8, "probability": 0.005600},
    {"digit": 9, "probability": 0.003048}
  ],
  "activations": [
    {
      "layer_name": "conv2d_1",
      "shape": [26, 26, 8],
      "maps": ["<base64 PNG 64x64>", "...(8 total)"]
    },
    {
      "layer_name": "conv2d_2",
      "shape": [11, 11, 8],
      "maps": ["<base64 PNG 64x64>", "...(8 total)"]
    }
  ]
}
```

**Key facts from codebase analysis:**
- Activation maps are grayscale (PIL mode 'L'), 64x64 pixels, nearest-neighbor scaled
- Confidence array is always sorted by digit 0-9 (indexed by digit number)
- `result.confidence[result.prediction].probability` is how PredictionSection currently accesses the top confidence
- Only conv layers are included in activations (the backend filters with `"conv" in name`)

## CNN Architecture for Diagram

From the training notebook (verified):

| Layer | Name | Output Shape | Parameters | Show in Diagram |
|-------|------|-------------|------------|-----------------|
| Input | - | 28x28x1 | - | Yes |
| Conv2D | conv2d_1 | 26x26x8 | 80 | Yes |
| MaxPooling2D | maxpool_1 | 13x13x8 | 0 | Yes |
| Conv2D | conv2d_2 | 11x11x8 | 584 | Yes |
| MaxPooling2D | maxpool_2 | 5x5x8 | 0 | Yes |
| Flatten | flatten | 200 | 0 | No (skip per user decision) |
| Dense | dense_1 | 128 | 25,728 | Yes |
| Dropout | dropout_1 | 128 | 0 | No (skip per user decision) |
| Dense | dense_2 | 64 | 8,256 | Yes |
| Dropout | dropout_2 | 64 | 0 | No (skip per user decision) |
| Dense (softmax) | output | 10 | 650 | Yes |

Simplified diagram shows 8 boxes: Input -> Conv2D -> MaxPool -> Conv2D -> MaxPool -> Dense(128) -> Dense(64) -> Output(10)

## Open Questions

1. **Recharts 3.x + React 19 compatibility**
   - What we know: Recharts 3.8.0 is available; React 19.2.3 is used
   - What's unclear: Whether there are any runtime issues with React 19's new behavior (concurrent features, etc.)
   - Recommendation: Install and test early. If issues arise, fall back to Chart.js or pure SVG bars (the chart is simple enough)

2. **Responsive sizing of architecture diagram**
   - What we know: Page is `max-w-3xl` (~768px), diagram needs ~700px for 8 boxes
   - What's unclear: Whether to use viewBox scaling or fixed width
   - Recommendation: Use SVG `viewBox` with `width="100%"` and `preserveAspectRatio` so it scales within the container

## Sources

### Primary (HIGH confidence)
- Backend source code: `backend/inference.py` -- verified exact response format, layer names, activation shapes
- Training notebook: `notebooks/training.ipynb` -- verified exact model architecture (2 conv layers, 8 filters each)
- Frontend source code: `frontend/app/` -- verified existing component structure, styling patterns, state management
- npm registry: `npm.apple.com` -- verified recharts@3.8.0, chart.js@4.5.1, react-chartjs-2@5.3.1 all available

### Secondary (MEDIUM confidence)
- Recharts API patterns: Based on well-known Recharts usage patterns (BarChart, Cell, LabelList)
- Canvas API for image manipulation: Standard Web API, well-documented on MDN
- Viridis colormap values: Matplotlib's cm.viridis is the canonical source

### Tertiary (LOW confidence)
- Recharts 3.x + React 19 compatibility: No specific issue reports found, but React 19 is relatively new. Flag for validation during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries verified available on corporate registry; API patterns well-known
- Architecture: HIGH - Existing codebase fully analyzed; data format verified from source code
- Pitfalls: HIGH - Canvas manipulation, Recharts sizing, and skeleton loaders are well-understood patterns
- Viridis LUT: MEDIUM - Generation approach is sound but actual 256 values need to be produced from matplotlib

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable domain, no fast-moving dependencies)
