# Phase 1: Model Training & Notebook - Research

**Researched:** 2026-03-09
**Domain:** Jupyter notebook CNN training pipeline (TensorFlow/Keras + scikit-learn on MNIST)
**Confidence:** HIGH

## Summary

This phase produces two artifacts: (1) an educational Jupyter notebook that teaches CNN training from scratch, and (2) a trained `.h5` model file consumed by the Phase 2 backend. The technical stack is mature and well-understood -- TensorFlow/Keras for model building, scikit-learn for evaluation metrics, matplotlib/seaborn for visualization, all running under Python 3.12 in a virtual environment.

The primary technical risk is the Nielsen pickle format, which stores data as flat `(N, 784)` vectors pickled with Python 2. This requires `encoding='latin1'` and explicit reshaping to `(28, 28, 1)` for Conv2D input. A secondary concern is ensuring the model architecture (deliberately simple: 2 conv layers with 8 filters each) trains to reasonable accuracy (~98%+) while remaining pedagogically clear.

**Primary recommendation:** Build the notebook in 7 clear sections (Intro, Data Loading, Preprocessing, Architecture, Training, Evaluation, Export). Use Sequential API for the model. Save as `.h5` format for maximum compatibility with the Phase 2 multi-output activation extraction pattern.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Model Architecture:** 2 convolutional layers, each with 8 filters. 2 dense layers before 10-digit softmax output. Dropout layers included. Architecture: Input(28x28x1) -> Conv(8) -> Pool -> Conv(8) -> Pool -> Dense -> Dropout -> Dense -> Dropout -> Output(10)
- **Notebook Style:** Hybrid tone (brief theory then annotated code). Explain CNN concepts from scratch for readers with no ML background. Sections: Intro, Data Loading, Preprocessing, Architecture, Training, Evaluation, Model Export. Rich visualizations throughout.
- **Evaluation Depth:** Full training/validation loss+accuracy curves. Overall test accuracy. Confusion matrix heatmap. Scikit-learn classification report with precision/recall/F1 per digit.

### Claude's Discretion
- Number of training epochs (optimize for convergence and reasonable notebook run time)
- Dense layer neuron counts (e.g., 128 -> 64 or similar)
- Kernel sizes for conv layers
- Batch size and learning rate
- How to handle the Nielsen pickle format (2-tuple vs 3-tuple detection)
- Preprocessing steps and normalization approach

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EDU-01 | Jupyter notebook that trains the CNN using TensorFlow and Keras | Standard Stack section covers TF/Keras setup; Architecture Patterns section covers Sequential model construction |
| EDU-02 | Notebook covers data loading from /Users/saurabh/Downloads/mnist.pkl.gz | Nielsen Pickle Format section provides exact loading code and 3-tuple structure details |
| EDU-03 | Notebook covers preprocessing, model architecture definition, and compilation | Preprocessing Recommendations and Model Architecture sections with verified code patterns |
| EDU-04 | Notebook covers training with validation metrics | Training Hyperparameters section covers epochs, batch size, validation split strategy |
| EDU-05 | Notebook covers test evaluation with scikit-learn metrics (confusion matrix, classification report) | Evaluation Patterns section with exact scikit-learn API calls |
| EDU-06 | Notebook produces .h5 model file used by the backend | Model Export section covers `.h5` save format and Phase 2 compatibility |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TensorFlow/Keras | ~2.18+ | CNN model building, training, saving | Project requirement. `tf.keras.Sequential` for simple pedagogical model. Saves to `.h5` format for Phase 2 consumption. |
| scikit-learn | ~1.5+ | Evaluation metrics | `confusion_matrix` and `classification_report` are the standard tools for EDU-05. |
| NumPy | ~2.x | Array manipulation | Core dependency of TF. Used for reshaping, normalization. |
| matplotlib | ~3.9+ | Training visualizations, sample digit display, confusion matrix heatmap | Standard plotting library for Jupyter notebooks. |
| seaborn | ~0.13+ | Confusion matrix heatmap styling | `sns.heatmap()` produces publication-quality confusion matrices with annotations. Optional but recommended over raw matplotlib for this specific plot. |
| Jupyter Notebook | ~7.3+ | Notebook environment | Project requirement for educational delivery format. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gzip (stdlib) | built-in | Decompress mnist.pkl.gz | Data loading step |
| pickle (stdlib) | built-in | Deserialize Nielsen format | Data loading step |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| seaborn heatmap | matplotlib imshow | seaborn provides annotation and color scaling out of the box; matplotlib requires more manual setup |
| Sequential API | Functional API | Sequential is simpler to explain pedagogically; Functional is more flexible but unnecessary for a linear architecture |

**Installation:**
```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install tensorflow numpy scikit-learn matplotlib seaborn jupyter
```

**Note:** On Apple Silicon Macs, `pip install tensorflow` (>= 2.16) includes native Apple Silicon support. No separate `tensorflow-macos` or `tensorflow-metal` packages needed for TF 2.16+.

## Architecture Patterns

### Notebook Section Structure
```
notebooks/training.ipynb
  Section 1: Introduction         # What is a CNN? What will we build?
  Section 2: Data Loading          # Load Nielsen pickle, inspect structure
  Section 3: Preprocessing         # Reshape, normalize, one-hot encode, train/val/test split
  Section 4: Model Architecture    # Build Sequential model, model.summary()
  Section 5: Training              # Compile + fit with validation, capture History
  Section 6: Evaluation            # Test accuracy, confusion matrix, classification report
  Section 7: Model Export          # Save to model/mnist_cnn.h5
```

### Pattern 1: Nielsen Pickle Loading with Auto-Detection
**What:** The Nielsen `mnist.pkl.gz` file contains a 3-tuple: `(training_data, validation_data, test_data)`. Each element is itself a 2-tuple of `(images, labels)`. Training has 50,000 samples, validation 10,000, test 10,000.
**When to use:** Always -- this is the only data source.
**Example:**
```python
# Source: Nielsen's neural-networks-and-deep-learning, verified structure from project PITFALLS.md
import gzip, pickle
import numpy as np

with gzip.open('/Users/saurabh/Downloads/mnist.pkl.gz', 'rb') as f:
    data = pickle.load(f, encoding='latin1')

# Nielsen format: 3-tuple of (images, labels)
if len(data) == 3:
    (x_train, y_train), (x_val, y_val), (x_test, y_test) = data
elif len(data) == 2:
    (x_train, y_train), (x_test, y_test) = data
    # Create validation split from training data
    x_val, y_val = x_train[50000:], y_train[50000:]
    x_train, y_train = x_train[:50000], y_train[:50000]

print(f"Training: {x_train.shape}, Validation: {x_val.shape}, Test: {x_test.shape}")
# Expected: Training: (50000, 784), Validation: (10000, 784), Test: (10000, 784)
```

### Pattern 2: Reshape and Normalize for Conv2D
**What:** Nielsen data is flat `(N, 784)` float32 already in [0, 1]. Reshape to `(N, 28, 28, 1)` for Conv2D. No further normalization needed.
**When to use:** After data loading, before model training.
**Example:**
```python
# Reshape from flat vectors to 28x28x1 images
x_train = x_train.reshape(-1, 28, 28, 1)
x_val = x_val.reshape(-1, 28, 28, 1)
x_test = x_test.reshape(-1, 28, 28, 1)

# CRITICAL: Verify reshape is correct by displaying sample images
import matplotlib.pyplot as plt
fig, axes = plt.subplots(2, 5, figsize=(12, 5))
for i, ax in enumerate(axes.flat):
    ax.imshow(x_train[i].squeeze(), cmap='gray')
    ax.set_title(f"Label: {y_train[i]}")
    ax.axis('off')
plt.suptitle("Sample Training Images (verify orientation)")
plt.tight_layout()
plt.show()
```

### Pattern 3: Sequential Model with Locked Architecture
**What:** Build the user-specified architecture using `tf.keras.Sequential`.
**Example:**
```python
from tensorflow import keras
from tensorflow.keras import layers

model = keras.Sequential([
    # Input shape
    layers.Input(shape=(28, 28, 1)),

    # First conv block: 8 filters
    layers.Conv2D(8, kernel_size=(3, 3), activation='relu', name='conv2d_1'),
    layers.MaxPooling2D(pool_size=(2, 2), name='maxpool_1'),

    # Second conv block: 8 filters
    layers.Conv2D(8, kernel_size=(3, 3), activation='relu', name='conv2d_2'),
    layers.MaxPooling2D(pool_size=(2, 2), name='maxpool_2'),

    # Flatten and dense layers
    layers.Flatten(name='flatten'),
    layers.Dense(128, activation='relu', name='dense_1'),
    layers.Dropout(0.25, name='dropout_1'),
    layers.Dense(64, activation='relu', name='dense_2'),
    layers.Dropout(0.25, name='dropout_2'),

    # Output
    layers.Dense(10, activation='softmax', name='output'),
])

model.summary()
```

### Pattern 4: Training with History Capture
**What:** Use `model.fit()` with validation data, capture the History object for plotting.
**Example:**
```python
model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

history = model.fit(
    x_train, y_train,
    epochs=15,
    batch_size=128,
    validation_data=(x_val, y_val),
    verbose=1
)
```

### Pattern 5: Model Save for Phase 2 Compatibility
**What:** Save using `.h5` format. The Phase 2 backend loads this model and wraps it in a multi-output `tf.keras.Model` for activation extraction.
**Critical:** Name layers explicitly (as shown in Pattern 3) so Phase 2 can reference them by name.
**Example:**
```python
import os
os.makedirs('model', exist_ok=True)
model.save('model/mnist_cnn.h5')
print("Model saved to model/mnist_cnn.h5")

# Verify it loads correctly
loaded = keras.models.load_model('model/mnist_cnn.h5')
loaded.summary()
```

### Anti-Patterns to Avoid
- **Double normalization:** Nielsen data is already in [0, 1]. Do NOT divide by 255 again. Guard with an assertion: `assert x_train.max() <= 1.0`.
- **Using `tf.keras.datasets.mnist.load_data()`:** This downloads from the internet. The project uses the local Nielsen pickle file.
- **One-hot encoding labels with sparse loss:** If using `sparse_categorical_crossentropy`, labels should be integers (0-9), NOT one-hot. If using `categorical_crossentropy`, one-hot encode with `keras.utils.to_categorical()`. Recommendation: use `sparse_categorical_crossentropy` to keep labels simple.
- **Saving as SavedModel directory:** Use `.h5` file format, not the SavedModel directory format. The `.h5` format is a single file, easier to manage, and sufficient for this use case.
- **Unnamed layers:** Always provide explicit `name=` arguments so Phase 2 can build the activation extraction model reliably.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confusion matrix | Manual counting loop | `sklearn.metrics.confusion_matrix` + `seaborn.heatmap` | Handles edge cases, provides standard output format |
| Classification report | Manual precision/recall calculation | `sklearn.metrics.classification_report` | Per-class precision, recall, F1, support -- all in one call |
| Training curves | Manual epoch tracking | `history.history` dict from `model.fit()` | Keras automatically records loss and metrics per epoch |
| Data normalization verification | Manual pixel range checks | `assert` + matplotlib visual inspection | Catches reshape/normalization errors before they propagate |

## Common Pitfalls

### Pitfall 1: Nielsen Pickle Encoding Error
**What goes wrong:** Loading without `encoding='latin1'` produces `UnicodeDecodeError` because the file was pickled with Python 2.
**Why it happens:** Default pickle encoding in Python 3 is 'ASCII'.
**How to avoid:** Always pass `encoding='latin1'` to `pickle.load()`.
**Warning signs:** `UnicodeDecodeError` on the `pickle.load()` call.

### Pitfall 2: Flat Vector Fed to Conv2D
**What goes wrong:** Passing `(N, 784)` shaped data to a model expecting `(N, 28, 28, 1)`. Keras will raise a shape error, or if reshaped wrong, the model trains on spatially scrambled data.
**Why it happens:** Forgetting the reshape step, or reshaping to `(N, 28, 28)` without the channel dimension.
**How to avoid:** Reshape to `(N, 28, 28, 1)` immediately after loading. Display sample images to visually verify correctness.
**Warning signs:** Shape mismatch error, or activation maps that look like random noise.

### Pitfall 3: Double Normalization
**What goes wrong:** Nielsen data is already float32 in [0, 1]. Dividing by 255 again maps values to [0, 0.004], effectively zeroing the data.
**Why it happens:** Most MNIST tutorials assume uint8 [0, 255] data from `tf.keras.datasets.mnist`.
**How to avoid:** Check `x_train.max()` and `x_train.dtype` before any normalization. Assert range is [0, 1].
**Warning signs:** Model training loss does not decrease, or converges very slowly.

### Pitfall 4: Wrong Loss Function for Label Format
**What goes wrong:** Using `categorical_crossentropy` with integer labels, or `sparse_categorical_crossentropy` with one-hot labels. Keras does not always error clearly -- it may train but produce nonsensical results.
**Why it happens:** Mixing up which loss expects which label format.
**How to avoid:** Use `sparse_categorical_crossentropy` with integer labels (the Nielsen format provides integer labels). This is the simplest approach.
**Warning signs:** Training accuracy stuck near 10% (random chance for 10 classes).

### Pitfall 5: Model Too Complex for Pedagogical Purpose
**What goes wrong:** Adding batch normalization, learning rate schedules, data augmentation to squeeze extra accuracy. The notebook becomes hard to follow and the model has too many layers for clean visualization.
**Why it happens:** ML instinct to optimize.
**How to avoid:** This is locked: 2 conv layers, 8 filters each, 2 dense layers. ~98% accuracy is the target, not 99.5%.
**Warning signs:** More than ~10 lines of model definition code.

## Code Examples

### Confusion Matrix Heatmap (EDU-05)
```python
# Source: scikit-learn + seaborn standard pattern
from sklearn.metrics import confusion_matrix, classification_report
import seaborn as sns

y_pred = model.predict(x_test).argmax(axis=1)

# Confusion matrix
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=range(10), yticklabels=range(10))
plt.xlabel('Predicted Digit')
plt.ylabel('True Digit')
plt.title('Confusion Matrix')
plt.tight_layout()
plt.show()

# Classification report
print(classification_report(y_test, y_pred, digits=3))
```

### Training Curves (EDU-04)
```python
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# Loss
ax1.plot(history.history['loss'], label='Training Loss')
ax1.plot(history.history['val_loss'], label='Validation Loss')
ax1.set_xlabel('Epoch')
ax1.set_ylabel('Loss')
ax1.set_title('Training and Validation Loss')
ax1.legend()

# Accuracy
ax2.plot(history.history['accuracy'], label='Training Accuracy')
ax2.plot(history.history['val_accuracy'], label='Validation Accuracy')
ax2.set_xlabel('Epoch')
ax2.set_ylabel('Accuracy')
ax2.set_title('Training and Validation Accuracy')
ax2.legend()

plt.tight_layout()
plt.show()
```

### Verify Model Loads for Phase 2 Compatibility
```python
# Verify the saved model can be loaded and used for activation extraction
loaded_model = keras.models.load_model('model/mnist_cnn.h5')

# This is the exact pattern Phase 2 will use
layer_outputs = [layer.output for layer in loaded_model.layers
                 if not isinstance(layer, keras.layers.InputLayer)]
activation_model = keras.Model(inputs=loaded_model.input, outputs=layer_outputs)

# Test with one sample
sample = x_test[0:1]
activations = activation_model.predict(sample)
print(f"Activation extraction works: {len(activations)} layer outputs")
for i, act in enumerate(activations):
    print(f"  Layer {i} ({loaded_model.layers[i+1].name}): shape {act.shape}")
```

## Discretion Recommendations

Areas marked as Claude's discretion -- here are research-backed recommendations:

| Parameter | Recommendation | Rationale |
|-----------|---------------|-----------|
| **Epochs** | 15 | With 8 filters per conv layer and Adam optimizer, convergence on MNIST typically occurs by epoch 10-12. 15 provides margin without excessive notebook run time (~2-3 minutes total on Apple Silicon). |
| **Dense layer sizes** | 128 -> 64 | Standard compression funnel. 128 is enough capacity after 8-filter conv layers. 64 provides a visible compression step before the 10-unit output. |
| **Kernel size** | (3, 3) for both conv layers | Standard choice for small images. 5x5 is also viable but reduces spatial dimensions faster. 3x3 is the modern default. |
| **Batch size** | 128 | Good balance of training speed and gradient stability. 32 would be slower, 256 may be too coarse for this small model. |
| **Learning rate** | Adam default (0.001) | Adam adapts learning rate automatically. No need to tune for this straightforward task. |
| **Dropout rate** | 0.25 | Light regularization. 0.5 would be aggressive for this small model. 0.25 provides the pedagogical "here is what dropout does" moment without significantly impacting accuracy. |
| **Nielsen pickle handling** | Try 3-tuple first, fall back to 2-tuple | The standard Nielsen format is 3-tuple (train/val/test). Auto-detection is defensive coding worth the 3 extra lines. |
| **Normalization** | None needed -- verify data is already [0, 1] | Nielsen data is pre-normalized float32. Just reshape and assert. |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tensorflow-macos` + `tensorflow-metal` | Plain `tensorflow` >= 2.16 | TF 2.16 (early 2024) | Single pip install works on Apple Silicon, no special packages needed |
| `@app.on_event("startup")` | `lifespan` async context manager | FastAPI ~0.100+ | Phase 2 concern, but the model saved here must be loadable via the new pattern |
| `model.save('model.h5')` legacy | `model.save('model.keras')` new format | TF 2.16+ | Both still work. `.h5` is simpler and more portable. Use `.h5` for this project. |
| `K.function()` for activations | `tf.keras.Model(inputs, outputs)` | TF 2.0+ | Old K.function pattern broken in eager mode. Functional Model wrapping is the standard. |

**Deprecated/outdated:**
- `tensorflow-macos` / `tensorflow-metal` packages: No longer needed as of TF 2.16+
- `keras.utils.to_categorical()`: Not needed when using `sparse_categorical_crossentropy`
- `@app.on_event("startup")`: Deprecated in modern FastAPI, replaced by `lifespan`

## Open Questions

1. **Exact TensorFlow version available for Python 3.12**
   - What we know: TF ~2.18+ should support Python 3.12 (from project STACK.md research)
   - What's unclear: Cannot verify exact version due to proxy blocking PyPI. May need `--break-system-packages` or venv to install.
   - Recommendation: First task in the plan MUST be environment setup with `pip install tensorflow` and verification that `import tensorflow` succeeds. If it fails, fall back to checking which TF version is available.

2. **Nielsen pickle exact structure on this specific file**
   - What we know: Standard Nielsen format is 3-tuple. Could not unpickle without numpy installed.
   - What's unclear: Whether this specific file follows the standard format or is a variant.
   - Recommendation: Auto-detect 2-tuple vs 3-tuple in the notebook code. Display shapes immediately after loading.

## Sources

### Primary (HIGH confidence)
- Project STACK.md -- verified library choices, Python version constraints, installation commands
- Project ARCHITECTURE.md -- verified model save path (`model/mnist_cnn.h5`), activation extraction pattern
- Project PITFALLS.md -- verified Nielsen format details, reshape requirements, normalization gotchas
- Phase 01-CONTEXT.md -- locked decisions on architecture, notebook style, evaluation depth
- Local filesystem -- confirmed `mnist.pkl.gz` exists at `/Users/saurabh/Downloads/mnist.pkl.gz`, Python 3.12.11 available

### Secondary (MEDIUM confidence)
- TensorFlow/Keras API patterns (Sequential model, model.fit History, model.save) -- stable APIs unchanged for years, training data reliable
- scikit-learn confusion_matrix/classification_report API -- stable, well-established
- matplotlib/seaborn plotting patterns -- stable, well-established

### Tertiary (LOW confidence)
- Exact TensorFlow version available on PyPI for Python 3.12 -- could not verify due to proxy; STACK.md estimates ~2.18+
- Exact training time estimate (2-3 minutes) -- depends on hardware, untested on this machine

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries are mature, well-documented, project-level research already verified choices
- Architecture: HIGH -- model architecture is locked by user, patterns are standard Keras
- Pitfalls: HIGH -- verified through project-level PITFALLS.md and cross-referenced with training data
- Discretion recommendations: MEDIUM -- hyperparameter choices based on domain experience, not empirically tested on this exact model

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable domain, 30-day validity)
