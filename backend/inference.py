"""
ML inference module for MNIST CNN visualizer.

Loads the trained CNN model, builds a multi-output activation model using the
Functional API rebuild pattern, and provides functions for prediction with
activation extraction and base64 image encoding.
"""

import gzip
import pickle
import io
import base64
from pathlib import Path

import keras
import numpy as np
from PIL import Image

# Project root: two levels up from this file (backend/inference.py -> project root)
_PROJECT_ROOT = Path(__file__).resolve().parent.parent


def load_model_and_data(
    model_path: str = None,
    data_path: str = None,
) -> dict:
    """Load CNN model and MNIST test data, build multi-output activation model.

    Args:
        model_path: Path to the trained .h5 model file.
            Defaults to <project_root>/model/mnist_cnn.h5.
        data_path: Path to the Nielsen MNIST pickle file.
            Defaults to ~/Downloads/mnist.pkl.gz.

    Returns:
        Dict with keys:
            activation_model: keras.Model with all layer outputs
            layer_names: list of layer name strings
            test_images: np.ndarray shape (10000, 28, 28, 1) float32
            test_labels: np.ndarray shape (10000,) int
    """
    if model_path is None:
        model_path = str(_PROJECT_ROOT / "model" / "mnist_cnn.h5")
    if data_path is None:
        data_path = str(Path.home() / "Downloads" / "mnist.pkl.gz")

    # Load trained model (compile=False suppresses metrics warning)
    model = keras.models.load_model(model_path, compile=False)

    # Build multi-output activation model using Functional API rebuild pattern.
    # Keras 3 Sequential models loaded from .h5 don't expose .input directly,
    # so we rewire through a fresh Input tensor.
    inp = keras.Input(shape=(28, 28, 1))
    x = inp
    outputs = {}
    for layer in model.layers:
        x = layer(x)
        outputs[layer.name] = x

    activation_model = keras.Model(
        inputs=inp,
        outputs=list(outputs.values()),
    )
    layer_names = list(outputs.keys())

    # Load MNIST test data (Nielsen format: gzip pickle, 3-tuple)
    with gzip.open(data_path, "rb") as f:
        data = pickle.load(f, encoding="latin1")

    # Index 2 is the test set: (x_test flat, y_test)
    _, _, (x_test, y_test) = data

    # Reshape for Conv2D input -- data is already [0, 1], do NOT divide by 255
    x_test = x_test.reshape(-1, 28, 28, 1).astype(np.float32)
    y_test = y_test.astype(int)

    return {
        "activation_model": activation_model,
        "layer_names": layer_names,
        "test_images": x_test,
        "test_labels": y_test,
    }


def activation_to_base64(activation_map: np.ndarray, size: int = 64) -> str:
    """Convert a single 2D activation map to a base64-encoded PNG string.

    Args:
        activation_map: 2D numpy array (H, W) -- one filter's activation.
        size: Output image size in pixels (square). Default 64.

    Returns:
        Base64-encoded PNG string.
    """
    a = activation_map
    a_min, a_max = a.min(), a.max()

    if a_max - a_min > 1e-8:
        normalized = ((a - a_min) / (a_max - a_min) * 255).astype(np.uint8)
    else:
        # Dead filter -- return all-zeros image
        normalized = np.zeros_like(a, dtype=np.uint8)

    img = Image.fromarray(normalized, mode="L")
    img = img.resize((size, size), Image.NEAREST)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def run_inference(
    image: np.ndarray,
    activation_model,
    layer_names: list,
) -> dict:
    """Run inference on a single image, returning prediction and activations.

    Args:
        image: numpy array with shape (1, 28, 28, 1) -- batch dim included.
        activation_model: Multi-output keras.Model from load_model_and_data().
        layer_names: List of layer name strings from load_model_and_data().

    Returns:
        Dict with keys:
            prediction: int (0-9)
            confidence: list of 10 dicts {"digit": int, "probability": float}
                sorted by digit 0-9
            activations: list of dicts for conv layers, each with
                {"layer_name": str, "shape": [H, W, filters], "maps": [base64...]}
    """
    # Single-pass inference -- all layer outputs at once
    results = activation_model.predict(image, verbose=0)

    # Softmax from last layer output
    softmax = results[-1][0]  # shape (10,)

    # Predicted digit
    predicted_digit = int(np.argmax(softmax))

    # Confidence array: 10 dicts sorted by digit 0-9
    confidence = [
        {"digit": i, "probability": round(float(softmax[i]), 6)}
        for i in range(10)
    ]

    # Activation maps for conv layers only
    activations = []
    for layer_idx, name in enumerate(layer_names):
        if "conv" not in name:
            continue

        layer_output = results[layer_idx][0]  # shape (H, W, filters)
        h, w, num_filters = layer_output.shape

        maps = []
        for f in range(num_filters):
            b64 = activation_to_base64(layer_output[:, :, f])
            maps.append(b64)

        activations.append({
            "layer_name": name,
            "shape": [int(h), int(w), int(num_filters)],
            "maps": maps,
        })

    return {
        "prediction": predicted_digit,
        "confidence": confidence,
        "activations": activations,
    }


def image_to_base64(image: np.ndarray, size: int = 112) -> str:
    """Convert a 2D MNIST image to a base64-encoded PNG string.

    Args:
        image: 2D numpy array (28, 28) of the input MNIST image.
        size: Output image size in pixels (square). Default 112.

    Returns:
        Base64-encoded PNG string.
    """
    # Normalize to 0-255
    a = image
    a_min, a_max = a.min(), a.max()

    if a_max - a_min > 1e-8:
        normalized = ((a - a_min) / (a_max - a_min) * 255).astype(np.uint8)
    else:
        normalized = np.zeros_like(a, dtype=np.uint8)

    img = Image.fromarray(normalized, mode="L")
    img = img.resize((size, size), Image.NEAREST)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")
