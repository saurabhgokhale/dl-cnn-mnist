"""
FastAPI application for the MNIST CNN Visualizer.

Loads the trained CNN model once at startup via lifespan, configures CORS
for the Next.js frontend, and exposes endpoints for health checks and
random image prediction with activation map extraction.
"""

import random
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from backend.inference import image_to_base64, load_model_and_data, run_inference


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
async def random_predict(request: Request):
    """Pick a random MNIST test image, run inference, return everything.

    Returns JSON with: image (base64 PNG), true_label, prediction,
    confidence (10 dicts sorted by digit), activations (conv layer maps).
    """
    test_images = request.app.state.test_images
    test_labels = request.app.state.test_labels
    activation_model = request.app.state.activation_model
    layer_names = request.app.state.layer_names

    # Pick random test image (keep batch dimension)
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
