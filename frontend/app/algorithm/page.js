import Link from "next/link";

export const metadata = {
  title: "CNN Algorithm - MNIST CNN Visualizer",
  description: "How the CNN algorithm works and the steps in this project",
};

/* ── Pixel Grid Diagram ── */
// Simulated 7x7 region of a digit "7" to show pixel-to-number mapping
const pixelValues = [
  [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  [0.0, 0.9, 0.9, 0.9, 0.9, 0.9, 0.0],
  [0.0, 0.0, 0.0, 0.0, 0.0, 0.8, 0.0],
  [0.0, 0.0, 0.0, 0.0, 0.7, 0.1, 0.0],
  [0.0, 0.0, 0.0, 0.6, 0.0, 0.0, 0.0],
  [0.0, 0.0, 0.5, 0.1, 0.0, 0.0, 0.0],
  [0.0, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0],
];

function PixelGridDiagram() {
  const cellSize = 44;
  const gap = 2;
  const totalCell = cellSize + gap;
  const cols = 7;
  const rows = 7;
  const gridW = cols * totalCell;
  const gridH = rows * totalCell;
  // spacing between pixel grid and number grid
  const midGap = 60;
  const numGridX = gridW + midGap;
  const totalW = numGridX + gridW;

  return (
    <div className="my-6">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        How a computer sees an image: pixels become numbers
      </h4>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalW + 20} ${gridH + 40}`}
          width="100%"
          style={{ maxWidth: 580 }}
          className="mx-auto"
        >
          {/* Labels */}
          <text x={gridW / 2} y={gridH + 30} textAnchor="middle" fontSize="11" fill="#6b7280" fontFamily="inherit">
            Grayscale pixels
          </text>
          <text x={numGridX + gridW / 2} y={gridH + 30} textAnchor="middle" fontSize="11" fill="#6b7280" fontFamily="inherit">
            Pixel values (0-1)
          </text>

          {/* Arrow */}
          <defs>
            <marker id="arrowPx" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6 Z" fill="#9ca3af" />
            </marker>
          </defs>
          <line
            x1={gridW + 8}
            y1={gridH / 2}
            x2={numGridX - 8}
            y2={gridH / 2}
            stroke="#9ca3af"
            strokeWidth="1.5"
            markerEnd="url(#arrowPx)"
          />

          {/* Pixel grid (grayscale) */}
          {pixelValues.map((row, r) =>
            row.map((v, c) => {
              const shade = Math.round(v * 255);
              return (
                <rect
                  key={`p-${r}-${c}`}
                  x={c * totalCell}
                  y={r * totalCell}
                  width={cellSize}
                  height={cellSize}
                  rx="3"
                  fill={`rgb(${shade},${shade},${shade})`}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              );
            })
          )}

          {/* Number grid */}
          {pixelValues.map((row, r) =>
            row.map((v, c) => {
              const bg = v > 0.3 ? "#dbeafe" : "#f9fafb";
              return (
                <g key={`n-${r}-${c}`}>
                  <rect
                    x={numGridX + c * totalCell}
                    y={r * totalCell}
                    width={cellSize}
                    height={cellSize}
                    rx="3"
                    fill={bg}
                    stroke="#d1d5db"
                    strokeWidth="1"
                  />
                  <text
                    x={numGridX + c * totalCell + cellSize / 2}
                    y={r * totalCell + cellSize / 2 + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="monospace"
                    fill={v > 0.3 ? "#1e40af" : "#9ca3af"}
                    fontWeight={v > 0.3 ? "600" : "400"}
                  >
                    {v.toFixed(1)}
                  </text>
                </g>
              );
            })
          )}
        </svg>
      </div>
      <p className="text-xs text-gray-400 text-center mt-2">
        Each pixel is a number between 0 (black) and 1 (white). The CNN processes these numbers, not the visual image.
      </p>
    </div>
  );
}

/* ── Convolution Operation Diagram ── */
function ConvolutionDiagram() {
  // 5x5 input with a 3x3 filter highlighted at position (1,1)
  const input = [
    [0.0, 0.0, 0.8, 0.9, 0.0],
    [0.0, 0.7, 0.9, 0.2, 0.0],
    [0.6, 0.9, 0.3, 0.0, 0.0],
    [0.8, 0.4, 0.0, 0.0, 0.0],
    [0.1, 0.0, 0.0, 0.0, 0.0],
  ];
  const filter = [
    [1, 0, -1],
    [1, 0, -1],
    [1, 0, -1],
  ];
  // Convolution result at highlighted position
  const resultVal = "1.4";

  const cs = 38; // cell size
  const g = 2;
  const tc = cs + g;
  const filterX = 0;
  const filterY = 0;
  // positions in the 5x5 to highlight (row 1-3, col 1-3)
  const highlightR = 1;
  const highlightC = 1;

  const inputX = 0;
  const filterStartX = 5 * tc + 60;
  const outputX = filterStartX + 3 * tc + 60;

  return (
    <div className="my-6">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        How convolution works: filter slides across the image
      </h4>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${outputX + 3 * tc + 20} ${5 * tc + 40}`}
          width="100%"
          style={{ maxWidth: 620 }}
          className="mx-auto"
        >
          <defs>
            <marker id="arrowConv" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6 Z" fill="#9ca3af" />
            </marker>
          </defs>

          {/* Input 5x5 */}
          <text x={inputX + (5 * tc) / 2} y={5 * tc + 30} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="inherit">
            Input (5x5 region)
          </text>
          {input.map((row, r) =>
            row.map((v, c) => {
              const inHighlight =
                r >= highlightR && r < highlightR + 3 && c >= highlightC && c < highlightC + 3;
              return (
                <g key={`i-${r}-${c}`}>
                  <rect
                    x={inputX + c * tc}
                    y={r * tc}
                    width={cs}
                    height={cs}
                    rx="2"
                    fill={inHighlight ? "#dbeafe" : "#f9fafb"}
                    stroke={inHighlight ? "#2563eb" : "#d1d5db"}
                    strokeWidth={inHighlight ? "2" : "1"}
                  />
                  <text
                    x={inputX + c * tc + cs / 2}
                    y={r * tc + cs / 2 + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="monospace"
                    fill={inHighlight ? "#1e40af" : "#9ca3af"}
                  >
                    {v.toFixed(1)}
                  </text>
                </g>
              );
            })
          )}
          {/* Highlight border */}
          <rect
            x={inputX + highlightC * tc - 1}
            y={highlightR * tc - 1}
            width={3 * tc + 2}
            height={3 * tc + 2}
            rx="3"
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeDasharray="6 3"
          />

          {/* Arrow input -> filter */}
          <line
            x1={inputX + 5 * tc + 10}
            y1={(5 * tc) / 2}
            x2={filterStartX - 10}
            y2={(5 * tc) / 2}
            stroke="#9ca3af"
            strokeWidth="1.5"
            markerEnd="url(#arrowConv)"
          />
          <text
            x={(inputX + 5 * tc + filterStartX) / 2}
            y={(5 * tc) / 2 - 10}
            textAnchor="middle"
            fontSize="9"
            fill="#9ca3af"
            fontFamily="inherit"
          >
            multiply &amp; sum
          </text>

          {/* Filter 3x3 */}
          <text x={filterStartX + (3 * tc) / 2} y={5 * tc + 30} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="inherit">
            Filter (3x3 kernel)
          </text>
          {filter.map((row, r) =>
            row.map((v, c) => (
              <g key={`f-${r}-${c}`}>
                <rect
                  x={filterStartX + c * tc}
                  y={tc + r * tc}
                  width={cs}
                  height={cs}
                  rx="2"
                  fill={v > 0 ? "#dcfce7" : v < 0 ? "#fef2f2" : "#f9fafb"}
                  stroke={v > 0 ? "#16a34a" : v < 0 ? "#dc2626" : "#d1d5db"}
                  strokeWidth="1.5"
                />
                <text
                  x={filterStartX + c * tc + cs / 2}
                  y={tc + r * tc + cs / 2 + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="600"
                  fill={v > 0 ? "#15803d" : v < 0 ? "#b91c1c" : "#9ca3af"}
                >
                  {v > 0 ? `+${v}` : v}
                </text>
              </g>
            ))
          )}

          {/* Arrow filter -> output */}
          <line
            x1={filterStartX + 3 * tc + 10}
            y1={(5 * tc) / 2}
            x2={outputX - 10}
            y2={(5 * tc) / 2}
            stroke="#9ca3af"
            strokeWidth="1.5"
            markerEnd="url(#arrowConv)"
          />
          <text
            x={(filterStartX + 3 * tc + outputX) / 2}
            y={(5 * tc) / 2 - 10}
            textAnchor="middle"
            fontSize="9"
            fill="#9ca3af"
            fontFamily="inherit"
          >
            = result
          </text>

          {/* Output 3x3 */}
          <text x={outputX + (3 * tc) / 2} y={5 * tc + 30} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="inherit">
            Feature map (output)
          </text>
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => {
              const isActive = r === 0 && c === 0;
              return (
                <g key={`o-${r}-${c}`}>
                  <rect
                    x={outputX + c * tc}
                    y={tc + r * tc}
                    width={cs}
                    height={cs}
                    rx="2"
                    fill={isActive ? "#fef3c7" : "#f9fafb"}
                    stroke={isActive ? "#f59e0b" : "#d1d5db"}
                    strokeWidth={isActive ? "2" : "1"}
                  />
                  <text
                    x={outputX + c * tc + cs / 2}
                    y={tc + r * tc + cs / 2 + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight={isActive ? "700" : "400"}
                    fill={isActive ? "#92400e" : "#d1d5db"}
                  >
                    {isActive ? resultVal : "?"}
                  </text>
                </g>
              );
            })
          )}
        </svg>
      </div>
      <p className="text-xs text-gray-400 text-center mt-2">
        The 3x3 filter slides across every position. At each stop, it multiplies overlapping values and sums them into one output number.
      </p>
    </div>
  );
}

/* ── Full Network Diagram with Nodes ── */
function NetworkDiagram() {
  // Layer definitions with node counts (visual, not actual)
  const layers = [
    { label: "Input", subLabel: "28x28x1", nodes: 6, color: "#86efac", stroke: "#16a34a", type: "input" },
    { label: "Conv2D", subLabel: "26x26x8", nodes: 8, color: "#93c5fd", stroke: "#2563eb", type: "conv" },
    { label: "MaxPool", subLabel: "13x13x8", nodes: 6, color: "#93c5fd", stroke: "#2563eb", type: "pool" },
    { label: "Conv2D", subLabel: "11x11x8", nodes: 8, color: "#93c5fd", stroke: "#2563eb", type: "conv" },
    { label: "MaxPool", subLabel: "5x5x8", nodes: 5, color: "#93c5fd", stroke: "#2563eb", type: "pool" },
    { label: "Dense", subLabel: "128", nodes: 7, color: "#c4b5fd", stroke: "#7c3aed", type: "dense" },
    { label: "Dense", subLabel: "64", nodes: 5, color: "#c4b5fd", stroke: "#7c3aed", type: "dense" },
    { label: "Output", subLabel: "10", nodes: 4, color: "#fdba74", stroke: "#ea580c", type: "output" },
  ];

  const nodeR = 9;
  const nodeGap = 26;
  const layerGap = 78;
  const startX = 50;
  const maxNodes = Math.max(...layers.map((l) => l.nodes));
  const totalH = maxNodes * nodeGap + 60;

  // Pre-calculate node positions
  const layerPositions = layers.map((layer, li) => {
    const x = startX + li * layerGap;
    const totalLayerH = (layer.nodes - 1) * nodeGap;
    const offsetY = (totalH - 60 - totalLayerH) / 2 + 20;
    const nodes = Array.from({ length: layer.nodes }, (_, ni) => ({
      x,
      y: offsetY + ni * nodeGap,
    }));
    return { ...layer, x, nodes };
  });

  const totalW = startX + (layers.length - 1) * layerGap + 50;

  return (
    <div className="my-6">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Network architecture: data flows left to right through layers
      </h4>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalW} ${totalH + 30}`}
          width="100%"
          style={{ maxWidth: 680 }}
          className="mx-auto"
        >
          {/* Connection lines between adjacent layers */}
          {layerPositions.map((layer, li) => {
            if (li === 0) return null;
            const prev = layerPositions[li - 1];
            // Draw subset of connections to avoid visual overload
            return prev.nodes.map((pn, pi) => {
              // Connect each prev node to 2-3 next nodes
              const step = Math.max(1, Math.floor(layer.nodes / 3));
              return layer.nodes
                .filter((_, ni) => ni % step === 0 || ni === layer.nodes.length - 1)
                .map((nn, ni) => (
                  <line
                    key={`c-${li}-${pi}-${ni}`}
                    x1={pn.x + nodeR}
                    y1={pn.y}
                    x2={nn.x - nodeR}
                    y2={nn.y}
                    stroke="#e5e7eb"
                    strokeWidth="0.7"
                    opacity="0.6"
                  />
                ));
            });
          })}

          {/* Draw more visible connections (every prev to every next, but thin) */}
          {layerPositions.map((layer, li) => {
            if (li === 0) return null;
            const prev = layerPositions[li - 1];
            return prev.nodes.flatMap((pn, pi) =>
              layer.nodes.map((nn, ni) => (
                <line
                  key={`cc-${li}-${pi}-${ni}`}
                  x1={pn.x + nodeR}
                  y1={pn.y}
                  x2={nn.x - nodeR}
                  y2={nn.y}
                  stroke="#d1d5db"
                  strokeWidth="0.5"
                  opacity="0.35"
                />
              ))
            );
          })}

          {/* Nodes */}
          {layerPositions.map((layer, li) =>
            layer.nodes.map((n, ni) => (
              <circle
                key={`n-${li}-${ni}`}
                cx={n.x}
                cy={n.y}
                r={nodeR}
                fill={layer.color}
                stroke={layer.stroke}
                strokeWidth="1.5"
              />
            ))
          )}

          {/* Ellipsis for layers with many nodes */}
          {layerPositions.map((layer, li) => {
            if (layer.nodes >= 6) {
              const lastNode = layer.nodes[layer.nodes.length - 1];
              return (
                <text
                  key={`dots-${li}`}
                  x={layer.x}
                  y={lastNode.y + 20}
                  textAnchor="middle"
                  fontSize="14"
                  fill={layer.stroke}
                  fontWeight="bold"
                >
                  ...
                </text>
              );
            }
            return null;
          })}

          {/* Layer labels at bottom */}
          {layerPositions.map((layer, li) => (
            <g key={`lbl-${li}`}>
              <text
                x={layer.x}
                y={totalH + 2}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="#374151"
                fontFamily="inherit"
              >
                {layer.label}
              </text>
              <text
                x={layer.x}
                y={totalH + 15}
                textAnchor="middle"
                fontSize="8"
                fill="#9ca3af"
                fontFamily="monospace"
              >
                {layer.subLabel}
              </text>
            </g>
          ))}

          {/* Legend */}
          {[
            { color: "#86efac", label: "Input" },
            { color: "#93c5fd", label: "Conv / Pool" },
            { color: "#c4b5fd", label: "Dense" },
            { color: "#fdba74", label: "Output" },
          ].map((item, i) => (
            <g key={`leg-${i}`} transform={`translate(${totalW - 90}, ${8 + i * 16})`}>
              <circle cx="5" cy="0" r="5" fill={item.color} />
              <text x="14" y="3.5" fontSize="8" fill="#6b7280" fontFamily="inherit">
                {item.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ── Max Pooling Diagram ── */
function MaxPoolDiagram() {
  const input = [
    [0.2, 0.9, 0.1, 0.4],
    [0.6, 0.3, 0.8, 0.2],
    [0.1, 0.7, 0.5, 0.9],
    [0.4, 0.2, 0.3, 0.6],
  ];
  const output = [
    [0.9, 0.8],
    [0.7, 0.9],
  ];
  const colors = [
    ["#fef3c7", "#fef3c7", "#dbeafe", "#dbeafe"],
    ["#fef3c7", "#fef3c7", "#dbeafe", "#dbeafe"],
    ["#dcfce7", "#dcfce7", "#fce7f3", "#fce7f3"],
    ["#dcfce7", "#dcfce7", "#fce7f3", "#fce7f3"],
  ];
  const outColors = ["#fef3c7", "#dbeafe", "#dcfce7", "#fce7f3"];
  const cs = 42;
  const g = 2;
  const tc = cs + g;

  return (
    <div className="my-6">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Max Pooling: keep the strongest signal in each 2x2 region
      </h4>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${4 * tc + 80 + 2 * tc + 20} ${4 * tc + 30}`}
          width="100%"
          style={{ maxWidth: 420 }}
          className="mx-auto"
        >
          <defs>
            <marker id="arrowPool" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6 Z" fill="#9ca3af" />
            </marker>
          </defs>

          {/* Input 4x4 */}
          <text x={2 * tc} y={4 * tc + 22} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="inherit">
            4x4 input
          </text>
          {input.map((row, r) =>
            row.map((v, c) => {
              const isMax =
                (r === 0 && c === 1) || (r === 1 && c === 2) || (r === 2 && c === 1) || (r === 3 && c === 3);
              return (
                <g key={`mp-${r}-${c}`}>
                  <rect
                    x={c * tc}
                    y={r * tc}
                    width={cs}
                    height={cs}
                    rx="2"
                    fill={colors[r][c]}
                    stroke="#d1d5db"
                    strokeWidth="1"
                  />
                  <text
                    x={c * tc + cs / 2}
                    y={r * tc + cs / 2 + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight={isMax ? "700" : "400"}
                    fill={isMax ? "#1e40af" : "#6b7280"}
                  >
                    {v.toFixed(1)}
                  </text>
                </g>
              );
            })
          )}

          {/* Arrow */}
          <line
            x1={4 * tc + 10}
            y1={2 * tc}
            x2={4 * tc + 50}
            y2={2 * tc}
            stroke="#9ca3af"
            strokeWidth="1.5"
            markerEnd="url(#arrowPool)"
          />
          <text
            x={4 * tc + 30}
            y={2 * tc - 10}
            textAnchor="middle"
            fontSize="9"
            fill="#9ca3af"
            fontFamily="inherit"
          >
            max()
          </text>

          {/* Output 2x2 */}
          {(() => {
            const ox = 4 * tc + 60;
            const oy = tc;
            return (
              <>
                <text x={ox + tc} y={oy + 2 * tc + 22} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="inherit">
                  2x2 output
                </text>
                {output.map((row, r) =>
                  row.map((v, c) => (
                    <g key={`mo-${r}-${c}`}>
                      <rect
                        x={ox + c * tc}
                        y={oy + r * tc}
                        width={cs}
                        height={cs}
                        rx="2"
                        fill={outColors[r * 2 + c]}
                        stroke="#2563eb"
                        strokeWidth="1.5"
                      />
                      <text
                        x={ox + c * tc + cs / 2}
                        y={oy + r * tc + cs / 2 + 4}
                        textAnchor="middle"
                        fontSize="11"
                        fontFamily="monospace"
                        fontWeight="700"
                        fill="#1e40af"
                      >
                        {v.toFixed(1)}
                      </text>
                    </g>
                  ))
                )}
              </>
            );
          })()}
        </svg>
      </div>
      <p className="text-xs text-gray-400 text-center mt-2">
        Each colored 2x2 region is reduced to its maximum value, cutting the spatial dimensions in half.
      </p>
    </div>
  );
}

const steps = [
  {
    number: 1,
    title: "Data Loading & Preprocessing",
    description:
      "The MNIST dataset contains 70,000 images of handwritten digits (0-9), each 28x28 pixels in grayscale. We load the dataset from a compressed pickle file, split it into training (50,000), validation (10,000), and test (10,000) sets, then reshape each flat 784-element vector into a 28x28x1 image tensor for the convolutional layers.",
    output: "60,000 training images + 10,000 test images, normalized to [0, 1]",
    detail:
      "Pixel values are already floats between 0 and 1, so no additional normalization is needed. The single channel (grayscale) is explicit in the 28x28x1 shape.",
    diagram: "pixel-grid",
  },
  {
    number: 2,
    title: "Model Architecture",
    description:
      "We define a Convolutional Neural Network (CNN) with two convolutional layers to extract spatial features, followed by dense layers for classification. The architecture is intentionally simple for educational clarity -- just 35,298 parameters. Each layer transforms the data into a more abstract representation until the final 10-neuron output layer produces a probability for each digit.",
    output: "A CNN model with 35,298 trainable parameters",
    layers: [
      { name: "Input", shape: "28x28x1", purpose: "Raw grayscale image" },
      { name: "Conv2D (8 filters, 3x3)", shape: "26x26x8", purpose: "Detect low-level features like edges and curves" },
      { name: "MaxPooling2D (2x2)", shape: "13x13x8", purpose: "Downsample, keeping strongest activations" },
      { name: "Conv2D (8 filters, 3x3)", shape: "11x11x8", purpose: "Detect higher-level patterns (loops, corners)" },
      { name: "MaxPooling2D (2x2)", shape: "5x5x8", purpose: "Further spatial reduction" },
      { name: "Flatten", shape: "200", purpose: "Convert 2D feature maps to 1D vector" },
      { name: "Dense (128 units, ReLU)", shape: "128", purpose: "Learn non-linear combinations of features" },
      { name: "Dropout (0.25)", shape: "128", purpose: "Prevent overfitting during training" },
      { name: "Dense (64 units, ReLU)", shape: "64", purpose: "Further feature compression" },
      { name: "Dropout (0.25)", shape: "64", purpose: "Prevent overfitting during training" },
      { name: "Dense (10 units, Softmax)", shape: "10", purpose: "Output probability for each digit 0-9" },
    ],
    diagram: "network",
  },
  {
    number: 3,
    title: "Convolution: Feature Detection",
    description:
      "The core operation of a CNN. A small 3x3 filter (kernel) slides across the input image, computing a weighted sum at each position. Each filter learns to detect a specific pattern -- one might respond to vertical edges, another to horizontal edges, another to curves. Our model uses 8 filters per conv layer, producing 8 feature maps that each highlight different aspects of the digit.",
    output: "8 feature maps per conv layer, each highlighting different patterns",
    detail:
      "The filter weights are learned during training. The network discovers which features are useful for classification, not a human designer.",
    diagram: "convolution",
  },
  {
    number: 4,
    title: "Pooling: Spatial Reduction",
    description:
      "After each convolution, a 2x2 max pooling operation reduces the spatial dimensions by half. It takes the maximum value in each 2x2 window, keeping the strongest signal while discarding exact position information. This makes the network more robust -- it cares that an edge exists in a region, not its exact pixel location.",
    output: "Feature maps reduced from 26x26 to 13x13, then from 11x11 to 5x5",
    diagram: "maxpool",
  },
  {
    number: 5,
    title: "Training",
    description:
      "The model is trained using the Adam optimizer with categorical cross-entropy loss. During training, the network adjusts its 35,298 parameters to minimize classification error. We train for multiple epochs, monitoring validation accuracy to ensure the model generalizes well to unseen data.",
    output: "Trained model saved as mnist_cnn.keras (462.5 KB)",
    detail:
      "Adam combines the benefits of momentum (smoothing gradients over time) and RMSProp (adaptive learning rates per parameter). Categorical cross-entropy measures how far the predicted probability distribution is from the true one-hot label.",
  },
  {
    number: 6,
    title: "Evaluation",
    description:
      "After training, we evaluate the model on the held-out test set of 10,000 images that the model has never seen during training. This gives an unbiased estimate of real-world performance.",
    output: "98.7% accuracy on 10,000 test images",
    detail:
      "A confusion matrix and per-digit classification report are generated to identify which digits the model confuses most often (e.g., 4 vs 9, 3 vs 5).",
  },
  {
    number: 7,
    title: "Inference & Activation Extraction",
    description:
      "When a user selects a digit, the backend runs a single forward pass through the model. Using the Keras Functional API, we capture the intermediate outputs at each layer -- not just the final prediction. This lets us see the activation maps: what each convolutional filter responds to.",
    output:
      "Predicted digit, 10 confidence scores, and 16 activation maps (8 per conv layer)",
    detail:
      "Activation maps are 2D arrays showing how strongly each filter responds to different spatial regions. High values (bright in viridis colormap) indicate the filter detected its learned feature at that location.",
  },
  {
    number: 8,
    title: "Visualization",
    description:
      "The frontend renders the full CNN story: the input image, the network architecture, the prediction with confidence scores for all 10 digits, and the activation heatmaps from each convolutional layer. Activations are colored using the viridis colormap (purple = low, yellow = high) for visual clarity.",
    output: "Interactive visualization at localhost:3000",
    detail:
      "Each grayscale activation map is colormapped to viridis using a 256-entry RGB lookup table applied via the Canvas API. This makes it easy to see which parts of the image each filter focuses on.",
  },
];

const concepts = [
  {
    term: "Convolution",
    explanation:
      "A small filter (3x3 in our case) slides across the image, computing a weighted sum at each position. Different filters learn to detect different features -- one might detect horizontal edges, another vertical edges, another curves.",
  },
  {
    term: "Max Pooling",
    explanation:
      'Takes the maximum value in each 2x2 window, reducing the spatial dimensions by half. This makes the representation more compact and somewhat translation-invariant -- the network cares that a feature exists "somewhere in this region," not its exact pixel location.',
  },
  {
    term: "ReLU Activation",
    explanation:
      "Replaces negative values with zero: f(x) = max(0, x). This simple non-linearity lets the network learn complex patterns. Without it, stacking layers would just be matrix multiplication -- equivalent to a single linear layer.",
  },
  {
    term: "Softmax",
    explanation:
      "Converts the 10 raw output values into probabilities that sum to 1. A high softmax value for digit 7 (e.g., 0.987) means the network is 98.7% confident the image is a 7.",
  },
  {
    term: "Dropout",
    explanation:
      "During training, randomly sets 25% of neuron outputs to zero. This forces the network to learn redundant representations and prevents overfitting -- relying too heavily on any single neuron.",
  },
];

function DiagramSlot({ type }) {
  if (type === "pixel-grid") return <PixelGridDiagram />;
  if (type === "network") return <NetworkDiagram />;
  if (type === "convolution") return <ConvolutionDiagram />;
  if (type === "maxpool") return <MaxPoolDiagram />;
  return null;
}

export default function AlgorithmPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-accent-600 hover:text-accent-700 hover:underline"
        >
          &larr; Back to Visualizer
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">How the CNN Algorithm Works</h1>
      <p className="text-gray-500 mb-8">
        A step-by-step walkthrough of the convolutional neural network used in
        this project, from raw pixel data to digit classification.
      </p>

      {/* Pipeline overview */}
      <section className="bg-accent-50 rounded-xl border border-accent-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-3">Pipeline Overview</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {[
            "Data",
            "Architecture",
            "Convolution",
            "Pooling",
            "Training",
            "Evaluation",
            "Inference",
            "Visualization",
          ].map((stage, i) => (
            <span key={stage} className="flex items-center gap-2">
              <span className="bg-white border border-accent-200 rounded-lg px-3 py-1.5">
                {stage}
              </span>
              {i < 7 && <span className="text-accent-500">&rarr;</span>}
            </span>
          ))}
        </div>
      </section>

      {/* Steps */}
      <div className="flex flex-col gap-6 mb-10">
        {steps.map((step) => (
          <section
            key={step.number}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-accent-600 text-white flex items-center justify-center text-sm font-bold">
                {step.number}
              </span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-3 leading-relaxed">
                  {step.description}
                </p>

                {/* Inline diagram */}
                {step.diagram && <DiagramSlot type={step.diagram} />}

                {/* Layer table for architecture step */}
                {step.layers && (
                  <div className="overflow-x-auto mb-3">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left border-b border-gray-200">
                          <th className="py-2 pr-4 font-medium text-gray-500">
                            Layer
                          </th>
                          <th className="py-2 pr-4 font-medium text-gray-500">
                            Output Shape
                          </th>
                          <th className="py-2 font-medium text-gray-500">
                            Purpose
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {step.layers.map((layer, i) => (
                          <tr
                            key={i}
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="py-2 pr-4 font-mono text-xs">
                              {layer.name}
                            </td>
                            <td className="py-2 pr-4 font-mono text-xs text-gray-500">
                              {layer.shape}
                            </td>
                            <td className="py-2 text-gray-600 text-sm">
                              {layer.purpose}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Output badge */}
                <div className="bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-100">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Output:
                  </span>{" "}
                  <span className="text-sm text-gray-700">{step.output}</span>
                </div>

                {/* Extra detail */}
                {step.detail && (
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Key concepts */}
      <h2 className="text-2xl font-bold mb-4">Key Concepts</h2>
      <div className="flex flex-col gap-4 mb-10">
        {concepts.map((c) => (
          <div
            key={c.term}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
          >
            <h3 className="font-semibold text-accent-700 mb-1">{c.term}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {c.explanation}
            </p>
          </div>
        ))}
      </div>

      {/* Back link */}
      <div className="text-center pt-4 border-t border-gray-100">
        <Link
          href="/"
          className="text-accent-600 hover:text-accent-700 hover:underline font-medium"
        >
          &larr; Back to Visualizer
        </Link>
      </div>
    </main>
  );
}
