export default function PredictionSection({ result, loading }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Prediction</h2>

      {loading && !result ? (
        <div>
          <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-2" />
        </div>
      ) : result ? (
        <div>
          <p className="text-4xl font-bold text-accent-600">
            {result.prediction}
          </p>
          <p className="text-gray-600 mt-1">
            Confidence:{" "}
            {(result.confidence[result.prediction].probability * 100).toFixed(1)}
            %
          </p>

          <details className="mt-4">
            <summary className="text-sm text-accent-600 cursor-pointer">
              What am I seeing?
            </summary>
            <p className="text-sm text-gray-500 mt-1">
              The CNN analyzed the pixel patterns in the image and predicted
              which digit (0-9) it most likely represents. The confidence
              percentage shows how certain the model is about its prediction.
            </p>
          </details>
        </div>
      ) : (
        <p className="text-gray-400">
          Select a digit above to see the prediction
        </p>
      )}
    </section>
  );
}
