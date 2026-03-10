# Feature Research

**Domain:** Educational CNN/ML Visualization Web Application (MNIST)
**Researched:** 2026-03-09
**Confidence:** MEDIUM (based on training data knowledge of CNN Explainer, TensorFlow Playground, Adam Harley's NN Vis, TensorSpace.js, and similar tools; no live verification possible due to sandbox restrictions)

## Competitor Landscape (Informing Feature Decisions)

Key existing tools analyzed from training knowledge:

- **CNN Explainer** (Georgia Tech / Polo Club) -- Interactive in-browser CNN visualization using a tiny model on CIFAR-10. Shows activations, filters, feature maps with tooltips explaining each operation (convolution, ReLU, pooling, softmax). Runs entirely client-side with TensorFlow.js.
- **Adam Harley's NN Vis** (CMU) -- 2D and 3D visualizations of fully-connected and convolutional networks on MNIST. Users draw or select digits, see neuron activations light up across layers with connecting lines showing data flow.
- **TensorFlow Playground** -- Interactive neural network for simple 2D classification. Lets users tweak hyperparameters (learning rate, layers, neurons, activation functions) and watch training in real time. Not CNN-specific but sets the bar for interactive ML education.
- **TensorSpace.js** -- 3D visualization library for pre-trained models. Renders layer-by-layer 3D representations. More of a library than a standalone app.
- **Various Jupyter/Colab notebooks** -- Static or semi-interactive visualizations of CNN internals using matplotlib. Common in courses but not web-app-grade.

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels broken or pointless for an educational CNN visualizer.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Image selection from MNIST dataset** | Users need input to visualize; every CNN demo lets you pick or provide an image | LOW | Random sample button + display of the 28x28 grayscale image. Pre-load a curated set of ~100 images server-side for fast selection. |
| **Layer-by-layer activation visualization** | This IS the core value proposition. CNN Explainer and Harley's tool both do this. Without it, this is just a digit classifier. | HIGH | Show feature maps / activation grids for each conv layer, pooling layer, and dense layer. Heatmap or grayscale rendering of each filter's output. |
| **Final prediction with confidence scores** | Every classifier demo shows this. Users need to see what the model thinks. | LOW | Bar chart showing softmax probabilities for all 10 digits (0-9). Highlight the predicted class. Use a simple charting library (Recharts or Chart.js). |
| **Clear network architecture diagram** | Users need to understand what they are looking at -- how many layers, what type, what shape | MEDIUM | Visual representation of the model topology showing layer types (Conv2D, MaxPool, Dense, etc.) with dimensions. Does not need to be interactive initially. |
| **Responsive, clean UI** | Modern web app expectations. TensorFlow Playground set a high bar for polish. | MEDIUM | Next.js handles this well. Must work on desktop; tablet is nice-to-have; phone is not critical for this type of visualization. |
| **Loading / processing feedback** | Backend inference takes time. Users must not stare at a frozen screen. | LOW | Spinner or skeleton UI while the FastAPI backend processes. Show clear state transitions. |

### Differentiators (Competitive Advantage)

Features that make this project stand out from the many existing MNIST demos. These are what turn a "yet another MNIST classifier" into something genuinely educational and portfolio-worthy.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Animated data flow / forward pass animation** | Most tools show static snapshots. Animating data flowing through the network (input -> conv1 -> pool1 -> conv2 -> ... -> output) makes the learning experience dramatically better. CNN Explainer does some of this but not as a step-through animation. | HIGH | Step-by-step animation with play/pause. Highlight the "active" layer. Show intermediate data transforming. Use Framer Motion or CSS transitions. This is the single highest-impact differentiator. |
| **Interactive layer inspection (click-to-zoom)** | Let users click on any layer to see detailed view: all filter outputs, kernel weights as small images, dimensions. Harley's tool does neuron-level inspection but most MNIST demos don't. | MEDIUM | Click a layer in the architecture diagram to expand a detail panel. Show filter kernels, activation maps at full resolution, and numerical stats (min/max/mean activation). |
| **Draw-your-own digit (canvas input)** | Adam Harley's tool has this. Lets users test the model on their own handwriting rather than just dataset samples. Dramatically increases engagement. | MEDIUM | HTML5 Canvas with mouse/touch drawing, scaled to 28x28, preprocessed to match MNIST distribution (center, normalize). Send to backend for inference. Preprocessing is the tricky part -- MNIST images are centered and size-normalized. |
| **Side-by-side comparison of correct vs incorrect predictions** | Show users WHERE the model fails and what the activations look like when it is wrong vs right. This is genuinely educational -- it reveals model limitations. | MEDIUM | Curate a set of known misclassified examples. Let users compare activation patterns. Could auto-select a correct and incorrect example of the same digit. |
| **Accompanying Jupyter notebook** | Already planned. This bridges the gap between the interactive demo and actual ML code. Most web demos are black boxes -- having the training code alongside is genuinely valuable for learners. | MEDIUM | Notebook covering data loading, model architecture definition, training loop, evaluation. Should reference the same model architecture used in the web app. |
| **Tooltip explanations on each layer type** | Brief educational text explaining what convolution does, what pooling does, what the dense layer does. Makes it self-contained rather than requiring prior knowledge. | LOW | Hover or click info icons next to each layer. 2-3 sentence plain-English explanations. Can include small diagrams. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create complexity without proportional educational value for this project's scope.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Custom model training in the browser** | "Let users tweak the architecture and retrain." TensorFlow Playground does this. | Training a CNN takes minutes-to-hours even on MNIST. TF Playground works because its models are tiny (a few neurons on 2D data). A real CNN with conv layers is too slow for interactive browser training. Adds massive complexity (TensorFlow.js training, progress tracking, model management). | Show a pre-trained model. The Jupyter notebook covers the training story. Users learn from visualization, not from watching a training loss curve slowly descend. |
| **Real-time training visualization (loss curves, accuracy over epochs)** | "Show how the model learns over time." | Requires either pre-recorded training data (fake) or actual training (slow). Distracts from the core value which is understanding inference/forward pass. | Include training curves as static images in the Jupyter notebook. The web app focuses on inference visualization. |
| **Support for multiple datasets (CIFAR-10, Fashion-MNIST, etc.)** | "Why just MNIST?" | Each dataset needs a different model, different preprocessing, different visualization sizing. Multiplies complexity for marginal educational gain. MNIST is the canonical educational example for good reason -- 28x28 grayscale is simple enough to visualize meaningfully. | Stick with MNIST. Mention in docs that the architecture generalizes. The notebook can briefly discuss other datasets. |
| **3D visualizations of activations** | "Make it look impressive with WebGL/Three.js." TensorSpace does this. | 3D adds significant implementation complexity (Three.js/WebGL), harder to reason about visually, accessibility issues, performance concerns on low-end devices. 2D heatmaps/grids are actually MORE readable for understanding what filters detect. | Use clean 2D visualizations. Grid layouts for feature maps. Color-coded heatmaps. These communicate the same information more clearly. |
| **User accounts and saved sessions** | "Let users save their exploration state." | Authentication, database for user data, session management -- massive scope creep for an educational demo. | No accounts. Stateless app. Each visit starts fresh. If needed later, use URL parameters to encode state (selected image, active layer). |
| **Mobile-first design** | "Everyone uses phones." | CNN layer visualizations need screen real estate. Activation grids for a layer with 32 filters are unreadable on a phone. The primary audience (students, developers learning ML) will use this on desktop/laptop. | Desktop-first. Make it not-broken on tablet. Explicitly don't optimize for phone -- show a message suggesting desktop use. |
| **Grad-CAM / saliency maps** | "Show which pixels matter for the prediction." | Valuable but a separate visualization paradigm. Requires backpropagation through the model (not just forward pass). Adds API complexity and a second visualization mode that competes for attention with the forward-pass story. | Defer to v2. If added, make it a separate view/tab, not mixed into the forward pass visualization. |

## Feature Dependencies

```
[MNIST Image Selection]
    └──requires──> [Backend API (model serving)]
                       └──requires──> [Trained Model (.h5/.keras file)]

[Layer Activation Visualization]
    └──requires──> [Backend API (intermediate layer outputs)]
    └──requires──> [Network Architecture Diagram (to know what to show)]

[Confidence Bar Chart]
    └──requires──> [Backend API (softmax output)]

[Forward Pass Animation]
    └──requires──> [Layer Activation Visualization (static version first)]
    └──requires──> [Network Architecture Diagram (animation path)]

[Draw-Your-Own Digit]
    └──requires──> [Backend API (accepts arbitrary 28x28 input)]
    └──enhances──> [Layer Activation Visualization]
    └──enhances──> [Confidence Bar Chart]

[Interactive Layer Inspection]
    └──enhances──> [Layer Activation Visualization]
    └──enhances──> [Network Architecture Diagram]

[Correct vs Incorrect Comparison]
    └──requires──> [MNIST Image Selection]
    └──requires──> [Layer Activation Visualization]

[Tooltip Explanations]
    └──enhances──> [Network Architecture Diagram]
    └──enhances──> [Layer Activation Visualization]

[Jupyter Notebook]
    └──independent (parallel work track)]
    └──references──> [Trained Model (same architecture)]
```

### Dependency Notes

- **Layer Activation Visualization requires Backend API:** The FastAPI backend must expose an endpoint that returns intermediate layer outputs, not just the final prediction. This is the most important API design decision.
- **Forward Pass Animation requires static visualization first:** Build the static version of all layer visualizations, then add animation on top. Trying to build animation first leads to debugging rendering and data issues simultaneously.
- **Draw-Your-Own requires careful preprocessing:** The canvas input must be preprocessed to match MNIST distribution (centered, size-normalized, inverted if needed). This is a common pitfall -- raw canvas data looks nothing like MNIST samples.
- **Jupyter Notebook is independent:** Can be developed in parallel with the web app since it only shares the model architecture definition.

## MVP Definition

### Launch With (v1)

Minimum viable product -- enough to demonstrate the concept and be a strong portfolio piece.

- [ ] **MNIST image selection** (random sample button) -- core input mechanism
- [ ] **Backend inference API** (FastAPI serving TF/Keras model) -- everything depends on this
- [ ] **Intermediate layer activation endpoint** -- returns feature maps for all layers given an input
- [ ] **Network architecture diagram** (static) -- orients the user
- [ ] **Layer activation visualization** (2D heatmap grids) -- the core educational value
- [ ] **Confidence bar chart** (softmax output for 10 digits) -- shows the prediction clearly
- [ ] **Loading states and error handling** -- basic UX polish

### Add After Validation (v1.x)

Features to add once core visualization pipeline is working end-to-end.

- [ ] **Tooltip explanations** -- low effort, high educational value; add once you know exactly which layers the model has
- [ ] **Draw-your-own digit canvas** -- high engagement feature; add once inference pipeline is proven
- [ ] **Forward pass animation** (step-through) -- the biggest differentiator but requires stable visualization foundation
- [ ] **Interactive layer inspection** (click-to-zoom detail panels) -- enhances exploration depth

### Future Consideration (v2+)

Features to defer until the core product is solid.

- [ ] **Correct vs incorrect comparison mode** -- requires curating failure cases and building a comparison UI
- [ ] **Grad-CAM / saliency maps** -- separate visualization paradigm, requires backprop endpoint
- [ ] **Filter/kernel weight visualization** -- showing the learned convolution filters as images
- [ ] **Dark mode** -- nice to have, not educational value

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| MNIST image selection | HIGH | LOW | P1 |
| Backend inference + activations API | HIGH | MEDIUM | P1 |
| Layer activation visualization (2D grids) | HIGH | HIGH | P1 |
| Confidence bar chart | HIGH | LOW | P1 |
| Network architecture diagram | HIGH | MEDIUM | P1 |
| Loading states / error handling | MEDIUM | LOW | P1 |
| Tooltip explanations | MEDIUM | LOW | P2 |
| Draw-your-own digit | HIGH | MEDIUM | P2 |
| Forward pass animation | HIGH | HIGH | P2 |
| Interactive layer inspection | MEDIUM | MEDIUM | P2 |
| Correct vs incorrect comparison | MEDIUM | MEDIUM | P3 |
| Grad-CAM / saliency maps | MEDIUM | HIGH | P3 |
| Kernel weight visualization | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch -- without these, the app has no educational value
- P2: Should have, add when possible -- these are what make it impressive
- P3: Nice to have, future consideration -- valuable but not essential

## Competitor Feature Analysis

| Feature | CNN Explainer | Harley NN Vis | TF Playground | Our Approach |
|---------|---------------|---------------|---------------|--------------|
| Input selection | Pre-set images (CIFAR-10) | Draw + MNIST samples | Generated 2D data | MNIST samples + draw-your-own |
| Layer activations | Yes (feature maps + filters) | Yes (neuron-level coloring) | Neuron outputs only | 2D heatmap grids per layer |
| Animation | Partial (hover-based) | None (static) | Real-time training | Step-through forward pass |
| Architecture view | Inline with visualization | Fixed layout | Editable graph | Static diagram + click-to-inspect |
| Prediction output | Softmax bar | Highlighted output | Decision boundary | Confidence bar chart |
| Explanatory text | Tooltips + article | Minimal | Minimal | Tooltips + Jupyter notebook |
| Training code | Not shown | Not shown | Implicit (in-browser) | Jupyter notebook |
| Technology | TF.js (client-side) | Client-side | Client-side | Next.js + FastAPI + TF/Keras (server-side inference) |
| Dataset | CIFAR-10 (tiny model) | MNIST | Synthetic 2D | MNIST |

**Our key differentiation:** The combination of (1) server-side real model inference (not a tiny browser model), (2) step-through animation of the forward pass, (3) draw-your-own canvas, and (4) accompanying training notebook creates a more complete educational experience than any single existing tool. Most tools do one thing well -- we aim to tell the complete story from "what is a CNN" to "how does it classify this digit."

## Sources

- CNN Explainer: poloclub.github.io/cnn-explainer (Georgia Tech, published at IEEE VIS 2020)
- Adam Harley's Neural Network Visualization: cs.cmu.edu/~aharley/vis
- TensorFlow Playground: playground.tensorflow.org (Google)
- TensorSpace.js: tensorspace.org

**Confidence note:** All competitor analysis is based on training data knowledge (up to early 2025). These tools are well-established and unlikely to have fundamentally changed, but specific feature details should be verified if critical decisions depend on them. The feature categorization (table stakes vs differentiators) is based on patterns across dozens of educational ML tools and is HIGH confidence for the categorization logic, MEDIUM confidence for specific competitor feature claims.

---
*Feature research for: Educational CNN/ML Visualization Web Application (MNIST)*
*Researched: 2026-03-09*
