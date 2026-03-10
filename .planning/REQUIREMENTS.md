# Requirements: MNIST CNN Visualizer

**Defined:** 2026-03-09
**Core Value:** Make the inner workings of a CNN visible and understandable — users should see what happens at each layer when classifying a digit.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Image Input

- [ ] **IMG-01**: User can click a button to select a random MNIST image from the dataset
- [ ] **IMG-02**: Selected image is displayed clearly (28x28 scaled up) on the page

### CNN Inference

- [ ] **INF-01**: FastAPI endpoint accepts an MNIST image and returns the predicted digit
- [ ] **INF-02**: Backend returns intermediate layer activations (feature maps) for all conv layers
- [ ] **INF-03**: Backend returns softmax confidence scores for all 10 digits (0-9)
- [ ] **INF-04**: CNN model loaded once at server startup (not per-request)

### Visualization

- [ ] **VIS-01**: Layer activation heatmaps displayed as 2D grids for each conv layer
- [ ] **VIS-02**: Confidence bar chart showing prediction probabilities for all 10 digits
- [ ] **VIS-03**: Network architecture diagram showing CNN layer structure
- [ ] **VIS-04**: Loading state while inference is running
- [ ] **VIS-05**: Error state if backend is unreachable

### Frontend

- [ ] **FE-01**: Next.js app (JavaScript only, no TypeScript) with Tailwind CSS
- [ ] **FE-02**: Google Font Montserrat applied globally
- [ ] **FE-03**: Clean, educational layout with clear section separation

### Training & Education

- [x] **EDU-01**: Jupyter notebook that trains the CNN using TensorFlow and Keras
- [x] **EDU-02**: Notebook covers data loading from /Users/saurabh/Downloads/mnist.pkl.gz
- [x] **EDU-03**: Notebook covers preprocessing, model architecture definition, and compilation
- [x] **EDU-04**: Notebook covers training with validation metrics
- [x] **EDU-05**: Notebook covers test evaluation with scikit-learn metrics (confusion matrix, classification report)
- [x] **EDU-06**: Notebook produces .h5 model file used by the backend

### Backend Setup

- [ ] **BE-01**: Python 3.12 virtual environment (not system Python 3.14)
- [ ] **BE-02**: FastAPI with CORS configured for Next.js frontend
- [ ] **BE-03**: Multi-output Keras model for single-pass activation extraction

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Interactive Input

- **DRAW-01**: User can draw a digit on a canvas in the browser
- **DRAW-02**: Canvas drawing preprocessed (centered, normalized) to match MNIST format

### Advanced Visualization

- **AVIS-01**: Forward pass step-through animation (reveal layers progressively)
- **AVIS-02**: Click-to-zoom on individual feature maps
- **AVIS-03**: Tooltips explaining what each layer does
- **AVIS-04**: Inline educational text explaining CNN concepts

## Out of Scope

| Feature | Reason |
|---------|--------|
| TypeScript | Explicitly excluded per user preference |
| In-browser training | Disproportionate complexity vs educational value |
| 3D visualization | Complex to implement, minimal pedagogical benefit |
| Multi-dataset support | MNIST only for this project |
| User authentication | Educational tool, no login needed |
| Mobile-responsive design | Desktop-first educational tool |
| Model retraining from UI | Training happens offline via notebook |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| IMG-01 | Phase 3 | Pending |
| IMG-02 | Phase 3 | Pending |
| INF-01 | Phase 2 | Pending |
| INF-02 | Phase 2 | Pending |
| INF-03 | Phase 2 | Pending |
| INF-04 | Phase 2 | Pending |
| VIS-01 | Phase 4 | Pending |
| VIS-02 | Phase 4 | Pending |
| VIS-03 | Phase 4 | Pending |
| VIS-04 | Phase 4 | Pending |
| VIS-05 | Phase 4 | Pending |
| FE-01 | Phase 3 | Pending |
| FE-02 | Phase 3 | Pending |
| FE-03 | Phase 3 | Pending |
| EDU-01 | Phase 1 | Complete |
| EDU-02 | Phase 1 | Complete |
| EDU-03 | Phase 1 | Complete |
| EDU-04 | Phase 1 | Complete |
| EDU-05 | Phase 1 | Complete |
| EDU-06 | Phase 1 | Complete |
| BE-01 | Phase 2 | Pending |
| BE-02 | Phase 2 | Pending |
| BE-03 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after roadmap creation*
