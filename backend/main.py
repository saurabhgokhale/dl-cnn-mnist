"""
FastAPI application for the MNIST CNN Visualizer.

Loads the trained CNN model once at startup via lifespan, configures CORS
for the Next.js frontend, and exposes endpoints for health checks and
random image prediction with activation map extraction.
"""

import random
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
import uvicorn
from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.inference import (
    get_model_weights,
    image_to_base64,
    load_model_and_data,
    run_inference,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model and test data once at startup, store on app.state."""
    state = load_model_and_data()
    app.state.activation_model = state["activation_model"]
    app.state.layer_names = state["layer_names"]
    app.state.test_images = state["test_images"]
    app.state.test_labels = state["test_labels"]
    yield
    # Cleanup (no-op for this app)


app = FastAPI(title="MNIST CNN Visualizer API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health(request: Request):
    """Liveness check -- confirms model is loaded and data is available."""
    return {
        "status": "ok",
        "model_loaded": True,
        "test_images": len(request.app.state.test_images),
    }


@app.get("/api/random-predict")
async def random_predict(
    request: Request,
    digit: Optional[int] = Query(None, ge=0, le=9),
):
    """Pick a random MNIST test image, run inference, return everything.

    Returns JSON with: image (base64 PNG), true_label, prediction,
    confidence (10 dicts sorted by digit), activations (conv layer maps).

    If ?digit=N is provided, only images with that true label are considered.
    """
    test_images = request.app.state.test_images
    test_labels = request.app.state.test_labels
    activation_model = request.app.state.activation_model
    layer_names = request.app.state.layer_names

    # Pick random test image (keep batch dimension)
    if digit is not None:
        matching = [i for i, lbl in enumerate(test_labels) if int(lbl) == digit]
        idx = random.choice(matching)
    else:
        idx = random.randint(0, len(test_images) - 1)
    image = test_images[idx : idx + 1]
    true_label = int(test_labels[idx])

    # Run inference -- single pass gets prediction + activations
    result = run_inference(image, activation_model, layer_names)

    # Encode input image as base64 PNG
    input_image_b64 = image_to_base64(image[0, :, :, 0])

    return {
        "image": input_image_b64,
        "true_label": true_label,
        "prediction": result["prediction"],
        "confidence": result["confidence"],
        "activations": result["activations"],
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


@app.get("/api/weights")
async def model_weights(request: Request):
    """Return trained weights for all layers (static, doesn't change per image).

    Includes conv filter kernels as base64 images and dense weight matrices
    as base64 heatmaps. Used for weight visualization and backpropagation
    educational content.
    """
    activation_model = request.app.state.activation_model
    weights = get_model_weights(activation_model)
    return {"weights": weights}


class DrawingPayload(BaseModel):
    pixels: list[float]  # 784 values, 0.0-1.0, row-major 28x28


@app.post("/api/predict-drawing")
async def predict_drawing(request: Request, payload: DrawingPayload):
    """Accept a 28x28 grayscale drawing and run inference.

    Expects a JSON body with 'pixels': a flat array of 784 float values
    in [0, 1] range, row-major order (top-left to bottom-right).
    Returns same structure as /api/random-predict (minus true_label).
    """
    activation_model = request.app.state.activation_model
    layer_names = request.app.state.layer_names

    image = np.array(payload.pixels, dtype=np.float32).reshape(1, 28, 28, 1)
    image = np.clip(image, 0.0, 1.0)

    result = run_inference(image, activation_model, layer_names)
    input_image_b64 = image_to_base64(image[0, :, :, 0])

    return {
        "image": input_image_b64,
        "true_label": None,
        "prediction": result["prediction"],
        "confidence": result["confidence"],
        "activations": result["activations"],
    }
