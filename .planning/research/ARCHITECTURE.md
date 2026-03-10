# Architecture Research

**Domain:** Educational CNN Visualization Web App
**Researched:** 2026-03-09
**Confidence:** HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js + Tailwind)               │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Image Picker │  │  Layer Flow  │  │ Confidence Bar Chart  │  │
│  │  Component   │  │  Visualizer  │  │     Component         │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘  │
│         │                 │                       │              │
│         └─────────┬───────┴───────────────────────┘              │
│                   │                                              │
│         ┌─────────┴─────────┐                                    │
│         │   API Client      │                                    │
│         │   (fetch wrapper)  │                                    │
│         └─────────┬─────────┘                                    │
├───────────────────┼─────────────────────────────────────────────┤
│                   │  HTTP REST (JSON + base64 images)            │
├───────────────────┼─────────────────────────────────────────────┤
│                   │          BACKEND (FastAPI)                    │
│         ┌─────────┴─────────┐                                    │
│         │   API Router      │                                    │
│         └─────────┬─────────┘                                    │
│                   │                                              │
│  ┌────────────────┼────────────────────┐                         │
│  │                │                    │                         │
│  ▼                ▼                    ▼                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  MNIST   │  │  Inference   │  │  Activation  │               │
│  │  Data    │  │  Service     │  │  Extractor   │               │
│  │  Loader  │  │  (predict)   │  │  (layer maps)│               │
│  └──────────┘  └──────┬───────┘  └──────┬───────┘               │
│                       │                 │                        │
│                ┌──────┴─────────────────┴──────┐                 │
│                │   TensorFlow/Keras Model      │                 │
│                │   (loaded .h5 / SavedModel)   │                 │
│                └───────────────────────────────┘                 │
├─────────────────────────────────────────────────────────────────┤
│                     DATA LAYER                                   │
│  ┌─────────────────┐  ┌────────────────────────┐                 │
│  │ mnist.pkl.gz    │  │  Trained model file    │                 │
│  │ (dataset)       │  │  (model/mnist_cnn.h5)  │                 │
│  └─────────────────┘  └────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘

OFFLINE (Jupyter Notebook)
┌─────────────────────────────────────────────────────────────────┐
│  Training Pipeline: Load data -> Preprocess -> Build CNN ->     │
│  Train -> Evaluate -> Save model to model/mnist_cnn.h5          │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Image Picker | Select random MNIST image, display original 28x28 digit | React component with button, displays grayscale image |
| Layer Flow Visualizer | Animate activations flowing through each CNN layer | React component rendering feature map grids per layer |
| Confidence Bar Chart | Show prediction probabilities for digits 0-9 | Horizontal bar chart, highlight predicted digit |
| API Client | Single point of contact between frontend and backend | Thin fetch wrapper module, handles JSON/base64 |
| API Router | Expose REST endpoints, CORS config | FastAPI app with 2-3 routes |
| MNIST Data Loader | Load dataset, serve random images on demand | Python module reading mnist.pkl.gz at startup |
| Inference Service | Run forward pass, return final prediction | Calls model.predict(), returns softmax output |
| Activation Extractor | Extract intermediate layer outputs (feature maps) | Keras Model with multiple outputs (one per layer) |
| Trained Model | The CNN weights file | .h5 file saved from Jupyter notebook training |

## Recommended Project Structure

```
mnist/
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── layout.js        # Root layout (Montserrat font, global styles)
│   │   │   ├── page.js          # Main page — composes all visualization components
│   │   │   └── globals.css      # Tailwind directives + custom styles
│   │   ├── components/          # React components
│   │   │   ├── ImagePicker.js   # Random image selector + display
│   │   │   ├── LayerVisualizer.js   # Animated layer-by-layer activation view
│   │   │   ├── FeatureMapGrid.js    # Grid of activation maps for one layer
│   │   │   ├── ConfidenceChart.js   # Bar chart for 10-digit probabilities
│   │   │   └── NetworkDiagram.js    # Overall CNN architecture diagram
│   │   └── lib/
│   │       └── api.js           # Backend API client (fetch wrapper)
│   ├── public/                  # Static assets
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── package.json
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, startup event (load model)
│   │   ├── routes/
│   │   │   └── predict.py       # /predict and /random-image endpoints
│   │   ├── services/
│   │   │   ├── model_service.py # Load model, build activation extractor, predict
│   │   │   └── data_service.py  # Load MNIST dataset, serve random samples
│   │   └── config.py            # Paths, model config
│   ├── requirements.txt
│   └── start.sh                 # uvicorn launch script
├── model/                       # Trained model artifacts
│   └── mnist_cnn.h5             # Saved Keras model (output of notebook)
├── notebooks/
│   └── training.ipynb           # Full training pipeline notebook
└── README.md
```

### Structure Rationale

- **frontend/ and backend/ as siblings:** Clear separation. Each has its own dependency management (package.json vs requirements.txt). No monorepo tooling needed for a project this size.
- **backend/app/services/:** Separates business logic (model inference, data loading) from HTTP routing. Makes testing easier and keeps routes thin.
- **model/ at project root:** Shared artifact. The notebook writes here, the backend reads from here. Single source of truth for the trained model.
- **Components split by visualization concern:** Each component owns one piece of the visualization (image display, layer maps, confidence chart). Composed together on the main page.

## Architectural Patterns

### Pattern 1: Model Loading at Startup

**What:** Load the TensorFlow model and MNIST dataset once when the FastAPI server starts, keep them in memory for the lifetime of the process.
**When to use:** Always for this app. Model loading is expensive (1-3 seconds), inference is cheap (~10ms).
**Trade-offs:** Uses more memory at idle, but eliminates per-request latency. For an educational app with a single user, this is the right call.

**Example:**
```python
# backend/app/services/model_service.py
import tensorflow as tf
from tensorflow import keras

_model = None
_activation_model = None

def load_model(model_path):
    global _model, _activation_model
    _model = keras.models.load_model(model_path)

    # Build a second model that outputs every layer's activation
    layer_outputs = [layer.output for layer in _model.layers if not isinstance(layer, keras.layers.InputLayer)]
    _activation_model = keras.Model(inputs=_model.input, outputs=layer_outputs)

def predict_with_activations(image):
    """Returns (predictions, layer_activations) in one forward pass."""
    import numpy as np
    img = image.reshape(1, 28, 28, 1).astype("float32") / 255.0
    activations = _activation_model.predict(img)
    predictions = activations[-1]  # Last layer is softmax output
    return predictions[0], activations
```

### Pattern 2: Multi-Output Keras Model for Activation Extraction

**What:** Instead of running inference multiple times (once per layer), build a single Keras Model with multiple outputs -- one per layer. A single forward pass returns all intermediate activations.
**When to use:** Any time you need intermediate layer outputs for visualization.
**Trade-offs:** Slightly more memory for the multi-output model graph, but inference is done once instead of N times. Essential for this app.

### Pattern 3: Base64 Image Encoding in API Responses

**What:** Encode activation feature maps as base64 PNG strings in the JSON response. The frontend renders them directly as `<img src="data:image/png;base64,...">`.
**When to use:** When sending small images (activation maps are tiny -- 26x26 down to 5x5) over a REST API.
**Trade-offs:** Base64 adds ~33% overhead, but these images are so small (a few KB each) that it is irrelevant. The alternative (separate image endpoints per layer per filter) would mean dozens of HTTP requests per prediction. Base64 in JSON is simpler and faster.

**Alternative considered:** Return raw float arrays and render on canvas in the frontend. This gives more control over colormap/animation but adds complexity. For v1, server-side rendering to PNG is simpler. Can switch to raw arrays later if animation needs demand it.

### Pattern 4: Sequential Animation via Frontend State

**What:** The backend returns all activations at once. The frontend controls the animation timing -- revealing layers one by one with delays to simulate data "flowing" through the network.
**When to use:** When the visualization is the core feature. Animation logic belongs in the frontend, not the backend.
**Trade-offs:** All data arrives at once (no streaming needed), frontend uses setTimeout/requestAnimationFrame to reveal layers progressively. Simple and effective.

**Example:**
```javascript
// frontend/src/components/LayerVisualizer.js
const [visibleLayers, setVisibleLayers] = useState(0);

useEffect(() => {
  if (!activations) return;
  setVisibleLayers(0);
  const timer = setInterval(() => {
    setVisibleLayers(prev => {
      if (prev >= activations.length) {
        clearInterval(timer);
        return prev;
      }
      return prev + 1;
    });
  }, 400); // 400ms between layers
  return () => clearInterval(timer);
}, [activations]);
```

## Data Flow

### Primary Flow: Predict a Random Image

```
User clicks "Random Image"
    │
    ▼
Frontend: GET /api/random-image
    │
    ▼
Backend: data_service picks random MNIST sample
    │  Returns: { image: base64_png, label: int, index: int, pixel_data: float[784] }
    │
    ▼
Frontend: Displays the 28x28 image
User clicks "Classify" (or auto-triggers)
    │
    ▼
Frontend: POST /api/predict  { pixel_data: float[784] }
    │
    ▼
Backend: model_service.predict_with_activations(pixel_data)
    │  - Reshapes to (1, 28, 28, 1)
    │  - Single forward pass through activation_model
    │  - For each conv/pool layer: normalize activations, render to base64 PNGs
    │  - Extract softmax probabilities
    │
    ▼
Backend returns:
    {
      prediction: 7,
      confidence: [0.01, 0.02, ...0.93, ...],  // 10 probabilities
      layers: [
        {
          name: "conv2d_1",
          type: "Conv2D",
          shape: [26, 26, 32],
          feature_maps: ["base64...", "base64...", ...]  // 32 maps
        },
        {
          name: "max_pooling2d_1",
          type: "MaxPooling2D",
          shape: [13, 13, 32],
          feature_maps: ["base64...", ...]
        },
        ...
      ]
    }
    │
    ▼
Frontend: Animates layers appearing one by one
    │  - Each layer shows a grid of feature map thumbnails
    │  - After all layers revealed, confidence chart animates in
    │  - Predicted digit displayed prominently
```

### API Contract (2 endpoints)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/api/random-image` | GET | (none) | `{ image, label, index, pixel_data }` |
| `/api/predict` | POST | `{ pixel_data: float[784] }` | `{ prediction, confidence, layers }` |

Two endpoints keeps concerns clean. Could combine into one "pick random and predict" endpoint, but separating them allows future features (like a drawing canvas) to reuse `/api/predict` without change.

### State Management

No state management library needed. This app has simple, linear data flow:

```
API response → useState hooks → Component props
```

The main page holds:
- `currentImage` — the selected MNIST image
- `predictionResult` — full response from /api/predict (null until classified)
- `isLoading` — loading state
- `animationStep` — which layer is currently visible

These are passed down as props to child components. No Redux, no Zustand, no context providers. React useState is sufficient.

## Build Order (Dependencies)

Build order matters because components have hard dependencies:

```
Phase 1: Jupyter Notebook (training)
    │  Output: model/mnist_cnn.h5
    │  No dependency on frontend or backend
    │
Phase 2: Backend core
    │  Depends on: trained model from Phase 1
    │  Build: data_service (load MNIST) → model_service (load model, extract activations)
    │  Build: FastAPI routes, CORS
    │  Testable independently via curl/httpie
    │
Phase 3: Frontend core
    │  Depends on: running backend from Phase 2
    │  Build: API client → ImagePicker → ConfidenceChart → LayerVisualizer
    │  LayerVisualizer is the hardest component — build last
    │
Phase 4: Animation + Polish
    │  Depends on: working end-to-end flow from Phases 2+3
    │  Add: layer-by-layer reveal animation, transitions, visual polish
```

**Why this order:**
- The notebook must come first because the backend needs the .h5 model file to function.
- The backend must come before the frontend because the frontend is just a visualization of backend data. You cannot build the visualization without knowing the exact shape of the activation data.
- Animation is last because it is polish on top of a working visualization. Get the data flowing correctly first, then make it beautiful.

## Anti-Patterns

### Anti-Pattern 1: Running Inference per Layer

**What people do:** Call `model.predict()` separately for each layer to get that layer's output.
**Why it is wrong:** N forward passes instead of 1. Wastes compute, introduces latency.
**Do this instead:** Build a multi-output Keras Model (see Pattern 2) that returns all layer outputs in a single forward pass.

### Anti-Pattern 2: Sending Raw NumPy Arrays as JSON

**What people do:** Convert numpy arrays to nested Python lists and send as JSON: `[[0.5, 0.3, ...], ...]` for each feature map.
**Why it is wrong:** Feature maps as float arrays are verbose in JSON (a 26x26x32 conv layer output is ~21K floats). Parsing this in JavaScript is slow, and you still need to render it to pixels.
**Do this instead:** Render feature maps to small PNGs server-side, send as base64 strings. The frontend just displays `<img>` tags. Massively reduces payload size and frontend complexity.

### Anti-Pattern 3: Loading Model on Every Request

**What people do:** Call `keras.models.load_model()` inside the request handler.
**Why it is wrong:** Model loading takes 1-3 seconds. Every request becomes unbearably slow.
**Do this instead:** Load at startup using FastAPI's lifespan event or `@app.on_event("startup")`.

### Anti-Pattern 4: Complex State Management for Simple Data

**What people do:** Reach for Redux/Zustand/Context for an app with 2 API calls and 3 state variables.
**Why it is wrong:** Adds boilerplate, indirection, and cognitive load for zero benefit. This app has unidirectional, non-shared state.
**Do this instead:** Use React `useState` in the main page component and pass props down.

### Anti-Pattern 5: Trying to Stream Activations Layer-by-Layer

**What people do:** Use WebSockets or Server-Sent Events to send activations one layer at a time, trying to create a "real-time computation" effect.
**Why it is wrong:** Inference for MNIST takes ~10ms total. The "layers appearing one by one" effect is purely an animation concern, not a data delivery concern. Streaming adds complexity for zero perceptual benefit.
**Do this instead:** Return all activations in one response. Animate on the frontend with timers.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user (educational) | Current architecture. Single FastAPI process, dev server. No changes needed. |
| Classroom (30 users) | Add `--workers 2` to uvicorn. Still single machine. |
| Public demo (1000+ users) | Pre-compute activations for all 10K test images, cache results. Serve from static JSON. Eliminate real-time inference entirely. |

### Scaling Priorities

1. **First bottleneck:** TensorFlow inference is single-threaded by default. For multiple concurrent users, use `tf.config.threading.set_intra_op_parallelism_threads()` or pre-compute results.
2. **This is an educational app.** Do not over-engineer. The architecture above handles the actual use case (one student at a time) perfectly.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend to Backend | HTTP REST (JSON) | CORS must be configured. Frontend runs on :3000, backend on :8000. |
| Backend to Model | In-process Python call | Model is loaded into memory. No network hop. |
| Notebook to Backend | Shared file (model/mnist_cnn.h5) | Notebook writes model, backend reads it. No runtime coupling. |
| Backend to MNIST data | File read at startup | mnist.pkl.gz loaded once into memory as numpy arrays. |

### CORS Configuration

The frontend (Next.js dev server on port 3000) and backend (FastAPI on port 8000) are on different origins. FastAPI must explicitly allow the frontend origin:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Sources

- TensorFlow/Keras documentation: multi-output models via `keras.Model(inputs, outputs)` — HIGH confidence (core Keras API, stable for years)
- FastAPI documentation: startup events, CORS middleware — HIGH confidence (well-documented, standard patterns)
- Next.js App Router: file-based routing, `src/app/` structure — HIGH confidence (current Next.js convention)
- MNIST dataset standard: 28x28 grayscale, 10 classes, 70K images — HIGH confidence (unchanged since 1998)

---
*Architecture research for: MNIST CNN Visualizer*
*Researched: 2026-03-09*
