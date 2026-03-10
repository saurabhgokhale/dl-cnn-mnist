import Link from "next/link";

export default function Header() {
  return (
    <header className="text-center mb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="w-48" />
        <h1 className="text-3xl font-bold">MNIST CNN Visualizer</h1>
        <div className="flex items-center gap-4 w-48 justify-end">
          <Link
            href="/draw"
            className="text-sm font-medium text-accent-600 hover:text-accent-700 hover:underline"
          >
            Draw
          </Link>
          <Link
            href="/dataflow"
            className="text-sm font-medium text-accent-600 hover:text-accent-700 hover:underline"
          >
            Data Flow
          </Link>
          <Link
            href="/algorithm"
            className="text-sm font-medium text-accent-600 hover:text-accent-700 hover:underline"
          >
            Algorithm
          </Link>
        </div>
      </div>
      <p className="text-gray-500 mt-1">
        See what a CNN sees when classifying handwritten digits
      </p>
    </header>
  );
}
