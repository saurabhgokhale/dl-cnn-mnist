# Domain Pitfalls

**Domain:** MNIST CNN Visualization Educational Web App (Next.js + FastAPI + TensorFlow)
**Researched:** 2026-03-09

## Critical Pitfalls

Mistakes that cause rewrites, broken visualizations, or fundamentally wrong educational output.

---

### Pitfall 1: Nielsen Pickle Data Shape Mismatch with Conv2D

**What goes wrong:** The MNIST data from `mnist.pkl.gz` (Michael Nielsen's book) stores images as flat `(784,)` float32 vectors already normalized to [0, 1]. Every Conv2D layer in Keras expects `(28, 28, 1)` input. Forgetting to reshape -- or reshaping incorrectly (row-major vs column-major, missing channel dim) -- produces a model that trains but learns garbage spatial features. The visualizations will look like noise and teach students wrong things.

**Why it happens:** Most MNIST tutorials online use `tf.keras.datasets.mnist` which gives `(28, 28)` arrays. Copying reshape code from those tutorials without checking produces `(28, 28, 1)` but the flatten order might differ. Nielsen's data is `(N, 784)` with C-order flattening, which matches NumPy default, but it is easy to assume wrong.

**Consequences:** Model trains with decent accuracy (MNIST is forgiving) but activation maps are spatially meaningless. Students see "working" convolutions that make no pedagogical sense.

**Prevention:**
- Reshape explicitly: `x.reshape(-1, 28, 28, 1)` with verification
- Add a validation step after reshape: display a few images with matplotlib in the Jupyter notebook to confirm they look correct before training
- Assert value range is [0, 1] (already satisfied by Nielsen's data, but guard against double-normalization)

**Detection:** Activation maps for early conv layers look random or uniform rather than showing clear edge/feature detectors. First-layer filters do not resemble oriented edges.

**Phase:** Model training phase (Phase 1). Must be correct before any visualization work begins.

---

### Pitfall 2: Extracting Intermediate Activations Wrong in TensorFlow/Keras

**What goes wrong:** Building the activation extraction model incorrectly, leading to either (a) extracting weights instead of activations, (b) creating a new Model that duplicates layers and does not share weights with the trained model, or (c) hitting the "not connected graph" error when constructing the extraction model.

**Why it happens:** There are multiple ways to extract intermediate outputs in Keras:
1. `tf.keras.Model(inputs=model.input, outputs=[layer.output for layer in model.layers])` -- the correct approach for functional/sequential models
2. Calling `layer(input)` manually -- creates new computation, does NOT reuse trained weights
3. Using `K.function` -- legacy Keras 1/2 pattern, deprecated and broken in TF2 eager mode

People copy method 3 from old tutorials or accidentally do method 2.

**Consequences:** Activations shown to users bear no relation to what the trained model actually computes. The entire educational value of the app is destroyed.

**Prevention:**
- Use the functional API extraction pattern exclusively:
  ```python
  activation_model = tf.keras.Model(
      inputs=model.input,
      outputs=[layer.output for layer in model.layers if 'conv' in layer.name or 'pool' in layer.name or 'dense' in layer.name]
  )
  activations = activation_model.predict(input_image)
  ```
- Verify by checking that the final layer output matches `model.predict(input_image)` exactly (within float tolerance)
- Name layers explicitly during model construction to make extraction reliable

**Detection:** Final extracted activation does not match direct `model.predict()` output. Write an assertion test for this.

**Phase:** Model training and API phase (Phase 1-2). Build extraction into the model design, not as an afterthought.

---

### Pitfall 3: Sending Raw NumPy Arrays Over HTTP (Serialization Disaster)

**What goes wrong:** Activation maps are NumPy arrays. Naively serializing them for the API response leads to one of: (a) JSON serialization crash (`TypeError: Object of type ndarray is not JSON serializable`), (b) massive JSON payloads (a single conv layer with 32 filters of 26x26 produces 21,632 floats -- nested JSON arrays are enormous), (c) float precision issues where JSON floats differ from numpy float32.

**Why it happens:** First instinct is `json.dumps()` which fails on ndarray. Then `.tolist()` which works but produces huge nested lists. For a typical small CNN with 3 conv layers (32, 64, 64 filters), the total JSON payload can exceed 500KB per inference -- slow on the frontend, wasteful to parse.

**Consequences:** Sluggish API responses, frontend lag when parsing, or crashes on serialization. Educational tool feels broken.

**Prevention:**
- Convert activation maps to images server-side: normalize each filter map to [0, 255], encode as PNG/base64. This is 10-50x smaller than raw floats and the frontend just renders images.
- Return a structured response:
  ```json
  {
    "prediction": 7,
    "confidence": [0.01, 0.01, ...],
    "layers": [
      {"name": "conv2d_1", "shape": [26,26,32], "maps": ["data:image/png;base64,...", ...]}
    ]
  }
  ```
- Alternative: use MessagePack or encode arrays as base64 raw bytes if the frontend needs exact values for interactive overlays.

**Detection:** API response time > 200ms for a single 28x28 image inference. Response body > 100KB.

**Phase:** API design phase (Phase 2). Decide the serialization format before building frontend consumers.

---

### Pitfall 4: TensorFlow Model Loading on Every Request

**What goes wrong:** Loading the Keras model inside the request handler (or loading it at module import time in a way that breaks with ASGI workers). Each `tf.keras.models.load_model()` call takes 1-5 seconds and allocates GPU/CPU memory.

**Why it happens:** Developers new to FastAPI put `load_model()` in the endpoint function, or use a global variable that does not survive ASGI worker forking.

**Consequences:** 2-5 second latency per request, or memory leaks from loading multiple model copies, or crashes when workers fork after TF initializes.

**Prevention:**
- Load the model once at application startup using FastAPI's lifespan pattern:
  ```python
  from contextlib import asynccontextmanager

  @asynccontextmanager
  async def lifespan(app):
      app.state.model = tf.keras.models.load_model("model.keras")
      app.state.activation_model = tf.keras.Model(
          inputs=app.state.model.input,
          outputs=[l.output for l in app.state.model.layers]
      )
      yield

  app = FastAPI(lifespan=lifespan)
  ```
- Do NOT use `@app.on_event("startup")` -- it is deprecated in modern FastAPI
- For single-worker dev mode this is straightforward; just use `uvicorn --workers 1`

**Detection:** First request after startup is slow (expected), but subsequent requests are also slow (bad). Check if `load_model` appears inside any endpoint function.

**Phase:** API scaffolding phase (Phase 2). Foundational architectural decision.

---

### Pitfall 5: CORS Misconfiguration Blocks Frontend-Backend Communication

**What goes wrong:** Next.js dev server runs on `localhost:3000`, FastAPI on `localhost:8000`. Browser blocks all cross-origin requests. Developer adds `allow_origins=["*"]` which works in dev but then either (a) forgets to restrict in production, or (b) forgets to also allow the right methods/headers and gets blocked on preflight OPTIONS requests.

**Why it happens:** CORS errors are confusing. The browser shows a generic error, people add wildcard origins, and then non-GET requests (POST with JSON body) still fail because `allow_headers` does not include `Content-Type`.

**Consequences:** Frontend shows no data, confusing CORS errors in console, or security vulnerability with wildcard origins in production.

**Prevention:**
- Configure CORS explicitly at project setup:
  ```python
  from fastapi.middleware.cors import CORSMiddleware
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["http://localhost:3000"],
      allow_methods=["GET", "POST"],
      allow_headers=["Content-Type"],
  )
  ```
- Alternative: Use Next.js API routes as a proxy to avoid CORS entirely (add `rewrites()` in `next.config.js` to proxy `/api/*` to FastAPI). This is cleaner for educational projects.

**Detection:** Browser console shows `Access-Control-Allow-Origin` errors. Test with `curl -I -X OPTIONS http://localhost:8000/predict` to verify preflight.

**Phase:** Project scaffolding phase (Phase 1). Must be resolved before any frontend-backend integration.

---

## Moderate Pitfalls

### Pitfall 6: Activation Visualization Without Proper Normalization

**What goes wrong:** Activation values have arbitrary ranges (can be negative with ReLU's zero-clipped outputs, or very large). Displaying raw values as pixel intensities produces either all-black images (values clustered near zero) or all-white images (values very large), hiding the actual feature patterns.

**Prevention:**
- Normalize each activation map independently to [0, 255]: `(map - map.min()) / (map.max() - map.min() + 1e-8) * 255`
- Use per-filter normalization, not per-layer normalization (different filters activate at different scales)
- Add a colormap (viridis or inferno) for better perceptual visibility than grayscale
- Handle the zero-activation case: if a filter is all zeros (ReLU killed everything), show it as uniformly black and label it "inactive"

**Phase:** Visualization/frontend phase (Phase 3). Easy to fix but must be deliberate.

---

### Pitfall 7: Over-Engineering the CNN Architecture

**What goes wrong:** Building a deep/complex CNN (ResNet, many layers, batch norm, dropout) for MNIST. The model achieves 99.5% accuracy but has so many layers that the visualization is overwhelming and pedagogically useless. Students cannot follow the data flow.

**Prevention:**
- Use a minimal architecture: 2 conv layers (8 and 16 filters), max pooling after each, one dense layer, output. Total ~5 layers to visualize.
- 8 filters in the first layer means 8 activation maps to show -- manageable. 64 filters means 64 maps -- visual noise.
- Accuracy of 98-99% is fine for educational purposes. Do not optimize for SOTA.
- Make the architecture match what can be explained in the Jupyter notebook.

**Phase:** Model design phase (Phase 1). Architectural decision that shapes the entire visualization UI.

---

### Pitfall 8: Canvas/Image Rendering Performance for Many Activation Maps

**What goes wrong:** Rendering 64+ small activation maps as individual `<img>` or `<canvas>` elements in the browser causes layout thrashing, slow re-rendering, and choppy interaction when switching between MNIST samples.

**Prevention:**
- If using base64 images from the API, use a CSS grid with `loading="eager"` and fixed dimensions to prevent layout shift
- Limit the number of filters per layer (see Pitfall 7)
- Consider compositing multiple activation maps into a single grid image server-side (one image per layer, tiled) -- fewer DOM elements, faster rendering
- Use `useMemo` / `React.memo` to prevent re-rendering layers that haven't changed

**Phase:** Frontend phase (Phase 3). Design the visualization layout before implementing it.

---

### Pitfall 9: Pickle Unpickling Security and Compatibility

**What goes wrong:** The `mnist.pkl.gz` file uses Python pickle format. Pickle is version-sensitive (Python 2 vs 3 encoding differences) and inherently unsafe (arbitrary code execution). Loading with wrong encoding parameter produces garbled data or crashes.

**Prevention:**
- Always use `encoding='latin1'` when unpickling Nielsen's MNIST data (it was pickled with Python 2):
  ```python
  with gzip.open('mnist.pkl.gz', 'rb') as f:
      train, valid, test = pickle.load(f, encoding='latin1')
  ```
- Convert to a safer format (NPZ) early in the project and use that everywhere else:
  ```python
  np.savez('mnist.npz', x_train=train[0], y_train=train[1], ...)
  ```
- Never unpickle the raw file in the web server; only use it in the Jupyter notebook for initial data prep.

**Detection:** `UnicodeDecodeError` or garbled array shapes when loading. The VisibleDeprecationWarning about `align=0` (observed in this project's environment) is a NumPy 2.4+ quirk with this pickle but does not corrupt data.

**Phase:** Data preparation phase (Phase 1). Convert once, use the safe format thereafter.

---

### Pitfall 10: Not Explaining What the Visualization Means

**What goes wrong:** The app shows pretty activation heatmaps but provides zero context about what a "feature map" is, why early layers detect edges, or how max pooling reduces spatial dimensions. Users see colored grids with no understanding.

**Prevention:**
- Each visualization layer needs a short text annotation: "This layer has 8 filters detecting simple patterns like edges and curves"
- Show the input image alongside the activation maps at every layer so users can correlate
- Add a simple legend: "Bright = strong activation (this feature was detected), Dark = no activation"
- The Jupyter notebook should explain the architecture before the web app is used

**Phase:** UI/UX phase (Phase 3). Plan annotation text alongside the visualization layout.

---

## Minor Pitfalls

### Pitfall 11: Next.js App Router vs Pages Router Confusion

**What goes wrong:** Mixing patterns from Next.js App Router (server components, `app/` directory) and Pages Router (`pages/` directory). Since this is a client-heavy visualization app, server components add complexity with no benefit.

**Prevention:**
- Use Pages Router (`pages/` directory) for simplicity -- this is a single-page educational app, not a content site
- Or use App Router with `"use client"` on all visualization components -- but this negates the App Router advantages
- Decide once and document the choice

**Phase:** Project scaffolding (Phase 1).

---

### Pitfall 12: Python Environment Fragility

**What goes wrong:** TensorFlow has strict Python version and dependency requirements. Installing into the system Python or a shared environment leads to version conflicts. TF 2.x on macOS with Apple Silicon has specific build requirements.

**Prevention:**
- Create a dedicated virtual environment: `python3 -m venv venv`
- Pin all dependencies in `requirements.txt` with exact versions
- For Apple Silicon Macs: use `tensorflow-macos` and `tensorflow-metal` for GPU acceleration, OR use plain `tensorflow` >= 2.16 which includes Apple Silicon support natively
- Test that `import tensorflow` works before writing any model code

**Detection:** `ImportError` or `DLL load failed` errors. Slow training (CPU fallback when Metal should be available).

**Phase:** Environment setup (Phase 0/1).

---

### Pitfall 13: Hardcoded Localhost URLs in Frontend

**What goes wrong:** Frontend code has `fetch("http://localhost:8000/predict")` scattered throughout. Breaks when deploying, sharing with classmates, or changing ports.

**Prevention:**
- Use environment variables: `NEXT_PUBLIC_API_URL` in `.env.local`
- Or use Next.js rewrites to proxy API calls (avoids CORS too):
  ```js
  // next.config.js
  module.exports = {
    async rewrites() {
      return [{ source: '/api/:path*', destination: 'http://localhost:8000/:path*' }]
    }
  }
  ```

**Phase:** Project scaffolding (Phase 1).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data prep & model training | Flat vector not reshaped for Conv2D (#1) | Visualize samples post-reshape in notebook |
| Data prep & model training | Pickle encoding error (#9) | Use `encoding='latin1'`, convert to NPZ immediately |
| Data prep & model training | Over-complex CNN (#7) | Cap at 2 conv layers, 8-16 filters each |
| API development | Model loaded per-request (#4) | Use FastAPI lifespan, load once |
| API development | NumPy serialization crash (#3) | Return base64 PNG images, not raw arrays |
| API development | CORS blocking all requests (#5) | Configure CORS or use Next.js proxy on day one |
| Frontend visualization | Activation maps all black/white (#6) | Per-filter min-max normalization |
| Frontend visualization | Too many filter maps to render (#8) | Small model + server-side grid tiling |
| Frontend visualization | No educational context (#10) | Plan annotations with the visualization layout |
| Project scaffolding | Router confusion (#11) | Pick Pages Router, document it |
| Project scaffolding | Hardcoded URLs (#13) | Use env vars or rewrites from the start |
| Environment | TensorFlow install fails (#12) | Dedicated venv, verify import before coding |

## Sources

- Direct inspection of `/Users/saurabh/Downloads/mnist.pkl.gz`: confirmed flat (50000, 784) float32 arrays, [0, 1] range, requires `encoding='latin1'`
- TensorFlow/Keras documentation: functional API model extraction pattern (HIGH confidence, well-established API)
- FastAPI documentation: lifespan pattern for startup resource loading, CORSMiddleware configuration (HIGH confidence)
- Domain experience with CNN visualization apps: activation normalization, serialization strategies (MEDIUM confidence, based on established patterns)
- NumPy 2.4 deprecation warning observed in project environment (confirmed empirically)
