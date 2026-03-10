# Roadmap: MNIST CNN Visualizer

## Overview

This project delivers an educational web application that makes CNN internals visible. The path is: train the model (notebook + .h5 artifact), build the API that exposes activations, scaffold the frontend with image selection, then build the visualization layer that is the project's core value. Each phase produces a verifiable, standalone deliverable that the next phase depends on.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Model Training & Notebook** - Train CNN on MNIST, produce .h5 model file and educational Jupyter notebook
- [ ] **Phase 2: Backend API** - FastAPI server that loads model, runs inference, and returns activations
- [ ] **Phase 3: Frontend & Image Selection** - Next.js app with Tailwind, Montserrat font, and MNIST image picker
- [ ] **Phase 4: CNN Visualization** - Activation heatmaps, confidence chart, architecture diagram, and status states

## Phase Details

### Phase 1: Model Training & Notebook
**Goal**: Users (students) have a complete, runnable Jupyter notebook that teaches CNN training from scratch, and the trained model artifact exists for the backend to load
**Depends on**: Nothing (first phase)
**Requirements**: EDU-01, EDU-02, EDU-03, EDU-04, EDU-05, EDU-06
**Success Criteria** (what must be TRUE):
  1. Jupyter notebook runs end-to-end without errors, producing a trained .h5 model file
  2. Notebook clearly demonstrates data loading from mnist.pkl.gz, preprocessing, model definition, training with validation, and test evaluation
  3. Notebook displays scikit-learn confusion matrix and classification report on test data
  4. Trained model achieves reasonable accuracy (>95%) on MNIST test set
**Plans**: 1 plan

Plans:
- [ ] 01-01-PLAN.md — Set up environment, create complete training notebook, execute and verify outputs

### Phase 2: Backend API
**Goal**: A running FastAPI server that accepts an MNIST image, returns the predicted digit, confidence scores, and intermediate layer activations -- verifiable via curl before any frontend exists
**Depends on**: Phase 1 (requires .h5 model file)
**Requirements**: INF-01, INF-02, INF-03, INF-04, BE-01, BE-02, BE-03
**Success Criteria** (what must be TRUE):
  1. FastAPI server starts and loads model once at startup (not per-request)
  2. API endpoint accepts image data and returns predicted digit, softmax confidence scores for all 10 digits, and base64-encoded activation maps for each conv layer
  3. CORS is configured so the Next.js frontend on a different port can call the API without errors
  4. Server runs in a Python 3.12 virtual environment with all dependencies installed
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — ML inference module: model loading, activation extraction, base64 encoding
- [ ] 02-02-PLAN.md — FastAPI server: lifespan, CORS, endpoints, curl verification

### Phase 3: Frontend & Image Selection
**Goal**: Users see a clean educational interface where they can pick a random MNIST digit and see it displayed, with the app ready to connect to the backend
**Depends on**: Phase 2 (API contract informs frontend data expectations)
**Requirements**: FE-01, FE-02, FE-03, IMG-01, IMG-02
**Success Criteria** (what must be TRUE):
  1. Next.js app runs with Tailwind CSS styling and Montserrat font applied globally
  2. User can click a button to fetch and display a random MNIST image (28x28 scaled up) from the backend
  3. Page has a clean, educational layout with visually distinct sections for input, visualization, and prediction output
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: CNN Visualization
**Goal**: Users see the full CNN story -- activations flowing through layers, confidence scores, and network architecture -- making the inner workings of the CNN visible and understandable
**Depends on**: Phase 3 (frontend scaffold and image picker must exist)
**Requirements**: VIS-01, VIS-02, VIS-03, VIS-04, VIS-05
**Success Criteria** (what must be TRUE):
  1. After selecting an image, activation heatmaps for each conv layer are displayed as 2D grids showing what the CNN "sees" at each stage
  2. A confidence bar chart shows prediction probabilities for all 10 digits (0-9) with the predicted digit highlighted
  3. A network architecture diagram shows the CNN layer structure so users understand the model topology
  4. A loading state is visible while inference is running, and an error state appears if the backend is unreachable
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Model Training & Notebook | 0/1 | Planned | - |
| 2. Backend API | 0/2 | Planned | - |
| 3. Frontend & Image Selection | 0/0 | Not started | - |
| 4. CNN Visualization | 0/0 | Not started | - |
