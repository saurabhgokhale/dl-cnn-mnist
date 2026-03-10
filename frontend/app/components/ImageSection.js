export default function ImageSection({ result, loading, onFetchDigit, onFetchRandom }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Input Image</h2>

      {/* Digit buttons 0-9 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {Array.from({ length: 10 }, (_, i) => i).map((digit) => (
          <button
            key={digit}
            onClick={() => onFetchDigit(digit)}
            disabled={loading}
            className="w-10 h-10 rounded-lg bg-accent-100 text-accent-700 font-semibold hover:bg-accent-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {digit}
          </button>
        ))}
      </div>

      {/* Random button */}
      <button
        onClick={onFetchRandom}
        disabled={loading}
        className="flex items-center gap-2 bg-accent-600 text-white px-6 py-2 rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-5"
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        Pick Random Digit
      </button>

      {/* MNIST image display */}
      {result && (
        <div className="mt-2">
          <img
            src={`data:image/png;base64,${result.image}`}
            alt={`Handwritten digit ${result.true_label}`}
            width={180}
            height={180}
            className="border border-gray-300 rounded"
            style={{ imageRendering: "pixelated" }}
          />
          <p className="text-sm text-gray-600 font-medium mt-2">
            True label: {result.true_label}
          </p>
        </div>
      )}

      {/* Explanatory tooltip */}
      <details className="mt-4">
        <summary className="text-sm text-accent-600 cursor-pointer">
          What am I seeing?
        </summary>
        <p className="text-sm text-gray-500 mt-1">
          This is a 28x28 pixel handwritten digit from the MNIST dataset, scaled
          up to 180px to show the pixel grid. Each pixel is a grayscale value
          from 0 (black) to 255 (white).
        </p>
      </details>
    </section>
  );
}
