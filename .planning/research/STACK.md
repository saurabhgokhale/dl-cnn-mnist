# Stack Research

**Domain:** Educational CNN Visualization Web App (MNIST)
**Researched:** 2026-03-09
**Confidence:** MEDIUM-HIGH (npm versions verified via registry; Python package versions based on training data + local availability checks)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.1.6 | Frontend framework | Verified latest stable via npm registry. App Router provides clean page structure. Project uses JS only (no TS), which Next.js supports natively. Built-in image optimization useful for displaying activation maps. |
| Tailwind CSS | 4.2.1 | Styling | Verified latest stable via npm registry. Utility-first approach is fast for building responsive layouts. v4 has simplified config with CSS-based configuration instead of JS config file. |
| FastAPI | ~0.115+ | Backend API server | Standard Python async API framework. Auto-generates OpenAPI docs (useful for educational project). Native support for file uploads (digit images) and JSON responses. |
| TensorFlow/Keras | ~2.18+ | CNN model training and inference | Project requirement. Keras is the high-level API built into TF. `tf.keras.Model` submodels enable extracting intermediate layer activations. |
| Python | 3.12.11 | Backend runtime | **Critical: Use 3.12, NOT 3.14.** System default is 3.14.3 but TensorFlow does NOT support Python 3.14 (or likely 3.13). Python 3.12 is installed at `/opt/homebrew/bin/python3.12` and is the latest version with reliable TF support. |
| Node.js | 25.6.1 | Frontend runtime | Installed locally. Next.js 16 is compatible. |

**Confidence:** HIGH for npm versions (verified via `npm view`). MEDIUM for Python package versions (TF/FastAPI exact latest not verified due to PyPI/GitHub API being blocked by proxy -- versions are training-data estimates; verify at install time).

### Frontend Libraries

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| Recharts | 3.8.0 | Confidence bar chart | Verified via npm registry. Built on React, declarative API, easy to create bar charts for 10-digit confidence scores. Simpler React integration than Chart.js. |
| Axios | 1.13.6 | HTTP client | Verified via npm registry. Cleaner API than fetch for file uploads (FormData with digit images) and JSON parsing. |
| next/font | built-in | Montserrat font loading | Built into Next.js -- no extra package needed. Handles Google Fonts with zero layout shift. Use `next/font/google` import. |
| react-dropzone | ~14.3+ | Canvas/image upload UX | De facto standard for drag-and-drop file uploads in React. LOW confidence on exact version. |

### Backend Libraries

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| uvicorn | ~0.32+ | ASGI server | Standard production server for FastAPI. Use `uvicorn[standard]` for auto-reload in dev. |
| python-multipart | ~0.0.18+ | File upload parsing | Required by FastAPI for `UploadFile` endpoint (image uploads from frontend). |
| Pillow | ~11.1+ | Image preprocessing | Converts uploaded digit images to 28x28 grayscale arrays for model input. Standard Python imaging library. |
| NumPy | 2.x | Array manipulation | Core dependency of TensorFlow. Used for reshaping image data, processing activation arrays for JSON serialization. Locally installed: 2.4.2. |
| python-cors-middleware / fastapi CORS | built-in | Cross-origin requests | FastAPI's built-in `CORSMiddleware` handles Next.js dev server (port 3000) calling API (port 8000). No extra package needed. |

### Jupyter / Training

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| Jupyter Notebook | ~7.3+ | Training explanation notebook | Project requirement. Standard for educational ML content. |
| matplotlib | ~3.9+ | Training visualizations | Plot training curves, sample digits, and activation maps in the notebook. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Python venv | Virtual environment | Use `python3.12 -m venv .venv` to isolate backend deps. Critical since system Python is 3.14 which is incompatible with TF. |
| ESLint | JS linting | Included with `create-next-app`. |
| concurrently | Run frontend + backend together | `npm install -D concurrently` to run Next.js dev server and uvicorn in parallel with one command. |

## Installation

```bash
# ============================================
# CRITICAL: Use Python 3.12, not system Python
# ============================================

# Backend setup
python3.12 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn[standard] tensorflow numpy Pillow python-multipart
pip install jupyter matplotlib  # For training notebook

# Frontend setup
npx create-next-app@latest frontend --js --tailwind --app --eslint --no-src-dir --no-import-alias
cd frontend
npm install recharts axios
npm install -D concurrently
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Recharts (bar chart) | Chart.js + react-chartjs-2 | If you need canvas-based rendering for performance with many charts. For 1 bar chart with 10 bars, Recharts is simpler and more React-idiomatic. |
| Recharts (bar chart) | D3.js | Only if you need highly custom visualizations (e.g., interactive network diagrams). Massive overkill for a confidence bar chart. |
| Axios | Native fetch | If you want zero dependencies. fetch works fine but needs more boilerplate for file uploads and error handling. |
| TensorFlow/Keras | PyTorch | If this were a research project. For educational CNN visualization, Keras has simpler API for building and inspecting models. Also: project requirement specifies TF/Keras. |
| Recharts | Nivo | If you want more chart types out of the box. Recharts is lighter and sufficient for bar charts. |
| Tailwind CSS | CSS Modules | If team prefers traditional CSS. Tailwind is project requirement. |
| FastAPI | Flask | If you want simpler setup. FastAPI is project requirement and provides better async support + auto docs. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Python 3.14 (system default) | TensorFlow does not support Python 3.14. Attempting `pip install tensorflow` will fail with no compatible wheel. | Python 3.12 via `/opt/homebrew/bin/python3.12` |
| Python 3.13 | TensorFlow support for 3.13 is uncertain/recent. 3.12 is the safe, well-tested choice. | Python 3.12 |
| TensorFlow.js (in-browser inference) | Adds complexity: model conversion (SavedModel to TFJS), limited layer inspection API in JS, harder to extract intermediate activations. | Server-side TF inference via FastAPI endpoint |
| styled-components / CSS-in-JS | Conflicts with Tailwind utility approach. Mixing paradigms creates confusion. | Tailwind CSS (project requirement) |
| Redux / Zustand | This app has minimal client state (one uploaded image, one prediction result). React useState is sufficient. Global state management is overkill. | React useState + useEffect |
| Next.js API Routes for ML inference | Next.js API routes run in Node.js -- cannot run TensorFlow Python models. Separate FastAPI backend is required. | FastAPI backend on separate port |
| TypeScript | Project explicitly requires JS only. Adding TS would increase complexity for an educational project. | Plain JavaScript with JSDoc comments if needed |

## Stack Patterns

**For the drawing canvas (digit input):**
- Use HTML5 `<canvas>` element with vanilla JS drawing handlers (mousedown/mousemove/mouseup + touch events)
- Export canvas content as PNG blob via `canvas.toBlob()`, send to FastAPI via Axios + FormData
- Do NOT use a heavy canvas library (Fabric.js, Konva) -- vanilla canvas is sufficient for freehand drawing on a 280x280 area

**For activation visualization:**
- Backend: Create a TF model that outputs intermediate layer activations using `tf.keras.Model(inputs=model.input, outputs=[layer.output for layer in model.layers])`
- Serialize activation arrays as base64-encoded PNG images (generated server-side with Pillow/matplotlib) or as nested JSON arrays
- Recommendation: Use base64 PNG images for activation heatmaps (smaller payload, no client-side rendering needed) and JSON arrays for the confidence scores

**For the Montserrat font:**
```javascript
// In app/layout.js
import { Montserrat } from 'next/font/google';
const montserrat = Montserrat({ subsets: ['latin'] });
// Apply via className={montserrat.className} on <body>
```

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| TensorFlow ~2.18 | Python 3.9-3.12 | TF historically lags 1-2 Python versions. 3.12 is the newest safe target. **Verify `pip install tensorflow` succeeds in the venv before writing model code.** |
| Next.js 16.1.6 | Node.js 18.18+ | Node 25.6.1 on this machine is compatible. |
| Tailwind CSS 4.2.1 | Next.js 16 | Tailwind v4 uses CSS-based config (`@import "tailwindcss"` in CSS file) instead of `tailwind.config.js`. `create-next-app --tailwind` handles setup. |
| NumPy 2.x | TensorFlow ~2.18+ | TF 2.16+ supports NumPy 2.x. Older TF versions may conflict -- ensure both are recent. |
| Recharts 3.8.0 | React 18+ | Next.js 16 uses React 19. Verify Recharts 3.x React 19 compatibility at install time. LOW confidence -- may need `--legacy-peer-deps`. |

## Critical Setup Notes

1. **Python version is the biggest risk.** The system default `python3` is 3.14.3. Every Python command (venv creation, pip install, running uvicorn) MUST use `python3.12` explicitly or activate a 3.12 venv first.

2. **MNIST data is pre-downloaded.** The pickle file at `/Users/saurabh/Downloads/mnist.pkl.gz` (17MB) avoids needing `tensorflow.keras.datasets.mnist.load_data()` which downloads from the internet. Load with:
   ```python
   import gzip, pickle
   with gzip.open('/Users/saurabh/Downloads/mnist.pkl.gz', 'rb') as f:
       (x_train, y_train), (x_val, y_val), (x_test, y_test) = pickle.load(f, encoding='latin1')
   ```
   Note: The pickle format may use a 3-tuple split (train/val/test). Verify the actual structure at load time.

3. **CORS configuration** is required from day one. FastAPI must allow `http://localhost:3000` origin for the Next.js dev server.

## Sources

- npm registry (verified 2026-03-09): Next.js 16.1.6, Tailwind CSS 4.2.1, Chart.js 4.5.1, react-chartjs-2 5.3.1, Recharts 3.8.0, Axios 1.13.6
- Local system (verified 2026-03-09): Python 3.11.13, 3.12.11, 3.13.9, 3.14.3; Node.js 25.6.1; NumPy 2.4.2
- MNIST dataset (verified 2026-03-09): `/Users/saurabh/Downloads/mnist.pkl.gz` (17,051,982 bytes)
- TensorFlow Python compatibility: Training data (MEDIUM confidence -- verify at install time)
- FastAPI, uvicorn, Pillow versions: Training data estimates (LOW confidence on exact version numbers -- use latest at install time)
- Tailwind CSS v4 config changes: Training data (MEDIUM confidence -- `create-next-app` handles this automatically)

---
*Stack research for: MNIST CNN Visualizer*
*Researched: 2026-03-09*
