"use client";

import { useRef, useEffect } from "react";
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
        const gray = data[i]; // R channel (grayscale, so R=G=B)
        const [r, g, b] = VIRIDIS_LUT[gray];
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        // alpha stays unchanged
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

/* ── Layer metadata for educational labels ── */
const layerMeta = {
  conv2d_1: {
    title: "Conv Layer 1 — Edge Detection",
    subtitle: "Low-level features at full resolution",
    explanation:
      "Each of the 8 filters is a learned 3x3 kernel that slides across the entire 28x28 input. At every position, it computes a weighted sum — producing a single number that says \"how strongly does this pattern match here?\" The result is a 26x26 map (smaller because the 3x3 filter can't extend beyond the edges).",
    notes: [
      "Bright yellow regions = strong match. The filter found the pattern it was trained to detect at that location.",
      "Dark purple regions = no match. That area of the image doesn't contain the feature this filter looks for.",
      "Each of the 8 maps responds to a different pattern — one filter might detect horizontal strokes, another might detect diagonal edges, another might respond to curved lines.",
      "These maps still clearly resemble the digit because the layer operates at full resolution (26x26 ≈ 28x28) — you're seeing the raw edge structure of the handwritten digit.",
    ],
  },
  maxpool_1: {
    title: "MaxPool 1 — Spatial Reduction",
    subtitle: "Downsampled to half resolution",
    explanation:
      "A 2x2 window slides across each of the 8 feature maps, keeping only the maximum value in each window. This halves both dimensions: 26x26 becomes 13x13. No new patterns are learned — pooling is a fixed operation.",
    notes: [
      "The digit shape is still recognizable, just coarser. Each pixel now represents a 2x2 region from the previous layer.",
      "By keeping only the max, the network becomes slightly translation-invariant — a feature shifted by 1 pixel still produces the same pooled output.",
      "Compare these maps to Conv Layer 1 above: same patterns, but at half the resolution. Details are smoothed out, structure is preserved.",
      "Pooling also reduces computation: the next conv layer processes 13x13 maps instead of 26x26 (4x fewer pixels per map).",
    ],
  },
  conv2d_2: {
    title: "Conv Layer 2 — Pattern Combination",
    subtitle: "Higher-level features at reduced resolution",
    explanation:
      "The second conv layer applies 8 new 3x3 filters, but now each filter has 8 input channels (one per Layer 1 feature map). So each filter learns to combine edge detections into higher-level patterns — detecting shapes like loops, T-junctions, or curve endpoints.",
    notes: [
      "The maps look blockier and more abstract than Layer 1 — this is expected and correct. The network is encoding what structural features exist, not reproducing the digit's appearance.",
      "Each filter has 3x3x8 = 72 learned weights (vs. 3x3x1 = 9 in Layer 1). It's detecting patterns-of-patterns: combinations of edges from the previous layer.",
      "The output is 11x11 pixels — when displayed at 64px, each source pixel maps to roughly 6 display pixels, which is why these look \"pixelated.\"",
      "Despite looking abstract to us, these representations are highly informative to the network. They capture the essential topology of each digit — which is why a '7' and a '1' produce very different maps here.",
    ],
  },
  maxpool_2: {
    title: "MaxPool 2 — Further Reduction",
    subtitle: "Compact 5x5 feature summaries",
    explanation:
      "Second 2x2 max pooling reduces 11x11 to 5x5. Each of the remaining 5x5x8 = 200 values will be flattened and fed to the dense layers. This is the bridge between spatial processing (convolutions) and abstract reasoning (dense layers).",
    notes: [
      "At just 5x5 pixels, each position has a large receptive field — it \"sees\" a substantial portion of the original 28x28 image.",
      "These 200 values (5 x 5 x 8 filters) are the complete spatial summary of the digit. Everything the dense layers know about the image comes from this compact representation.",
      "The pooling creates a fixed-size representation regardless of where exactly the digit was written in the image, which helps the network generalize across handwriting styles.",
      "After this layer, Flatten reshapes the 5x5x8 tensor into a 200-element 1D vector — no information is lost, just the 2D structure.",
    ],
  },
  dense_1: {
    title: "Dense Layer 1 — Feature Integration",
    subtitle: "128 neurons combining all spatial features",
    explanation:
      "Every one of the 200 flattened values is connected to every one of the 128 neurons (200 x 128 = 25,600 weights). Each neuron computes a weighted sum of all inputs, applies ReLU (zero out negatives), and outputs a single number.",
    notes: [
      "Tall bars (bright yellow) = strongly activated neurons. These neurons detected a feature combination highly relevant to the current digit.",
      "Zero-height bars = neurons suppressed by ReLU. Their weighted sum was negative, meaning the pattern they look for is absent in this digit.",
      "Unlike conv layers which preserve spatial structure, dense layers treat the input as a flat bag of features. A neuron can combine information from any spatial location.",
      "The sparsity pattern (which bars are tall vs. zero) is different for each digit — this is how the network builds digit-specific internal representations.",
      "Dropout (25%) was applied during training, randomly zeroing neurons to prevent co-adaptation. During inference (what you see here), all neurons are active.",
    ],
  },
  dense_2: {
    title: "Dense Layer 2 — Feature Compression",
    subtitle: "64 neurons, more abstract representation",
    explanation:
      "Compresses 128 features to 64 through another fully connected layer with ReLU. By this point, the network has distilled the image into a compact 64-dimensional code that captures the digit's identity while discarding irrelevant variations.",
    notes: [
      "Fewer active neurons than Dense Layer 1 — the representation is more selective. Only the features truly relevant for classification survive.",
      "Two images of the same digit (e.g., two different handwritten '3's) will produce similar activation patterns here, even if they looked quite different at the pixel level. This is the power of learned representations.",
      "The 64-to-10 connection in the next layer is essentially a learned lookup: \"given this 64-dimensional code, which digit is it?\"",
      "Stroke thickness, slant, size — these irrelevant variations have been progressively filtered out through the layers. What remains is the abstract structure of the digit.",
    ],
  },
  output: {
    title: "Output Layer — Classification",
    subtitle: "Probability for each digit 0-9",
    explanation:
      "The final layer has 10 neurons (one per digit). Each computes a weighted sum of the 64 inputs, producing a raw \"logit\" score. Softmax then converts these 10 scores into probabilities that sum to 1.0.",
    notes: [
      "The tallest bar is the predicted digit. Its height relative to others indicates confidence — a dominant bar means high certainty, similar heights mean the network is unsure.",
      "This is the same data shown in the confidence chart above, visualized differently. Here you see all 10 raw activation values; the chart shows the post-softmax percentages.",
      "Each neuron's 64 weights define what 64-dimensional code maps to that digit. The output neuron for '7' has learned that certain combinations of abstract features reliably indicate a seven.",
      "When the network misclassifies, you can trace back through the layers to see where the representation went wrong — which features were missing or misleading.",
    ],
  },
};

function getLayerLabel(layerName, shape) {
  const meta = layerMeta[layerName];
  if (meta) {
    const dims =
      shape.length === 3
        ? `${shape[0]}x${shape[1]}, ${shape[2]} filters`
        : `${shape[0]} units`;
    return { ...meta, dimensions: dims };
  }
  // Fallback for unknown layers
  return {
    title: layerName,
    subtitle: "",
    explanation: "",
    notes: [],
    dimensions: shape.join("x"),
  };
}

/* ── Vector activation bar strip ── */
function ActivationBarStrip({ values, label }) {
  const max = Math.max(...values);
  const digitLabels = label === "output" && values.length === 10;

  return (
    <div>
      <div className="flex items-end gap-px" style={{ height: 80 }}>
        {values.map((v, i) => {
          const h = max > 0 ? (v / max) * 100 : 0;
          // Viridis-inspired coloring: map value to LUT index
          const lutIdx = max > 0 ? Math.round((v / max) * 255) : 0;
          const [r, g, b] = VIRIDIS_LUT[lutIdx];
          return (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${h}%`,
                backgroundColor: `rgb(${r},${g},${b})`,
                minWidth: 1,
              }}
              title={`${digitLabels ? `Digit ${i}: ` : `Neuron ${i}: `}${v.toFixed(4)}`}
            />
          );
        })}
      </div>
      {digitLabels && (
        <div className="flex gap-px mt-1">
          {values.map((_, i) => (
            <div
              key={i}
              className="flex-1 text-center text-[9px] text-gray-400 font-mono"
            >
              {i}
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-between text-[9px] text-gray-300 mt-1">
        <span>{values.length} neurons</span>
        <span>max: {max.toFixed(3)}</span>
      </div>
    </div>
  );
}

/* ── Feature map grid (conv and pool layers) ── */
function FeatureMapGrid({ maps }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {maps.map((mapBase64, mapIdx) => (
        <ViridisCanvas key={mapIdx} base64={mapBase64} size={64} />
      ))}
    </div>
  );
}

/* ── Main component ── */
export default function ActivationHeatmaps({ activations }) {
  if (!activations || activations.length === 0) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Layer-by-Layer Activations</h2>
      <p className="text-sm text-gray-400 -mt-4">
        Watch the data transform as it flows through each layer of the network
      </p>

      {activations.map((layer, idx) => {
        const label = getLayerLabel(layer.layer_name, layer.shape);
        const isFeatureMap = layer.type === "feature_map";
        const isVector = layer.type === "vector";

        return (
          <section
            key={idx}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-600 text-white flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold">{label.title}</h3>
                  <span className="text-xs font-mono text-gray-400">
                    {label.dimensions}
                  </span>
                </div>
              </div>
              {label.subtitle && (
                <p className="text-sm text-accent-600 font-medium mt-0.5 ml-8">
                  {label.subtitle}
                </p>
              )}
            </div>

            {isFeatureMap && <FeatureMapGrid maps={layer.maps} />}
            {isVector && (
              <ActivationBarStrip
                values={layer.values}
                label={layer.layer_name}
              />
            )}

            {label.explanation && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-500 leading-relaxed">
                  {label.explanation}
                </p>
                {label.notes && label.notes.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {label.notes.map((note, ni) => (
                      <li
                        key={ni}
                        className="text-xs text-gray-400 leading-relaxed flex gap-2"
                      >
                        <span className="text-gray-300 flex-shrink-0 mt-0.5">&#8226;</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
