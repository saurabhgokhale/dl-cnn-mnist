# MNIST CNN Visualizer

## What This Is

An educational web application that visualizes how a convolutional neural network classifies handwritten digits from the MNIST dataset. Users pick a random MNIST image, watch real activations flow through CNN layers, and see confidence scores for all 10 digits. Accompanied by a Jupyter notebook that teaches CNN training from scratch.

## Core Value

Make the inner workings of a CNN visible and understandable — users should *see* what happens at each layer when classifying a digit.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Next.js UI (no TypeScript) with Tailwind CSS and Google Font Montserrat
- [ ] Random MNIST image picker — button selects a random image from the dataset
- [ ] Real CNN activation visualization — show intermediate feature maps as data flows through conv layers, pooling, and dense layers
- [ ] Confidence bar chart showing prediction probabilities for all 10 digits (0-9)
- [ ] Display the predicted digit prominently
- [ ] FastAPI Python3 backend that accepts image input and returns prediction + intermediate layer activations
- [ ] CNN model trained on MNIST dataset (28x28 grayscale images)
- [ ] Jupyter notebook explaining MNIST training pipeline using TensorFlow, Keras, and scikit-learn
- [ ] Notebook covers data loading, preprocessing, model architecture, training, validation, and testing
- [ ] MNIST dataset loaded from /Users/saurabh/Downloads/mnist.pkl.gz

### Out of Scope

- Drawing canvas for custom digit input — v1 uses random dataset images only
- Mobile-responsive design — desktop-first educational tool
- User authentication — no login needed
- Model retraining from UI — training happens offline via notebook
- TypeScript — explicitly excluded per user preference

## Context

- This is a DCS Selectives project focused on understanding deep learning CNNs
- The MNIST dataset is the classic handwritten digit dataset (60k training, 10k test, 28x28 grayscale)
- Reference implementation: github.com/mnielsen/neural-networks-and-deep-learning (Michael Nielsen's book)
- Dataset is pre-downloaded at /Users/saurabh/Downloads/mnist.pkl.gz
- The UI visualization is the centerpiece — this is about learning, not production ML

## Constraints

- **Tech stack (frontend)**: Next.js (JavaScript only, no TypeScript), Tailwind CSS, Montserrat font
- **Tech stack (backend)**: Python3, FastAPI
- **Tech stack (ML)**: TensorFlow, Keras, scikit-learn
- **Dataset**: MNIST from /Users/saurabh/Downloads/mnist.pkl.gz
- **Image size**: MNIST standard 28x28 (user mentioned 26x26 but MNIST is 28x28)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| FastAPI over Flask | User preference — modern, async, fast | — Pending |
| No TypeScript | User preference — keep it simple JavaScript | — Pending |
| Real activations over conceptual | Educational value — see actual feature maps | — Pending |
| Random picker over canvas | Simpler v1 — consistent MNIST input quality | — Pending |

---
*Last updated: 2026-03-09 after initialization*
