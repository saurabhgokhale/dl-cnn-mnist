"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import ImageSection from "./components/ImageSection";
import PredictionSection from "./components/PredictionSection";
import ActivationsPlaceholder from "./components/ActivationsPlaceholder";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDigit = useCallback(async (digit = null) => {
    setLoading(true);
    setError(null);

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
    } catch (err) {
      setError(
        "Could not reach the backend. Make sure the server is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDigit();
  }, [fetchDigit]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      <Header />

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

      <ImageSection
        result={result}
        loading={loading}
        onFetchDigit={(d) => fetchDigit(d)}
        onFetchRandom={() => fetchDigit()}
      />

      <PredictionSection result={result} />

      <ActivationsPlaceholder />
    </main>
  );
}
