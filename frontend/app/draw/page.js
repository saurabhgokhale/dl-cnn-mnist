"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import ConfidenceChart from "../components/ConfidenceChart";
import ActivationHeatmaps from "../components/ActivationHeatmaps";
import { SkeletonBarChart } from "../components/SkeletonLoaders";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CANVAS_SIZE = 280; // display size
const GRID = 28; // model input size

export default function DrawPage() {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [brushSize, setBrushSize] = useState(16);
  const lastPos = useRef(null);

  // Initialize canvas with black background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }, []);

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback(
    (e) => {
      e.preventDefault();
      setDrawing(true);
      setHasStrokes(true);
      const pos = getPos(e);
      lastPos.current = pos;

      const ctx = canvasRef.current.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [getPos, brushSize]
  );

  const draw = useCallback(
    (e) => {
      if (!drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      const ctx = canvasRef.current.getContext("2d");

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      lastPos.current = pos;
    },
    [drawing, getPos, brushSize]
  );

  const stopDrawing = useCallback(() => {
    setDrawing(false);
    lastPos.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    setHasStrokes(false);
    setResult(null);
    setError(null);
  }, []);

  const getPixels = useCallback(() => {
    // Downsample canvas to 28x28
    const offscreen = document.createElement("canvas");
    offscreen.width = GRID;
    offscreen.height = GRID;
    const ctx = offscreen.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvasRef.current, 0, 0, GRID, GRID);

    const imageData = ctx.getImageData(0, 0, GRID, GRID);
    const pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      pixels.push(imageData.data[i] / 255.0); // R channel, normalized
    }
    return pixels;
  }, []);

  const predict = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pixels = getPixels();
      const res = await fetch(`${API_BASE}/api/predict-drawing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pixels }),
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Could not reach the backend. Make sure the server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }, [getPixels]);

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
          <h1 className="text-3xl font-bold">Draw Your Own Digit</h1>
          <div className="w-16" />
        </div>
        <p className="text-gray-500 mt-1">
          Draw a digit (0-9) and watch the CNN classify it in real time
        </p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Drawing area + prediction side by side */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
        {/* Canvas section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-3">Draw Here</h2>
          <div
            className="relative border-2 border-gray-300 rounded-lg overflow-hidden mx-auto"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, touchAction: "none" }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="cursor-crosshair"
              style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          {/* Controls */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500 min-w-[70px]">Brush size</label>
              <input
                type="range"
                min="8"
                max="32"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="flex-1 accent-accent-600"
              />
              <span className="text-sm text-gray-400 w-6 text-right">{brushSize}</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={predict}
                disabled={!hasStrokes || loading}
                className="flex-1 bg-accent-600 text-white px-6 py-2.5 rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? "Classifying..." : "Classify Digit"}
              </button>
              <button
                onClick={clearCanvas}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Tip: Draw large, centered digits with a thick stroke for best results. The CNN was trained on centered 28x28 images.
          </p>
        </section>

        {/* Prediction result */}
        <div className="space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Prediction</h2>

            {loading ? (
              <div>
                <div className="h-16 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-3" />
              </div>
            ) : result ? (
              <div className="flex items-start gap-6">
                <div>
                  <p className="text-6xl font-bold text-accent-600">
                    {result.prediction}
                  </p>
                  <p className="text-gray-600 mt-2 text-lg">
                    {(result.confidence[result.prediction].probability * 100).toFixed(1)}%
                    <span className="text-sm text-gray-400 ml-1">confidence</span>
                  </p>
                </div>
                {result.image && (
                  <div className="border border-gray-200 rounded p-2">
                    <p className="text-[10px] text-gray-400 mb-1">What the CNN sees (28x28)</p>
                    <img
                      src={`data:image/png;base64,${result.image}`}
                      alt="Downsampled input"
                      width={84}
                      height={84}
                      style={{ imageRendering: "pixelated" }}
                      className="border border-gray-300 rounded"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400">Draw a digit and click &quot;Classify&quot;</p>
            )}
          </section>

          {/* Confidence chart */}
          {loading ? (
            <SkeletonBarChart />
          ) : result ? (
            <ConfidenceChart
              confidence={result.confidence}
              prediction={result.prediction}
            />
          ) : null}
        </div>
      </div>

      {/* Activations */}
      {result && result.activations && (
        <ActivationHeatmaps activations={result.activations} />
      )}
    </main>
  );
}
