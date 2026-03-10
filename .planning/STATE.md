# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** Make the inner workings of a CNN visible and understandable -- users should see what happens at each layer when classifying a digit.
**Current focus:** Phase 4: CNN Visualization -- COMPLETE (3/3 plans with summary)

## Current Position

Phase: 4 of 4 (CNN Visualization)
Plan: 3 of 3 in current phase -- COMPLETE
Status: All phases complete
Last activity: 2026-03-10 -- Completed 04-03-PLAN.md

Progress: [##########] 100% (Phase 4: 3/3 plans with summary)

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 5 min
- Total execution time: 0.63 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-model-training-notebook | 1 | 11 min | 11 min |
| 02-backend-api | 2 | 4 min | 2 min |
| 03-frontend-image-selection | 2 | 15 min | 8 min |
| 04-cnn-visualization | 3 | 8 min | 3 min |

**Recent Trend:**
- Last 5 plans: 11 min, 4 min, 2 min, 4 min, 2 min
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: 4 phases derived from requirements (notebook -> backend -> frontend -> visualization)
- Research: Use simple CNN (2 conv layers, 8-16 filters) for pedagogically clear visualizations
- Research: Python 3.12 required (system 3.14 lacks TensorFlow support)
- Research: Base64 PNG encoding for activations (not raw NumPy arrays in JSON)
- Phase 1: Used conda env (ml, Python 3.9, TF 2.19.0) due to proxy blocking PyPI
- Phase 1: Activation extraction uses Functional API rebuild pattern for Keras 3 compatibility
- Phase 1: Model saved as .h5 format per spec (462.5 KB, 35,298 params, 98.7% accuracy)
- Phase 2: PIL grayscale mode 'L' for activation maps (10x smaller than matplotlib colormap)
- Phase 2: Inference module separates ML concerns from HTTP concerns for Plan 02
- Phase 2: FastAPI lifespan pattern for one-time model loading, single /api/random-predict endpoint
- Phase 3: Used next/font/local with bundled woff2 instead of next/font/google (sandbox blocks Google Fonts)
- Phase 3: Optional[int] syntax for Python 3.9 compat in backend digit query param
- Phase 3: Used result.confidence[prediction].probability to match backend response shape (not .score)
- Phase 4: Used ResponsiveContainer with explicit height div to prevent Recharts 0-height collapse
- Phase 4: Inline SVG with viewBox for architecture diagram (no extra dependency needed)
- Phase 4: Generated viridis LUT from embedded data (matplotlib not in conda env), output matches canonical values
- [Phase 04-cnn-visualization]: Rendered ConfidenceChart as page.js sibling (not inside PredictionSection) to avoid double card wrapping

### Pending Todos

None.

### Blockers/Concerns

- ~~TensorFlow + Python 3.12 installation must be verified before Phase 1 execution~~ RESOLVED: Used conda Python 3.9 with TF 2.19.0
- ~~Nielsen pickle data structure (2-tuple vs 3-tuple) needs confirmation when loading~~ RESOLVED: Confirmed 3-tuple format
- Proxy blocks all PyPI access -- future phases must use packages available in existing conda envs or pre-install

## Session Continuity

Last session: 2026-03-10
Stopped at: Completed 04-03-PLAN.md
Resume file: None
