export function SkeletonHeatmapGrid() {
  const sections = [
    "Conv Layer 1",
    "Conv Layer 2",
  ];

  return (
    <div className="space-y-6">
      {sections.map((label) => (
        <section
          key={label}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-16 h-16 bg-gray-200 rounded animate-pulse"
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function SkeletonBarChart() {
  const heights = [30, 15, 20, 10, 25, 12, 8, 65, 18, 22];

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Confidence</h2>
      <div className="h-[280px] flex items-end gap-2">
        {heights.map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-200 rounded-t animate-pulse"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </section>
  );
}
