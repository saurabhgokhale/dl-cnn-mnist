/**
 * Browser-side CNN inference using TensorFlow.js.
 *
 * Loads the MNIST CNN model once, then provides prediction with
 * layer-by-layer activation extraction — no backend required.
 */

import * as tf from "@tensorflow/tfjs";

let _model = null;
let _activationModel = null;
let _layerNames = [];
let _samples = null;

const MODEL_URL = "/tfmodel/model.json";
const SAMPLES_URL = "/tfmodel/samples.json";

// Layers to skip when returning activations (match backend behavior)
const SKIP_PREFIXES = ["flatten", "dropout"];

/**
 * Load the model and sample images. Caches after first call.
 */
export async function loadModel() {
  if (_model) return;

  _model = await tf.loadLayersModel(MODEL_URL);

  // Build a multi-output model for activation extraction
  const outputs = [];
  _layerNames = [];
  for (const layer of _model.layers) {
    outputs.push(layer.output);
    _layerNames.push(layer.name);
  }
  _activationModel = tf.model({
    inputs: _model.input,
    outputs: outputs,
  });
}

/**
 * Load bundled MNIST sample images.
 */
export async function loadSamples() {
  if (_samples) return _samples;
  const res = await fetch(SAMPLES_URL);
  _samples = await res.json();
  return _samples;
}

/**
 * Normalize a 2D activation map to 0-255 uint8 base64 PNG.
 * Returns a base64 string matching the backend's activation_to_base64().
 */
function activationToBase64(data, height, width) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(width, height);

  let min = Infinity, max = -Infinity;
  for (let i = 0; i < data.length; i++) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  const range = max - min > 1e-8 ? max - min : 1;

  for (let i = 0; i < data.length; i++) {
    const v = Math.round(((data[i] - min) / range) * 255);
    imageData.data[i * 4] = v;
    imageData.data[i * 4 + 1] = v;
    imageData.data[i * 4 + 2] = v;
    imageData.data[i * 4 + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);

  // Scale up to 64x64 for display (match backend size)
  const scaled = document.createElement("canvas");
  scaled.width = 64;
  scaled.height = 64;
  const sCtx = scaled.getContext("2d");
  sCtx.imageSmoothingEnabled = false;
  sCtx.drawImage(canvas, 0, 0, 64, 64);

  return scaled.toDataURL("image/png").split(",")[1];
}

/**
 * Convert a 28x28 image array to a base64 PNG (matching backend's image_to_base64).
 */
function imageToBase64(pixels28x28) {
  const canvas = document.createElement("canvas");
  canvas.width = 28;
  canvas.height = 28;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(28, 28);

  for (let i = 0; i < 784; i++) {
    const v = Math.round(pixels28x28[i] * 255);
    imageData.data[i * 4] = v;
    imageData.data[i * 4 + 1] = v;
    imageData.data[i * 4 + 2] = v;
    imageData.data[i * 4 + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);

  // Scale to 112x112 (match backend default)
  const scaled = document.createElement("canvas");
  scaled.width = 112;
  scaled.height = 112;
  const sCtx = scaled.getContext("2d");
  sCtx.imageSmoothingEnabled = false;
  sCtx.drawImage(canvas, 0, 0, 112, 112);

  return scaled.toDataURL("image/png").split(",")[1];
}

/**
 * Run inference on a flat array of 784 pixel values (0-1).
 * Returns the same structure as the backend API.
 */
export function runInference(pixels) {
  if (!_activationModel) throw new Error("Model not loaded");

  const inputTensor = tf.tensor4d(pixels, [1, 28, 28, 1]);

  // Get all layer outputs
  const results = _activationModel.predict(inputTensor);

  // Extract data synchronously
  const layerData = results.map((t) => {
    const data = t.dataSync();
    const shape = t.shape.slice(1); // remove batch dim
    return { data: Array.from(data), shape };
  });

  // Clean up tensors
  inputTensor.dispose();
  results.forEach((t) => t.dispose());

  // Softmax from last layer
  const softmax = layerData[layerData.length - 1].data;
  const prediction = softmax.indexOf(Math.max(...softmax));

  const confidence = softmax.map((p, i) => ({
    digit: i,
    probability: Math.round(p * 1e6) / 1e6,
  }));

  // Build activations (matching backend format)
  const activations = [];
  for (let li = 0; li < _layerNames.length; li++) {
    const name = _layerNames[li];
    if (SKIP_PREFIXES.some((s) => name.startsWith(s))) continue;

    const { data, shape } = layerData[li];

    if (shape.length === 3) {
      // 3D: (H, W, filters) — conv and pool layers
      const [h, w, filters] = shape;
      const maps = [];
      for (let f = 0; f < filters; f++) {
        // Extract single filter: data is in HWC layout
        const filterData = [];
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            filterData.push(data[(y * w + x) * filters + f]);
          }
        }
        maps.push(activationToBase64(filterData, h, w));
      }
      activations.push({
        layer_name: name,
        type: "feature_map",
        shape: [h, w, filters],
        maps,
      });
    } else if (shape.length === 1) {
      // 1D: (units,) — dense layers
      activations.push({
        layer_name: name,
        type: "vector",
        shape: [shape[0]],
        values: data.map((v) => Math.round(v * 1e4) / 1e4),
      });
    }
  }

  // Input image as base64
  const imageB64 = imageToBase64(pixels);

  return {
    image: imageB64,
    prediction,
    confidence,
    activations,
  };
}

/**
 * Pick a random MNIST sample and run inference.
 * If digit is specified, pick from that class only.
 */
export async function randomPredict(digit = null) {
  const samples = await loadSamples();

  let candidates;
  if (digit !== null) {
    candidates = [];
    for (let i = 0; i < samples.labels.length; i++) {
      if (samples.labels[i] === digit) candidates.push(i);
    }
  } else {
    candidates = samples.labels.map((_, i) => i);
  }

  const idx = candidates[Math.floor(Math.random() * candidates.length)];
  const pixels = samples.images[idx];
  const trueLabel = samples.labels[idx];

  const result = runInference(pixels);
  return {
    ...result,
    true_label: trueLabel,
  };
}
