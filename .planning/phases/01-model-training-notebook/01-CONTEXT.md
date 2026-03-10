# Phase 1: Model Training & Notebook - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Train a CNN on MNIST and produce a .h5 model file, wrapped in an educational Jupyter notebook that teaches CNN training from scratch. The notebook is both a learning artifact (students read and run it) and a pipeline artifact (the .h5 model is loaded by the backend in Phase 2). Data source: /Users/saurabh/Downloads/mnist.pkl.gz (Nielsen's pickle format).

</domain>

<decisions>
## Implementation Decisions

### Model Architecture
- 2 convolutional layers, each with 8 filters — keeps visualization clean (2x4 or 4x2 grid per layer)
- 2 dense (fully-connected) layers before the 10-digit softmax output — shows feature compression
- Include dropout layers with explanation of regularization concept
- Architecture: Input(28x28x1) → Conv(8) → Pool → Conv(8) → Pool → Dense → Dropout → Dense → Dropout → Output(10)

### Notebook Style
- Hybrid tone: brief theory introduction, then annotated code blocks
- Explain CNN concepts from scratch — assume reader has no ML background (what convolution is, how pooling works, what backpropagation does)
- Well-sectioned with clear markdown headers: Intro, Data Loading, Preprocessing, Architecture, Training, Evaluation, Model Export
- Rich visualizations throughout (sample digits, training curves, evaluation plots)

### Evaluation Depth
- Plot full training and validation loss/accuracy curves across epochs (epoch-by-epoch)
- Display overall test accuracy
- Confusion matrix heatmap (required by EDU-05)
- Scikit-learn classification report with precision/recall/F1 per digit (required by EDU-05)

### Claude's Discretion
- Number of training epochs (optimize for convergence and reasonable notebook run time)
- Dense layer neuron counts (e.g., 128 → 64 or similar)
- Kernel sizes for conv layers
- Batch size and learning rate
- How to handle the Nielsen pickle format (2-tuple vs 3-tuple detection)
- Preprocessing steps and normalization approach

</decisions>

<specifics>
## Specific Ideas

- The notebook should feel like a tutorial someone could follow along with — not just runnable code, but teachable code
- The model must be deliberately simple so the Phase 4 visualization is pedagogically clear (8 feature maps per layer, not 64)
- The .h5 model file must be compatible with the multi-output Keras model pattern used in Phase 2 for activation extraction

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-model-training-notebook*
*Context gathered: 2026-03-09*
