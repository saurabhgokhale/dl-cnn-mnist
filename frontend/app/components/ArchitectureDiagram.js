"use client";

import { useState } from "react";

const layers = [
  { name: "Input", shape: "28x28x1", type: "input", desc: "Raw grayscale image — each pixel is a value from 0 (black) to 1 (white)" },
  { name: "Conv2D", shape: "26x26x8", type: "conv", desc: "8 learned 3x3 filters slide across the image detecting edges, curves, and corners" },
  { name: "MaxPool", shape: "13x13x8", type: "pool", desc: "2x2 max pooling halves spatial dimensions, keeping strongest activations" },
  { name: "Conv2D", shape: "11x11x8", type: "conv", desc: "Second convolution detects higher-level patterns composed of earlier features" },
  { name: "MaxPool", shape: "5x5x8", type: "pool", desc: "Further 2x2 pooling reduces to 5x5, creating compact feature summaries" },
  { name: "Dense", shape: "128", type: "dense", desc: "Fully connected layer combines spatial features into 128-dimensional representation" },
  { name: "Dense", shape: "64", type: "dense", desc: "Further compression to 64 dimensions, learning the most discriminative combinations" },
  { name: "Output", shape: "10", type: "output", desc: "Softmax produces a probability for each digit 0-9, summing to 1.0" },
];

const nodeColors = {
  input:  { fill: "#86efac", stroke: "#16a34a" },
  conv:   { fill: "#93c5fd", stroke: "#2563eb" },
  pool:   { fill: "#a5b4fc", stroke: "#4f46e5" },
  dense:  { fill: "#c4b5fd", stroke: "#7c3aed" },
  output: { fill: "#fdba74", stroke: "#ea580c" },
};

// Visible node counts per layer (representative, not actual)
const nodeCounts = [6, 8, 6, 8, 5, 7, 5, 4];

function NetworkNodesSVG() {
  const nodeR = 7;
  const nodeGap = 20;
  const layerGap = 62;
  const startX = 40;
  const maxNodes = Math.max(...nodeCounts);
  const totalH = maxNodes * nodeGap + 30;

  const layerPositions = layers.map((layer, li) => {
    const x = startX + li * layerGap;
    const count = nodeCounts[li];
    const totalLayerH = (count - 1) * nodeGap;
    const offsetY = (totalH - 30 - totalLayerH) / 2 + 10;
    const nodes = Array.from({ length: count }, (_, ni) => ({
      x,
      y: offsetY + ni * nodeGap,
    }));
    return { ...layer, x, nodes };
  });

  const totalW = startX + (layers.length - 1) * layerGap + 40;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH + 20}`}
      width="100%"
      style={{ maxWidth: 560 }}
      className="mx-auto"
      role="img"
      aria-label="Neural network node diagram"
    >
      {/* Connections */}
      {layerPositions.map((layer, li) => {
        if (li === 0) return null;
        const prev = layerPositions[li - 1];
        return prev.nodes.flatMap((pn, pi) =>
          layer.nodes.map((nn, ni) => (
            <line
              key={`c-${li}-${pi}-${ni}`}
              x1={pn.x + nodeR}
              y1={pn.y}
              x2={nn.x - nodeR}
              y2={nn.y}
              stroke="#d1d5db"
              strokeWidth="0.4"
              opacity="0.4"
            />
          ))
        );
      })}

      {/* Nodes */}
      {layerPositions.map((layer, li) => {
        const c = nodeColors[layer.type];
        return layer.nodes.map((n, ni) => (
          <circle
            key={`n-${li}-${ni}`}
            cx={n.x}
            cy={n.y}
            r={nodeR}
            fill={c.fill}
            stroke={c.stroke}
            strokeWidth="1.2"
          />
        ));
      })}

      {/* Ellipsis */}
      {layerPositions.map((layer, li) => {
        if (nodeCounts[li] >= 5) {
          const lastNode = layer.nodes[layer.nodes.length - 1];
          return (
            <text
              key={`dots-${li}`}
              x={layer.x}
              y={lastNode.y + 16}
              textAnchor="middle"
              fontSize="11"
              fill={nodeColors[layer.type].stroke}
              fontWeight="bold"
            >
              ...
            </text>
          );
        }
        return null;
      })}

      {/* Labels */}
      {layerPositions.map((layer, li) => (
        <g key={`lbl-${li}`}>
          <text
            x={layer.x}
            y={totalH + 4}
            textAnchor="middle"
            fontSize="8"
            fontWeight="600"
            fill="#374151"
            fontFamily="inherit"
          >
            {layer.name}
          </text>
          <text
            x={layer.x}
            y={totalH + 14}
            textAnchor="middle"
            fontSize="7"
            fill="#9ca3af"
            fontFamily="monospace"
          >
            {layer.shape}
          </text>
        </g>
      ))}
    </svg>
  );
}

// Simple box flowchart (the compact view)
const BOX_W = 80;
const BOX_H = 55;
const GAP = 25;
const TOTAL_W = layers.length * BOX_W + (layers.length - 1) * GAP;
const TOTAL_H = 70;

function BoxFlowchart() {
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="CNN architecture diagram showing 8 layers from Input to Output"
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#9ca3af" />
        </marker>
      </defs>

      {layers.map((layer, i) => {
        const x = i * (BOX_W + GAP);
        const y = (TOTAL_H - BOX_H) / 2;
        const isConv = layer.type === "conv";

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={BOX_W}
              height={BOX_H}
              rx={6}
              fill={isConv ? "#dbeafe" : "#f9fafb"}
              stroke={isConv ? "#2563eb" : "#d1d5db"}
              strokeWidth={1.5}
            />
            <text x={x + BOX_W / 2} y={y + 22} textAnchor="middle" fontSize="11" fontWeight="600" fill="#1f2937">
              {layer.name}
            </text>
            <text x={x + BOX_W / 2} y={y + 38} textAnchor="middle" fontSize="9" fill="#6b7280">
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
  );
}

export default function ArchitectureDiagram() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Network Architecture</h2>

      {/* Compact box flowchart — always visible */}
      <BoxFlowchart />
      <p className="text-xs text-gray-400 mt-3 text-center">
        Data flows left to right through the network layers
      </p>

      {/* Expandable detail section */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors mx-auto"
        >
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? "Hide" : "Show"} detailed network view
        </button>

        {expanded && (
          <div className="mt-5 space-y-5">
            {/* Node diagram */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Neuron connections between layers
              </h3>
              <NetworkNodesSVG />
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
                {[
                  { color: "#86efac", label: "Input" },
                  { color: "#93c5fd", label: "Conv" },
                  { color: "#a5b4fc", label: "Pool" },
                  { color: "#c4b5fd", label: "Dense" },
                  { color: "#fdba74", label: "Output" },
                ].map((item) => (
                  <span key={item.label} className="flex items-center gap-1">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Layer-by-layer detail table */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Layer-by-layer breakdown
              </h3>
              <div className="space-y-2">
                {layers.map((layer, i) => {
                  const c = nodeColors[layer.type];
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border px-4 py-3"
                      style={{ borderColor: c.stroke + "40", backgroundColor: c.fill + "18" }}
                    >
                      <div className="flex-shrink-0 flex items-center gap-2 min-w-[130px]">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: c.fill, border: `1.5px solid ${c.stroke}` }}
                        />
                        <span className="font-semibold text-sm text-gray-800">{layer.name}</span>
                        <span className="font-mono text-xs text-gray-400">{layer.shape}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{layer.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary stats */}
            <div className="flex flex-wrap gap-4 justify-center text-center">
              {[
                { label: "Total Parameters", value: "35,298" },
                { label: "Conv Layers", value: "2" },
                { label: "Dense Layers", value: "3" },
                { label: "Model Size", value: "462.5 KB" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 min-w-[120px]"
                >
                  <div className="text-lg font-bold text-gray-800">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
