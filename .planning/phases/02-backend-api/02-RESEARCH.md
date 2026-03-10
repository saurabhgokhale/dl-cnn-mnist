# Phase 2: Backend API - Research

**Researched:** 2026-03-09
**Domain:** FastAPI server with TensorFlow/Keras inference and activation extraction
**Confidence:** HIGH

## Summary

This phase builds a FastAPI server that loads the Phase 1 CNN model (`model/mnist_cnn.h5`), serves random MNIST test images, runs inference, and returns predictions with confidence scores and base64-encoded activation maps. All required packages are already installed in the conda `ml` environment (Python 3.9.7, TF 2.19.0, FastAPI 0.116.2, uvicorn 0.35.0, Pillow 10.4.0, matplotlib 3.9.2, numpy 1.26.4, pydantic 2.11.9, python-multipart 0.0.20).

The critical constraint is that the proxy blocks all PyPI access, so no packages can be installed. Phase 1 established a pattern of symlinking the conda `ml` environment as `.venv`. The backend must reuse this same approach. The activation extraction pattern (Functional API rebuild: `keras.Input` -> sequential layer chain -> `keras.Model`) was verified in Phase 1 and confirmed working in this research with the actual saved model.

**Primary recommendation:** Build a single `backend/main.py` using FastAPI lifespan pattern to load model and MNIST test data once at startup. Use PIL (not matplotlib) for activation map rendering -- it produces 10x smaller base64 output and is faster. The server should be fully testable via curl before any frontend work begins.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single API call returns everything: predicted digit, all 10 confidence scores, and all layer activations
- Activation maps sent as base64 PNG images -- frontend renders them as `<img>` tags, no client-side array processing
- Confidence scores as ordered array [0-9] -- array of 10 objects with digit label and probability, sorted by digit number
- Backend serves MNIST images -- has a `/random-image` endpoint that picks a random test sample and returns it along with inference results

### Claude's Discretion
- Exact endpoint paths and naming (e.g., `/api/predict`, `/api/random`)
- Error response format and HTTP status codes
- How many MNIST test images to keep in memory
- Image encoding details (PNG size, colormap for activation maps)
- CORS configuration specifics
- Model loading strategy (lifespan pattern vs on_event)
- Whether to combine random-image + predict into one endpoint or keep separate

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INF-01 | FastAPI endpoint accepts an MNIST image and returns the predicted digit | Endpoint design section; model predict pattern verified |
| INF-02 | Backend returns intermediate layer activations (feature maps) for all conv layers | Activation extraction pattern verified with actual model; base64 PNG encoding tested |
| INF-03 | Backend returns softmax confidence scores for all 10 digits (0-9) | Output layer produces (1, 10) softmax array; response format documented |
| INF-04 | CNN model loaded once at server startup (not per-request) | FastAPI lifespan pattern verified with FastAPI 0.116.2 |
| BE-01 | Python 3.12 virtual environment (not system Python 3.14) | **OVERRIDE:** Must use conda ml env (Python 3.9.7) -- proxy blocks PyPI, cannot install TF in fresh 3.12 venv. Phase 1 established this pattern. |
| BE-02 | FastAPI with CORS configured for Next.js frontend | CORSMiddleware verified available; configuration pattern documented |
| BE-03 | Multi-output Keras model for single-pass activation extraction | Functional API rebuild pattern verified -- produces all 10 layer outputs in one `predict()` call |

</phase_requirements>

## Standard Stack

### Core (All Pre-Installed in conda ml env)

| Library | Version | Purpose | Verified |
|---------|---------|---------|----------|
| Python | 3.9.7 | Runtime | `/opt/homebrew/Caskroom/miniconda/base/envs/ml/bin/python` |
| TensorFlow | 2.19.0 | Model loading and inference | `import tensorflow` confirmed |
| Keras | 3.9.2 | Model API (bundled with TF 2.19) | `import keras` confirmed |
| FastAPI | 0.116.2 | HTTP API framework | `import fastapi` confirmed |
| uvicorn | 0.35.0 | ASGI server | `import uvicorn` confirmed |
| Starlette | 0.48.0 | FastAPI's underlying framework | Provides CORSMiddleware |
| Pydantic | 2.11.9 | Request/response models | `import pydantic` confirmed |
| NumPy | 1.26.4 | Array manipulation | Core TF dependency |
| Pillow | 10.4.0 | Activation map to PNG conversion | `import PIL` confirmed |
| matplotlib | 3.9.2 | Colormap application for activation maps | Optional, PIL is faster |
| python-multipart | 0.0.20 | File upload parsing | Required for UploadFile endpoints |

### Installation

**No installation needed.** All packages exist in the conda `ml` environment. The `.venv` symlink created in Phase 1 already points to this env:

```bash
# .venv -> /opt/homebrew/Caskroom/miniconda/base/envs/ml
# Already created in Phase 1
ls -la .venv  # verify symlink exists
.venv/bin/python -c "import fastapi, tensorflow, keras; print('All imports OK')"
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PIL for activation PNGs | matplotlib with colormap | matplotlib produces 10x larger base64 strings (14KB vs 1.4KB per map). Use PIL for speed; apply colormap via matplotlib's `cm.viridis` on the array, then save via PIL. |
| Lifespan pattern | `@app.on_event("startup")` | on_event is deprecated in FastAPI. Lifespan is the current standard. |
| Pydantic response models | Plain dicts | Pydantic provides auto-documentation in /docs and type validation. Worth it for educational API. |

## Architecture Patterns

### Recommended Project Structure

```
backend/
    main.py              # FastAPI app, endpoints, lifespan
    inference.py         # Model loading, activation extraction, prediction
model/
    mnist_cnn.h5         # Trained model from Phase 1 (462.5 KB)
```

Keep it minimal -- two files max for the backend. `main.py` handles HTTP concerns, `inference.py` handles ML concerns.

### Pattern 1: FastAPI Lifespan for Model Loading (INF-04)

**What:** Load the CNN model and MNIST test data once at server startup using the async context manager lifespan pattern.
**Why:** Model loading takes 1-2 seconds. Must not happen per-request. The lifespan pattern is the current FastAPI standard (on_event is deprecated).
**Verified:** FastAPI 0.116.2 supports `lifespan` parameter on `FastAPI()` constructor.

```python
# Source: Verified with FastAPI 0.116.2 in conda ml env
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load model and data
    app.state.model = load_model()
    app.state.activation_model = build_activation_model(app.state.model)
    app.state.test_images, app.state.test_labels = load_test_data()
    yield
    # Shutdown: cleanup (optional)

app = FastAPI(lifespan=lifespan)
```

### Pattern 2: Functional API Rebuild for Activation Extraction (BE-03)

**What:** Keras 3 Sequential models loaded from .h5 do not expose `.input` directly. Must rebuild using Functional API.
**Verified:** Tested with actual `model/mnist_cnn.h5` file. Produces 10 layer outputs.

```python
# Source: Verified against actual model/mnist_cnn.h5
import keras
import numpy as np

def build_activation_model(model):
    """Build multi-output model for single-pass activation extraction."""
    inp = keras.Input(shape=(28, 28, 1))
    x = inp
    outputs = {}
    for layer in model.layers:
        x = layer(x)
        outputs[layer.name] = x

    activation_model = keras.Model(
        inputs=inp,
        outputs=list(outputs.values())
    )
    return activation_model

# Usage: all activations in one predict() call
# results = activation_model.predict(image_batch, verbose=0)
```

**Actual layer output shapes (verified):**

| Layer Name | Shape | Notes |
|------------|-------|-------|
| conv2d_1 | (1, 26, 26, 8) | 8 feature maps, 26x26 each |
| maxpool_1 | (1, 13, 13, 8) | Downsampled |
| conv2d_2 | (1, 11, 11, 8) | 8 feature maps, 11x11 each |
| maxpool_2 | (1, 5, 5, 8) | Downsampled |
| flatten | (1, 200) | 1D vector |
| dense_1 | (1, 128) | Hidden layer |
| dropout_1 | (1, 128) | Same shape (no-op at inference) |
| dense_2 | (1, 64) | Hidden layer |
| dropout_2 | (1, 64) | Same shape (no-op at inference) |
| output | (1, 10) | Softmax probabilities |

### Pattern 3: Base64 PNG Encoding for Activation Maps (INF-02)

**What:** Convert each activation filter map to a base64-encoded PNG string.
**Verified:** PIL method produces ~1.4KB per 26x26 map. Matplotlib method produces ~14KB. Use PIL.

```python
# Source: Tested in conda ml env
import io
import base64
from PIL import Image
import numpy as np

def activation_to_base64(activation_map: np.ndarray, size: int = 64) -> str:
    """Convert a single 2D activation map to base64 PNG.

    Args:
        activation_map: 2D numpy array (H, W)
        size: Output image size in pixels (square)

    Returns:
        Base64-encoded PNG string
    """
    # Normalize to 0-255
    a = activation_map
    a_min, a_max = a.min(), a.max()
    if a_max - a_min > 1e-8:
        normalized = ((a - a_min) / (a_max - a_min) * 255).astype(np.uint8)
    else:
        normalized = np.zeros_like(a, dtype=np.uint8)  # Dead filter

    img = Image.fromarray(normalized, mode='L')
    img = img.resize((size, size), Image.NEAREST)

    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')
```

**For colormap activation maps** (optional, prettier):

```python
import matplotlib.cm as cm

def activation_to_base64_color(activation_map: np.ndarray, size: int = 64) -> str:
    """Convert activation map to colored base64 PNG using viridis colormap."""
    a = activation_map
    a_min, a_max = a.min(), a.max()
    if a_max - a_min > 1e-8:
        normalized = (a - a_min) / (a_max - a_min)
    else:
        normalized = np.zeros_like(a)

    # Apply colormap -> RGBA -> RGB
    colored = (cm.viridis(normalized)[:, :, :3] * 255).astype(np.uint8)

    img = Image.fromarray(colored, mode='RGB')
    img = img.resize((size, size), Image.NEAREST)

    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')
```

### Pattern 4: MNIST Test Data Loading (Backend serves images)

**What:** Load MNIST test set into memory at startup. Backend picks random samples to serve.
**Verified:** Test set is tuple index 2 of the pickle: 10,000 images as flat (784,) float32 in [0,1].

```python
import gzip
import pickle
import numpy as np

def load_test_data(path='/Users/saurabh/Downloads/mnist.pkl.gz'):
    """Load MNIST test set for serving random images."""
    with gzip.open(path, 'rb') as f:
        data = pickle.load(f, encoding='latin1')

    # Nielsen format: 3-tuple (train, val, test)
    _, _, (x_test, y_test) = data

    # x_test: (10000, 784) float32 [0, 1]
    # y_test: (10000,) int64 [0, 9]

    # Reshape for Conv2D input
    x_test = x_test.reshape(-1, 28, 28, 1).astype(np.float32)

    return x_test, y_test
```

**Memory:** 10,000 images x 28 x 28 x 4 bytes = ~30 MB. Easily fits in memory.

### Pattern 5: Response Format

**What:** The locked decision requires a single response with everything.

```python
# Recommended response schema
{
    "image": "data:image/png;base64,...",     # The input MNIST image
    "true_label": 7,                          # Ground truth label
    "prediction": 7,                          # Predicted digit
    "confidence": [                           # All 10 scores, sorted by digit
        {"digit": 0, "probability": 0.001},
        {"digit": 1, "probability": 0.002},
        ...
        {"digit": 7, "probability": 0.987},
        ...
        {"digit": 9, "probability": 0.001}
    ],
    "activations": [                          # All conv layer activations
        {
            "layer_name": "conv2d_1",
            "shape": [26, 26, 8],
            "maps": [                         # One base64 PNG per filter
                "iVBORw0KGgo...",
                "iVBORw0KGgo...",
                ...  // 8 maps
            ]
        },
        {
            "layer_name": "conv2d_2",
            "shape": [11, 11, 8],
            "maps": ["...", ...]              // 8 maps
        }
    ]
}
```

**Payload estimate:** ~1.4KB per activation map x 16 maps (8 per conv layer x 2 layers) = ~22KB for activations + ~2KB for the input image + metadata = ~25KB total. Very manageable.

### Anti-Patterns to Avoid

- **Loading model per request:** `load_model()` takes 1-2 seconds. Always load in lifespan.
- **Using `model.input` on loaded Sequential model:** Fails in Keras 3. Must use Functional API rebuild pattern.
- **Sending raw numpy arrays as JSON:** `ndarray` is not JSON serializable. Always convert to base64 PNG or `.tolist()`.
- **Using `@app.on_event("startup")`:** Deprecated in modern FastAPI. Use lifespan pattern.
- **Double normalization of MNIST data:** Nielsen data is already [0,1]. Do NOT divide by 255.
- **Unpickling in the endpoint handler:** Load test data once at startup, not per request.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP API framework | Custom socket server | FastAPI | Auto-docs, validation, CORS middleware, async support |
| CORS handling | Manual OPTIONS handlers | `CORSMiddleware` | Handles preflight, headers, origins correctly |
| Image conversion | Manual pixel byte manipulation | Pillow `Image.fromarray()` | PNG encoding is complex; Pillow handles it correctly |
| JSON serialization of responses | Manual json.dumps | Pydantic models + FastAPI | Auto-validates, auto-documents, handles numpy conversion |
| Activation extraction | Per-layer forward pass | Multi-output `keras.Model` | Single predict() call extracts all layers at once |

## Common Pitfalls

### Pitfall 1: Keras 3 Sequential Model Has No `.input` Property
**What goes wrong:** Code like `keras.Model(inputs=model.input, outputs=[l.output for l in model.layers])` raises `AttributeError` on a Sequential model loaded from .h5 in Keras 3, if the model has not been called.
**Why it happens:** Keras 3 changed how Sequential models expose graph properties. The `.input` attribute is not available until the model is built/called.
**How to avoid:** Use the Functional API rebuild pattern: create a `keras.Input()`, pass it through each layer sequentially, collect outputs. This was verified with the actual model.
**Warning signs:** `AttributeError: 'Sequential' object has no attribute 'input'` or `'Conv2D' object has no attribute 'output_shape'`.

### Pitfall 2: Compiled Metrics Warning on Model Load
**What goes wrong:** Loading the .h5 model produces: `WARNING:absl:Compiled the loaded model, but the compiled metrics have yet to be built.`
**Why it happens:** The model was saved with compile=True but hasn't been evaluated yet.
**How to avoid:** Ignore the warning -- it does not affect inference. Alternatively, load with `compile=False`: `keras.models.load_model('model/mnist_cnn.h5', compile=False)`.
**Warning signs:** Noisy startup logs. Not a real problem.

### Pitfall 3: CORS Blocks Frontend Requests
**What goes wrong:** Next.js on :3000 cannot call FastAPI on :8000. Browser shows `Access-Control-Allow-Origin` errors.
**Why it happens:** CORS is not configured, or `allow_headers` does not include `Content-Type`.
**How to avoid:** Configure CORSMiddleware at app creation time:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```
**Warning signs:** Frontend shows no data; browser console has CORS errors.

### Pitfall 4: Activation Maps All Black or All White
**What goes wrong:** Activation values have arbitrary ranges. Without per-filter normalization, images are visually uninformative.
**Why it happens:** ReLU outputs are non-negative but can be very large. A single outlier pixel makes everything else appear black.
**How to avoid:** Normalize each filter map independently to [0, 255] using min-max normalization. Handle the all-zeros case (dead filter) explicitly.
**Warning signs:** All activation map images look identical (all black or all white).

### Pitfall 5: Proxy Blocks pip install
**What goes wrong:** Attempting to `pip install` anything fails because the corporate proxy blocks PyPI.
**Why it happens:** Network environment restriction.
**How to avoid:** Do NOT create a fresh venv. Use the existing conda ml environment via the `.venv` symlink. All required packages are already installed.
**Warning signs:** `pip install` hangs or returns connection errors.

## Code Examples

### Complete Lifespan Setup

```python
# Source: Verified patterns against actual env and model
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import keras
import numpy as np
import gzip
import pickle

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model
    model = keras.models.load_model('model/mnist_cnn.h5', compile=False)

    # Build multi-output activation model (Functional API rebuild)
    inp = keras.Input(shape=(28, 28, 1))
    x = inp
    layer_outputs = {}
    for layer in model.layers:
        x = layer(x)
        layer_outputs[layer.name] = x

    app.state.activation_model = keras.Model(
        inputs=inp, outputs=list(layer_outputs.values())
    )
    app.state.layer_names = list(layer_outputs.keys())

    # Load MNIST test data
    with gzip.open('/Users/saurabh/Downloads/mnist.pkl.gz', 'rb') as f:
        data = pickle.load(f, encoding='latin1')
    _, _, (x_test, y_test) = data
    app.state.test_images = x_test.reshape(-1, 28, 28, 1).astype(np.float32)
    app.state.test_labels = y_test.astype(int)

    yield

app = FastAPI(title="MNIST CNN Visualizer API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Random Image + Inference Endpoint

```python
import random
from fastapi import Request
from fastapi.responses import JSONResponse

@app.get("/api/random-predict")
async def random_predict(request: Request):
    """Pick a random MNIST test image, run inference, return everything."""
    idx = random.randint(0, len(request.app.state.test_images) - 1)
    image = request.app.state.test_images[idx:idx+1]  # Keep batch dim
    label = int(request.app.state.test_labels[idx])

    # Single-pass inference: get all layer activations
    results = request.app.state.activation_model.predict(image, verbose=0)
    layer_names = request.app.state.layer_names

    # Extract prediction from final output layer
    softmax = results[-1][0]  # (10,) array
    predicted_digit = int(np.argmax(softmax))

    # Build confidence array
    confidence = [
        {"digit": i, "probability": round(float(softmax[i]), 6)}
        for i in range(10)
    ]

    # Build activation maps (conv layers only)
    activations = []
    conv_layer_indices = [
        i for i, name in enumerate(layer_names) if 'conv' in name
    ]
    for layer_idx in conv_layer_indices:
        layer_activation = results[layer_idx][0]  # (H, W, filters)
        maps = []
        for f in range(layer_activation.shape[-1]):
            b64 = activation_to_base64(layer_activation[:, :, f])
            maps.append(b64)
        activations.append({
            "layer_name": layer_names[layer_idx],
            "shape": list(layer_activation.shape),
            "maps": maps
        })

    # Encode input image as base64 PNG
    input_b64 = activation_to_base64(image[0, :, :, 0], size=112)

    return {
        "image": input_b64,
        "true_label": label,
        "prediction": predicted_digit,
        "confidence": confidence,
        "activations": activations
    }
```

### Running the Server

```bash
# From project root
.venv/bin/python -m uvicorn backend.main:app --reload --port 8000
```

### Curl Verification

```bash
# Health check
curl http://localhost:8000/docs

# Random prediction (the core endpoint)
curl -s http://localhost:8000/api/random-predict | python3 -m json.tool | head -20

# Verify response structure
curl -s http://localhost:8000/api/random-predict | python3 -c "
import sys, json
r = json.load(sys.stdin)
print(f'Prediction: {r[\"prediction\"]}')
print(f'True label: {r[\"true_label\"]}')
print(f'Confidence scores: {len(r[\"confidence\"])}')
print(f'Activation layers: {len(r[\"activations\"])}')
for a in r['activations']:
    print(f'  {a[\"layer_name\"]}: {len(a[\"maps\"])} maps')
"
```

## Discretion Recommendations

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| **Endpoint paths** | `/api/random-predict` (combined), `/api/health` | One endpoint is simpler to test. The locked decision says `/random-image` returns inference results too, so combining makes sense. Add `/api/health` for quick liveness check. |
| **Separate vs combined endpoint** | Combined: one GET endpoint that picks random image AND runs inference | User said "random-image endpoint picks a random test sample and returns it along with inference results." This is one endpoint, not two. |
| **Error format** | Standard FastAPI HTTPException with `{"detail": "message"}` | Consistent with FastAPI conventions; auto-documented in /docs. |
| **Test images in memory** | All 10,000 test images (~30MB) | Trivial memory. No reason to subsample. |
| **Activation PNG size** | 64x64 pixels | Good balance of detail and payload size. 26x26 is too small to see; 128x128 is unnecessary for 8 feature maps. |
| **Colormap** | Grayscale (PIL 'L' mode) for simplicity; viridis optional | Grayscale is 10x smaller payload. Frontend can apply CSS coloring if desired. Start simple. |
| **Model loading** | Lifespan pattern | Current FastAPI standard. `on_event` is deprecated. |
| **CORS origins** | `["http://localhost:3000"]` | Specific to Next.js dev server. Can add production origin later. |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@app.on_event("startup")` | `lifespan` async context manager | FastAPI ~0.100+ | Must use lifespan for new code |
| `model.input` / `layer.output` on Sequential | Functional API rebuild pattern | Keras 3 (TF 2.16+) | Sequential models need explicit input wiring |
| `K.function()` for activations | Multi-output `keras.Model` | TF 2.0+ | K.function broken in eager mode |
| Separate tensorflow-macos + metal packages | Plain tensorflow >= 2.16 | TF 2.16 (2024) | Single install works on Apple Silicon |

## Open Questions

1. **Dropout behavior at inference time**
   - What we know: Dropout layers are automatically disabled during `model.predict()`. The activation maps for dropout layers will be identical to the preceding dense layer.
   - Recommendation: Include dropout layer activations in the model output (they exist in the layer chain) but do NOT send them to the frontend as separate activation maps. Only send conv layer maps.

2. **Should the input image base64 include a data URI prefix?**
   - What we know: Frontend `<img>` tags need `src="data:image/png;base64,..."` format.
   - Recommendation: Return raw base64 from the API. Let the frontend add the `data:image/png;base64,` prefix. This keeps the API clean.

3. **Concurrent request handling with TensorFlow**
   - What we know: TensorFlow predict is CPU-bound and not truly async. With `--workers 1` (uvicorn default), requests are handled sequentially.
   - Recommendation: Single worker is fine for this educational tool. Do not add async complexity.

## Sources

### Primary (HIGH confidence)
- **Conda ml environment inspection** -- all package versions verified via direct import: FastAPI 0.116.2, TF 2.19.0, Keras 3.9.2, uvicorn 0.35.0, Pillow 10.4.0, numpy 1.26.4, pydantic 2.11.9
- **Actual model file** (`model/mnist_cnn.h5`) -- loaded and tested: 10 layers, activation extraction pattern produces correct shapes
- **MNIST test data** (`mnist.pkl.gz`) -- verified 3-tuple format, test set at index 2: (10000, 784) float32 [0, 1]
- **Phase 1 summary** -- established conda env pattern, layer names, Functional API rebuild for Keras 3
- **FastAPI lifespan** -- verified `asynccontextmanager` + `FastAPI(lifespan=)` works with installed version
- **Base64 encoding test** -- PIL produces ~1.4KB per 26x26 map, matplotlib ~14KB

### Secondary (MEDIUM confidence)
- Project-level PITFALLS.md -- CORS, serialization, model loading patterns
- Project-level STACK.md -- version compatibility notes

### Tertiary (LOW confidence)
- None -- all critical claims verified against local environment

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages verified installed and importable in conda ml env
- Architecture: HIGH -- activation extraction pattern verified against actual model file
- Pitfalls: HIGH -- Keras 3 sequential limitation and PIL vs matplotlib sizing verified empirically
- Response format: MEDIUM -- schema design is reasonable but may need adjustment during frontend integration

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable domain, all packages pinned in conda env)
