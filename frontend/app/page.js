"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "./components/Header";
import ImageSection from "./components/ImageSection";
import PredictionSection from "./components/PredictionSection";
import ConfidenceChart from "./components/ConfidenceChart";
import ArchitectureDiagram from "./components/ArchitectureDiagram";
import ActivationHeatmaps from "./components/ActivationHeatmaps";
import WeightsSection from "./components/WeightsSection";
import { SkeletonHeatmapGrid, SkeletonBarChart } from "./components/SkeletonLoaders";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weights, setWeights] = useState(null);
  const [mode, setMode] = useState(null); // "browser" | "api" | null (detecting)
  const inferenceRef = useRef(null); // lazy-loaded browser inference module

  // Try to load browser inference; fall back to API
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const mod = await import("./lib/inference");
        await mod.loadModel();
        await mod.loadSamples();
        if (!cancelled) {
          inferenceRef.current = mod;
          setMode("browser");
        }
      } catch (err) {
        console.warn("Browser inference unavailable, falling back to API:", err);
        if (!cancelled) setMode("api");
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const fetchDigit = useCallback(async (digit = null) => {
    setLoading(true);
    setError(null);

    // Browser-side inference
    if (inferenceRef.current) {
      try {
        const data = await inferenceRef.current.randomPredict(digit);
        setResult(data);
      } catch {
        setError("Browser inference failed.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // API fallback
    try {
      let url = `${API_BASE}/api/random-predict`;
      if (digit !== null) {
        url += `?digit=${digit}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch {
      setError(
        "Could not reach the backend. Make sure the server is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch first digit once mode is determined
  useEffect(() => {
    if (mode) fetchDigit();
  }, [mode, fetchDigit]);

  // Fetch weights from API (optional — only works with backend)
  useEffect(() => {
    if (mode === "browser") return; // skip when running without backend
    if (!mode) return; // wait until mode is determined
    fetch(`${API_BASE}/api/weights`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setWeights(data.weights);
      })
      .catch(() => {}); // weights are optional, don't block on failure
  }, [mode]);

  return (
    <main className="max-w-7xl mx-auto px-2 sm:px-4 py-8 flex flex-col gap-6">
      <Header />

      {mode === "browser" && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-green-700 text-xs text-center">
          Running in-browser with TensorFlow.js — no backend needed
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center justify-between">
          <p className="text-sm">{error}</p>
          <button
            onClick={() => fetchDigit()}
            className="text-sm font-medium text-red-600 hover:text-red-800 underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Row 1: Input Image (left) + Prediction (right) */}
      <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-6 items-start">
        <ImageSection
          result={result}
          loading={loading}
          onFetchDigit={(d) => fetchDigit(d)}
          onFetchRandom={() => fetchDigit()}
        />
        <PredictionSection result={result} loading={loading} />
      </div>

      {/* Row 2: Architecture (full width) */}
      <ArchitectureDiagram />

      {/* Row 3: Confidence (full width) */}
      {loading && !result ? (
        <SkeletonBarChart />
      ) : result ? (
        <ConfidenceChart
          confidence={result.confidence}
          prediction={result.prediction}
        />
      ) : (
        <ConfidenceChart confidence={null} prediction={null} />
      )}

      {/* Layer-by-layer activations (full width) */}
      {loading && !result ? (
        <SkeletonHeatmapGrid />
      ) : loading && result ? (
        <ActivationHeatmaps activations={result.activations} />
      ) : result && result.activations ? (
        <ActivationHeatmaps activations={result.activations} />
      ) : error && !result ? (
        <section className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <p className="text-gray-400 font-medium">
            Could not load layer activations
          </p>
        </section>
      ) : null}

      <WeightsSection weights={weights} />
    </main>
  );
}
