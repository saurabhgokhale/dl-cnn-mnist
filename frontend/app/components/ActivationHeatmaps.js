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

function formatLayerLabel(layerName, shape) {
  // Convert "conv2d_1" -> "Conv Layer 1", "conv2d_2" -> "Conv Layer 2"
  const match = layerName.match(/(\d+)$/);
  const layerNum = match ? match[1] : "?";
  const [h, w, filters] = shape;
  return `Conv Layer ${layerNum} \u2014 ${h}x${w}, ${filters} filters`;
}

export default function ActivationHeatmaps({ activations }) {
  if (!activations || activations.length === 0) return null;

  return (
    <div className="space-y-6">
      {activations.map((layer, idx) => (
        <section
          key={idx}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold mb-4">
            {formatLayerLabel(layer.layer_name, layer.shape)}
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {layer.maps.map((mapBase64, mapIdx) => (
              <ViridisCanvas key={mapIdx} base64={mapBase64} size={64} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
