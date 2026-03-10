# Phase 2: Backend API - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

FastAPI server that loads the trained CNN model (.h5 from Phase 1), runs inference on MNIST images, and returns predictions, confidence scores, and intermediate layer activations. The frontend (Phase 3) will call this API. Visualization logic belongs in Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Response Shape
- Single API call returns everything: predicted digit, all 10 confidence scores, and all layer activations
- Activation maps sent as base64 PNG images — frontend renders them as `<img>` tags, no client-side array processing
- Confidence scores as ordered array [0-9] — array of 10 objects with digit label and probability, sorted by digit number
- Backend serves MNIST images — has a `/random-image` endpoint that picks a random test sample and returns it along with inference results

### Claude's Discretion
- Exact endpoint paths and naming (e.g., `/api/predict`, `/api/random`)
- Error response format and HTTP status codes
- How many MNIST test images to keep in memory
- Image encoding details (PNG size, colormap for activation maps)
- CORS configuration specifics
- Model loading strategy (lifespan pattern vs on_event)
- Whether to combine random-image + predict into one endpoint or keep separate

</decisions>

<specifics>
## Specific Ideas

- The API should be testable via curl before any frontend exists (Phase 2 success criteria)
- Phase 1 used conda env (ml, Python 3.9, TF 2.19.0) due to proxy — backend must use the same environment
- Model file is at `model/mnist_cnn.h5` with named layers (conv2d_1, conv2d_2, etc.)
- Activation extraction uses Functional API rebuild pattern (Keras 3 compatible, established in Phase 1)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-backend-api*
*Context gathered: 2026-03-10*
