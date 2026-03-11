# MNIST CNN Visualizer

An interactive educational tool that lets you see inside a Convolutional Neural Network as it classifies handwritten digits. Built for introducing deep learning concepts to middle and high school students.

**Live demo:** Runs entirely in the browser using TensorFlow.js — no backend required.

## Features

- **Interactive digit classification** — Pick any digit (0-9) or load a random MNIST sample and watch the CNN predict it in real time
- **Draw your own digit** — Freehand drawing canvas with MNIST-style preprocessing and instant classification
- **Animated data flow** — Step-by-step visualization of data transforming as it passes through each CNN layer
- **Layer-by-layer activations** — See the feature maps (conv/pool layers) and neuron activations (dense layers) with viridis colormapping
- **Confidence chart** — Bar chart showing prediction probabilities for all 10 digits
- **Architecture diagram** — Visual overview of the CNN structure with layer descriptions
- **Trained weights inspection** — View the actual learned filter kernels, weight matrices, and biases with a backpropagation explainer
- **Algorithm walkthrough** — Step-by-step explanation of the CNN algorithm with annotated code

## CNN Architecture

```
Input (28x28x1)
  -> Conv2D (8 filters, 3x3, ReLU)    -> 26x26x8
  -> MaxPool2D (2x2)                   -> 13x13x8
  -> Conv2D (8 filters, 3x3, ReLU)    -> 11x11x8
  -> MaxPool2D (2x2)                   -> 5x5x8
  -> Flatten                           -> 200
  -> Dense (128, ReLU) + Dropout(0.25)
  -> Dense (64, ReLU) + Dropout(0.25)
  -> Dense (10, Softmax)               -> prediction
```

Total parameters: 35,298

## Project Structure

```
mnist/
├── notebooks/
│   └── mnist_DL_CNN.ipynb       # Training notebook (Jupyter)
├── model/
│   └── mnist_cnn.keras          # Trained Keras model
├── backend/
│   ├── main.py                  # FastAPI server (optional)
│   └── inference.py             # Python inference + activation extraction
├── frontend/
│   ├── app/
│   │   ├── page.js              # Main visualizer page
│   │   ├── draw/page.js         # Draw your own digit
│   │   ├── dataflow/page.js     # Animated data flow
│   │   ├── algorithm/page.js    # Algorithm walkthrough
│   │   ├── components/          # UI components
│   │   └── lib/
│   │       ├── inference.js     # Browser-side TFJS inference
│   │       └── viridis.js       # Viridis colormap LUT
│   └── public/tfmodel/
│       ├── model.json           # TensorFlow.js model topology
│       ├── weights.bin          # Model weights (137 KB)
│       └── samples.json         # 100 MNIST test samples (10 per digit)
└── requirements.txt
```

## Quick Start

### Frontend only (recommended)

No Python or backend needed. The model runs entirely in the browser via TensorFlow.js.

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### With backend (optional)

The backend enables the trained weights visualization section. All other features work without it.

```bash
# Terminal 1 — backend
pip install -r requirements.txt
pip install fastapi uvicorn
uvicorn backend.main:app --reload

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

## Deploy to Vercel

The frontend deploys as a static Next.js app with no server-side requirements.

1. Push the repo to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Deploy

Or via CLI:

```bash
cd frontend
npx vercel
```

## Training the Model

Open `notebooks/mnist_DL_CNN.ipynb` in Jupyter. The notebook includes:

1. Environment setup (conda + ipykernel)
2. Data loading and preprocessing (MNIST, 60K train / 10K test)
3. Model architecture definition
4. Training with early stopping (~99% test accuracy)
5. Evaluation and confusion matrix
6. Layer-by-layer activation visualization
7. Weight and filter visualization

## Tech Stack

- **ML**: TensorFlow / Keras (training), TensorFlow.js (browser inference)
- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, Recharts
- **Backend**: FastAPI, Python 3.9+ (optional)
- **Font**: Montserrat (bundled)

## License

This project was built as a DCS Selectives educational project.
