"use client";

const layers = [
  { name: "Input", shape: "28x28x1", type: "input" },
  { name: "Conv2D", shape: "26x26x8", type: "conv" },
  { name: "MaxPool", shape: "13x13x8", type: "pool" },
  { name: "Conv2D", shape: "11x11x8", type: "conv" },
  { name: "MaxPool", shape: "5x5x8", type: "pool" },
  { name: "Dense", shape: "128", type: "dense" },
  { name: "Dense", shape: "64", type: "dense" },
  { name: "Output", shape: "10", type: "output" },
];

const BOX_W = 80;
const BOX_H = 55;
const GAP = 25;
const TOTAL_W = layers.length * BOX_W + (layers.length - 1) * GAP;
const TOTAL_H = 70;

function getBoxStyle(type, activeLayer, name) {
  const isActive = activeLayer && activeLayer === name;
  if (type === "conv" || isActive) {
    return { fill: "#dbeafe", stroke: "#2563eb", strokeWidth: isActive ? 2.5 : 1.5 };
  }
  return { fill: "#f9fafb", stroke: "#d1d5db", strokeWidth: 1.5 };
}

export default function ArchitectureDiagram({ activeLayer }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Network Architecture</h2>
      <svg
        width="100%"
        viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="CNN architecture diagram showing 8 layers from Input to Output"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L8,3 L0,6 Z" fill="#9ca3af" />
          </marker>
        </defs>

        {layers.map((layer, i) => {
          const x = i * (BOX_W + GAP);
          const y = (TOTAL_H - BOX_H) / 2;
          const style = getBoxStyle(layer.type, activeLayer, layer.name);

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={BOX_W}
                height={BOX_H}
                rx={6}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
              />
              <text
                x={x + BOX_W / 2}
                y={y + 22}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#1f2937"
              >
                {layer.name}
              </text>
              <text
                x={x + BOX_W / 2}
                y={y + 38}
                textAnchor="middle"
                fontSize="9"
                fill="#6b7280"
              >
                {layer.shape}
              </text>

              {i < layers.length - 1 && (
                <line
                  x1={x + BOX_W + 2}
                  y1={TOTAL_H / 2}
                  x2={x + BOX_W + GAP - 2}
                  y2={TOTAL_H / 2}
                  stroke="#9ca3af"
                  strokeWidth={1.5}
                  markerEnd="url(#arrowhead)"
                />
              )}
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-gray-400 mt-3 text-center">
        Data flows left to right through the network layers
      </p>
    </section>
  );
}
