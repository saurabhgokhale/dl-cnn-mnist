export default function ActivationsPlaceholder() {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Layer Activations</h2>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-400 font-medium">
          CNN layer visualizations coming in Phase 4
        </p>
        <p className="text-sm text-gray-400 mt-2">
          You will see how each convolutional layer transforms the input image,
          revealing the features the network learns to detect.
        </p>
      </div>
    </section>
  );
}
