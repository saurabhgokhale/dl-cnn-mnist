"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { VIRIDIS_LUT } from "../lib/viridis";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const LAYER_INFO = [
  {
    key: "input",
    name: "Input Image",
    shape: "28×28×1",
    color: "#16a34a",
    bg: "#f0fdf4",
    desc: "The raw handwritten digit — 784 grayscale pixels, each a value from 0 (black) to 1 (white).",
  },
  {
    key: "conv2d_1",
    name: "Conv Layer 1",
    shape: "26×26×8",
    color: "#2563eb",
    bg: "#eff6ff",
    desc: "Eight 3×3 filters slide across the image, detecting edges, corners, and gradients. Each filter produces a 26×26 feature map.",
  },
  {
    key: "maxpool_1",
    name: "MaxPool 1",
    shape: "13×13×8",
    color: "#4f46e5",
    bg: "#eef2ff",
    desc: "Takes the maximum value in each 2×2 block, halving the dimensions. The strongest features survive.",
  },
  {
    key: "conv2d_2",
    name: "Conv Layer 2",
    shape: "11×11×8",
    color: "#2563eb",
    bg: "#eff6ff",
    desc: "Eight new filters combine Layer 1's features into higher-level patterns — curves, loops, and junctions.",
  },
  {
    key: "maxpool_2",
    name: "MaxPool 2",
    shape: "5×5×8",
    color: "#4f46e5",
    bg: "#eef2ff",
    desc: "Further 2×2 pooling compresses each map to just 5×5 pixels. The digit is now a compact 200-value summary.",
  },
  {
    key: "dense_1",
    name: "Dense 1",
    shape: "128",
    color: "#7c3aed",
    bg: "#f5f3ff",
    desc: "128 neurons, each connected to all 200 flattened values. They learn weighted combinations that distinguish digits.",
  },
  {
    key: "dense_2",
    name: "Dense 2",
    shape: "64",
    color: "#7c3aed",
    bg: "#f5f3ff",
    desc: "64 neurons refine the representation further. By now, irrelevant variations (size, slant) are filtered out.",
  },
  {
    key: "output",
    name: "Output",
    shape: "10",
    color: "#ea580c",
    bg: "#fff7ed",
    desc: "10 neurons with softmax activation produce a probability for each digit (0-9). The highest wins.",
  },
];

function ViridisCanvas({ base64, size = 56 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!base64 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = "data:image/png;base64," + base64;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i];
        const [r, g, b] = VIRIDIS_LUT[gray];
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }
      ctx.putImageData(imageData, 0, 0);
    };
  }, [base64, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

function VectorBar({ values, height = 50 }) {
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-px" style={{ height }}>
      {values.map((v, i) => {
        const h = max > 0 ? (v / max) * 100 : 0;
        const lutIdx = max > 0 ? Math.round((v / max) * 255) : 0;
        const [r, g, b] = VIRIDIS_LUT[lutIdx];
        return (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{
              height: `${h}%`,
              backgroundColor: `rgb(${r},${g},${b})`,
              minWidth: 1,
            }}
          />
        );
      })}
    </div>
  );
}

function LayerVisualization({ layer, activation, image }) {
  if (layer.key === "input" && image) {
    return (
      <img
        src={`data:image/png;base64,${image}`}
        alt="Input digit"
        width={80}
        height={80}
        className="border border-gray-300 rounded"
        style={{ imageRendering: "pixelated" }}
      />
    );
  }

  if (!activation) return null;

  if (activation.type === "feature_map") {
    return (
      <div className="grid grid-cols-4 gap-1">
        {activation.maps.map((m, i) => (
          <ViridisCanvas key={i} base64={m} size={56} />
        ))}
      </div>
    );
  }

  if (activation.type === "vector") {
    const isOutput = layer.key === "output";
    return (
      <div style={{ width: isOutput ? 160 : 220 }}>
        <VectorBar values={activation.values} height={isOutput ? 60 : 50} />
        {isOutput && (
          <div className="flex gap-px mt-1">
            {activation.values.map((_, i) => (
              <div key={i} className="flex-1 text-center text-[8px] text-gray-400 font-mono">
                {i}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function DataFlowPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const timerRef = useRef(null);
  const inferenceRef = useRef(null);

  // Load browser inference model
  useEffect(() => {
    async function init() {
      try {
        const mod = await import("../lib/inference");
        await mod.loadModel();
        await mod.loadSamples();
        inferenceRef.current = mod;
      } catch (err) {
        console.warn("Browser inference unavailable:", err);
        // Will fall back to API
      }
      setReady(true);
    }
    init();
  }, []);

  const fetchDigit = useCallback(async (digit = null) => {
    setLoading(true);
    setError(null);
    setActiveStep(-1);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      // Try browser inference first
      if (inferenceRef.current) {
        const data = await inferenceRef.current.randomPredict(digit);
        setResult(data);
        return;
      }

      // Fall back to API
      let url = `${API_BASE}/api/random-predict`;
      if (digit !== null) url += `?digit=${digit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Could not load. Make sure the server is running or reload the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch first digit only after model init completes
  useEffect(() => {
    if (ready) fetchDigit();
  }, [ready, fetchDigit]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const play = useCallback(() => {
    if (!result) return;
    setActiveStep(-1);
    setIsPlaying(true);

    let step = 0;
    // Clear any existing timer first
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setActiveStep(step);
      step++;
      if (step >= LAYER_INFO.length) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        // Don't reset isPlaying — keep layers visible
      }
    }, 800);
  }, [result]);

  const showAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveStep(LAYER_INFO.length - 1);
    setIsPlaying(true);
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveStep(-1);
    setIsPlaying(false);
  }, []);

  // Build a lookup from layer_name -> activation data
  const activationMap = {};
  if (result && result.activations) {
    for (const act of result.activations) {
      activationMap[act.layer_name] = act;
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-2 sm:px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <header className="text-center mb-2">
        <div className="flex items-center justify-between mb-1">
          <Link
            href="/"
            className="text-sm font-medium text-accent-600 hover:text-accent-700 hover:underline"
          >
            &larr; Back
          </Link>
          <h1 className="text-3xl font-bold">Animated Data Flow</h1>
          <div className="w-16" />
        </div>
        <p className="text-gray-500 mt-1">
          Watch data transform step-by-step as it flows through the CNN
        </p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Controls */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-500">Pick a digit:</span>
          {Array.from({ length: 10 }, (_, i) => (
            <button
              key={i}
              onClick={() => fetchDigit(i)}
              disabled={loading}
              className="w-9 h-9 rounded-lg bg-accent-100 text-accent-700 font-semibold hover:bg-accent-500 hover:text-white disabled:opacity-50 transition-colors text-sm"
            >
              {i}
            </button>
          ))}
          <button
            onClick={() => fetchDigit()}
            disabled={loading}
            className="ml-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Random
          </button>

          <div className="flex-1" />

          <button
            onClick={play}
            disabled={!result || loading}
            className="px-5 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {isPlaying ? "Replay" : "Play Animation"}
          </button>
          <button
            onClick={showAll}
            disabled={!result || loading}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
          >
            Show All
          </button>
          <button
            onClick={reset}
            disabled={!result || activeStep < 0}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
          >
            Reset
          </button>
        </div>
      </section>

      {/* Data flow visualization */}
      {result && (
        <div className="space-y-0">
          {LAYER_INFO.map((layer, idx) => {
            const visible = idx <= activeStep;
            const isCurrent = idx === activeStep;
            const activation = activationMap[layer.key];

            return (
              <div key={layer.key}>
                {/* Arrow between layers */}
                {idx > 0 && (
                  <div className="flex justify-center py-1">
                    <svg
                      width="24"
                      height="28"
                      viewBox="0 0 24 28"
                      className={`transition-opacity duration-300 ${
                        visible ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <path
                        d="M12 0 L12 20 M6 14 L12 22 L18 14"
                        stroke={visible ? layer.color : "#d1d5db"}
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}

                {/* Layer card */}
                <div
                  className={`rounded-xl border-2 p-5 transition-all duration-500 ${
                    visible
                      ? isCurrent
                        ? "scale-[1.01] shadow-lg"
                        : "shadow-sm"
                      : "opacity-30 scale-[0.98]"
                  }`}
                  style={{
                    borderColor: visible ? layer.color : "#e5e7eb",
                    backgroundColor: visible ? layer.bg : "#fafafa",
                  }}
                >
                  <div className="flex items-start gap-5">
                    {/* Layer info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="flex-shrink-0 w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: layer.color }}
                        >
                          {idx + 1}
                        </span>
                        <h3 className="text-lg font-semibold">{layer.name}</h3>
                        <span className="text-xs font-mono text-gray-400">
                          {layer.shape}
                        </span>
                      </div>
                      <p
                        className={`text-sm leading-relaxed transition-opacity duration-500 ${
                          visible ? "opacity-100 text-gray-600" : "opacity-0"
                        }`}
                      >
                        {layer.desc}
                      </p>

                      {/* Show prediction result at output layer */}
                      {visible && layer.key === "output" && result && (
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-3xl font-bold text-accent-600">
                            {result.prediction}
                          </span>
                          <span className="text-sm text-gray-500">
                            predicted with{" "}
                            {(
                              result.confidence[result.prediction].probability * 100
                            ).toFixed(1)}
                            % confidence
                          </span>
                          {result.true_label !== null &&
                            result.prediction !== result.true_label && (
                              <span className="text-sm text-red-500 font-medium">
                                (true label: {result.true_label})
                              </span>
                            )}
                        </div>
                      )}
                    </div>

                    {/* Layer visualization */}
                    <div
                      className={`flex-shrink-0 transition-all duration-500 ${
                        visible
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 translate-x-4"
                      }`}
                    >
                      <LayerVisualization
                        layer={layer}
                        activation={activation}
                        image={result?.image}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-accent-200 border-t-accent-600 rounded-full animate-spin" />
          <p className="text-gray-400 mt-3 text-sm">Loading image and activations...</p>
        </div>
      )}
    </main>
  );
}
