"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  ResponsiveContainer,
} from "recharts";

export default function ConfidenceChart({ confidence, prediction }) {
  if (!confidence) {
    return (
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Confidence</h2>
        <p className="text-gray-400">
          Select a digit to see confidence scores
        </p>
      </section>
    );
  }

  const data = confidence.map((c) => ({
    digit: c.digit.toString(),
    probability: c.probability * 100,
  }));

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Confidence</h2>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
          >
            <XAxis
              dataKey="digit"
              tick={{ fontSize: 13, fill: "#6b7280" }}
            />
            <YAxis domain={[0, 100]} hide />
            <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    parseInt(entry.digit) === prediction
                      ? "#2563eb"
                      : "#e5e7eb"
                  }
                />
              ))}
              <LabelList
                dataKey="probability"
                position="top"
                formatter={(v) => v.toFixed(1) + "%"}
                style={{ fontSize: 11, fill: "#6b7280" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
