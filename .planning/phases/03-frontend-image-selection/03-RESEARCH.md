# Phase 3: Frontend & Image Selection - Research

**Researched:** 2026-03-10
**Domain:** Next.js 16 + Tailwind CSS 4 frontend, API integration with FastAPI backend
**Confidence:** HIGH

## Summary

This phase creates the Next.js frontend that connects to the Phase 2 FastAPI backend. The user-facing app lets users pick random or specific MNIST digits, displays them with pixelated scaling, and shows prediction results. The app must be structured to accept CNN visualization components in Phase 4.

The stack is straightforward: `create-next-app` with `--js --tailwind --app` gives us Next.js 16.1.6 + Tailwind CSS 4.2.1 + React 19.2.3 out of the box. Montserrat font loads via the built-in `next/font/google`. No additional UI libraries are needed for this phase -- native `fetch` is sufficient for the two API calls. The backend currently only has `/api/random-predict`; this phase must add a `?digit=N` query parameter to support digit-specific selection.

**Primary recommendation:** Use `create-next-app@latest --js --tailwind --app --eslint --use-npm --disable-git` to scaffold, then replace default content with a single-page vertical layout. Keep all components in `app/components/` since the app is single-page. Use native `fetch` (no Axios needed for simple GET requests). Add a `?digit=N` query parameter to the existing backend endpoint.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Vertical scroll layout -- stacked sections, not side-by-side columns
- Section order: Input (image + picker) -> Prediction -> Layer activations (for Phase 4)
- Narrow centered content area (~800px max-width) with whitespace on sides
- Page header with app title + subtitle (e.g. "See what a CNN sees when classifying handwritten digits")
- Light theme -- white/light gray background, dark text
- Blue accent color for buttons, highlights, and active states -- professional, academic feel
- Distinct card containers for each section (border/shadow)
- Explanatory captions under sections + expandable "What am I seeing?" tooltips
- MNIST image scaled to ~150-200px (medium size)
- Original colors preserved -- white digit on black background
- Pixelated scaling (nearest-neighbor / CSS `image-rendering: pixelated`) to show the 28x28 grid nature
- True label shown below the image (e.g. "True label: 7") for comparison with prediction
- "Pick Random Digit" button + row of 10 digit buttons (0-9) for specific digit selection
- Number buttons displayed as a row above or near the random button
- Loading state: button disabled with small loading indicator, previous result stays visible
- Auto-load a random digit on page load -- app looks alive immediately

### Claude's Discretion
- Exact Tailwind color values for the blue accent palette
- Spacing, padding, and typography scale
- Tooltip implementation approach
- Card shadow/border styling details
- Responsive behavior for smaller screens
- Footer content (if any)
- How to handle backend-down error state

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FE-01 | Next.js app (JavaScript only, no TypeScript) with Tailwind CSS | `create-next-app@latest --js --tailwind --app` scaffolds this exactly. Verified: Next.js 16.1.6, Tailwind 4.2.1, React 19.2.3 |
| FE-02 | Google Font Montserrat applied globally | `next/font/google` built-in: `import { Montserrat } from "next/font/google"` in layout.js, apply via CSS variable + `@theme` |
| FE-03 | Clean, educational layout with clear section separation | Vertical scroll layout with card containers, ~800px max-width, Tailwind utility classes |
| IMG-01 | User can click a button to select a random MNIST image from the dataset | Frontend calls `GET /api/random-predict` (exists) or `GET /api/random-predict?digit=N` (needs adding to backend) |
| IMG-02 | Selected image is displayed clearly (28x28 scaled up) on the page | Base64 PNG from backend displayed as `<img>` with `image-rendering: pixelated` and 150-200px size |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | Frontend framework | Verified via `npm view`. App Router. JS only (no TS). |
| React | 19.2.3 | UI library | Bundled with Next.js 16.1.6 |
| Tailwind CSS | 4.2.1 | Styling | Verified via `npm view`. CSS-based config via `@import "tailwindcss"` (no tailwind.config.js in v4) |
| @tailwindcss/postcss | ^4 | PostCSS integration | Required devDependency for Tailwind v4 in Next.js |
| next/font/google | built-in | Montserrat font loading | Zero layout shift, self-hosted Google Fonts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native fetch | built-in | HTTP client | For all API calls -- simple GET requests need no library |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native fetch | Axios 1.13.6 | Axios adds a dependency for no benefit -- we only make simple GET calls with JSON responses. Save Axios for Phase 4 if file uploads are needed. |

**Installation:**
```bash
npx create-next-app@latest frontend --js --tailwind --app --eslint --use-npm --disable-git
# No additional packages needed for Phase 3
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/
├── app/
│   ├── layout.js          # Root layout: Montserrat font, metadata, body wrapper
│   ├── page.js            # Single page: assembles all sections
│   ├── globals.css         # Tailwind import + custom theme + CSS variables
│   └── components/
│       ├── Header.js       # App title + subtitle
│       ├── ImageSection.js # MNIST image display + digit picker
│       ├── PredictionSection.js  # Prediction result + confidence
│       └── ActivationsPlaceholder.js  # Empty section for Phase 4
├── public/
├── package.json
├── next.config.mjs
├── postcss.config.mjs
├── jsconfig.json
└── eslint.config.mjs
```

### Pattern 1: Montserrat Font Setup (Tailwind v4)
**What:** Load Montserrat via next/font, register as CSS variable, use in Tailwind theme
**When to use:** Global font application with Tailwind v4

```javascript
// app/layout.js
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "MNIST CNN Visualizer",
  description: "See what a CNN sees when classifying handwritten digits",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

```css
/* app/globals.css */
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-montserrat);
}

/* Light theme only -- no dark mode */
:root {
  --background: #ffffff;
  --foreground: #1a1a2e;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), system-ui, sans-serif;
}
```

### Pattern 2: Base64 Image Display with Pixelated Scaling
**What:** Display base64 PNG from backend with nearest-neighbor scaling
**When to use:** Displaying MNIST digit images

```jsx
<img
  src={`data:image/png;base64,${imageData}`}
  alt={`MNIST digit: ${trueLabel}`}
  width={180}
  height={180}
  className="border border-gray-300 rounded"
  style={{ imageRendering: "pixelated" }}
/>
```

Note: Use a plain `<img>` tag, NOT `next/image`. The Next.js `<Image>` component does not support `data:` URLs by default and would require `unoptimized` prop. A plain `<img>` is simpler and correct for base64 data.

### Pattern 3: Client Component with useEffect for Auto-Load
**What:** Mark the interactive page as a client component, fetch on mount
**When to use:** The main page needs useState/useEffect for API calls

```jsx
"use client";

import { useState, useEffect, useCallback } from "react";

export default function Home() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDigit = useCallback(async (digit = null) => {
    setLoading(true);
    setError(null);
    try {
      const url = digit !== null
        ? `http://localhost:8000/api/random-predict?digit=${digit}`
        : "http://localhost:8000/api/random-predict";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load on mount
  useEffect(() => {
    fetchDigit();
  }, [fetchDigit]);

  // ... render
}
```

### Pattern 4: Tailwind v4 Custom Colors via @theme
**What:** Define custom blue accent palette in CSS, no config file needed
**When to use:** Tailwind v4 custom color definitions

```css
/* In globals.css, inside or after @theme */
@theme inline {
  --font-sans: var(--font-montserrat);
  --color-accent-50: #eff6ff;
  --color-accent-100: #dbeafe;
  --color-accent-200: #bfdbfe;
  --color-accent-500: #3b82f6;
  --color-accent-600: #2563eb;
  --color-accent-700: #1d4ed8;
}
```

Then use as `bg-accent-500`, `text-accent-700`, `hover:bg-accent-600`, etc.

### Pattern 5: Simple Tooltip with CSS (No Library)
**What:** Expandable "What am I seeing?" using HTML details/summary
**When to use:** Educational explanatory text

```jsx
<details className="mt-2 text-sm text-gray-600">
  <summary className="cursor-pointer text-accent-600 hover:text-accent-700 font-medium">
    What am I seeing?
  </summary>
  <p className="mt-1 pl-4">
    This is a 28x28 pixel handwritten digit from the MNIST dataset...
  </p>
</details>
```

This is simpler than a tooltip library and works well for educational "learn more" patterns. No JS needed.

### Anti-Patterns to Avoid
- **Using `next/image` for base64 data:** The `<Image>` component expects URL paths or imported images. Base64 requires `unoptimized` prop and adds complexity for no benefit. Use plain `<img>`.
- **Creating a tailwind.config.js:** Tailwind v4 uses CSS-based configuration via `@theme` in the CSS file. The old JS config file pattern is deprecated.
- **Server Components for interactive UI:** The main page needs client-side state (useState, useEffect). Mark it `"use client"`. Server Components are the default in Next.js 16 App Router -- interactive parts must explicitly opt out.
- **Hardcoding backend URL everywhere:** Define `const API_BASE = "http://localhost:8000"` once and import/reference it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Google Font loading | Manual `<link>` tag or @import in CSS | `next/font/google` built-in | Handles self-hosting, zero layout shift, font subsetting automatically |
| CSS utility framework | Custom CSS classes | Tailwind CSS v4 | Already configured by create-next-app |
| Loading spinner | Complex animation library | Tailwind `animate-spin` on an SVG | Built-in animation utility, no dependency |
| Tooltips / expandable text | Tooltip library (tippy.js, etc.) | HTML `<details>/<summary>` | Native HTML, no JS, accessible, sufficient for educational "learn more" |

## Common Pitfalls

### Pitfall 1: Tailwind v4 Config Confusion
**What goes wrong:** Trying to use `tailwind.config.js` (v3 pattern) with Tailwind v4
**Why it happens:** Most tutorials and training data reference v3 configuration
**How to avoid:** All customization goes in `globals.css` via `@theme inline { ... }`. No JS config file exists or is needed.
**Warning signs:** Error messages about unrecognized config, or custom classes not applying

### Pitfall 2: Server Component vs Client Component
**What goes wrong:** Using useState/useEffect in a file without `"use client"` directive
**Why it happens:** Next.js 16 App Router defaults all components to Server Components
**How to avoid:** Add `"use client"` at the top of any component that uses React hooks or browser APIs. The main page.js will need this since it manages API call state.
**Warning signs:** "useState is not a function" or "useEffect is not a function" errors

### Pitfall 3: CORS Issues in Development
**What goes wrong:** Frontend on port 3000 cannot reach backend on port 8000
**Why it happens:** Browser blocks cross-origin requests
**How to avoid:** Backend already has CORS configured for `http://localhost:3000` (verified in Phase 2 code). No frontend config needed. Just use full URLs: `http://localhost:8000/api/...`
**Warning signs:** Network errors in browser console mentioning CORS

### Pitfall 4: Image Rendering in Different Browsers
**What goes wrong:** `image-rendering: pixelated` doesn't work consistently
**Why it happens:** Some browsers need vendor prefixes or different values
**How to avoid:** Use inline style `{ imageRendering: "pixelated" }`. This works in Chrome, Firefox, and Safari modern versions. Also add `-ms-interpolation-mode: nearest-neighbor` if IE support were needed (it's not).
**Warning signs:** Blurry/smoothed MNIST digits instead of crisp pixel grid

### Pitfall 5: Missing `"use client"` in Component Files
**What goes wrong:** Components that receive event handlers (onClick) fail at build
**Why it happens:** If a Server Component passes an onClick prop, the child that handles it must be a Client Component
**How to avoid:** Either mark page.js as `"use client"` (simplest for a single-page app) and all its imported components inherit client context, or mark individual interactive components as client components.
**Warning signs:** Serialization errors about functions not being serializable

### Pitfall 6: Backend Endpoint for Digit-Specific Selection
**What goes wrong:** No endpoint exists to request a specific digit (0-9)
**Why it happens:** Phase 2 only created `/api/random-predict` with no filtering
**How to avoid:** Add an optional `digit` query parameter to the existing endpoint. In backend/main.py, accept `digit: int | None = None` and filter `test_labels` to find matching indices.
**Warning signs:** Cannot implement the "0-9 digit buttons" feature without backend changes

## Code Examples

### Backend Modification: Add digit query parameter
```python
# In backend/main.py -- modify random_predict endpoint
from fastapi import FastAPI, Request, Query

@app.get("/api/random-predict")
async def random_predict(request: Request, digit: int | None = Query(None, ge=0, le=9)):
    test_images = request.app.state.test_images
    test_labels = request.app.state.test_labels
    activation_model = request.app.state.activation_model
    layer_names = request.app.state.layer_names

    if digit is not None:
        # Filter indices where label matches requested digit
        matching = [i for i, label in enumerate(test_labels) if int(label) == digit]
        idx = random.choice(matching)
    else:
        idx = random.randint(0, len(test_images) - 1)

    image = test_images[idx : idx + 1]
    true_label = int(test_labels[idx])
    # ... rest unchanged
```

### Frontend: Complete Digit Picker Component
```jsx
"use client";

export default function DigitPicker({ onSelectDigit, onSelectRandom, loading }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <button
            key={d}
            onClick={() => onSelectDigit(d)}
            disabled={loading}
            className="w-10 h-10 rounded-lg bg-accent-100 text-accent-700 font-semibold
                       hover:bg-accent-500 hover:text-white transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {d}
          </button>
        ))}
      </div>
      <button
        onClick={onSelectRandom}
        disabled={loading}
        className="px-6 py-2 rounded-lg bg-accent-600 text-white font-medium
                   hover:bg-accent-700 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center gap-2"
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        Pick Random Digit
      </button>
    </div>
  );
}
```

### Frontend: API Base URL Pattern
```javascript
// Use environment variable or hardcoded default
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchPrediction(digit = null) {
  const url = digit !== null
    ? `${API_BASE}/api/random-predict?digit=${digit}`
    : `${API_BASE}/api/random-predict`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js | @theme in CSS file | Tailwind v4 (2025) | All custom theme values go in CSS, not JS config |
| @next/font package | next/font/google built-in | Next.js 13.2+ | No extra package needed |
| Pages Router | App Router | Next.js 13+ (stable 14+) | Files in app/ dir, Server Components default, layout.js pattern |
| getServerSideProps | Server Components / use client | Next.js 13+ | Interactive pages use "use client" + useEffect |

## Open Questions

1. **Next.js proxy for API calls**
   - What we know: Direct fetch to `http://localhost:8000` works with CORS configured
   - What's unclear: Whether to use next.config.mjs `rewrites` to proxy `/api/*` to the backend instead
   - Recommendation: Use direct fetch with full URL for simplicity. Proxy adds complexity and hides the two-server architecture from the educational context.

2. **Prediction display scope for Phase 3 vs Phase 4**
   - What we know: The API returns prediction, confidence, and activations. Phase 4 handles visualization components (VIS-01 through VIS-05).
   - What's unclear: How much prediction info to show in Phase 3 vs leaving for Phase 4
   - Recommendation: Phase 3 should show basic prediction result (predicted digit + confidence percentage) in the Prediction section. The confidence bar chart (VIS-02) is Phase 4. This keeps Phase 3 useful on its own while leaving visualization work for Phase 4.

## Sources

### Primary (HIGH confidence)
- npm registry (verified 2026-03-10): Next.js 16.1.6, Tailwind CSS 4.2.1, React 19.2.3
- Local scaffolding test (verified 2026-03-10): `create-next-app@latest` with `--js --tailwind --app` produces expected structure
- Phase 2 backend code (verified 2026-03-10): `/api/random-predict` endpoint, CORS for localhost:3000, response format `{ image, true_label, prediction, confidence, activations }`

### Secondary (MEDIUM confidence)
- Tailwind v4 `@theme` CSS configuration pattern: verified via scaffolded app's `globals.css`
- `next/font/google` Montserrat import: pattern verified from scaffolded `layout.js` (uses same mechanism with different font)

### Tertiary (LOW confidence)
- None -- all critical claims verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified via npm registry and local scaffold test
- Architecture: HIGH -- project structure verified via actual create-next-app output
- Pitfalls: HIGH -- Tailwind v4 differences verified, Server Component behavior well-documented
- Backend modification: HIGH -- reviewed existing code, simple query parameter addition

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable stack, no rapid changes expected)
