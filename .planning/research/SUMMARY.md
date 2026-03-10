# Project Research Summary

**Project:** MNIST CNN Visualizer
**Domain:** Educational CNN Visualization Web Application
**Researched:** 2026-03-09
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is an educational web application that lets users explore how a convolutional neural network classifies handwritten digits. The proven approach for this type of tool is a split architecture: a Python backend (FastAPI + TensorFlow/Keras) that handles model inference and activation extraction, and a JavaScript frontend (Next.js + Tailwind CSS) that renders layer-by-layer visualizations and a confidence bar chart. The CNN model is trained offline in a Jupyter notebook, saved as an .h5 file, and loaded once at server startup. The critical architectural insight is using a multi-output Keras Model to extract all intermediate layer activations in a single forward pass, then encoding those activations as base64 PNG images server-side to keep API responses small and frontend rendering simple.

The recommended approach is to build a deliberately simple CNN (2 conv layers with 8-16 filters each) rather than optimizing for accuracy. This keeps the visualization manageable -- 8 feature maps per layer are pedagogically clear, while 64 would be visual noise. The MVP delivers: MNIST image selection, layer activation heatmaps, a confidence bar chart, and a static architecture diagram. The highest-impact differentiator to add post-MVP is a step-through forward pass animation, followed by a draw-your-own-digit canvas. An accompanying Jupyter notebook that trains the same model completes the educational story.

The primary risks are: (1) Python version incompatibility -- the system default is Python 3.14 which does not support TensorFlow; all work must use Python 3.12; (2) incorrect activation extraction that silently produces wrong visualizations, destroying the educational value; and (3) poor activation map normalization that renders all-black or all-white images. All three are preventable with validation steps documented in the pitfalls research.

## Key Findings

### Recommended Stack

The stack splits cleanly into a Python ML backend and a JavaScript visualization frontend, connected via REST API with JSON and base64-encoded images.

**Core technologies:**
- **Next.js 16.1.6**: Frontend framework -- App Router for page structure, built-in font loading for Montserrat, image optimization
- **Tailwind CSS 4.2.1**: Styling -- utility-first, fast for responsive layouts, v4 uses CSS-based config
- **FastAPI**: Backend API server -- async, auto-generates OpenAPI docs, native file upload support, built-in CORS middleware
- **TensorFlow/Keras ~2.18+**: CNN model training and inference -- Keras functional API enables multi-output activation extraction
- **Python 3.12**: Backend runtime -- MUST use 3.12 (installed at `/opt/homebrew/bin/python3.12`), NOT system default 3.14 which lacks TF support
- **Recharts 3.8.0**: Confidence bar chart -- React-native, simpler than Chart.js for this use case
- **Axios 1.13.6**: HTTP client -- cleaner than fetch for FormData uploads

**Critical version constraint:** TensorFlow requires Python 3.12. This is the single most important setup detail.

### Expected Features

**Must have (table stakes):**
- MNIST image selection (random sample button)
- Backend inference API with intermediate layer activation endpoint
- Layer-by-layer activation visualization (2D heatmap grids)
- Confidence bar chart (softmax probabilities for digits 0-9)
- Network architecture diagram (static)
- Loading states and error handling

**Should have (differentiators):**
- Forward pass animation (step-through layer reveal) -- single highest-impact differentiator
- Draw-your-own digit canvas -- high engagement, requires careful preprocessing to match MNIST distribution
- Tooltip explanations on each layer type -- low effort, high educational value
- Interactive layer inspection (click-to-zoom detail panels)

**Defer (v2+):**
- Correct vs incorrect comparison mode
- Grad-CAM / saliency maps (different visualization paradigm, requires backprop)
- 3D visualizations (complexity without proportional educational gain)
- Custom model training in browser (too slow for real CNNs)
- Multiple dataset support (multiplies complexity for marginal gain)

### Architecture Approach

Two-process architecture: Next.js frontend on port 3000, FastAPI backend on port 8000, communicating via REST. The backend loads the trained model and MNIST dataset into memory at startup. A single `/api/predict` endpoint accepts pixel data, runs one forward pass through a multi-output Keras Model, renders activation maps as base64 PNGs server-side, and returns a structured JSON response. The frontend controls animation timing, revealing layers progressively using simple state and timers. No state management library is needed -- React useState suffices for the 4 state variables (currentImage, predictionResult, isLoading, animationStep).

**Major components:**
1. **Image Picker** -- selects random MNIST samples, displays 28x28 digit
2. **Layer Flow Visualizer** -- renders feature map grids per layer with sequential reveal animation
3. **Confidence Bar Chart** -- horizontal bar chart of softmax output, highlights predicted digit
4. **API Client** -- thin fetch/axios wrapper, single point of frontend-backend contact
5. **Inference Service** -- loads model at startup, runs multi-output prediction, renders activations to base64 PNGs
6. **Data Service** -- loads MNIST dataset at startup, serves random samples
7. **Jupyter Notebook** -- offline training pipeline, outputs the .h5 model file

### Critical Pitfalls

1. **Nielsen pickle data shape mismatch** -- The MNIST data is flat (784,) vectors. Forgetting to reshape to (28, 28, 1) for Conv2D produces a model that trains but learns garbage spatial features. Visualize samples post-reshape in the notebook before training.

2. **Wrong activation extraction method** -- Using deprecated `K.function` or accidentally creating new layers instead of reusing trained weights. Use `tf.keras.Model(inputs=model.input, outputs=[layer.output...])` exclusively. Verify final layer output matches `model.predict()`.

3. **Raw NumPy arrays in API responses** -- Serializing float arrays as JSON produces 500KB+ payloads. Render activation maps to base64 PNGs server-side (10-50x smaller).

4. **Model loaded per request** -- Each `load_model()` takes 1-5 seconds. Use FastAPI's lifespan pattern to load once at startup.

5. **Activation maps without normalization** -- Raw activation values produce all-black or all-white images. Normalize each filter map independently to [0, 255] with per-filter min-max scaling.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Model Training and Data Pipeline
**Rationale:** Everything downstream depends on the trained model file. The notebook also validates data loading, preprocessing, and the CNN architecture -- catching the most critical pitfalls (data shape mismatch, over-complex architecture) before any web development begins.
**Delivers:** Trained model (model/mnist_cnn.h5), Jupyter training notebook, validated MNIST data pipeline, NPZ-converted dataset
**Addresses:** Jupyter notebook feature, trained model artifact
**Avoids:** Pitfall 1 (data shape mismatch), Pitfall 7 (over-complex CNN), Pitfall 9 (pickle compatibility)

### Phase 2: Backend API
**Rationale:** The frontend is a visualization of backend data. You cannot build visualizations without knowing the exact shape of activation data. Building and testing the API first (verifiable via curl) de-risks the integration.
**Delivers:** FastAPI server with /api/random-image and /api/predict endpoints, model loading at startup, activation extraction, base64 PNG encoding
**Addresses:** Backend inference API, intermediate layer activation endpoint
**Avoids:** Pitfall 2 (wrong extraction), Pitfall 3 (serialization), Pitfall 4 (model per request), Pitfall 5 (CORS)

### Phase 3: Frontend Core Visualization
**Rationale:** With a working API, build the visualization components in order of complexity: image picker (simplest), confidence chart (low complexity), architecture diagram (medium), then layer visualizer (hardest).
**Delivers:** Working end-to-end flow -- select image, see activations, see prediction
**Addresses:** Image selection, confidence bar chart, network architecture diagram, layer activation visualization, loading states
**Avoids:** Pitfall 6 (normalization handled by backend), Pitfall 8 (rendering performance), Pitfall 11 (router confusion)

### Phase 4: Interactive Features and Animation
**Rationale:** Animation and interactivity are polish on top of a working visualization. The static version must work correctly before adding temporal complexity.
**Delivers:** Step-through forward pass animation, tooltip explanations, draw-your-own digit canvas
**Addresses:** Forward pass animation (top differentiator), tooltip explanations, draw-your-own digit
**Avoids:** Pitfall 10 (no educational context -- tooltips added here)

### Phase 5: Polish and Refinements
**Rationale:** Final pass for UX, edge cases, and any v1.x features that fit.
**Delivers:** Interactive layer inspection (click-to-zoom), responsive layout tuning, error edge cases, documentation
**Addresses:** Interactive layer inspection, final UX polish

### Phase Ordering Rationale

- **Notebook before backend:** The .h5 model file is a hard dependency for the backend. The notebook also validates that the data pipeline and CNN architecture are correct -- catching the two most damaging pitfalls before they propagate.
- **Backend before frontend:** The frontend renders data from the API. Building it first means the API contract (response shapes, base64 format) is concrete, not hypothetical. Frontend development is faster with a real API to test against.
- **Static before animated:** The architecture research explicitly warns against building animation before the static visualization works. Get the data flowing correctly first.
- **Differentiators last:** Table stakes features establish the core value. Differentiators (animation, canvas) enhance it. Shipping a working visualizer without animation is useful; shipping animation without working visualization is not.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Model Training):** Verify TensorFlow installs correctly on Python 3.12. Verify the Nielsen pickle data structure (3-tuple split). Confirm model architecture produces clean activation maps. Needs `/gsd:research-phase`.
- **Phase 4 (Animation/Canvas):** Canvas-to-MNIST preprocessing (centering, normalizing drawn digits) is a known tricky problem. Forward pass animation timing and UX need prototyping. Needs `/gsd:research-phase`.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Backend API):** FastAPI + Keras multi-output model is well-documented. CORS middleware is boilerplate. Standard patterns.
- **Phase 3 (Frontend Core):** React components rendering images and bar charts. Recharts has clear documentation. Standard patterns.
- **Phase 5 (Polish):** Incremental improvements on existing components. No new patterns needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | npm versions verified via registry. Python package versions are estimates (PyPI blocked by proxy) -- verify TF installs at setup time. |
| Features | MEDIUM | Based on training data knowledge of competitor tools (CNN Explainer, Harley NN Vis, TF Playground). Feature categorization logic is sound but specific competitor claims are unverified. |
| Architecture | HIGH | Multi-output Keras Model and FastAPI patterns are well-established, stable APIs. Project structure follows standard conventions. |
| Pitfalls | HIGH | Several pitfalls verified empirically (pickle data shape, NumPy warnings). Remaining pitfalls based on well-documented patterns in TF/Keras and FastAPI communities. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **TensorFlow + Python 3.12 installation:** Must verify `pip install tensorflow` succeeds in a 3.12 venv before writing any model code. If it fails, fall back to 3.11.
- **Recharts + React 19 compatibility:** Recharts 3.x with React 19 (bundled with Next.js 16) may require `--legacy-peer-deps`. Verify at install time.
- **Nielsen pickle data structure:** The exact tuple structure (2-tuple vs 3-tuple of train/val/test splits) needs verification when loading. STACK.md says 3-tuple; confirm in notebook.
- **Tailwind CSS v4 config format:** v4 uses CSS-based configuration instead of JS config file. `create-next-app --tailwind` should handle this, but verify the generated project structure.
- **Next.js App Router vs Pages Router:** Architecture research suggests App Router (src/app/) but Pitfalls research notes that a client-heavy app gets no benefit from server components. Recommendation: Use App Router with `"use client"` on visualization components -- it is the current Next.js default and avoids swimming against the framework.

## Sources

### Primary (HIGH confidence)
- npm registry (verified 2026-03-09) -- Next.js 16.1.6, Tailwind CSS 4.2.1, Recharts 3.8.0, Axios 1.13.6
- Local system inspection -- Python versions, Node.js 25.6.1, mnist.pkl.gz data format
- TensorFlow/Keras documentation -- multi-output Model API, functional API extraction pattern
- FastAPI documentation -- lifespan events, CORSMiddleware configuration

### Secondary (MEDIUM confidence)
- CNN Explainer (Georgia Tech, IEEE VIS 2020) -- competitor feature analysis
- Adam Harley's Neural Network Visualization (CMU) -- competitor feature analysis
- TensorFlow Playground (Google) -- UX expectations for educational ML tools
- TensorFlow Python version compatibility -- historically lags 1-2 versions; 3.12 is the safe target

### Tertiary (LOW confidence)
- Exact FastAPI/uvicorn/Pillow latest versions -- use latest at install time
- react-dropzone version -- verify when implementing canvas feature
- Recharts 3.x + React 19 peer dependency compatibility -- test at install time

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*
