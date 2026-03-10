"use client";

import { useState, useRef, useEffect } from "react";
import { VIRIDIS_LUT } from "../lib/viridis";

function ViridisCanvas({ base64, size = 64 }) {
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

/* ── Dense weight matrix heatmap ── */
function WeightMatrixCanvas({ base64, displayWidth = 200, displayHeight = 100 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!base64 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = "data:image/png;base64," + base64;

    img.onload = () => {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
      const imageData = ctx.getImageData(0, 0, displayWidth, displayHeight);
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
  }, [base64, displayWidth, displayHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={displayWidth}
      height={displayHeight}
      className="rounded border border-gray-200"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

/* ── Bias bar visualization ── */
function BiasBar({ biases }) {
  if (!biases || biases.length === 0) return null;
  const max = Math.max(...biases.map(Math.abs));

  return (
    <div>
      <div className="text-[10px] text-gray-400 mb-1">
        Biases ({biases.length})
      </div>
      <div className="flex items-center gap-px h-6">
        {biases.map((v, i) => {
          const normalized = max > 0 ? (v + max) / (2 * max) : 0.5;
          const lutIdx = Math.round(normalized * 255);
          const [r, g, b] = VIRIDIS_LUT[lutIdx];
          return (
            <div
              key={i}
              className="flex-1 h-full rounded-sm"
              style={{ backgroundColor: `rgb(${r},${g},${b})`, minWidth: 1 }}
              title={`Bias ${i}: ${v.toFixed(4)}`}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── Backpropagation diagram ── */
function BackpropDiagram() {
  const boxW = 120;
  const boxH = 44;
  const gap = 60;
  const totalW = 3 * boxW + 2 * gap;
  const totalH = boxH + 100;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      width="100%"
      style={{ maxWidth: 520 }}
      className="mx-auto"
    >
      <defs>
        <marker id="arrowFwd" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#2563eb" />
        </marker>
        <marker id="arrowBack" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto">
          <path d="M8,0 L0,3 L8,6 Z" fill="#dc2626" />
        </marker>
      </defs>

      {/* Forward pass arrows (top) */}
      <line x1={boxW + 4} y1={boxH / 2} x2={boxW + gap - 4} y2={boxH / 2}
        stroke="#2563eb" strokeWidth="1.5" markerEnd="url(#arrowFwd)" />
      <line x1={2 * boxW + gap + 4} y1={boxH / 2} x2={2 * boxW + 2 * gap - 4} y2={boxH / 2}
        stroke="#2563eb" strokeWidth="1.5" markerEnd="url(#arrowFwd)" />

      {/* Forward label */}
      <text x={totalW / 2} y={boxH / 2 - 10} textAnchor="middle" fontSize="9" fill="#2563eb" fontWeight="600">
        Forward Pass (compute predictions)
      </text>

      {/* Boxes */}
      {[
        { x: 0, label: "Input", sub: "image data" },
        { x: boxW + gap, label: "Hidden Layers", sub: "weights x inputs + bias" },
        { x: 2 * (boxW + gap), label: "Loss", sub: "predicted vs actual" },
      ].map((box, i) => (
        <g key={i}>
          <rect x={box.x} y={0} width={boxW} height={boxH} rx={6}
            fill={i === 2 ? "#fef2f2" : "#f0f9ff"} stroke={i === 2 ? "#dc2626" : "#2563eb"} strokeWidth="1.5" />
          <text x={box.x + boxW / 2} y={18} textAnchor="middle" fontSize="11" fontWeight="600"
            fill={i === 2 ? "#991b1b" : "#1e40af"}>
            {box.label}
          </text>
          <text x={box.x + boxW / 2} y={33} textAnchor="middle" fontSize="8" fill="#6b7280">
            {box.sub}
          </text>
        </g>
      ))}

      {/* Backward pass arrows (bottom) */}
      <line x1={2 * boxW + 2 * gap - 4} y1={boxH + 30} x2={boxW + gap + boxW + 4} y2={boxH + 30}
        stroke="#dc2626" strokeWidth="1.5" markerEnd="url(#arrowBack)" />
      <line x1={boxW + gap - 4} y1={boxH + 30} x2={boxW + 4} y2={boxH + 30}
        stroke="#dc2626" strokeWidth="1.5" markerEnd="url(#arrowBack)" />

      {/* Backward label */}
      <text x={totalW / 2} y={boxH + 48} textAnchor="middle" fontSize="9" fill="#dc2626" fontWeight="600">
        Backward Pass (compute gradients)
      </text>

      {/* Weight update */}
      <rect x={boxW + gap + 10} y={boxH + 58} width={boxW - 20} height={30} rx={4}
        fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
      <text x={boxW + gap + boxW / 2} y={boxH + 77} textAnchor="middle" fontSize="9" fontWeight="600" fill="#15803d">
        Update Weights
      </text>

      {/* Arrow from gradient to weight update */}
      <line x1={boxW + gap + boxW / 2} y1={boxH + 36} x2={boxW + gap + boxW / 2} y2={boxH + 56}
        stroke="#16a34a" strokeWidth="1" strokeDasharray="3 2" />

      {/* Formula */}
      <text x={totalW / 2} y={totalH - 4} textAnchor="middle" fontSize="8" fill="#6b7280" fontFamily="monospace">
        w_new = w_old - learning_rate x gradient
      </text>
    </svg>
  );
}

/* ── Weight info for each layer ── */
const weightMeta = {
  conv2d_1: {
    title: "Conv Layer 1 Filters",
    subtitle: "8 learned 3x3 kernels",
    explanation:
      "These are the actual weight values learned during training. Each 3x3 filter detects a specific pattern. Bright yellow = strong positive weight (amplifies that pixel), dark purple = strong negative weight (suppresses it). During backpropagation, the gradient of the loss tells each weight how much to increase or decrease.",
  },
  conv2d_2: {
    title: "Conv Layer 2 Filters",
    subtitle: "8 filters, averaged across 8 input channels",
    explanation:
      "Each filter here has 3x3x8 weights (one 3x3 kernel per input channel from Layer 1). Shown as the average across all 8 channels. These learn to combine Layer 1's edge features into higher-level patterns.",
  },
  dense_1: {
    title: "Dense Layer 1 Weights",
    subtitle: "200 inputs x 128 outputs = 25,600 weights",
    explanation:
      "Each column represents one neuron's connection weights to all 200 inputs (the flattened feature maps). Bright streaks show which spatial features a neuron responds to. This is the largest weight matrix in the network.",
  },
  dense_2: {
    title: "Dense Layer 2 Weights",
    subtitle: "128 inputs x 64 outputs = 8,192 weights",
    explanation:
      "Compresses 128 features to 64. Each column is a unique weighted combination of the previous layer's neurons. The patterns become increasingly abstract and digit-specific.",
  },
  output: {
    title: "Output Layer Weights",
    subtitle: "64 inputs x 10 outputs = 640 weights",
    explanation:
      "The final weight matrix. Each of the 10 columns represents what feature combination triggers a specific digit prediction. Column 0 = weights for predicting '0', column 9 = weights for predicting '9'.",
  },
};

export default function WeightsSection({ weights }) {
  const [expanded, setExpanded] = useState(false);

  if (!weights || weights.length === 0) return null;

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-semibold text-left">
            Trained Weights & Backpropagation
          </h2>
          <p className="text-sm text-gray-400 text-left">
            The learned parameters that make the network work
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-6 space-y-8">
          {/* Backpropagation explanation */}
          <div className="bg-gray-50 rounded-lg border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              How the network learns: Backpropagation
            </h3>
            <BackpropDiagram />
            <div className="mt-4 space-y-2 text-sm text-gray-600 leading-relaxed">
              <p>
                <strong>1. Forward pass:</strong> An image flows through the
                network. Each layer multiplies its inputs by weights, adds biases,
                and passes the result forward. The final layer outputs 10
                probabilities.
              </p>
              <p>
                <strong>2. Loss calculation:</strong> The network's prediction is
                compared to the true label. The <em>loss function</em> (categorical
                cross-entropy) quantifies how wrong the prediction was.
              </p>
              <p>
                <strong>3. Backward pass:</strong> The loss is propagated backward
                through every layer using the <em>chain rule</em> of calculus. Each
                weight receives a <em>gradient</em> — a number telling it which
                direction to change and by how much.
              </p>
              <p>
                <strong>4. Weight update:</strong> Each weight is nudged in the
                direction that reduces the loss:{" "}
                <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">
                  w = w - lr * gradient
                </code>
                . After thousands of images, the weights converge to values that
                classify digits accurately.
              </p>
            </div>
          </div>

          {/* Trained weights visualization */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
              Trained weight values by layer
            </h3>
            <div className="space-y-5">
              {weights.map((w, idx) => {
                const meta = weightMeta[w.layer_name] || {
                  title: w.layer_name,
                  subtitle: "",
                  explanation: "",
                };

                return (
                  <div
                    key={idx}
                    className="border border-gray-100 rounded-lg p-4"
                  >
                    <div className="mb-3">
                      <h4 className="font-semibold text-sm">
                        {meta.title}
                      </h4>
                      {meta.subtitle && (
                        <p className="text-xs text-gray-400">{meta.subtitle}</p>
                      )}
                    </div>

                    {w.type === "conv_filters" && (
                      <div>
                        <div className="flex gap-2 flex-wrap">
                          {w.filters.map((f, fi) => (
                            <div key={fi} className="text-center">
                              <ViridisCanvas base64={f} size={48} />
                              <div className="text-[9px] text-gray-300 mt-0.5">
                                F{fi + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                        <BiasBar biases={w.biases} />
                      </div>
                    )}

                    {w.type === "dense_matrix" && (
                      <div>
                        <WeightMatrixCanvas
                          base64={w.matrix}
                          displayWidth={Math.min(w.shape[1] * 2, 280)}
                          displayHeight={Math.min(w.shape[0], 120)}
                        />
                        <div className="flex gap-4 mt-1 text-[9px] text-gray-300">
                          <span>{w.shape[0]} inputs (rows)</span>
                          <span>{w.shape[1]} outputs (columns)</span>
                        </div>
                        <BiasBar biases={w.biases} />
                      </div>
                    )}

                    {meta.explanation && (
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                        {meta.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Viridis legend */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <span>Low / negative</span>
            <div
              className="h-3 w-32 rounded"
              style={{
                background:
                  "linear-gradient(to right, rgb(68,1,84), rgb(59,82,139), rgb(33,145,140), rgb(94,201,98), rgb(253,231,37))",
              }}
            />
            <span>High / positive</span>
          </div>
        </div>
      )}
    </section>
  );
}
